import urllib.request
import json
import base64

try:
    url = "http://127.0.0.1:8000/wakeup"
    data = json.dumps({
        "audio_base64": "UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=",
        "mime_type": "audio/webm"
    }).encode("utf-8")
    
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    response = urllib.request.urlopen(req)
    print("Status:", response.status)
    print("Response:", response.read().decode("utf-8"))
except Exception as e:
    print("Error:", str(e))
