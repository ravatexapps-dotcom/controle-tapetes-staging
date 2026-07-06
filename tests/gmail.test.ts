import { describe, it, expect } from 'vitest';
import { isAttachmentCandidate } from '../src/connectors/gmail.js';

describe('gmail attachment filter', () => {
  it('accepts PDF by mime', () => {
    expect(isAttachmentCandidate('nota.pdf', 'application/pdf')).toBe(true);
  });

  it('accepts XML by mime', () => {
    expect(isAttachmentCandidate('nota.xml', 'application/xml')).toBe(true);
  });

  it('accepts XML by mime text/xml', () => {
    expect(isAttachmentCandidate('a.xml', 'text/xml')).toBe(true);
  });

  it('accepts PDF by extension even with unknown mime', () => {
    expect(isAttachmentCandidate('a.pdf', 'application/octet-stream')).toBe(true);
  });

  it('accepts XML by extension even with unknown mime', () => {
    expect(isAttachmentCandidate('a.xml', 'application/octet-stream')).toBe(true);
  });

  it('rejects non-PDF/XML', () => {
    expect(isAttachmentCandidate('image.png', 'image/png')).toBe(false);
    expect(isAttachmentCandidate('doc.docx', 'application/msword')).toBe(false);
    expect(isAttachmentCandidate('data.json', 'application/json')).toBe(false);
  });

  it('is case-insensitive on extension', () => {
    expect(isAttachmentCandidate('NOTA.PDF', 'application/octet-stream')).toBe(true);
    expect(isAttachmentCandidate('NOTA.XML', 'application/octet-stream')).toBe(true);
  });
});
