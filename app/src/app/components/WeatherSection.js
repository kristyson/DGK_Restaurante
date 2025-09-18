import styles from "../page.module.css";

export default function WeatherSection({
  weatherCity,
  setWeatherCity,
  locationOptions,
  weatherInfo,
  weatherMessage,
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Condições do tempo</h2>
      </div>

      <div className={styles.weatherPanel}>
        <div className={styles.fieldGroup}>
          <label htmlFor="weather-city">Escolha uma cidade:</label>
          <select
            id="weather-city"
            value={weatherCity}
            onChange={(e) => setWeatherCity(e.target.value)}
          >
            {locationOptions.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>

        {weatherInfo && (
          <div className={styles.weatherInfo}>
            <p className={styles.weatherSummary}>
              Clima em {weatherCity}: {weatherInfo.temperature}°C, vento{" "}
              {weatherInfo.windspeed} km/h.
            </p>
            <p className={styles.weatherTime}>
              Última atualização:{" "}
              {new Date(weatherInfo.time).toLocaleString()}
            </p>
          </div>
        )}

        {weatherMessage && (
          <p className={styles.feedback}>{weatherMessage}</p>
        )}
      </div>
    </section>
  );
}
