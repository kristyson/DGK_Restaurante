'use client';

import Header from '@/app/components/Header';
import Footer from '@/app/components/Footer';

export default function Home() {
  return (
    <div>
      <Header />
      
      <main>
        <h2>Bem-vindo ao sistema do DGK Restaurante</h2>
        <p>
          Aqui você poderá gerenciar o cardápio, visualizar informações do clima
          e organizar promoções.  
          (Funcionalidades removidas nesta versão simplificada).
        </p>
      </main>

      <Footer />
    </div>
  );
}
