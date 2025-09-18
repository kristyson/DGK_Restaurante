'use client';

import { useEffect, useState, useMemo } from 'react';
import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';
import WeatherSection from '@/app/components/WeatherSection';
import MenuForm from '@/app/components/MenuForm';
import { parseRequest, loadWeatherForCity, MENU_CLASS, weatherLocations } from '@/app/lib/parseApi';

const unitOptions = Object.keys(weatherLocations);
const locationOptions = ['TODOS', ...unitOptions];
const defaultCity = locationOptions[0];
const defaultUnit = unitOptions[0];
const categoryOptions = ['Entrada', 'Prato principal', 'Sobremesa', 'Bebida', 'Promoção'];

function createEmptyForm(selectedUnit = defaultUnit) {
  return { name: '', description: '', price: '', category: '', unit: selectedUnit, available: true, applyAllUnits: false };
}

export default function Home() {
  const [formData, setFormData] = useState(() => createEmptyForm(defaultUnit));
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [weatherCity, setWeatherCity] = useState(defaultCity);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherMessage, setWeatherMessage] = useState('');

  const selectableCategories = useMemo(() => categoryOptions, []);

  useEffect(() => {
    if (weatherCity !== 'TODOS' && !editingId) {
      setFormData((prev) => ({ ...prev, unit: unitOptions.includes(weatherCity) ? weatherCity : defaultUnit }));
    }
    refreshWeather(weatherCity);
  }, [weatherCity, editingId]);

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

  function updateForm(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage('');

    try {
      const price = Number(formData.price);
      if (!formData.name.trim()) throw new Error('Informe um nome.');
      if (Number.isNaN(price) || price < 0) throw new Error('Preço inválido.');
      if (!formData.category) throw new Error('Selecione categoria.');
      if (!formData.applyAllUnits && !formData.unit) throw new Error('Selecione unidade.');

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price,
        category: formData.category,
        available: !!formData.available
      };

      const targets = formData.applyAllUnits ? unitOptions : [formData.unit];

      for (const unit of targets) {
        await parseRequest(`/classes/${MENU_CLASS}`, {
          method: 'POST',
          body: { ...payload, unit }
        });
      }

      setStatusMessage('Novo item adicionado.');
      setFormData(createEmptyForm(unitOptions.includes(weatherCity) ? weatherCity : defaultUnit));
      setEditingId(null);

    } catch (err) {
      setStatusMessage(`Erro: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData(createEmptyForm(defaultUnit));
    setStatusMessage('Edição cancelada.');
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
      <MenuForm
        editingId={editingId}
        formData={formData}
        selectableCategories={selectableCategories}
        unitOptions={unitOptions}
        weatherCity={weatherCity}
        updateForm={updateForm}
        handleSubmit={handleSubmit}
        handleCancelEdit={handleCancelEdit}
        isSaving={isSaving}
      />
      {statusMessage && <p style={{ marginTop: 10, color: 'green' }}>{statusMessage}</p>}
      <Footer />
    </div>
  );
}
