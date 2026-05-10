require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');
const { connectAnalyticsDB } = require('./config/analyticsDb');
const { startAnalyticsStreams } = require('./services/analytics/streams');
const { scheduleWeeklyBackfill } = require('./services/analytics/scheduledBackfill');

const PORT = process.env.PORT || 5000;

Promise.all([connectDB(), connectAnalyticsDB()]).then(() => {
  startAnalyticsStreams();
  scheduleWeeklyBackfill();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});
