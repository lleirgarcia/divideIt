#!/usr/bin/env node

/**
 * Script to upload ALL processed videos from /processed directory to Google Drive
 * Uploads all video segments (final versions with title) and their summary.txt files
 * 
 * Usage: node scripts/upload-all-processed-videos.js
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3051';

async function getAllVideoFolders() {
  const processedDir = path.join(process.cwd(), 'processed');
  
  try {
    const entries = await fs.readdir(processedDir, { withFileTypes: true });
    const folders = entries
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name);
    
    return folders;
  } catch (error) {
    console.error('❌ Error reading processed directory:', error.message);
    return [];
  }
}

async function getVideoSegments(videoId) {
  const videoDir = path.join(process.cwd(), 'processed', videoId);
  
  try {
    const files = await fs.readdir(videoDir);
    // Filter only final video files (not _original_no_title)
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') && !file.includes('_original_no_title')
    ).sort();
    
    return videoFiles;
  } catch (error) {
    console.error(`❌ Error reading video directory ${videoId}:`, error.message);
    return [];
  }
}

async function uploadSegment(videoId, filename) {
  try {
    const response = await axios.post(
      `${API_URL}/api/google-drive/upload-segment`,
      {
        segmentPath: filename,
        videoId: videoId,
        makePublic: true,
        includeSummary: true,
        includeTranscription: false
      },
      { timeout: 120000 } // 2 minutes timeout for large files
    );

    return {
      success: true,
      filename,
      data: response.data.data
    };
  } catch (error) {
    return {
      success: false,
      filename,
      error: error.response?.data?.error?.message || error.message
    };
  }
}

async function uploadAllVideos() {
  console.log('🚀 Starting upload of ALL processed videos to Google Drive\n');
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Get all video folders
    const videoFolders = await getAllVideoFolders();
    
    if (videoFolders.length === 0) {
      console.log('❌ No processed videos found in /processed directory');
      return;
    }

    console.log(`📁 Found ${videoFolders.length} video folder(s):\n`);
    videoFolders.forEach((folder, index) => {
      console.log(`   ${index + 1}. ${folder}`);
    });
    console.log('');

    let totalUploaded = 0;
    let totalFailed = 0;
    const results = {};

    // Process each video folder
    for (let i = 0; i < videoFolders.length; i++) {
      const videoId = videoFolders[i];
      console.log(`\n${'='.repeat(60)}`);
      console.log(`📂 Processing video: ${videoId} (${i + 1}/${videoFolders.length})`);
      console.log('='.repeat(60));

      const segments = await getVideoSegments(videoId);
      
      if (segments.length === 0) {
        console.log(`   ⚠️  No video segments found in this folder`);
        continue;
      }

      console.log(`   📹 Found ${segments.length} segment(s)\n`);

      results[videoId] = {
        segments: [],
        uploaded: 0,
        failed: 0
      };

      // Upload each segment
      for (let j = 0; j < segments.length; j++) {
        const filename = segments[j];
        console.log(`   📤 Uploading ${j + 1}/${segments.length}: ${filename}...`);

        const result = await uploadSegment(videoId, filename);
        
        if (result.success) {
          totalUploaded++;
          results[videoId].uploaded++;
          results[videoId].segments.push({
            filename,
            success: true,
            videoLink: result.data.video.upload.webViewLink
          });
          console.log(`      ✅ Uploaded successfully!`);
          console.log(`      🔗 ${result.data.video.upload.webViewLink}`);
        } else {
          totalFailed++;
          results[videoId].failed++;
          results[videoId].segments.push({
            filename,
            success: false,
            error: result.error
          });
          console.log(`      ❌ Failed: ${result.error}`);
        }

        // Small delay between uploads
        if (j < segments.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      console.log(`\n   ✅ Video ${videoId}: ${results[videoId].uploaded} uploaded, ${results[videoId].failed} failed`);
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`📁 Videos processed: ${videoFolders.length}`);
    console.log(`✅ Total segments uploaded: ${totalUploaded}`);
    console.log(`❌ Total segments failed: ${totalFailed}`);
    console.log('');

    // Detailed results per video
    for (const [videoId, result] of Object.entries(results)) {
      if (result.uploaded > 0) {
        console.log(`✅ ${videoId}: ${result.uploaded} segment(s) uploaded`);
      }
      if (result.failed > 0) {
        console.log(`❌ ${videoId}: ${result.failed} segment(s) failed`);
      }
    }

    console.log('\n🎉 Upload process completed!');
    console.log(`\n📂 Check your Google Drive: divideIt/`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
uploadAllVideos().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
