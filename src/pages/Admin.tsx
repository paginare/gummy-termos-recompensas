import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import defaults from "@/data/defaults.json";
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
  const [active, setActive] = useState<NavKey>("hero");

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

  const d = draft!;

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
