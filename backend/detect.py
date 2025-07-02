from ultralytics import YOLO
import sys
import json
import os

image_path = os.path.abspath(sys.argv[1])
output_path = os.path.abspath("temp_detections.json")

model = YOLO("yolov8s.pt")

results = model.predict(
    image_path,
    imgsz=640,
    iou=0.4,
    conf=0.5,
    verbose=False,
    device='cpu'
)

result = results[0]
objects = []
for box in result.boxes:
    cls = int(box.cls[0])
    conf = float(box.conf[0])
    x1, y1, x2, y2 = map(float, box.xyxy[0])
    objects.append({
        "object_name": result.names[cls],
        "confidence": conf,
        "x1": x1,
        "y1": y1,
        "x2": x2,
        "y2": y2
    })

# Сохраняем JSON в файл
with open(output_path, 'w') as f:
    json.dump(objects, f)

print("Detection complete!")  # <- важно, чтобы stdout отработал

sys.exit(0)
