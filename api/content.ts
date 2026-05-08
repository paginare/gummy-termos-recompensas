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
