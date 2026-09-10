"""Account isolation and ledger invariants. Always uses a temporary database."""
import os
import tempfile
import unittest
from unittest.mock import patch
from datetime import datetime, timedelta, timezone
import jwt

_test_db = tempfile.TemporaryDirectory()
os.environ['DATABASE_URL'] = 'sqlite:///' + os.path.join(_test_db.name, 'test.db')
os.environ['SECRET_KEY'] = 'test-only-secret-with-no-production-value-0123456789'
from app import app, db, BudgetEntry, BudgetSettings, User


class LedgerTests(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        self.client = app.test_client()
        with app.app_context():
            db.drop_all()
            db.create_all()
        self.alice = self.register('alice@example.com')
        self.bob = self.register('bob@example.com')
        self.headers = {'Authorization': 'Bearer ' + self.alice['token']}
        self.bob_headers = {'Authorization': 'Bearer ' + self.bob['token']}

    def register(self, email):
        response = self.client.post('/api/auth/signup', json=dict(email=email, password='a-long-password', first_name='Test', last_name='Person', phone_number='3125550123', date_of_birth='1995-03-18'))
        self.assertEqual(response.status_code, 201, response.json)
        return response.json

    def entry(self, **overrides):
        return dict(description='Groceries', amount=24.50, category='Groceries', date='2026-08-10', type='expense', expense_category='need', **{}) | overrides

    def create(self, **overrides):
        response = self.client.post('/api/entries', json=self.entry(**overrides), headers=self.headers)
        self.assertEqual(response.status_code, 201, response.json)
        return response.json

    def test_account_isolation_for_reads_and_writes(self):
        entry = self.create(user_id=self.bob['user']['id'])
        self.assertEqual(self.client.get('/api/entries', headers=self.bob_headers).json, [])
        self.assertEqual(self.client.get('/api/summary', headers=self.bob_headers).json['total_expenses'], 0)
        for method in ['put', 'delete']:
            response = getattr(self.client, method)(f'/api/entries/{entry["id"]}', json={'amount': 100}, headers=self.bob_headers)
            self.assertEqual(response.status_code, 404)
            self.assertEqual(response.json['error'], 'Transaction not found.')
        self.assertEqual(len(self.client.get('/api/entries', headers=self.headers).json), 1)

    def test_invalid_payloads_cannot_create_entries(self):
        invalid = [None, [], {}, self.entry(amount=-1), self.entry(amount=0), self.entry(amount=float('nan')), self.entry(amount=float('inf')), self.entry(amount=True), self.entry(amount='10'), self.entry(amount=.001), self.entry(type='transfer'), self.entry(expense_category='unknown'), self.entry(date='2026-02-30'), self.entry(date='August 10'), self.entry(description=' '), self.entry(category=[])]
        for payload in invalid:
            with self.subTest(payload=payload):
                response = self.client.post('/api/entries', json=payload, headers=self.headers)
                self.assertEqual(response.status_code, 400, response.json)
        self.assertEqual(self.client.get('/api/entries', headers=self.headers).json, [])

    def test_partial_update_preserves_allocation(self):
        entry = self.create()
        response = self.client.put(f'/api/entries/{entry["id"]}', json={'description': 'Trader Joe’s'}, headers=self.headers)
        self.assertEqual(response.json['expense_category'], 'need')
        response = self.client.put(f'/api/entries/{entry["id"]}', json={'type': 'income'}, headers=self.headers)
        self.assertIsNone(response.json['expense_category'])

    def test_invalid_update_does_not_change_persisted_entry(self):
        entry = self.create()
        response = self.client.put(f'/api/entries/{entry["id"]}', json={'amount': -10, 'description': 'Changed'}, headers=self.headers)
        self.assertEqual(response.status_code, 400)
        saved = self.client.get('/api/entries', headers=self.headers).json[0]
        self.assertEqual(saved['description'], 'Groceries')
        self.assertEqual(saved['amount'], 24.5)

    def test_cent_arithmetic_and_savings(self):
        self.create(type='income', amount=1, expense_category=None)
        self.create(amount=.1)
        self.create(amount=.2)
        self.create(amount=.1, expense_category='saving')
        summary = self.client.get('/api/summary', headers=self.headers).json
        self.assertEqual(summary['total_expenses'], .4)
        self.assertEqual(summary['balance'], .6)
        self.assertEqual(summary['needs_expenses'], .3)
        self.assertEqual(summary['savings_expenses'], .1)
        self.assertEqual(summary['savings_target'], .2)

    def test_month_filter_and_leap_day(self):
        self.create(date='2024-02-29')
        self.create(date='2024-03-01')
        response = self.client.get('/api/entries?month=2&year=2024', headers=self.headers)
        self.assertEqual([entry['date'] for entry in response.json], ['2024-02-29'])
        summary = self.client.get('/api/summary?month=2&year=2024', headers=self.headers).json
        self.assertEqual(summary['total_expenses'], 24.5)
        for query in ['month=13&year=2024', 'month=x&year=2024', 'month=2', 'year=2024', 'month=2&year=10000']:
            for route in ['entries', 'summary']:
                self.assertEqual(self.client.get(f'/api/{route}?{query}', headers=self.headers).status_code, 400)

    def test_invalid_settings_are_atomic(self):
        for payload in [{'needs_percentage': -50, 'wants_percentage': 130, 'savings_percentage': 20}, {'needs_percentage': float('nan')}, {'needs_percentage': None}, {'needs_percentage': '50'}, {'needs_percentage': 20}]:
            response = self.client.put('/api/settings', json=payload, headers=self.headers)
            self.assertEqual(response.status_code, 400)
        saved = self.client.get('/api/settings', headers=self.headers).json
        self.assertEqual(saved['needs_percentage'], 50)
        response = self.client.put('/api/settings', json={'needs_percentage': 60, 'wants_percentage': 20, 'savings_percentage': 20}, headers=self.headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.client.get('/api/settings', headers=self.bob_headers).json['needs_percentage'], 50)

    def test_invalid_and_expired_tokens(self):
        payloads = [{'user_id': self.alice['user']['id'], 'exp': datetime.now(timezone.utc) - timedelta(seconds=5)}, {'user_id': True, 'exp': datetime.now(timezone.utc) + timedelta(hours=1)}, {'user_id': self.alice['user']['id']}]
        tokens = [jwt.encode(p, app.config['SECRET_KEY'], algorithm='HS256') for p in payloads]
        headers = [{}, {'Authorization': 'Basic ' + self.alice['token']}, {'Authorization': 'Bearer bad-token'}] + [{'Authorization': 'Bearer ' + token} for token in tokens]
        for header in headers:
            response = self.client.get('/api/entries', headers=header)
            self.assertEqual(response.status_code, 401)
            self.assertIn('error', response.json)

    def test_email_normalization_and_login(self):
        response = self.client.post('/api/auth/login', json={'email': '  ALICE@EXAMPLE.COM ', 'password': 'a-long-password'})
        self.assertEqual(response.status_code, 200)
        response = self.client.post('/api/auth/signup', json=dict(email=' ALICE@EXAMPLE.COM ', password='a-long-password', first_name='Another', last_name='Person', phone_number='1', date_of_birth='1995-01-01'))
        self.assertEqual(response.status_code, 409)
        with app.app_context():
            self.assertEqual(User.query.count(), 2)
            self.assertEqual(BudgetSettings.query.count(), 2)

    def test_json_errors_and_missing_endpoints(self):
        response = self.client.get('/api/no-such-route')
        self.assertEqual(response.status_code, 404)
        self.assertIn('error', response.json)
        response = self.client.delete('/api/entries/99999', headers=self.headers)
        self.assertEqual(response.status_code, 404)
        response = self.client.post('/api/auth/login', json=[])
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.headers['Cache-Control'], 'no-store')

    def test_cors_preflight_and_method_headers(self):
        response = self.client.options('/api/entries', headers={'Origin': 'http://localhost:3000', 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'Authorization,Content-Type'})
        self.assertEqual(response.headers['Access-Control-Allow-Origin'], 'http://localhost:3000')
        blocked = self.client.options('/api/entries', headers={'Origin': 'https://untrusted.example', 'Access-Control-Request-Method': 'POST'})
        self.assertNotIn('Access-Control-Allow-Origin', blocked.headers)
        self.assertIn('GET', self.client.post('/api/health').headers['Allow'])

    def test_database_failure_rolls_back_without_leaking_details(self):
        with patch.object(db.session, 'commit', side_effect=RuntimeError('private-database-details')):
            with self.assertLogs(app.logger, level='ERROR'):
                response = self.client.post('/api/entries', json=self.entry(), headers=self.headers)
        self.assertEqual(response.status_code, 500)
        self.assertNotIn('private-database-details', response.get_data(as_text=True))
        self.assertEqual(self.client.get('/api/entries', headers=self.headers).json, [])
        self.create()
        self.assertEqual(len(self.client.get('/api/entries', headers=self.headers).json), 1)

    def test_delete_updates_summary(self):
        entry = self.create()
        self.assertEqual(self.client.delete(f'/api/entries/{entry["id"]}', headers=self.headers).status_code, 200)
        self.assertEqual(self.client.get('/api/summary', headers=self.headers).json['total_expenses'], 0)


if __name__ == '__main__':
    unittest.main()
