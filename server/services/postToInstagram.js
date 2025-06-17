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

// Export the function
module.exports = {
  postToInstagram,
};
