from google import genai
import os

# Configuration from snippet
PROJECT_ID = "qwiklabs-gcp-00-f9d2df93f295"
# LOCATION = "us-central1-b"
LOCATION = "global"

def verify_gcp_connection():
    """
    Verifies the connection to Google Cloud Vertex AI using the google-genai SDK.
    """
    print(f"--- GCP Connection Test ---")
    print(f"Project ID: {PROJECT_ID}")
    print(f"Location:   {LOCATION}")
    print(f"---------------------------\n")

    try:
        # Initialize the client with Vertex AI enabled
        client = genai.Client(vertexai=True, project=PROJECT_ID, location=LOCATION)
        
        print("Initialising client... Done.")
        print("Sending test request to Gemini...")

        # Perform a simple generation to verify the API key/credentials and project access
        response = client.models.generate_content(
            model="gemini-3.1-pro-preview",
            contents="Confirm the connection is working by saying 'GCP Connection Verified!'"
        )
        
        print("\nResponse from Gemini:")
        print(f"> {response.text.strip()}")
        print("\n[SUCCESS] Connection to GCP and Vertex AI is established.")

    except Exception as e:
        print(f"\n[ERROR] Connection failed: {e}")
        print("\nTroubleshooting steps:")
        print("1. Ensure you have installed the required library: pip install google-genai")
        print("2. Verify your GCP credentials: run 'gcloud auth application-default login'")
        print(f"3. Check if Project ID '{PROJECT_ID}' is correct and has Vertex AI API enabled.")

if __name__ == "__main__":
    verify_gcp_connection()
