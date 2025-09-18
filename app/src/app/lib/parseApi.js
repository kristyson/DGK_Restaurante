const APP_ID = 'VXY7L2vhMJd5FlohOKs8m4LTS9N9a2IbdCTtPrlM';
const CLIENT_KEY = 'zQrntobRZgMVspU7J7lk728NEytCVkcJ90pfjSb9';
const PARSE_BASE_URL = 'https://parseapi.back4app.com';

export const MENU_CLASS = 'MenuItem';

export const weatherLocations = {
  'Recife - PE': { latitude: -8.0432784, longitude: -35.0990265 },
  'Olinda - PE': { latitude: -7.9965313, longitude: -34.8720278 },
  'Jaboatão dos Guararapes - PE': { latitude: -8.145843, longitude: -35.1651605 },
};

export async function parseRequest(path, options = {}) {
  const { method = 'GET', body } = options;
  const headers = {
    'X-Parse-Application-Id': APP_ID,
    'X-Parse-Client-Key': CLIENT_KEY,
  };
  const fetchOptions = { method, headers };
  if (body) {
    headers['Content-Type'] = 'application/json';
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${PARSE_BASE_URL}${path}`, fetchOptions);
  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Não foi possível interpretar a resposta do servidor.');
    }
  }

  if (!response.ok) {
    const message = data?.error || `Erro ${response.status}`;
    throw new Error(message);
  }

  return data || {};
}

export async function loadWeatherForCity(cityKey) {
  const location = weatherLocations[cityKey];
  if (!location) throw new Error('Localização desconhecida.');

  const { latitude, longitude } = location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=America%2FSao_Paulo`;

  const weatherResponse = await fetch(url);
  if (!weatherResponse.ok) throw new Error('Não foi possível obter a previsão do tempo.');

  const weatherData = await weatherResponse.json();
  return weatherData?.current_weather || null;
}
