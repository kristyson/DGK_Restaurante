export default function MenuForm({
  editingId, formData, selectableCategories, unitOptions, weatherCity,
  updateForm, handleSubmit, handleCancelEdit, isSaving
}) {
  return (
    <section>
      <h2>{editingId ? 'Editar prato' : 'Adicionar novo prato'}</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="name">Nome</label>
          <input id="name" value={formData.name} onChange={(e) => updateForm('name', e.target.value)} />
        </div>

        <div>
          <label htmlFor="description">Descrição</label>
          <textarea id="description" value={formData.description} onChange={(e) => updateForm('description', e.target.value)} />
        </div>

        <div>
          <label htmlFor="price">Preço (R$)</label>
          <input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => updateForm('price', e.target.value)} />
        </div>

        <div>
          <label htmlFor="unit">Unidade</label>
          <select id="unit" value={formData.unit} onChange={(e) => updateForm('unit', e.target.value)} disabled={formData.applyAllUnits}>
            {unitOptions.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="category">Categoria</label>
          <select id="category" value={formData.category} onChange={(e) => updateForm('category', e.target.value)}>
            <option value="">Selecione uma categoria</option>
            {selectableCategories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="available">Disponível?</label>
          <select id="available" value={formData.available ? 'true' : 'false'} onChange={(e) => updateForm('available', e.target.value === 'true')}>
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        </div>

        {!editingId && (
          <div>
            <label htmlFor="apply-all-units">Adicionar em todas as unidades?</label>
            <input id="apply-all-units" type="checkbox" checked={formData.applyAllUnits} onChange={(e) => updateForm('applyAllUnits', e.target.checked)} />
          </div>
        )}

        <div>
          <button type="submit" disabled={isSaving}>{editingId ? 'Salvar alterações' : 'Adicionar prato'}</button>
          {editingId && <button type="button" onClick={handleCancelEdit}>Cancelar edição</button>}
        </div>
      </form>
    </section>
  );
}
