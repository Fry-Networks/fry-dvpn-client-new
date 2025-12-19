// Global timer utility that runs independently of React components
class GlobalTimer {
  constructor() {
    this.interval = null;
    this.startTime = null;
    this.isRunning = false;
    this.callbacks = new Set();
  }

  start() {
    if (this.isRunning) {
      console.log('Timer already running');
      return;
    }

    this.isRunning = true;
    this.startTime = Date.now();
    console.log('Global timer started at:', this.startTime);

    this.interval = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
      console.log('Global timer tick:', elapsedSeconds);
      
      // Notify all callbacks
      this.callbacks.forEach(callback => {
        try {
          callback(elapsedSeconds);
        } catch (error) {
          console.error('Timer callback error:', error);
        }
      });
    }, 1000);
  }

  stop() {
    if (!this.isRunning) {
      console.log('Timer not running');
      return;
    }

    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.startTime = null;
    console.log('Global timer stopped');
  }

  reset() {
    this.stop();
    this.callbacks.forEach(callback => {
      try {
        callback(0);
      } catch (error) {
        console.error('Timer reset callback error:', error);
      }
    });
  }

  getElapsedTime() {
    if (!this.isRunning || !this.startTime) {
      return 0;
    }
    return Math.floor((Date.now() - this.startTime) / 1000);
  }

  subscribe(callback) {
    this.callbacks.add(callback);
    // Immediately call with current time
    if (this.isRunning) {
      callback(this.getElapsedTime());
    }
    return () => this.callbacks.delete(callback);
  }

  isActive() {
    return this.isRunning;
  }
}

// Create singleton instance
const globalTimer = new GlobalTimer();

export default globalTimer; 