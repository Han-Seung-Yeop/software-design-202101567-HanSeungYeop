require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const { connectAnalyticsDB } = require('../src/config/analyticsDb');
const { backfillAll } = require('../src/services/analytics/aggregator');

(async () => {
  try {
    await connectDB();
    await connectAnalyticsDB();
    console.log('Starting full backfill...');
    const start = Date.now();
    await backfillAll();
    console.log(`✅ Backfill complete in ${((Date.now() - start) / 1000).toFixed(1)}s`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Backfill failed:', error);
    process.exit(1);
  }
})();
