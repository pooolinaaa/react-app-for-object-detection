import React, { useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import './LoginPage.css';


function LoginPage({ setUserId }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:3001/login', { username, password }, { timeout: 30000 });
      console.log('Login response:', response.data);
      setUserId(response.data.userId);
      navigate('/upload');
    } catch (err) {
      console.error('Login error:', err);
      setError('Неверное имя пользователя или пароль');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!email || !username || !password) {
      setError('Все поля обязательны для регистрации');
      return;
    }
    try {
      const response = await axios.post('http://localhost:3001/register', { email, username, password }, { timeout: 30000 });
      console.log('Register response:', response.data);
      setUserId(response.data.userId);
      navigate('/upload');
    } catch (err) {
      console.error('Register error:', err);
      setError('Ошибка регистрации');
    }
  };

  return (
    <>
      <Header page="home" userId={null} onLogout={() => {}} />
      <div className="login-container">
        <div className="login-form">
          <h2>{isLogin ? 'Вход' : 'Регистрация'}</h2>
          <button className="toggle-button" onClick={() => { setIsLogin(!isLogin); setError(''); }}>
            {isLogin ? 'Перейти к регистрации' : 'Перейти к входу'}
          </button>
          {error && <p className="error-message">{error}</p>}
          <form onSubmit={isLogin ? handleLogin : handleRegister}>
            {isLogin ? (
              <>
                <div className="input-group">
                  <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                </div>
                <div className="input-group">
                  <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                </div>
              </>
            ) : (
              <>
                <div className="input-group">
                  <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                </div>
                <div className="input-group">
                  <input type="text" placeholder="Имя пользователя" value={username} onChange={(e) => setUsername(e.target.value)} required />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                </div>
                <div className="input-group">
                  <input type="password" placeholder="Пароль" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  <span className="highlight"></span>
                  <span className="bar"></span>
                </div>
              </>
            )}
            <button type="submit">{isLogin ? 'Войти' : 'Зарегистрироваться'}</button>
          </form>
        </div>
      </div>
    </>
  );
}

export default LoginPage;