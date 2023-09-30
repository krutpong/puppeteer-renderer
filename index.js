const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');

const app = express();
const PORT = 8088;
const MAX_CONCURRENT_BROWSERS = 5; // Maximum number of concurrent browsers

const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.140 Safari/537.36 Edge/17.17134',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/91.0',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/91.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.124',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Safari/537.36 Chrome/91.0.4472.124',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/92.0.902.78',
  'Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edge/92.0.902.78'
];

const browserQueue = []; // Queue to manage browser instances

function getRandomUserAgent() {
  const randomIndex = Math.floor(Math.random() * userAgents.length);
  return userAgents[randomIndex];
}

async function createBrowserInstance() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu', '--disable-cache', '--disk-cache-size=0'],
  });
  return browser;
}

app.get('/', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.status(400).send('URL parameter is required.');
  }

  try {
    const response = await axios.head(url);
    if (response.status !== 200) {
      return res.status(400).send('The specified URL is not accessible.');
    }
  } catch (error) {
    return res.status(400).send('Error checking URL accessibility.');
  }

  let browser;
  let page;

  try {
    if (browserQueue.length < MAX_CONCURRENT_BROWSERS) {
      browser = await createBrowserInstance();
      browserQueue.push(browser);
    } else {
      browser = browserQueue.shift(); // Reuse an existing browser
    }

    page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    await page.goto(url, { waitUntil: 'networkidle0' });

    const htmlContent = await page.content();

    const randomUserAgent = getRandomUserAgent();
    res.set({
      'Content-Type': 'text/html',
      'X-Powered-By': randomUserAgent
    });

    res.send(htmlContent);
  } catch (error) {
    res.status(500).send('An error occurred while fetching the URL.');
  } finally {
    if (page) {
      await page.close();
    }

    if (browser) {
      browserQueue.push(browser); // Return the browser to the queue
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
