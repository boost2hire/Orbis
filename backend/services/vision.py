from groq import Groq
import base64
import cv2

client = Groq()

def cv2_to_data_url(img):
    # convert cv2 image → jpeg bytes → base64 data URL
    _, buf = cv2.imencode(".jpg", img)
    b64 = base64.b64encode(buf).decode("utf-8")
    return f"data:image/jpeg;base64,{b64}"

def describe_with_groq(img):
    data_url = cv2_to_data_url(img)

    response = client.chat.completions.create(
        model="llava-v1.5-7b",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Describe this image."},
                    {"type": "image_url", "image_url": {"url": data_url}}
                ]
            }
        ],
    )


    return response.choices[0].message["content"]
