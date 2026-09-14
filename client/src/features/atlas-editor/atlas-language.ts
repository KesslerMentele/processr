import { StreamLanguage } from '@codemirror/language';
import type { StringStream } from '@codemirror/language';

/**
 * CodeMirror 6 StreamLanguage for the Processr Atlas DSL.
 *
 * Highlights:
 *  - Block-type keywords   (gamepack / category / item / node / recipe)  → keyword
 *  - Property keywords     (name / version / icon / duration / in / …)   → property
 *  - Value-class keywords  (input / output / sec / min / hr)              → type
 *  - String literals                                                       → string
 *  - Numbers                                                               → number
 *  - Identifiers (kebab-case IDs, array refs)                             → variable
 *  - Line comments                                                         → comment
 *  - Braces & brackets                                                     → bracket
 */

const BLOCK_KEYWORDS = new Set([
  'gamepack', 'category', 'item', 'node', 'recipe',
]);

const PROP_KEYWORDS = new Set([
  'name', 'game', 'version', 'gameVersion', 'description',
  'author', 'url', 'icon', 'color', 'sortOrder', 'parent',
  'speed', 'power', 'moduleSlots', 'tags', 'port',
  'duration', 'in', 'out', 'nodes', 'form', 'category',
]);

const VALUE_KEYWORDS = new Set([
  'input', 'output',
  'sec', 'min', 'hr',
]);

const atlasStreamParser = {
  startState: () => ({}),

  token(stream: StringStream): string | null {
    if (stream.eatSpace()) return null;

    // Line comment
    if (stream.match('//')) {
      stream.skipToEnd();
      return 'comment';
    }

    // String literal (handles \" escapes)
    if (stream.eat('"')) {
      // eslint-disable-next-line functional/no-loop-statements
      while (!stream.eol()) {
        const ch = stream.next();
        if (ch === '"') break;
        if (ch === '\\') stream.next();
      }
      return 'string';
    }

    // Numbers
    if (stream.match(/^-?\d+(\.\d+)?/)) return 'number';

    // Braces and brackets
    if (stream.eat('{') || stream.eat('}')) return 'bracket';
    if (stream.eat('[') || stream.eat(']')) return 'bracket';

    // Comma separator inside arrays
    if (stream.eat(',')) return 'operator';

    // Identifiers and keywords (including kebab-case IDs)
    const m = stream.match(/^[a-zA-Z][\w-]*/);
    if (m) {
      const word = (m as RegExpMatchArray)[0];
      if (BLOCK_KEYWORDS.has(word)) return 'keyword';
      if (PROP_KEYWORDS.has(word)) return 'property';
      if (VALUE_KEYWORDS.has(word)) return 'type';
      return 'variable';
    }

    stream.next();
    return null;
  },

  languageData: {
    commentTokens: { line: '//' },
  },
};

export const atlasLanguage = StreamLanguage.define(atlasStreamParser);