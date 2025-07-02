import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import axios from 'axios';
import './UploadPage.css';

function UploadPage({ userId, onLogout }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectedImage, setDetectedImage] = useState(null); // Состояние для детектированного изображения
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setDetectedImage(null); // Сбрасываем предыдущее изображение при выборе нового файла
  };

  const handleUpload = async () => {
    if (!userId || !selectedFile) {
      alert('Пожалуйста, войдите в систему и выберите файл');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);
    formData.append('userId', userId);

    try {
      const response = await axios.post('http://localhost:3001/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      console.log('Ответ сервера на /upload:', response.data);
      // Проверяем, вернул ли сервер processedImagePath
      if (response.data.processedImagePath) {
        setDetectedImage(`http://localhost:3001/${response.data.processedImagePath}?v=${Date.now()}`);
      } else {
        // Запрашиваем данные из галереи
        const galleryResponse = await axios.get(`http://localhost:3001/previous-detections/${userId}`);
        console.log('Ответ сервера на /previous-detections:', galleryResponse.data);
        const latestDetection = galleryResponse.data[galleryResponse.data.length - 1];
        if (latestDetection && latestDetection.processedImagePath) {
          setDetectedImage(`http://localhost:3001/${latestDetection.processedImagePath}?v=${Date.now()}`);
        } else if (latestDetection && latestDetection.imagePath) {
          // Если processedImagePath нет, попробуем использовать imagePath как запасной вариант
          setDetectedImage(`http://localhost:3001/${latestDetection.imagePath}?v=${Date.now()}`);
        } else {
          alert('Сервер не вернул обработанное изображение, и его нельзя найти в галерее');
        }
      }
    } catch (err) {
      console.error('Ошибка загрузки:', err);
      alert('Ошибка загрузки изображения');
    }
  };

  return (
    <>
      <Header page="upload" userId={userId} onLogout={onLogout} />
      <div className="container py-4">
        <h2 className="upload-title">Загрузка изображения</h2>
        <h3 className="upload-description-1">Выберите изображение и YOLO найдет и распознает объекты на нем</h3>
        <p className="upload-description">
          Поддерживаемые форматы: PNG, JPG, JPEG
        </p>
        <div className="upload-container">
          <input
            type="file"
            id="fileInput"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept="image/png, image/jpeg, image/jpg"
          />
          <label htmlFor="fileInput" className="custom-upload-button">
            Выбрать файл
          </label>
          <button onClick={handleUpload} className="upload-button">
            Загрузить
          </button>
          {selectedFile && <p className="file-name">Выбранный файл: {selectedFile.name}</p>}
        </div>
        {detectedImage && (
          <div className="detection-result">
            <h3>Результат детекции</h3>
            <img src={detectedImage} alt="Детектированное изображение" style={{ maxWidth: '100%', maxHeight: '500px' }} />
          </div>
        )}
      </div>
    </>
  );
}

export default UploadPage;