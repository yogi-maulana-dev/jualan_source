"use client";
import { useEffect, useState, useCallback } from "react";
import AdminHeader from "@/components/admin/AdminHeader";

type Log = {
  id: number;
  user_name:  string | null;
  user_email: string | null;
  action:     string;
  detail:     string | null;
  ip_address: string | null;
  created_at: string;
};

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  LOGIN:               { label: "Login",            color: "bg-green-100 text-green-700" },
  LOGIN_FAILED:        { label: "Login Gagal",       color: "bg-red-100 text-red-700" },
  LOGOUT:              { label: "Logout",            color: "bg-gray-100 text-gray-600" },
  VIEW_DASHBOARD:      { label: "Lihat Dashboard",   color: "bg-blue-100 text-blue-700" },
  VIEW_ORDERS:         { label: "Lihat Pesanan",     color: "bg-indigo-100 text-indigo-700" },
  VIEW_PRODUCTS:       { label: "Lihat Produk",      color: "bg-violet-100 text-violet-700" },
  CREATE_PRODUCT:      { label: "Tambah Produk",     color: "bg-emerald-100 text-emerald-700" },
  UPDATE_PRODUCT:      { label: "Edit Produk",       color: "bg-amber-100 text-amber-700" },
  DELETE_PRODUCT:      { label: "Hapus Produk",      color: "bg-red-100 text-red-700" },
  UPDATE_ORDER_STATUS:    { label: "Update Pesanan",      color: "bg-orange-100 text-orange-700" },
  CHANGE_PASSWORD:        { label: "Ubah Password",       color: "bg-teal-100 text-teal-700" },
  CHANGE_PASSWORD_FAILED: { label: "Ubah Password Gagal", color: "bg-red-100 text-red-700" },
  VIEW_LOGS:           { label: "Lihat Log",         color: "bg-slate-100 text-slate-600" },
};

function formatDate(str: string) {
  return new Date(str).toLocaleString("id-ID", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export default function LogsPage() {
  const [logs,    setLogs]    = useState<Log[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState("");
  const [action,  setAction]  = useState("");
  const [offset,  setOffset]  = useState(0);
  const limit = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      limit:  String(limit),
      offset: String(offset),
      ...(search && { search }),
      ...(action && { action }),
    });
    const res  = await fetch(`/api/admin/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, action, offset]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setOffset(0);
    fetchLogs();
  }

  return (
    <>
      <AdminHeader title="Activity Log" />

      <main className="flex-1 p-6 space-y-4">
        {/* Filter bar */}
        <form onSubmit={handleSearch} className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Cari user / aksi</label>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="email, nama, detail..."
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400 w-56"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter aksi</label>
            <select
              value={action}
              onChange={e => { setAction(e.target.value); setOffset(0); }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="">Semua aksi</option>
              {Object.entries(ACTION_LABELS).map(([key, { label }]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Cari
          </button>
          <span className="text-sm text-gray-500 self-end ml-auto">
            {total} log ditemukan
          </span>
        </form>

        {/* Tabel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Waktu</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">User</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Aksi</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">Detail</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-600">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Memuat...</td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-gray-400">Belum ada log aktivitas</td>
                  </tr>
                ) : (
                  logs.map(log => {
                    const badge = ACTION_LABELS[log.action] ?? { label: log.action, color: "bg-gray-100 text-gray-600" };
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                          {formatDate(log.created_at)}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-gray-800">{log.user_name ?? "—"}</p>
                          <p className="text-xs text-gray-400">{log.user_email ?? "tidak diketahui"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${badge.color}`}>
                            {badge.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 max-w-xs truncate" title={log.detail ?? ""}>
                          {log.detail ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs font-mono">
                          {log.ip_address ?? "—"}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {total > limit && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Sebelumnya
              </button>
              <span className="text-sm text-gray-500">
                {offset + 1}–{Math.min(offset + limit, total)} dari {total}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={offset + limit >= total}
                className="px-3 py-1.5 text-sm border rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Berikutnya →
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
