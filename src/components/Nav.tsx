import Link from "next/link";
import { logoutAction } from "@/lib/actions";

export function Nav({ active }: { active: string }) {
  const links = [
    { href: "/dashboard", label: "Home" },
    { href: "/practice", label: "Practice" },
    { href: "/progress", label: "Progress" },
  ];

  return (
    <header className="sticky top-0 z-10 border-b border-card-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link href="/dashboard" className="font-display text-lg font-bold text-brand-dark">
          🔢 Allie&apos;s Math
        </Link>
        <nav className="flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
                active === l.href
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-brand-soft hover:text-brand-dark"
              }`}
            >
              {l.label}
            </Link>
          ))}
          <form action={logoutAction}>
            <button
              type="submit"
              className="ml-1 rounded-full px-3 py-1.5 text-sm font-semibold text-muted hover:bg-brand-soft"
            >
              Log out
            </button>
          </form>
        </nav>
      </div>
    </header>
  );
}
