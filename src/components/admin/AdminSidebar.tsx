"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const navItems = [
  { href: "/admin/dashboard", icon: "📊", label: "Dashboard" },
  { href: "/admin/products",  icon: "📦", label: "Produk" },
  { href: "/admin/orders",    icon: "🧾", label: "Pesanan" },
  { href: "/admin/users",     icon: "👥", label: "Pengguna" },
  { href: "/admin/logs",      icon: "🗂️", label: "Activity Log" },
  { href: "/admin/settings",  icon: "⚙️", label: "Pengaturan" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <aside className="w-60 shrink-0 bg-indigo-900 text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-indigo-800">
        <Link href="/admin/dashboard" className="font-bold text-lg leading-tight">
          AplikasiJadi<span className="text-indigo-400">.com</span>
        </Link>
        <p className="text-xs text-indigo-400 mt-0.5">Super Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-indigo-700 text-white"
                  : "text-indigo-200 hover:bg-indigo-800 hover:text-white"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-indigo-800">
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-200 hover:bg-indigo-800 hover:text-white transition-colors disabled:opacity-60"
        >
          <span>🚪</span>
          {loggingOut ? "Keluar..." : "Logout"}
        </button>
      </div>
    </aside>
  );
}
