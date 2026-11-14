export default function GlassCard({ children, className = "" }) {
  const tiltCard = (event) => {
    if (event.pointerType !== "mouse" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const bounds = event.currentTarget.getBoundingClientRect();
    const horizontal = (event.clientX - bounds.left) / bounds.width;
    const vertical = (event.clientY - bounds.top) / bounds.height;
    event.currentTarget.style.setProperty("--card-tilt-x", `${((0.5 - vertical) * 1.4).toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--card-tilt-y", `${((horizontal - 0.5) * 1.4).toFixed(2)}deg`);
  };

  const resetTilt = (event) => {
    event.currentTarget.style.setProperty("--card-tilt-x", "0deg");
    event.currentTarget.style.setProperty("--card-tilt-y", "0deg");
  };

  return (
    <div className={`app-card bg-white border border-slate-200 rounded-2xl p-5 md:p-6 ${className}`}
      onPointerMove={tiltCard} onPointerLeave={resetTilt}>
      {children}
    </div>
  );
}
