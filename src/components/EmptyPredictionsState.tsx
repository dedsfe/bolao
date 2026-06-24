// Estado vazio elegante exibido quando ainda não há palpites.
export function EmptyPredictionsState() {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">📝</div>
      <p className="empty-state__title">Nenhum palpite ainda.</p>
      <p className="empty-state__subtitle">
        Adicione o primeiro palpite do bolão.
      </p>
    </div>
  );
}
