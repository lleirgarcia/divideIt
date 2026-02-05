import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { logger } from '../utils/logger';

export interface GoogleDriveConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  refreshToken?: string;
}

export interface UploadResult {
  fileId: string;
  webViewLink: string;
  webContentLink: string;
  name: string;
  mimeType: string;
  size: string;
}

export interface ShareResult {
  fileId: string;
  shareableLink: string;
  permissionId: string;
}

export class GoogleDriveService {
  private oauth2Client: OAuth2Client | null = null;
  private drive: ReturnType<typeof google.drive> | null = null;
  private config: GoogleDriveConfig | null = null;

  /**
   * Initialize Google Drive service with OAuth2 credentials
   */
  initialize(config: GoogleDriveConfig): void {
    this.config = config;
    this.oauth2Client = new OAuth2Client(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );

    // Set refresh token if available
    if (config.refreshToken) {
      this.oauth2Client.setCredentials({
        refresh_token: config.refreshToken
      });
    }

    this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
    logger.info('Google Drive service initialized');
  }

  /**
   * Check if service is initialized
   */
  isInitialized(): boolean {
    return this.oauth2Client !== null && this.drive !== null;
  }

  /**
   * Get OAuth2 authorization URL
   */
  getAuthUrl(): string {
    if (!this.oauth2Client) {
      throw new Error('Google Drive service not initialized');
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/drive'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent'
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getTokensFromCode(code: string): Promise<{ accessToken: string; refreshToken: string }> {
    if (!this.oauth2Client) {
      throw new Error('Google Drive service not initialized');
    }

    const { tokens } = await this.oauth2Client.getToken(code);
    
    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error('Failed to get tokens from authorization code');
    }

    this.oauth2Client.setCredentials(tokens);
    
    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token || ''
    };
  }

  /**
   * Set refresh token for authentication
   */
  setRefreshToken(refreshToken: string): void {
    if (!this.oauth2Client) {
      throw new Error('Google Drive service not initialized');
    }

    this.oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    // Update config
    if (this.config) {
      this.config.refreshToken = refreshToken;
    }
  }

  /**
   * Ensure OAuth2 client is authenticated
   */
  private async ensureAuthenticated(): Promise<void> {
    if (!this.oauth2Client) {
      throw new Error('Google Drive service not initialized');
    }

    if (!this.oauth2Client.credentials.refresh_token) {
      throw new Error('No refresh token available. Please authenticate first.');
    }

    // Refresh access token if needed
    try {
      await this.oauth2Client.getAccessToken();
    } catch (error) {
      logger.error('Failed to refresh access token:', error);
      throw new Error('Authentication failed. Please re-authenticate.');
    }
  }

  /**
   * Upload a file to Google Drive
   */
  async uploadFile(
    filePath: string,
    fileName?: string,
    folderId?: string,
    makePublic: boolean = false
  ): Promise<UploadResult> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.ensureAuthenticated();

    const fileStats = await fs.stat(filePath);
    const finalFileName = fileName || path.basename(filePath);

    logger.info(`Uploading file to Google Drive: ${finalFileName} (${fileStats.size} bytes)`);

    const fileMetadata: any = {
      name: finalFileName
    };

    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    // Use file stream instead of buffer for better memory efficiency
    const media = {
      mimeType: this.getMimeType(filePath),
      body: fsSync.createReadStream(filePath)
    };

    try {
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields: 'id, name, mimeType, size, webViewLink, webContentLink'
      });

      const file = response.data;
      
      if (!file.id) {
        throw new Error('File upload succeeded but no file ID returned');
      }

      logger.info(`File uploaded successfully: ${file.id}`);

      // Make file public if requested
      if (makePublic) {
        await this.shareFile(file.id, 'anyone', 'reader');
      }

      return {
        fileId: file.id,
        webViewLink: file.webViewLink || '',
        webContentLink: file.webContentLink || '',
        name: file.name || finalFileName,
        mimeType: file.mimeType || 'application/octet-stream',
        size: file.size || fileStats.size.toString()
      };
    } catch (error: any) {
      logger.error(`Failed to upload file to Google Drive: ${error.message}`);
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Share a file on Google Drive
   */
  async shareFile(
    fileId: string,
    type: 'user' | 'anyone' | 'domain',
    role: 'reader' | 'writer' | 'commenter',
    emailAddress?: string
  ): Promise<ShareResult> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.ensureAuthenticated();

    const permission: any = {
      type: type,
      role: role
    };

    if (type === 'user' && emailAddress) {
      permission.emailAddress = emailAddress;
    }

    try {
      const response = await this.drive.permissions.create({
        fileId: fileId,
        requestBody: permission,
        fields: 'id'
      });

      // Get shareable link
      const fileResponse = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink'
      });

      logger.info(`File shared successfully: ${fileId}`);

      return {
        fileId: fileId,
        shareableLink: fileResponse.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
        permissionId: response.data.id || ''
      };
    } catch (error: any) {
      logger.error(`Failed to share file: ${error.message}`);
      throw new Error(`Failed to share file: ${error.message}`);
    }
  }

  /**
   * Upload multiple files to Google Drive
   */
  async uploadFiles(
    filePaths: string[],
    folderId?: string,
    makePublic: boolean = false
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.uploadFile(filePath, undefined, folderId, makePublic);
        results.push(result);
      } catch (error: any) {
        logger.error(`Failed to upload ${filePath}: ${error.message}`);
        // Continue with other files even if one fails
      }
    }

    return results;
  }

  /**
   * Create a folder in Google Drive
   */
  async createFolder(folderName: string, parentFolderId?: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.ensureAuthenticated();

    const fileMetadata: any = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    try {
      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        fields: 'id'
      });

      if (!response.data.id) {
        throw new Error('Folder creation succeeded but no folder ID returned');
      }

      logger.info(`Folder created: ${folderName} (${response.data.id})`);
      return response.data.id;
    } catch (error: any) {
      logger.error(`Failed to create folder: ${error.message}`);
      throw new Error(`Failed to create folder: ${error.message}`);
    }
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeType(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes: Record<string, string> = {
      '.mp4': 'video/mp4',
      '.mov': 'video/quicktime',
      '.avi': 'video/x-msvideo',
      '.txt': 'text/plain',
      '.json': 'application/json',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.pdf': 'application/pdf'
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * List files in Google Drive
   */
  async listFiles(query?: string, maxResults: number = 10): Promise<any[]> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.ensureAuthenticated();

    try {
      const response = await this.drive.files.list({
        q: query,
        pageSize: maxResults,
        fields: 'files(id, name, mimeType, size, createdTime, webViewLink)'
      });

      return response.data.files || [];
    } catch (error: any) {
      logger.error(`Failed to list files: ${error.message}`);
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Find or create a folder by name in a parent folder
   */
  async findOrCreateFolder(folderName: string, parentFolderId?: string): Promise<string> {
    if (!this.drive) {
      throw new Error('Google Drive service not initialized');
    }

    await this.ensureAuthenticated();

    try {
      // Build query to find folder
      let query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      if (parentFolderId) {
        query += ` and '${parentFolderId}' in parents`;
      } else {
        query += ` and 'root' in parents`;
      }

      // Search for existing folder
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        pageSize: 1
      });

      if (response.data.files && response.data.files.length > 0) {
        const folderId = response.data.files[0].id;
        if (folderId) {
          logger.info(`Found existing folder: ${folderName} (${folderId})`);
          return folderId;
        }
      }

      // Folder doesn't exist, create it
      logger.info(`Creating folder: ${folderName}`);
      return await this.createFolder(folderName, parentFolderId);
    } catch (error: any) {
      logger.error(`Failed to find or create folder: ${error.message}`);
      throw new Error(`Failed to find or create folder: ${error.message}`);
    }
  }

  /**
   * Get or create the divideIt root folder in Google Drive
   */
  async getDivideItRootFolder(): Promise<string> {
    return await this.findOrCreateFolder('divideIt');
  }

  /**
   * Get or create a folder for a specific video in the divideIt root folder
   */
  async getVideoFolder(videoId: string): Promise<string> {
    const rootFolderId = await this.getDivideItRootFolder();
    return await this.findOrCreateFolder(videoId, rootFolderId);
  }

  /**
   * Get or create a folder with custom name under the divideIt root folder
   */
  async getOrCreateFolderInDivideIt(folderName: string): Promise<string> {
    const rootFolderId = await this.getDivideItRootFolder();
    return await this.findOrCreateFolder(folderName, rootFolderId);
  }
}

export const googleDriveService = new GoogleDriveService();
