import { useContent } from "@/hooks/useContent";

const CampaignFooter = () => {
  const { footer } = useContent();
  return (
    <footer className="max-w-3xl mx-auto px-6 pb-16 pt-8">
      <div className="gummy-card-shadow rounded-2xl p-8 bg-card text-center space-y-4">
        <p className="text-sm text-muted-foreground">{footer.disclaimer}</p>
        <a
          href={footer.ctaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          {footer.ctaText}
        </a>
        <p className="text-xs text-muted-foreground/60 pt-2">{footer.copyright}</p>
      </div>
    </footer>
  );
};

export default CampaignFooter;
