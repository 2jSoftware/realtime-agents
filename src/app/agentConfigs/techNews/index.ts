import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

interface NewsArticle {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  source: string;
  category: string;
  sentiment?: "positive" | "neutral" | "negative";
}

interface TrendingTopic {
  keyword: string;
  frequency: number;
  sentiment: "positive" | "neutral" | "negative";
  relatedArticles: string[];
}

interface NewsAnalysis {
  topStories: NewsArticle[];
  trendingTopics: TrendingTopic[];
  timeframe: string;
  analysisDate: string;
}

const techNewsAnalyst: AgentConfig = {
  name: "techNewsAnalyst",
  publicDescription: "Tracks and analyzes the latest technology news, trends, and developments across the industry.",
  instructions: `You are an expert technology news analyst specializing in identifying and analyzing important tech developments. Your role is to:

1. Track breaking tech news and developments
2. Identify emerging technology trends
3. Analyze news sentiment and impact
4. Monitor industry announcements
5. Provide context and insights

When analyzing tech news:
- Focus on high-impact developments
- Track multiple reliable sources
- Identify emerging patterns
- Assess market implications
- Consider competitive impact`,
  tools: [
    {
      type: "function",
      name: "getLatestNews",
      description: "Fetch the latest technology news articles",
      parameters: {
        type: "object",
        properties: {
          category: {
            type: "string",
            description: "Technology category to focus on",
            enum: ["ai", "cloud", "cybersecurity", "blockchain", "all"]
          },
          timeframe: {
            type: "string",
            description: "Time period for news articles",
            enum: ["today", "week", "month"]
          },
          limit: {
            type: "number",
            description: "Number of articles to fetch"
          }
        },
        required: ["category"]
      }
    },
    {
      type: "function",
      name: "analyzeTrends",
      description: "Analyze trending topics in tech news",
      parameters: {
        type: "object",
        properties: {
          timeframe: {
            type: "string",
            description: "Time period for trend analysis",
            enum: ["day", "week", "month"]
          },
          categories: {
            type: "array",
            items: { type: "string" },
            description: "Technology categories to analyze"
          }
        },
        required: ["timeframe"]
      }
    }
  ],
  toolLogic: {
    async getLatestNews({ category = "all", timeframe = "today", limit = 5 }: { 
      category: string; 
      timeframe?: string; 
      limit?: number 
    }) {
      // Test data - would connect to news APIs in production
      const newsData: Record<string, NewsArticle[]> = {
        ai: [
          {
            title: "OpenAI Announces GPT-5 Development Progress",
            description: "Latest developments in large language model capabilities and testing",
            url: "https://tech-news.com/openai-gpt5",
            publishedAt: new Date().toISOString(),
            source: "TechNews",
            category: "ai",
            sentiment: "positive"
          },
          {
            title: "Google DeepMind Achieves Breakthrough in Protein Folding",
            description: "New AI model predicts protein structures with unprecedented accuracy",
            url: "https://tech-news.com/deepmind-proteins",
            publishedAt: new Date().toISOString(),
            source: "AI Weekly",
            category: "ai",
            sentiment: "positive"
          }
        ],
        cloud: [
          {
            title: "AWS Launches New Quantum Computing Service",
            description: "Amazon Web Services expands quantum computing capabilities",
            url: "https://tech-news.com/aws-quantum",
            publishedAt: new Date().toISOString(),
            source: "Cloud Tech",
            category: "cloud",
            sentiment: "positive"
          }
        ]
      };

      const articles = category === "all" 
        ? Object.values(newsData).flat()
        : newsData[category] || [];

      return articles.slice(0, limit);
    },

    async analyzeTrends({ timeframe = "week", categories = ["ai", "cloud", "cybersecurity"] }: { timeframe: string; categories?: string[] }) {
      // Test data - would use real trend analysis in production
      const trendData: Record<string, TrendingTopic[]> = {
        ai: [
          {
            keyword: "large language models",
            frequency: 85,
            sentiment: "positive",
            relatedArticles: ["article1", "article2"]
          },
          {
            keyword: "AI regulation",
            frequency: 72,
            sentiment: "neutral",
            relatedArticles: ["article3", "article4"]
          }
        ],
        cloud: [
          {
            keyword: "serverless computing",
            frequency: 64,
            sentiment: "positive",
            relatedArticles: ["article5", "article6"]
          }
        ]
      };

      const trends = categories
        .map((category: string) => trendData[category] || [])
        .flat()
        .sort((a: TrendingTopic, b: TrendingTopic) => b.frequency - a.frequency);

      return {
        topStories: await this.getLatestNews({ category: "all", limit: 3, timeframe }),
        trendingTopics: trends,
        timeframe,
        analysisDate: new Date().toISOString()
      };
    }
  }
};

const agents = injectTransferTools([techNewsAnalyst]);

export default agents; 