import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi, beforeEach } from "vitest";
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
