export const analyzeShelfPrompt = {
  name: 'analyze_shelf',
  description: 'Analyze a collection for themes, reading patterns, and personality',
  arguments: [
    {
      name: 'collection_id',
      description: 'The collection to analyze',
      required: true,
    },
  ],
};

export function buildAnalyzeShelfMessages(collectionId: string) {
  return [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Please analyze the book collection with ID "${collectionId}". Use the get_collection tool to fetch it, then provide:\n\n- Dominant themes and genres\n- Reading personality indicators\n- Notable patterns in book selection\n- Suggested reader archetype\n\nBe specific about which books support your conclusions.`,
      },
    },
  ];
}
