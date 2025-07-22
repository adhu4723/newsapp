const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const cloudinary = require("../services/cloudinary");
const {  postReelToInstagramAndFacebook } = require("../services/postToInstagram");

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const screenshotDir = path.join(__dirname, "../screenshots");

// Ensure the screenshots folder exists
if (!fs.existsSync(screenshotDir)) {
  fs.mkdirSync(screenshotDir, { recursive: true });
}

// Delete all old screenshots
const clearOldScreenshots = () => {
  const files = fs.readdirSync(screenshotDir);
  for (const file of files) {
    fs.unlinkSync(path.join(screenshotDir, file));
  }
};

exports.captureScreenshot = async (req, res) => {
  const url = "https://adhu4723.github.io/newsapp/";

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: "networkidle2" });
    await page.setViewport({ width: 900, height: 900 });

    // Wait for the container with background image and content
   await page.waitForSelector("#newsCard", { timeout: 60000 });
   const element = await page.$("#newsCard");


    // Extract the headline
    const headline = await page.$eval("h1.malayalamfont", el => el.innerText.trim());

// Extract the hidden summary safely
const caption = await page.evaluate(() => {
  const para = document.querySelector("#newsSummary > p");
  return para ? para.innerText.trim() : "No caption available.";
});

    clearOldScreenshots();

    const imageName = `news-${Date.now()}.png`;
    const imagePath = path.join(screenshotDir, imageName);
    await element.screenshot({ path: imagePath });

    const videoName = imageName.replace(".png", ".mp4");
    const videoPath = path.join(screenshotDir, videoName);

    // Convert to a 5s video
    await new Promise((resolve, reject) => {
      ffmpeg()
        .addInput(imagePath)
        .loop(5)
        .videoCodec("libx264")
        .outputOptions("-pix_fmt yuv420p")
        .duration(5)
        .save(videoPath)
        .on("end", resolve)
        .on("error", reject);
    });

    // Upload to Cloudinary
    const uploadResult = await cloudinary.uploader.upload(videoPath, {
      folder: "instagram_reels",
      resource_type: "video",
    });

    const videoUrl = uploadResult.secure_url;
    console.log(caption)
    
    let trimmedCaption = caption;
if (caption.length > 1800) {
  trimmedCaption = caption.slice(0, 1800) + "...";
}

const hashtags = [
  "#followforupdates", "#gaintrick", "#thrissur", "#photooftheday", "#entekeralam",
  "#trivandrum", "#likeforfollow", "#keralaattraction", "#byelection", "#election",
  "#like", "#instadaily", "#tamil", "#keraladiaries", "#travel",
  "#malayalamcinema", "#follow", "#mohanlal", "#naturephotography", "#bangalore"
];

const finalCaption = `${trimmedCaption}\n\n${hashtags.join(" ")}`;

await postReelToInstagramAndFacebook(videoUrl, finalCaption);

    

    await browser.close();

    res.status(200).json({
      message: "Screenshot converted to video and posted as Reel",
      cloudinaryUrl: videoUrl,
    });

  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "Failed to process screenshot as video" });
  }
};
