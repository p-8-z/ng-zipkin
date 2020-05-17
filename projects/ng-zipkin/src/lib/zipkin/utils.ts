export const requiredArg = (name: string, required: string) => {
  throw new Error(`${name}: Missing required argument ${required}.`);
};

export const parseRequestUrl = (requestUrl): any => {
  requestUrl = !requestUrl.startsWith('http') ? `http://localhost:4200${requestUrl}` : requestUrl;
  const parsed = new URL(requestUrl);

  return {
    host: parsed.hostname,
    path: parsed.pathname
  };
};

export const isUndefinedOrNull = (obj) => {
  return typeof obj === 'undefined' || obj === null;
};

export const randomTraceId = () => {
  const digits = '0123456789abcdef';
  let n = '';
  for (let i = 0; i < 16; i += 1) {
    const rand = Math.floor(Math.random() * 16);
    n += digits[rand];
  }
  return n;
};

export const isPromise = (obj): boolean => {
  return !!obj && (typeof obj === 'object' || typeof obj === 'function') && typeof obj.then === 'function';
};

const hrTimeSupport = typeof process !== 'undefined' && process.hrtime;

const nowLegacy = () => {
  return Date.now() * 1000;
};

const nowHrTime = (startTimestamp?, startTick?) => {
  if (startTimestamp && startTick) {
    const hrTime = process.hrtime(startTick);
    const elapsedMicros = Math.floor(hrTime[0] * 1000000 + hrTime[1] / 1000);
    return startTimestamp + elapsedMicros;
  } else {
    return Date.now() * 1000;
  }
};

export const now = hrTimeSupport ? nowHrTime : nowLegacy;
export const hrtime = hrTimeSupport ? () => process.hrtime() : () => undefined;
