# backend/tts_engine.py
import pyttsx3
import threading

def speak_async(text: str):
    if not text:
        return

    def _speak():
        try:
            engine = pyttsx3.init()
            engine.setProperty("rate", 175)
            print("🔊 SPEAKING:", text)
            engine.say(text)
            engine.runAndWait()
            engine.stop()
        except Exception as e:
            print("❌ TTS ERROR:", e)

    threading.Thread(target=_speak, daemon=True).start()
