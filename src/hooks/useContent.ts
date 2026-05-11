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
