# Handoff: Google Auth (OAuth) Implementation — For Use in Another Project

**Purpose:** This document describes everything implemented in the divideIt project related to **Google OAuth / Google Drive integration**. Use it as a prompt or reference for an agent in another project that needs to implement the same or similar flow.

**Important:** In this project, Google OAuth is used **for Google Drive API access** (upload/share files), **not for user login/sign-in**. The backend holds one set of OAuth credentials and a long-lived refresh token; the frontend only triggers the OAuth flow and calls backend APIs. There is no “Sign in with Google” for end users.

---

## 1. What Was Implemented

- **Backend:** OAuth2 flow (authorization URL, callback, token exchange), Google Drive API (upload, share, create folder) using `googleapis` and `google-auth-library`.
- **Frontend:** Status check, “Connect to Google Drive” (opens auth URL in popup), upload-segment and folder-name UI; all Drive operations go through the backend API.
- **Credentials:** Stored in backend `.env` (Client ID, Client Secret, Redirect URI, Refresh Token). Frontend has no secrets.

---

## 2. Backend Implementation

### 2.1 Dependencies

- `googleapis` (Drive API client)
- `google-auth-library` (OAuth2Client)

```json
"googleapis": "^171.3.0"
```

`google-auth-library` is a dependency of `googleapis`.

### 2.2 Environment Variables (Backend)

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_DRIVE_CLIENT_ID` | Yes | OAuth 2.0 Client ID from Google Cloud (e.g. `xxx.apps.googleusercontent.com`) |
| `GOOGLE_DRIVE_CLIENT_SECRET` | Yes | OAuth 2.0 Client Secret |
| `GOOGLE_DRIVE_REDIRECT_URI` | Yes (or default) | Callback URL; must match exactly the one in Google Console. Default: `http://localhost:3051/api/google-drive/oauth/callback` |
| `GOOGLE_DRIVE_REFRESH_TOKEN` | After first OAuth | Long-lived token obtained from the OAuth callback; used for API access without user interaction |

Example (development):

```env
GOOGLE_DRIVE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_DRIVE_CLIENT_SECRET=your_client_secret
GOOGLE_DRIVE_REDIRECT_URI=http://localhost:3051/api/google-drive/oauth/callback
GOOGLE_DRIVE_REFRESH_TOKEN=1//0g...
```

For Docker/internal, redirect may be different, e.g. `http://127.0.0.1:18081/api/google-drive/oauth/callback`.

### 2.3 Service Layer: `googleDriveService.ts`

- **Config interface:** `clientId`, `clientSecret`, `redirectUri`, optional `refreshToken`.
- **Initialization:** Creates `OAuth2Client` from `google-auth-library` and `google.drive({ version: 'v3', auth })` from `googleapis`. If `refreshToken` is provided, sets it on the client.
- **OAuth:**
  - `getAuthUrl()`: Builds authorization URL with scopes `https://www.googleapis.com/auth/drive.file` and `https://www.googleapis.com/auth/drive`, `access_type: 'offline'`, `prompt: 'consent'` so a refresh token is returned.
  - `getTokensFromCode(code)`: Exchanges authorization code for tokens; returns `accessToken` and `refreshToken`.
  - `setRefreshToken(refreshToken)`: Sets refresh token on the client (e.g. after first OAuth or when updating).
- **Auth before API calls:** Private `ensureAuthenticated()` calls `oauth2Client.getAccessToken()` so the client refreshes the access token when needed.
- **Drive operations:** `uploadFile`, `uploadFiles`, `shareFile`, `createFolder`, `listFiles`, `findOrCreateFolder`, plus helpers like `getDivideItRootFolder()`, `getVideoFolder(videoId)`, `getOrCreateFolderInDivideIt(folderName)`.

Scopes used:

- `https://www.googleapis.com/auth/drive.file` — access to files created by the app
- `https://www.googleapis.com/auth/drive` — broader Drive access (e.g. create folders, list)

### 2.4 Routes: `googleDriveRoutes.ts` (mounted at `/api/google-drive`)

- **Lazy init:** A function reads `GOOGLE_DRIVE_*` from `process.env` and calls `googleDriveService.initialize(...)` once when the first Drive endpoint is hit. If `GOOGLE_DRIVE_CLIENT_ID` or `GOOGLE_DRIVE_CLIENT_SECRET` are missing, Drive endpoints return 503 or indicate “not configured”.
- **Endpoints:**
  - `GET /api/google-drive/auth-url` — Returns `{ success, data: { authUrl } }`. Used by frontend to open Google sign-in in a popup/tab.
  - `GET /api/google-drive/oauth/callback?code=...` — Receives redirect from Google; exchanges `code` for tokens; returns JSON with `accessToken` and `refreshToken`. User (or dev) copies `refreshToken` into `.env` as `GOOGLE_DRIVE_REFRESH_TOKEN`.
  - `POST /api/google-drive/set-token` — Body: `{ refreshToken }`. Sets the refresh token on the in-memory service (useful for dev; in production the token usually comes from `.env` after restart).
  - `GET /api/google-drive/status` — Returns `{ initialized, configured, authenticated }` so frontend can show “Connect to Google Drive” when not authenticated.
  - `POST /api/google-drive/upload`, `POST /api/google-drive/upload-multiple`, `POST /api/google-drive/upload-segment`, `POST /api/google-drive/create-folder`, `POST /api/google-drive/share`, etc. — All require Drive to be initialized and authenticated; they delegate to `googleDriveService`.

Redirect URI must match exactly what is configured in Google Cloud Console (including scheme, host, port, path).

---

## 3. Frontend Implementation

### 3.1 API Client (`api.ts`)

- Base URL: `process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3051'`, with `/api` prefix.
- **Google Drive helpers:**
  - `getGoogleDriveStatus()` → `GET /api/google-drive/status` → returns `{ initialized, configured, authenticated }`.
  - `getGoogleDriveAuthUrl()` → `GET /api/google-drive/auth-url` → returns `authUrl` string.
  - `uploadSegmentToGoogleDrive(segmentPath, videoId?, folderId?, makePublic?, includeSummary?, includeTranscription?, folderName?)` → `POST /api/google-drive/upload-segment`.
  - Other helpers for upload, share, etc., as needed.

No tokens or secrets are stored on the frontend; the backend uses the refresh token from env.

### 3.2 UX Flow

1. **On load:** Call `getGoogleDriveStatus()`. If `!data.authenticated` (or not configured), show a “Connect to Google Drive” (or similar) message.
2. **Connect:** On “Connect” click, call `getGoogleDriveAuthUrl()`, then `window.open(authUrl, '_blank', 'width=600,height=700')`. User signs in with Google and authorizes; Google redirects to `GOOGLE_DRIVE_REDIRECT_URI` with `?code=...`. The backend callback page (or a simple HTML page that shows the JSON response) displays the result; user copies `refreshToken` into backend `.env` and restarts backend (or uses `set-token` for current process only).
3. **After token is set:** Frontend calls `getGoogleDriveStatus()` again (e.g. after a few seconds or on focus); when `authenticated: true`, show upload UI (folder name, “Upload to Google Drive”, etc.).
4. **Upload:** User enters folder name and triggers upload; frontend calls `uploadSegmentToGoogleDrive(...)` (or equivalent) for each segment or in batch, depending on backend API.

So: **frontend only obtains the auth URL and opens it; the backend owns the callback and stores the refresh token.**

---

## 4. OAuth Flow (Step-by-Step for Your Project)

1. **Google Cloud Console**
   - Create (or select) a project.
   - Enable **Google Drive API** (APIs & Services → Library → “Google Drive API” → Enable).
   - Configure OAuth consent screen (External, app name, support email, etc.).
   - Create OAuth 2.0 Client ID (Web application).
   - Add **Authorized redirect URI** exactly: e.g. `http://localhost:3051/api/google-drive/oauth/callback` (or your backend base URL + path). For production, add the production callback URL as well.
   - Copy **Client ID** and **Client Secret**.

2. **Backend**
   - Set in `.env`: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REDIRECT_URI` (must match the URI added in Console).
   - Start backend. No refresh token yet is OK for `auth-url` and `callback`.

3. **Get refresh token (one-time per app/user)**
   - Call `GET /api/google-drive/auth-url` (or open in browser). Copy `authUrl`.
   - Open `authUrl` in browser → sign in with Google → allow → redirect to callback with `?code=...`.
   - Backend callback exchanges `code` for tokens and returns `refreshToken` in JSON.
   - Put `refreshToken` in `.env` as `GOOGLE_DRIVE_REFRESH_TOKEN` and restart backend (or call `POST /api/google-drive/set-token` with body `{ refreshToken }`).

4. **Frontend**
   - Use `GET /api/google-drive/status` to know if Drive is configured and authenticated.
   - Use `GET /api/google-drive/auth-url` only to open the OAuth popup; do not store tokens on frontend.
   - All upload/share actions go through your backend; backend uses the stored refresh token and refreshes access tokens as needed.

---

## 5. Google Cloud Checklist (for the other project)

- [ ] Google Cloud project created/selected
- [ ] Google Drive API enabled
- [ ] OAuth consent screen configured (External if needed)
- [ ] OAuth 2.0 Client ID (Web application) created
- [ ] Authorized redirect URI added: **exactly** the backend callback URL (e.g. `http://localhost:3051/api/google-drive/oauth/callback`)
- [ ] Client ID and Client Secret in backend `.env`
- [ ] One-time OAuth flow completed and `GOOGLE_DRIVE_REFRESH_TOKEN` set in backend `.env`
- [ ] Backend restarted (or `set-token` called) so Drive is authenticated

---

## 6. Common Issues and Fixes

- **“Redirect URI mismatch”**  
  Redirect URI in Google Console must match exactly (including `http` vs `https`, host, port, path). No trailing slash unless you use it in the callback.

- **“Invalid client”**  
  Check Client ID and Client Secret in `.env`; no extra spaces or quotes.

- **No refresh token in response**  
  Use `access_type: 'offline'` and `prompt: 'consent'` when generating the auth URL so Google returns a refresh token.

- **“Google Drive service not configured” / 503**  
  Backend could not read `GOOGLE_DRIVE_CLIENT_ID` and `GOOGLE_DRIVE_CLIENT_SECRET` (e.g. wrong `.env` file or not loaded). Ensure the backend loads the same `.env` that contains these variables.

- **Docker/internal**  
  Use the same env vars inside the container; redirect URI must be the one the user’s browser is redirected to (e.g. `http://127.0.0.1:18081/api/google-drive/oauth/callback` if the backend is exposed on that port).

---

## 7. Security Notes (for the other project)

- Do not commit `.env` or any file containing Client Secret or Refresh Token.
- Keep Client Secret and Refresh Token server-side only; frontend must never see them.
- In production, use a production redirect URI and, if required, publish the OAuth consent screen and complete verification.
- Prefer different OAuth clients (or at least different refresh tokens) for development and production.

---

## 8. File Map (divideIt project)

- Backend: `backend/src/services/googleDriveService.ts`, `backend/src/routes/googleDriveRoutes.ts`, `backend/src/index.ts` (mounts routes at `/api/google-drive`).
- Frontend: `frontend/src/services/api.ts` (Google Drive methods), `frontend/src/components/GoogleDriveUpload.tsx`, `frontend/src/app/review/page.tsx` (status + auth URL + upload).
- Docs/setup: `docs/GOOGLE_SETUP_GUIDE.md`, `GET_REFRESH_TOKEN.md`, `GOOGLE_CREDENTIALS_CHECKLIST.md`, `HABILITAR_GOOGLE_DRIVE_API.md`, `FIX_REDIRECT_URI.md`, `.env.internal.example`, `scripts/check-google-env.sh`.

---

**Summary for the other agent:** Implement a backend service that uses Google OAuth2 (Client ID, Client Secret, Redirect URI) to obtain and store a refresh token; expose `auth-url` and `oauth/callback` endpoints; use the refresh token with `googleapis` to access Google Drive. Frontend only requests the auth URL and opens it; backend handles the callback and all Drive API calls. Env vars: `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REDIRECT_URI`, `GOOGLE_DRIVE_REFRESH_TOKEN`.
