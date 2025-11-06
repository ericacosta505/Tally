from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app)

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "budget.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Budget Entry Model
class BudgetEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'date': self.date,
            'type': self.type,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Create tables
with app.app_context():
    db.create_all()

# API Routes
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'message': 'Budget Tracker API is running!',
        'status': 'ok',
        'endpoints': {
            'health': '/api/health',
            'entries': '/api/entries',
            'summary': '/api/summary'
        },
        'note': 'This is a REST API. Use the React frontend at http://localhost:3000 to interact with the application.'
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Backend is running'}), 200

@app.route('/api/entries', methods=['GET'])
def get_entries():
    entries = BudgetEntry.query.order_by(BudgetEntry.date.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])

@app.route('/api/entries', methods=['POST'])
def create_entry():
    data = request.json
    entry = BudgetEntry(
        description=data.get('description'),
        amount=data.get('amount'),
        category=data.get('category'),
        date=data.get('date'),
        type=data.get('type')
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201

@app.route('/api/entries/<int:entry_id>', methods=['PUT'])
def update_entry(entry_id):
    entry = BudgetEntry.query.get_or_404(entry_id)
    data = request.json
    entry.description = data.get('description', entry.description)
    entry.amount = data.get('amount', entry.amount)
    entry.category = data.get('category', entry.category)
    entry.date = data.get('date', entry.date)
    entry.type = data.get('type', entry.type)
    db.session.commit()
    return jsonify(entry.to_dict())

@app.route('/api/entries/<int:entry_id>', methods=['DELETE'])
def delete_entry(entry_id):
    entry = BudgetEntry.query.get_or_404(entry_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted successfully'}), 200

@app.route('/api/summary', methods=['GET'])
def get_summary():
    entries = BudgetEntry.query.all()
    total_income = sum(entry.amount for entry in entries if entry.type == 'income')
    total_expenses = sum(entry.amount for entry in entries if entry.type == 'expense')
    balance = total_income - total_expenses
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': balance
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)

