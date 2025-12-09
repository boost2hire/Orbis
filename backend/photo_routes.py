from flask import Blueprint, jsonify
import os

photo_bp = Blueprint("photo", __name__)

CAPTURE_DIR = "captures"

# --------------------------------------
# ✅ Return the last taken photo
# --------------------------------------
@photo_bp.route("/last-photo", methods=["GET"])
def last_photo():
    if not os.path.exists(CAPTURE_DIR):
        return jsonify({"file": None})

    files = [f for f in os.listdir(CAPTURE_DIR) if f.lower().endswith(".jpg")]

    if not files:
        return jsonify({"file": None})

    # Sort newest last
    files.sort()
    return jsonify({"file": files[-1]})


# --------------------------------------
# ✅ Return ALL photos
# --------------------------------------
@photo_bp.route("/all", methods=["GET"])
def all_photos():
    if not os.path.exists(CAPTURE_DIR):
        return jsonify({"photos": []})

    files = [f for f in os.listdir(CAPTURE_DIR) if f.lower().endswith(".jpg")]

    files.sort()  # newest last

    return jsonify({"photos": files})
