// @vitest-environment node
// Tests for src/game/gameLogic.ts — REQ-13 AC-1
// No React components are mounted; pure function testing only (REQ-11 AC-1).

import { describe, it, expect } from 'vitest';
import {
  normalizeText,
  validateRoom1,
  validateRoom2,
  validateRoom3,
} from '../gameLogic';

// ---------------------------------------------------------------------------
// normalizeText
// ---------------------------------------------------------------------------

describe('normalizeText', () => {
  it('lowercases the input', () => {
    expect(normalizeText('LIBRO')).toBe('libro');
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  libro  ')).toBe('libro');
  });

  it('strips acute accents', () => {
    expect(normalizeText('líbro')).toBe('libro');
  });

  it('strips multiple different diacritics', () => {
    expect(normalizeText('café')).toBe('cafe');
    expect(normalizeText('résumé')).toBe('resume');
  });

  it('handles an already normalised string unchanged', () => {
    expect(normalizeText('libro')).toBe('libro');
  });

  it('handles an empty string', () => {
    expect(normalizeText('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// validateRoom1 — Room 1: Biblioteca Maldita (REQ-5 AC-1)
// ---------------------------------------------------------------------------

describe('validateRoom1', () => {
  it('accepts exact lowercase answer', () => {
    expect(validateRoom1('libro')).toBe(true);
  });

  it('accepts uppercase answer', () => {
    expect(validateRoom1('LIBRO')).toBe(true);
  });

  it('accepts mixed-case answer', () => {
    expect(validateRoom1('Libro')).toBe(true);
  });

  it('accepts answer with leading/trailing spaces', () => {
    expect(validateRoom1('  libro  ')).toBe(true);
  });

  it('accepts answer with diacritics (e.g. "líbro")', () => {
    expect(validateRoom1('líbro')).toBe(true);
  });

  it('accepts combined: uppercase + accents + whitespace', () => {
    expect(validateRoom1('  LÍBRO  ')).toBe(true);
  });

  it('rejects a wrong answer', () => {
    expect(validateRoom1('mesa')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateRoom1('')).toBe(false);
  });

  it('rejects a whitespace-only string', () => {
    expect(validateRoom1('   ')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateRoom2 — Room 2: Laboratorio de la Bruja (REQ-6 AC-1)
// ---------------------------------------------------------------------------

describe('validateRoom2', () => {
  it('accepts exactly "morada"', () => {
    expect(validateRoom2('morada')).toBe(true);
  });

  it('rejects "roja"', () => {
    expect(validateRoom2('roja')).toBe(false);
  });

  it('rejects "verde"', () => {
    expect(validateRoom2('verde')).toBe(false);
  });

  it('rejects null (no selection)', () => {
    expect(validateRoom2(null)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateRoom2('')).toBe(false);
  });

  it('rejects "Morada" (different case — value comes from controlled button, no normalisation expected)', () => {
    expect(validateRoom2('Morada')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// validateRoom3 — Room 3: Cripta Encantada (REQ-7 AC-1)
// ---------------------------------------------------------------------------

describe('validateRoom3', () => {
  it('accepts exactly "241"', () => {
    expect(validateRoom3('241')).toBe(true);
  });

  it('accepts "241" with surrounding whitespace', () => {
    expect(validateRoom3('  241  ')).toBe(true);
  });

  it('rejects a wrong code', () => {
    expect(validateRoom3('123')).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(validateRoom3('')).toBe(false);
  });

  it('rejects a partial code', () => {
    expect(validateRoom3('24')).toBe(false);
  });

  it('rejects "241" with internal spaces', () => {
    expect(validateRoom3('2 41')).toBe(false);
  });
});
