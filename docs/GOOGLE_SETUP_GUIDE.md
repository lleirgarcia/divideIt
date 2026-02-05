# Google Drive Setup - What You Need from Google

This guide walks you through exactly what you need to get from Google to enable Google Drive integration.

## What You Need

You need **4 pieces of information** from Google:

1. ✅ **Client ID** - Identifies your application
2. ✅ **Client Secret** - Secret key for your application
3. ✅ **Redirect URI** - Where Google sends users after authentication
4. ✅ **Refresh Token** - Long-lived token for API access (obtained after OAuth flow)

---

## Step-by-Step Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown at the top
3. Click **"New Project"**
4. Enter a project name (e.g., "divideIt Drive Integration")
5. Click **"Create"**
6. Select your new project from the dropdown

**✅ You now have:** A Google Cloud Project

---

### Step 2: Enable Google Drive API

1. In Google Cloud Console, go to **"APIs & Services"** → **"Library"**
2. Search for **"Google Drive API"**
3. Click on **"Google Drive API"**
4. Click **"Enable"**
5. Wait for it to enable (usually takes a few seconds)

**✅ You now have:** Google Drive API enabled

---

### Step 3: Create OAuth 2.0 Credentials

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** at the top
3. Select **"OAuth client ID"**

#### First Time Setup (OAuth Consent Screen)

If this is your first time, you'll need to configure the OAuth consent screen:

1. Click **"Configure Consent Screen"**
2. Choose **"External"** (unless you have a Google Workspace account)
3. Click **"Create"**
4. Fill in the required fields:
   - **App name:** divideIt (or your app name)
   - **User support email:** Your email
   - **Developer contact information:** Your email
5. Click **"Save and Continue"**
6. On **Scopes** page, click **"Save and Continue"** (no need to add scopes manually)
7. On **Test users** page, click **"Save and Continue"** (you can add yourself later if needed)
8. Click **"Back to Dashboard"**

#### Create OAuth Client ID

1. Go back to **"Credentials"** → **"+ CREATE CREDENTIALS"** → **"OAuth client ID"**
2. Select **"Web application"** as the application type
3. Give it a name: **"divideIt Drive Integration"**
4. Under **"Authorized redirect URIs"**, click **"+ ADD URI"**
5. Add this URI:
   ```
   http://localhost:3051/api/google-drive/oauth/callback
   ```
   (For production, you'll add your production URL here too)
6. Click **"Create"**

**✅ You now have:**
- **Client ID** (looks like: `123456789-abcdefghijklmnop.apps.googleusercontent.com`)
- **Client Secret** (looks like: `GOCSPX-abcdefghijklmnopqrstuvwxyz`)

**⚠️ IMPORTANT:** Copy these immediately! The Client Secret is only shown once.

---

### Step 4: Get Refresh Token

This is the final step to get long-term access.

#### Option A: Using the API Endpoint (Easiest)

1. **Start your backend server** with the Client ID and Client Secret in `.env`:
   ```env
   GOOGLE_DRIVE_CLIENT_ID=your_client_id_here
   GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret_here
   GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
   ```

2. **Get the authorization URL:**
   - Visit: `http://localhost:3051/api/google-drive/auth-url`
   - Or use curl:
     ```bash
     curl http://localhost:3051/api/google-drive/auth-url
     ```
   - Copy the `authUrl` from the response

3. **Open the authorization URL** in your browser
   - You'll see a Google sign-in page
   - Sign in with your Google account
   - Click **"Allow"** to grant permissions

4. **Get the authorization code:**
   - After allowing, you'll be redirected to a URL like:
     ```
     http://localhost:3051/api/google-drive/oauth/callback?code=4/0AeanS...
     ```
   - Copy the `code` parameter from the URL

5. **Exchange code for tokens:**
   - Visit the callback URL directly (or use the code):
     ```
     http://localhost:3051/api/google-drive/oauth/callback?code=YOUR_CODE_HERE
     ```
   - The response will contain:
     ```json
     {
       "success": true,
       "data": {
         "accessToken": "...",
         "refreshToken": "1//0gabcdefghijklmnopqrstuvwxyz...",
         "message": "Authentication successful..."
       }
     }
     ```

6. **Copy the refreshToken** and add it to your `.env`:
   ```env
   GOOGLE_DRIVE_REFRESH_TOKEN=1//0gabcdefghijklmnopqrstuvwxyz...
   ```

#### Option B: Manual OAuth Flow

1. Construct the authorization URL manually:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
   client_id=YOUR_CLIENT_ID&
   redirect_uri=http://localhost:3051/api/google-drive/oauth/callback&
   response_type=code&
   scope=https://www.googleapis.com/auth/drive.file%20https://www.googleapis.com/auth/drive&
   access_type=offline&
   prompt=consent
   ```
   (Replace `YOUR_CLIENT_ID` with your actual Client ID)

2. Open this URL in your browser
3. Sign in and authorize
4. Copy the `code` from the redirect URL
5. Exchange it using the callback endpoint (as in Option A)

**✅ You now have:** Refresh Token

---

## Final Configuration

Add all four values to your backend `.env` file:

```env
# Google Drive Integration
GOOGLE_DRIVE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
GOOGLE_DRIVE_REFRESH_TOKEN=1//0gabcdefghijklmnopqrstuvwxyz...
```

**Restart your backend server** after adding these values.

---

## Summary Checklist

- [ ] Google Cloud Project created
- [ ] Google Drive API enabled
- [ ] OAuth Consent Screen configured
- [ ] OAuth Client ID created (Web application)
- [ ] Redirect URI added: `http://localhost:3051/api/google-drive/oauth/callback`
- [ ] Client ID copied
- [ ] Client Secret copied
- [ ] OAuth flow completed
- [ ] Refresh Token obtained
- [ ] All values added to `.env` file
- [ ] Backend server restarted

---

## Troubleshooting

### "Redirect URI mismatch"
- Make sure the redirect URI in Google Console exactly matches: `http://localhost:3051/api/google-drive/oauth/callback`
- Check for trailing slashes or typos

### "Invalid client"
- Verify Client ID and Client Secret are correct
- Make sure there are no extra spaces in `.env` file

### "Access blocked"
- Make sure OAuth Consent Screen is configured
- If testing, add your email as a test user in OAuth Consent Screen

### "Refresh token not found"
- Make sure you used `prompt=consent` in the OAuth URL
- You may need to revoke access and re-authenticate

### Can't see Client Secret
- Client Secret is only shown once when created
- If lost, delete the OAuth client and create a new one

---

## Production Setup

For production, you'll need to:

1. **Add production redirect URI** in Google Console:
   ```
   https://yourdomain.com/api/google-drive/oauth/callback
   ```

2. **Publish OAuth Consent Screen** (if using External user type):
   - Go to OAuth Consent Screen
   - Click "Publish App"
   - Complete verification if required

3. **Update `.env`** with production redirect URI

---

## Security Notes

- ⚠️ **Never commit** `.env` file to version control
- ⚠️ **Keep Client Secret** secure
- ⚠️ **Refresh Token** provides long-term access - keep it secure
- ✅ Use different credentials for development and production
- ✅ Regularly rotate credentials if compromised

---

## Need Help?

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Drive API Documentation](https://developers.google.com/drive/api)
- Check backend logs for detailed error messages
