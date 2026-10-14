import React from 'react';
import { Linking, Text, View } from 'react-native';
import { COLORS } from '../../constants/colors';
import { parseMarkdownBlocks, parseMarkdownInline } from './markdownParser';

function openSafeLink(url) {
  if (!/^https?:\/\//i.test(url)) return;
  Linking.openURL(url).catch(() => {});
}

function InlineContent({ value }) {
  return parseMarkdownInline(value).map((segment, index) => {
    const key = `${segment.type}-${index}`;
    if (segment.type === 'link') {
      return (
        <Text
          key={key}
          accessibilityRole="link"
          style={styles.link}
          onPress={() => openSafeLink(segment.url)}
        >
          {segment.value}
        </Text>
      );
    }

    return (
      <Text
        key={key}
        style={segment.type === 'bold'
          ? styles.bold
          : segment.type === 'italic'
            ? styles.italic
            : segment.type === 'code'
              ? styles.inlineCode
              : null}
      >
        {segment.value}
      </Text>
    );
  });
}

export default function MarkdownMessage({ value }) {
  const blocks = parseMarkdownBlocks(value);

  return (
    <View style={styles.container}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        if (block.type === 'heading') {
          return <Text key={key} style={[styles.paragraph, styles.heading, { fontSize: Math.max(15, 20 - block.level) }]}><InlineContent value={block.text} /></Text>;
        }
        if (block.type === 'listItem') {
          return (
            <View key={key} style={styles.listRow}>
              <Text style={styles.listMarker}>{block.ordered ? `${index + 1}.` : '•'}</Text>
              <Text style={[styles.paragraph, styles.listText]}><InlineContent value={block.text} /></Text>
            </View>
          );
        }
        if (block.type === 'codeBlock') {
          return <Text key={key} selectable style={styles.codeBlock}>{block.text}</Text>;
        }
        return <Text key={key} style={styles.paragraph}><InlineContent value={block.text} /></Text>;
      })}
    </View>
  );
}

const styles = {
  container: {
    width: '100%',
  },
  paragraph: {
    color: COLORS.chatDestinatarioMensagemTexto,
    fontSize: 15,
    lineHeight: 21,
  },
  heading: {
    marginBottom: 5,
    fontWeight: '700',
  },
  bold: {
    fontWeight: '700',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    paddingHorizontal: 3,
    color: COLORS.chatDestinatarioNome,
    fontFamily: 'monospace',
  },
  link: {
    color: COLORS.chatDestinatarioNome,
    textDecorationLine: 'underline',
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  listMarker: {
    width: 20,
    color: COLORS.chatDestinatarioNome,
    fontSize: 15,
    lineHeight: 21,
  },
  listText: {
    flex: 1,
  },
  codeBlock: {
    marginVertical: 3,
    padding: 8,
    color: COLORS.chatDestinatarioMensagemTexto,
    backgroundColor: COLORS.chatFundo,
    fontFamily: 'monospace',
    fontSize: 13,
    lineHeight: 18,
  },
};
