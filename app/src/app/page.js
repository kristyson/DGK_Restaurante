'use client';

import { useState, useEffect } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import WeatherSection from '@/app/components/WeatherSection';
import { loadWeatherForCity, weatherLocations } from '@/app/lib/parseApi';

const unitOptions = Object.keys(weatherLocations);
const locationOptions = ['TODOS', ...unitOptions];
const defaultCity = locationOptions[0];

export default function Home() {
  const [weatherCity, setWeatherCity] = useState(defaultCity);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherMessage, setWeatherMessage] = useState('');

  useEffect(() => {
    refreshWeather(weatherCity);
  }, [weatherCity]);

  async function refreshWeather(city) {
    if (city === 'TODOS') {
      setWeatherInfo(null);
      setWeatherMessage('Selecione uma cidade específica para ver o clima.');
      return;
    }
    try {
      const info = await loadWeatherForCity(city);
      setWeatherInfo(info);
      setWeatherMessage('');
    } catch (err) {
      setWeatherInfo(null);
      setWeatherMessage(err.message);
    }
  }

  return (
    <div>
      <Header />
      <WeatherSection
        weatherCity={weatherCity}
        setWeatherCity={setWeatherCity}
        locationOptions={locationOptions}
        weatherInfo={weatherInfo}
        weatherMessage={weatherMessage}
      />
      <Footer />
    </div>
  );
}
