import os
from datetime import datetime
import cv2

# ---------------------------------------------------------
# Paths
# ---------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Store captures one level above this folder, inside /captures
CAPTURE_DIR = os.path.join(BASE_DIR, "..", "captures")
CAPTURE_DIR = os.path.abspath(CAPTURE_DIR)

# Ensure folder exists
os.makedirs(CAPTURE_DIR, exist_ok=True)


# ---------------------------------------------------------
# Generate Photo URL
# ---------------------------------------------------------
def photo_url(mirror_ip: str, port: int, filename: str) -> str:
    """
    Return the full public URL for a captured photo.
    """
    return f"http://{mirror_ip}:{port}/captures/{filename}"

def save_capture_frame(frame, prefix: str = "photo") -> str | None:
    """
    Saves a given OpenCV frame to the captures folder.
    Returns the filename, or None if saving fails.
    """
    if frame is None:
        print("❌ save_capture_frame: No frame provided.")
        return None

    try:
        timestamp = int(datetime.now().timestamp())
        fname = f"{prefix}_{timestamp}.jpg"
        full_path = os.path.join(CAPTURE_DIR, fname)

        # Write the image
        success = cv2.imwrite(full_path, frame)

        if not success:
            print("❌ Failed to save captured frame:", full_path)
            return None

        print("📸 Saved capture:", full_path)
        return fname

    except Exception as e:
        print("❌ Error saving capture:", e)
        return None
