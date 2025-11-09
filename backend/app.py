from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Enable CORS for all routes. Allow the local React dev server by default.
CORS(
    app,
    origins=ALLOWED_ORIGINS,
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
    supports_credentials=False,
)


@app.after_request
def add_cors_headers(response):
    """Ensure browsers always receive explicit CORS headers."""
    origin = request.headers.get("Origin")
    if origin and origin in ALLOWED_ORIGINS:
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization,X-Requested-With"
    return response

# Database configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "budget.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# Budget Settings Model
class BudgetSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    needs_percentage = db.Column(db.Float, default=50.0, nullable=False)
    wants_percentage = db.Column(db.Float, default=30.0, nullable=False)
    savings_percentage = db.Column(db.Float, default=20.0, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'needs_percentage': self.needs_percentage,
            'wants_percentage': self.wants_percentage,
            'savings_percentage': self.savings_percentage,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

# Budget Entry Model
class BudgetEntry(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    description = db.Column(db.String(200), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    category = db.Column(db.String(100), nullable=False)
    date = db.Column(db.String(20), nullable=False)
    type = db.Column(db.String(10), nullable=False)  # 'income' or 'expense'
    expense_category = db.Column(db.String(20), nullable=True)  # 'need', 'want', or 'saving' (only for expenses)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'description': self.description,
            'amount': self.amount,
            'category': self.category,
            'date': self.date,
            'type': self.type,
            'expense_category': self.expense_category,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Create tables and initialize default settings
with app.app_context():
    db.create_all()
    # Initialize default budget settings if they don't exist
    if BudgetSettings.query.first() is None:
        default_settings = BudgetSettings(
            needs_percentage=50.0,
            wants_percentage=30.0,
            savings_percentage=20.0
        )
        db.session.add(default_settings)
        db.session.commit()

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
        type=data.get('type'),
        expense_category=data.get('expense_category') if data.get('type') == 'expense' else None
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
    if data.get('type') == 'expense':
        entry.expense_category = data.get('expense_category', entry.expense_category)
    else:
        entry.expense_category = None
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
    
    # Calculate needs/wants/savings breakdown
    needs_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'need')
    wants_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'want')
    savings_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'saving')
    uncategorized_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and not entry.expense_category)
    
    # Get budget settings
    settings = BudgetSettings.query.first()
    if settings:
        needs_target = total_income * (settings.needs_percentage / 100)
        wants_target = total_income * (settings.wants_percentage / 100)
        savings_target = total_income * (settings.savings_percentage / 100)
    else:
        needs_target = wants_target = savings_target = 0
    
    return jsonify({
        'total_income': total_income,
        'total_expenses': total_expenses,
        'balance': balance,
        'needs_expenses': needs_expenses,
        'wants_expenses': wants_expenses,
        'savings_expenses': savings_expenses,
        'uncategorized_expenses': uncategorized_expenses,
        'needs_target': needs_target,
        'wants_target': wants_target,
        'savings_target': savings_target
    })

@app.route('/api/settings', methods=['GET'])
def get_settings():
    settings = BudgetSettings.query.first()
    if settings:
        return jsonify(settings.to_dict())
    else:
        # Create default settings if none exist
        default_settings = BudgetSettings(
            needs_percentage=50.0,
            wants_percentage=30.0,
            savings_percentage=20.0
        )
        db.session.add(default_settings)
        db.session.commit()
        return jsonify(default_settings.to_dict())

@app.route('/api/settings', methods=['PUT'])
def update_settings():
    data = request.json
    settings = BudgetSettings.query.first()
    
    if not settings:
        settings = BudgetSettings()
        db.session.add(settings)
    
    needs = data.get('needs_percentage', settings.needs_percentage)
    wants = data.get('wants_percentage', settings.wants_percentage)
    savings = data.get('savings_percentage', settings.savings_percentage)
    
    # Validate that percentages sum to 100
    total = needs + wants + savings
    if abs(total - 100.0) > 0.01:  # Allow small floating point differences
        return jsonify({'error': 'Percentages must sum to 100'}), 400
    
    settings.needs_percentage = needs
    settings.wants_percentage = wants
    settings.savings_percentage = savings
    settings.updated_at = datetime.utcnow()
    
    db.session.commit()
    return jsonify(settings.to_dict())

if __name__ == '__main__':
    app.run(debug=True, port=5000)
