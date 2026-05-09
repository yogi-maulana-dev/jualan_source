interface Product {
  id: number;
  name: string;
  emoji: string;
  price: number;
  order_count: number;
  revenue: number;
}

export default function TopProductsTable({ products }: { products: Product[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Produk Terlaris</h2>
        <a href="/admin/products" className="text-xs text-indigo-600 hover:underline font-medium">
          Semua →
        </a>
      </div>
      <div className="divide-y divide-gray-100">
        {products.map((p, i) => (
          <div key={p.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors">
            <span className="text-xs font-bold text-gray-400 w-5 text-center">{i + 1}</span>
            <span className="text-xl">{p.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
              <p className="text-xs text-gray-500">{p.order_count} terjual</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-emerald-600">
                Rp {p.revenue.toLocaleString("id-ID")}
              </p>
              <p className="text-xs text-gray-400">revenue</p>
            </div>
          </div>
        ))}
        {products.length === 0 && (
          <p className="px-5 py-6 text-center text-sm text-gray-400">Belum ada data.</p>
        )}
      </div>
    </div>
  );
}
