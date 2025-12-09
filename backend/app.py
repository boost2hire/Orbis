import os
from dotenv import load_dotenv
from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO


# load env
load_dotenv()
MIRROR_IP = os.getenv("MIRROR_IP", "127.0.0.1")
PORT = int(os.getenv("PORT", 5001))


# create app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
socketio = SocketIO(app, cors_allowed_origins="*")


# register blueprints (these files are provided below)
from weather_routes import weather_bp
from chat_routes import chat_bp
from outfit_images import images_bp
from qr_routes import qr_bp, gallery_bp
from photo_routes import photo_bp
from cleanup_photos import start_cleanup_thread


start_cleanup_thread()
app.register_blueprint(weather_bp, url_prefix="/weather")
app.register_blueprint(chat_bp)
app.register_blueprint(images_bp, url_prefix="/outfit")
app.register_blueprint(qr_bp, url_prefix="/qr")
app.register_blueprint(gallery_bp)
app.register_blueprint(photo_bp, url_prefix="/photo")


# register intent router (which uses services/)
from intent_router import register_intent_route
register_intent_route(app, socketio)


if __name__ == "__main__":
    print(f"🚀 Smart Mirror running at http://{MIRROR_IP}:{PORT}")
    socketio.run(app, host="0.0.0.0", port=PORT, debug=True)