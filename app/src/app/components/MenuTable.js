import styles from "../page.module.css";

export default function MenuTable({
  sortedItems, totalAvailable, isLoadingMenu, statusMessage,
  refreshMenu, handleEdit, handleToggleAvailability, handleDelete,
  toggleSort, renderSortIndicator
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHeader}>
        <h2>Cardápio cadastrado</h2>
        <p>
          Total de pratos exibidos: {sortedItems.length} | Disponíveis: {totalAvailable}
        </p>
      </div>

      <div className={styles.filtersPanel}>
        <button
          type="button"
          onClick={refreshMenu}
          disabled={isLoadingMenu}
          className={`${styles.primaryButton} ${styles.refreshButton}`}
        >
          Atualizar lista
        </button>
      </div>

      {statusMessage && <p className={styles.feedback}>{statusMessage}</p>}
      {isLoadingMenu && <p>Carregando itens...</p>}

      {!isLoadingMenu && sortedItems.length === 0 && (
        <p>Nenhum prato encontrado.</p>
      )}

      {!isLoadingMenu && sortedItems.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>
                  <button onClick={() => toggleSort("name")}>
                    Nome{renderSortIndicator("name")}
                  </button>
                </th>
                <th>Descrição</th>
                <th>
                  <button onClick={() => toggleSort("price")}>
                    Preço{renderSortIndicator("price")}
                  </button>
                </th>
                <th>Categoria</th>
                <th>
                  <button onClick={() => toggleSort("unit")}>
                    Unidade{renderSortIndicator("unit")}
                  </button>
                </th>
                <th>Disponível</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => (
                <tr key={item.objectId}>
                  <td>{item.name}</td>
                  <td>{item.description || "—"}</td>
                  <td>
                    {typeof item.price === "number"
                      ? item.price.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })
                      : "—"}
                  </td>
                  <td>{item.category || "—"}</td>
                  <td>{item.unit || "—"}</td>
                  <td>{item.available !== false ? "Sim" : "Não"}</td>
                  <td className={styles.tableActions}>
                    <button onClick={() => handleEdit(item)}>Editar</button>
                    <button onClick={() => handleToggleAvailability(item)}>
                      Alternar
                    </button>
                    <button onClick={() => handleDelete(item)}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
