"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/mentee", label: "홈" },
  { href: "/mentee/planner", label: "플래너" },
  { href: "/mentee/feedback", label: "피드백" },
  { href: "/mentee/my", label: "마이" },
];

export default function MenteeBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="h-14 border-t flex">
      {items.map((it) => {
        const active = pathname === it.href;
        return (
          <Link
            key={it.href}
            href={it.href}
            className={`flex-1 flex items-center justify-center text-sm ${
              active ? "font-semibold" : "text-neutral-500"
            }`}
          >
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
