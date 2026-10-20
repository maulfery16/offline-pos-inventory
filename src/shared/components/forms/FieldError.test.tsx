/**
 * Feature: form-validation-rhf-zod
 * Property 10: Inline error element is absent when field is valid
 * Validates: Requirements 11.3
 */
import { describe, it, expect } from 'vitest';
import type { ReactElement } from 'react';
import { FieldError } from './FieldError';

// Tests inspect the component's return value directly.
// No jsdom/RTL installed — component is called as a plain function.

describe('FieldError', () => {
  it('renders null when no children are passed', () => {
    const result = FieldError({});
    expect(result).toBeNull();
  });

  it('renders null when children is undefined', () => {
    const result = FieldError({ children: undefined });
    expect(result).toBeNull();
  });

  it('renders null when children is an empty string', () => {
    // Empty string is falsy → !children is true → returns null
    const result = FieldError({ children: '' });
    expect(result).toBeNull();
  });

  it('renders a <p> element with correct classes when a non-empty message is passed', () => {
    const result = FieldError({ children: 'Field is required' });
    expect(result).not.toBeNull();
    const el = result as ReactElement<{ className: string; children: React.ReactNode }>;
    expect(el.type).toBe('p');
    expect(el.props.className).toBe('text-xs text-red-500 mt-1');
    expect(el.props.children).toBe('Field is required');
  });

  it('removes element when message transitions from set to undefined (field becomes valid)', () => {
    // First call: message present → element exists
    const withMessage = FieldError({ children: 'Some error' });
    expect(withMessage).not.toBeNull();

    // Second call: message gone → null (simulates re-render after validation clears)
    const withoutMessage = FieldError({ children: undefined });
    expect(withoutMessage).toBeNull();
  });
});
