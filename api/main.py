#!/usr/bin/env python3
"""
Vercel serverless API for Whop Lead Engine
This is a simplified version that works on Vercel's serverless platform
"""
import sys
import os
import json
from typing import Dict, Any

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Simple health check endpoint
def health(request_data: Dict[str, Any] = None) -> Dict[str, Any]:
    """Health check endpoint"""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "environment": "production",
        "platform": "vercel",
        "database": "sqlite-memory"
    }

# Simple auth endpoint
def auth_signup(request_data: Dict[str, Any]) -> Dict[str, Any]:
    """Simplified signup endpoint"""
    try:
        data = request_data.get('body', {})
        if isinstance(data, str):
            data = json.loads(data)
        
        email = data.get('email')
        password = data.get('password')
        full_name = data.get('full_name', data.get('fullName', ''))
        
        if not email or not password:
            return {
                "status": 422,
                "error": "Missing email or password"
            }
        
        # Generate a simple token
        import hashlib
        import time
        token_data = f"{email}:{time.time()}"
        token = hashlib.sha256(token_data.encode()).hexdigest()
        
        return {
            "status": 201,
            "data": {
                "access_token": token,
                "user": {
                    "email": email,
                    "full_name": full_name,
                    "id": abs(hash(email)) % 10000
                }
            }
        }
    except Exception as e:
        return {
            "status": 500,
            "error": str(e)
        }

# Route handler for Vercel
def handler(event, context):
    """Main Vercel handler"""
    try:
        # Get request info
        http_method = event.get('httpMethod', event.get('requestContext', {}).get('http', {}).get('method', 'GET'))
        path = event.get('path', event.get('rawPath', '/'))
        
        # Route requests
        if path == '/health':
            result = health()
        elif path == '/api/auth/signup' and http_method == 'POST':
            result = auth_signup(event)
        else:
            result = {
                "status": 404,
                "error": "Not found",
                "available_endpoints": ["/health", "/api/auth/signup"]
            }
        
        # Format response
        status_code = result.pop('status', 200)
        
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            })
        }

# For local testing
if __name__ == "__main__":
    test_event = {
        'httpMethod': 'GET',
        'path': '/health'
    }
    print(json.dumps(handler(test_event, {}), indent=2))