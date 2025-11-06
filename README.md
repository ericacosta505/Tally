# Budget Tracking Application

A simple and elegant budget tracking application built with React (frontend) and Flask (backend).

## Features

- ✅ Add income and expense entries
- ✅ Edit existing entries
- ✅ Delete entries
- ✅ View summary with total income, expenses, and balance
- ✅ Categorize entries
- ✅ Beautiful, responsive UI

## Project Structure

```
Budget/
├── backend/
│   ├── app.py              # Flask application
│   ├── requirements.txt    # Python dependencies
│   └── budget.db          # SQLite database (created automatically)
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── services/      # API service
│   │   ├── App.js
│   │   └── index.js
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create and activate a virtual environment:
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies (make sure your virtual environment is activated):
```bash
pip install -r requirements.txt
```

4. Run the Flask server:
```bash
python app.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000` and automatically open in your browser.

## Usage

1. Make sure both the backend and frontend servers are running
2. Open your browser to `http://localhost:3000`
3. Add income or expense entries using the form
4. View your budget summary at the top
5. Edit or delete entries using the action buttons

## API Endpoints

- `GET /api/entries` - Get all budget entries
- `POST /api/entries` - Create a new entry
- `PUT /api/entries/<id>` - Update an entry
- `DELETE /api/entries/<id>` - Delete an entry
- `GET /api/summary` - Get budget summary (income, expenses, balance)

## Technologies Used

- **Frontend**: React 18, Axios, CSS3
- **Backend**: Flask, SQLAlchemy, SQLite
- **CORS**: flask-cors for cross-origin requests

## License

MIT

