import os
import json
from google import genai
from typing import Optional
from dotenv import load_dotenv

CACHE_FILE = "gemini_cache.json"

class GeminiService:
    def __init__(self):
        load_dotenv() # Ensure .env is loaded
        self.project = os.getenv("GOOGLE_CLOUD_PROJECT")
        self.location = os.getenv("GOOGLE_CLOUD_LOCATION", "us-central1")
        self.api_key = os.getenv("GEMINI_API_KEY")
        self._cache = {}
        
        # Load cache from JSON file
        if os.path.exists(CACHE_FILE):
            try:
                with open(CACHE_FILE, "r", encoding="utf-8") as f:
                    self._cache = json.load(f)
            except Exception as e:
                print(f"Warning: Failed to load gemini cache: {e}")
        
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

    def _get_cache_key(self, input_data):
        if isinstance(input_data, str):
            return input_data
        elif isinstance(input_data, list):
            parts = []
            for item in input_data:
                if isinstance(item, str):
                    parts.append(item)
                else:
                    return None # Cannot cache complex objects easily
            return "||".join(parts)
        return None

    def generate_content(self, prompt: str):
        if not self.client:
            raise ValueError("Gemini client not initialized. Check credentials.")
            
        cache_key = self._get_cache_key(prompt)
        if cache_key and cache_key in self._cache:
            print("[DEBUG] Cache hit for generate_content")
            return self._cache[cache_key]
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        if cache_key:
            self._cache[cache_key] = response.text
            self._save_cache()
        return response.text

    def _save_cache(self):
        try:
            with open(CACHE_FILE, "w", encoding="utf-8") as f:
                json.dump(self._cache, f, ensure_ascii=False, indent=4)
        except Exception as e:
            print(f"Warning: Failed to save gemini cache: {e}")

    def generate_content_with_config(self, contents: list[genai.types.Part], config: genai.types.GenerateContentConfig):
        if not self.client:
            raise ValueError("Gemini client not initialized. Check credentials.")
        
        cache_key = self._get_cache_key(contents)
        if cache_key and cache_key in self._cache:
            print("[DEBUG] Cache hit for generate_content_with_config")
            return self._cache[cache_key]
        
        response = self.client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=config
        )
        if cache_key:
            self._cache[cache_key] = response.text
            self._save_cache()
        return response.text

gemini_service = GeminiService()
