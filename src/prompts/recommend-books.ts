export const recommendBooksPrompt = {
  name: 'recommend_books',
  description: "Get book recommendations based on the user's library",
  arguments: [
    {
      name: 'based_on',
      description: 'Reading list name or collection ID to base recommendations on',
      required: true,
    },
  ],
};

export function buildRecommendBooksMessages(basedOn: string) {
  return [
    {
      role: 'user' as const,
      content: {
        type: 'text' as const,
        text: `Based on the books in "${basedOn}" (use get_collection or list_reading_lists to fetch the books), recommend 5-10 books the reader would enjoy. For each recommendation:\n\n- Explain why it fits their reading taste\n- Mention which existing book(s) it connects to\n- Note the theme or style overlap\n\nAvoid obvious bestsellers unless they genuinely fit. Prioritize surprising, insightful picks.`,
      },
    },
  ];
}
