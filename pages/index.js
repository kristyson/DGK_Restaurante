import { useCallback, useEffect, useMemo, useState } from 'react';
import { getParse } from '../lib/parseClient';

const emptyForm = {
  id: '',
  name: '',
  description: '',
  price: '',
  available: true,
};

const cities = [
  {
    id: 'sao_paulo',
    name: 'São Paulo',
    latitude: -23.5505,
    longitude: -46.6333,
  },
  {
    id: 'rio_de_janeiro',
    name: 'Rio de Janeiro',
    latitude: -22.9068,
    longitude: -43.1729,
  },
  {
    id: 'salvador',
    name: 'Salvador',
    latitude: -12.9777,
    longitude: -38.5016,
  },
];

export default function HomePage() {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [statusType, setStatusType] = useState('info');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState(cities[0].id);
  const [weather, setWeather] = useState(null);
  const [weatherStatus, setWeatherStatus] = useState('');
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  const showStatus = (type, message) => {
    setStatusType(type);
    setStatusMessage(message);
  };

  const refreshMenu = useCallback(async () => {
    setIsLoading(true);
    try {
      const Parse = await getParse();
      const query = new Parse.Query('MenuItem');
      query.ascending('name');
      const results = await query.find();
      const normalized = results.map((item) => {
        const price = item.get('price');
        return {
          id: item.id,
          name: item.get('name') || '',
          description: item.get('description') || '',
          price: typeof price === 'number' ? price : 0,
          available: item.get('available') !== false,
          updatedAt: item.updatedAt ? item.updatedAt.toISOString() : '',
        };
      });
      setMenuItems(normalized);
    } catch (error) {
      console.error('Erro ao buscar cardápio', error);
      showStatus('error', `Não foi possível carregar o cardápio: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchWeather = useCallback(async (cityId) => {
    const city = cities.find((item) => item.id === cityId);
    if (!city) {
      return;
    }

    setIsWeatherLoading(true);
    setWeatherStatus('');

    try {
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current_weather=true&timezone=auto`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Resposta inválida ao consultar clima');
      }
      const data = await response.json();
      if (!data.current_weather) {
        throw new Error('Clima atual indisponível para a cidade selecionada');
      }
      setWeather({
        city: city.name,
        temperature: data.current_weather.temperature,
        windspeed: data.current_weather.windspeed,
        weathercode: data.current_weather.weathercode,
        time: data.current_weather.time,
      });
      setWeatherStatus('Previsão carregada com sucesso.');
    } catch (error) {
      console.error('Erro ao buscar clima', error);
      setWeatherStatus(`Erro ao buscar clima: ${error.message}`);
      setWeather(null);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMenu();
  }, [refreshMenu]);

  useEffect(() => {
    fetchWeather(selectedCity);
  }, [fetchWeather, selectedCity]);

  const filteredItems = useMemo(() => {
    if (!searchTerm) {
      return menuItems;
    }
    const term = searchTerm.toLowerCase();
    return menuItems.filter((item) => {
      return (
        item.name.toLowerCase().includes(term) ||
        item.description.toLowerCase().includes(term)
      );
    });
  }, [menuItems, searchTerm]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleCheckboxChange = (event) => {
    const { checked } = event.target;
    setFormData((current) => ({
      ...current,
      available: checked,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    showStatus('info', 'Enviando dados para o Back4App...');

    try {
      const Parse = await getParse();
      const priceValue = Number(formData.price);
      if (Number.isNaN(priceValue)) {
        throw new Error('Preço deve ser um número válido');
      }

      if (!formData.name.trim()) {
        throw new Error('Nome do prato é obrigatório');
      }

      if (formData.id) {
        const menuItem = Parse.Object.createWithoutData('MenuItem', formData.id);
        menuItem.set('name', formData.name.trim());
        menuItem.set('description', formData.description.trim());
        menuItem.set('price', priceValue);
        menuItem.set('available', formData.available);
        await menuItem.save();
        showStatus('success', 'Prato atualizado com sucesso.');
      } else {
        const menuItem = new Parse.Object('MenuItem');
        menuItem.set('name', formData.name.trim());
        menuItem.set('description', formData.description.trim());
        menuItem.set('price', priceValue);
        menuItem.set('available', formData.available);
        await menuItem.save();
        showStatus('success', 'Prato cadastrado com sucesso.');
      }

      resetForm();
      await refreshMenu();
    } catch (error) {
      console.error('Erro ao salvar prato', error);
      showStatus('error', `Erro ao salvar prato: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      available: item.available,
    });
    showStatus('info', `Editando o prato: ${item.name}`);
  };

  const handleDelete = async (itemId) => {
    const confirmation = window.confirm('Tem certeza que deseja remover este prato?');
    if (!confirmation) {
      return;
    }

    setIsLoading(true);
    showStatus('info', 'Removendo prato...');

    try {
      const Parse = await getParse();
      const menuItem = Parse.Object.createWithoutData('MenuItem', itemId);
      await menuItem.destroy();
      showStatus('success', 'Prato removido com sucesso.');
      await refreshMenu();
    } catch (error) {
      console.error('Erro ao remover prato', error);
      showStatus('error', `Erro ao remover prato: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main>
      <header>
        <h1>Gestão de Cardápio do Restaurante</h1>
        <p>Gerencie pratos, acompanhe atualizações e veja a previsão do tempo para planejar o dia.</p>
      </header>

      <section>
        <h2>Controle de clima</h2>
        <label htmlFor="city-selector">Selecione uma cidade para consultar o clima:</label>
        <select
          id="city-selector"
          value={selectedCity}
          onChange={(event) => setSelectedCity(event.target.value)}
        >
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name}
            </option>
          ))}
        </select>
        {isWeatherLoading && <p>Carregando clima...</p>}
        {weatherStatus && <p>{weatherStatus}</p>}
        {weather && (
          <article>
            <h3>Clima atual em {weather.city}</h3>
            <p>Horário da medição: {new Date(weather.time).toLocaleString()}</p>
            <p>Temperatura: {weather.temperature} °C</p>
            <p>Velocidade do vento: {weather.windspeed} km/h</p>
            <p>Código do tempo: {weather.weathercode}</p>
          </article>
        )}
      </section>

      <section>
        <h2>Cadastro de pratos</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Nome do prato</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ex.: Moqueca"
              required
            />
          </div>
          <div>
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detalhe os ingredientes e diferenciais"
              rows={3}
            />
          </div>
          <div>
            <label htmlFor="price">Preço (R$)</label>
            <input
              id="price"
              name="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <label htmlFor="available">
              <input
                id="available"
                name="available"
                type="checkbox"
                checked={formData.available}
                onChange={handleCheckboxChange}
              />
              Disponível no cardápio
            </label>
          </div>
          <div>
            <button type="submit" disabled={isLoading}>
              {formData.id ? 'Atualizar prato' : 'Cadastrar prato'}
            </button>
            <button type="button" onClick={resetForm} disabled={isLoading}>
              Limpar formulário
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2>Cardápio atual</h2>
        <div>
          <label htmlFor="search">Buscar por nome ou descrição:</label>
          <input
            id="search"
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Digite para filtrar"
          />
        </div>
        {statusMessage && (
          <p>
            {statusType === 'error' ? '⚠️ ' : statusType === 'success' ? '✅ ' : 'ℹ️ '}
            {statusMessage}
          </p>
        )}
        {isLoading && <p>Carregando informações...</p>}
        {!isLoading && filteredItems.length === 0 && (
          <p>Nenhum prato encontrado. Cadastre itens para compor o cardápio.</p>
        )}
        <ul>
          {filteredItems.map((item) => (
            <li key={item.id}>
              <h3>{item.name}</h3>
              <p>{item.description || 'Sem descrição'}</p>
              <p>Preço: R$ {item.price.toFixed(2)}</p>
              <p>Status: {item.available ? 'Disponível' : 'Indisponível'}</p>
              {item.updatedAt && <p>Atualizado em: {new Date(item.updatedAt).toLocaleString()}</p>}
              <div>
                <button type="button" onClick={() => handleEdit(item)} disabled={isLoading}>
                  Editar
                </button>
                <button type="button" onClick={() => handleDelete(item.id)} disabled={isLoading}>
                  Remover
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
