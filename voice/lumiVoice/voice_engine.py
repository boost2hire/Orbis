"""
Lumi Voice Engine (Windows)
Porcupine wakeword -> record -> whisper-cli -> POST to backend
Place this file at C:\lumiVoice\voice_engine.py
"""

import os
import sys
import time
import wave
import struct
import subprocess
import requests
import sounddevice as sd
import pyttsx3
from dotenv import load_dotenv

load_dotenv()

# ----------------------------
# CONFIG
# ----------------------------
BACKEND_URL = "http://127.0.0.1:5001/voice/intent"

WHISPER_BIN = r"C:\Users\DELL\Desktop\orbis\voice\lumiVoice\whisper\Release\whisper-cli.exe"
WHISPER_MODEL = r"C:\Users\DELL\Desktop\orbis\voice\lumiVoice\models\ggml-tiny.en.bin"

WAKEWORD_FILE = r"C:\Users\DELL\Desktop\orbis\voice\lumiVoice\keywords\Hey-Lumi_en_windows_v3_0_0.ppn"
PICOVOICE_ACCESS_KEY = os.environ.get("PICOVOICE_ACCESS_KEY", "")

TEMP_WAV = r"C:\Users\DELL\Desktop\orbis\voice\lumiVoice\cmd.wav"
RECORD_SECONDS = 3.5  # Increased so your speech isn't cut off
AUDIO_DEVICE = None

PLAY_BEEP = True
ENABLE_TTS = True

# ----------------------------
# TTS
# ----------------------------
if ENABLE_TTS:
    tts_engine = pyttsx3.init()
    tts_engine.setProperty("rate", 165)
    tts_engine.setProperty("volume", 0.9)

def speak(text: str):
    if not text or not ENABLE_TTS:
        return
    try:
        tts_engine.say(text)
        tts_engine.runAndWait()
    except Exception:
        pass


# ----------------------------
# Beep feedback
# ----------------------------
def beep(freq=900, duration_ms=120):
    try:
        import winsound
        winsound.Beep(freq, duration_ms)
    except:
        pass


# ----------------------------
# Initialize Porcupine
# ----------------------------
import pvporcupine

PV_DIR = os.path.dirname(pvporcupine.__file__)
LIB_PATH = os.path.join(PV_DIR, "lib", "windows", "amd64", "libpv_porcupine.dll")
MODEL_PATH = r"C:\Users\DELL\Desktop\orbis\voice\lumiVoice\models\porcupine_params.pv"  # FIXED PATH

if not PICOVOICE_ACCESS_KEY:
    print("❌ PICOVOICE_ACCESS_KEY not set. Set it and restart CMD.")
    sys.exit(1)

try:
    porcupine = pvporcupine.create(
        access_key=PICOVOICE_ACCESS_KEY,
        library_path=LIB_PATH,
        model_path=MODEL_PATH,
        keyword_paths=[WAKEWORD_FILE],
        sensitivities=[0.65]
    )
    print("🔊 Porcupine loaded. Wake word ready.")
except Exception as e:
    print("❌ Failed to initialize Porcupine:\n", e)
    sys.exit(1)

frame_length = porcupine.frame_length
sample_rate = porcupine.sample_rate


# ----------------------------
# Record after wake
# ----------------------------
def record_after_wake(seconds=RECORD_SECONDS, out_wav=TEMP_WAV):
    print(f"🎤 Recording {seconds:.2f}s → {out_wav}")
    audio = sd.rec(
        int(seconds * sample_rate),
        samplerate=sample_rate,
        channels=1,
        dtype="int16",
        device=AUDIO_DEVICE
    )
    sd.wait()

    with wave.open(out_wav, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio.tobytes())

    return out_wav


# ----------------------------
# Whisper transcription
# ----------------------------
def run_whisper(wav_path):
    if not os.path.exists(WHISPER_BIN):
        print("❌ whisper-cli.exe not found:", WHISPER_BIN)
        return ""

    cmd = [
        WHISPER_BIN,
        "-m", WHISPER_MODEL,
        "-f", wav_path,
        "-nt",   # no timestamps
        "-np"    # only final text
    ]

    try:
        print("🧠 Running whisper:", " ".join(cmd))
        proc = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
        out = proc.stdout.strip()
        return out

    except subprocess.TimeoutExpired:
        print("❌ Whisper timed out.")
        return ""
    except Exception as e:
        print("❌ Whisper error:", e)
        return ""


# ----------------------------
# POST to backend
# ----------------------------
def post_to_backend(text):
    if not text.strip():
        return

    try:
        payload = {"text": text}
        print("📡 POST:", payload)

        r = requests.post(BACKEND_URL, json=payload, timeout=10)
        r.raise_for_status()

        print("🟢 Backend response:", r.json())
    except Exception as e:
        print("❌ Backend error:", e)
        speak("There was a problem talking to the mirror brain.")


# ----------------------------
# MAIN LOOP
# ----------------------------
def main_loop():
    print("\n🎙️ Lumi Voice Engine running — say: **Hey Lumi**\n")

    with sd.RawInputStream(
        samplerate=sample_rate,
        blocksize=frame_length,
        dtype="int16",
        channels=1,
        device=AUDIO_DEVICE
    ) as stream:

        while True:
            try:
                pcm_bytes = stream.read(frame_length)[0]
                pcm = struct.unpack_from("h" * frame_length, pcm_bytes)
            except Exception as e:
                print("⚠️ Audio read error:", e)
                continue

            try:
                result = porcupine.process(pcm)
            except Exception:
                continue

            if result >= 0:  # wake word detected
                print("\n🔔 Wake word detected!\n")

                if PLAY_BEEP:
                    beep()

                speak("Yes?")

                wav = record_after_wake(RECORD_SECONDS)
                text = run_whisper(wav)

                if text:
                    print("📝 Transcribed:", text)
                    post_to_backend(text)
                else:
                    print("⚠️ No transcription.")
                    speak("Please try again.")

                time.sleep(0.3)  # small cooldown


# ----------------------------
# Run engine
# ----------------------------
if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        print("\n👋 Exiting…")
    finally:
        porcupine.delete()
