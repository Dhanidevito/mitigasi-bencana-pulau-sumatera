import axios from 'axios';
import natural from 'natural';

export interface SentimentResult {
  text: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number;
  confidence: number;
}

export class SentimentAnalyzer {
  private tokenizer: natural.SentenceTokenizer;
  private classifier: any;

  constructor() {
    this.tokenizer = new natural.SentenceTokenizer();
  }

  public async analyzeSentiment(text: string): Promise<SentimentResult> {
    const tokens = text.split(' ');
    const sentiment = this.classifyText(tokens);
    const score = this.calculateScore(tokens);
    return { text, sentiment, score, confidence: Math.abs(score) };
  }

  private classifyText(tokens: string[]): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['baik', 'bagus', 'sempurna', 'luar biasa', 'hebat', 'aman', 'senang'];
    const negativeWords = ['buruk', 'jelek', 'bahaya', 'bencana', 'gempa', 'banjir', 'longsor', 'khawatir', 'takut'];
    let positiveCount = 0;
    let negativeCount = 0;

    tokens.forEach(token => {
      if (positiveWords.includes(token.toLowerCase())) positiveCount++;
      if (negativeWords.includes(token.toLowerCase())) negativeCount++;
    });

    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  private calculateScore(tokens: string[]): number {
    const negativeWords = ['buruk', 'jelek', 'bahaya', 'bencana', 'gempa', 'banjir', 'longsor', 'khawatir', 'takut'];
    const positiveWords = ['baik', 'bagus', 'sempurna', 'luar biasa', 'hebat', 'aman', 'senang'];
    let score = 0;

    tokens.forEach(token => {
      if (positiveWords.includes(token.toLowerCase())) score += 0.1;
      if (negativeWords.includes(token.toLowerCase())) score -= 0.1;
    });

    return Math.max(-1, Math.min(1, score));
  }
}