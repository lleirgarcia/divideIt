# Google Drive Credentials - Quick Checklist

## What You Need (4 Items)

| Item | Where to Get It | Example |
|------|----------------|---------|
| **1. Client ID** | Google Cloud Console → Credentials → OAuth Client | `123456789-abc.apps.googleusercontent.com` |
| **2. Client Secret** | Same place (shown only once!) | `GOCSPX-abcdefghijklmnop` |
| **3. Redirect URI** | You set this (standard value) | `http://localhost:3051/api/google-drive/oauth/callback` |
| **4. Refresh Token** | After OAuth flow completes | `1//0gabcdefghijklmnop...` |

---

## Quick Steps

### 1. Google Cloud Console Setup
- [ ] Go to https://console.cloud.google.com/
- [ ] Create new project (or use existing)
- [ ] Enable "Google Drive API"
- [ ] Create OAuth 2.0 Client ID (Web application)
- [ ] Add redirect URI: `http://localhost:3051/api/google-drive/oauth/callback`
- [ ] Copy **Client ID** and **Client Secret**

### 2. Get Refresh Token
- [ ] Add Client ID & Secret to `.env`
- [ ] Start backend server
- [ ] Visit: `http://localhost:3051/api/google-drive/auth-url`
- [ ] Copy the `authUrl` and open in browser
- [ ] Sign in with Google account
- [ ] Allow permissions
- [ ] Copy `refreshToken` from callback response

### 3. Final Configuration
- [ ] Add all 4 values to `.env`:
  ```env
  GOOGLE_DRIVE_CLIENT_ID=your_client_id
  GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
  GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
  GOOGLE_DRIVE_REFRESH_TOKEN=your_refresh_token
  ```
- [ ] Restart backend server

---

## Where to Find Each Item

### Client ID & Client Secret
1. https://console.cloud.google.com/
2. **APIs & Services** → **Credentials**
3. Click your OAuth 2.0 Client ID
4. Copy **Client ID** and **Client Secret**

### Refresh Token
1. After setting up Client ID/Secret
2. Visit: `http://localhost:3051/api/google-drive/auth-url`
3. Open the `authUrl` in browser
4. Complete OAuth flow
5. Copy `refreshToken` from response

---

## Common Issues

**"Redirect URI mismatch"**
→ Check redirect URI matches exactly in Google Console

**"Client Secret not visible"**
→ It's only shown once - create new OAuth client if lost

**"No refresh token"**
→ Make sure to use `prompt=consent` in OAuth URL

---

## Full Guide

For detailed step-by-step instructions, see:
**`docs/GOOGLE_SETUP_GUIDE.md`**
