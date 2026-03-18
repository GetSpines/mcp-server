export const compareCollectionsPrompt = {
  name: 'compare_collections',
  description: 'Compare two collections for similarities and differences',
  arguments: [
    {
      name: 'collection_a',
      description: 'First collection ID',
      required: true,
    },
    {
      name: 'collection_b',
      description: 'Second collection ID',
      required: true,
    },
  ],
};

export function buildCompareCollectionsMessages(collectionA: string, collectionB: string) {
  return [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Compare these two book collections by fetching them with get_collection:\n\n- Collection A: ${collectionA}\n- Collection B: ${collectionB}\n\nAnalyze:\n- Books in common (if any)\n- Theme overlap and divergence\n- What each collection reveals about the reader\n- How the two readers might complement each other's taste\n\nBe specific about individual books.`,
      },
    },
  ];
}
