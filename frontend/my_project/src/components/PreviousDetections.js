import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from './Header';
import { Card, Button } from 'react-bootstrap';
import './PreviousDetections.css'; // Убедитесь, что файл подключён

function PreviousDetections({ userId, onLogout }) {
  const [previousDetections, setPreviousDetections] = useState([]);
  const canvasRefs = useRef({});

  useEffect(() => {
    if (userId) {
      axios
        .get(`http://localhost:3001/previous-detections/${userId}`)
        .then((response) => {
          console.log('Полученные предыдущие детекции:', response.data);
          setPreviousDetections(response.data);
        })
        .catch((err) => {
          console.error('Ошибка загрузки предыдущих детекций:', err);
          alert('Ошибка загрузки предыдущих детекций');
        });
    }
  }, [userId]);

  const drawBoundingBoxes = (imageId, detections) => {
    const canvas = canvasRefs.current[imageId];
    if (!canvas || !detections.imagePath) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = `http://localhost:3001/${detections.imagePath}?v=${Date.now()}`;

    img.onload = () => {
      const maxWidth = 300;
      let newWidth = img.width;
      let newHeight = img.height;
      if (img.width > maxWidth) {
        newWidth = maxWidth;
        newHeight = (img.height * maxWidth) / img.width;
      }

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.drawImage(img, 0, 0, newWidth, newHeight);

      const scaleX = newWidth / img.width;
      const scaleY = newHeight / img.height;

      detections.objects.forEach((d) => {
        const x1 = d.x1 * scaleX;
        const y1 = d.y1 * scaleY;
        const x2 = d.x2 * scaleX;
        const y2 = d.y2 * scaleY;

        ctx.beginPath();
        ctx.rect(x1, y1, x2 - x1, y2 - y1);
        ctx.lineWidth = 4;
        ctx.strokeStyle = 'red';
        ctx.stroke();

        ctx.fillStyle = 'white';
        ctx.font = '16px Arial';
        const label = `${d.object_name} (conf: ${d.confidence.toFixed(2)})`;
        const textWidth = ctx.measureText(label).width;
        ctx.fillRect(x1, y1 - 20, textWidth + 10, 20);
        ctx.fillStyle = 'black';
        ctx.fillText(label, x1 + 5, y1 - 5);
      });
    };

    img.onerror = (e) => {
      console.error('Ошибка загрузки изображения для imageId', imageId, ':', e);
    };
  };

  useEffect(() => {
    previousDetections.forEach((detection) => {
      if (!canvasRefs.current[detection.Uploaded_image_id]) {
        canvasRefs.current[detection.Uploaded_image_id] = null;
      }
    });
    previousDetections.forEach((detection) => {
      if (canvasRefs.current[detection.Uploaded_image_id]) {
        drawBoundingBoxes(detection.Uploaded_image_id, detection);
      }
    });
  }, [previousDetections]);

  const handleDelete = (uploadedImageId) => {
    if (window.confirm('Вы уверены, что хотите удалить эту детекцию?')) {
      axios
        .delete(`http://localhost:3001/previous-detections/${userId}/${uploadedImageId}`, { timeout: 30000 })
        .then(() => {
          setPreviousDetections(previousDetections.filter((item) => item.Uploaded_image_id !== uploadedImageId));
        })
        .catch((err) => {
          console.error('Ошибка удаления детекции:', err);
          alert('Ошибка удаления детекции');
        });
    }
  };

  const handleDownload = (uploadedImageId) => {
    const canvas = canvasRefs.current[uploadedImageId];
    if (canvas) {
      try {
        const link = document.createElement('a');
        link.download = `detection_${uploadedImageId}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } catch (error) {
        console.error('Ошибка скачивания:', error);
        alert('Не удалось скачать изображение из-за ограничений безопасности. Проверьте настройки сервера (CORS).');
      }
    }
  };

  return (
    <>
      <Header page="previous-detections" userId={userId} onLogout={onLogout} />
      <div className="container py-4">
        <h2>Галерея пользователя</h2>
        {previousDetections.length > 0 ? (
          <div className="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">
            {previousDetections.map((detection) => (
              <div key={detection.Uploaded_image_id} className="col">
                <Card className="h-100 custom-card border-0 shadow-sm" style={{ minHeight: '400px' }}>
                  <div style={{ height: '50%', overflow: 'hidden' }}>
                    <canvas
                      ref={(el) => {
                        if (el && !canvasRefs.current[detection.Uploaded_image_id]) {
                          canvasRefs.current[detection.Uploaded_image_id] = el;
                          drawBoundingBoxes(detection.Uploaded_image_id, detection);
                        }
                      }}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </div>
                  <Card.Body className="d-flex flex-column justify-content-between p-3">
                    <div>
                      <Card.Text className="text-muted small mb-2">
                        Uploaded: {new Date(detection.uploadedAt).toLocaleString()}
                      </Card.Text>
                      <ul className="list-unstyled">
                        {detection.objects.map((obj, index) => (
                          <li key={index} className="mb-1">
                            <strong>{obj.object_name}:</strong> {(obj.confidence * 100).toFixed(2)}%
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="d-flex justify-content-between">
                      <Button variant="danger" size="sm" onClick={() => handleDelete(detection.Uploaded_image_id)}>
                        Удалить
                      </Button>
                      <Button variant="success" size="sm" onClick={() => handleDownload(detection.Uploaded_image_id)}>
                        Скачать
                      </Button>
                    </div>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        ) : (
          <p>Нет предыдущих детекций</p>
        )}
      </div>
    </>
  );
}

export default PreviousDetections;