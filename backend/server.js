const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const bcrypt = require('bcrypt');
const { createCanvas, loadImage } = require('canvas');
const saltRounds = 10;

const app = express();
const PORT = 3001;

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:3000'); // Разрешите фронтенд
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(cors());
app.use(express.json());

// Настройка загрузки изображений
const storage = multer.diskStorage({
  destination: 'upload/',
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  },
});
const upload = multer({ storage });

// Обслуживание статических файлов из директории upload
app.use('/upload', express.static(path.join(__dirname, 'upload')));

// Подключение к базе данных
const db = new sqlite3.Database('db.sqlite');

// Создание директории upload, если её нет
const uploadDir = 'upload/detections/';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Создание таблиц, если их нет
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS User (
      User_id INTEGER PRIMARY KEY AUTOINCREMENT,
      Username TEXT UNIQUE,
      Email TEXT,
      User_password TEXT
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Uploaded_image (
      Uploaded_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
      User_id INTEGER,
      Image_path TEXT,
      Processed_image_path TEXT,
      Uploaded_at TEXT,
      FOREIGN KEY (User_id) REFERENCES User(User_id)
    )
  `);
  db.run(`
    CREATE TABLE IF NOT EXISTS Detected_object (
      Detected_object_id INTEGER PRIMARY KEY AUTOINCREMENT,
      Uploaded_image_id INTEGER,
      User_id INTEGER,
      Object_name TEXT,
      Confidence REAL,
      x1 REAL,
      y1 REAL,
      x2 REAL,
      y2 REAL,
      FOREIGN KEY (Uploaded_image_id) REFERENCES Uploaded_image(Uploaded_image_id),
      FOREIGN KEY (User_id) REFERENCES User(User_id)
    )
  `);
});

// Регистрация пользователя
app.post('/register', (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Все поля обязательны' });
  }

  bcrypt.hash(password, saltRounds, (err, hash) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка хеширования пароля' });
    }
    db.run(
      'INSERT INTO User (Username, Email, User_password) VALUES (?, ?, ?)',
      [username, email, hash],
      function (err) {
        if (err) {
          return res.status(500).json({ error: 'Ошибка регистрации', details: err.message });
        }
        res.json({ message: 'Пользователь зарегистрирован', userId: this.lastID });
      }
    );
  });
});

// Логин пользователя
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Имя пользователя и пароль обязательны' });
  }

  db.get('SELECT * FROM User WHERE Username = ?', [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка базы данных' });
    }
    if (!user) {
      return res.status(401).json({ error: 'Пользователь не найден' });
    }
    bcrypt.compare(password, user.User_password, (err, result) => {
      if (err || !result) {
        return res.status(401).json({ error: 'Неверный пароль' });
      }
      res.json({ message: 'Вход выполнен', userId: user.User_id });
    });
  });
});

// Загрузка изображения + запуск YOLO + сохранение с рамками
app.post('/upload', upload.single('image'), (req, res) => {
  const { userId } = req.body;
  if (!userId) {
    return res.status(400).json({ error: 'User ID обязателен' });
  }
  const imagePath = req.file.path;
  console.log('Загружен файл:', imagePath);

  const pythonProcess = spawn('python', ['detect.py', imagePath]);

  pythonProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  pythonProcess.on('error', (err) => {
    console.error('Ошибка запуска Python процесса:', err);
    return res.status(500).json({ error: 'Ошибка запуска Python' });
  });

  pythonProcess.on('close', async (code) => {
    console.log(`Python процесс завершился с кодом ${code}`);
    if (code !== 0) {
      return res.status(500).json({ error: 'Ошибка выполнения Python' });
    }

    fs.readFile('temp_detections.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Ошибка чтения JSON:', err);
        return res.status(500).json({ error: 'Ошибка чтения результата YOLO' });
      }

      let detections;
      try {
        detections = JSON.parse(data);
      } catch (e) {
        console.error('Ошибка разбора JSON:', e);
        return res.status(500).json({ error: 'Ошибка разбора JSON', details: e.message });
      }

      console.log('Объекты:', detections);

      db.run(
        'INSERT INTO Uploaded_image (User_id, Image_path, Uploaded_at) VALUES (?, ?, ?)',
        [userId, imagePath, new Date().toISOString()],
        function (err) {
          if (err) {
            console.error('Ошибка записи изображения в БД:', err.message);
            return res.status(500).json({ error: 'Ошибка записи изображения в БД', details: err.message });
          }

          const imageId = this.lastID;

          const insertPromises = detections.map((obj) => {
            return new Promise((resolve, reject) => {
              db.run(
                `INSERT INTO Detected_object (Uploaded_image_id, User_id, Object_name, Confidence, x1, y1, x2, y2)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [imageId, userId, obj.object_name, obj.confidence, obj.x1, obj.y1, obj.x2, obj.y2],
                function (err) {
                  if (err) reject(err);
                  else resolve();
                }
              );
            });
          });

          Promise.all(insertPromises)
            .then(async () => {
              // Создание и сохранение изображения с рамками
              const processedImagePath = path.join(uploadDir, `processed_${Date.now()}-${path.basename(imagePath)}`);
              const img = await loadImage(imagePath);
              const canvas = createCanvas(img.width, img.height);
              const ctx = canvas.getContext('2d');

              // Рисуем оригинальное изображение
              ctx.drawImage(img, 0, 0);

              // Рисуем bounding boxes
              ctx.lineWidth = 2;
              ctx.strokeStyle = 'red';
              detections.forEach((d) => {
                ctx.beginPath();
                ctx.rect(d.x1, d.y1, d.x2 - d.x1, d.y2 - d.y1);
                ctx.stroke();

                ctx.fillStyle = 'white';
                ctx.font = '16px Arial';
                const label = `${d.object_name} (conf: ${d.confidence.toFixed(2)})`;
                const textWidth = ctx.measureText(label).width;
                ctx.fillRect(d.x1, d.y1 - 20, textWidth + 10, 20);
                ctx.fillStyle = 'black';
                ctx.fillText(label, d.x1 + 5, d.y1 - 5);
              });

              // Сохраняем обработанное изображение
              const out = fs.createWriteStream(processedImagePath);
              const stream = canvas.createPNGStream();
              stream.pipe(out);
              out.on('finish', () => {
                // Обновляем запись в базе данных с путём к обработанному изображению
                db.run(
                  'UPDATE Uploaded_image SET Processed_image_path = ? WHERE Uploaded_image_id = ?',
                  [processedImagePath, imageId],
                  (err) => {
                    if (err) {
                      console.error('Ошибка обновления пути обработанного изображения:', err.message);
                    }
                    res.json({ message: 'OK', imageId, imagePath: processedImagePath });
                  }
                );
              });
            })
            .catch((err) => {
              console.error('Ошибка записи объектов:', err);
              res.status(500).json({ error: 'Ошибка записи объектов в БД', details: err.message });
            });
        }
      );
    });
  });
});

// Получение объектов по ID изображения
app.get('/detections/:imageId', (req, res) => {
  const imageId = req.params.imageId;
  db.all('SELECT * FROM Detected_object WHERE Uploaded_image_id = ?', [imageId], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Ошибка чтения из БД' });
    res.json(rows);
  });
});

// Получение предыдущих детекций
app.get('/previous-detections/:userId', (req, res) => {
  const userId = req.params.userId;
  db.all(
    `
    SELECT ui.Uploaded_image_id, ui.Image_path, ui.Processed_image_path, ui.Uploaded_at, do.Object_name, do.Confidence, do.x1, do.y1, do.x2, do.y2
    FROM Uploaded_image ui
    LEFT JOIN Detected_object do ON ui.Uploaded_image_id = do.Uploaded_image_id
    WHERE ui.User_id = ?
    ORDER BY ui.Uploaded_at DESC
    `,
    [userId],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'Ошибка чтения предыдущих детекций' });
      const detectionsByImage = {};
      rows.forEach((row) => {
        if (!detectionsByImage[row.Uploaded_image_id]) {
          detectionsByImage[row.Uploaded_image_id] = {
            Uploaded_image_id: row.Uploaded_image_id,
            imagePath: row.Processed_image_path || row.Image_path,
            uploadedAt: row.Uploaded_at,
            objects: [],
          };
        }
        if (row.Object_name) {
          detectionsByImage[row.Uploaded_image_id].objects.push({
            object_name: row.Object_name,
            confidence: row.Confidence,
            x1: row.x1,
            y1: row.y1,
            x2: row.x2,
            y2: row.y2,
          });
        }
      });
      res.json(Object.values(detectionsByImage));
    }
  );
});

// Логика удаления детекции
app.delete('/previous-detections/:userId/:uploadedImageId', (req, res) => {
  const { userId, uploadedImageId } = req.params;

  // Проверка входных данных
  if (!userId || !uploadedImageId) {
    return res.status(400).json({ error: 'User ID и Uploaded Image ID обязательны' });
  }

  // Начинаем транзакцию
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    // Получаем пути к файлам перед удалением
    db.get(
      'SELECT Image_path, Processed_image_path FROM Uploaded_image WHERE Uploaded_image_id = ? AND User_id = ?',
      [uploadedImageId, userId],
      (err, row) => {
        if (err) {
          db.run('ROLLBACK');
          console.error('Ошибка получения путей к файлам:', err.message);
          return res.status(500).json({ error: 'Ошибка получения данных изображения' });
        }

        if (!row) {
          db.run('ROLLBACK');
          return res.status(404).json({ error: 'Детекция не найдена' });
        }

        const { Image_path, Processed_image_path } = row;
        const baseDir = 'upload/';

        // Удаляем связанные записи из Detected_object
        db.run(
          'DELETE FROM Detected_object WHERE Uploaded_image_id = ? AND User_id = ?',
          [uploadedImageId, userId],
          (err) => {
            if (err) {
              db.run('ROLLBACK');
              console.error('Ошибка удаления объектов:', err.message);
              return res.status(500).json({ error: 'Ошибка удаления объектов' });
            }

            // Удаляем запись из Uploaded_image
            db.run(
              'DELETE FROM Uploaded_image WHERE Uploaded_image_id = ? AND User_id = ?',
              [uploadedImageId, userId],
              (err) => {
                if (err) {
                  db.run('ROLLBACK');
                  console.error('Ошибка удаления изображения:', err.message);
                  return res.status(500).json({ error: 'Ошибка удаления изображения' });
                }

                // Проверяем, были ли изменения
                db.get(
                  'SELECT changes() as changes',
                  [],
                  (err, row) => {
                    if (err) {
                      db.run('ROLLBACK');
                      console.error('Ошибка получения изменений:', err.message);
                      return res.status(500).json({ error: 'Ошибка сервера' });
                    }

                    if (row.changes === 0) {
                      db.run('ROLLBACK');
                      return res.status(404).json({ error: 'Детекция не найдена' });
                    }

                    // Удаляем файлы с диска, если они существуют
                    const imagePath = path.join(baseDir, path.basename(Image_path || ''));
                    const processedImagePath = path.join(baseDir, path.basename(Processed_image_path || ''));

                    if (fs.existsSync(imagePath)) {
                      fs.unlink(imagePath, (err) => {
                        if (err) console.error('Ошибка удаления оригинального изображения:', err.message);
                      });
                    }
                    if (fs.existsSync(processedImagePath)) {
                      fs.unlink(processedImagePath, (err) => {
                        if (err) console.error('Ошибка удаления обработанного изображения:', err.message);
                      });
                    }

                    db.run('COMMIT');
                    res.json({ message: 'Детекция успешно удалена', changes: row.changes });
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

app.get('/', (req, res) => {
  res.send('Server is online!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});