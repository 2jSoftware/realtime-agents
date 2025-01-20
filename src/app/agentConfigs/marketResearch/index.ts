import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

interface MarketData {
  name: string;
  value: number;
  trend: "up" | "down" | "stable";
  change_percent: number;
  timestamp: string;
}

interface CompanyMetrics {
  name: string;
  market_cap: number;
  revenue: number;
  growth_rate: number;
  market_share: number;
}

interface MarketReport {
  market_size: number;
  growth_rate: number;
  key_players: CompanyMetrics[];
  trends: string[];
  opportunities: string[];
  threats: string[];
}

interface MarketSizeData {
  size: number;
  growth_rate: number;
}

interface MarketSizeTimeframe {
  current: MarketSizeData;
  forecast_2025: MarketSizeData;
  forecast_2030: MarketSizeData;
}

interface MarketSizeRegion {
  [key: string]: MarketSizeTimeframe;
}

interface MarketSizeDatabase {
  [key: string]: MarketSizeRegion;
}

interface TrendAspects {
  technology: string[];
  consumer_behavior: string[];
  regulation: string[];
  economics: string[];
  competition: string[];
  innovation: string[];
}

interface TrendDatabase {
  [key: string]: TrendAspects;
}

const marketResearcher: AgentConfig = {
  name: "marketResearcher",
  publicDescription: "Conducts market research using financial APIs and industry databases to provide market insights and competitive analysis.",
  instructions: `You are an expert market researcher specializing in industry analysis and market trends. Your role is to:

1. Research market sizes and growth rates
2. Analyze competitive landscapes
3. Identify market opportunities
4. Assess market threats
5. Track industry trends

When conducting market research:
- Start with understanding the user's specific needs
- Focus on actionable insights and data
- Consider multiple market segments
- Analyze historical trends and future projections
- Provide clear recommendations

Research areas:
- Market size and growth potential
- Competitive landscape
- Consumer behavior and preferences
- Technology trends and adoption
- Regulatory environment
- Economic factors`,
  tools: [
    {
      type: "function",
      name: "getMarketSize",
      description: "Get market size and growth data for a specific industry",
      parameters: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description: "Industry to analyze (e.g., 'cloud_computing', 'electric_vehicles', 'biotech', 'fintech')"
          },
          region: {
            type: "string",
            description: "Geographic region",
            enum: ["global", "north_america", "europe", "asia_pacific", "other"]
          },
          timeframe: {
            type: "string",
            description: "Time period for analysis",
            enum: ["current", "forecast_2025", "forecast_2030"]
          },
          segments: {
            type: "array",
            items: { type: "string" },
            description: "Specific market segments to analyze"
          }
        },
        required: ["industry"]
      }
    },
    {
      type: "function",
      name: "getCompetitorData",
      description: "Get competitive analysis data for major players in an industry",
      parameters: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description: "Industry to analyze"
          },
          metrics: {
            type: "array",
            description: "Metrics to include in analysis",
            items: {
              type: "string",
              enum: ["market_share", "revenue", "growth_rate", "market_cap", "product_portfolio", "geographic_presence", "innovation_score"]
            }
          },
          limit: {
            type: "number",
            description: "Number of top companies to include"
          },
          include_emerging: {
            type: "boolean",
            description: "Whether to include emerging players"
          }
        },
        required: ["industry"]
      }
    },
    {
      type: "function",
      name: "analyzeTrends",
      description: "Analyze market trends and patterns",
      parameters: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description: "Industry to analyze"
          },
          timeframe: {
            type: "string",
            enum: ["1_year", "5_year", "10_year"]
          },
          aspects: {
            type: "array",
            items: {
              type: "string",
              enum: ["technology", "consumer_behavior", "regulation", "economics", "competition", "innovation"]
            }
          },
          include_predictions: {
            type: "boolean",
            description: "Whether to include future predictions"
          }
        },
        required: ["industry"]
      }
    }
  ],
  toolLogic: {
    async getMarketSize({ industry, region = "global", timeframe = "current", segments = [] }: {
      industry: string;
      region?: string;
      timeframe?: string;
      segments?: string[];
    }) {
      const testData: MarketSizeDatabase = {
        cloud_computing: {
          global: {
            current: { size: 483.98, growth_rate: 14.1 },
            forecast_2025: { size: 832.1, growth_rate: 17.5 },
            forecast_2030: { size: 1554.94, growth_rate: 16.8 }
          }
        },
        electric_vehicles: {
          global: {
            current: { size: 384.65, growth_rate: 18.2 },
            forecast_2025: { size: 957.42, growth_rate: 21.7 },
            forecast_2030: { size: 1858.87, growth_rate: 20.5 }
          }
        },
        biotech: {
          global: {
            current: { size: 497.23, growth_rate: 15.8 },
            forecast_2025: { size: 892.45, growth_rate: 16.2 },
            forecast_2030: { size: 1723.67, growth_rate: 15.9 }
          }
        }
      };

      const marketData = testData[industry]?.[region as keyof MarketSizeRegion]?.[timeframe as keyof MarketSizeTimeframe];
      if (!marketData) {
        throw new Error("Market data not available for specified parameters");
      }

      return {
        industry,
        region,
        timeframe,
        segments,
        market_size_billion_usd: marketData.size,
        annual_growth_rate_percent: marketData.growth_rate,
        data_timestamp: new Date().toISOString()
      };
    },

    async getCompetitorData({ industry, metrics = ["market_share", "revenue"], limit = 5, include_emerging = false }: {
      industry: string;
      metrics?: string[];
      limit?: number;
      include_emerging?: boolean;
    }) {
      // Test data - would connect to competitive intelligence APIs in production
      const competitors = [
        {
          name: "Market Leader Corp",
          market_share: 35,
          revenue: 12.5,
          growth_rate: 18,
          market_cap: 85.2,
          product_portfolio: ["Product A", "Product B"],
          geographic_presence: ["NA", "EU", "APAC"],
          innovation_score: 85
        },
        {
          name: "Emerging Innovator",
          market_share: 8,
          revenue: 2.8,
          growth_rate: 45,
          market_cap: 12.4,
          product_portfolio: ["Product X"],
          geographic_presence: ["NA"],
          innovation_score: 92
        }
      ];

      return {
        industry,
        competitors: competitors
          .slice(0, limit)
          .map(comp => {
            const result: Record<string, any> = { name: comp.name };
            metrics.forEach(metric => {
              if (metric in comp) {
                result[metric] = comp[metric as keyof typeof comp];
              }
            });
            return result;
          }),
        analysis_date: new Date().toISOString(),
        include_emerging
      };
    },

    async analyzeTrends({ industry, timeframe = "5_year", aspects = ["technology", "consumer_behavior"], include_predictions = false }: {
      industry: string;
      timeframe?: string;
      aspects?: string[];
      include_predictions?: boolean;
    }) {
      const testTrends: TrendDatabase = {
        cloud_computing: {
          technology: ["Edge computing adoption", "Serverless architecture growth"],
          consumer_behavior: ["Remote work acceleration", "Digital transformation"],
          regulation: ["Data sovereignty laws", "GDPR compliance"],
          economics: ["Cost optimization", "Subscription models"],
          competition: ["Market consolidation", "New entrants"],
          innovation: ["AI integration", "Green computing"]
        }
      };

      const industryTrends = testTrends[industry];
      if (!industryTrends) {
        throw new Error("Trend data not available for specified industry");
      }

      const selectedTrends = aspects.reduce((acc: Record<string, string[]>, aspect: string) => {
        if (aspect in industryTrends) {
          acc[aspect] = industryTrends[aspect as keyof TrendAspects];
        }
        return acc;
      }, {});

      return {
        industry,
        timeframe,
        trends: selectedTrends,
        predictions: include_predictions ? {
          emerging_trends: ["Trend A", "Trend B"],
          market_shifts: ["Shift X", "Shift Y"]
        } : undefined,
        analysis_date: new Date().toISOString()
      };
    }
  }
};

const agents = injectTransferTools([marketResearcher]);

export default agents; 