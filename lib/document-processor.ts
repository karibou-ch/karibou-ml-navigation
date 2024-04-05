import path from 'node:path';
import { getDocument } from 'pdfjs-dist/build/pdf.js';
import { PDFPageProxy, TextItem, TextMarkedContent } from 'pdfjs-dist/build/pdf.js';




export interface FileInfos {
  filename: string;
  data: Buffer;
  type: string;
  category: string;
}

export interface Document {
  filename: string;
  type: string;
  category: string;
  sections: Section[];
}

export interface Section {
  id: string;
  content: string;
  category: string;
  sourcepage: string;
  sourcefile: string;
  embedding?: number[];
}

export interface ContentPage {
  content: string;
  offset: number;
  page: number;
}

export interface ContentSection {
  content: string;
  page: number;
}

export function parseLocaleNumber(str) {

  // Regular expression to check the number format
  const regex = /^[+-]?(\d{1,3}([ ,.]\d{3})*|(\d+))([.,]\d+)?$/;
  
  if (regex.test(str)) {
    // Detect if the format uses comma as decimal separator
    const commaAsDecimal = str.includes(',') && (str.includes('.') ? str.indexOf(',') > str.indexOf('.') : true);
    
    if (commaAsDecimal) {
      // European format (e.g., "1.000,00"): Replace periods with nothing and commas with periods
      str = str.replace(/\./g, '').replace(/,/, '.');
    } else {
      // International format (e.g., "1,000.00"): Remove commas
      str = str.replace(/,/g, '');
    }
    
    // Parse the standardized string to a number
    return parseFloat(str);
  }  
  return NaN;
}

export function tryToParseNumber(text) {
  const original = text;
  // Trim the string to remove leading and trailing spaces
  text = text.trim().replace(/\s/g,'');

  // Handle negative numbers.
  const isNegative = text.startsWith("-")||text.startsWith("–");

  text = isNegative ? text.slice(1):text;
  const number = parseLocaleNumber(text);
  if(!isNaN(number)) {
    return isNegative ? -number:number;
  }

  return original;

}



const SENTENCE_ENDINGS = new Set(['.', '!', '?']);
const WORD_BREAKS = new Set([',', ';', ':', ' ', '(', ')', '[', ']', '{', '}', '\t', '\n']);
const MAX_SECTION_LENGTH = 1000;
const SENTENCE_SEARCH_LIMIT = 100;
const SECTION_OVERLAP = 100;

export class DocumentProcessor {
  constructor() {}

  async createDocumentFromFile(filename: string, data: Buffer, type: string, category: string) {
    const pages = await this.extractText(data, type);
    const contentSections = this.splitPages(filename, pages);
    const sections = await this.createSections(filename, contentSections, category);
    return { filename, type, category, sections };
  }

  private async extractText(data: Buffer, type: string): Promise<ContentPage[]> {
    const pages: ContentPage[] = [];
    if (type === 'text/plain' || type === 'text/markdown') {
      const text = data.toString('utf8');
      pages.push({ content: text, offset: 0, page: 0 });
    } else if (type === 'application/pdf') {
      const pdfContent = await extractTextFromPdf(data);
      pages.push(...pdfContent);
    } else {
      // You can add support for other file types here
      throw new Error(`Unsupported file type: ${type}`);
    }

    return pages;
  }

  private async createSections(filename: string, contentSections: ContentSection[], category: string) {
    const fileId = filenameToId(filename);
    const sections: Section[] = [];

    for (const [index, { content, page }] of contentSections.entries()) {
      const section: Section = {
        id: `${fileId}-page-${page}-section-${index}`,
        content,
        category: category,
        sourcepage: path.basename(filename),
        sourcefile: filename,
      };

      sections.push(section);
    }
    return sections;
  }

  private splitPages(filename: string, pages: ContentPage[]): ContentSection[] {
    console.log(`Splitting '${filename}' into sections`);

    const findPage = (offset: number): number => {
      const pageCount = pages.length;
      for (let i = 0; i < pageCount - 1; i++) {
        if (offset >= pages[i].offset && offset < pages[i + 1].offset) {
          return pages[i].page;
        }
      }
      return pages[pageCount - 1].page;
    };

    const contentSections: ContentSection[] = [];
    const allText = pages.map((page) => page.content).join('');
    const length = allText.length;
    let start = 0;
    let end = length;

    while (start + SECTION_OVERLAP < length) {
      let lastWord = -1;
      end = start + MAX_SECTION_LENGTH;

      if (end > length) {
        end = length;
      } else {
        // Try to find the end of the sentence
        while (
          end < length &&
          end - start - MAX_SECTION_LENGTH < SENTENCE_SEARCH_LIMIT &&
          !SENTENCE_ENDINGS.has(allText[end])
        ) {
          if (WORD_BREAKS.has(allText[end])) {
            lastWord = end;
          }
          end += 1;
        }
        if (end < length && !SENTENCE_ENDINGS.has(allText[end]) && lastWord > 0) {
          end = lastWord; // Fall back to at least keeping a whole word
        }
        if (end < length) {
          end += 1;
        }
      }

      // Try to find the start of the sentence or at least a whole word boundary
      lastWord = -1;
      while (
        start > 0 &&
        start > end - MAX_SECTION_LENGTH - 2 * SENTENCE_SEARCH_LIMIT &&
        !SENTENCE_ENDINGS.has(allText[start])
      ) {
        if (WORD_BREAKS.has(allText[start])) {
          lastWord = start;
        }
        start -= 1;
      }
      if (!SENTENCE_ENDINGS.has(allText[start]) && lastWord > 0) {
        start = lastWord;
      }
      if (start > 0) {
        start += 1;
      }

      const sectionText = allText.slice(start, end);
      contentSections.push({ page: findPage(start), content: sectionText });

      const lastTableStart = sectionText.lastIndexOf('<table');
      if (lastTableStart > 2 * SENTENCE_SEARCH_LIMIT && lastTableStart > sectionText.lastIndexOf('</table')) {
        // If the section ends with an unclosed table, we need to start the next section with the table.
        // If table starts inside SENTENCE_SEARCH_LIMIT, we ignore it, as that will cause an infinite loop for tables longer than MAX_SECTION_LENGTH
        // If last table starts inside SECTION_OVERLAP, keep overlapping
        const page = findPage(start);
        console.log(
          `Section ends with unclosed table, starting next section with the table at page ${page} offset ${start} table start ${lastTableStart}`,
        );
        start = Math.min(end - SECTION_OVERLAP, start + lastTableStart);
      } else {
        start = end - SECTION_OVERLAP;
      }
    }

    if (start + SECTION_OVERLAP < end) {
      contentSections.push({ content: allText.slice(start, end), page: findPage(start) });
    }

    return contentSections;
  }
}


function filenameToId(filename: string) {
  const filenameAscii = filename.replace(/[^\w-]/g, '_');
  const filenameHash = Buffer.from(filename, 'utf8').toString('hex');
  return `file-${filenameAscii}-${filenameHash}`;
}

async function extractTextFromPdf(data: Buffer): Promise<ContentPage[]> {
  const pages: ContentPage[] = [];
  const pdf = await getDocument(new Uint8Array(data)).promise;
  let offset = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    let previousY = 0;
    const text = textContent.items
      .filter((item) => 'str' in item && item.str !=' ')
      .map((item) => {
        const text = item as TextItem;
        //if(item.hasEOL) console.log(item)
        const y = text.transform[5];
        let string_ = text.str;
        if (y !== previousY && previousY !== 0) {
          string_ = '\n' + string_;
        }
        previousY = y;
        return tryToParseNumber(string_);
      })
      .join('|');

    pages.push({ content: text + '', offset, page: i });
    offset += text.length;
  }
  return pages;
}
