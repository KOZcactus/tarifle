import { describe, expect, it } from "vitest";
import {
  convert,
  formatConverted,
  getUnit,
  unitsByDomain,
} from "@/lib/recipe/measure-conversions";

describe("convert", () => {
  it("identity within same unit", () => {
    expect(convert(1, "ml", "ml")).toBe(1);
    expect(convert(100, "gr", "gr")).toBe(100);
  });

  it("Türk mutfağı volume çevrimleri (ml base)", () => {
    expect(convert(1, "su-bardagi", "ml")).toBe(240);
    expect(convert(1, "cay-bardagi", "ml")).toBe(100);
    expect(convert(1, "kahve-fincani", "ml")).toBe(60);
    expect(convert(1, "yemek-kasigi", "ml")).toBe(15);
    expect(convert(1, "tatli-kasigi", "ml")).toBe(10);
    expect(convert(1, "cay-kasigi", "ml")).toBe(5);
  });

  it("uluslararası volume (US cup, fl oz)", () => {
    expect(convert(1, "cup", "ml")).toBe(240);
    expect(convert(1, "fl-oz", "ml")).toBeCloseTo(29.5735, 2);
  });

  it("weight (oz, lb)", () => {
    expect(convert(1, "oz", "gr")).toBeCloseTo(28.35, 2);
    expect(convert(1, "lb", "gr")).toBeCloseTo(453.59, 2);
    expect(convert(1, "kg", "gr")).toBe(1000);
  });

  it("ters çevrim ml -> su bardağı", () => {
    expect(convert(240, "ml", "su-bardagi")).toBe(1);
    expect(convert(120, "ml", "su-bardagi")).toBe(0.5);
  });

  it("Türk -> uluslararası karışım: 1 su bardağı -> fl oz", () => {
    const result = convert(1, "su-bardagi", "fl-oz");
    expect(result).toBeCloseTo(8.115, 2);
  });

  it("yemek kaşığı -> çay kaşığı (3:1)", () => {
    expect(convert(1, "yemek-kasigi", "cay-kasigi")).toBe(3);
  });

  it("domain uyumsuzluğu NaN döner (volume vs weight)", () => {
    expect(convert(1, "ml", "gr")).toBeNaN();
    expect(convert(1, "su-bardagi", "kg")).toBeNaN();
  });

  it("bilinmeyen unit NaN döner", () => {
    expect(convert(1, "bilinmeyen", "ml")).toBeNaN();
    expect(convert(1, "ml", "bilinmeyen")).toBeNaN();
  });
});

describe("formatConverted", () => {
  it("tam sayıya yakını yuvarlar", () => {
    expect(formatConverted(240)).toBe("240");
    expect(formatConverted(240.0001)).toBe("240");
    expect(formatConverted(1)).toBe("1");
  });

  it("küçük sayılarda 2 ondalık", () => {
    expect(formatConverted(0.25)).toBe("0.25");
    expect(formatConverted(0.5)).toBe("0.50");
  });

  it("orta sayılarda 1 ondalık", () => {
    expect(formatConverted(8.115)).toBe("8.1");
    expect(formatConverted(29.57)).toBe("29.6");
  });

  it("infinity ve NaN için sorgu işareti döner", () => {
    expect(formatConverted(NaN)).toBe("?");
    expect(formatConverted(Infinity)).toBe("?");
  });
});

describe("unit metadata", () => {
  it("getUnit known id", () => {
    const u = getUnit("su-bardagi");
    expect(u).toBeDefined();
    expect(u?.shortTr).toBe("su b.");
    expect(u?.baseFactor).toBe(240);
  });

  it("unitsByDomain volume only", () => {
    const volumes = unitsByDomain("volume");
    expect(volumes.every((u) => u.domain === "volume")).toBe(true);
    expect(volumes.find((u) => u.id === "ml")).toBeDefined();
    expect(volumes.find((u) => u.id === "gr")).toBeUndefined();
  });

  it("unitsByDomain weight only", () => {
    const weights = unitsByDomain("weight");
    expect(weights.every((u) => u.domain === "weight")).toBe(true);
    expect(weights.find((u) => u.id === "gr")).toBeDefined();
    expect(weights.find((u) => u.id === "ml")).toBeUndefined();
  });
});
