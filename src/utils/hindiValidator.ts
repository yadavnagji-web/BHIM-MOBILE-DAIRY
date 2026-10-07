// Helper utilities for enforcing Hindi (Devanagari script) data input

/**
 * Checks if a string contains any English alphabet letters (A-Z, a-z)
 */
export function hasEnglishLetters(text: string): boolean {
  if (!text) return false;
  return /[a-zA-Z]/.test(text);
}

/**
 * Checks if a string contains valid Devanagari (Hindi) script characters (\u0900-\u097F)
 */
export function hasDevanagari(text: string): boolean {
  if (!text) return false;
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Validates that the input is purely in Hindi (Devanagari), with numbers/spaces/punctuation allowed,
 * but STRICTLY NO English letters!
 */
export function isStrictHindi(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  // Must have at least one Hindi character AND zero English letters
  return hasDevanagari(trimmed) && !hasEnglishLetters(trimmed);
}

/**
 * Validates Hindi text and returns error message in Hindi if invalid
 */
export function validateHindiField(
  value: string,
  fieldName: string = 'नाम',
  isRequired: boolean = true
): { valid: boolean; error?: string } {
  const trimmed = (value || '').trim();
  if (!trimmed) {
    if (isRequired) {
      return { valid: false, error: `कृपया ${fieldName} दर्ज करें।` };
    }
    return { valid: true };
  }

  if (hasEnglishLetters(trimmed)) {
    return {
      valid: false,
      error: `⚠️ ${fieldName} केवल हिंदी (देवनागरी) में मान्य है! अंग्रेज़ी अक्षर स्वीकार्य नहीं हैं।`,
    };
  }

  if (!hasDevanagari(trimmed)) {
    return {
      valid: false,
      error: `⚠️ ${fieldName} हिंदी में होना आवश्यक है (जैसे: 'नगजी यादव')।`,
    };
  }

  return { valid: true };
}

/**
 * Phonetic dictionary for common English names/surnames to Hindi for one-click help
 */
const COMMON_PHONETIC_MAP: Record<string, string> = {
  yadav: 'यादव',
  nagji: 'नगजी',
  punjaji: 'पुंजाजी',
  ramlal: 'रामलाल',
  mukesh: 'मुकेश',
  ramesh: 'रमेश',
  suresh: 'सुरेश',
  dinesh: 'दिनेश',
  mahesh: 'महेश',
  gopal: 'गोपाल',
  kishan: 'किशन',
  kishanlal: 'किशनलाल',
  mohan: 'मोहन',
  mohanlal: 'मोहनलाल',
  sakodara: 'साकोदरा',
  chitari: 'चितरी',
  sagwara: 'सागवाड़ा',
  dungarpur: 'डूंगरपुर',
  rampur: 'रामपुर',
  kisan: 'किसान',
  shikshak: 'शिक्षक',
  kirana: 'किराना',
  mistri: 'मिस्त्री',
  dairy: 'डेयरी',
  driver: 'चालक',
  darji: 'दर्जी',
  sharma: 'शर्मा',
  kumar: 'कुमार',
  singh: 'सिंह',
  patel: 'पटेल',
};

/**
 * Simple phonetic transliteration helper from Roman Hindi / English to Devanagari
 */
export function transliterateEnglishToHindi(input: string): string {
  if (!input || !input.trim()) return input;

  const words = input.trim().split(/\s+/);
  const converted = words.map((w) => {
    const lower = w.toLowerCase().replace(/[^a-z]/g, '');
    if (COMMON_PHONETIC_MAP[lower]) {
      return COMMON_PHONETIC_MAP[lower];
    }

    // Basic rule-based phonetic replacement for Hindi transliteration
    let s = lower;
    s = s.replace(/sh/g, 'श');
    s = s.replace(/ch/g, 'च');
    s = s.replace(/th/g, 'थ');
    s = s.replace(/dh/g, 'ध');
    s = s.replace(/bh/g, 'भ');
    s = s.replace(/kh/g, 'ख');
    s = s.replace(/gh/g, 'घ');
    s = s.replace(/ph/g, 'फ');
    s = s.replace(/jh/g, 'झ');

    s = s.replace(/aa|a/g, 'ा');
    s = s.replace(/ee|i/g, 'ी');
    s = s.replace(/oo|u/g, 'ू');
    s = s.replace(/e/g, 'े');
    s = s.replace(/ai/g, 'ै');
    s = s.replace(/o/g, 'ो');
    s = s.replace(/au/g, 'ौ');

    s = s.replace(/k/g, 'क');
    s = s.replace(/g/g, 'ग');
    s = s.replace(/j/g, 'ज');
    s = s.replace(/t/g, 'त');
    s = s.replace(/d/g, 'द');
    s = s.replace(/n/g, 'न');
    s = s.replace(/p/g, 'प');
    s = s.replace(/b/g, 'ब');
    s = s.replace(/m/g, 'म');
    s = s.replace(/y/g, 'य');
    s = s.replace(/r/g, 'र');
    s = s.replace(/l/g, 'ल');
    s = s.replace(/v|w/g, 'व');
    s = s.replace(/s/g, 'स');
    s = s.replace(/h/g, 'ह');

    // Fix leading vowel signs
    if (s.startsWith('ा')) s = 'आ' + s.slice(1);
    if (s.startsWith('ी')) s = 'ई' + s.slice(1);
    if (s.startsWith('ू')) s = 'ऊ' + s.slice(1);
    if (s.startsWith('े')) s = 'ए' + s.slice(1);
    if (s.startsWith('ो')) s = 'ओ' + s.slice(1);

    return s;
  });

  return converted.join(' ');
}
