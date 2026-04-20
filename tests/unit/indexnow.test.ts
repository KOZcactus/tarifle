import { describe, expect, it, vi, afterEach } from "vitest";
import {
  filterValidUrls,
  isValidKey,
  pingIndexNow,
} from "@/lib/indexnow";

describe("isValidKey", () => {
  it("accepts 8-128 char alphanumeric (+ hyphen)", () => {
    expect(isValidKey("abcdefgh")).toBe(true);
    expect(isValidKey("a".repeat(32))).toBe(true);
    expect(isValidKey("d1277d55b71ba70595c7a887577dc9a0")).toBe(true);
    expect(isValidKey("Abc-123-def-456")).toBe(true);
    expect(isValidKey("a".repeat(128))).toBe(true);
  });

  it("rejects too-short, too-long, or invalid chars", () => {
    expect(isValidKey("short")).toBe(false); // 5 chars
    expect(isValidKey("a".repeat(129))).toBe(false);
    expect(isValidKey("key with space")).toBe(false);
    expect(isValidKey("key/with/slash")).toBe(false);
    expect(isValidKey("")).toBe(false);
    expect(isValidKey(null)).toBe(false);
    expect(isValidKey(undefined)).toBe(false);
  });
});

describe("filterValidUrls", () => {
  const base = "https://tarifle.app";

  it("keeps URLs matching the configured host", () => {
    const urls = [
      "https://tarifle.app/",
      "https://tarifle.app/tarif/abc",
      "https://tarifle.app/kategori/corbalar",
    ];
    expect(filterValidUrls(urls, base)).toHaveLength(3);
  });

  it("drops URLs from other hosts", () => {
    const urls = [
      "https://tarifle.app/a",
      "https://example.com/b",
      "https://www.tarifle.app/c", // host farkı www. prefix, reddedilir
    ];
    const filtered = filterValidUrls(urls, base);
    expect(filtered).toEqual(["https://tarifle.app/a"]);
  });

  it("dedupes identical URLs", () => {
    const urls = [
      "https://tarifle.app/x",
      "https://tarifle.app/x",
      "https://tarifle.app/y",
    ];
    expect(filterValidUrls(urls, base)).toEqual([
      "https://tarifle.app/x",
      "https://tarifle.app/y",
    ]);
  });

  it("drops malformed URLs silently", () => {
    const urls = [
      "not-a-url",
      "https://tarifle.app/ok",
      "javascript:alert(1)",
      "ftp://tarifle.app/file",
    ];
    expect(filterValidUrls(urls, base)).toEqual(["https://tarifle.app/ok"]);
  });

  it("returns empty array on invalid base URL", () => {
    expect(filterValidUrls(["https://tarifle.app/"], "not-a-url")).toEqual([]);
  });
});

describe("pingIndexNow", () => {
  const fetchMock = vi.fn();
  const originalFetch = global.fetch;

  afterEach(() => {
    global.fetch = originalFetch;
    fetchMock.mockReset();
  });

  it("bails early if INDEXNOW_KEY is missing", async () => {
    const res = await pingIndexNow(["https://tarifle.app/"], { key: "" });
    expect(res.ok).toBe(false);
    expect(res.reason).toMatch(/INDEXNOW_KEY/);
    expect(res.submitted).toBe(0);
  });

  it("bails if no URLs survive host filtering", async () => {
    const res = await pingIndexNow(["https://example.com/foo"], {
      key: "d1277d55b71ba70595c7a887577dc9a0",
      baseUrl: "https://tarifle.app",
    });
    expect(res.ok).toBe(false);
    expect(res.skipped).toBe(1);
    expect(res.reason).toMatch(/No valid URLs/);
  });

  it("POSTs to IndexNow endpoint with correct body on success", async () => {
    global.fetch = fetchMock.mockResolvedValueOnce(
      new Response(null, { status: 200 }),
    );
    const res = await pingIndexNow(
      ["https://tarifle.app/a", "https://tarifle.app/b"],
      {
        key: "d1277d55b71ba70595c7a887577dc9a0",
        baseUrl: "https://tarifle.app",
      },
    );
    expect(res.ok).toBe(true);
    expect(res.submitted).toBe(2);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.indexnow.org/indexnow");
    const body = JSON.parse((init as RequestInit).body as string);
    expect(body.host).toBe("tarifle.app");
    expect(body.key).toBe("d1277d55b71ba70595c7a887577dc9a0");
    expect(body.keyLocation).toBe(
      "https://tarifle.app/d1277d55b71ba70595c7a887577dc9a0.txt",
    );
    expect(body.urlList).toEqual([
      "https://tarifle.app/a",
      "https://tarifle.app/b",
    ]);
  });

  it("reports failure with reason on non-2xx response", async () => {
    global.fetch = fetchMock.mockResolvedValueOnce(
      new Response("Key not matched", { status: 403 }),
    );
    const res = await pingIndexNow(["https://tarifle.app/a"], {
      key: "d1277d55b71ba70595c7a887577dc9a0",
      baseUrl: "https://tarifle.app",
    });
    expect(res.ok).toBe(false);
    expect(res.status).toBe(403);
    expect(res.reason).toMatch(/403/);
  });
});
