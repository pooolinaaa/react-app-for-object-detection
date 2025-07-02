import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import UploadPage from './components/UploadPage';
import PreviousDetections from './components/PreviousDetections';
import LoginPage from './components/LoginPage';
import AboutPage from './components/AboutPage';
import GalleryPage from './components/Gallery';
import 'bootstrap/dist/css/bootstrap.min.css';

function App() {
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);

  const handleLogin = (id) => {
    setUserId(id);
    localStorage.setItem('userId', id);
  };

  const handleLogout = () => {
    setUserId(null);
    localStorage.removeItem('userId');
    alert('Вы вышли из системы');
    window.location.href = '/login';
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage setUserId={handleLogin} />} />
        <Route path="/upload" element={<UploadPage userId={userId} onLogout={handleLogout} />} />
        <Route path="/previous-detections" element={<PreviousDetections userId={userId} onLogout={handleLogout} />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/gallery" element={<GalleryPage />} />
        <Route path="/" element={<Navigate to={userId ? "/upload" : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;