export default function WeatherSection({ weatherCity, setWeatherCity, locationOptions, weatherInfo, weatherMessage }) {
  return (
    <section>
      <h2>Condições do tempo</h2>
      <label htmlFor="weather-city">Escolha uma cidade:</label>
      <select id="weather-city" value={weatherCity} onChange={(e) => setWeatherCity(e.target.value)}>
        {locationOptions.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>

      {weatherInfo && (
        <div>
          <p>
            Clima em {weatherCity}: {weatherInfo.temperature}°C, vento {weatherInfo.windspeed} km/h.
          </p>
          <p>Última atualização: {new Date(weatherInfo.time).toLocaleString()}</p>
        </div>
      )}
      {weatherMessage && <p>{weatherMessage}</p>}
    </section>
  );
}
