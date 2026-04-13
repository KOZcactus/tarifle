interface NutritionInfoProps {
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
}

export function NutritionInfo({ calories, protein, carbs, fat }: NutritionInfoProps) {
  if (!calories && !protein && !carbs && !fat) return null;

  const items = [
    { label: "Kalori", value: calories, unit: "kcal", color: "text-primary" },
    { label: "Protein", value: protein, unit: "g", color: "text-accent-green" },
    { label: "Karbonhidrat", value: carbs, unit: "g", color: "text-secondary" },
    { label: "Yağ", value: fat, unit: "g", color: "text-accent-blue" },
  ].filter((item) => item.value != null);

  return (
    <div className="rounded-xl border border-border bg-bg-card p-4">
      <h3 className="mb-3 text-sm font-semibold text-text-muted">Besin Değerleri (porsiyon başı)</h3>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="text-center">
            <p className={`text-xl font-bold ${item.color}`}>
              {item.label === "Kalori" ? "~" : ""}
              {item.value}
            </p>
            <p className="text-xs text-text-muted">
              {item.unit} {item.label.toLowerCase()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
