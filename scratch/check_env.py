import os
import sys
from dotenv import load_dotenv

# Simulate the issue
print(f"Before load_dotenv: GEMINI_API_KEY={os.getenv('GEMINI_API_KEY')}")

# In the actual code, the import happens here
# from backend.services.gemini_service import gemini_service

load_dotenv("backend/.env")
print(f"After load_dotenv: GEMINI_API_KEY={os.getenv('GEMINI_API_KEY')}")
