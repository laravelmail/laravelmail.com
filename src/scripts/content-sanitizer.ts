/**
 * Content Sanitizer Utility
 * 
 * Cleans content from word processors and removes decorative punctuation
 * that confuses AI parsing.
 * 
 * Usage:
 *   import { sanitizeContent } from './content-sanitizer';
 *   const cleaned = sanitizeContent(userContent);
 */

const SMART_QUOTE_MAP: Record<string, string> = {
    '\u2018': "'",  // left single quotation mark
    '\u2019': "'",  // right single quotation mark
    '\u201c': '"',  // left double quotation mark
    '\u201d': '"',  // right double quotation mark
    '\u2010': '-',  // hyphen
    '\u2011': '-',  // non-breaking hyphen
    '\u2012': '-',  // en dash
    '\u2013': '-',  // en dash
    '\u2014': '-',  // em dash
    '\u2015': '-',  // horizontal bar
    '\u00a0': ' ',  // non-breaking space
    '\u2026': '...', // ellipsis
};

const DECORATIVE_SYMBOLS = /[★☆✓✗→←↑↓◆■●○]/g;
const EXCESSIVE_PUNCTUATION = /[!]{3,}|[?]{3,}|[.]{4,}/g;

export function sanitizeContent(html: string): string {
    let result = html;
    
    result = result.replace(/[\u2018\u2019]/g, "'");
    result = result.replace(/[\u201c\u201d]/g, '"');
    result = result.replace(/[\u2010-\u2015]/g, '-');
    result = result.replace(/\u00a0/g, ' ');
    result = result.replace(/\u2026/g, '...');
    
    result = result.replace(DECORATIVE_SYMBOLS, '');
    
    result = result.replace(EXCESSIVE_PUNCTUATION, (match) => {
        if (match.startsWith('!')) return '!';
        if (match.startsWith('?')) return '?';
        return '...';
    });
    
    result = result.replace(/\s+/g, ' ');
    
    return result.trim();
}

export function hasSmartQuotes(text: string): boolean {
    return /[\u2018\u2019\u201c\u201d]/.test(text);
}

export function hasExcessivePunctuation(text: string): boolean {
    return EXCESSIVE_PUNCTUATION.test(text);
}