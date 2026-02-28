import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { colors, fonts, spacing } from "../lib/theme";

// ── Inline rendering (bold, citations, plain text) ─────────

const renderInline = (
  text: string,
  baseStyle: object
): React.ReactNode[] => {
  const elements: React.ReactNode[] = [];
  // Match **bold**, [N] citations, or plain text
  const regex = /(\*\*[^*]+\*\*)|(\[\d+\])|([^*[\]]+)/g;
  let match: RegExpExecArray | null;
  let idx = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match[1]) {
      // Bold
      const bold = match[1].replace(/\*\*/g, "");
      elements.push(
        <Text key={idx} style={[baseStyle, s.bold]}>
          {bold}
        </Text>
      );
    } else if (match[2]) {
      // Citation badge [N]
      const num = match[2].slice(1, -1);
      elements.push(
        <View key={idx} style={s.citationBadge}>
          <Text style={s.citationText}>{num}</Text>
        </View>
      );
    } else if (match[3]) {
      elements.push(
        <Text key={idx} style={baseStyle}>
          {match[3]}
        </Text>
      );
    }
    idx++;
  }

  return elements.length > 0
    ? elements
    : [
        <Text key={0} style={baseStyle}>
          {text}
        </Text>,
      ];
};

// ── Block-level rendering ──────────────────────────────────

interface SimpleMarkdownProps {
  content: string;
  /** Base text style (defaults to assistant-style) */
  baseStyle?: object;
}

export function SimpleMarkdown({ content, baseStyle }: SimpleMarkdownProps) {
  const base = baseStyle ?? s.text;
  const lines = content.split("\n");

  const elements: React.ReactNode[] = [];

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (trimmed === "") return;

    // Headings: # ## ###
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const headingStyle =
        level === 1 ? s.h1 : level === 2 ? s.h2 : s.h3;
      elements.push(
        <Text key={idx} style={headingStyle}>
          {renderInline(headingMatch[2], headingStyle)}
        </Text>
      );
      return;
    }

    // Numbered list: 1. Item text
    const numberMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (numberMatch) {
      elements.push(
        <View key={idx} style={s.numberRow}>
          <Text style={s.numberLabel}>{numberMatch[1]}.</Text>
          <Text style={{ flex: 1 }}>{renderInline(numberMatch[2], base)}</Text>
        </View>
      );
      return;
    }

    // Bullet list: - Item text or * Item text
    const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      elements.push(
        <View key={idx} style={s.bulletRow}>
          <Text style={s.bulletDot}>{"\u2022"}</Text>
          <Text style={{ flex: 1 }}>{renderInline(bulletMatch[1], base)}</Text>
        </View>
      );
      return;
    }

    // Plain paragraph
    elements.push(
      <Text key={idx}>{renderInline(trimmed, base)}</Text>
    );
  });

  return <View style={s.container}>{elements}</View>;
}

const s = StyleSheet.create({
  container: { gap: 6 },
  text: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 20,
    color: colors.foreground,
  },
  bold: { fontFamily: fonts.sansBold },

  // Headings
  h1: {
    fontFamily: fonts.sansBold,
    fontSize: 18,
    lineHeight: 24,
    color: colors.foreground,
    marginTop: 4,
  },
  h2: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 16,
    lineHeight: 22,
    color: colors.foreground,
    marginTop: 4,
  },
  h3: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 14,
    lineHeight: 20,
    color: colors.stone[700],
    marginTop: 2,
  },

  // Lists
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: spacing.sm,
    marginVertical: 2,
  },
  bulletDot: {
    fontFamily: fonts.sans,
    fontSize: 14,
    marginRight: spacing.sm,
    marginTop: 2,
    color: colors.brand[500],
  },
  numberRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginLeft: spacing.sm,
    marginVertical: 2,
  },
  numberLabel: {
    fontFamily: fonts.sansSemiBold,
    fontSize: 12,
    marginRight: spacing.sm,
    minWidth: 20,
    color: colors.brand[600],
  },

  // Citations
  citationBadge: {
    backgroundColor: colors.brand[50],
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginHorizontal: 2,
  },
  citationText: {
    fontFamily: fonts.sansBold,
    fontSize: 10,
    color: colors.brand[600],
  },
});
