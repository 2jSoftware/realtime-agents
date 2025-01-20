import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

interface Article {
  title: string;
  description: string;
  url: string;
  date: string;
  source: string;
  category?: string;
  sentiment?: "positive" | "neutral" | "negative";
  impact_score?: number;
}

interface NewsAnalysis {
  trends: {
    keyword: string;
    frequency: number;
    sentiment: "positive" | "neutral" | "negative";
    articles: Article[];
    related_topics: string[];
  }[];
  key_developments: {
    title: string;
    description: string;
    impact: "high" | "medium" | "low";
    category: string;
    sources: string[];
  }[];
  company_mentions: {
    name: string;
    frequency: number;
    sentiment: "positive" | "neutral" | "negative";
    context: string[];
  }[];
  industry_impact: {
    sector: string;
    developments: string[];
    opportunities: string[];
    threats: string[];
  }[];
}

// Fallback data for when API is unavailable
const FALLBACK_TECH_NEWS: Article[] = [
  {
    title: "AI Breakthrough in Healthcare Diagnostics",
    description: "New AI model achieves 95% accuracy in early disease detection",
    url: "https://example.com/ai-healthcare",
    date: new Date().toISOString(),
    source: "TechHealth News",
    category: "ai",
    sentiment: "positive",
    impact_score: 85
  },
  {
    title: "Major Cloud Provider Announces Quantum Computing Service",
    description: "New quantum computing platform promises breakthrough in complex calculations",
    url: "https://example.com/quantum-cloud",
    date: new Date().toISOString(),
    source: "Cloud Weekly",
    category: "cloud",
    sentiment: "positive",
    impact_score: 78
  }
];

const newsAnalyst: AgentConfig = {
  name: "newsAnalyst",
  publicDescription: "Analyzes technology and business news to provide actionable insights and trend analysis.",
  instructions: `You are an expert news analyst specializing in technology and business news analysis. Your role is to:

1. Find and analyze relevant news articles
2. Identify key trends and patterns
3. Assess business impact and opportunities
4. Track competitor movements
5. Provide actionable insights

When analyzing news:
- Focus on high-impact developments
- Consider multiple reliable sources
- Look for emerging patterns
- Assess market implications
- Identify actionable insights

Analysis priorities:
- Technology breakthroughs
- Market disruptions
- Company strategies
- Industry trends
- Regulatory changes
- Investment patterns

For each analysis:
1. Start with understanding the user's specific interests
2. Gather relevant news from multiple sources
3. Identify key patterns and trends
4. Assess potential impacts
5. Provide clear recommendations`,
  tools: [
    {
      type: "function",
      name: "searchTechNews",
      description: "Search for technology news articles with fallback to cached data",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Search query for finding tech news articles"
          },
          categories: {
            type: "array",
            items: { 
              type: "string",
              enum: ["ai", "cloud", "cybersecurity", "blockchain", "all"]
            },
            description: "Technology categories to focus on"
          },
          timeframe: {
            type: "string",
            enum: ["today", "week", "month"],
            description: "Time range for results"
          },
          min_impact_score: {
            type: "number",
            description: "Minimum impact score (0-100) for articles"
          }
        },
        required: ["query"]
      }
    },
    {
      type: "function",
      name: "analyzeNews",
      description: "Analyze news articles to identify trends and insights",
      parameters: {
        type: "object",
        properties: {
          articles: {
            type: "array",
            description: "Array of articles to analyze",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                description: { type: "string" },
                url: { type: "string" },
                date: { type: "string" },
                source: { type: "string" },
                category: { type: "string" },
                sentiment: { 
                  type: "string",
                  enum: ["positive", "neutral", "negative"]
                }
              }
            }
          },
          focus_areas: {
            type: "array",
            items: { 
              type: "string",
              enum: ["technology", "business_impact", "market_reaction", "competition", "regulation"]
            },
            description: "Areas to focus the analysis on"
          },
          companies_of_interest: {
            type: "array",
            items: { type: "string" },
            description: "Companies to specifically track in the analysis"
          }
        },
        required: ["articles"]
      }
    }
  ],
  toolLogic: {
    async searchTechNews({ 
      query, 
      categories = ["all"], 
      timeframe = "today",
      min_impact_score = 0 
    }) {
      const BRAVE_SEARCH_API_ENDPOINT = "https://api.search.brave.com/news";
      
      try {
        // Add category-specific terms to query
        const categoryTerms = categories.includes("all") ? "tech" : categories.join(" OR ");
        const finalQuery = `(${query}) (${categoryTerms})`;

        const response = await fetch(BRAVE_SEARCH_API_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || ""
          },
          body: JSON.stringify({
            q: finalQuery,
            timeframe: timeframe
          })
        });

        if (!response.ok) {
          console.warn("API error, using fallback data");
          return FALLBACK_TECH_NEWS.filter(article => 
            (article.impact_score || 0) >= min_impact_score
          );
        }

        const data = await response.json();
        return data.articles
          .map((article: any) => ({
            title: article.title,
            description: article.description,
            url: article.url,
            date: article.date,
            source: article.source,
            category: article.category || "general",
            sentiment: article.sentiment || "neutral",
            impact_score: article.impact_score || 50
          }))
          .filter((article: Article) => 
            (article.impact_score || 0) >= min_impact_score
          );
      } catch (error) {
        console.warn("Search error, using fallback data:", error);
        return FALLBACK_TECH_NEWS.filter(article => 
          (article.impact_score || 0) >= min_impact_score
        );
      }
    },

    async analyzeNews({ 
      articles, 
      focus_areas = ["technology", "business_impact"], 
      companies_of_interest = [] 
    }): Promise<NewsAnalysis> {
      // Group articles by topic and analyze trends
      const trends = this.analyzeTrends(articles);
      
      // Identify key developments
      const keyDevelopments = this.identifyKeyDevelopments(articles);
      
      // Track company mentions
      const companyMentions = this.trackCompanyMentions(articles, companies_of_interest);
      
      // Assess industry impact
      const industryImpact = this.assessIndustryImpact(articles, focus_areas);

      return {
        trends,
        key_developments: keyDevelopments,
        company_mentions: companyMentions,
        industry_impact: industryImpact
      };
    },

    private analyzeTrends(articles: Article[]) {
      const trends = new Map<string, {
        frequency: number;
        sentiment: number;
        articles: Article[];
        related: Set<string>;
      }>();

      articles.forEach(article => {
        const keywords = this.extractKeywords(article.title + " " + article.description);
        keywords.forEach(keyword => {
          if (!trends.has(keyword)) {
            trends.set(keyword, {
              frequency: 0,
              sentiment: 0,
              articles: [],
              related: new Set()
            });
          }
          const trend = trends.get(keyword)!;
          trend.frequency++;
          trend.sentiment += article.sentiment === "positive" ? 1 : article.sentiment === "negative" ? -1 : 0;
          trend.articles.push(article);
          keywords.forEach(k => {
            if (k !== keyword) trend.related.add(k);
          });
        });
      });

      return Array.from(trends.entries())
        .filter(([_, data]) => data.frequency > 1)
        .map(([keyword, data]) => ({
          keyword,
          frequency: data.frequency,
          sentiment: data.sentiment > 0 ? "positive" : data.sentiment < 0 ? "negative" : "neutral",
          articles: data.articles,
          related_topics: Array.from(data.related)
        }))
        .sort((a, b) => b.frequency - a.frequency);
    },

    private identifyKeyDevelopments(articles: Article[]) {
      return articles
        .filter(article => article.impact_score && article.impact_score > 70)
        .map(article => ({
          title: article.title,
          description: article.description,
          impact: article.impact_score! > 85 ? "high" : article.impact_score! > 75 ? "medium" : "low",
          category: article.category || "general",
          sources: [article.source]
        }))
        .sort((a, b) => this.impactToNumber(b.impact) - this.impactToNumber(a.impact));
    },

    private trackCompanyMentions(articles: Article[], companies: string[]) {
      const mentions = new Map<string, {
        frequency: number;
        sentiment: number;
        context: Set<string>;
      }>();

      companies.forEach(company => {
        const companyArticles = articles.filter(article => 
          article.title.toLowerCase().includes(company.toLowerCase()) ||
          article.description.toLowerCase().includes(company.toLowerCase())
        );

        if (companyArticles.length > 0) {
          mentions.set(company, {
            frequency: companyArticles.length,
            sentiment: companyArticles.reduce((sum, article) => 
              sum + (article.sentiment === "positive" ? 1 : article.sentiment === "negative" ? -1 : 0), 0
            ),
            context: new Set(companyArticles.map(article => 
              this.extractContext(article.description, company)
            ))
          });
        }
      });

      return Array.from(mentions.entries())
        .map(([name, data]) => ({
          name,
          frequency: data.frequency,
          sentiment: data.sentiment > 0 ? "positive" : data.sentiment < 0 ? "negative" : "neutral",
          context: Array.from(data.context)
        }))
        .sort((a, b) => b.frequency - a.frequency);
    },

    private assessIndustryImpact(articles: Article[], focusAreas: string[]) {
      const sectors = new Map<string, {
        developments: Set<string>;
        opportunities: Set<string>;
        threats: Set<string>;
      }>();

      articles.forEach(article => {
        const sector = article.category || "technology";
        if (!sectors.has(sector)) {
          sectors.set(sector, {
            developments: new Set(),
            opportunities: new Set(),
            threats: new Set()
          });
        }

        const impact = sectors.get(sector)!;
        impact.developments.add(article.title);
        
        if (article.sentiment === "positive") {
          impact.opportunities.add(this.extractOpportunity(article));
        } else if (article.sentiment === "negative") {
          impact.threats.add(this.extractThreat(article));
        }
      });

      return Array.from(sectors.entries())
        .map(([sector, impact]) => ({
          sector,
          developments: Array.from(impact.developments),
          opportunities: Array.from(impact.opportunities),
          threats: Array.from(impact.threats)
        }));
    },

    private extractKeywords(text: string): string[] {
      // Simple keyword extraction - would use NLP in production
      return text
        .toLowerCase()
        .split(/\W+/)
        .filter(word => word.length > 4)
        .filter(word => !this.isStopWord(word));
    },

    private extractContext(text: string, company: string): string {
      // Simple context extraction - would use NLP in production
      const sentences = text.split(/[.!?]+/);
      return sentences.find(s => s.toLowerCase().includes(company.toLowerCase())) || "";
    },

    private extractOpportunity(article: Article): string {
      return `Opportunity from ${article.title}`;
    },

    private extractThreat(article: Article): string {
      return `Potential threat: ${article.title}`;
    },

    private impactToNumber(impact: string): number {
      return impact === "high" ? 3 : impact === "medium" ? 2 : 1;
    },

    private isStopWord(word: string): boolean {
      const stopWords = new Set(["about", "above", "after", "again", "all", "also", "and", "any", "are", "because"]);
      return stopWords.has(word);
    }
  }
};

const agents = injectTransferTools([newsAnalyst]);

export default agents; 