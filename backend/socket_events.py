# socket_events.py
from flask_socketio import SocketIO
import pyttsx3
import threading

engine = pyttsx3.init()
engine.setProperty("rate", 175)

def speak_async(text: str):
    def _speak():
        if text:
            print("🔊 SPEAKING:", text)
            engine.say(text)
            engine.runAndWait()

    threading.Thread(target=_speak, daemon=True).start()


def register_socket_events(socketio: SocketIO):

    @socketio.on("wake_word")
    def on_wake_word(data):
        print("🔔 Wake word received:", data)

    @socketio.on("voice_text")
    def on_voice_text(data):
        print("📝 Voice text:", data)

    # 🔥 THIS IS THE ONLY PLACE VOICE IS SPOKEN
    @socketio.on("voice_response")
    def on_voice_response(data):
        print("🤖 Voice response received:", data)
        speak_async(data.get("say"))
