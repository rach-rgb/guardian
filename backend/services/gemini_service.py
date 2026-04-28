import os
from google import genai
from typing import Optional
from dotenv import load_dotenv

class GeminiService:
    def __init__(self):
        load_dotenv() # Ensure .env is loaded
        self.project = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.api_key = os.getenv("GEMINI_API_KEY")
        
        # Initialize client based on available credentials
        if self.project:
            print(f"Initializing Gemini Client with Vertex AI (Project: {self.project}, Location: {self.location})")
            self.client = genai.Client(
                vertexai=True,
                project=self.project,
                location=self.location
            )
        elif self.api_key:
            print("Initializing Gemini Client with API Key")
            self.client = genai.Client(api_key=self.api_key)
        else:
            print("Warning: No Gemini credentials found. Service may fail.")
            self.client = None

    def generate_content(self, prompt: str):
        if not self.client:
            raise ValueError("Gemini client not initialized. Check credentials.")
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash", # Default model
            contents=prompt
        )
        return response.text

gemini_service = GeminiService()
