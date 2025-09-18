'use client';

import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import WeatherSection from '@/components/WeatherSection';
import MenuForm from '@/components/MenuForm';
import Filters from '@/components/Filters';
import MenuTable from '@/components/MenuTable';
import Footer from '@/components/Footer';
import { parseRequest, loadWeatherForCity, MENU_CLASS, weatherLocations } from '@/lib/parseApi';

const unitOptions = Object.keys(weatherLocations);
const locationOptions = ['TODOS', ...unitOptions];
const defaultCity = locationOptions[0];
const defaultUnit = unitOptions[0];
const categoryOptions = ['Entrada', 'Prato principal', 'Sobremesa', 'Bebida', 'Promoção'];

function createEmptyForm(selectedUnit = defaultUnit) {
  return { name: '', description: '', price: '', category: '', unit: selectedUnit, available: true, applyAllUnits: false };
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
  const [filters, setFilters] = useState({ name: '', category: 'TODAS', availability: 'TODOS', minPrice: '', maxPrice: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'unit', direction: 'asc' });

  const selectableCategories = useMemo(() => {
    const combined = new Set(categoryOptions);
    menuItems.forEach((i) => i?.category && combined.add(i.category));
    return Array.from(combined);
  }, [menuItems]);

  const filteredItems = useMemo(() => {
    return menuItems.filter((item) => {
      if (weatherCity !== 'TODOS' && item?.unit !== weatherCity) return false;
      if (filters.name && !(item.name || '').toLowerCase().includes(filters.name.toLowerCase())) return false;
      if (filters.category !== 'TODAS' && item.category !== filters.category) return false;
      if (filters.availability !== 'TODOS') {
        const isAvailable = item.available !== false;
        if (filters.availability === 'DISPONIVEL' && !isAvailable) return false;
        if (filters.availability === 'INDISPONIVEL' && isAvailable) return false;
      }
      if (filters.minPrice && item.price < Number(filters.minPrice)) return false;
      if (filters.maxPrice && item.price > Number(filters.maxPrice)) return false;
      return true;
    });
  }, [menuItems, weatherCity, filters]);

  const sortedItems = useMemo(() => {
    const items = [...filteredItems];
    const { key, direction } = sortConfig;
    items.sort((a, b) => {
      let valueA = key === 'price' ? (typeof a.price === 'number' ? a.price : -Infinity) : (a[key] || '').toString().toLowerCase();
      let valueB = key === 'price' ? (typeof b.price === 'number' ? b.price : -Infinity) : (b[key] || '').toString().toLowerCase();
      if (valueA < valueB) return direction === 'asc' ? -1 : 1;
      if (valueA > valueB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [filteredItems, sortConfig]);

  const totalAvailable = useMemo(() => filteredItems.filter((i) => i.available !== false).length, [filteredItems]);

  useEffect(() => { refreshMenu(); }, []);
  useEffect(() => { refreshWeather(weatherCity); }, [weatherCity]);
  useEffect(() => { if (!editingId) setFormData((p) => ({ ...p, unit: unitOptions.includes(weatherCity) ? weatherCity : defaultUnit })); }, [weatherCity, editingId]);

  async function refreshMenu() {
    setIsLoadingMenu(true); setStatusMessage('');
    try {
      const { results } = await parseRequest(`/classes/${MENU_CLASS}`);
      setMenuItems(Array.isArray(results) ? results : []);
    } catch (err) { setStatusMessage(`Erro: ${err.message}`); }
    finally { setIsLoadingMenu(false); }
  }

  async function refreshWeather(city) {
    if (city === 'TODOS') { setWeatherInfo(null); setWeatherMessage('Selecione uma cidade.'); return; }
    try { setWeatherInfo(await loadWeatherForCity(city)); setWeatherMessage(''); }
    catch (err) { setWeatherInfo(null); setWeatherMessage(err.message); }
  }

  function updateForm(field, value) { setFormData((p) => ({ ...p, [field]: value })); }
  function updateFilter(field, value) { setFilters((p) => ({ ...p, [field]: value })); }

  function toggleSort(key) {
    setSortConfig((p) => p.key === key ? { key, direction: p.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' });
  }
  function renderSortIndicator(col) { return sortConfig.key === col ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓') : null; }

  async function handleSubmit(e) {
    e.preventDefault(); setIsSaving(true); setStatusMessage('');
    try {
      const price = Number(formData.price);
      if (!formData.name.trim()) throw new Error('Informe um nome.');
      if (Number.isNaN(price) || price < 0) throw new Error('Preço inválido.');
      if (!formData.category) throw new Error('Selecione categoria.');
      if (!formData.applyAllUnits && !formData.unit) throw new Error('Selecione unidade.');

      const payload = { name: formData.name.trim(), description: formData.description.trim(), price, category: formData.category, available: !!formData.available };

      if (editingId) {
        await parseRequest(`/classes/${MENU_CLASS}/${editingId}`, { method: 'PUT', body: { ...payload, unit: formData.unit } });
        setStatusMessage('Item atualizado.');
      } else {
        const targets = formData.applyAllUnits ? unitOptions : [formData.unit];
        for (const unit of targets) await parseRequest(`/classes/${MENU_CLASS}`, { method: 'POST', body: { ...payload, unit } });
        setStatusMessage('Novo item adicionado.');
      }

      setFormData(createEmptyForm(unitOptions.includes(weatherCity) ? weatherCity : defaultUnit));
      setEditingId(null); refreshMenu();
    } catch (err) { setStatusMessage(`Erro: ${err.message}`); }
    finally { setIsSaving(false); }
  }

  function handleEdit(item) {
    setFormData({ name: item.name || '', description: item.description || '', price: item.price != null ? String(item.price) : '', category: item.category || '', unit: item.unit || defaultUnit, available: item.available !== false, applyAllUnits: false });
    setEditingId(item.objectId); setStatusMessage('Editando item.');
  }

  async function handleDelete(item) {
    if (!window.confirm(`Deseja remover "${item.name}"?`)) return;
    try { await parseRequest(`/classes/${MENU_CLASS}/${item.objectId}`, { method: 'DELETE' }); setStatusMessage('Item removido.'); refreshMenu(); }
    catch (err) { setStatusMessage(`Erro: ${err.message}`); }
  }

  async function handleToggleAvailability(item) {
    try { await parseRequest(`/classes/${MENU_CLASS}/${item.objectId}`, { method: 'PUT', body: { available: !item.available } }); setStatusMessage('Disponibilidade atualizada.'); refreshMenu(); }
    catch (err) { setStatusMessage(`Erro: ${err.message}`); }
  }

  function handleCancelEdit() { setEditingId(null); setFormData(createEmptyForm(defaultUnit)); setStatusMessage('Edição cancelada.'); }

  return (
    <div>
      <Header />
      <WeatherSection {...{ weatherCity, setWeatherCity, locationOptions, weatherInfo, weatherMessage }} />
      <MenuForm {...{ editingId, formData, selectableCategories, unitOptions, weatherCity, updateForm, handleSubmit, handleCancelEdit, isSaving }} />
      <Filters {...{ filters, updateFilter, selectableCategories }} />
      <MenuTable {...{ sortedItems, totalAvailable, isLoadingMenu, statusMessage, refreshMenu, handleEdit, handleToggleAvailability, handleDelete, toggleSort, renderSortIndicator }} />
      <Footer />
    </div>
  );
}
