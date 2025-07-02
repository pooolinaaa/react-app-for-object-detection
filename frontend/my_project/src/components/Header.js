import React from 'react';
import { Link } from 'react-router-dom';
import './header.css';
import logo from './logo.png';

function Header({ page, userId, onLogout }) {
  return (
    <header className="header">
      <div className="logo">
        <Link to="/">
          <img src={logo} alt="Logo" />
        </Link>
      </div>
      <nav className="nav-links">
        {!userId ? (
          <>
            <Link to="/gallery">Галерея</Link>
            <Link to="/about">О нас</Link>
            <Link to="/login">Войти</Link>
          </>
        ) : (
          <>
            {page === 'home' || page === 'upload' ? (
              <>
                <Link to="/upload">Главная</Link>
                <Link to="/previous-detections">Моя галерея</Link>
                <Link to="/" onClick={onLogout}>Выйти</Link>
              </>
            ) : page === 'previous-detections' ? (
              <>
                <Link to="/upload">Главная</Link>
                <Link to="/previous-detections">Моя галерея</Link>
                <Link to="/" onClick={onLogout}>Выйти</Link>
              </>
            ) : page === 'about' ? (
              <>
                <Link to="/upload">Главная</Link>
                <Link to="/previous-detections">Моя галерея</Link>
                <Link to="/" onClick={onLogout}>Выйти</Link>
              </>
            ) : null}
          </>
        )}
      </nav>
    </header>
  );
}

export default Header;