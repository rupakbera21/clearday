import { ALL_KNOWLEDGE_ITEMS } from "@/data/knowledge/select";

const KNOWLEDGE_TITLE_MAP = new Map<string, string>(
  ALL_KNOWLEDGE_ITEMS.map((item) => [item.id, item.title]),
);

/**
 * Maps a raw knowledge base identifier (e.g. `kb_mask_n95_fit`) into a polished,
 * human-readable scientific guidance label (e.g. `N95 / FFP2 Respirator Selection and Seal`).
 */
export function getKnowledgeItemDisplay(kid: string): { title: string; id: string } {
  const title = KNOWLEDGE_TITLE_MAP.get(kid);
  if (title) {
    return { title, id: kid };
  }
  // Fallback: cleanly format unknown kb_ keys without raw underscores
  const clean = kid
    .replace(/^kb_/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return { title: clean, id: kid };
}
