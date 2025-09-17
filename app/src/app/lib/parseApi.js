export const weatherLocations = {
  'Recife - PE': { latitude: -8.0432784, longitude: -35.0990265 },
  'Olinda - PE': { latitude: -7.9965313, longitude: -34.8720278 },
  'Jaboatão dos Guararapes - PE': { latitude: -8.145843, longitude: -35.1651605 },
};

export async function loadWeatherForCity(cityKey) {
  const location = weatherLocations[cityKey];
  if (!location) throw new Error('Localização desconhecida.');

  const { latitude, longitude } = location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=America%2FSao_Paulo`;

  const weatherResponse = await fetch(url);
  if (!weatherResponse.ok) {
    throw new Error('Não foi possível obter a previsão do tempo.');
  }

  const weatherData = await weatherResponse.json();
  return weatherData?.current_weather || null;
}
