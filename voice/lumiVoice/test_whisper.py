import sounddevice as sd
import wave
import subprocess
import os

WHISPER_BIN = r"C:\lumiVoice\whisper\Release\whisper-cli.exe"
MODEL = r"C:\lumiVoice\models\ggml-tiny.en.bin"
TEST_WAV = r"C:\lumiVoice\test.wav"

# ---------------------------
# Record 3 seconds audio
# ---------------------------
def record_test():
    fs = 16000
    print("🎙 Say something... recording 3 seconds.")
    audio = sd.rec(int(3 * fs), samplerate=fs, channels=1, dtype='int16')
    sd.wait()

    with wave.open(TEST_WAV, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(fs)
        wf.writeframes(audio.tobytes())

    print("🎚 Saved:", TEST_WAV)

# ---------------------------
# Run Whisper on audio
# ---------------------------
def run_whisper():
    print("🧠 Running Whisper...")

    cmd = [
        WHISPER_BIN,
        "-m", MODEL,
        "-f", TEST_WAV,
        "-nt",      # no timestamps
        "-np"       # only text output
    ]

    result = subprocess.run(cmd, capture_output=True, text=True)

    print("\n===== RAW WHISPER OUTPUT =====")
    print(result.stdout)
    print("================================\n")

    text = result.stdout.strip()
    print("📝 Final transcription:", text)

# ---------------------------
# MAIN
# ---------------------------
record_test()
run_whisper()
