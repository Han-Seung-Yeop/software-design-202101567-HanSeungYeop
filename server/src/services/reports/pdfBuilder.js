const puppeteer = require('puppeteer');
const { renderGradeReport, renderCounselingReport, renderFeedbackReport } = require('./reportTemplates');

let browserPromise = null;

const getBrowser = async () => {
  if (!browserPromise) {
    browserPromise = puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserPromise;
};

const renderHtmlToPdf = async (html) => {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const buffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' },
    });
    return buffer;
  } finally {
    await page.close();
  }
};

const buildGradePdf = async (data) => renderHtmlToPdf(renderGradeReport(data));
const buildCounselingPdf = async (data) => renderHtmlToPdf(renderCounselingReport(data));
const buildFeedbackPdf = async (data) => renderHtmlToPdf(renderFeedbackReport(data));

const closeBrowser = async () => {
  if (browserPromise) {
    const browser = await browserPromise;
    await browser.close();
    browserPromise = null;
  }
};

module.exports = {
  buildGradePdf,
  buildCounselingPdf,
  buildFeedbackPdf,
  closeBrowser,
};
