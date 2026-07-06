import { describe, it, expect } from 'vitest';
import { buildStorageUri } from '../src/types/document.js';

describe('document types', () => {
  it('buildStorageUri produces gdrive://file/<id>', () => {
    expect(buildStorageUri('abc123')).toBe('gdrive://file/abc123');
  });
});
