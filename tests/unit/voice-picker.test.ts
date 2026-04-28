import { describe, expect, it } from "vitest";
import { pickTtsVoice, classifyVoiceGender } from "@/lib/tts/voice-picker";

function makeVoice(name: string, lang: string): SpeechSynthesisVoice {
  return {
    name,
    lang,
    default: false,
    localService: true,
    voiceURI: name,
  } as SpeechSynthesisVoice;
}

describe("classifyVoiceGender", () => {
  it.each([
    ["Google Turkish (Female)", "female"],
    ["Microsoft Elif Online", "female"],
    ["Yelda (Enhanced)", "female"],
    ["Zeynep Premium", "female"],
  ])("classifies %s as female", (name, expected) => {
    expect(classifyVoiceGender(makeVoice(name, "tr-TR"))).toBe(expected);
  });

  it.each([
    ["Google Turkish (Male)", "male"],
    ["Microsoft Ahmet Online", "male"],
    ["Cem (Enhanced)", "male"],
  ])("classifies %s as male", (name, expected) => {
    expect(classifyVoiceGender(makeVoice(name, "tr-TR"))).toBe(expected);
  });

  it("returns null for neutral or unknown name", () => {
    expect(classifyVoiceGender(makeVoice("Turkish Voice", "tr-TR"))).toBeNull();
    expect(classifyVoiceGender(makeVoice("Standard", "tr-TR"))).toBeNull();
  });
});

describe("pickTtsVoice", () => {
  const voices = [
    makeVoice("English US Voice", "en-US"),
    makeVoice("Google Turkish (Female)", "tr-TR"),
    makeVoice("Microsoft Ahmet", "tr-TR"),
    makeVoice("Turkish Neutral", "tr-TR"),
  ];

  it("picks female voice when preference is female", () => {
    const picked = pickTtsVoice(voices, "female");
    expect(picked?.name).toBe("Google Turkish (Female)");
  });

  it("picks male voice when preference is male", () => {
    const picked = pickTtsVoice(voices, "male");
    expect(picked?.name).toBe("Microsoft Ahmet");
  });

  it("falls back to opposite gender when preferred not found", () => {
    const onlyFemale = [
      makeVoice("Google Turkish (Female)", "tr-TR"),
      makeVoice("Turkish Neutral", "tr-TR"),
    ];
    const picked = pickTtsVoice(onlyFemale, "male");
    expect(picked?.name).toBe("Google Turkish (Female)");
  });

  it("falls back to any TR voice when no gender match", () => {
    const neutral = [makeVoice("Turkish Voice", "tr-TR")];
    const picked = pickTtsVoice(neutral, "female");
    expect(picked?.name).toBe("Turkish Voice");
  });

  it("returns null when no TR voice available", () => {
    const noTr = [makeVoice("English", "en-US"), makeVoice("German", "de-DE")];
    expect(pickTtsVoice(noTr, "female")).toBeNull();
  });

  // Oturum 28 K8 fix: locale parametresi (önceki versiyon hardcoded
  // TR voice listesinden seçerdi, EN sayfasında bile Türkçe gelirdi).

  it("picks English voice when lang=en-US", () => {
    const mixed = [
      makeVoice("Google Turkish (Female)", "tr-TR"),
      makeVoice("Microsoft Zira", "en-US"),
      makeVoice("Microsoft David", "en-US"),
    ];
    const picked = pickTtsVoice(mixed, "female", "en-US");
    expect(picked?.name).toBe("Microsoft Zira");
    expect(picked?.lang).toBe("en-US");
  });

  it("picks English male voice when preference=male and lang=en-US", () => {
    const mixed = [
      makeVoice("Google Turkish (Female)", "tr-TR"),
      makeVoice("Microsoft Zira", "en-US"),
      makeVoice("Microsoft David", "en-US"),
    ];
    const picked = pickTtsVoice(mixed, "male", "en-US");
    expect(picked?.name).toBe("Microsoft David");
  });

  it("matches BCP-47 prefix (en-US matches en, en-GB)", () => {
    const voices = [
      makeVoice("Google UK Female", "en-GB"),
      makeVoice("Generic English", "en"),
    ];
    const picked = pickTtsVoice(voices, "female", "en-US");
    expect(picked?.name).toBe("Google UK Female");
  });

  it("returns null when locale doesn't match any voice", () => {
    const trOnly = [makeVoice("Yelda", "tr-TR")];
    expect(pickTtsVoice(trOnly, "female", "en-US")).toBeNull();
  });

  it("defaults to TR when lang param omitted (backward-compat)", () => {
    const mixed = [
      makeVoice("Google Turkish (Female)", "tr-TR"),
      makeVoice("Microsoft Zira", "en-US"),
    ];
    const picked = pickTtsVoice(mixed, "female");
    expect(picked?.name).toBe("Google Turkish (Female)");
  });
});
