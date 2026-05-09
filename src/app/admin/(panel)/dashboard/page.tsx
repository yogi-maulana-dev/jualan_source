import type { Metadata } from "next";
import { query, queryOne } from "@/lib/db";
import { seedIfEmpty } from "@/lib/seed";
import AdminHeader from "@/components/admin/AdminHeader";
import StatsCard from "@/components/admin/StatsCard";
import RecentOrdersTable from "@/components/admin/RecentOrdersTable";
import TopProductsTable from "@/components/admin/TopProductsTable";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

function formatRp(n: number) {
  return "Rp " + n.toLocaleString("id-ID");
}

export default async function DashboardPage() {
  await seedIfEmpty();

  const [
    { c: totalProducts },
    { c: totalUsers },
    { c: totalOrders },
    { r: revenue },
    { c: pendingOrders },
  ] = await Promise.all([
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM products"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM users WHERE role = 'customer'"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM orders"),
    queryOne<{ r: number }>("SELECT COALESCE(SUM(amount), 0) as r FROM orders WHERE status = 'paid'"),
    queryOne<{ c: number }>("SELECT COUNT(*) as c FROM orders WHERE status = 'pending'"),
  ]) as [{ c: number }, { c: number }, { c: number }, { r: number }, { c: number }];

  const [recentOrders, topProducts] = await Promise.all([
    query<{
      id: number; buyer_name: string; buyer_email: string; amount: number;
      status: string; created_at: string; product_name: string; product_emoji: string;
    }>(`
      SELECT o.id, o.buyer_name, o.buyer_email, o.amount, o.status, o.created_at,
             p.name as product_name, p.emoji as product_emoji
      FROM orders o LEFT JOIN products p ON p.id = o.product_id
      ORDER BY o.created_at DESC LIMIT 8
    `),
    query<{ id: number; name: string; emoji: string; price: number; order_count: number; revenue: number }>(`
      SELECT p.id, p.name, p.emoji, p.price,
             COUNT(o.id) as order_count,
             COALESCE(SUM(CASE WHEN o.status='paid' THEN o.amount ELSE 0 END),0) as revenue
      FROM products p LEFT JOIN orders o ON o.product_id = p.id
      GROUP BY p.id, p.name, p.emoji, p.price
      ORDER BY order_count DESC LIMIT 5
    `),
  ]);

  const stats = [
    { label: "Total Produk",   value: totalProducts,       icon: "📦", color: "indigo", suffix: " produk" },
    { label: "Total Pengguna", value: totalUsers,           icon: "👥", color: "sky",    suffix: " user" },
    { label: "Total Pesanan",  value: totalOrders,         icon: "🧾", color: "violet", suffix: " order" },
    { label: "Pendapatan",     value: formatRp(revenue),   icon: "💰", color: "emerald", suffix: "" },
    { label: "Pesanan Pending",value: pendingOrders,        icon: "⏳", color: "amber",  suffix: " pending" },
  ];

  return (
    <>
      <AdminHeader title="Dashboard" />

      <main className="flex-1 p-6 space-y-6">
        {/* Stats grid */}
        <div className="grid grid-cols-2 xl:grid-cols-5 gap-4">
          {stats.map((s) => (
            <StatsCard key={s.label} {...s} />
          ))}
        </div>

        {/* Tables */}
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentOrdersTable orders={recentOrders} />
          </div>
          <div>
            <TopProductsTable products={topProducts} />
          </div>
        </div>
      </main>
    </>
  );
}
