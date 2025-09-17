'use client';

import { useEffect, useMemo, useState } from 'react';

const APP_ID = 'VXY7L2vhMJd5FlohOKs8m4LTS9N9a2IbdCTtPrlM';
const CLIENT_KEY = 'zQrntobRZgMVspU7J7lk728NEytCVkcJ90pfjSb9';
const PARSE_BASE_URL = 'https://parseapi.back4app.com';
const MENU_CLASS = 'MenuItem';

const emptyForm = {
  name: '',
  description: '',
  price: '',
  category: '',
  available: true,
};

const weatherLocations = {
  'São Paulo, BR': { latitude: -23.5505, longitude: -46.6333 },
  'Rio de Janeiro, BR': { latitude: -22.9068, longitude: -43.1729 },
  'Belo Horizonte, BR': { latitude: -19.9167, longitude: -43.9345 },
};

async function parseRequest(path, options = {}) {
  const { method = 'GET', body } = options;
  const headers = {
    'X-Parse-Application-Id': APP_ID,
    'X-Parse-Client-Key': CLIENT_KEY,
  };
  const fetchOptions = {
    method,
    headers,
  };
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
    } catch (error) {
      throw new Error('Não foi possível interpretar a resposta do servidor.');
    }
  }

  if (!response.ok) {
    const message = data?.error || `Erro ${response.status}`;
    throw new Error(message);
  }

  return data || {};
}

async function loadWeatherForCity(cityKey) {
  const location = weatherLocations[cityKey];
  if (!location) {
    throw new Error('Localização desconhecida.');
  }
  const { latitude, longitude } = location;
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&timezone=America%2FSao_Paulo`;
  const weatherResponse = await fetch(url);
  if (!weatherResponse.ok) {
    throw new Error('Não foi possível obter a previsão do tempo.');
  }
  const weatherData = await weatherResponse.json();
  return weatherData?.current_weather || null;
}

export default function Home() {
  const [menuItems, setMenuItems] = useState([]);
  const [formData, setFormData] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [weatherCity, setWeatherCity] = useState('São Paulo, BR');
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherMessage, setWeatherMessage] = useState('');

  const sortedItems = useMemo(() => {
    return [...menuItems].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [menuItems]);

  useEffect(() => {
    refreshMenu();
  }, []);

  useEffect(() => {
    refreshWeather(weatherCity);
  }, [weatherCity]);

  async function refreshMenu() {
    setIsLoadingMenu(true);
    setStatusMessage('');
    try {
      const { results } = await parseRequest(`/classes/${MENU_CLASS}`);
      setMenuItems(Array.isArray(results) ? results : []);
    } catch (error) {
      setStatusMessage(`Erro ao carregar itens: ${error.message}`);
    } finally {
      setIsLoadingMenu(false);
    }
  }

  async function refreshWeather(cityKey) {
    setWeatherMessage('');
    try {
      const weather = await loadWeatherForCity(cityKey);
      setWeatherInfo(weather);
    } catch (error) {
      setWeatherInfo(null);
      setWeatherMessage(error.message);
    }
  }

  function updateForm(field, value) {
    setFormData((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatusMessage('');
    try {
      const priceNumber = Number(formData.price);
      if (!formData.name.trim()) {
        throw new Error('Informe um nome para o prato.');
      }
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        throw new Error('Informe um preço válido.');
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: priceNumber,
        category: formData.category.trim(),
        available: Boolean(formData.available),
      };

      if (editingId) {
        await parseRequest(`/classes/${MENU_CLASS}/${editingId}`, {
          method: 'PUT',
          body: payload,
        });
        setStatusMessage('Item atualizado com sucesso.');
      } else {
        await parseRequest(`/classes/${MENU_CLASS}`, {
          method: 'POST',
          body: payload,
        });
        setStatusMessage('Novo item adicionado ao cardápio.');
      }

      setFormData(emptyForm);
      setEditingId(null);
      await refreshMenu();
    } catch (error) {
      setStatusMessage(`Erro: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  }

  function handleEdit(item) {
    setFormData({
      name: item.name || '',
      description: item.description || '',
      price: item.price != null ? String(item.price) : '',
      category: item.category || '',
      available: item.available !== false,
    });
    setEditingId(item.objectId);
    setStatusMessage('Editando item selecionado.');
  }

  async function handleDelete(item) {
    const confirmed = window.confirm(`Deseja remover "${item.name}" do cardápio?`);
    if (!confirmed) {
      return;
    }
    setStatusMessage('Removendo item...');
    try {
      await parseRequest(`/classes/${MENU_CLASS}/${item.objectId}`, {
        method: 'DELETE',
      });
      setStatusMessage('Item removido com sucesso.');
      await refreshMenu();
    } catch (error) {
      setStatusMessage(`Erro ao remover: ${error.message}`);
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setFormData(emptyForm);
    setStatusMessage('Edição cancelada.');
  }

  async function handleToggleAvailability(item) {
    const newAvailability = !item.available;
    setStatusMessage('Atualizando disponibilidade...');
    try {
      await parseRequest(`/classes/${MENU_CLASS}/${item.objectId}`, {
        method: 'PUT',
        body: { available: newAvailability },
      });
      setStatusMessage('Disponibilidade atualizada.');
      await refreshMenu();
    } catch (error) {
      setStatusMessage(`Erro ao atualizar disponibilidade: ${error.message}`);
    }
  }

  const totalAvailable = useMemo(() => {
    return menuItems.reduce((total, item) => {
      if (item.available !== false) {
        return total + 1;
      }
      return total;
    }, 0);
  }, [menuItems]);

  return (
    <div>
      <header>
        <h1>DGK Restaurante - Gestão do Cardápio</h1>
        <p>
          Faça o controle completo dos pratos e acompanhe o clima para planejar promoções e eventos especiais.
        </p>
      </header>

      <section>
        <h2>Condições do tempo</h2>
        <label htmlFor="weather-city">Escolha uma cidade:</label>
        <select
          id="weather-city"
          value={weatherCity}
          onChange={(event) => setWeatherCity(event.target.value)}
        >
          {Object.keys(weatherLocations).map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
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

      <section>
        <h2>{editingId ? 'Editar prato' : 'Adicionar novo prato'}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="name">Nome</label>
            <input
              id="name"
              value={formData.name}
              onChange={(event) => updateForm('name', event.target.value)}
              placeholder="Ex: Moqueca de peixe"
            />
          </div>
          <div>
            <label htmlFor="description">Descrição</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(event) => updateForm('description', event.target.value)}
              placeholder="Detalhes sobre o prato, ingredientes e destaques"
            />
          </div>
          <div>
            <label htmlFor="price">Preço (R$)</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={(event) => updateForm('price', event.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="category">Categoria</label>
            <input
              id="category"
              value={formData.category}
              onChange={(event) => updateForm('category', event.target.value)}
              placeholder="Entrada, prato principal, sobremesa..."
            />
          </div>
          <div>
            <label htmlFor="available">Disponível para venda?</label>
            <select
              id="available"
              value={formData.available ? 'true' : 'false'}
              onChange={(event) => updateForm('available', event.target.value === 'true')}
            >
              <option value="true">Sim</option>
              <option value="false">Não</option>
            </select>
          </div>
          <div>
            <button type="submit" disabled={isSaving}>
              {editingId ? 'Salvar alterações' : 'Adicionar prato'}
            </button>
            {editingId && (
              <button type="button" onClick={handleCancelEdit} disabled={isSaving}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>
      </section>

      <section>
        <h2>Cardápio cadastrado</h2>
        <p>
          Total de pratos: {menuItems.length} | Disponíveis para venda: {totalAvailable}
        </p>
        <button type="button" onClick={refreshMenu} disabled={isLoadingMenu}>
          Atualizar lista
        </button>
        {statusMessage && <p>{statusMessage}</p>}
        {isLoadingMenu && <p>Carregando itens...</p>}
        {!isLoadingMenu && sortedItems.length === 0 && (
          <p>Nenhum prato cadastrado até o momento. Utilize o formulário para adicionar novos pratos.</p>
        )}
        {!isLoadingMenu && sortedItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Disponível</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.objectId}>
                  <td>{item.name}</td>
                  <td>{item.description || '—'}</td>
                  <td>
                    {typeof item.price === 'number'
                      ? item.price.toLocaleString('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        })
                      : '—'}
                  </td>
                  <td>{item.category || '—'}</td>
                  <td>{item.available !== false ? 'Sim' : 'Não'}</td>
                  <td>
                    <button type="button" onClick={() => handleEdit(item)}>
                      Editar
                    </button>
                    <button type="button" onClick={() => handleToggleAvailability(item)}>
                      Alternar disponibilidade
                    </button>
                    <button type="button" onClick={() => handleDelete(item)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer>
        <p>
          As alterações são salvas diretamente no Back4App, permitindo que toda a equipe acompanhe o cardápio em tempo real.
        </p>
      </footer>
    </div>
  );
}
