interface Props {
  onStart: () => void;
}

export function HomeScreen({ onStart }: Props) {
  return (
    <div className="home-screen">
      <div className="home-screen__bg-glow"></div>
      
      <div className="home-screen__content">
        <div className="home-screen__hero">
          <div className="home-screen__icon-wrapper">
            <span className="home-screen__icon">⚽️</span>
          </div>
          <h1 className="home-screen__title">Bolão <span>Pro</span></h1>
          <p className="home-screen__subtitle">
            Crie confrontos, registre os palpites da galera e acompanhe o ranking em tempo real.
          </p>
        </div>

        <div className="home-screen__features">
          <div className="feature-item">
            <span>⚡️</span> Resultados Ao Vivo
          </div>
          <div className="feature-item">
            <span>🏆</span> Pódio Interativo
          </div>
          <div className="feature-item">
            <span>📊</span> Ranking Automático
          </div>
        </div>
      </div>

      <div className="home-screen__footer">
        <button className="home-screen__btn" onClick={onStart}>
          Começar Bolão 🚀
        </button>
      </div>
    </div>
  );
}
