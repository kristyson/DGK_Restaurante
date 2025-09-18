import styles from "../page.module.css";

export default function Header() {
  return (
    <header className={styles.sectionHeader}>
      <h2>DGK Restaurante - Gestão do Cardápio</h2>
      <p>
        Faça o controle completo dos pratos e acompanhe o clima para planejar promoções e eventos especiais.
      </p>
    </header>
  );
}
