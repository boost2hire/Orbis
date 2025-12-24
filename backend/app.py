
import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_socketio import SocketIO
from socket_events import register_socket_events


# load env
load_dotenv()
MIRROR_IP = os.getenv("MIRROR_IP", "127.0.0.1")
PORT = int(os.getenv("PORT", 5001))

# create app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# ---------------------------------------
# SERVE /captures FOLDER (FIX FOR PHONES)
# ---------------------------------------
CAPTURE_DIR = os.path.join(os.getcwd(), "captures")

@app.route("/captures/<path:filename>")
def serve_captures(filename):
    return send_from_directory(CAPTURE_DIR, filename)


# register blueprints
from weather_routes import weather_bp
from chat_routes import chat_bp
from outfit_images import images_bp
from qr_routes import qr_bp, gallery_bp
from photo_routes import photo_bp
from cleanup_photos import start_cleanup_thread


@app.route("/photo/from-ui", methods=["POST"])
def photo_from_ui():
    import base64, time, os
    from flask import request, jsonify

    data = request.json.get("image")

    if not data:
        return jsonify({"error": "No image"}), 400

    header, encoded = data.split(",", 1)
    img_bytes = base64.b64decode(encoded)

    os.makedirs("captures", exist_ok=True)
    filename = f"photo_{int(time.time())}.jpg"
    path = os.path.join("captures", filename)

    with open(path, "wb") as f:
        f.write(img_bytes)

    ip = os.getenv("MIRROR_IP", "127.0.0.1")
    port = int(os.getenv("PORT", 5001))
    url = f"http://{ip}:{port}/captures/{filename}"

    payload = {
        "type": "PHOTO",
        "file": filename,
        "url": url,
        "say": "Photo captured."
    }

    socketio.emit("voice_response", payload)
    return jsonify(payload)


start_cleanup_thread()

app.register_blueprint(weather_bp, url_prefix="/weather")
app.register_blueprint(chat_bp)
app.register_blueprint(images_bp, url_prefix="/outfit")
app.register_blueprint(qr_bp, url_prefix="/qr")
app.register_blueprint(gallery_bp)
app.register_blueprint(photo_bp, url_prefix="/photo")

# register intent router
from intent_router import register_intent_route
register_intent_route(app, socketio)
register_socket_events(socketio)


if __name__ == "__main__":
    print(f"🚀 Smart Mirror running at http://{MIRROR_IP}:{PORT}")
    socketio.run(app, host="0.0.0.0", port=PORT, debug=False)