export function HeatmapLegend() {
  const colors = [
    { score: 1, hex: "#7f0000" },
    { score: 2, hex: "#c0392b" },
    { score: 3, hex: "#e74c3c" },
    { score: 4, hex: "#e67e22" },
    { score: 5, hex: "#f39c12" },
    { score: 6, hex: "#f1c40f" },
    { score: 7, hex: "#90ee90" },
    { score: 8, hex: "#27ae60" },
    { score: 9, hex: "#1abc9c" },
    { score: 10, hex: "#0d4d3d" },
  ];

  return (
    <section className="mt-3 flex items-center gap-2">
      <span className="text-xs text-zinc-500">1</span>
      <div className="flex items-center gap-0.5">
        {colors.map((item) => (
          <span key={item.score} className="h-3 w-2 rounded-[1px]" style={{ backgroundColor: item.hex }} />
        ))}
      </div>
      <span className="text-xs text-zinc-500">10</span>
    </section>
  );
}
