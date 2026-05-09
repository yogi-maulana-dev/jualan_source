interface Order {
  id: number;
  buyer_name: string;
  buyer_email: string;
  amount: number;
  status: string;
  created_at: string;
  product_name: string;
  product_emoji: string;
}

const statusStyle: Record<string, string> = {
  paid:    "bg-emerald-100 text-emerald-700",
  pending: "bg-amber-100 text-amber-700",
  failed:  "bg-red-100 text-red-700",
};

export default function RecentOrdersTable({ orders }: { orders: Order[] }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h2 className="font-bold text-gray-900">Pesanan Terbaru</h2>
        <a href="/admin/orders" className="text-xs text-indigo-600 hover:underline font-medium">
          Lihat semua →
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left">
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">#ID</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pembeli</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Produk</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Total</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
              <th className="px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanggal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-5 py-3 text-gray-400 font-mono text-xs">#{o.id}</td>
                <td className="px-5 py-3">
                  <div className="font-medium text-gray-900 truncate max-w-[130px]">{o.buyer_name}</div>
                  <div className="text-xs text-gray-400 truncate max-w-[130px]">{o.buyer_email}</div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1.5 max-w-[140px]">
                    <span>{o.product_emoji}</span>
                    <span className="truncate text-gray-700">{o.product_name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-semibold text-gray-900 whitespace-nowrap">
                  Rp {o.amount.toLocaleString("id-ID")}
                </td>
                <td className="px-5 py-3">
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusStyle[o.status] ?? "bg-gray-100 text-gray-600"}`}>
                    {o.status}
                  </span>
                </td>
                <td className="px-5 py-3 text-gray-500 text-xs whitespace-nowrap">
                  {new Date(o.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-8 text-center text-gray-400 text-sm">
                  Belum ada pesanan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
