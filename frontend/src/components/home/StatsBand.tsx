export interface StatItem {
  value: string;
  label: string;
}

/** Deep-navy stat band (matches the reference four-card stats row). */
export function StatsBand({ items }: { items: StatItem[] }) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div key={item.label} className="rounded-xl bg-navy-800 px-6 py-9 text-center text-white">
              <p className="font-display text-4xl font-black">{item.value}</p>
              <p className="mt-2 text-sm font-medium text-blue-200">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
