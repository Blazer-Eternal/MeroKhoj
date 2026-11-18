import * as mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';
import WordExtractor from 'word-extractor';
import { AppError } from '../../../utils';

/**
 * Resume file → plain text (Phase 2, parser side).
 *
 * Pure TypeScript, in-process: PDF via pdf-parse, DOCX via mammoth, legacy
 * DOC via word-extractor, TXT/MD read directly. The extracted text is what
 * the AI parser structures — this module never calls the provider.
 */

export type ResumeFileKind = '.pdf' | '.doc' | '.docx' | '.txt' | '.md';

const EXTENSION_KINDS: Record<string, ResumeFileKind> = {
  '.pdf': '.pdf',
  '.doc': '.doc',
  '.docx': '.docx',
  '.txt': '.txt',
  '.md': '.md',
};

const MIME_KINDS: Record<string, ResumeFileKind> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'text/plain': '.txt',
  'text/markdown': '.md',
};

/** Resolve the resume kind from the file name, falling back to MIME type. */
export const detectResumeKind = (
  fileName: string,
  mimeType?: string | null,
): ResumeFileKind | null => {
  const dot = fileName.lastIndexOf('.');
  const extension = dot >= 0 ? fileName.slice(dot).toLowerCase() : '';
  const byExtension = EXTENSION_KINDS[extension];
  if (byExtension) return byExtension;
  if (mimeType) return MIME_KINDS[mimeType.toLowerCase()] ?? null;
  return null;
};

export interface IExtractedResumeText {
  text: string;
  kind: ResumeFileKind;
}

/**
 * Extract readable text from a resume buffer.
 * Throws 400 for unsupported types and for files with no extractable text
 * (scanned/image-only PDFs are not supported yet).
 */
export const extractResumeText = async (
  buffer: Buffer,
  fileName: string,
  mimeType?: string | null,
): Promise<IExtractedResumeText> => {
  const kind = detectResumeKind(fileName, mimeType);
  if (!kind) {
    throw AppError.badRequest(
      `Unsupported file "${fileName}". Allowed resume types: PDF, DOC, DOCX, TXT.`,
    );
  }

  let text = '';
  switch (kind) {
    case '.txt':
    case '.md': {
      text = buffer.toString('utf-8');
      break;
    }
    case '.pdf': {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      text = result.text;
      break;
    }
    case '.docx': {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
      break;
    }
    case '.doc': {
      const document = await new WordExtractor().extract(buffer);
      text = document.getBody();
      break;
    }
  }

  const cleaned = text
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  if (cleaned.length < 20) {
    throw AppError.badRequest(
      'No extractable text found in the file (scanned or image-only resumes are not supported yet).',
    );
  }
  return { text: cleaned, kind };
};

export const textExtract = { detectResumeKind, extractResumeText };

export default textExtract;
