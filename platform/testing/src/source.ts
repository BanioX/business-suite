/**
 * A small reader of TypeScript and JavaScript source, for the two standard tests that look at
 * code as text: the side effects (which must not count what a comment says) and the texts
 * (which read the literal parts of a message function).
 *
 * It is no parser. It tells apart code, comments, quoted strings and template literals, which
 * is what both tests need, and where it cannot be sure it keeps the text instead of dropping
 * it: a guard that reads a comment as code fails loudly, one that reads code as a comment is
 * blind without a word.
 */

/** A piece of a source text. Joined in order, the `raw` parts give the text back. */
type Token =
  | { type: 'code'; raw: string }
  | { type: 'comment'; raw: string; block: boolean }
  /** A quoted string with its quotes; `value` is its text with the escapes resolved. */
  | { type: 'string'; raw: string; value: string }
  | {
      type: 'template_open' | 'template_close' | 'expression_open' | 'expression_close';
      raw: string;
    }
  /** A stretch of a template literal between its expressions. */
  | { type: 'template_text'; raw: string; value: string };

/** What stands for an expression `${…}` in the text of a template literal. */
export const EXPRESSION_PLACEHOLDER = '{}';

const HEX = /^[0-9a-fA-F]+$/;

const SIMPLE_ESCAPES: ReadonlyMap<string, string> = new Map([
  ['n', '\n'],
  ['t', '\t'],
  ['r', '\r'],
  ['b', '\b'],
  ['f', '\f'],
  ['v', '\v'],
  ['0', '\0'],
]);

/** The characters that end a line of source: the two usual ones and the two separators of Unicode. */
const LINE_ENDS: ReadonlySet<string> = new Set([
  '\n',
  '\r',
  String.fromCharCode(0x2028),
  String.fromCharCode(0x2029),
]);

/** Where the line that holds `index` ends: the index of its line end, or the end of the text. */
function lineEnd(source: string, index: number): number {
  let end = index;
  while (end < source.length && !LINE_ENDS.has(source.charAt(end))) {
    end += 1;
  }
  return end;
}

/**
 * The escape that starts with the backslash at `index`: the text it stands for and where the
 * reading goes on. An escape that is malformed stands for itself.
 */
function readEscape(source: string, index: number): { text: string; next: number } {
  const kind = source.charAt(index + 1);
  if (kind === 'x' || (kind === 'u' && source.charAt(index + 2) !== '{')) {
    const length = kind === 'x' ? 2 : 4;
    const digits = source.slice(index + 2, index + 2 + length);
    if (digits.length === length && HEX.test(digits)) {
      return {
        text: String.fromCharCode(Number.parseInt(digits, 16)),
        next: index + 2 + length,
      };
    }
  } else if (kind === 'u') {
    const end = source.indexOf('}', index + 3);
    const digits = end < 0 ? '' : source.slice(index + 3, end);
    const point = HEX.test(digits) ? Number.parseInt(digits, 16) : Number.NaN;
    if (point <= 0x10ffff) {
      return { text: String.fromCodePoint(point), next: end + 1 };
    }
  } else if (kind === '\r' && source.charAt(index + 2) === '\n') {
    return { text: '', next: index + 3 };
  } else if (LINE_ENDS.has(kind)) {
    // A backslash at the end of a line continues the literal on the next one.
    return { text: '', next: index + 2 };
  }
  // Every other escaped character stands for itself: a quote, a backslash, a dollar sign.
  return { text: SIMPLE_ESCAPES.get(kind) ?? kind, next: index + 2 };
}

/** After these a `/` starts a regular expression, not a division. */
const BEFORE_REGEX: ReadonlySet<string> = new Set('(,=:[!&|?{};+-*%~^'.split(''));
const KEYWORD_BEFORE_REGEX =
  /(?:^|[^\w$.])(?:return|typeof|case|do|else|in|of|void|delete|throw|new|instanceof|yield|await)\s*$/;

/** A character an identifier or a path can end with: a `/*` right after it opens no comment. */
const GLUED = /[\w$*/]/;

/**
 * Where the regular expression that starts at `index` ends (the index after its closing
 * slash), or -1 if the line holds no such end.
 */
function regexEnd(source: string, index: number): number {
  let inClass = false;
  for (let i = index + 1; i < source.length; i += 1) {
    const char = source.charAt(i);
    if (LINE_ENDS.has(char)) {
      return -1;
    }
    if (char === '\\') {
      i += 1;
    } else if (char === '[') {
      inClass = true;
    } else if (char === ']') {
      inClass = false;
    } else if (char === '/' && !inClass) {
      return i + 1;
    }
  }
  return -1;
}

/** Splits a source text into code, comments, strings and the parts of template literals. */
function tokensOf(source: string): Token[] {
  const tokens: Token[] = [];
  /**
   * Where the reader is: in a template literal (`'template'`), or in code, as the number of
   * braces open since the code began. The first entry is the code of the file itself.
   */
  const frames: ('template' | number)[] = [0];
  let pending = '';
  /** The last character of code that is not white space, and the code since the last literal. */
  let last = '';
  let recent = '';
  let index = 0;

  const flush = () => {
    if (pending !== '') {
      tokens.push({ type: 'code', raw: pending });
      pending = '';
    }
  };
  const code = (text: string) => {
    pending += text;
    recent = (recent + text).slice(-24);
    const significant = text.trimEnd();
    if (significant !== '') {
      last = significant.charAt(significant.length - 1);
    }
  };
  /** A literal ended: what follows is an operator, never the start of a regular expression. */
  const afterLiteral = (closing: string) => {
    last = closing;
    recent = '';
  };

  const readTemplateText = () => {
    const start = index;
    let value = '';
    while (index < source.length) {
      const char = source.charAt(index);
      if (char === '`' || (char === '$' && source.charAt(index + 1) === '{')) {
        break;
      }
      if (char === '\\') {
        const escape = readEscape(source, index);
        value += escape.text;
        index = Math.min(escape.next, source.length);
      } else {
        value += char;
        index += 1;
      }
    }
    if (index > start) {
      tokens.push({ type: 'template_text', raw: source.slice(start, index), value });
    }
  };

  /** Reads a quoted string; false if the line ends before the string does. */
  const readString = (quote: string): boolean => {
    let value = '';
    for (let i = index + 1; i < source.length;) {
      const char = source.charAt(i);
      if (char === quote) {
        flush();
        tokens.push({ type: 'string', raw: source.slice(index, i + 1), value });
        index = i + 1;
        afterLiteral(quote);
        return true;
      }
      if (LINE_ENDS.has(char)) {
        return false;
      }
      if (char === '\\') {
        const escape = readEscape(source, i);
        value += escape.text;
        i = escape.next;
      } else {
        value += char;
        i += 1;
      }
    }
    return false;
  };

  while (index < source.length) {
    const frame = frames.at(-1);
    if (frame === 'template') {
      readTemplateText();
      if (source.charAt(index) === '`') {
        tokens.push({ type: 'template_close', raw: '`' });
        index += 1;
        frames.pop();
        afterLiteral('`');
      } else if (index < source.length) {
        tokens.push({ type: 'expression_open', raw: '${' });
        index += 2;
        frames.push(0);
        last = '{';
        recent = '';
      }
      continue;
    }

    const char = source.charAt(index);
    const next = source.charAt(index + 1);
    const before = source.charAt(index - 1);

    if (char === '/' && next === '/' && before !== ':' && before !== '\\') {
      // An address (`https://…`) written outside a string, as in the text of markup, is code.
      const stop = lineEnd(source, index);
      flush();
      tokens.push({ type: 'comment', raw: source.slice(index, stop), block: false });
      index = stop;
    } else if (char === '/' && next === '*' && !GLUED.test(before)) {
      const end = source.indexOf('*/', index + 2);
      if (end < 0) {
        // No end: not a comment. Dropping the rest of the file would hide whatever it holds.
        code(char);
        index += 1;
      } else {
        flush();
        tokens.push({ type: 'comment', raw: source.slice(index, end + 2), block: true });
        index = end + 2;
      }
    } else if (
      char === '/' &&
      (BEFORE_REGEX.has(last) || last === '' || KEYWORD_BEFORE_REGEX.test(recent))
    ) {
      const end = regexEnd(source, index);
      const stop = end < 0 ? index + 1 : end;
      code(source.slice(index, stop));
      index = stop;
    } else if (char === '\\') {
      // Outside a literal a backslash stands only in a regular expression: it and the
      // character it escapes are code, so `\/\/` opens no comment.
      code(source.slice(index, index + 2));
      index += 2;
    } else if (char === "'" || char === '"') {
      if (!readString(char)) {
        // An apostrophe in the text of markup, or a string cut off: the rest of the line is
        // kept as it is.
        const stop = lineEnd(source, index + 1);
        code(source.slice(index, stop));
        index = stop;
      }
    } else if (char === '`') {
      flush();
      tokens.push({ type: 'template_open', raw: '`' });
      index += 1;
      frames.push('template');
    } else if (char === '}' && frame === 0 && frames.length > 1) {
      flush();
      tokens.push({ type: 'expression_close', raw: '}' });
      index += 1;
      frames.pop();
    } else {
      if (typeof frame === 'number' && (char === '{' || char === '}')) {
        frames[frames.length - 1] = frame + (char === '{' ? 1 : -1);
      }
      code(char);
      index += 1;
    }
  }
  flush();
  return tokens;
}

/**
 * Code without its comments, so a sentence about a function in a comment is no call of it.
 * Strings and template literals stay as they are, also where they hold `//` or `/*`: an address
 * in a string is code, and so is everything after it. A block comment leaves one space, so
 * the words around it stay apart.
 *
 * Kept on purpose, because the reader cannot be sure there: a `/*` that is never closed, a
 * `/*` right after a word or a slash (the end of a path in the text of markup), a `//` right
 * after a colon (an address in the text of markup), and whatever follows an apostrophe that
 * opens no string on its line.
 */
export function withoutComments(code: string): string {
  return tokensOf(code)
    .map((token) => (token.type !== 'comment' ? token.raw : token.block ? ' ' : ''))
    .join('');
}

/**
 * The texts written in a piece of source: every quoted string and every template literal, with
 * escapes resolved. In a template literal each `${…}` is replaced by `EXPRESSION_PLACEHOLDER`;
 * literals inside such an expression are texts of their own. Comments are not read.
 */
export function literalsOf(source: string): string[] {
  const literals: string[] = [];
  readLiterals(tokensOf(source)[Symbol.iterator](), literals);
  return literals;
}

/**
 * Reads tokens up to the end of the template literal they stand in (or to their end) and
 * returns the text of that literal. Every literal that ends on the way is added to `literals`.
 * The iterator is shared: a template literal inside an expression is read by a call of its own,
 * which leaves off where the outer one goes on.
 */
function readLiterals(tokens: IterableIterator<Token>, literals: string[]): string {
  let text = '';
  for (const token of tokens) {
    switch (token.type) {
      case 'string':
        literals.push(token.value);
        break;
      case 'template_open':
        // Also one that is never closed: it still holds text someone wrote.
        literals.push(readLiterals(tokens, literals));
        break;
      case 'template_text':
        text += token.value;
        break;
      case 'expression_close':
        text += EXPRESSION_PLACEHOLDER;
        break;
      case 'template_close':
        return text;
      case 'code':
      case 'comment':
      case 'expression_open':
        break;
    }
  }
  return text;
}
