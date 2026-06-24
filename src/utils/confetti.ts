// Confete leve, sem dependências, via Web Animations API.
// Cria peças coloridas que caem da parte de cima e se limpam sozinhas.
const COLORS = ["#1f7a39", "#f1c40f", "#e74c3c", "#3498db", "#9b59b6", "#e67e22"];

export function burstConfetti(count = 90): void {
  if (typeof document === "undefined") return;
  // Respeita quem prefere menos movimento.
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

  const layer = document.createElement("div");
  layer.style.cssText =
    "position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden";
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    const size = 6 + Math.random() * 8;
    const startX = Math.random() * 100;
    const color = COLORS[(Math.random() * COLORS.length) | 0];
    piece.style.cssText = `position:absolute;top:-16px;left:${startX}vw;width:${size}px;height:${
      size * 0.6
    }px;background:${color};border-radius:2px;opacity:0`;
    layer.appendChild(piece);

    const driftX = (Math.random() - 0.5) * 220;
    const duration = 1800 + Math.random() * 1400;
    const delay = Math.random() * 250;

    piece.animate(
      [
        { transform: "translate(0,0) rotate(0deg)", opacity: 1 },
        {
          transform: `translate(${driftX}px, 105vh) rotate(${
            540 + Math.random() * 540
          }deg)`,
          opacity: 1,
        },
      ],
      { duration, delay, easing: "cubic-bezier(.2,.6,.4,1)", fill: "forwards" }
    );
  }

  window.setTimeout(() => layer.remove(), 3600);
}
