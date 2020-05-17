import {EventEmitter} from 'events';
import {JsonEncoder} from '../zipkin';

export class HttpLogger extends EventEmitter {
  headers?: { [name: string]: string };
  errorListenerSet = false;
  queue: any[] = [];
  queueBytes = 0;

  constructor(private endpoint: string, private jsonEncoder: JsonEncoder, private debug = false, headers: any = {},
              httpInterval: number = 1000, private timeout: number = 0, private maxPayloadSize: number = 0, private log: Console = console
  ) {
    super();
    this.headers = Object.assign({
      'Content-Type': 'application/json'
    }, headers);

    const timer = setInterval(() => {
      this.processQueue();
    }, httpInterval);
    if (timer.unref) { // unref might not be available in browsers
      timer.unref(); // Allows Node to terminate instead of blocking on timer
    }
  }

  _getPayloadSize(nextSpan) {
    // Our payload is in format '[s1,s2,s3]', so we need to add 2 brackets and
    // one comma separator for each payload, including the next span if defined
    return nextSpan
      ? this.queueBytes + 2 + this.queue.length + nextSpan.length
      : this.queueBytes + 2 + Math.min(this.queue.length - 1, 0);
  }

  on(...args) {
    const eventName = args[0];
    // if the instance has an error handler set then we don't need to
    // skips error logging
    if (eventName.toLowerCase() === 'error') {
      this.errorListenerSet = true;
    }
    super.on.apply(this, args);
    return this;
  }

  logSpan(span) {
    const encodedSpan = this.jsonEncoder.encode(span);
    if (this.maxPayloadSize && this._getPayloadSize(encodedSpan) > this.maxPayloadSize) {
      this.processQueue();
      if (this._getPayloadSize(encodedSpan) > this.maxPayloadSize) {
        // Payload size is too large even with an empty queue, we can only drop
        const err = 'Zipkin span got dropped, reason: payload too large';
        if (this.errorListenerSet) {
          this.emit('error', new Error(err));
        } else {
          this.log.error(err);
        }
        return;
      }
    }
    this.queue.push(encodedSpan);
    this.queueBytes += encodedSpan.length;
  }

  processQueue() {
    const self = this;
    if (self.queue.length > 0) {
      const postBody = `[${self.queue.join(',')}]`;
      const fetchOptions: RequestInit = {
        method: 'POST',
        body: postBody,
        headers: self.headers,
        mode: 'cors'
      };

      if (this.debug) {
        console.log(`HttpLogger{ Zipkin Post: { postHeaders: ${JSON.stringify(fetchOptions.headers)}, postBody: ${postBody} } }`);
      }

      window.fetch(self.endpoint, fetchOptions).then((response) => {
        if (response.status !== 202 && response.status !== 200) {
          const err = 'Unexpected response while sending Zipkin data, status:' + response.status;

          if (self.errorListenerSet) {
            this.emit('error', new Error(err));
          } else {
            this.log.error(err);
            if (this.debug) {
              response.text().then(text => {
                console.log(`HttpLogger{ Zipkin Post Response Error: { resBody: ${text} } }`);
              });
            }
          }
        } else {
          if (this.debug) {
            console.log(`HttpLogger{ Zipkin Post Success, response: status: ${response.status} }`);
          }
          this.emit('success', response);
        }
      }).catch((error) => {
        const err = `Error sending Zipkin data ${error}`;
        if (self.errorListenerSet) {
          this.emit('error', new Error(err));
        } else {
          this.log.error(err);
        }
      });
      self.queue.length = 0;
      self.queueBytes = 0;
    }
  }
}
