# Grievance Platform

## File Structure

```text
New project/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   └── complaintController.js
│   ├── models/
│   │   └── Complaint.js
│   ├── routes/
│   │   └── complaintRoutes.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── complaints.js
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── ComplaintForm.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Home.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## Run

1. Copy `backend/.env.example` to `backend/.env`
2. Start MongoDB locally
3. Install dependencies in `backend` and `frontend`
4. Run backend on port `5000`
5. Run frontend on port `5173`
