const cron = require('node-cron');
const { backfillAll } = require('./aggregator');

let scheduled = false;

/**
 * 매주 일요일 03:00 KST — Change Stream/훅이 놓친 케이스
 * (Atlas Data Explorer에서 직접 삭제, 마이그레이션 raw delete 등)에 대한 안전망.
 */
function scheduleWeeklyBackfill() {
  if (scheduled) return;
  scheduled = true;

  cron.schedule('0 3 * * 0', async () => {
    console.log('[analytics:cron] weekly backfill start');
    const t0 = Date.now();
    try {
      await backfillAll();
      console.log(`[analytics:cron] weekly backfill done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
    } catch (err) {
      console.error('[analytics:cron] backfill failed:', err.message);
    }
  }, { timezone: 'Asia/Seoul' });

  console.log('[analytics] weekly backfill cron scheduled (Sun 03:00 KST)');
}

module.exports = { scheduleWeeklyBackfill };
