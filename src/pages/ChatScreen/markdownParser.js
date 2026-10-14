const INLINE_MARKDOWN = /(\*\*|__)(.+?)\1|(\*|_)(.+?)\3|`([^`]+)`|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;

export function parseMarkdownInline(value) {
  const source = String(value ?? '');
  const segments = [];
  let cursor = 0;
  let match;

  while ((match = INLINE_MARKDOWN.exec(source)) !== null) {
    if (match.index > cursor) segments.push({ type: 'text', value: source.slice(cursor, match.index) });
    if (match[2]) segments.push({ type: 'bold', value: match[2] });
    else if (match[4]) segments.push({ type: 'italic', value: match[4] });
    else if (match[5]) segments.push({ type: 'code', value: match[5] });
    else segments.push({ type: 'link', value: match[6], url: match[7] });
    cursor = match.index + match[0].length;
  }

  if (cursor < source.length) segments.push({ type: 'text', value: source.slice(cursor) });
  return segments.length ? segments : [{ type: 'text', value: source }];
}

export function parseMarkdownBlocks(value) {
  const lines = String(value ?? '').replace(/\r\n?/g, '\n').split('\n');
  const blocks = [];
  let paragraph = [];
  let code = null;

  const flushParagraph = () => {
    if (paragraph.length) blocks.push({ type: 'paragraph', text: paragraph.join('\n') });
    paragraph = [];
  };

  for (const line of lines) {
    if (code) {
      if (/^\s*```/.test(line)) {
        blocks.push({ type: 'codeBlock', text: code.join('\n') });
        code = null;
      } else {
        code.push(line);
      }
      continue;
    }

    if (/^\s*```/.test(line)) {
      flushParagraph();
      code = [];
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,6})\s+(.+)$/);
    if (heading) {
      flushParagraph();
      blocks.push({ type: 'heading', level: heading[1].length, text: heading[2].trim() });
      continue;
    }

    const unordered = line.match(/^\s{0,3}[-*+]\s+(.+)$/);
    if (unordered) {
      flushParagraph();
      blocks.push({ type: 'listItem', ordered: false, text: unordered[1].trim() });
      continue;
    }

    const ordered = line.match(/^\s{0,3}\d+[.)]\s+(.+)$/);
    if (ordered) {
      flushParagraph();
      blocks.push({ type: 'listItem', ordered: true, text: ordered[1].trim() });
      continue;
    }

    paragraph.push(line);
  }

  if (code) blocks.push({ type: 'codeBlock', text: code.join('\n') });
  flushParagraph();
  return blocks;
}
