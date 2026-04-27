import sys
import os
import importlib.util

def check_package(package_name):
    spec = importlib.util.find_spec(package_name)
    if spec is None:
        print(f"[-] {package_name} is NOT installed.")
        return False
    else:
        print(f"[+] {package_name} is installed.")
        return True

def main():
    print("--- Backend Environment Check ---")
    
    # Check Python version
    print(f"[*] Python Version: {sys.version}")
    
    # Check dependencies
    packages = ["fastapi", "uvicorn", "google.genai", "yfinance", "pydantic"]
    all_installed = True
    for pkg in packages:
        if not check_package(pkg):
            all_installed = False
            
    # Check environment variables and .env file
    print("\n--- Environment Variables & .env ---")
    # Get the root directory (parent of the 'scripts' directory)
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_file_path = os.path.join(base_dir, "backend", ".env")
    if os.path.exists(env_file_path):
        print(f"[+] .env file found at {env_file_path}")
        try:
            from dotenv import load_dotenv
            load_dotenv(env_file_path)
            print("[+] Loaded environment variables from .env")
        except ImportError:
            print("[-] 'python-dotenv' not installed. Could not load .env file.")
    else:
        print(f"[-] .env file NOT found at {env_file_path}")

    vars_to_check = ["GOOGLE_CLOUD_PROJECT", "GOOGLE_CLOUD_LOCATION", "GEMINI_API_KEY"]
    for var in vars_to_check:
        val = os.getenv(var)
        if val:
            print(f"[+] {var} is set.")
        else:
            print(f"[-] {var} is NOT set.")

    if all_installed:
        print("\n[SUCCESS] Backend environment seems correctly configured.")
    else:
        print("\n[ERROR] Some dependencies are missing. Run 'pip install fastapi uvicorn google-genai yfinance'.")

if __name__ == "__main__":
    main()
