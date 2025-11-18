# 💰 Budget Tracker

A full-stack personal budget tracking application that helps you manage your finances using the 50/30/20 budgeting rule (Needs/Wants/Savings). Track your income and expenses, visualize your spending patterns, and stay on top of your financial goals.

## 🌐 Live Application

**Try it now:** [https://budget-3a0l.onrender.com](https://budget-3a0l.onrender.com)

The application is live and ready to use! Create an account to start tracking your budget.

## ✨ Features

### User Authentication
- Secure user registration and login
- JWT-based authentication with token expiration
- Protected routes and API endpoints
- Session management

### Budget Management
- **Income & Expense Tracking**: Add, edit, and delete financial entries
- **Categorization**: Organize expenses into custom categories
- **50/30/20 Rule**: Automatically categorize expenses as Needs, Wants, or Savings
- **Customizable Budget Settings**: Adjust the percentage allocation for Needs/Wants/Savings
- **Monthly View**: Navigate between months to view historical data
- **Real-time Summary**: View total income, expenses, and balance at a glance

### Visualizations
- Interactive charts showing spending breakdown
- Progress bars for Needs/Wants/Savings categories
- Visual comparison of actual spending vs. budget targets

### User Experience
- Responsive design
- Month navigation with quick access to current month
- Form validation and error handling
- Loading states and error messages
- Automatic data refresh

## 🛠 Tech Stack

### Backend
- **Flask 3.0.0** - Python web framework
- **Flask-SQLAlchemy 3.1.1** - ORM for database operations
- **Flask-CORS 4.0.0** - Cross-origin resource sharing
- **PyJWT 2.8.0** - JSON Web Token implementation
- **Werkzeug 3.1.3** - Password hashing and security utilities
- **python-dateutil 2.9.0** - Date parsing and manipulation
- **SQLite** (development) / **PostgreSQL** (production)
- **Gunicorn** - Production WSGI server

### Frontend
- **React 18.2.0** - UI library
- **React Router DOM 7.9.5** - Client-side routing
- **Axios 1.6.2** - HTTP client for API requests
- **Chart.js 4.4.0** - Data visualization
- **React-Chartjs-2 5.2.0** - React wrapper for Chart.js

## 📁 Project Structure

```
Budget/
├── backend/
│   ├── app.py                 # Flask application and API routes
│   ├── budget.db              # SQLite database (development)
│   ├── requirements.txt       # Python dependencies
│   └── venv/                  # Python virtual environment
│
├── frontend/
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── src/
│   │   ├── App.js             # Main React component and routing
│   │   ├── index.js           # React entry point
│   │   ├── components/        # React components
│   │   │   ├── BudgetDashboard.js
│   │   │   ├── BudgetForm.js
│   │   │   ├── BudgetList.js
│   │   │   ├── BudgetSummary.js
│   │   │   ├── BudgetCharts.js
│   │   │   ├── BudgetSettings.js
│   │   │   ├── Login.js
│   │   │   ├── Signup.js
│   │   │   └── ProtectedRoute.js
│   │   ├── contexts/
│   │   │   └── AuthContext.js # Authentication context
│   │   └── services/
│   │       └── api.js         # API service functions
│   ├── package.json           # Node.js dependencies
│   └── package-lock.json
│
└── README.md                  # This file
```

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Python 3.8+** (Python 3.14 recommended)
- **Node.js 14+** and **npm** (or **yarn**)
- **PostgreSQL** (optional, for production deployment)

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Budget
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create a virtual environment (if not already created)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
# venv\Scripts\activate

# Install Python dependencies
pip install -r requirements.txt
```

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install Node.js dependencies
npm install
```

## 🏃 Running the Application

### Using the Live Application

The easiest way to use the Budget Tracker is through the live deployment:

**👉 [Access the live application](https://budget-3a0l.onrender.com)**

Simply visit the link above, create an account, and start tracking your budget!

### Development Mode

If you want to run the application locally for development or customization, follow the instructions below.

The application runs in development mode with separate servers for frontend and backend.

#### Start the Backend Server

```bash
# From the backend directory
cd backend
source venv/bin/activate  # Activate virtual environment
python app.py
```

The backend server will start on `http://localhost:5000`

#### Start the Frontend Development Server

```bash
# From the frontend directory (in a new terminal)
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

### Production Mode

For production, build the frontend and serve it through Flask:

```bash
# Build the React app
cd frontend
npm run build

# Start the Flask server (from backend directory)
cd ../backend
source venv/bin/activate
python app.py
```

The application will be available at `http://localhost:5000`

## 📡 API Documentation

### Base URL
- **Live Application**: `https://budget-3a0l.onrender.com/api`
- Development: `http://localhost:5000/api`
- Production: `/api` (relative path)

### Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

### Endpoints

#### Health Check
```
GET /api/health
```
Returns the API status.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

#### Authentication

##### Sign Up
```
POST /api/auth/signup
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword",
  "phone_number": "+1234567890",
  "date_of_birth": "1990-01-01",
  "first_name": "John",
  "last_name": "Doe"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt_token_here",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    ...
  }
}
```

##### Login
```
POST /api/auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "user": { ... }
}
```

#### Budget Entries

##### Get All Entries
```
GET /api/entries?month=1&year=2024
```
Returns all budget entries for the authenticated user. Optional query parameters for filtering by month and year.

**Response:**
```json
[
  {
    "id": 1,
    "description": "Grocery Shopping",
    "amount": 150.00,
    "category": "Food",
    "date": "2024-01-15",
    "type": "expense",
    "expense_category": "need",
    "created_at": "2024-01-15T10:30:00"
  }
]
```

##### Create Entry
```
POST /api/entries
```

**Request Body:**
```json
{
  "description": "Salary",
  "amount": 5000.00,
  "category": "Employment",
  "date": "2024-01-01",
  "type": "income"
}
```

For expenses, include `expense_category`:
```json
{
  "description": "Rent",
  "amount": 1200.00,
  "category": "Housing",
  "date": "2024-01-01",
  "type": "expense",
  "expense_category": "need"
}
```

##### Update Entry
```
PUT /api/entries/<entry_id>
```

**Request Body:** Same as create entry.

##### Delete Entry
```
DELETE /api/entries/<entry_id>
```

#### Budget Summary
```
GET /api/summary?month=1&year=2024
```
Returns financial summary for the authenticated user. Optional query parameters for filtering by month and year.

**Response:**
```json
{
  "total_income": 5000.00,
  "total_expenses": 3500.00,
  "balance": 1500.00,
  "needs_expenses": 2500.00,
  "wants_expenses": 800.00,
  "savings_expenses": 200.00,
  "uncategorized_expenses": 0.00,
  "needs_target": 2500.00,
  "wants_target": 1500.00,
  "savings_target": 1000.00
}
```

#### Budget Settings

##### Get Settings
```
GET /api/settings
```
Returns the user's budget allocation percentages.

**Response:**
```json
{
  "id": 1,
  "needs_percentage": 50.0,
  "wants_percentage": 30.0,
  "savings_percentage": 20.0,
  "updated_at": "2024-01-15T10:30:00"
}
```

##### Update Settings
```
PUT /api/settings
```

**Request Body:**
```json
{
  "needs_percentage": 50.0,
  "wants_percentage": 30.0,
  "savings_percentage": 20.0
}
```

**Note:** Percentages must sum to exactly 100.

## 🔐 Environment Variables

### Backend

Create a `.env` file in the `backend` directory (optional for development):

```env
# Database (optional - defaults to SQLite)
DATABASE_URL=postgresql://user:password@localhost:5432/budget_db

# Secret key for JWT tokens (required in production)
SECRET_KEY=your-secret-key-here

# Port (optional - defaults to 5000)
PORT=5000
```

### Frontend

Create a `.env` file in the `frontend` directory (optional):

```env
# API URL (optional - auto-detected in development)
REACT_APP_API_URL=http://localhost:5000/api
```

## 🗄 Database

### Development
The application uses SQLite by default for development. The database file (`budget.db`) is automatically created in the `backend` directory when you first run the application.

### Production
For production, set the `DATABASE_URL` environment variable to use PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@host:port/database
```

### Database Models

- **User**: Stores user account information
- **BudgetEntry**: Stores income and expense entries
- **BudgetSettings**: Stores user's budget allocation percentages

The database tables are automatically created when the Flask application starts.

## 🚢 Deployment

### Backend Deployment (e.g., Render, Heroku)

1. Set environment variables:
   - `DATABASE_URL` (PostgreSQL connection string)
   - `SECRET_KEY` (strong random secret key)
   - `PORT` (usually set automatically by hosting platform)

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run migrations (if needed):
   ```bash
   python app.py  # Tables are auto-created
   ```

4. Start with Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:$PORT app:app
   ```

### Frontend Deployment

1. Build the React app:
   ```bash
   cd frontend
   npm run build
   ```

2. The `build` folder can be:
   - Served by the Flask backend (already configured)
   - Deployed to static hosting (Netlify, Vercel, etc.)
   - If deploying separately, set `REACT_APP_API_URL` to your backend URL

### Full-Stack Deployment

The Flask backend is configured to serve the React build files. After building the frontend:

1. Ensure `frontend/build` directory exists
2. Deploy the backend with the frontend build included
3. The Flask app will serve both API and frontend routes

## 🧪 Testing

### Backend Testing
```bash
cd backend
source venv/bin/activate
# Add your test commands here
```

### Frontend Testing
```bash
cd frontend
npm test
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🐛 Troubleshooting

### Backend Issues

**Database connection errors:**
- Ensure SQLite file permissions are correct
- For PostgreSQL, verify `DATABASE_URL` is correctly formatted

**CORS errors:**
- Check that `ALLOWED_ORIGINS` in `app.py` includes your frontend URL
- Verify CORS headers are being sent

**Token expiration:**
- Tokens expire after 24 hours
- Users will be automatically redirected to login

### Frontend Issues

**API connection errors:**
- Ensure backend server is running on port 5000
- Check `REACT_APP_API_URL` environment variable
- Verify CORS is properly configured

**Build errors:**
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Ensure Node.js version is compatible (14+)

## 📧 Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

---

**Happy Budgeting! 💰**

