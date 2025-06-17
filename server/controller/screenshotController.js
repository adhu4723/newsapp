const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const { postToInstagram } = require("../services/postToInstagram");
const cloudinary = require("../services/cloudinary");

const screenshotDir = path.join(__dirname, "../screenshots");

// Ensure screenshots folder exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Delete all files in screenshots folder
const clearOldScreenshots = () => {
  const files = fs.readdirSync(screenshotDir);
  for (const file of files) {
    fs.unlinkSync(path.join(screenshotDir, file));
  }
};

exports.captureScreenshot = async (req, res) => {
  const url = "http://127.0.0.1:5500/index.html";

  try {
    const browser = await puppeteer.launch({ headless: "new" });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });
    await page.setViewport({ width: 900, height: 900 });

    // Wait for the element
    await page.waitForSelector("div.relative.w-\\[650px\\].h-\\[650px\\]");
    const element = await page.$("div.relative.w-\\[650px\\].h-\\[650px\\]");
     // Extract caption text
    const caption = await page.$eval(
      "#newsContainer > div > div.absolute.bottom-0.left-0.w-full.text-white.text-center.z-10 > div > p.hidden",
      (el) => el.innerText.trim()
    );

    console.log(caption);

    // Clear old screenshots
    clearOldScreenshots();

    const fileName = `news-${Date.now()}.png`;
    const screenshotPath = path.join(screenshotDir, fileName);

    // Save screenshot locally first ✅
    await element.screenshot({ path: screenshotPath });
    console.log("📸 Screenshot saved:", screenshotPath);

    // Upload to Cloudinary ✅
    const uploadResult = await cloudinary.uploader.upload(screenshotPath, {
      folder: "instagram_uploads",
    });
    const imageUrl = uploadResult.secure_url;
    console.log("☁️ Uploaded to Cloudinary:", imageUrl);

    // Post to Instagram ✅
    await postToInstagram(imageUrl, `${caption}....#gaintrick #thrissur #photooftheday #entekeralam #trivandrum #likeforfollow #keralaattraction #fashion #picoftheday #like #instadaily #tamil #keraladiaries #travel #malayalamcinema #chuvadelikes #follow #delhi #followforfollowback #mohanlal #gaintrain #naturephotography #gainparty #gainwithcarlz #keralaphotography #followtrain #bangalore #model #karnataka #travelphotography`);

    await browser.close();

    res.status(200).json({
      message: "Screenshot captured and posted to Instagram",
      file: `/screenshots/${fileName}`,
      cloudinaryUrl: imageUrl,
    });

  } catch (err) {
    console.error("❌ Error capturing screenshot:", err);
    res.status(500).json({ error: "Failed to capture screenshot" });
  }
};
