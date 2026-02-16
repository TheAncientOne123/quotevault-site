export interface QuoteCard {
  id: string;
  createdAt: string;
  title: string;
  content: string;
  author: string | null;
  language: string | null;
  hashtags: string[];
}

export interface QuotesResponse {
  items: QuoteCard[];
  nextCursor?: string;
}
