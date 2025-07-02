CREATE TABLE User (
    User_id INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE,
    Email TEXT,
    User_password TEXT
);

CREATE TABLE Uploaded_image (
    Uploaded_image_id INTEGER PRIMARY KEY AUTOINCREMENT,
    User_id INTEGER,
    Image_path TEXT,
    Processed_image_path TEXT,
    Uploaded_at TEXT,
    FOREIGN KEY (User_id) REFERENCES User(User_id)
);

CREATE TABLE Detected_object (
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
);