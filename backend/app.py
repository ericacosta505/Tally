"""Tally's account-backed ledger. The browser-only demo never calls these routes."""
from datetime import date, datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from functools import wraps
import os
import re
import secrets

from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from werkzeug.exceptions import BadRequest, HTTPException, NotFound
from werkzeug.security import check_password_hash, generate_password_hash
import jwt

app = Flask(__name__, static_folder=None)
basedir = os.path.abspath(os.path.dirname(__file__))
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(basedir), 'frontend', 'build')
secret = os.environ.get('SECRET_KEY')
if not secret:
    if os.environ.get('TALLY_DEV') == '1':
        secret = secrets.token_hex(32)
        app.logger.warning('Development session key generated. Sessions expire when the server restarts.')
    else:
        raise RuntimeError('Set SECRET_KEY to a strong random secret, or TALLY_DEV=1 for local development.')
app.config['SECRET_KEY'] = secret
app.config['MAX_CONTENT_LENGTH'] = 64 * 1024

database_url = os.environ.get('DATABASE_URL', f'sqlite:///{os.path.join(basedir, "budget.db")}')
if database_url.startswith('postgres://'):
    database_url = database_url.replace('postgres://', 'postgresql+psycopg://', 1)
elif database_url.startswith('postgresql://'):
    database_url = database_url.replace('postgresql://', 'postgresql+psycopg://', 1)
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get('ALLOWED_ORIGINS', 'http://localhost:3000,http://127.0.0.1:3000').split(',') if origin.strip()]
CORS(app, origins=ALLOWED_ORIGINS, methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], allow_headers=['Content-Type', 'Authorization'], supports_credentials=False)
db = SQLAlchemy(app)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return dict(id=self.id, email=self.email, first_name=self.first_name, last_name=self.last_name,
                    phone_number=self.phone_number, date_of_birth=self.date_of_birth.isoformat(),
                    created_at=self.created_at.isoformat())


class BudgetSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    needs_percentage = db.Column(db.Float, default=50.0, nullable=False)
    wants_percentage = db.Column(db.Float, default=30.0, nullable=False)
    savings_percentage = db.Column(db.Float, default=20.0, nullable=False)
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return dict(id=self.id, needs_percentage=self.needs_percentage, wants_percentage=self.wants_percentage,
                    savings_percentage=self.savings_percentage, updated_at=self.updated_at.isoformat())


class BudgetEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
    description = db.Column(db.String(200), nullable=False)
    # Preserve the existing schema. All writes validate decimal precision and all totals use Decimal.
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(10), nullable=False)
    expense_category = db.Column(db.String(20), nullable=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    __table_args__ = (db.Index('ix_entry_user_date', 'user_id', 'date'),)

    def to_dict(self):
        return dict(id=self.id, description=self.description, amount=as_money(self.amount), category=self.category,
                    date=self.date, type=self.type, expense_category=self.expense_category,
                    created_at=self.created_at.isoformat())


with app.app_context():
    db.create_all()


def as_money(value):
    return float(Decimal(str(value)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP))


def json_object():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise BadRequest('Send a JSON object.')
    return data


def text_field(data, name, limit):
    value = data.get(name)
    if not isinstance(value, str) or not value.strip() or len(value.strip()) > limit:
        raise BadRequest(f'{name.replace("_", " ").capitalize()} must be between 1 and {limit} characters.')
    return value.strip()


def decimal_field(value, label, minimum, maximum, precision=2):
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise BadRequest(f'{label} must be a number.')
    try:
        number = Decimal(str(value))
        if not number.is_finite() or not Decimal(str(minimum)) <= number <= Decimal(str(maximum)):
            raise BadRequest(f'{label} must be between {minimum} and {maximum}.')
        if number != number.quantize(Decimal(10) ** -precision):
            raise BadRequest(f'{label} can have at most {precision} decimal places.')
    except InvalidOperation:
        raise BadRequest(f'{label} is invalid.')
    return number


def iso_date(value, label='Date'):
    if not isinstance(value, str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}', value):
        raise BadRequest(f'{label} must use YYYY-MM-DD.')
    try:
        parsed = date.fromisoformat(value)
        if parsed.year < 1900:
            raise ValueError()
        return parsed
    except ValueError:
        raise BadRequest(f'{label} must be a valid date from 1900 onward.')


def validated_entry(data, existing=None):
    merged = {**(existing.to_dict() if existing else {}), **data}
    entry_type = merged.get('type')
    if entry_type not in ('income', 'expense'):
        raise BadRequest('Type must be income or expense.')
    allocation = merged.get('expense_category') if entry_type == 'expense' else None
    if entry_type == 'expense' and allocation not in ('need', 'want', 'saving'):
        raise BadRequest('Choose an allocation: need, want, or saving.')
    return dict(description=text_field(merged, 'description', 200),
                amount=float(decimal_field(merged.get('amount'), 'Amount', 0.01, 999999999.99)),
                category=text_field(merged, 'category', 100), date=iso_date(merged.get('date')).isoformat(),
                type=entry_type, expense_category=allocation)


def scoped_entries(user):
    query = BudgetEntry.query.filter_by(user_id=user.id)
    month, year = request.args.get('month'), request.args.get('year')
    if month is not None or year is not None:
        try:
            month, year = int(month), int(year)
            if not 1 <= month <= 12 or not 1900 <= year <= 9999:
                raise ValueError()
        except (ValueError, TypeError):
            raise BadRequest('Provide a valid month (1–12) and year (1900–9999) together.')
        prefix = f'{year:04d}-{month:02d}-'
        query = query.filter(BudgetEntry.date >= prefix + '01', BudgetEntry.date <= prefix + '31')
    return query


def generate_token(user_id):
    now = datetime.now(timezone.utc)
    return jwt.encode({'user_id': user_id, 'iat': now, 'exp': now + timedelta(hours=24)}, app.config['SECRET_KEY'], algorithm='HS256')


def require_auth(function):
    @wraps(function)
    def wrapped(*args, **kwargs):
        header = request.headers.get('Authorization', '').split()
        if len(header) != 2 or header[0].lower() != 'bearer':
            return jsonify(error='A valid Bearer token is required.', code='NO_TOKEN'), 401
        try:
            payload = jwt.decode(header[1], app.config['SECRET_KEY'], algorithms=['HS256'], options={'require': ['exp', 'user_id']})
            user_id = payload['user_id']
            if isinstance(user_id, bool) or not isinstance(user_id, int) or user_id <= 0:
                raise jwt.InvalidTokenError()
            user = db.session.get(User, user_id)
            if user is None:
                raise jwt.InvalidTokenError()
        except jwt.ExpiredSignatureError:
            return jsonify(error='Your session has expired. Please sign in again.', code='TOKEN_EXPIRED'), 401
        except jwt.InvalidTokenError:
            return jsonify(error='Invalid session. Please sign in again.', code='INVALID_TOKEN'), 401
        return function(user, *args, **kwargs)
    return wrapped


@app.errorhandler(HTTPException)
def http_error(error):
    response = error.get_response()
    response.data = app.json.dumps({'error': error.description})
    response.content_type = 'application/json'
    return response


@app.errorhandler(Exception)
def unexpected_error(error):
    db.session.rollback()
    app.logger.exception('Unexpected request failure')
    return jsonify(error='Something went wrong. Please try again.'), 500


@app.after_request
def security_headers(response):
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['X-Frame-Options'] = 'DENY'
    if request.path.startswith('/api/'):
        response.headers['Cache-Control'] = 'no-store'
    return response


@app.get('/api/health')
def health_check():
    return jsonify(status='ok', message='Tally API is running', version='2.0.0')


@app.post('/api/auth/signup')
def signup():
    data = json_object()
    email = text_field(data, 'email', 120).lower()
    if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+', email):
        raise BadRequest('Enter a valid email address.')
    password = data.get('password')
    if not isinstance(password, str) or not 10 <= len(password) <= 128:
        raise BadRequest('Choose a password between 10 and 128 characters.')
    dob = iso_date(data.get('date_of_birth'), 'Date of birth')
    if dob >= date.today():
        raise BadRequest('Date of birth must be in the past.')
    if User.query.filter(func.lower(User.email) == email).first():
        return jsonify(error='This email is already registered. Try signing in.'), 409
    user = User(email=email, first_name=text_field(data, 'first_name', 100), last_name=text_field(data, 'last_name', 100),
                phone_number=text_field(data, 'phone_number', 20), date_of_birth=dob)
    user.set_password(password)
    try:
        db.session.add(user)
        db.session.flush()
        db.session.add(BudgetSettings(user_id=user.id, needs_percentage=50, wants_percentage=30, savings_percentage=20))
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        return jsonify(error='This email is already registered. Try signing in.'), 409
    return jsonify(message='Your workspace is ready.', token=generate_token(user.id), user=user.to_dict()), 201


@app.post('/api/auth/login')
def login():
    data = json_object()
    email = text_field(data, 'email', 120).lower()
    password = data.get('password')
    if not isinstance(password, str) or not password or len(password) > 128:
        raise BadRequest('Enter your password.')
    user = User.query.filter(func.lower(User.email) == email).first()
    if not user or not user.check_password(password):
        return jsonify(error='That email and password don’t match.'), 401
    return jsonify(message='Welcome back.', token=generate_token(user.id), user=user.to_dict())


@app.get('/api/entries')
@require_auth
def get_entries(user):
    return jsonify([entry.to_dict() for entry in scoped_entries(user).order_by(BudgetEntry.date.desc(), BudgetEntry.id.desc()).all()])


@app.post('/api/entries')
@require_auth
def create_entry(user):
    entry = BudgetEntry(user_id=user.id, **validated_entry(json_object()))
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


def owned_entry(user, entry_id):
    entry = BudgetEntry.query.filter_by(id=entry_id, user_id=user.id).first()
    if entry is None:
        raise NotFound('Transaction not found.')
    return entry


@app.put('/api/entries/<int:entry_id>')
@require_auth
def update_entry(user, entry_id):
    entry = owned_entry(user, entry_id)
    for key, value in validated_entry(json_object(), entry).items():
        setattr(entry, key, value)
    db.session.commit()
    return jsonify(entry.to_dict())


@app.delete('/api/entries/<int:entry_id>')
@require_auth
def delete_entry(user, entry_id):
    db.session.delete(owned_entry(user, entry_id))
    db.session.commit()
    return jsonify(message='Transaction deleted.')


@app.get('/api/summary')
@require_auth
def get_summary(user):
    entries = scoped_entries(user).all()
    def total(predicate):
        return sum((Decimal(str(entry.amount)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP) for entry in entries if predicate(entry)), Decimal(0))
    income = total(lambda e: e.type == 'income')
    expense = total(lambda e: e.type == 'expense')
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
    allocations = [('need', 'needs', 50), ('want', 'wants', 30), ('saving', 'savings', 20)]
    result = dict(total_income=as_money(income), total_expenses=as_money(expense), balance=as_money(income - expense),
                  uncategorized_expenses=as_money(total(lambda e: e.type == 'expense' and not e.expense_category)))
    for key, name, default in allocations:
        result[f'{name}_expenses'] = as_money(total(lambda e: e.type == 'expense' and e.expense_category == key))
        percentage = getattr(settings, f'{name}_percentage') if settings else default
        result[f'{name}_target'] = as_money(income * Decimal(str(percentage)) / 100)
    return jsonify(result)


@app.get('/api/settings')
@require_auth
def get_settings(user):
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
    if settings is None:
        settings = BudgetSettings(user_id=user.id, needs_percentage=50, wants_percentage=30, savings_percentage=20)
        db.session.add(settings)
        db.session.commit()
    return jsonify(settings.to_dict())


@app.put('/api/settings')
@require_auth
def update_settings(user):
    data = json_object()
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
    keys = {'needs_percentage': 50, 'wants_percentage': 30, 'savings_percentage': 20}
    values = {key: decimal_field(data.get(key, getattr(settings, key) if settings else default), key.replace('_', ' ').capitalize(), 0, 100) for key, default in keys.items()}
    if sum(values.values()) != Decimal(100):
        raise BadRequest('Allocations must add up to 100%.')
    if settings is None:
        settings = BudgetSettings(user_id=user.id)
        db.session.add(settings)
    for key, value in values.items():
        setattr(settings, key, float(value))
    settings.updated_at = datetime.now(timezone.utc)
    db.session.commit()
    return jsonify(settings.to_dict())


@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    if path == 'api' or path.startswith('api/'):
        raise NotFound('API endpoint not found.')
    if path and os.path.isfile(os.path.join(FRONTEND_BUILD_DIR, path)):
        return send_from_directory(FRONTEND_BUILD_DIR, path)
    if os.path.isfile(os.path.join(FRONTEND_BUILD_DIR, 'index.html')):
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    return jsonify(message='Tally API is running. Start the frontend with npm start.', status='ok')


if __name__ == '__main__':
    app.run(host='127.0.0.1', port=int(os.environ.get('PORT', 5000)), debug=False)
