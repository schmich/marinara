class Mutex
{
  constructor() {
    this.queue = [];
    this.pending = false;
  }

  async exclusive(fn) {
    try {
      var release = await this.acquire();
      await fn();
    } finally {
      release();
    }
  }

  async acquire() {
    const release = () => {
      this.pending = this.queue.length > 0;
      let next = this.queue.shift();
      next && next();
    };

    if (!this.pending) {
      this.pending = true;
      return release;
    } else {
      await new Promise(resolve => this.queue.push(resolve));
      return release;
    }
  }
}
