import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function extractJson(str: string): string {
  const firstOpenBrace = str.indexOf('{');
  const firstOpenBracket = str.indexOf('[');
  
  let start = -1;
  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    start = Math.min(firstOpenBrace, firstOpenBracket);
  } else if (firstOpenBrace !== -1) {
    start = firstOpenBrace;
  } else if (firstOpenBracket !== -1) {
    start = firstOpenBracket;
  }

  const lastCloseBrace = str.lastIndexOf('}');
  const lastCloseBracket = str.lastIndexOf(']');
  const end = Math.max(lastCloseBrace, lastCloseBracket);

  if (start !== -1 && end !== -1 && end > start) {
    return str.substring(start, end + 1);
  }
  return str.trim();
}

export function safeJsonParse<T>(str: string, fallback: T): T {
  try {
    const cleaned = extractJson(str);
    return JSON.parse(cleaned) as T;
  } catch (e) {
    console.error("Failed to parse JSON:", e, "Original string:", str);
    return fallback;
  }
}
