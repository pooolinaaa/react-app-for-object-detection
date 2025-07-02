import React from 'react';
import Header from './Header';

function AboutPage() {
  return (
    <>
      <Header page="about" userId={null} onLogout={() => {}} />
      <div className="container py-4">
        <h2>О нас</h2>
        <p>Добро пожаловать на страницу "О нас"! Здесь будет информация о проекте.</p>
      </div>
    </>
  );
}

export default AboutPage;