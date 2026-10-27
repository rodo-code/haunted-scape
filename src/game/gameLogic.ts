// Pure validation functions — no React imports allowed in this file.
// REQ-5 AC-1, REQ-6 AC-1, REQ-7 AC-1, REQ-11 AC-1

/**
 * Normalises Spanish user input: lowercases, trims leading/trailing whitespace,
 * and strips diacritical marks (accents) via Unicode NFD decomposition.
 *
 * Examples:
 *   normalizeText('  Libro  ')  → 'libro'
 *   normalizeText('LÍBRO')      → 'libro'
 *   normalizeText('café')       → 'cafe'
 */
export function normalizeText(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip combining diacritical marks
    .toLowerCase()
    .trim();
}

/**
 * Room 1 — Biblioteca Maldita.
 * Accepts "libro" in any combination of case, accents, and surrounding whitespace.
 * REQ-5 AC-1
 */
export function validateRoom1(answer: string): boolean {
  return normalizeText(answer) === 'libro';
}

/**
 * Room 2 — Laboratorio de la Bruja.
 * Accepts only the exact string 'morada' (no normalisation — the value
 * originates from a controlled button selection, not free text).
 * REQ-6 AC-1
 */
export function validateRoom2(selection: string | null): boolean {
  return selection === 'morada';
}

/**
 * Room 3 — Cripta Encantada.
 * Accepts only '241' after trimming surrounding whitespace.
 * REQ-7 AC-1
 */
export function validateRoom3(code: string): boolean {
  return code.trim() === '241';
}
