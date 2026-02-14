/**
 * Simple markdown-to-HTML renderer for trusted content (our own database).
 * Handles: headings, bold, italic, links, unordered lists, and paragraphs.
 *
 * NOTE: Only use with trusted content — uses dangerouslySetInnerHTML.
 */

function markdownToHtml(markdown: string): string {
  let html = markdown
    // Escape HTML entities first (basic XSS prevention even for trusted content)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split into lines for block-level processing
  const lines = html.split("\n");
  const output: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];

    // Headings: ## Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        output.push("</ul>");
        inList = false;
      }
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      const classes =
        level === 1
          ? "text-xl font-bold text-gray-900 mt-6 mb-3"
          : level === 2
            ? "text-lg font-semibold text-gray-900 mt-5 mb-2"
            : level === 3
              ? "text-base font-semibold text-gray-800 mt-4 mb-2"
              : "text-sm font-semibold text-gray-800 mt-3 mb-1";
      output.push(`<h${level} class="${classes}">${text}</h${level}>`);
      continue;
    }

    // Unordered list items: - item or * item
    const listMatch = line.match(/^[\-\*]\s+(.+)$/);
    if (listMatch) {
      if (!inList) {
        output.push('<ul class="list-disc list-inside space-y-1 my-2 text-gray-700">');
        inList = true;
      }
      output.push(`<li>${processInline(listMatch[1])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList) {
      output.push("</ul>");
      inList = false;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    output.push(`<p class="text-gray-700 leading-relaxed my-2">${processInline(line)}</p>`);
  }

  if (inList) {
    output.push("</ul>");
  }

  return output.join("\n");
}

/** Process inline markdown: **bold**, *italic*, [links](url) */
function processInline(text: string): string {
  return (
    text
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
      // Italic: *text*
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      // Links: [text](url)
      .replace(
        /\[([^\]]+)\]\(([^)]+)\)/g,
        '<a href="$2" class="text-brand-600 underline hover:text-brand-700" target="_blank" rel="noopener noreferrer">$1</a>'
      )
  );
}

interface MarkdownBodyProps {
  content: string;
}

export function MarkdownBody({ content }: MarkdownBodyProps) {
  const html = markdownToHtml(content);

  return (
    <div
      className="prose-kinpath max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
