"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Hoy", emoji: "📅" },
  { href: "/dashboard/tasks", label: "Tareas", emoji: "✅" },
  { href: "/dashboard/calendar", label: "Calendario", emoji: "📆" },
  { href: "/dashboard/history", label: "Historial", emoji: "📋" },
  { href: "/dashboard/reports", label: "Reportes", emoji: "📊" },
];

export default function GoogleSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:block lg:w-64 h-[calc(100vh-0px)] border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <div className="p-3">
        <div className="mb-2 text-xs font-semibold text-gray-500 px-3">OCTOPUS</div>
        <nav className="space-y-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-full text-sm transition ${
                  active
                    ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                    : "hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200"
                }`}
              >
                <span className="text-base">{item.emoji}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

