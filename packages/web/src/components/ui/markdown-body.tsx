/**
 * Simple markdown-to-HTML renderer for trusted content (our own database).
 * Handles: headings, bold, italic, links, ordered/unordered lists, inline code,
 * and paragraphs.
 *
 * NOTE: Only use with trusted content — uses dangerouslySetInnerHTML.
 */

function markdownToHtml(markdown: string, compact = false): string {
  let html = markdown
    // Escape HTML entities first (basic XSS prevention even for trusted content)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Split into lines for block-level processing
  const lines = html.split("\n");
  const output: string[] = [];
  let inList: "ul" | "ol" | false = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Headings: ## Heading
    const headingMatch = line.match(/^(#{1,4})\s+(.+)$/);
    if (headingMatch) {
      if (inList) {
        output.push(`</${inList}>`);
        inList = false;
      }
      const level = headingMatch[1].length;
      const text = processInline(headingMatch[2]);
      const classes = compact
        ? level <= 2
          ? "text-sm font-semibold text-stone-900 mt-3 mb-1"
          : "text-sm font-semibold text-stone-800 mt-2 mb-1"
        : level === 1
          ? "text-xl font-bold text-stone-900 mt-6 mb-3"
          : level === 2
            ? "text-lg font-semibold text-stone-900 mt-5 mb-2"
            : level === 3
              ? "text-base font-semibold text-stone-800 mt-4 mb-2"
              : "text-sm font-semibold text-stone-800 mt-3 mb-1";
      output.push(`<h${level} class="${classes}">${text}</h${level}>`);
      continue;
    }

    // Unordered list items: - item or * item
    const ulMatch = line.match(/^[\-\*]\s+(.+)$/);
    if (ulMatch) {
      if (inList && inList !== "ul") {
        output.push(`</${inList}>`);
        inList = false;
      }
      if (!inList) {
        const my = compact ? "my-1" : "my-2";
        output.push(`<ul class="list-disc list-inside space-y-1 ${my} text-stone-700">`);
        inList = "ul";
      }
      output.push(`<li>${processInline(ulMatch[1])}</li>`);
      continue;
    }

    // Ordered list items: 1. item
    const olMatch = line.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList && inList !== "ol") {
        output.push(`</${inList}>`);
        inList = false;
      }
      if (!inList) {
        const my = compact ? "my-1" : "my-2";
        output.push(`<ol class="list-decimal list-inside space-y-1 ${my} text-stone-700">`);
        inList = "ol";
      }
      output.push(`<li>${processInline(olMatch[1])}</li>`);
      continue;
    }

    // Close list if we hit a non-list line
    if (inList) {
      output.push(`</${inList}>`);
      inList = false;
    }

    // Empty line = paragraph break
    if (line.trim() === "") {
      continue;
    }

    // Regular paragraph
    const my = compact ? "my-1" : "my-2";
    output.push(`<p class="text-stone-700 leading-relaxed ${my}">${processInline(line)}</p>`);
  }

  if (inList) {
    output.push(`</${inList}>`);
  }

  return output.join("\n");
}

/** Process inline markdown: **bold**, *italic*, `code`, [links](url) */
function processInline(text: string): string {
  return (
    text
      // Inline code: `code`
      .replace(
        /`([^`]+)`/g,
        '<code class="rounded bg-stone-100 px-1 py-0.5 text-xs font-mono text-stone-800">$1</code>'
      )
      // Bold: **text**
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-stone-900">$1</strong>')
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
  compact?: boolean;
}

export function MarkdownBody({ content, compact = false }: MarkdownBodyProps) {
  const html = markdownToHtml(content, compact);

  return (
    <div
      className="prose-kinpath max-w-none"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
