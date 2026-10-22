export type RichTextSegment =
  | { id: string; kind: 'paragraph'; text: string }
  | { id: string; kind: 'code'; language: string; text: string };

const markdownLabelPattern =
  /^\s*(?:[-*]\s*)?(?:>\s*)?(?:\*\*)?(?:题目|答案|参考答案|答案要点|参考答案要点|解析|评分标准)(?:\*\*)?\s*[：:]\s*/;

const questionNoPattern = /^\s*(?:\*\*)?[^*（）()]+(?:\*\*)?\s*[（(][^）)]*[）)]\s*$/;

export const normalizeQuestionText = (value: null | string | undefined) => {
  if (!value) {
    return '';
  }

  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .split('\n')
    .map((line) =>
      line
        .replace(markdownLabelPattern, '')
        .replace(/^>\s?/, '')
        .replace(/^\s*#{1,6}\s+/, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .trim(),
    )
    .filter((line) => line && line !== '---' && !questionNoPattern.test(line))
    .join('\n')
    .trim();
};

export const toQuestionRichTextSegments = (value: null | string | undefined): RichTextSegment[] => {
  const normalized = normalizeQuestionText(value);
  if (!normalized) {
    return [];
  }

  const segments: RichTextSegment[] = [];
  const paragraphBuffer: string[] = [];
  const codeBuffer: string[] = [];
  let codeLanguage = '';
  let inCodeBlock = false;

  const flushParagraph = () => {
    const text = paragraphBuffer.join('\n').trim();
    paragraphBuffer.length = 0;
    if (text) {
      segments.push({ id: `p-${segments.length}`, kind: 'paragraph', text });
    }
  };

  const flushCode = () => {
    const text = codeBuffer.join('\n').trim();
    codeBuffer.length = 0;
    if (text) {
      segments.push({
        id: `code-${segments.length}`,
        kind: 'code',
        language: codeLanguage || 'text',
        text,
      });
    }
    codeLanguage = '';
  };

  normalized.split('\n').forEach((line) => {
    const fence = line.match(/^\s*```([\w-]*)\s*$/);
    if (fence) {
      if (inCodeBlock) {
        flushCode();
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLanguage = fence[1] || 'text';
      }
      return;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      return;
    }

    paragraphBuffer.push(line);
  });

  if (inCodeBlock) {
    flushCode();
  }
  flushParagraph();

  return segments;
};
