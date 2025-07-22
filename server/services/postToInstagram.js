const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config()

// Sleep helper for polling
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Upload a reel to both Instagram and Facebook Page
 * @param {string} videoPath - Local file path or a public video URL
 * @param {string} caption - Caption for the reel
 */
async function postReelToInstagramAndFacebook(videoPath, caption) {
  const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
  const IG_ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
  const FB_PAGE_ID = process.env.FB_PAGE_ID;
  const FB_PAGE_ACCESS_TOKEN = process.env.FB_PAGE_ACCESS_TOKEN;

  try {
    // ---------- Instagram Reel Posting ----------
    console.log('📸 Uploading to Instagram...');
    const igCreationRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media`,
      {
        media_type: 'REELS',
        video_url: videoPath,
        caption,
        access_token: IG_ACCESS_TOKEN,
      }
    );

    const creationId = igCreationRes.data.id;
    console.log('✅ Instagram Media Creation ID:', creationId);

    // Polling for processing status
    let isReady = false;
    for (let attempt = 1; attempt <= 15; attempt++) {
      await sleep(3000 * attempt); // Exponential backoff
      const statusRes = await axios.get(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${IG_ACCESS_TOKEN}`
      );

      const status = statusRes.data.status_code;
      console.log(`⏳ IG Attempt ${attempt} - Status: ${status}`);

      if (status === 'FINISHED') {
        isReady = true;
        break;
      }
      if (status === 'ERROR') {
        throw new Error('Instagram media processing failed.');
      }
    }

    if (!isReady) throw new Error('Instagram media not ready after timeout.');

    // Publish to Instagram with optional FB share
    const igPublishRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: creationId,
        access_token: IG_ACCESS_TOKEN,
        share_to_facebook: false, // We post to FB separately below
      }
    );
    console.log('✅ Instagram Reel Posted:', igPublishRes.data);

 // ---------- Facebook Reel Posting ----------
console.log('📘 Uploading to Facebook Page...');

const fbForm = new FormData();
if (videoPath.startsWith('http')) {
  fbForm.append('file_url', videoPath);
} else {
  fbForm.append('source', fs.createReadStream(videoPath));
}
fbForm.append('is_reel', 'true');
fbForm.append('description', caption);
fbForm.append('is_crossposting_eligible', 'true'); // Mark as reel
fbForm.append('published', 'true'); // <--- Ensures it goes live
fbForm.append('privacy', JSON.stringify({ value: 'EVERYONE' })); // <--- Makes it public

const fbResponse = await axios.post(
  `https://graph-video.facebook.com/v18.0/${FB_PAGE_ID}/videos`,
  fbForm,
  {
    headers: {
      ...fbForm.getHeaders(),
    },
    params: {
      access_token: FB_PAGE_ACCESS_TOKEN,
    },
  }
);

console.log('✅ Facebook Reel Posted:', fbResponse.data);
console.log('Video ID:', fbResponse.data.id);


    return {
      instagram: igPublishRes.data,
      facebook: fbResponse.data,
    };

  } catch (error) {
    console.error('❌ Error posting reel:', error.response?.data || error.message);
    throw new Error('Failed to post reel to both platforms');
  }
}

module.exports={
  postReelToInstagramAndFacebook
}
