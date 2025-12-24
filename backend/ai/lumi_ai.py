import os
import json
from dotenv import load_dotenv
from openai import OpenAI
from ai.lumi_prompt import LUMI_SYSTEM_PROMPT

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY missing")


client = OpenAI(api_key=OPENAI_API_KEY)


def lumi_think(user_text, image_base64=None):
    messages = [
        {
            "role": "system",
            "content": LUMI_SYSTEM_PROMPT
        },
        {
            "role": "user",
            "content": user_text
        }
    ]

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        temperature=0.4
    )

    output = response.choices[0].message.content.strip()

    # Try JSON (for alarms / actions), else return text
    try:
        return json.loads(output)
    except Exception:
        return output
