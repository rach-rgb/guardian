import sys
sys.path.append('backend')
import base64
from dotenv import load_dotenv
load_dotenv('backend/.env')
from services.gemini_service import gemini_service
from google.genai import types

audio_base64 = "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA="
audio_bytes = base64.b64decode(audio_base64)

try:
    response = gemini_service.client.models.generate_content(
        model="gemini-1.5-pro",
        contents=[
            types.Part.from_bytes(data=audio_bytes, mime_type="audio/webm"),
            "Hello"
        ]
    )
    print("Success:", response.text)
except Exception as e:
    import traceback
    traceback.print_exc()
