import { motion } from "framer-motion";
import {
  Eye, ShieldCheck, FileText, Video, CreditCard, Share2,
  Settings, CheckCircle2, AlertTriangle, XCircle, Calendar,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { useContent } from "@/hooks/useContent";
import { renderText } from "@/lib/render-text";
import type { ContentBlock } from "@/lib/content-types";

const ICONS: Record<string, LucideIcon> = {
  Eye, ShieldCheck, FileText, Video, CreditCard,
  Share2, Settings, AlertTriangle, Calendar,
};

interface SectionProps {
  number: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  delay?: number;
}

const Section = ({ number, title, icon: Icon, children, delay = 0 }: SectionProps) => (
  <motion.section
    id={`section-${number}`}
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.4, delay }}
    className="scroll-mt-24"
  >
    <div className="flex items-center gap-3 mb-4">
      <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent">
        <Icon className="w-4 h-4 text-accent-foreground" />
      </div>
      <h2 className="text-xl font-bold text-foreground">
        <span className="text-muted-foreground mr-1">{number}.</span> {title}
      </h2>
    </div>
    <div className="pl-12 space-y-4">{children}</div>
  </motion.section>
);

const ListItem = ({
  children,
  variant = "check",
}: {
  children: ReactNode;
  variant?: "check" | "warning" | "x";
}) => {
  const icons = {
    check: <CheckCircle2 className="w-5 h-5 text-gummy-success flex-shrink-0 mt-0.5" />,
    warning: <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />,
    x: <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />,
  };
  return (
    <li className="flex gap-3 text-foreground/85 leading-relaxed">
      {icons[variant]}
      <span>{children}</span>
    </li>
  );
};

function renderBlock(block: ContentBlock, idx: number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={idx} className="text-foreground/75 leading-relaxed">
          {renderText(block.text)}
        </p>
      );
    case "list":
      return (
        <ul key={idx} className="space-y-3">
          {block.items.map((item, i) => (
            <ListItem key={i} variant={item.variant}>
              {renderText(item.text)}
            </ListItem>
          ))}
        </ul>
      );
    case "note":
      return (
        <div key={idx} className="p-4 rounded-xl bg-accent text-sm text-accent-foreground leading-relaxed">
          {renderText(block.text)}
        </div>
      );
    case "danger-list":
      return (
        <div key={idx} className="p-5 rounded-2xl bg-gummy-danger-bg space-y-3">
          <ul className="space-y-3">
            {block.items.map((item, i) => (
              <ListItem key={i} variant={item.variant}>
                {renderText(item.text)}
              </ListItem>
            ))}
          </ul>
          {block.footer && (
            <p className="text-sm text-destructive font-medium pt-2 border-t border-destructive/10">
              {block.footer}
            </p>
          )}
        </div>
      );
    default:
      return null;
  }
}

const CampaignSections = () => {
  const { sections } = useContent();
  return (
    <div className="max-w-3xl mx-auto px-6 py-12 space-y-12">
      {sections.map((section, i) => {
        const Icon = ICONS[section.icon] ?? Eye;
        return (
          <Section
            key={section.number}
            number={section.number}
            title={section.title}
            icon={Icon}
            delay={i * 0.05}
          >
            {section.blocks.map((block, blockIdx) => renderBlock(block, blockIdx))}
          </Section>
        );
      })}
    </div>
  );
};

export default CampaignSections;
