import { describe, it, expect } from "vitest";
import { toCsv } from "@/lib/csv";

describe("toCsv", () => {
  it("encodes simple rows with headers + CRLF", () => {
    const csv = toCsv(["a", "b"], [[1, 2], [3, 4]]);
    // Strip BOM for assertion
    const body = csv.replace(/^\ufeff/, "");
    expect(body).toBe("a,b\r\n1,2\r\n3,4");
  });

  it("prepends UTF-8 BOM", () => {
    const csv = toCsv(["x"], [["y"]]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
  });

  it("quotes cells containing commas", () => {
    const csv = toCsv(["name"], [["foo, bar"]]);
    expect(csv).toContain('"foo, bar"');
  });

  it("quotes cells containing newlines", () => {
    const csv = toCsv(["text"], [["line1\nline2"]]);
    expect(csv).toContain('"line1\nline2"');
  });

  it("doubles embedded quotes", () => {
    const csv = toCsv(["quote"], [['he said "hi"']]);
    expect(csv).toContain('"he said ""hi"""');
  });

  it("preserves Turkish characters", () => {
    const csv = toCsv(["recipe"], [["Şebit Yağlaması"]]);
    expect(csv).toContain("Şebit Yağlaması");
  });

  it("handles null/undefined as empty string", () => {
    const csv = toCsv(["a", "b", "c"], [[null, undefined, "x"]]);
    const body = csv.replace(/^\ufeff/, "");
    expect(body).toBe("a,b,c\r\n,,x");
  });

  it("encodes boolean as lowercase true/false", () => {
    const csv = toCsv(["flag"], [[true], [false]]);
    const body = csv.replace(/^\ufeff/, "");
    expect(body).toContain("true");
    expect(body).toContain("false");
  });

  it("encodes Date as ISO string", () => {
    const d = new Date("2026-04-17T10:00:00Z");
    const csv = toCsv(["ts"], [[d]]);
    expect(csv).toContain("2026-04-17T10:00:00.000Z");
  });

  it("encodes numbers without quoting", () => {
    const csv = toCsv(["n"], [[42], [3.14]]);
    const body = csv.replace(/^\ufeff/, "");
    expect(body).toBe("n\r\n42\r\n3.14");
  });
});
