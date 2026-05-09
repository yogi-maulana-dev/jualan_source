interface Props {
  label: string;
  value: string | number;
  icon: string;
  color: string;
  suffix?: string;
}

const colorMap: Record<string, string> = {
  indigo:  "bg-indigo-50 text-indigo-700 border-indigo-100",
  sky:     "bg-sky-50 text-sky-700 border-sky-100",
  violet:  "bg-violet-50 text-violet-700 border-violet-100",
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
  amber:   "bg-amber-50 text-amber-700 border-amber-100",
};

export default function StatsCard({ label, value, icon, color }: Props) {
  const cls = colorMap[color] ?? colorMap.indigo;
  return (
    <div className={`rounded-2xl border p-5 ${cls}`}>
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-extrabold leading-none">{value}</div>
      <div className="text-xs font-medium mt-1 opacity-80">{label}</div>
    </div>
  );
}
