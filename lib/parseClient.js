let cachedParse = null;

async function loadParse() {
  if (cachedParse) {
    return cachedParse;
  }

  const ParseModule = await import('parse/dist/parse.min.js');
  const Parse = ParseModule.default;
  const appId = process.env.NEXT_PUBLIC_PARSE_APP_ID || 'VXY7L2vhMJd5FlohOKs8m4LTS9N9a2IbdCTtPrlM';
  const clientKey = process.env.NEXT_PUBLIC_PARSE_CLIENT_KEY || 'zQrntobRZgMVspU7J7lk728NEytCVkcJ90pfjSb9';
  const serverURL = process.env.NEXT_PUBLIC_PARSE_SERVER_URL || 'https://parseapi.back4app.com/';

  Parse.initialize(appId, clientKey);
  Parse.serverURL = serverURL;

  cachedParse = Parse;
  return cachedParse;
}

export async function getParse() {
  if (typeof window === 'undefined') {
    throw new Error('Parse client is only available in the browser.');
  }

  return loadParse();
}
