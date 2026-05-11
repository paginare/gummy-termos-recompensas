import { ReactNode } from "react";

const PATTERN = /(\*\*[^*]+\*\*|==[^=]+==|\[[^\]]+\]\([^)]+\))/g;

export function renderText(text: string): ReactNode {
  const parts = text.split(PATTERN);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("==") && part.endsWith("==")) {
      return <strong key={i} className="text-secondary">{part.slice(2, -2)}</strong>;
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (link) {
      return (
        <a
          key={i}
          href={link[2]}
          className="text-primary font-medium underline underline-offset-2 decoration-primary/30 hover:decoration-primary transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          {link[1]}
        </a>
      );
    }
    return part;
  });
}
