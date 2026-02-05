#!/usr/bin/env node

/**
 * Script to upload existing video segments to Google Drive
 * Usage: node scripts/upload-existing-segments.js <videoId>
 */

require('dotenv').config();
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const API_URL = process.env.API_URL || 'http://localhost:3051';
const videoId = process.argv[2] || 'b656be5c-c17d-4ed4-9ba1-c7b43c2f1dd4';

async function uploadSegments() {
  console.log('🚀 Starting upload of existing segments to Google Drive\n');
  console.log(`Video ID: ${videoId}`);
  console.log(`API URL: ${API_URL}\n`);

  try {
    // Get list of segment files
    const processedDir = path.join(process.cwd(), 'processed', videoId);
    const files = await fs.readdir(processedDir);
    
    // Filter only final video files (not _original_no_title)
    const videoFiles = files.filter(file => 
      file.endsWith('.mp4') && !file.includes('_original_no_title')
    ).sort();

    console.log(`📁 Found ${videoFiles.length} video segments:\n`);
    videoFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file}`);
    });
    console.log('');

    if (videoFiles.length === 0) {
      console.log('❌ No video segments found to upload');
      process.exit(1);
    }

    // Upload each segment
    const results = [];
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < videoFiles.length; i++) {
      const filename = videoFiles[i];
      console.log(`\n📤 Uploading ${i + 1}/${videoFiles.length}: ${filename}...`);

      try {
        const response = await axios.post(
          `${API_URL}/api/google-drive/upload-segment`,
          {
            segmentPath: filename,
            videoId: videoId,
            makePublic: true,
            includeSummary: true,
            includeTranscription: false
          }
        );

        if (response.data.success) {
          successCount++;
          const data = response.data.data;
          console.log(`   ✅ Uploaded successfully!`);
          console.log(`   📹 Video: ${data.video.upload.name}`);
          console.log(`   🔗 Link: ${data.video.upload.webViewLink}`);
          
          if (data.summary) {
            console.log(`   📝 Summary: ${data.summary.upload.name}`);
          }

          results.push({
            filename,
            success: true,
            videoLink: data.video.upload.webViewLink,
            videoId: data.video.upload.fileId
          });
        } else {
          failCount++;
          console.log(`   ❌ Failed: ${response.data.error?.message || 'Unknown error'}`);
          results.push({
            filename,
            success: false,
            error: response.data.error?.message || 'Unknown error'
          });
        }
      } catch (error) {
        failCount++;
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.log(`   ❌ Error: ${errorMsg}`);
        results.push({
          filename,
          success: false,
          error: errorMsg
        });
      }

      // Small delay between uploads to avoid rate limiting
      if (i < videoFiles.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 Upload Summary');
    console.log('='.repeat(60));
    console.log(`✅ Successful: ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);
    console.log(`📁 Total: ${videoFiles.length}`);
    console.log('');

    if (successCount > 0) {
      console.log('✅ Successfully uploaded segments:');
      results.filter(r => r.success).forEach(r => {
        console.log(`   - ${r.filename}`);
        console.log(`     ${r.videoLink}`);
      });
    }

    if (failCount > 0) {
      console.log('\n❌ Failed uploads:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`   - ${r.filename}: ${r.error}`);
      });
    }

    console.log('\n🎉 Upload process completed!');
    console.log(`\n📂 Check your Google Drive: divideIt/${videoId}/`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Run the script
uploadSegments().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
