<h2 align="center"> React app for object detection with yolov8s</h2>

<h3>Описание:</h3>

Это веб-приложение, разработанное с использованием React для фронтенда и Node.js с Express для серверной части, предназначенное для загрузки изображений, детекции объектов и отображения результатов в галерее. Пользователи могут регистрироваться, входить в систему, загружать изображения для анализа, просматривать детекции с рамками и метками, а также удалять или скачивать результаты. Приложение включает интерактивный интерфейс и оптимизированную базу данных SQLite для хранения данных пользователей и детекций.

<h3>Технологии:</h3>

- Фронтенд: React, React-Bootstrap, HTML5 Canvas
- Бэкенд: Node.js, Express
- База данных: SQLite
- Инструменты: Axios, Visual Studio Code, npm
- Дополнительно: REST API, CORS

<h3>Установка:</h3>

1. Склонируйте репозиторий
2. Установите `Node.js` и скачайте в папку `\backend` `yolov8s.pt`:
   - Установите YOLOv8 через Ultralytics: `pip install ultralytics`
   - Скачайте предобученную модель YOLOv8s с [официального сайта Ultralytics](https://docs.ultralytics.com/ru/models) и поместите её в папку `\backend`
2. Установите зависимости:
   - Для фронтенда: `npm install`
   - Для всего проекта (в папке `\react-app-for-object-detection`): `npm install`
3. Настройте файл `.env`:
   - Добавьте переменные окружения, например, путь к модели: `MODEL_PATH=./backend/yolov8s.pt`
4. Установите SQLite
5. Запустите сервер:
   - Перейдите в папку `\backend` и выполните: `node server.js`
6. Запустите фронтенд:
   - В папке `\frontend\my_project` выполните: `npm start`
  
<h3>База данных:</h3>

![db](https://github.com/user-attachments/assets/cdc3fc64-d4a0-4a80-9afa-6c562de53786)

<h3>Страница регистрации:</h3>

![login](https://github.com/user-attachments/assets/355f1b60-8630-44f0-91e8-1b6d5be8c9c4)

<h3>Галерея пользователя:</h3>

![gallery](https://github.com/user-attachments/assets/f09c249b-ca8c-4895-96c4-a70e1e2632ad)

