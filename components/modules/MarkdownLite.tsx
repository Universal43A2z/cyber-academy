import type { ReactNode } from "react";

/**
 * Tiny, safe renderer for the module content format — never uses
 * dangerouslySetInnerHTML, so lesson content cannot inject scripts.
 * Supported: # headings, ## subheadings, -, 1. ordered lists, **bold**,
 * `inline code`, and blank-line separated paragraphs.
 */
export default function MarkdownLite({ text }: { text: string }) {
  const blocks: ReactNode[] = [];
  let key = 0;

  const inline = (raw: string) => {
    const parts = raw.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return parts.map((p, i) => {
      if (p.startsWith("**") && p.endsWith("**")) {
        return <strong key={i} className="text-foreground">{p.slice(2, -2)}</strong>;
      }
      if (p.startsWith("`") && p.endsWith("`")) {
        return (
          <code key={i} className="rounded bg-panel-2 px-1.5 py-0.5 font-mono text-[0.86em] text-cyber">
            {p.slice(1, -1)}
          </code>
        );
      }
      return <span key={i}>{p}</span>;
    });
  };

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trimEnd();
    if (!line.trim()) continue;

    if (line.startsWith("## ")) {
      blocks.push(
        <h2 key={key++} className="mb-3 mt-8 font-mono text-lg font-bold uppercase tracking-widest text-cyber">
          {inline(line.slice(3))}
        </h2>
      );
    } else if (line.startsWith("# ")) {
      blocks.push(
        <h1 key={key++} className="mb-4 mt-2 text-2xl font-bold">
          {inline(line.slice(2))}
        </h1>
      );
    } else if (/^[-*] /.test(line)) {
      blocks.push(
        <li key={key++} className="mb-1.5 flex gap-2.5">
          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-cyber" />
          <span className="text-sm leading-relaxed text-foreground/90">{inline(line.replace(/^[-*] /, ""))}</span>
        </li>
      );
    } else if (/^\d+\. /.test(line)) {
      blocks.push(
        <li key={key++} className="mb-1.5 flex gap-2.5">
          <span className="mt-0 shrink-0 font-mono text-sm text-cyber">{line.match(/^\d+\./)?.[0]}</span>
          <span className="text-sm leading-relaxed text-foreground/90">{inline(line.replace(/^\d+\. /, ""))}</span>
        </li>
      );
    } else {
      blocks.push(
        <p key={key++} className="mb-4 text-sm leading-relaxed text-foreground/90">
          {inline(line)}
        </p>
      );
    }
  }

  return <div>{blocks}</div>;
}