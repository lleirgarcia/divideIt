#!/usr/bin/env node

/**
 * Script to list files in Google Drive
 */

require('dotenv').config();
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

async function listFiles() {
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;

  if (!clientId || !clientSecret || !refreshToken) {
    console.error('❌ Google Drive credentials not configured in .env');
    process.exit(1);
  }

  const oauth2Client = new OAuth2Client(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });

  const drive = google.drive({ version: 'v3', auth: oauth2Client });

  try {
    console.log('🔍 Searching for files in Google Drive...\n');

    // Search for divideIt folder
    const divideItQuery = "name='divideIt' and mimeType='application/vnd.google-apps.folder' and trashed=false";
    const divideItResponse = await drive.files.list({
      q: divideItQuery,
      fields: 'files(id, name)'
    });

    if (divideItResponse.data.files && divideItResponse.data.files.length > 0) {
      const divideItFolderId = divideItResponse.data.files[0].id;
      console.log(`✅ Found 'divideIt' folder: ${divideItFolderId}\n`);

      // List folders inside divideIt
      const foldersQuery = `'${divideItFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const foldersResponse = await drive.files.list({
        q: foldersQuery,
        fields: 'files(id, name)',
        orderBy: 'createdTime desc'
      });

      if (foldersResponse.data.files && foldersResponse.data.files.length > 0) {
        console.log(`📁 Found ${foldersResponse.data.files.length} video folders:\n`);
        
        for (const folder of foldersResponse.data.files) {
          console.log(`   📂 ${folder.name} (${folder.id})`);
          
          // List files in this folder
          const filesQuery = `'${folder.id}' in parents and trashed=false`;
          const filesResponse = await drive.files.list({
            q: filesQuery,
            fields: 'files(id, name, mimeType, size, webViewLink)',
            orderBy: 'name'
          });

          if (filesResponse.data.files && filesResponse.data.files.length > 0) {
            filesResponse.data.files.forEach(file => {
              const size = file.size ? `${(parseInt(file.size) / 1024 / 1024).toFixed(2)} MB` : 'N/A';
              const type = file.mimeType?.includes('video') ? '🎬' : file.mimeType?.includes('text') ? '📝' : '📄';
              console.log(`      ${type} ${file.name} (${size})`);
              if (file.webViewLink) {
                console.log(`         🔗 ${file.webViewLink}`);
              }
            });
          } else {
            console.log(`      (empty)`);
          }
          console.log('');
        }
      } else {
        console.log('   (no video folders found)');
      }
    } else {
      console.log('❌ No "divideIt" folder found in Google Drive');
      console.log('   The folder will be created when you upload your first segment.\n');
    }

    // Also list recent files in root
    console.log('\n📋 Recent files in Drive root (last 10):');
    const recentResponse = await drive.files.list({
      q: "trashed=false",
      fields: 'files(id, name, mimeType, createdTime)',
      orderBy: 'createdTime desc',
      pageSize: 10
    });

    if (recentResponse.data.files && recentResponse.data.files.length > 0) {
      recentResponse.data.files.forEach(file => {
        const date = new Date(file.createdTime || '').toLocaleString();
        console.log(`   ${file.name} - ${date}`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('API has not been used')) {
      console.error('\n⚠️  Google Drive API is not enabled!');
      console.error('   Enable it at: https://console.cloud.google.com/apis/library/drive.googleapis.com?project=590903768646');
    }
    process.exit(1);
  }
}

listFiles();
