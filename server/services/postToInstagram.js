// services/instagramService.js

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
require('dotenv').config();

// Replace with actual values
const ACCESS_TOKEN = process.env.INSTAGRAM_ACCESS_TOKEN;
const IG_USER_ID = process.env.INSTAGRAM_USER_ID;
console.log('ACCESS_TOKEN :',ACCESS_TOKEN);


/**
 * Post an image to Instagram (via public URL).
 * @param {string} imageUrl - The public URL of the image.
 * @param {string} caption - Caption for the Instagram post.
 */
async function postToInstagram(imageUrl, caption) {
  try {
    // Step 1: Upload image to Instagram container
    const form = new FormData();
    form.append('image_url', imageUrl);
    form.append('caption', caption);
    form.append('access_token', ACCESS_TOKEN);
    console.log(ACCESS_TOKEN);
    

    const containerRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media`,
      form,
      { headers: form.getHeaders() }
    );

    const containerId = containerRes.data.id;

    // Step 2: Publish image
    const publishRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: containerId,
        access_token: ACCESS_TOKEN,
      }
    );

    console.log('✅ Instagram post published:', publishRes.data);
    return publishRes.data;

  } catch (err) {
    console.error('❌ Failed to post to Instagram:', err.response?.data || err.message);
    throw err;
  }

}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function postReelToInstagram(videoUrl, caption) {
  try {
    // STEP 1: Create Container
    const creationRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media`,
      {
        media_type: 'REELS',
        video_url: videoUrl,
        caption: caption,
        access_token: ACCESS_TOKEN,
      }
    );

    const creationId = creationRes.data.id;
    console.log('✅ Media creation ID:', creationId);

    // STEP 2: Wait for processing
    let isReady = false;
    for (let i = 0; i < 10; i++) {
      await sleep(3000); // wait 3s per try
      const statusRes = await axios.get(
        `https://graph.facebook.com/v18.0/${creationId}?fields=status_code&access_token=${ACCESS_TOKEN}`
      );

      const status = statusRes.data.status_code;
      console.log(`⏳ Attempt ${i + 1} - Status: ${status}`);

      if (status === 'FINISHED') {
        isReady = true;
        break;
      } else if (status === 'ERROR') {
        throw new Error('Media processing failed');
      }
    }

    if (!isReady) {
      throw new Error('Media not ready after waiting');
    }

    // STEP 3: Publish Media
    const publishRes = await axios.post(
      `https://graph.facebook.com/v18.0/${IG_USER_ID}/media_publish`,
      {
        creation_id: creationId,
        access_token: ACCESS_TOKEN,
      }
    );

    console.log('✅ Reel posted successfully:', publishRes.data);
    return publishRes.data;
  } catch (error) {
    console.error('❌ Error posting to Instagram:', error.response?.data || error.message);
    throw new Error('Failed to post reel');
  }
}

// Export the function
module.exports = {
  postToInstagram,
  postReelToInstagram
};
