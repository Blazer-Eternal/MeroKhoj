declare module 'word-extractor' {
  interface IDoc {
    getBody(): string;
    getHeaders(): string;
    getFootnotes(): string;
    getAnnotations(): string;
  }

  class WordExtractor {
    extract(buffer: Buffer): Promise<IDoc>;
  }

  export = WordExtractor;
}
