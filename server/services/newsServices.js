const { default: axios } = require("axios");
const cheerio = require('cheerio');

const BASE_URL = 'https://www.manoramaonline.com';
const DEFAULT_ICON = 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/50/3f/56/503f5669-704b-5689-b68b-88ce6dd7d7e9/AppIcon4NormalUsers-0-0-1x_U007emarketing-0-6-0-85-220.png/512x512bb.jpg';


const fetchNews = async (url, selector) => {
  console.log('url');

  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    const news = [];

    $(selector).each((_, element) => {
      const titleRaw = $(element).find('h2 a').text().trim();
      const title = titleRaw.replace(/Live\s*/gi, '').trim(); // Remove "Live" and extra spaces

      const link = BASE_URL + $(element).find('h2 a').attr('href');
      const summary = $(element).find('.cmp-story-list__dispn').text().trim();
      const image =
        $(element).find('.cmp-story-list__image-block > a > img').attr('data-src') ||
        $(element).find('.cmp-story-list__image-block > a > img').attr('data-websrc');
      const timeElement = $(element).find('.cmp-story-list__date.en-font.text-sub-color');
      const timeText = timeElement.text().trim();
      const timeAttr = timeElement.attr('data-publish-date');

      const readableTime = timeText || (timeAttr ? new Date(parseInt(timeAttr)).toLocaleString() : '');

      if (title && link) {
        news.push({
          title,
          link,
          summary,
          image,
          readableTime,
          icon: DEFAULT_ICON,
          channel: 'Manorama'
        });
      }
    });

    return news;
  } catch (error) {
    console.error(`Error fetching news from ${url}:`, error);
    throw error;
  }
};


// Fetch latest news
exports.fetchLatestNews = () => fetchNews(
  `${BASE_URL}/news/latest-news.html`,
  '#Just_in_Slot > div > ul > li'
);

// Fetch technology news
exports.fetchTechNews = () => fetchNews(
  `${BASE_URL}/technology/technology-news.html`,
  '#Tech___Gadgets_SubsectionPage_Technology_News > div > ul > li'
);