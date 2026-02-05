#!/bin/bash

# Script to get Google Drive Refresh Token
# Make sure your backend server is running first!

echo "🔐 Google Drive Refresh Token Setup"
echo "===================================="
echo ""
echo "Step 1: Make sure your backend server is running"
echo "        (Run: npm run dev in the backend directory)"
echo ""
read -p "Press Enter when your backend is running..."

echo ""
echo "Step 2: Getting authorization URL..."
echo ""

# Get the auth URL
AUTH_URL=$(curl -s http://localhost:3051/api/google-drive/auth-url | grep -o '"authUrl":"[^"]*' | cut -d'"' -f4)

if [ -z "$AUTH_URL" ]; then
    echo "❌ Error: Could not get authorization URL"
    echo "   Make sure:"
    echo "   1. Backend server is running"
    echo "   2. GOOGLE_DRIVE_CLIENT_ID and GOOGLE_DRIVE_CLIENT_SECRET are set in .env"
    exit 1
fi

echo "✅ Authorization URL obtained!"
echo ""
echo "Step 3: Open this URL in your browser:"
echo ""
echo "$AUTH_URL"
echo ""
echo "Step 4: After authorizing, you'll be redirected to a URL like:"
echo "   http://localhost:3051/api/google-drive/oauth/callback?code=..."
echo ""
echo "Step 5: Copy the 'code' parameter from that URL"
echo ""
read -p "Paste the full callback URL here: " CALLBACK_URL

# Extract code from URL
CODE=$(echo "$CALLBACK_URL" | grep -o 'code=[^&]*' | cut -d'=' -f2)

if [ -z "$CODE" ]; then
    echo "❌ Error: Could not extract code from URL"
    echo "   Make sure you pasted the full callback URL"
    exit 1
fi

echo ""
echo "Step 6: Exchanging code for refresh token..."
echo ""

# Exchange code for tokens
RESPONSE=$(curl -s "http://localhost:3051/api/google-drive/oauth/callback?code=$CODE")

# Extract refresh token
REFRESH_TOKEN=$(echo "$RESPONSE" | grep -o '"refreshToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$REFRESH_TOKEN" ]; then
    echo "❌ Error: Could not get refresh token"
    echo "   Response: $RESPONSE"
    exit 1
fi

echo "✅ Success! Refresh token obtained:"
echo ""
echo "$REFRESH_TOKEN"
echo ""
echo "Step 7: Add this to your .env file:"
echo "   GOOGLE_DRIVE_REFRESH_TOKEN=$REFRESH_TOKEN"
echo ""
echo "Then restart your backend server."
