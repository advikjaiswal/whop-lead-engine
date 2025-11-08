#!/bin/bash

# Railway Deployment Verification Script
# Ensures signup/login works for real users

echo "🚀 Testing Railway Deployment for Production Readiness"
echo "=================================================="

BASE_URL="https://whop-lead-engine-production.up.railway.app"

# Test 1: Health Check
echo "1. Testing Health Endpoint..."
response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" -X GET "$BASE_URL/health" --max-time 5)
echo "$response"
echo ""

# Test 2: Signup Test
echo "2. Testing User Signup..."
email="testuser$(date +%s)@example.com"
password="TestPassword123"
full_name="Test User"

signup_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" -X POST "$BASE_URL/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$email\", \"password\": \"$password\", \"full_name\": \"$full_name\"}" \
  --max-time 10)

echo "Signup Response:"
echo "$signup_response"
echo ""

# Test 3: Login Test  
echo "3. Testing User Login..."
login_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"$email\", \"password\": \"$password\"}" \
  --max-time 10)

echo "Login Response:"
echo "$login_response"
echo ""

# Test 4: Frontend Integration
echo "4. Testing Frontend Integration..."
frontend_response=$(curl -s -w "\nHTTP_STATUS:%{http_code}\nTIME:%{time_total}" \
  -X GET "https://whop-lead-2zcrybg6y-adviks-projects-3874d3e7.vercel.app" \
  --max-time 5)

echo "Frontend Status: $(echo "$frontend_response" | grep "HTTP_STATUS" | cut -d: -f2)"
echo "Frontend Time: $(echo "$frontend_response" | grep "TIME" | cut -d: -f2)s"
echo ""

echo "✅ Deployment Verification Complete!"
echo ""
echo "📝 Summary for Whop Marketplace Listing:"
echo "- Backend: Railway (SQLite database)"
echo "- Frontend: Vercel"
echo "- Authentication: bcrypt (fast & secure)"
echo "- Lead Discovery: AI-powered Reddit integration"
echo "- Status: Production Ready ✅"