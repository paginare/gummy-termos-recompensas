import { Badge } from "@/components/ui/badge";
import gummyLogo from "@/assets/gummy-logo.png";
import { useContent } from "@/hooks/useContent";

const CampaignHero = () => {
  const { hero } = useContent();
  return (
    <section className="relative pt-8 pb-12 px-6 gummy-hero-gradient">
      <img src={gummyLogo} alt="Gummy Original" className="w-[300px] h-[175px] object-contain mb-6" />
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="campaign">Campanha Oficial</Badge>
          <Badge variant="active">● Ativa</Badge>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          {hero.title}{" "}
          <span className="text-primary">{hero.titleHighlight}</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl">{hero.subtitle}</p>
      </div>
    </section>
  );
};

export default CampaignHero;
