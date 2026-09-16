class AsyncStatusCache {
  constructor(options = {}) {
    this.ttlMs = options.ttlMs || 60000;
    this.snapshot = null;
    this.expiresAt = 0;
    this.inFlight = null;
  }

  async get(loader) {
    if (this.snapshot && Date.now() < this.expiresAt) return this.snapshot;
    if (this.inFlight) return this.inFlight;

    this.inFlight = Promise.resolve()
      .then(loader)
      .then(value => ({ value, error: null, stale: false }))
      .catch(error => ({
        value: this.snapshot?.value || null,
        error: error.message,
        stale: Boolean(this.snapshot?.value)
      }))
      .then(snapshot => {
        this.snapshot = snapshot;
        this.expiresAt = Date.now() + this.ttlMs;
        return snapshot;
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  invalidate() {
    this.snapshot = null;
    this.expiresAt = 0;
  }
}

module.exports = { AsyncStatusCache };
