# 🚀 Nirman – Smart Grievance Portal

A fully modernized, AI-powered citizen grievance tracking and resolution system. Built for high-speed performance, deep analytics, and intuitive usage by both citizens and city administrators.

## ✨ Features
- **Intelligent Deduplication:** Prevents identical complaints using Jaccard text similarity and Haversine spatial proximity.
- **Auto-Location Detection:** Grabs exact user coordinates and translates them into address logs.
- **Smart Analytics Dashboard:** Administrators can view visual, actionable metrics without SQL queries.
- **Live Interactive Maps:** React Leaflet integration mapping complaints with heatmaps and clustering.
- **Premium UX/UI:** Fluid transitions, segmented interactive status pills, and dark-theme oriented citizen layout.
- **Zero-Setup Demo Mode:** Run the software immediately out-of-the-box without configuring MongoDB!

## 🛠 Tech Stack
- **Frontend:** React 18, Vite, React-Leaflet, WebSockets
- **Backend:** Node.js, Express.js, Socket.IO
- **Database:** MongoDB / Mongoose (with automated Demo mock-data fallback)

## 📦 Installation Steps

### Step 1: Clone the repository
```bash
git clone <repo-url>
cd Nirman-project
```

### Step 2: Install dependencies natively
```bash
npm run install-all
```

### Step 3: Start everything (Frontend + Backend)
```bash
npm start
```

## ⚙️ Environment Variables
The application ships seamlessly using fallback logic. However, to enable live database storage, you should copy the provided example config file located inside `backend`:

```bash
cd backend
cp .env.example .env
```
Inside your new `.env`, configure:
- `PORT=5000`
- `MONGODB_URI=mongodb://127.0.0.1:27017/nirman`
- `JWT_SECRET=super_secret_jwt_key_12345`

## 🧪 Demo Mode (No DB required!)
We engineered Nirman to never crash during hackathons or initial setups. If MongoDB is unavailable (or the connection string fails), the backend automatically degrades gracefully into **Demo Mode**. 
During Demo Mode, the app utilizes robust in-memory JSON data to showcase maps, auth, stats, and complaint tickets without missing a beat!

## 🌐 Local URLs
- **Citizen Portal (Frontend):** http://localhost:5173
- **REST API (Backend):** http://localhost:5000/api

## ⚠️ Troubleshooting
- **Port 5000 is directly in use:** If macOS Control Center is running on port 5000, modify `PORT=5001` inside `backend/.env`.
- **NPM Install Issue:** Ensure you are using a recent version of Node (v18+). Legacy peer issues are bypassed automatically by our unified `install-all` command.
- **MongoDB Connection:** If the application warns "Running Demo Mode" and you *wanted* to use the database, ensure mongod is actually running locally: `sudo systemctl start mongod`.

## 🏁 Final Quick Run Command
If you just want to run the project instantly in one breath:
```bash
npm run install-all && npm start
```
