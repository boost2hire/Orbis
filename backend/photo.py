import cv2
import os
import time
import threading

# ------------------------------
# GLOBAL CAMERA + LOCK
# ------------------------------
cap = None
lock = threading.Lock()   # Prevents two processes using camera at once (important)

# ------------------------------
# GET CAMERA INSTANCE (AUTO FIX)
# ------------------------------
def get_camera():
    global cap

    if cap is None or not cap.isOpened():
        print("🔄 Opening webcam...")
        cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)

        # Set stable capture settings
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)
        cap.set(cv2.CAP_PROP_FPS, 30)

        if not cap.isOpened():
            raise RuntimeError("❌ Camera could not be opened")

        print("✅ Webcam initialized")

    return cap


# ------------------------------
# READ CLEAN FRAME (FIX BLACK PHOTOS)
# ------------------------------
def read_clean_frame(cam):
    # Warm-up (exposure fix)
    for _ in range(5):
        cam.read()

    ret, frame = cam.read()
    if not ret:
        raise RuntimeError("❌ Failed to read frame from camera")

    return frame


# ------------------------------
# CAPTURE PHOTO
# ------------------------------
def capture_photo():
    with lock:  # 🔒 ensure camera is not in use by another process
        cam = get_camera()

        frame = read_clean_frame(cam)

        save_dir = "captures"
        os.makedirs(save_dir, exist_ok=True)

        filename = f"photo_{int(time.time())}.jpg"
        filepath = os.path.join(save_dir, filename)

        # Save with high-quality JPEG
        cv2.imwrite(filepath, frame, [cv2.IMWRITE_JPEG_QUALITY, 95])

        print(f"📸 Photo saved: {filepath}")
        return filename


# ------------------------------
# OPTIONAL CLEANUP
# ------------------------------
def release_camera():
    global cap
    if cap and cap.isOpened():
        cap.release()
        print("🔌 Camera released")
