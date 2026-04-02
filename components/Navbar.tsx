"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, LayoutDashboard, PlusCircle, Layers, LogIn } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: null },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tournaments/new", label: "New Tournament", icon: PlusCircle },
  { href: "/tournaments/setup", label: "Manual Setup", icon: Layers },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Trophy className="w-6 h-6" />
          FTM App
        </Link>
        <div className="flex items-center gap-1">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === href
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}
          <Link
            href="/join"
            className="ml-2 flex items-center gap-1 bg-white text-green-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-50 transition-colors"
          >
            <LogIn className="w-4 h-4" />
            Join Tournament
          </Link>
        </div>
      </div>
    </nav>
  );
}
