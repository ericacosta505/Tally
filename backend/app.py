from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from dateutil import parser
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
import os

app = Flask(__name__, static_folder=None)

# CORS configuration - support both development and production
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


basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{os.path.join(basedir, "budget.db")}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')

# Frontend build directory path
FRONTEND_BUILD_DIR = os.path.join(os.path.dirname(basedir), 'frontend', 'build')

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    phone_number = db.Column(db.String(20), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone_number': self.phone_number,
            'date_of_birth': self.date_of_birth.isoformat() if self.date_of_birth else None,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

# Budget Settings Model
class BudgetSettings(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
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
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, index=True)
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

# Create tables
with app.app_context():
    db.create_all()

# Authentication helper functions
# Token expires after 24 hours for security
TOKEN_EXPIRATION_HOURS = 24

def generate_token(user_id):
    payload = {
        'user_id': user_id,
        'exp': datetime.utcnow() + timedelta(hours=TOKEN_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Verify JWT token and return user_id if valid, None if invalid, or 'EXPIRED' if expired."""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return 'EXPIRED'
    except jwt.InvalidTokenError:
        return None

def get_current_user():
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None
    
    try:
        token = auth_header.split(' ')[1]  # Format: "Bearer <token>"
        user_id = verify_token(token)
        if user_id:
            return User.query.get(user_id)
    except (IndexError, AttributeError):
        pass
    return None

def require_auth(f):
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authentication required', 'code': 'NO_TOKEN'}), 401
        
        try:
            token = auth_header.split(' ')[1]  # Format: "Bearer <token>"
            user_id = verify_token(token)
            
            if user_id == 'EXPIRED':
                return jsonify({'error': 'Token expired. Please login again', 'code': 'TOKEN_EXPIRED'}), 401
            elif not user_id:
                return jsonify({'error': 'Invalid token', 'code': 'INVALID_TOKEN'}), 401
            
            user = User.query.get(user_id)
            if not user:
                return jsonify({'error': 'User not found', 'code': 'USER_NOT_FOUND'}), 401
            return f(user, *args, **kwargs)
        except (IndexError, AttributeError):
            return jsonify({'error': 'Invalid authorization header format', 'code': 'INVALID_HEADER'}), 401
    decorated_function.__name__ = f.__name__
    return decorated_function

# API Routes
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': 'Backend is running'}), 200

# Authentication routes
@app.route('/api/auth/signup', methods=['POST'])
def signup():
    data = request.json
    
    # Validate required fields
    required_fields = ['email', 'phone_number', 'date_of_birth', 'first_name', 'last_name', 'password']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'error': 'Email already registered'}), 400
    
    # Create new user
    try:
        dob = parser.parse(data['date_of_birth']).date()
        user = User(
            email=data['email'],
            phone_number=data['phone_number'],
            date_of_birth=dob,
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        
        # Create default budget settings for the user
        default_settings = BudgetSettings(
            user_id=user.id,
            needs_percentage=50.0,
            wants_percentage=30.0,
            savings_percentage=20.0
        )
        db.session.add(default_settings)
        db.session.commit()
        
        # Generate token
        token = generate_token(user.id)
        
        return jsonify({
            'message': 'User created successfully',
            'token': token,
            'user': user.to_dict()
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 400

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not user.check_password(data['password']):
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = generate_token(user.id)
    
    return jsonify({
        'message': 'Login successful',
        'token': token,
        'user': user.to_dict()
    }), 200

@app.route('/api/entries', methods=['GET'])
@require_auth
def get_entries(user):
    month = request.args.get('month')
    year = request.args.get('year')
    
    query = BudgetEntry.query.filter_by(user_id=user.id)
    
    # Filter by month and year if provided
    if month and year:
        try:
            month_int = int(month)
            year_int = int(year)
            # Filter entries where date matches the month and year
            # Date is stored as string, so we need to parse it
            entries = query.order_by(BudgetEntry.date.desc()).all()
            filtered_entries = []
            for entry in entries:
                try:
                    entry_date = parser.parse(entry.date)
                    if entry_date.month == month_int and entry_date.year == year_int:
                        filtered_entries.append(entry)
                except (ValueError, TypeError):
                    # If date parsing fails, skip this entry
                    continue
            return jsonify([entry.to_dict() for entry in filtered_entries])
        except ValueError:
            # Invalid month/year, return all entries
            pass
    
    entries = query.order_by(BudgetEntry.date.desc()).all()
    return jsonify([entry.to_dict() for entry in entries])

@app.route('/api/entries', methods=['POST'])
@require_auth
def create_entry(user):
    data = request.json
    entry = BudgetEntry(
        user_id=user.id,
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
@require_auth
def update_entry(user, entry_id):
    entry = BudgetEntry.query.filter_by(id=entry_id, user_id=user.id).first_or_404()
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
@require_auth
def delete_entry(user, entry_id):
    entry = BudgetEntry.query.filter_by(id=entry_id, user_id=user.id).first_or_404()
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Entry deleted successfully'}), 200

@app.route('/api/summary', methods=['GET'])
@require_auth
def get_summary(user):
    month = request.args.get('month')
    year = request.args.get('year')
    
    query = BudgetEntry.query.filter_by(user_id=user.id)
    entries = query.all()
    
    # Filter by month and year if provided
    if month and year:
        try:
            month_int = int(month)
            year_int = int(year)
            filtered_entries = []
            for entry in entries:
                try:
                    entry_date = parser.parse(entry.date)
                    if entry_date.month == month_int and entry_date.year == year_int:
                        filtered_entries.append(entry)
                except (ValueError, TypeError):
                    # If date parsing fails, skip this entry
                    continue
            entries = filtered_entries
        except ValueError:
            # Invalid month/year, use all entries
            pass
    
    total_income = sum(entry.amount for entry in entries if entry.type == 'income')
    total_expenses = sum(entry.amount for entry in entries if entry.type == 'expense')
    balance = total_income - total_expenses
    
    # Calculate needs/wants/savings breakdown
    needs_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'need')
    wants_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'want')
    savings_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and entry.expense_category == 'saving')
    uncategorized_expenses = sum(entry.amount for entry in entries if entry.type == 'expense' and not entry.expense_category)
    
    # Get budget settings for this user
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
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
@require_auth
def get_settings(user):
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
    if settings:
        return jsonify(settings.to_dict())
    else:
        # Create default settings if none exist
        default_settings = BudgetSettings(
            user_id=user.id,
            needs_percentage=50.0,
            wants_percentage=30.0,
            savings_percentage=20.0
        )
        db.session.add(default_settings)
        db.session.commit()
        return jsonify(default_settings.to_dict())

@app.route('/api/settings', methods=['PUT'])
@require_auth
def update_settings(user):
    data = request.json
    settings = BudgetSettings.query.filter_by(user_id=user.id).first()
    
    if not settings:
        settings = BudgetSettings(user_id=user.id)
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

# Serve static files from React build (catch-all route - must be last)
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_frontend(path):
    # Serve static files if they exist (JS, CSS, images, etc.)
    if path and os.path.exists(os.path.join(FRONTEND_BUILD_DIR, path)):
        return send_from_directory(FRONTEND_BUILD_DIR, path)
    
    # For all other routes, serve index.html (React Router will handle routing)
    if os.path.exists(os.path.join(FRONTEND_BUILD_DIR, 'index.html')):
        return send_from_directory(FRONTEND_BUILD_DIR, 'index.html')
    
    # Fallback if build directory doesn't exist (development mode)
    return jsonify({
        'message': 'Budget Tracker API is running!',
        'status': 'ok',
        'endpoints': {
            'health': '/api/health',
            'entries': '/api/entries',
            'summary': '/api/summary'
        },
        'note': 'Frontend build not found. Please build the frontend first: cd frontend && npm run build'
    }), 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)
