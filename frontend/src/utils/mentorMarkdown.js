const ESCAPABLE_MARKDOWN_CHARACTERS = new Set("\\`*_{}[]()#+.!>|~-".split(""));

function unescapeMarkdownLine(line, inlineCode) {
  let result = "";

  for (let index = 0; index < line.length; index += 1) {
    const current = line[index];
    const next = line[index + 1];

    if (current === "`" || (current === "\\" && next === "`")) {
      let delimiterLength = 0;
      let cursor = index;

      while (cursor < line.length) {
        if (line[cursor] === "`") {
          delimiterLength += 1;
          cursor += 1;
        } else if (line[cursor] === "\\" && line[cursor + 1] === "`") {
          delimiterLength += 1;
          cursor += 2;
        } else {
          break;
        }
      }

      if (inlineCode.length === 0) {
        inlineCode.length = delimiterLength;
        result += "`".repeat(delimiterLength);
      } else if (inlineCode.length === delimiterLength) {
        inlineCode.length = 0;
        result += "`".repeat(delimiterLength);
      } else {
        result += line.slice(index, cursor);
      }

      index = cursor - 1;
      continue;
    }

    if (inlineCode.length > 0) {
      result += current;
      continue;
    }

    if (current === "\\" && ESCAPABLE_MARKDOWN_CHARACTERS.has(next)) {
      result += next;
      index += 1;
    } else {
      result += current;
    }
  }

  return result;
}

function getFenceMarker(line) {
  return line.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
}

export function normalizeMentorMarkdown(markdown) {
  if (typeof markdown !== "string") {
    return "";
  }

  let activeFence = null;
  const inlineCode = { length: 0 };

  return markdown.split(/\r?\n/).map((line) => {
    if (activeFence) {
      const normalizedFenceLine = unescapeMarkdownLine(line, { length: 0 });
      const closingFence = normalizedFenceLine.match(/^ {0,3}(`+|~+)\s*$/);
      if (closingFence
        && closingFence[1][0] === activeFence.character
        && closingFence[1].length >= activeFence.length) {
        activeFence = null;
        inlineCode.length = 0;
        return normalizedFenceLine;
      }

      return line;
    }

    if (inlineCode.length > 0) {
      return unescapeMarkdownLine(line, inlineCode);
    }

    const normalizedLine = unescapeMarkdownLine(line, inlineCode);
    const openingFence = getFenceMarker(normalizedLine);
    if (openingFence) {
      inlineCode.length = 0;
      activeFence = {
        character: openingFence[1][0],
        length: openingFence[1].length,
      };
    }

    return normalizedLine;
  }).join("\n");
}
