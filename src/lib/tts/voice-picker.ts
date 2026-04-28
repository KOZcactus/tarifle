/**
 * Cooking Mode TTS voice selection helper.
 *
 * Browser `speechSynthesis.getVoices()` listesinden kullanıcının
 * tercih ettiği cinsiyete + site locale'ına uygun voice seçer.
 * Platform voice name'lerinde cinsiyet bilgisi genelde parantez veya
 * soy isim ile gömülü, pattern-based tahmin yapılır.
 *
 * Fallback hiyerarşisi:
 *   1. Tercih edilen cinsiyet pattern'iyle eşleşen lang voice
 *   2. Diğer cinsiyet lang voice (hiç eşleşme yoksa)
 *   3. Herhangi bir lang voice
 *   4. null (lang voice yok, utterance.voice atamaz, browser default
 *      lang voice fallback'i SpeechSynthesisUtterance.lang üzerinden)
 *
 * Oturum 28 K8 fix: locale parametresi eklendi (önceki versiyon
 * hardcoded TR voice listesi seçiyordu, EN sayfasında bile Türkçe
 * voice gelirdi).
 */

export type TtsGender = "female" | "male";

// Yaygın TR female voice isim pattern'leri: Google "Turkish (Female)" /
// Microsoft "Elif / Zeynep" / Apple "Yelda" / native "Kadın".
// EN female: Google "English (Female)" / Microsoft "Zira / Aria" /
// Apple "Samantha / Allison / Ava". Lokalize female isimler de pattern'a.
const FEMALE_NAME_PATTERN =
  /female|woman|kad(ı|i)n|yelda|elif|zeynep|filiz|sevinç|tülay|aysu|nazlı|pınar|zira|aria|samantha|allison|ava|susan|karen|moira/i;

// Erkek pattern: Google "Male" / Microsoft "Ahmet" + EN "David / Mark / Daniel".
const MALE_NAME_PATTERN =
  /male|man|erkek|cem|ahmet|burak|emin|yusuf|mehmet|mert|murat|tolga|david|mark|daniel|alex|fred|tom/i;

export function classifyVoiceGender(voice: SpeechSynthesisVoice): TtsGender | null {
  if (FEMALE_NAME_PATTERN.test(voice.name)) return "female";
  if (MALE_NAME_PATTERN.test(voice.name)) return "male";
  return null;
}

export function pickTtsVoice(
  voices: readonly SpeechSynthesisVoice[],
  preference: TtsGender,
  lang: string = "tr-TR",
): SpeechSynthesisVoice | null {
  // BCP-47 prefix match: "tr-TR" → "tr", "en-US" → "en". Voices'da
  // "tr" / "tr-TR" / "en" / "en-US" / "en-GB" hepsini yakalar.
  const langPrefix = lang.toLowerCase().split("-")[0] ?? "tr";
  const matched = voices.filter((v) =>
    v.lang?.toLowerCase().startsWith(langPrefix),
  );
  if (matched.length === 0) return null;

  // 1. Preferred gender match
  const preferred = matched.find((v) => classifyVoiceGender(v) === preference);
  if (preferred) return preferred;

  // 2. Opposite gender (kullanıcı tercih etti ama platform'da yok)
  const opposite = preference === "female" ? "male" : "female";
  const other = matched.find((v) => classifyVoiceGender(v) === opposite);
  if (other) return other;

  // 3. Herhangi bir lang voice (cinsiyeti belirsiz)
  return matched[0] ?? null;
}
