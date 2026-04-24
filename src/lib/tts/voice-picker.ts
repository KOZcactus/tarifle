/**
 * Cooking Mode TTS voice selection helper.
 *
 * Browser `speechSynthesis.getVoices()` listesinden kullanıcının
 * tercih ettiği cinsiyete uygun TR-TR voice seçer. Platform voice
 * name'lerinde cinsiyet bilgisi genelde parantez veya soy isim ile
 * gömülü, pattern-based tahmin yapılır.
 *
 * Fallback hiyerarşisi:
 *   1. Tercih edilen cinsiyet pattern'iyle eşleşen TR voice
 *   2. Diğer cinsiyet TR voice (hiç eşleşme yoksa)
 *   3. Herhangi bir TR voice
 *   4. null (TR voice yok, utterance.voice atamaz, browser default)
 */

export type TtsGender = "female" | "male";

// Yaygın TR female voice isim pattern'leri: Google "Turkish (Female)" /
// Microsoft "Elif / Zeynep" / Apple "Yelda" / native "Kadın".
const FEMALE_NAME_PATTERN =
  /female|woman|kad(ı|i)n|yelda|elif|zeynep|filiz|sevinç|tülay|aysu|nazlı|pınar/i;

// Erkek pattern: Google "Male" / Microsoft "Ahmet" / Apple "Cem".
const MALE_NAME_PATTERN =
  /male|man|erkek|cem|ahmet|burak|emin|yusuf|mehmet|mert|murat|tolga/i;

export function classifyVoiceGender(voice: SpeechSynthesisVoice): TtsGender | null {
  if (FEMALE_NAME_PATTERN.test(voice.name)) return "female";
  if (MALE_NAME_PATTERN.test(voice.name)) return "male";
  return null;
}

export function pickTtsVoice(
  voices: readonly SpeechSynthesisVoice[],
  preference: TtsGender,
): SpeechSynthesisVoice | null {
  const tr = voices.filter((v) => v.lang?.toLowerCase().startsWith("tr"));
  if (tr.length === 0) return null;

  // 1. Preferred gender match
  const preferred = tr.find((v) => classifyVoiceGender(v) === preference);
  if (preferred) return preferred;

  // 2. Opposite gender (kullanıcı tercih etti ama platform'da yok)
  const opposite = preference === "female" ? "male" : "female";
  const other = tr.find((v) => classifyVoiceGender(v) === opposite);
  if (other) return other;

  // 3. Herhangi bir TR voice (cinsiyeti belirsiz)
  return tr[0] ?? null;
}
