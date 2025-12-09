import os
import requests

API_KEY = os.getenv("GROQ_API_KEY")
URL = "https://api.groq.com/openai/v1/chat/completions"

if not API_KEY:
    print("❌ Missing GROQ_API_KEY in environment")
    exit()

payload = {
    "model": "llama-3.1-8b-instant",
    "messages": [
        {"role": "user", "content": "Say only: OK"}
    ]
}

res = requests.post(
    URL,
    json=payload,
    headers={"Authorization": f"Bearer {API_KEY}"},
    timeout=10
)

print("STATUS:", res.status_code)
print("RESPONSE:", res.text)
