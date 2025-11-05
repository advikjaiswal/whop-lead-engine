#!/usr/bin/env python3
import sys
import os

print("=== RAILWAY STARTUP TEST ===")
print(f"Python version: {sys.version}")
print(f"Python executable: {sys.executable}")
print(f"Current working directory: {os.getcwd()}")
print(f"Environment: {os.environ.get('RAILWAY_ENVIRONMENT', 'unknown')}")
print(f"Port: {os.environ.get('PORT', 'not set')}")
print("=== BASIC IMPORTS TEST ===")

try:
    import fastapi
    print(f"✓ FastAPI version: {fastapi.__version__}")
except Exception as e:
    print(f"✗ FastAPI import failed: {e}")

try:
    import uvicorn
    print(f"✓ Uvicorn version: {uvicorn.__version__}")
except Exception as e:
    print(f"✗ Uvicorn import failed: {e}")

try:
    import sqlalchemy
    print(f"✓ SQLAlchemy version: {sqlalchemy.__version__}")
except Exception as e:
    print(f"✗ SQLAlchemy import failed: {e}")

try:
    import httpx
    print(f"✓ HTTPX version: {httpx.__version__}")
except Exception as e:
    print(f"✗ HTTPX import failed: {e}")

print("=== END TEST ===")
print("If you see this message, basic Python execution works!")