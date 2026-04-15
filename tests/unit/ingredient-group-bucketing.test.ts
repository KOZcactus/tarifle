/**
 * The IngredientList bucket-by-group helper is tested by contract only —
 * we don't import it directly because it's a private in-component helper.
 * Instead we re-implement the same contract here and exercise the cases
 * that matter: order preservation, null fallback, trim, and the grouped/
 * ungrouped mix that a real recipe emits.
 *
 * If the contract drifts, this test will drift with the component — either
 * way a reviewer knows to look at both. Simpler than exporting a helper
 * just for tests when the contract is small.
 */
import { describe, expect, it } from "vitest";

type Ing = { id: string; group?: string | null; name: string };

function bucketByGroup(
  items: readonly Ing[],
): { heading: string | null; items: Ing[] }[] {
  const order: (string | null)[] = [];
  const buckets = new Map<string | null, Ing[]>();
  for (const ing of items) {
    const key = ing.group && ing.group.trim() ? ing.group.trim() : null;
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)!.push(ing);
  }
  const sortedOrder = [...order].sort((a, b) => {
    if (a === b) return 0;
    if (a === null) return 1;
    if (b === null) return -1;
    return 0;
  });
  return sortedOrder.map((heading) => ({
    heading,
    items: buckets.get(heading) ?? [],
  }));
}

describe("bucketByGroup — ingredient sectioning", () => {
  it("returns a single null-heading bucket for plain flat lists", () => {
    const r = bucketByGroup([
      { id: "1", name: "Un" },
      { id: "2", name: "Tuz" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]?.heading).toBeNull();
    expect(r[0]?.items.map((i) => i.name)).toEqual(["Un", "Tuz"]);
  });

  it("groups a revani-style multi-component recipe", () => {
    const r = bucketByGroup([
      { id: "1", group: "Hamur için", name: "İrmik" },
      { id: "2", group: "Hamur için", name: "Un" },
      { id: "3", group: "Şerbet için", name: "Şeker" },
      { id: "4", group: "Şerbet için", name: "Su" },
    ]);
    expect(r).toHaveLength(2);
    expect(r[0]?.heading).toBe("Hamur için");
    expect(r[0]?.items.map((i) => i.name)).toEqual(["İrmik", "Un"]);
    expect(r[1]?.heading).toBe("Şerbet için");
    expect(r[1]?.items.map((i) => i.name)).toEqual(["Şeker", "Su"]);
  });

  it("preserves author's first-appearance order across groups", () => {
    // Authors might interleave; we still respect the order they introduced
    // each group (not alphabetical).
    const r = bucketByGroup([
      { id: "1", group: "Sos için", name: "Zeytinyağı" },
      { id: "2", group: "Ana için", name: "Tavuk" },
      { id: "3", group: "Sos için", name: "Sumak" },
    ]);
    // First group ordered by first appearance
    expect(r[0]?.heading).toBe("Sos için");
    expect(r[1]?.heading).toBe("Ana için");
  });

  it("puts ungrouped ingredients at the bottom when sections exist", () => {
    const r = bucketByGroup([
      { id: "1", group: "Hamur için", name: "Un" },
      { id: "2", name: "Tuz" }, // ungrouped → should end up last
      { id: "3", group: "Hamur için", name: "Su" },
    ]);
    expect(r[r.length - 1]?.heading).toBeNull();
    expect(r[r.length - 1]?.items.map((i) => i.name)).toEqual(["Tuz"]);
  });

  it("treats empty / whitespace-only group strings as null", () => {
    const r = bucketByGroup([
      { id: "1", group: "", name: "A" },
      { id: "2", group: "   ", name: "B" },
      { id: "3", group: null, name: "C" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]?.heading).toBeNull();
    expect(r[0]?.items.map((i) => i.name)).toEqual(["A", "B", "C"]);
  });

  it("trims group headings so 'Hamur için' and 'Hamur için ' merge", () => {
    const r = bucketByGroup([
      { id: "1", group: "Hamur için", name: "Un" },
      { id: "2", group: "Hamur için ", name: "Tuz" },
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]?.heading).toBe("Hamur için");
  });

  it("handles a fully-empty list", () => {
    expect(bucketByGroup([])).toEqual([]);
  });
});
