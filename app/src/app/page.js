'use client';

import { useEffect, useMemo, useState } from 'react';

const APP_ID = 'VXY7L2vhMJd5FlohOKs8m4LTS9N9a2IbdCTtPrlM';
const CLIENT_KEY = 'zQrntobRZgMVspU7J7lk728NEytCVkcJ90pfjSb9';
const PARSE_BASE_URL = 'https://parseapi.back4app.com';
const MENU_CLASS = 'MenuItem';

const weatherLocations = {
  'Recife - PE': { latitude: -8.0432784, longitude: -35.0990265 },
  'Olinda - PE': { latitude: -7.9965313, longitude: -34.8720278 },
  'Jaboatão dos Guararapes - PE': { latitude: -8.145843, longitude: -35.1651605 },
};

const unitOptions = Object.keys(weatherLocations);
const locationOptions = ['TODOS', ...unitOptions];
const defaultCity = locationOptions[0];
const defaultUnit = unitOptions[0];

const categoryOptions = [
  'Entrada',
  'Prato principal',
  'Sobremesa',
  'Bebida',
  'Promoção',
];

function createEmptyForm(selectedUnit = defaultUnit) {
  return {
    name: '',
    description: '',
    price: '',
    category: '',
    unit: selectedUnit,
    available: true,
    applyAllUnits: false,
  };
}

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
  const [formData, setFormData] = useState(() => createEmptyForm(defaultUnit));
  const [editingId, setEditingId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingMenu, setIsLoadingMenu] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  const [weatherCity, setWeatherCity] = useState(defaultCity);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [weatherMessage, setWeatherMessage] = useState('');
  const [filters, setFilters] = useState({
    name: '',
    category: 'TODAS',
    availability: 'TODOS',
    minPrice: '',
    maxPrice: '',
  });

  const selectableCategories = useMemo(() => {
    const combined = new Set(categoryOptions);
    menuItems.forEach((item) => {
      if (item?.category) {
        combined.add(item.category);
      }
    });
    return Array.from(combined);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (weatherCity !== 'TODOS' && item?.unit !== weatherCity) {
        return false;
      }

      const normalizedName = filters.name.trim().toLowerCase();
      if (normalizedName && !(item.name || '').toLowerCase().includes(normalizedName)) {
        return false;
      }

      if (filters.category !== 'TODAS' && item.category !== filters.category) {
        return false;
      }

      if (filters.availability !== 'TODOS') {
        const isAvailable = item.available !== false;
        if (filters.availability === 'DISPONIVEL' && !isAvailable) {
          return false;
        }
        if (filters.availability === 'INDISPONIVEL' && isAvailable) {
          return false;
        }
      }

      if (filters.minPrice !== '') {
        const minPriceNumber = Number(filters.minPrice);
        if (!Number.isNaN(minPriceNumber)) {
          if (typeof item.price !== 'number' || item.price < minPriceNumber) {
            return false;
          }
        }
      }

      if (filters.maxPrice !== '') {
        const maxPriceNumber = Number(filters.maxPrice);
        if (!Number.isNaN(maxPriceNumber)) {
          if (typeof item.price !== 'number' || item.price > maxPriceNumber) {
            return false;
          }
        }
      }

      return true;
    });
  }, [menuItems, weatherCity, filters]);

  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const nameA = (a.name || '').toLowerCase();
      const nameB = (b.name || '').toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });
  }, [filteredItems]);

  useEffect(() => {
    refreshMenu();
  }, []);

  useEffect(() => {
    refreshWeather(weatherCity);
  }, [weatherCity]);

  useEffect(() => {
    if (!editingId) {
      setFormData((previous) => ({
        ...previous,
        unit: unitOptions.includes(weatherCity) ? weatherCity : defaultUnit,
      }));
    }
  }, [weatherCity, editingId]);

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
    if (cityKey === 'TODOS') {
      setWeatherInfo(null);
      setWeatherMessage('Selecione uma cidade específica para ver o clima.');
      return;
    }

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
      const trimmedName = formData.name.trim();
      const categoryValue = formData.category ? formData.category.trim() : '';
      const unitValue = formData.unit;

      if (!trimmedName) {
        throw new Error('Informe um nome para o prato.');
      }
      if (Number.isNaN(priceNumber) || priceNumber < 0) {
        throw new Error('Informe um preço válido.');
      }
      if (!categoryValue) {
        throw new Error('Selecione uma categoria.');
      }
      if (!formData.applyAllUnits && !unitValue) {
        throw new Error('Selecione a unidade responsável.');
      }

      const payload = {
        name: trimmedName,
        description: formData.description.trim(),
        price: priceNumber,
        category: categoryValue,
        available: Boolean(formData.available),
      };

      if (editingId) {
        payload.unit = unitValue;
        await parseRequest(`/classes/${MENU_CLASS}/${editingId}`, {
          method: 'PUT',
          body: payload,
        });
        setStatusMessage('Item atualizado com sucesso.');
      } else {
        const targetUnits = formData.applyAllUnits ? unitOptions : [unitValue];
        for (const unit of targetUnits) {
          await parseRequest(`/classes/${MENU_CLASS}`, {
            method: 'POST',
            body: {
              ...payload,
              unit,
            },
          });
        }
        setStatusMessage('Novo item adicionado ao cardápio.');
      }

      setFormData(createEmptyForm(unitOptions.includes(weatherCity) ? weatherCity : defaultUnit));
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
      unit: item.unit || (unitOptions.includes(weatherCity) ? weatherCity : defaultUnit),
      available: item.available !== false,
      applyAllUnits: false,
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
    setFormData(createEmptyForm(unitOptions.includes(weatherCity) ? weatherCity : defaultUnit));
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
    return filteredItems.reduce((total, item) => {
      if (item.available !== false) {
        return total + 1;
      }
      return total;
    }, 0);
  }, [filteredItems]);

  function updateFilter(field, value) {
    setFilters((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

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
          {locationOptions.map((city) => (
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
            <label htmlFor="unit">Unidade</label>
            <select
              id="unit"
              value={formData.unit}
              onChange={(event) => updateForm('unit', event.target.value)}
              disabled={formData.applyAllUnits}
            >
              {unitOptions.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="category">Categoria</label>
            <select
              id="category"
              value={formData.category}
              onChange={(event) => updateForm('category', event.target.value)}
            >
              <option value="">Selecione uma categoria</option>
              {selectableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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
          {!editingId && (
            <div>
              <label htmlFor="apply-all-units">Adicionar em todas as unidades?</label>
              <input
                id="apply-all-units"
                type="checkbox"
                checked={formData.applyAllUnits}
                onChange={(event) => updateForm('applyAllUnits', event.target.checked)}
              />
            </div>
          )}
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
          Total de pratos exibidos: {sortedItems.length} | Disponíveis para venda: {totalAvailable}
        </p>
        <div>
          <div>
            <label htmlFor="filter-name">Filtrar por nome</label>
            <input
              id="filter-name"
              value={filters.name}
              onChange={(event) => updateFilter('name', event.target.value)}
              placeholder="Buscar por nome"
            />
          </div>
          <div>
            <label htmlFor="filter-category">Filtrar por categoria</label>
            <select
              id="filter-category"
              value={filters.category}
              onChange={(event) => updateFilter('category', event.target.value)}
            >
              <option value="TODAS">Todas</option>
              {selectableCategories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="filter-availability">Disponibilidade</label>
            <select
              id="filter-availability"
              value={filters.availability}
              onChange={(event) => updateFilter('availability', event.target.value)}
            >
              <option value="TODOS">Todos</option>
              <option value="DISPONIVEL">Disponíveis</option>
              <option value="INDISPONIVEL">Indisponíveis</option>
            </select>
          </div>
          <div>
            <label htmlFor="filter-min-price">Preço mínimo</label>
            <input
              id="filter-min-price"
              type="number"
              step="0.01"
              value={filters.minPrice}
              onChange={(event) => updateFilter('minPrice', event.target.value)}
              placeholder="0.00"
            />
          </div>
          <div>
            <label htmlFor="filter-max-price">Preço máximo</label>
            <input
              id="filter-max-price"
              type="number"
              step="0.01"
              value={filters.maxPrice}
              onChange={(event) => updateFilter('maxPrice', event.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
        <button type="button" onClick={refreshMenu} disabled={isLoadingMenu}>
          Atualizar lista
        </button>
        {statusMessage && <p>{statusMessage}</p>}
        {isLoadingMenu && <p>Carregando itens...</p>}
        {!isLoadingMenu && sortedItems.length === 0 && (
          <p>Nenhum prato encontrado para os filtros selecionados.</p>
        )}
        {!isLoadingMenu && sortedItems.length > 0 && (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Descrição</th>
                <th>Preço</th>
                <th>Categoria</th>
                <th>Unidade</th>
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
                  <td>{item.unit || '—'}</td>
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
