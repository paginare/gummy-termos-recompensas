import { useContent } from "@/hooks/useContent";

const StickyNav = () => {
  const { sections } = useContent();

  const scrollTo = (id: string) => {
    document.getElementById(`section-${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="hidden lg:block fixed left-8 top-1/2 -translate-y-1/2 z-50">
      <div className="flex flex-col gap-1">
        {sections.map((s) => (
          <button
            key={s.number}
            onClick={() => scrollTo(s.number)}
            className="text-left text-xs text-muted-foreground hover:text-primary transition-colors px-3 py-1.5 rounded-lg hover:bg-accent"
          >
            <span className="font-mono mr-1.5 text-muted-foreground/50">{s.number}</span>
            {s.navLabel}
          </button>
        ))}
      </div>
    </nav>
  );
};

export default StickyNav;
