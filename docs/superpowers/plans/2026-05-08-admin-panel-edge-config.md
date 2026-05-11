# Admin Panel — Vercel Edge Config Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an admin panel at `/admin` that lets the Gummy team edit all campaign text in the browser; changes are saved to Vercel Edge Config and take effect immediately without redeploy.

**Architecture:** Content is extracted from hardcoded TSX into `src/data/defaults.json`. A `useContent` React Query hook fetches `GET /api/content` at runtime (Edge Config → defaults fallback). A Vercel Function at `api/content.ts` handles reads and password-protected writes. The admin panel at `/admin` renders a full editor and POSTs changes via `x-admin-password` header.

**Tech Stack:** React 18, TypeScript, Vite, Vercel Functions (`@vercel/node`), Vercel Edge Config (`@vercel/edge-config`), React Query (already installed), shadcn/ui (already installed), Vitest + Testing Library (already installed).

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/content-types.ts` | Create | TypeScript types for all content |
| `src/data/defaults.json` | Create | All hardcoded content extracted to JSON |
| `src/lib/render-text.tsx` | Create | Inline markdown renderer (`**bold**`, `==highlight==`, `[text](url)`) |
| `src/hooks/useContent.ts` | Create | React Query hook — fetches `/api/content`, falls back to defaults |
| `api/content.ts` | Create | Vercel Function — GET reads Edge Config, POST writes with auth |
| `src/pages/Admin.tsx` | Create | Full admin editor with password gate |
| `src/App.tsx` | Modify | Add `/admin` route |
| `src/components/CampaignHero.tsx` | Modify | Read from `useContent` |
| `src/components/QuickStats.tsx` | Modify | Read from `useContent` |
| `src/components/CampaignSections.tsx` | Modify | Render sections from `useContent` data |
| `src/components/CampaignFooter.tsx` | Modify | Read from `useContent` |
| `src/components/StickyNav.tsx` | Modify | Read section nav labels from `useContent` |
| `package.json` | Modify | Add `@vercel/edge-config`, `@vercel/node` |

---

## Task 1: Install dependencies + content types + defaults JSON

**Files:**
- Modify: `package.json`
- Create: `src/lib/content-types.ts`
- Create: `src/data/defaults.json`

- [ ] **Step 1: Install packages**

```bash
npm install @vercel/edge-config
npm install --save-dev @vercel/node
```

Expected: both packages appear in `package.json`.

- [ ] **Step 2: Create `src/lib/content-types.ts`**

```typescript
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
```

- [ ] **Step 3: Create `src/data/defaults.json`**

```json
{
  "hero": {
    "title": "Mega Campanha",
    "titleHighlight": "Gummy Original — TikTok Shop",
    "subtitle": "Tudo o que você precisa saber para maximizar suas comissões e garantir suas recompensas extras na Mega Campanha Gummy Original × TikTok Shop."
  },
  "stats": [
    {
      "icon": "Calendar",
      "label": "Período",
      "value": "11/05 — 31/05",
      "sublabel": "2026 · Até 23h59 (BRT)",
      "highlight": false
    },
    {
      "icon": "Users",
      "label": "Elegibilidade",
      "value": "Afiliados TikTok Shop",
      "sublabel": "Conta ativa + Comunidade Gummy",
      "highlight": false
    },
    {
      "icon": "Hash",
      "label": "Hashtag Oficial",
      "value": "#GummyOriginal",
      "sublabel": "Obrigatória em todos os vídeos",
      "highlight": true
    }
  ],
  "sections": [
    {
      "number": "01",
      "title": "Visão Geral da Campanha",
      "navLabel": "Visão Geral",
      "icon": "Eye",
      "blocks": [
        { "type": "paragraph", "text": "Campanha promocional voltada para criadores afiliados da TikTok Shop, com o objetivo de impulsionar vendas por meio de conteúdos alinhados à narrativa da marca." },
        { "type": "paragraph", "text": "Durante o período da campanha, os participantes poderão gerar receita por meio de comissões na plataforma e, adicionalmente, conquistar recompensas com base no desempenho em vendas e na produção de conteúdo." }
      ]
    },
    {
      "number": "02",
      "title": "Elegibilidade",
      "navLabel": "Elegibilidade",
      "icon": "ShieldCheck",
      "blocks": [
        { "type": "paragraph", "text": "Para participar da campanha, é necessário:" },
        { "type": "list", "items": [
          { "text": "Possuir uma conta ativa e válida como afiliado na TikTok Shop", "variant": "check" },
          { "text": "Estar conectado à comunidade oficial da Gummy Original", "variant": "check" },
          { "text": "Estar de acordo com os termos e condições desta campanha", "variant": "check" }
        ]}
      ]
    },
    {
      "number": "03",
      "title": "Período da Campanha",
      "navLabel": "Período",
      "icon": "Calendar",
      "blocks": [
        { "type": "paragraph", "text": "A campanha será realizada de **11 de Maio de 2026** até **31 de Maio de 2026**, às 23h59 (horário de Brasília)." }
      ]
    },
    {
      "number": "04",
      "title": "Termos Gerais",
      "navLabel": "Termos Gerais",
      "icon": "FileText",
      "blocks": [
        { "type": "list", "items": [
          { "text": "A campanha é válida exclusivamente para vendas realizadas dentro da TikTok Shop", "variant": "check" },
          { "text": "O GMV (Volume Bruto de Mercadorias) será calculado com base nas vendas válidas durante o período da campanha", "variant": "check" },
          { "text": "Pedidos cancelados, devolvidos ou reembolsados serão automaticamente descontados do GMV total", "variant": "warning" },
          { "text": "A apuração final dos resultados será realizada pela Gummy, que possui total critério sobre validação e classificação", "variant": "check" }
        ]}
      ]
    },
    {
      "number": "05",
      "title": "Regras de Participação",
      "navLabel": "Participação",
      "icon": "Video",
      "blocks": [
        { "type": "paragraph", "text": "Para que as vendas e conteúdos sejam considerados na campanha, é obrigatório:" },
        { "type": "list", "items": [
          { "text": "Marcar corretamente os produtos Gummy nos vídeos", "variant": "check" },
          { "text": "Utilizar a hashtag oficial ==#GummyOriginal==", "variant": "check" },
          { "text": "Publicar no mínimo **20 vídeos novos** durante o período da campanha", "variant": "check" }
        ]},
        { "type": "note", "text": "Serão consideradas apenas vendas provenientes de conteúdos que estejam em conformidade com as diretrizes. A Gummy se reserva o direito de desconsiderar conteúdos que não estejam alinhados com a proposta da campanha, mesmo que tenham gerado vendas." }
      ]
    },
    {
      "number": "06",
      "title": "Práticas Não Permitidas",
      "navLabel": "Proibições",
      "icon": "AlertTriangle",
      "blocks": [
        { "type": "danger-list", "footer": "A violação dessas diretrizes poderá resultar na desclassificação do participante.", "items": [
          { "text": "Inflar artificialmente o GMV por meio de compras próprias ou práticas fraudulentas", "variant": "x" },
          { "text": "Utilizar múltiplas contas de forma indevida", "variant": "x" },
          { "text": "Fazer comparação de preço entre canais: Site, Farmácias, etc.", "variant": "x" },
          { "text": "Falar do preço \"3 por 1\" ou jogar goma no lixo sugerindo que está barato demais", "variant": "x" },
          { "text": "Divulgar informações falsas, não comprovadas ou não aprovadas pela marca", "variant": "x" },
          { "text": "Produzir conteúdos que desvalorizem o posicionamento da Gummy Original", "variant": "x" }
        ]}
      ]
    },
    {
      "number": "07",
      "title": "Diretrizes de Conteúdo",
      "navLabel": "Conteúdo",
      "icon": "FileText",
      "blocks": [
        { "type": "paragraph", "text": "Os participantes devem seguir as seguintes orientações:" },
        { "type": "list", "items": [
          { "text": "Utilizar exclusivamente informações e alegações oficiais disponíveis em [gummy.com.br](https://gummy.com.br) e materiais enviados na comunidade", "variant": "check" },
          { "text": "Não realizar alegações médicas, terapêuticas ou relacionadas a doenças", "variant": "x" },
          { "text": "Não prometer resultados que não estejam comprovados", "variant": "x" }
        ]},
        { "type": "note", "text": "A Gummy poderá remover ou desconsiderar conteúdos que não estejam em conformidade com essas diretrizes." }
      ]
    },
    {
      "number": "08",
      "title": "Condições de Pagamento",
      "navLabel": "Pagamento",
      "icon": "CreditCard",
      "blocks": [
        { "type": "list", "items": [
          { "text": "As comissões geradas pelos vídeos serão pagas diretamente pela plataforma TikTok", "variant": "check" },
          { "text": "As recompensas da campanha serão pagas em até **35 dias** após o encerramento da campanha", "variant": "check" },
          { "text": "Ao receber o prêmio, o participante deverá produzir conteúdo com o intuito de motivar outras pessoas", "variant": "warning" },
          { "text": "É obrigatório que o participante possua dados de pagamento válidos na plataforma", "variant": "check" },
          { "text": "Prazo para divulgação dos vencedores: **1 semana** após o fim da campanha", "variant": "check" },
          { "text": "Após a divulgação dos vencedores, o prazo será de **1 semana** para emissão da Nota Fiscal", "variant": "check" },
          { "text": "A emissão de Nota Fiscal é **obrigatória** para recebimento das recompensas", "variant": "warning" },
          { "text": "Na ausência de Nota Fiscal válida, o pagamento não será realizado", "variant": "x" },
          { "text": "Todos os impostos e tributos são de responsabilidade exclusiva do participante", "variant": "check" }
        ]}
      ]
    },
    {
      "number": "09",
      "title": "Utilização de Conteúdo",
      "navLabel": "Uso de Conteúdo",
      "icon": "Share2",
      "blocks": [
        { "type": "paragraph", "text": "Ao participar da campanha e receber recompensas, o participante autoriza a Gummy a utilizar seus conteúdos para fins de marketing, incluindo veiculação em plataformas de mídia paga, como Meta Ads." },
        { "type": "paragraph", "text": "Caso o participante não concorde com a utilização de seus conteúdos, deverá informar previamente à equipe responsável." }
      ]
    },
    {
      "number": "10",
      "title": "Modificações e Encerramento",
      "navLabel": "Modificações",
      "icon": "Settings",
      "blocks": [
        { "type": "paragraph", "text": "A Gummy reserva-se o direito de modificar, suspender ou encerrar a campanha a qualquer momento, conforme necessário." },
        { "type": "paragraph", "text": "Eventuais alterações serão comunicadas por meio dos canais oficiais da marca." }
      ]
    }
  ],
  "footer": {
    "disclaimer": "Ao participar da campanha, você declara estar ciente e de acordo com todos os termos descritos nesta página.",
    "ctaText": "Entrar na Comunidade Gummy",
    "ctaUrl": "https://chat.whatsapp.com/FVqNk0ZEDOV02jSIa4QkSA",
    "copyright": "© 2026 Gummy Original · Todos os direitos reservados"
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/content-types.ts src/data/defaults.json package.json package-lock.json
git commit -m "feat: add content types and defaults JSON"
```

---

## Task 2: renderText helper + tests

**Files:**
- Create: `src/lib/render-text.tsx`
- Create: `src/lib/render-text.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/lib/render-text.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { renderText } from "./render-text";

function Wrapper({ text }: { text: string }) {
  return <span>{renderText(text)}</span>;
}

describe("renderText", () => {
  it("renders plain text unchanged", () => {
    render(<Wrapper text="hello world" />);
    expect(screen.getByText("hello world")).toBeTruthy();
  });

  it("renders **bold** as <strong>", () => {
    const { container } = render(<Wrapper text="pay in **35 dias**" />);
    const strong = container.querySelector("strong");
    expect(strong).toBeTruthy();
    expect(strong?.textContent).toBe("35 dias");
  });

  it("renders ==highlight== as <strong> with text-secondary class", () => {
    const { container } = render(<Wrapper text="use ==#GummyOriginal==" />);
    const strong = container.querySelector("strong");
    expect(strong).toBeTruthy();
    expect(strong?.className).toContain("text-secondary");
    expect(strong?.textContent).toBe("#GummyOriginal");
  });

  it("renders [text](url) as <a> link", () => {
    const { container } = render(<Wrapper text="visit [gummy.com.br](https://gummy.com.br) now" />);
    const a = container.querySelector("a");
    expect(a).toBeTruthy();
    expect(a?.getAttribute("href")).toBe("https://gummy.com.br");
    expect(a?.textContent).toBe("gummy.com.br");
  });

  it("handles multiple markers in one string", () => {
    const { container } = render(<Wrapper text="**bold** and ==highlight==" />);
    const strongs = container.querySelectorAll("strong");
    expect(strongs.length).toBe(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/lib/render-text.test.tsx
```

Expected: FAIL — `Cannot find module './render-text'`

- [ ] **Step 3: Create `src/lib/render-text.tsx`**

```tsx
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
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/lib/render-text.test.tsx
```

Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/render-text.tsx src/lib/render-text.test.tsx
git commit -m "feat: add renderText helper for inline markdown"
```

---

## Task 3: useContent hook + tests

**Files:**
- Create: `src/hooks/useContent.ts`
- Create: `src/hooks/useContent.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/hooks/useContent.test.tsx`:

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useContent } from "./useContent";
import defaults from "@/data/defaults.json";
import type { CampaignContent } from "@/lib/content-types";
import { ReactNode } from "react";

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

describe("useContent", () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it("returns defaults when fetch fails (dev environment)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("Network error"));
    const { result } = renderHook(() => useContent(), { wrapper });
    await waitFor(() => expect(result.current).toBeTruthy());
    expect(result.current.hero.title).toBe(defaults.hero.title);
  });

  it("returns fetched content when API succeeds", async () => {
    const custom: CampaignContent = {
      ...defaults as CampaignContent,
      hero: { title: "Nova Campanha", titleHighlight: "Test", subtitle: "Sub" },
    };
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => custom,
    } as Response);
    const { result } = renderHook(() => useContent(), { wrapper });
    await waitFor(() => expect(result.current.hero.title).toBe("Nova Campanha"));
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run src/hooks/useContent.test.tsx
```

Expected: FAIL — `Cannot find module './useContent'`

- [ ] **Step 3: Create `src/hooks/useContent.ts`**

```typescript
import { useQuery } from "@tanstack/react-query";
import type { CampaignContent } from "@/lib/content-types";
import defaults from "@/data/defaults.json";

async function fetchContent(): Promise<CampaignContent> {
  const res = await fetch("/api/content");
  if (!res.ok) throw new Error("fetch failed");
  return res.json();
}

export function useContent(): CampaignContent {
  const { data } = useQuery({
    queryKey: ["content"],
    queryFn: fetchContent,
    staleTime: 60_000,
    retry: false,
  });
  return data ?? (defaults as CampaignContent);
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npx vitest run src/hooks/useContent.test.tsx
```

Expected: 2 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useContent.ts src/hooks/useContent.test.tsx
git commit -m "feat: add useContent hook with Edge Config + defaults fallback"
```

---

## Task 4: Vercel Function `api/content.ts`

**Files:**
- Create: `api/content.ts`

No automated tests for Vercel Functions — tested manually after deploy.

- [ ] **Step 1: Create `api/content.ts`**

```typescript
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get } from "@vercel/edge-config";
import defaults from "../src/data/defaults.json";
import type { CampaignContent } from "../src/lib/content-types";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");

  if (req.method === "GET") {
    try {
      const content = await get<CampaignContent>("campaign");
      return res.json(content ?? defaults);
    } catch {
      return res.json(defaults);
    }
  }

  if (req.method === "POST") {
    const password = req.headers["x-admin-password"];
    if (!password || password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const content = req.body as CampaignContent;
    if (!content?.hero || !content?.sections) {
      return res.status(400).json({ error: "Invalid content shape" });
    }

    const writeRes = await fetch(
      `https://api.vercel.com/v1/edge-config/${process.env.EDGE_CONFIG_ID}/items`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${process.env.VERCEL_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{ operation: "upsert", key: "campaign", value: content }],
        }),
      }
    );

    if (!writeRes.ok) {
      const err = await writeRes.text();
      console.error("Edge Config write failed:", err);
      return res.status(500).json({ error: "Failed to save" });
    }

    return res.json({ ok: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}
```

- [ ] **Step 2: Commit**

```bash
git add api/content.ts
git commit -m "feat: add Vercel Function for content read/write"
```

---

## Task 5: Refactor public-facing components

**Files:**
- Modify: `src/components/CampaignHero.tsx`
- Modify: `src/components/QuickStats.tsx`
- Modify: `src/components/CampaignSections.tsx`
- Modify: `src/components/CampaignFooter.tsx`
- Modify: `src/components/StickyNav.tsx`

- [ ] **Step 1: Replace `src/components/CampaignHero.tsx`**

```tsx
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
```

- [ ] **Step 2: Replace `src/components/QuickStats.tsx`**

```tsx
import { Calendar, Hash, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useContent } from "@/hooks/useContent";

const ICONS: Record<string, LucideIcon> = { Calendar, Hash, Users };

const QuickStats = () => {
  const { stats } = useContent();
  return (
    <section className="max-w-3xl mx-auto px-6 -mt-2">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = ICONS[stat.icon] ?? Calendar;
          return (
            <div
              key={stat.label}
              className="gummy-card-shadow rounded-2xl p-6 bg-card hover:-translate-y-0.5 transition-transform duration-200 ease-[cubic-bezier(0.25,0.1,0.25,1)]"
            >
              <div className="flex items-center gap-2 mb-3">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {stat.label}
                </span>
              </div>
              <p className={`text-xl font-bold tabular-nums ${stat.highlight ? "text-secondary" : "text-primary"}`}>
                {stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.sublabel}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default QuickStats;
```

- [ ] **Step 3: Replace `src/components/CampaignSections.tsx`**

```tsx
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
```

- [ ] **Step 4: Replace `src/components/CampaignFooter.tsx`**

```tsx
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
```

- [ ] **Step 5: Replace `src/components/StickyNav.tsx`**

```tsx
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
```

- [ ] **Step 6: Start dev server and verify the public page renders identically**

```bash
npm run dev
```

Open `http://localhost:8080` and verify:
- All 10 sections visible with correct content
- QuickStats shows 11/05 — 31/05 and #GummyOriginal
- StickyNav shows 10 items with correct labels
- Hashtag in section 05 appears in secondary color
- Bold text renders correctly in section 03 and 08
- gummy.com.br in section 07 is a clickable link

- [ ] **Step 7: Commit**

```bash
git add src/components/CampaignHero.tsx src/components/QuickStats.tsx src/components/CampaignSections.tsx src/components/CampaignFooter.tsx src/components/StickyNav.tsx
git commit -m "refactor: components read from useContent instead of hardcoded data"
```

---

## Task 6: Admin panel

**Files:**
- Create: `src/pages/Admin.tsx`

The admin panel has three layers:
1. Password gate — prompts for `ADMIN_PASSWORD`, stores it in `sessionStorage` on first successful save
2. Editor — sidebar nav (Hero, Stats, 10 sections, Footer) + active section editor on the right
3. Save bar — sticky top bar with "Salvar" button, loading state, toast on result

- [ ] **Step 1: Create `src/pages/Admin.tsx`**

```tsx
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import defaults from "@/data/defaults.json";
import { useContent } from "@/hooks/useContent";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2 } from "lucide-react";
import type { CampaignContent, ContentBlock, ListItem, Section } from "@/lib/content-types";

// ── Password Gate ──────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (pw: string) => void }) {
  const [pw, setPw] = useState("");
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-4 p-8 rounded-2xl border bg-card shadow-sm">
        <h1 className="text-xl font-bold">Painel Admin</h1>
        <p className="text-sm text-muted-foreground">Digite a senha para continuar</p>
        <Input
          type="password"
          placeholder="Senha"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && pw && onAuth(pw)}
        />
        <Button className="w-full" onClick={() => pw && onAuth(pw)}>
          Entrar
        </Button>
      </div>
    </div>
  );
}

// ── Block Editors ──────────────────────────────────────────────────────────────

function ParagraphEditor({
  text,
  onChange,
}: {
  text: string;
  onChange: (text: string) => void;
}) {
  return (
    <Textarea
      value={text}
      onChange={(e) => onChange(e.target.value)}
      rows={3}
      className="text-sm"
      placeholder="Texto do parágrafo. Use **negrito**, ==destaque==, [link](url)"
    />
  );
}

function NoteEditor({
  text,
  onChange,
}: {
  text: string;
  onChange: (text: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Caixa de nota</p>
      <Textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={3}
        className="text-sm bg-accent/30"
      />
    </div>
  );
}

const VARIANT_LABELS: Record<string, string> = {
  check: "✓ Verde",
  warning: "⚠ Amarelo",
  x: "✗ Vermelho",
};

function ListItemRow({
  item,
  onChange,
  onRemove,
}: {
  item: ListItem;
  onChange: (item: ListItem) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex gap-2 items-start">
      <Select
        value={item.variant}
        onValueChange={(v) => onChange({ ...item, variant: v as ListItem["variant"] })}
      >
        <SelectTrigger className="w-32 shrink-0 text-xs h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(["check", "warning", "x"] as const).map((v) => (
            <SelectItem key={v} value={v} className="text-xs">
              {VARIANT_LABELS[v]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Textarea
        value={item.text}
        onChange={(e) => onChange({ ...item, text: e.target.value })}
        rows={2}
        className="text-sm flex-1"
        placeholder="Texto do item. Use **negrito**, ==destaque==, [link](url)"
      />
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-destructive hover:text-destructive h-9 w-9"
        onClick={onRemove}
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  );
}

function ListEditor({
  items,
  onChange,
  isDanger,
  footer,
  onFooterChange,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
  isDanger?: boolean;
  footer?: string;
  onFooterChange?: (footer: string) => void;
}) {
  const addItem = () =>
    onChange([...items, { text: "", variant: isDanger ? "x" : "check" }]);

  return (
    <div className={`space-y-3 p-4 rounded-xl ${isDanger ? "bg-red-50 dark:bg-red-950/20" : "bg-accent/20"}`}>
      {isDanger && <p className="text-xs font-medium text-destructive uppercase tracking-wide">Bloco de perigo</p>}
      <div className="space-y-2">
        {items.map((item, i) => (
          <ListItemRow
            key={i}
            item={item}
            onChange={(updated) => {
              const next = [...items];
              next[i] = updated;
              onChange(next);
            }}
            onRemove={() => onChange(items.filter((_, idx) => idx !== i))}
          />
        ))}
      </div>
      <Button variant="outline" size="sm" className="w-full text-xs" onClick={addItem}>
        <Plus className="w-3 h-3 mr-1" /> Adicionar item
      </Button>
      {isDanger && onFooterChange !== undefined && (
        <div className="space-y-1 pt-2 border-t border-destructive/20">
          <p className="text-xs font-medium text-destructive">Rodapé do bloco</p>
          <Input
            value={footer ?? ""}
            onChange={(e) => onFooterChange(e.target.value)}
            className="text-sm"
            placeholder="Texto de aviso no rodapé..."
          />
        </div>
      )}
    </div>
  );
}

function BlockEditor({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
}) {
  if (block.type === "paragraph") {
    return (
      <ParagraphEditor
        text={block.text}
        onChange={(text) => onChange({ ...block, text })}
      />
    );
  }
  if (block.type === "note") {
    return (
      <NoteEditor
        text={block.text}
        onChange={(text) => onChange({ ...block, text })}
      />
    );
  }
  if (block.type === "list") {
    return (
      <ListEditor
        items={block.items}
        onChange={(items) => onChange({ ...block, items })}
      />
    );
  }
  if (block.type === "danger-list") {
    return (
      <ListEditor
        items={block.items}
        isDanger
        footer={block.footer}
        onChange={(items) => onChange({ ...block, items })}
        onFooterChange={(footer) => onChange({ ...block, footer })}
      />
    );
  }
  return null;
}

// ── Section Editor ─────────────────────────────────────────────────────────────

function SectionEditor({
  section,
  onChange,
}: {
  section: Section;
  onChange: (section: Section) => void;
}) {
  const updateBlock = (idx: number, block: ContentBlock) => {
    const blocks = [...section.blocks];
    blocks[idx] = block;
    onChange({ ...section, blocks });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Título</label>
          <Input
            value={section.title}
            onChange={(e) => onChange({ ...section, title: e.target.value })}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Rótulo nav lateral</label>
          <Input
            value={section.navLabel}
            onChange={(e) => onChange({ ...section, navLabel: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-4">
        {section.blocks.map((block, i) => (
          <BlockEditor
            key={i}
            block={block}
            onChange={(updated) => updateBlock(i, updated)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Hero Editor ────────────────────────────────────────────────────────────────

function HeroEditor({
  draft,
  onChange,
}: {
  draft: CampaignContent;
  onChange: (d: CampaignContent) => void;
}) {
  const { hero } = draft;
  const set = (key: keyof typeof hero, value: string) =>
    onChange({ ...draft, hero: { ...hero, [key]: value } });
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Título (parte normal)</label>
        <Input value={hero.title} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Título (parte colorida)</label>
        <Input value={hero.titleHighlight} onChange={(e) => set("titleHighlight", e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Subtítulo</label>
        <Textarea
          value={hero.subtitle}
          onChange={(e) => set("subtitle", e.target.value)}
          rows={3}
        />
      </div>
    </div>
  );
}

// ── Stats Editor ───────────────────────────────────────────────────────────────

function StatsEditor({
  draft,
  onChange,
}: {
  draft: CampaignContent;
  onChange: (d: CampaignContent) => void;
}) {
  const updateStat = (i: number, key: string, value: string | boolean) => {
    const stats = [...draft.stats];
    stats[i] = { ...stats[i], [key]: value };
    onChange({ ...draft, stats });
  };

  return (
    <div className="space-y-6">
      {draft.stats.map((stat, i) => (
        <div key={i} className="p-4 rounded-xl border space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Card {i + 1}
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Rótulo</label>
              <Input value={stat.label} onChange={(e) => updateStat(i, "label", e.target.value)} />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Valor principal</label>
              <Input value={stat.value} onChange={(e) => updateStat(i, "value", e.target.value)} />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Sublabel</label>
            <Input value={stat.sublabel} onChange={(e) => updateStat(i, "sublabel", e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`highlight-${i}`}
              checked={stat.highlight}
              onChange={(e) => updateStat(i, "highlight", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor={`highlight-${i}`} className="text-xs text-muted-foreground">
              Usar cor de destaque (secondary)
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Footer Editor ──────────────────────────────────────────────────────────────

function FooterEditor({
  draft,
  onChange,
}: {
  draft: CampaignContent;
  onChange: (d: CampaignContent) => void;
}) {
  const { footer } = draft;
  const set = (key: keyof typeof footer, value: string) =>
    onChange({ ...draft, footer: { ...footer, [key]: value } });
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Aviso legal</label>
        <Textarea
          value={footer.disclaimer}
          onChange={(e) => set("disclaimer", e.target.value)}
          rows={3}
        />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Texto do botão CTA</label>
        <Input value={footer.ctaText} onChange={(e) => set("ctaText", e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">URL do botão CTA</label>
        <Input value={footer.ctaUrl} onChange={(e) => set("ctaUrl", e.target.value)} />
      </div>
      <div className="space-y-1">
        <label className="text-xs font-medium text-muted-foreground">Copyright</label>
        <Input value={footer.copyright} onChange={(e) => set("copyright", e.target.value)} />
      </div>
    </div>
  );
}

// ── Admin Page ─────────────────────────────────────────────────────────────────

type NavKey = "hero" | "stats" | `section-${string}` | "footer";

export default function Admin() {
  const { toast } = useToast();

  const { data: remoteContent, isFetching } = useQuery<CampaignContent>({
    queryKey: ["content"],
    queryFn: async () => {
      const res = await fetch("/api/content");
      if (!res.ok) throw new Error("fetch failed");
      return res.json();
    },
    staleTime: 60_000,
    retry: false,
  });

  const [password, setPassword] = useState<string>(
    () => sessionStorage.getItem("admin_pw") ?? ""
  );
  const [authed, setAuthed] = useState(() => !!sessionStorage.getItem("admin_pw"));
  const [draft, setDraft] = useState<CampaignContent | null>(null);
  // After the null-guard below, TypeScript needs a cast — use `draft!` in JSX
  const [active, setActive] = useState<NavKey>("hero");

  // Init draft from Edge Config on first load (avoids accidental data loss)
  useEffect(() => {
    if (!isFetching && draft === null) {
      setDraft(remoteContent ?? (defaults as CampaignContent));
    }
  }, [isFetching, remoteContent, draft]);
  const [saving, setSaving] = useState(false);

  const handleAuth = useCallback((pw: string) => {
    setPassword(pw);
    setAuthed(true);
  }, []);

  const save = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const res = await fetch("/api/content", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(draft),
      });

      if (res.status === 401) {
        sessionStorage.removeItem("admin_pw");
        setAuthed(false);
        toast({ title: "Senha incorreta", variant: "destructive" });
        return;
      }
      if (!res.ok) throw new Error("save failed");

      sessionStorage.setItem("admin_pw", password);
      toast({ title: "Conteúdo salvo!", description: "As mudanças já estão no ar." });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [draft, password, toast]);

  if (!authed) return <PasswordGate onAuth={handleAuth} />;

  if (draft === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const d = draft!; // safe: null guard runs above

  const navItems: { key: NavKey; label: string }[] = [
    { key: "hero", label: "Hero" },
    { key: "stats", label: "Stats" },
    ...d.sections.map((s) => ({
      key: `section-${s.number}` as NavKey,
      label: `${s.number} · ${s.navLabel}`,
    })),
    { key: "footer", label: "Footer" },
  ];

  const activeSection = active.startsWith("section-")
    ? d.sections.find((s) => `section-${s.number}` === active)
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 border-b bg-card px-6 py-3 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-sm">Painel Admin</h1>
          <p className="text-xs text-muted-foreground">Gummy Original — Termos de Campanha</p>
        </div>
        <Button onClick={save} disabled={saving} size="sm">
          {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
          Salvar
        </Button>
      </div>

      <div className="flex h-[calc(100vh-57px)]">
        {/* Sidebar */}
        <nav className="w-52 shrink-0 border-r bg-card/50 overflow-y-auto py-4 px-2">
          <div className="space-y-0.5">
            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActive(item.key)}
                className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-colors ${
                  active === item.key
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Editor */}
        <main className="flex-1 overflow-y-auto p-6 max-w-2xl">
          {active === "hero" && (
            <HeroEditor draft={d} onChange={setDraft} />
          )}
          {active === "stats" && (
            <StatsEditor draft={d} onChange={setDraft} />
          )}
          {activeSection && (
            <SectionEditor
              section={activeSection}
              onChange={(updated) =>
                setDraft({
                  ...d,
                  sections: d.sections.map((s) =>
                    s.number === updated.number ? updated : s
                  ),
                })
              }
            />
          )}
          {active === "footer" && (
            <FooterEditor draft={d} onChange={setDraft} />
          )}
        </main>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Admin.tsx
git commit -m "feat: add admin panel with full content editor"
```

---

## Task 7: Wire routes + env setup

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `/admin` route to `src/App.tsx`**

Replace the existing `src/App.tsx` with:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 2: Run full test suite**

```bash
npx vitest run
```

Expected: all tests pass (render-text + useContent).

- [ ] **Step 3: Start dev server and verify `/admin` route works**

```bash
npm run dev
```

Open `http://localhost:8080/admin`. Verify:
- Password gate appears
- Entering any password bypasses the gate (save will fail in dev since `/api/content` doesn't exist, which is expected)
- All 10 sections appear in the sidebar
- Editing hero title updates the field
- Editing a list item text updates the field
- "Salvar" button shows loading state and then shows an error toast (expected in dev)

- [ ] **Step 4: Set up Vercel Edge Config (do this once in Vercel dashboard)**

1. In Vercel dashboard → Storage → Create Edge Config store (e.g. `gummy-termos`)
2. Copy the connection string — it looks like: `https://edge-config.vercel.com/ecfg_xxx?token=yyy`
3. Note the store ID — it's the `ecfg_xxx` part
4. In Vercel dashboard → Settings → Tokens → Create a token with `Full Account` scope (or a scoped token with Edge Config write)
5. Add these env vars to the Vercel project (Settings → Environment Variables):

```
EDGE_CONFIG=https://edge-config.vercel.com/ecfg_xxx?token=yyy
EDGE_CONFIG_ID=ecfg_xxx
VERCEL_TOKEN=<token from step 4>
ADMIN_PASSWORD=<choose a password>
```

6. Link the Edge Config store to the project (Storage tab → Connect to Project)

- [ ] **Step 5: Deploy and test end-to-end**

```bash
# If using Vercel CLI
npx vercel --prod
```

Or push to main branch and let Vercel deploy automatically.

After deploy:
1. Open `https://<your-domain>/admin`
2. Enter the `ADMIN_PASSWORD`
3. Change the hero subtitle to something recognizable (e.g., add "✓" at the end)
4. Click "Salvar" — should show "Conteúdo salvo!"
5. Open `https://<your-domain>/` in a new tab — subtitle should show the change immediately (no rebuild needed)
6. Remove the test change, save again to restore

- [ ] **Step 6: Final commit**

```bash
git add src/App.tsx
git commit -m "feat: register /admin route — admin panel complete"
```

---

## Env Vars Summary

| Var | Where to get it | Example |
|-----|----------------|---------|
| `EDGE_CONFIG` | Vercel → Storage → Edge Config store → Connection String | `https://edge-config.vercel.com/ecfg_abc123?token=xyz` |
| `EDGE_CONFIG_ID` | The `ecfg_xxx` part of the connection string | `ecfg_abc123` |
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens | `vercel_xxxxxx` |
| `ADMIN_PASSWORD` | You choose | `gummy2026admin` |

---

## Environment Setup (Vercel)

To deploy the admin panel, configure the following environment variables in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `EDGE_CONFIG` | Edge Config connection string (from the Edge Config dashboard, e.g. `ecfg_xxx`) |
| `EDGE_CONFIG_ID` | Edge Config ID (e.g. `ecfg_xxx` — same value without the `https://` prefix) |
| `VERCEL_TOKEN` | Vercel API token with read/write access |
| `ADMIN_PASSWORD` | Password to protect the `/admin` route (set something strong) |

### First-time seed

After deploying, visit `/admin`, enter your password, and click **Save**. This will seed your Edge Config with the default content. From then on, edits save immediately without redeploy.

### Edge Config setup steps

1. In the Vercel dashboard, go to **Storage → Edge Config → Create**
2. Add the connection string as `EDGE_CONFIG` env var
3. Set `EDGE_CONFIG_ID` to just the ID portion (e.g. `ecfg_xxxxxxxx`)
4. Create a Vercel API token at vercel.com/account/tokens and set it as `VERCEL_TOKEN`
5. Set `ADMIN_PASSWORD` to a secure password

> The `/api/content` endpoint initializes the `campaign` key in Edge Config on first POST. No manual JSON setup needed.
