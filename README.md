# 💰 Budget Tracker Application

A comprehensive, full-stack budget tracking application that helps users manage their finances using the 50/30/20 budgeting rule (Needs/Wants/Savings). Built with React for the frontend and Flask for the backend, this application provides an intuitive interface for tracking income, expenses, and monitoring budget adherence through visual analytics.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Usage Guide](#usage-guide)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Security](#authentication--security)
- [Development](#development)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

The Budget Tracker is a personal finance management application that enables users to:

- **Track Income and Expenses**: Record all financial transactions with detailed categorization
- **Monitor Budget Adherence**: Set and track spending against customizable budget allocations (Needs/Wants/Savings)
- **Visualize Spending**: View interactive charts and graphs showing spending patterns and budget consumption
- **Monthly Analysis**: Navigate between months to review historical financial data
- **User Authentication**: Secure user accounts with JWT-based authentication

The application follows the popular 50/30/20 budgeting rule by default, where:
- **50%** of income goes to **Needs** (essential expenses like rent, groceries, utilities)
- **30%** of income goes to **Wants** (non-essential expenses like entertainment, dining out)
- **20%** of income goes to **Savings** (emergency fund, investments, retirement)

Users can customize these percentages to match their personal financial goals.

## ✨ Features

### Core Functionality

- ✅ **User Authentication**
  - Secure signup with email validation
  - JWT-based login system
  - Session management with token expiration
  - Protected routes for authenticated users only

- ✅ **Budget Entry Management**
  - Add income and expense entries
  - Edit existing entries
  - Delete entries with confirmation
  - Categorize expenses (Need, Want, or Saving)
  - Custom category labels (e.g., "Food", "Rent", "Salary")
  - Date-based entry tracking

- ✅ **Budget Summary & Analytics**
  - Real-time calculation of total income, expenses, and balance
  - Needs/Wants/Savings breakdown with progress tracking
  - Visual progress bars showing budget consumption
  - Target vs. actual spending comparison
  - Overspending alerts

- ✅ **Data Visualization**
  - Interactive pie charts showing spending breakdown
  - Category-specific consumption charts
  - Visual indicators for overspending
  - Remaining budget visualization

- ✅ **Monthly Navigation**
  - Navigate between months to view historical data
  - Quick jump to current month
  - Month/year filtering for entries and summaries
  - Automatic month detection

- ✅ **Budget Settings**
  - Customizable Needs/Wants/Savings percentages
  - Real-time validation (percentages must sum to 100%)
  - Persistent settings per user
  - Default 50/30/20 allocation

- ✅ **User Experience**
  - Responsive design for desktop and mobile
  - Intuitive user interface
  - Error handling with helpful messages
  - Loading states and feedback
  - Connection error detection and recovery

## 🛠 Technology Stack

### Frontend

- **React 18.2.0** - Modern UI library for building interactive interfaces
- **React Router DOM 7.9.5** - Client-side routing and navigation
- **Axios 1.6.2** - HTTP client for API communication
- **Chart.js 4.4.0** - Charting library for data visualization
- **React Chart.js 2 5.2.0** - React wrapper for Chart.js
- **CSS3** - Styling and responsive design

### Backend

- **Flask 3.0.0** - Lightweight Python web framework
- **Flask-SQLAlchemy 3.1.1** - ORM for database operations
- **Flask-CORS 4.0.0** - Cross-Origin Resource Sharing support
- **SQLite** - Lightweight relational database
- **PyJWT 2.8.0** - JSON Web Token implementation for authentication
- **Werkzeug 3.1.3** - Password hashing utilities
- **Python-dateutil 2.9.0** - Date parsing and manipulation

### Development Tools

- **React Scripts 5.0.1** - Build tooling for React
- **Node.js & npm** - Package management for frontend
- **Python 3** - Backend runtime environment
- **Virtual Environment** - Python dependency isolation

## 🏗 Architecture

The application follows a **client-server architecture** with clear separation of concerns:

```
┌─────────────────┐         HTTP/REST API         ┌─────────────────┐
│                 │◄──────────────────────────────►│                 │
│  React Frontend │         (JSON + JWT)          │  Flask Backend  │
│  (Port 3000)    │                                │  (Port 5000)    │
│                 │                                │                 │
│  - Components   │                                │  - API Routes   │
│  - Context API  │                                │  - Models       │
│  - Services     │                                │  - Auth Logic  │
│  - Charts       │                                │  - Database    │
└─────────────────┘                                └─────────────────┘
                                                           │
                                                           ▼
                                                    ┌──────────────┐
                                                    │  SQLite DB   │
                                                    │  (budget.db) │
                                                    └──────────────┘
```

### Frontend Architecture

- **Component-Based**: Modular React components for reusability
- **Context API**: Global state management for authentication
- **Service Layer**: Centralized API communication
- **Protected Routes**: Route guards for authenticated access

### Backend Architecture

- **RESTful API**: Standard HTTP methods (GET, POST, PUT, DELETE)
- **Model-View-Controller**: Clear separation of data models, routes, and business logic
- **Authentication Middleware**: Decorator-based route protection
- **Database ORM**: SQLAlchemy for type-safe database operations

## 📁 Project Structure

```
Budget/
├── backend/                          # Flask backend application
│   ├── app.py                       # Main Flask application and API routes
│   ├── requirements.txt             # Python dependencies
│   ├── budget.db                    # SQLite database (auto-generated)
│   └── venv/                        # Python virtual environment
│
├── frontend/                         # React frontend application
│   ├── public/
│   │   └── index.html               # HTML template
│   ├── src/
│   │   ├── components/              # React components
│   │   │   ├── BudgetDashboard.js  # Main dashboard component
│   │   │   ├── BudgetForm.js       # Entry creation/editing form
│   │   │   ├── BudgetList.js       # List of budget entries
│   │   │   ├── BudgetSummary.js    # Summary cards and breakdown
│   │   │   ├── BudgetSettings.js   # Budget percentage settings
│   │   │   ├── BudgetCharts.js     # Data visualization charts
│   │   │   ├── Login.js            # Login page
│   │   │   ├── Signup.js           # Registration page
│   │   │   └── ProtectedRoute.js  # Route protection component
│   │   ├── contexts/
│   │   │   └── AuthContext.js      # Authentication context provider
│   │   ├── services/
│   │   │   └── api.js              # API service functions
│   │   ├── App.js                  # Main app component with routing
│   │   ├── App.css                 # Global styles
│   │   ├── index.js                # React entry point
│   │   └── index.css               # Base styles
│   ├── package.json                 # Node.js dependencies
│   └── package-lock.json            # Dependency lock file
│
└── README.md                        # This file
```

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) and **npm** - [Download Node.js](https://nodejs.org/)
- **Python 3.8+** - [Download Python](https://www.python.org/downloads/)
- **Git** (optional, for cloning) - [Download Git](https://git-scm.com/)

### Verify Installation

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check Python version
python3 --version
```

## 🚀 Installation & Setup

### Step 1: Clone or Download the Repository

If using Git:
```bash
git clone <repository-url>
cd Budget
```

Or download and extract the ZIP file to your desired location.

### Step 2: Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```

2. **Create a virtual environment:**
   ```bash
   # On macOS/Linux:
   python3 -m venv venv
   
   # On Windows:
   python -m venv venv
   ```

3. **Activate the virtual environment:**
   ```bash
   # On macOS/Linux:
   source venv/bin/activate
   
   # On Windows:
   venv\Scripts\activate
   ```

   You should see `(venv)` in your terminal prompt when activated.

4. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables (optional):**
   ```bash
   # For production, set a secure secret key
   export SECRET_KEY='your-secret-key-here'
   ```

   On Windows:
   ```cmd
   set SECRET_KEY=your-secret-key-here
   ```

   If not set, the app will use a default development key (not recommended for production).

6. **Run the Flask server:**
   ```bash
   python app.py
   ```

   The backend will start on `http://localhost:5000`

   You should see output like:
   ```
   * Running on http://127.0.0.1:5000
   * Debug mode: on
   ```

### Step 3: Frontend Setup

1. **Open a new terminal window** (keep the backend running) and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

   This may take a few minutes as it downloads all required packages.

3. **Start the React development server:**
   ```bash
   npm start
   ```

   The frontend will start on `http://localhost:3000` and should automatically open in your browser.

### Step 4: Verify Installation

1. **Backend Health Check:**
   - Open `http://localhost:5000/api/health` in your browser
   - You should see: `{"status": "ok", "message": "Backend is running"}`

2. **Frontend:**
   - The React app should open automatically at `http://localhost:3000`
   - You should see the login/signup page

3. **Database:**
   - The SQLite database (`budget.db`) will be created automatically on first run
   - Tables are created automatically when the Flask app starts

## 📖 Usage Guide

### Creating an Account

1. Navigate to the signup page (or click "Sign Up" if available)
2. Fill in the registration form:
   - **Email**: Your email address (must be unique)
   - **Phone Number**: Your phone number
   - **Date of Birth**: Your date of birth
   - **First Name**: Your first name
   - **Last Name**: Your last name
   - **Password**: Choose a secure password
3. Click "Sign Up"
4. You'll be automatically logged in and redirected to the dashboard

### Logging In

1. Enter your email and password
2. Click "Login"
3. You'll be redirected to the budget dashboard

### Adding Budget Entries

1. **Select Entry Type:**
   - Choose "Income" for money received (salary, freelance, etc.)
   - Choose "Expense" for money spent

2. **Fill in Entry Details:**
   - **Description**: Brief description (e.g., "Grocery Shopping", "Monthly Salary")
   - **Amount**: The dollar amount (e.g., 150.00)
   - **Category**: Custom category label (e.g., "Food", "Rent", "Salary")
   - **Date**: The date of the transaction

3. **For Expenses Only:**
   - **Expense Category**: Select one of:
     - **Need**: Essential expenses (rent, groceries, utilities, insurance)
     - **Want**: Non-essential expenses (entertainment, dining out, hobbies)
     - **Saving**: Savings contributions (emergency fund, investments)

4. Click "Add Entry" to save

### Editing Entries

1. Find the entry in the list
2. Click the "Edit" button
3. Modify the fields as needed
4. Click "Update Entry" to save changes
5. Click "Cancel" to discard changes

### Deleting Entries

1. Find the entry in the list
2. Click the "Delete" button
3. Confirm the deletion in the popup dialog

### Navigating Between Months

1. Use the **←** and **→** arrows to move between months
2. Click **"Today"** to jump to the current month
3. The summary and entries will update automatically for the selected month

### Configuring Budget Settings

1. Locate the "Budget Settings" panel on the dashboard
2. Adjust the percentages for:
   - **Needs**: Percentage of income for essential expenses
   - **Wants**: Percentage of income for non-essential expenses
   - **Savings**: Percentage of income for savings
3. Ensure the total equals 100%
4. Click "Save Settings"
5. The summary will update to reflect your new targets

### Understanding the Summary

The summary section displays:

- **Total Income**: Sum of all income entries for the selected month
- **Total Expenses**: Sum of all expense entries for the selected month
- **Balance**: Income minus expenses (positive = surplus, negative = deficit)

For each category (Needs/Wants/Savings):

- **Actual Spending**: How much you've spent in this category
- **Target**: Your budget target based on income and percentage
- **Progress Bar**: Visual indicator of budget consumption
- **Percentage**: How much of your target you've consumed

### Viewing Charts

The application automatically generates charts when you have data:

- **Actual Spending Breakdown**: Pie chart showing distribution across Needs/Wants/Savings
- **Category Consumption Charts**: Individual charts for each category showing:
  - **Consumed**: Amount spent within budget
  - **Remaining**: Budget remaining
  - **Overspent**: Amount exceeding budget (shown in red)

## 📡 API Documentation

The backend provides a RESTful API with the following endpoints:

### Base URL

- Development: `http://localhost:5000/api`
- Production: Configure via `REACT_APP_API_URL` environment variable

### Authentication

Most endpoints require authentication via JWT token. Include the token in the Authorization header:

```
Authorization: Bearer <your-token>
```

Tokens expire after 24 hours. You'll need to log in again after expiration.

### Endpoints

#### Health Check

**GET** `/api/health`

Check if the backend is running.

**Response:**
```json
{
  "status": "ok",
  "message": "Backend is running"
}
```

---

#### Authentication

**POST** `/api/auth/signup`

Create a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "phone_number": "+1234567890",
  "date_of_birth": "1990-01-01",
  "first_name": "John",
  "last_name": "Doe",
  "password": "securepassword123"
}
```

**Response:** `201 Created`
```json
{
  "message": "User created successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "phone_number": "+1234567890",
    "date_of_birth": "1990-01-01",
    "first_name": "John",
    "last_name": "Doe",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

**POST** `/api/auth/login`

Authenticate and receive a JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    ...
  }
}
```

---

#### Budget Entries

**GET** `/api/entries`

Get all budget entries for the authenticated user.

**Query Parameters:**
- `month` (optional): Month number (1-12)
- `year` (optional): Year (e.g., 2024)

**Response:** `200 OK`
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
  },
  ...
]
```

**POST** `/api/entries`

Create a new budget entry.

**Request Body:**
```json
{
  "description": "Grocery Shopping",
  "amount": 150.00,
  "category": "Food",
  "date": "2024-01-15",
  "type": "expense",
  "expense_category": "need"
}
```

**Response:** `201 Created`
```json
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
```

**PUT** `/api/entries/<id>`

Update an existing budget entry.

**Request Body:** (same as POST, all fields optional)
```json
{
  "description": "Updated Description",
  "amount": 200.00
}
```

**Response:** `200 OK`
```json
{
  "id": 1,
  "description": "Updated Description",
  "amount": 200.00,
  ...
}
```

**DELETE** `/api/entries/<id>`

Delete a budget entry.

**Response:** `200 OK`
```json
{
  "message": "Entry deleted successfully"
}
```

---

#### Budget Summary

**GET** `/api/summary`

Get budget summary for the authenticated user.

**Query Parameters:**
- `month` (optional): Month number (1-12)
- `year` (optional): Year (e.g., 2024)

**Response:** `200 OK`
```json
{
  "total_income": 5000.00,
  "total_expenses": 3200.00,
  "balance": 1800.00,
  "needs_expenses": 2000.00,
  "wants_expenses": 900.00,
  "savings_expenses": 300.00,
  "uncategorized_expenses": 0.00,
  "needs_target": 2500.00,
  "wants_target": 1500.00,
  "savings_target": 1000.00
}
```

---

#### Budget Settings

**GET** `/api/settings`

Get budget settings for the authenticated user.

**Response:** `200 OK`
```json
{
  "id": 1,
  "needs_percentage": 50.0,
  "wants_percentage": 30.0,
  "savings_percentage": 20.0,
  "updated_at": "2024-01-01T00:00:00"
}
```

**PUT** `/api/settings`

Update budget settings.

**Request Body:**
```json
{
  "needs_percentage": 50.0,
  "wants_percentage": 30.0,
  "savings_percentage": 20.0
}
```

**Note:** Percentages must sum to exactly 100.0

**Response:** `200 OK`
```json
{
  "id": 1,
  "needs_percentage": 50.0,
  "wants_percentage": 30.0,
  "savings_percentage": 20.0,
  "updated_at": "2024-01-01T00:00:00"
}
```

### Error Responses

All endpoints may return error responses in the following format:

**401 Unauthorized:**
```json
{
  "error": "Authentication required",
  "code": "NO_TOKEN"
}
```

**400 Bad Request:**
```json
{
  "error": "Error message describing what went wrong"
}
```

**404 Not Found:**
```json
{
  "error": "Resource not found"
}
```

## 🗄 Database Schema

The application uses SQLite with the following schema:

### Users Table

Stores user account information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique user identifier |
| `email` | VARCHAR(120) | UNIQUE, NOT NULL, INDEXED | User email address |
| `phone_number` | VARCHAR(20) | NOT NULL | User phone number |
| `date_of_birth` | DATE | NOT NULL | User date of birth |
| `first_name` | VARCHAR(100) | NOT NULL | User first name |
| `last_name` | VARCHAR(100) | NOT NULL | User last name |
| `password_hash` | VARCHAR(255) | NOT NULL | Hashed password |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Account creation timestamp |

### Budget Settings Table

Stores user budget allocation percentages.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique settings identifier |
| `user_id` | INTEGER | FOREIGN KEY → users.id, NOT NULL, INDEXED | Associated user |
| `needs_percentage` | FLOAT | DEFAULT 50.0, NOT NULL | Percentage for needs |
| `wants_percentage` | FLOAT | DEFAULT 30.0, NOT NULL | Percentage for wants |
| `savings_percentage` | FLOAT | DEFAULT 20.0, NOT NULL | Percentage for savings |
| `updated_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP, ON UPDATE | Last update timestamp |

### Budget Entries Table

Stores individual income and expense entries.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Unique entry identifier |
| `user_id` | INTEGER | FOREIGN KEY → users.id, NOT NULL, INDEXED | Associated user |
| `description` | VARCHAR(200) | NOT NULL | Entry description |
| `amount` | FLOAT | NOT NULL | Entry amount |
| `category` | VARCHAR(100) | NOT NULL | Custom category label |
| `date` | VARCHAR(20) | NOT NULL | Entry date (ISO format string) |
| `type` | VARCHAR(10) | NOT NULL | 'income' or 'expense' |
| `expense_category` | VARCHAR(20) | NULLABLE | 'need', 'want', or 'saving' (only for expenses) |
| `created_at` | DATETIME | DEFAULT CURRENT_TIMESTAMP | Entry creation timestamp |

### Relationships

- **User → Budget Settings**: One-to-One (each user has one settings record)
- **User → Budget Entries**: One-to-Many (each user has many entries)

## 🔐 Authentication & Security

### Authentication Flow

1. **Signup/Login**: User provides credentials
2. **Token Generation**: Backend generates JWT token with 24-hour expiration
3. **Token Storage**: Frontend stores token in `localStorage`
4. **Request Authentication**: Frontend includes token in `Authorization` header
5. **Token Validation**: Backend validates token on each protected request
6. **Token Expiration**: Expired tokens trigger automatic logout

### Security Features

- **Password Hashing**: Passwords are hashed using Werkzeug's `generate_password_hash` (PBKDF2)
- **JWT Tokens**: Secure token-based authentication
- **Token Expiration**: Tokens expire after 24 hours
- **CORS Protection**: Configured CORS origins for API access
- **SQL Injection Prevention**: SQLAlchemy ORM prevents SQL injection
- **Input Validation**: Server-side validation for all inputs
- **Route Protection**: Protected routes require valid authentication

### Security Best Practices

⚠️ **For Production Deployment:**

1. **Change Secret Key**: Set a strong `SECRET_KEY` environment variable
2. **Use HTTPS**: Always use HTTPS in production
3. **Database Security**: Use a production-grade database (PostgreSQL, MySQL)
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Input Sanitization**: Add additional input sanitization
6. **CORS Configuration**: Restrict CORS to your production domain
7. **Token Refresh**: Consider implementing token refresh mechanism
8. **Password Policy**: Enforce strong password requirements
9. **Email Verification**: Add email verification for signups
10. **Backup Strategy**: Implement regular database backups

## 💻 Development

### Running in Development Mode

1. **Backend (Flask):**
   ```bash
   cd backend
   source venv/bin/activate  # or venv\Scripts\activate on Windows
   python app.py
   ```
   - Runs with debug mode enabled
   - Auto-reloads on code changes
   - Accessible at `http://localhost:5000`

2. **Frontend (React):**
   ```bash
   cd frontend
   npm start
   ```
   - Runs development server
   - Hot module replacement enabled
   - Accessible at `http://localhost:3000`

### Environment Variables

**Backend:**
- `SECRET_KEY`: JWT signing key (required for production)

**Frontend:**
- `REACT_APP_API_URL`: Override API base URL (defaults to `http://127.0.0.1:5000/api`)

### Code Structure

- **Backend**: Follows Flask best practices with route decorators and model classes
- **Frontend**: Component-based architecture with separation of concerns
- **API Communication**: Centralized in `services/api.js`
- **State Management**: React Context API for authentication state

### Adding New Features

1. **Backend:**
   - Add new models in `app.py`
   - Create new routes with `@require_auth` decorator
   - Update database schema if needed

2. **Frontend:**
   - Create new components in `src/components/`
   - Add API functions in `src/services/api.js`
   - Update routing in `App.js` if needed

### Testing

Currently, the application doesn't include automated tests. Consider adding:

- **Backend**: Unit tests with `pytest` and `pytest-flask`
- **Frontend**: Component tests with `@testing-library/react`
- **Integration**: End-to-end tests with `Cypress` or `Selenium`

## 🚀 Deployment

### Backend Deployment

**Option 1: Using Gunicorn (Recommended for Production)**

1. Install Gunicorn:
   ```bash
   pip install gunicorn
   ```

2. Run with Gunicorn:
   ```bash
   gunicorn -w 4 -b 0.0.0.0:5000 app:app
   ```

**Option 2: Using Docker**

Create a `Dockerfile`:
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

**Platforms:**
- **Heroku**: Use Heroku CLI and Procfile
- **AWS Elastic Beanstalk**: Deploy Python application
- **DigitalOcean App Platform**: Deploy from GitHub
- **Railway**: Connect GitHub repository

### Frontend Deployment

**Build for Production:**
```bash
cd frontend
npm run build
```

This creates an optimized build in the `build/` directory.

**Deploy Options:**
- **Netlify**: Connect GitHub and deploy `build/` folder
- **Vercel**: Connect GitHub repository
- **AWS S3 + CloudFront**: Upload `build/` to S3 bucket
- **GitHub Pages**: Deploy `build/` folder

**Important:** Update `REACT_APP_API_URL` to point to your production backend URL.

### Database Migration

For production, consider migrating from SQLite to:
- **PostgreSQL** (recommended)
- **MySQL**
- **MongoDB** (if switching to NoSQL)

Update `SQLALCHEMY_DATABASE_URI` in `app.py`:
```python
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://user:password@localhost/budget'
```

## 🐛 Troubleshooting

### Common Issues

**Backend won't start:**
- ✅ Check if port 5000 is already in use
- ✅ Verify virtual environment is activated
- ✅ Ensure all dependencies are installed
- ✅ Check Python version (3.8+ required)

**Frontend won't start:**
- ✅ Check if port 3000 is already in use
- ✅ Verify Node.js version (14+ required)
- ✅ Delete `node_modules` and `package-lock.json`, then run `npm install` again
- ✅ Check for syntax errors in console

**Connection errors:**
- ✅ Ensure backend is running on port 5000
- ✅ Check CORS configuration in `app.py`
- ✅ Verify API URL in `frontend/src/services/api.js`
- ✅ Check browser console for detailed error messages

**Authentication issues:**
- ✅ Clear browser localStorage and try again
- ✅ Check if token has expired (24-hour limit)
- ✅ Verify JWT secret key is set correctly

**Database errors:**
- ✅ Delete `budget.db` and restart the app (will recreate tables)
- ✅ Check file permissions on database file
- ✅ Verify SQLAlchemy is installed correctly

**Charts not displaying:**
- ✅ Ensure Chart.js dependencies are installed
- ✅ Check browser console for JavaScript errors
- ✅ Verify data is being returned from API

### Getting Help

1. Check the browser console (F12) for error messages
2. Check the backend terminal for server errors
3. Verify all dependencies are installed correctly
4. Ensure both servers are running simultaneously
5. Check network tab in browser DevTools for API request/response details

## 🤝 Contributing

Contributions are welcome! To contribute:

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Make your changes**
4. **Commit your changes**: `git commit -m 'Add amazing feature'`
5. **Push to the branch**: `git push origin feature/amazing-feature`
6. **Open a Pull Request**

### Contribution Guidelines

- Follow existing code style and conventions
- Add comments for complex logic
- Test your changes thoroughly
- Update documentation if needed
- Ensure backward compatibility when possible

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/) and [Flask](https://flask.palletsprojects.com/)
- Charts powered by [Chart.js](https://www.chartjs.org/)
- Icons and emojis for visual enhancement

---

**Made with ❤️ for better financial management**

For questions, issues, or suggestions, please open an issue on the repository.
