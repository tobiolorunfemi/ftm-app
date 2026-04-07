"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  Trophy, LayoutDashboard, PlusCircle, Layers,
  LogIn, LogOut, User, Menu, X,
} from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";
  const [open, setOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Home", icon: null },
    ...(isLoggedIn ? [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/tournaments/new", label: "New Tournament", icon: PlusCircle },
      { href: "/tournaments/setup", label: "Manual Setup", icon: Layers },
    ] : []),
  ];

  const linkClass = (href: string) =>
    `flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
      pathname === href ? "bg-white/20" : "hover:bg-white/10"
    }`;

  return (
    <nav className="bg-green-700 text-white shadow-md relative z-50">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-lg shrink-0">
          <Trophy className="w-5 h-5" />
          FTM App
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={linkClass(href)}>
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}

          {isLoggedIn ? (
            <div className="flex items-center gap-2 ml-2">
              <span className="flex items-center gap-1 text-sm text-green-200">
                <User className="w-3.5 h-3.5" />
                {session?.user?.name?.split(" ")[0]}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 flex items-center gap-1 bg-white text-green-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-50"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>

        {/* Mobile: user + hamburger */}
        <div className="flex md:hidden items-center gap-2">
          {isLoggedIn && (
            <span className="text-xs text-green-200 flex items-center gap-1">
              <User className="w-3 h-3" />
              {session?.user?.name?.split(" ")[0]}
            </span>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="p-2 rounded hover:bg-white/10"
            aria-label="Toggle menu"
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <div className="md:hidden bg-green-800 border-t border-green-600 px-4 py-3 space-y-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium w-full ${
                pathname === href ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}
          {isLoggedIn ? (
            <button
              onClick={() => { signOut({ callbackUrl: "/" }); setOpen(false); }}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-medium w-full hover:bg-white/10 text-red-200"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          ) : (
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 rounded text-sm font-semibold w-full bg-white text-green-700 hover:bg-green-50 mt-2"
            >
              <LogIn className="w-4 h-4" /> Sign In
            </Link>
          )}
        </div>
      )}
    </nav>
  );
}
