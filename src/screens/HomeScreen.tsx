interface Props {
  onStart: () => void;
}

export function HomeScreen({ onStart }: Props) {
  return (
    <div className="screen">
      <div className="spacer" />
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 14 }}>⚽️</div>
        <h1 className="title">Bolão</h1>
        <p className="subtitle">
          Monte o confronto e registre os palpites da galera.
        </p>
      </div>
      <div className="spacer" />
      <button className="btn btn-primary" onClick={onStart}>
        Começar bolão
      </button>
    </div>
  );
}
