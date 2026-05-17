const mongoose = require('mongoose');

// 분석 DB 전용 별도 connection (운영 DB와 격리)
const analyticsConn = mongoose.createConnection();

const buildAnalyticsUri = () => {
  const baseUri = process.env.MONGODB_URI;
  const analyticsName = process.env.ANALYTICS_DB_NAME || 'student_analytics_db';

  if (!baseUri) {
    throw new Error('MONGODB_URI is not set');
  }

  // 운영 DB URI에서 DB 이름만 분석 DB로 교체 (auth/host 동일)
  const url = new URL(baseUri);
  url.pathname = '/' + analyticsName;
  return url.toString();
};

const connectAnalyticsDB = async () => {
  try {
    const uri = buildAnalyticsUri();
    await analyticsConn.openUri(uri);
    console.log(`Analytics DB connected: ${analyticsConn.host}/${analyticsConn.name}`);
  } catch (error) {
    console.error('Analytics DB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = { analyticsConn, connectAnalyticsDB };
