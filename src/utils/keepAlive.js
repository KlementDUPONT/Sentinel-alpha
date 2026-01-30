import logger from './logger.js';

class KeepAlive {
  constructor(url) {
    this.url = url;
    this.interval = null;
  }

  start() {
    // Ping toutes les 10 minutes (600000 ms)
    this.interval = setInterval(async () => {
      try {
        const response = await fetch(this.url);
        if (response.ok) {
          logger.info('✅ Keep-alive ping successful');
        } else {
          logger.warn('⚠️ Keep-alive ping failed: ' + response.status);
        }
      } catch (error) {
        logger.error('❌ Keep-alive error:', error.message);
      }
    }, 10 * 60 * 1000); // 10 minutes

    logger.info('🔄 Keep-alive system started (ping every 10 minutes)');
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      logger.info('🛑 Keep-alive system stopped');
    }
  }
}

export default KeepAlive;
