export interface HeroContent {
  title: string;
  titleHighlight: string;
  subtitle: string;
}

export interface StatItem {
  icon: string;
  label: string;
  value: string;
  sublabel: string;
  highlight: boolean;
}

export interface ListItem {
  text: string;
  variant: "check" | "warning" | "x";
}

export type ContentBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: ListItem[] }
  | { type: "note"; text: string }
  | { type: "danger-list"; items: ListItem[]; footer?: string };

export interface Section {
  number: string;
  title: string;
  navLabel: string;
  icon: string;
  blocks: ContentBlock[];
}

export interface FooterContent {
  disclaimer: string;
  ctaText: string;
  ctaUrl: string;
  copyright: string;
}

export interface CampaignContent {
  hero: HeroContent;
  stats: StatItem[];
  sections: Section[];
  footer: FooterContent;
}
