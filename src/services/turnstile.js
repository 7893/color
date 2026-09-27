// Keep token lifecycle separate from snapshot transport.
export class TurnstileSession {
  constructor(sitekey) {
    this.sitekey = sitekey;
    this.widgetId = null;
    this.token = null;
    this.waiter = null;
  }

  init() {
    if (!this.sitekey || !window.turnstile) return false;
    if (this.widgetId !== null) return true;
    this.widgetId = window.turnstile.render('#turnstile-widget', {
      sitekey: this.sitekey,
      callback: token => {
        if (this.waiter) {
          const waiter = this.waiter;
          this.waiter = null;
          waiter.resolve(token);
        } else {
          this.token = token;
        }
      },
      'expired-callback': () => this.refresh(),
      'error-callback': () => {
        this.token = null;
        this.waiter?.reject(new Error('Snapshot verification failed'));
        this.waiter = null;
      },
    });
    return true;
  }

  async take() {
    if (!this.init()) throw new Error('Snapshot verification is not available');
    if (this.token) {
      const token = this.token;
      this.token = null;
      return token;
    }
    if (this.waiter) throw new Error('Snapshot verification is already pending');
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiter = null;
        reject(new Error('Snapshot verification timed out'));
      }, 8000);
      this.waiter = {
        resolve: token => { clearTimeout(timer); resolve(token); },
        reject: error => { clearTimeout(timer); reject(error); },
      };
      // Request a fresh token after a failed or consumed challenge.
      window.turnstile.reset(this.widgetId);
    });
  }

  refresh() {
    this.token = null;
    if (this.widgetId !== null && window.turnstile) window.turnstile.reset(this.widgetId);
  }
}
