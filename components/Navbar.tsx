"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Trophy, LayoutDashboard, PlusCircle, Layers, LogIn, LogOut, User } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  const navLinks = [
    { href: "/", label: "Home" },
    ...(isLoggedIn
      ? [
          { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
          { href: "/tournaments/new", label: "New Tournament", icon: PlusCircle },
          { href: "/tournaments/setup", label: "Manual Setup", icon: Layers },
        ]
      : []),
  ];

  return (
    <nav className="bg-green-700 text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl">
          <Trophy className="w-6 h-6" />
          FTM App
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                pathname === href ? "bg-white/20" : "hover:bg-white/10"
              }`}
            >
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
                className="flex items-center gap-1 bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded text-sm font-medium transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="ml-2 flex items-center gap-1 bg-white text-green-700 px-3 py-1.5 rounded text-sm font-semibold hover:bg-green-50 transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
