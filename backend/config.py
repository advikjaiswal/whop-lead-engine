import os
import secrets

# Security setup
SECRET_KEY = os.getenv("JWT_SECRET", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

# Stripe
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "whsec_...")

# Ensure we have a strong secret key
if not os.getenv("JWT_SECRET"):
    print("WARNING: Using default generated secret key. Set JWT_SECRET environment variable in production!")
    print(f"Generated secret key: {SECRET_KEY}")
