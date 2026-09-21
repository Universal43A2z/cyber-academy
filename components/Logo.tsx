import Image from "next/image";
import Link from "next/link";

export default function Logo({ href = "/", size = 84 }: { href?: string; size?: number }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-3"
      aria-label="F1STACKMIND home"
    >
      <div className="relative">
        <Image
          src="/f1stackmind-logo.png"
          alt="F1STACKMIND logo"
          width={size}
          height={size}
          className="rounded-md object-contain transition group-hover:drop-shadow-[0_0_10px_rgba(0,255,163,0.6)]"
          priority
        />
        <span className="pointer-events-none absolute inset-0 rounded-md opacity-0 transition group-hover:opacity-60" />
      </div>
      <div className="leading-tight">
        <span className="font-mono text-lg font-bold tracking-widest text-cyber">
          F1STACKMIND
        </span>
        <span className="block font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
          cyber academy
        </span>
      </div>
    </Link>
  );
}