import axios from 'axios';

interface SentimentResult {
    text: string;
    sentiment: 'positive' | 'negative' | 'neutral';
    score: number;
    confidence: number;
}

export class SentimentAnalyzer {
    private readonly HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY;
    private readonly MODEL_URL = 'https://api-inference.huggingface.co/models/indobenchmark/indobert-lite-base';

    async analyzeSentiment(text: string): Promise<SentimentResult> {
        try {
            const response = await axios.post(
                this.MODEL_URL,
                { inputs: text },
                { headers: { Authorization: `Bearer ${this.HUGGINGFACE_API_KEY}` } }
            );

            const result = response.data[0];
            const sentiment = this.classifySentiment(result);
            return {
                text,
                sentiment: sentiment.label,
                score: sentiment.score,
                confidence: sentiment.score,
            };
        } catch (error) {
            console.error('Error analyzing sentiment:', error);
            throw error;
        }
    }

    private classifySentiment(result: any) {
        const scores = result.reduce((acc: any, item: any) => {
            acc[item.label] = item.score;
            return acc;
        }, {});
        const maxScore = Math.max(...Object.values(scores) as number[]);
        const sentiment = Object.keys(scores).find(key => scores[key] === maxScore);
        return { label: sentiment || 'neutral', score: maxScore };
    }

    async analyzeMultiple(texts: string[]): Promise<SentimentResult[]> {
        return Promise.all(texts.map(text => this.analyzeSentiment(text)));
    }

    async analyzeBulkWithKeywords(texts: string[], keywords: string[]): Promise<SentimentResult[]> {
        const filteredTexts = texts.filter(text => keywords.some(keyword => text.toLowerCase().includes(keyword.toLowerCase())));
        return this.analyzeMultiple(filteredTexts);
    }
}