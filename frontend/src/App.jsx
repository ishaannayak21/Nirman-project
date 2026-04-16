import { Routes, Route } from "react-router-dom";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import Navbar from "./components/Navbar.jsx";
import BackgroundScene from "./components/BackgroundScene.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import UserProtectedRoute from "./components/UserProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import ComplaintForm from "./pages/ComplaintForm.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import AdminLogin from "./pages/AdminLogin.jsx";
import PortalSelect from "./pages/PortalSelect.jsx";
import Register from "./pages/Register.jsx";
import UserLogin from "./pages/UserLogin.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import ResetPassword from "./pages/ResetPassword.jsx";
import UserDashboard from "./pages/UserDashboard.jsx";

function App() {
  const [liveNotifications, setLiveNotifications] = useState([]);

  useEffect(() => {
    const socket = io("/", {
      path: "/socket.io"
    });

    socket.on("notification:new", (payload) => {
      setLiveNotifications((current) => [payload, ...current].slice(0, 20));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  return (
    <div className="app-shell">
      <BackgroundScene />
      <Navbar liveNotifications={liveNotifications} />
      <main className="page-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route
            path="/complaint"
            element={
              <UserProtectedRoute>
                <ComplaintForm />
              </UserProtectedRoute>
            }
          />
          <Route path="/login" element={<PortalSelect />} />
          <Route path="/user-login" element={<UserLogin />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route
            path="/my-complaints"
            element={
              <UserProtectedRoute>
                <UserDashboard />
              </UserProtectedRoute>
            }
          />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
