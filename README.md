# 🚀 AspireNext - Interactive Video Training & Authentication Portal

A modern, full-stack Web Application for user authentication and real-time video watch progress persistence using **React**, **Vite**, **Three.js**, **Express**, and **Supabase**.

---

## ✨ Features

- **🌐 3D Interactive WebGL Background**: Built with Three.js rendering a constellation of glowing particles and dynamic mouse parallax effects.
- **🔒 Supabase Authentication**: Multi-column lookup across `email` and mobile number (`mbnum`, `phone`, `mobile`) with password validation against explicit database entries or derived formats.
- **⏯️ Locked Anti-Cheat Video Player**:
  - Non-clickable, locked progress bar preventing users from skipping ahead.
  - Second-by-second watch state persistence directly to Supabase (`video_progress` table).
  - Reliable failover streaming support for media playback.
- **🎉 Automated Completion & Confetti Drop**:
  - Upon reaching 100% video completion, the application triggers a top-down canvas confetti celebration and routes to a dedicated completion page.
  - Users who re-login after completing the training are automatically routed directly to the verified success page.
- **🛡️ Post-Logout Security Guard**: Browser `popstate` listeners prevent back/forward navigation into protected sessions post-logout.

---

## 📁 Project Structure

```
demo-login/
├── backend/
│   ├── package.json          # Node.js backend dependencies
│   └── server.js            # Express server & Supabase API handlers
├── frontend/
│   ├── index.html            # Entry HTML file
│   ├── package.json          # Vite React frontend dependencies
│   ├── vite.config.js        # Vite dev server configuration & API proxy
│   └── src/
│       ├── App.jsx           # Main shell & application state
│       ├── index.css         # Custom Design System & Glassmorphic UI styles
│       ├── components/
│       │   ├── Header.jsx           # Header bar with user profile & logout
│       │   ├── LoginPage.jsx        # Portal sign-in form & WebGL wrapper
│       │   ├── SuccessPage.jsx      # Completion page & confetti canvas animation
│       │   ├── ThreeBackground.jsx  # Three.js 3D WebGL particle constellation
│       │   └── VideoPlayer.jsx     # Locked video player with real-time sync
│       └── utils/
│           └── storage.js    # API helper for Supabase progress syncing
├── .gitignore                # Root Git ignore configuration
└── README.md                 # Project documentation
```

---

## ⚡ Quick Start & Installation

### 1. Prerequisites
Ensure you have **Node.js** (v18 or higher) installed on your system.

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start the Express server (runs on http://localhost:5000)
npm start
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start the Vite development server (runs on http://localhost:3000)
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 🗄️ Supabase Database Schema

The backend connects to Supabase using two primary tables:

1. **`demo_booking` / `demo_bookings`**:
   - `id`: User ID or unique identifier
   - `email`: Registered user email
   - `mbnum` / `mobile` / `phone`: Registered phone number
   - `password` / `pass`: User password

2. **`video_progress`**:
   - `user_id` (Primary Key / Unique): String matching user ID
   - `current_time`: Integer seconds watched
   - `completed`: Boolean completion status
   - `updated_at`: ISO timestamp

---

## 📜 License

This project is open source and ready for deployment.
