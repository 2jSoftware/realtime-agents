import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

interface CompanyProfile {
  name: string;
  website: string;
  description: string;
  founded: string;
  headquarters: string;
  employees: number;
  revenue?: number;
  market_cap?: number;
}

interface ProductInfo {
  name: string;
  description: string;
  features: string[];
  pricing?: {
    model: string;
    details: string;
  };
  target_market: string[];
}

interface CompetitiveAdvantage {
  type: "technology" | "market_position" | "brand" | "pricing" | "distribution" | "other";
  description: string;
  strength: "strong" | "moderate" | "weak";
  sustainability: "high" | "medium" | "low";
}

interface MarketPosition {
  company: string;
  market_share: number;
  growth_rate: number;
  strengths: string[];
  weaknesses: string[];
  target_segments: string[];
}

const competitorAnalyst: AgentConfig = {
  name: "competitorAnalyst",
  publicDescription: "Analyzes competitor strategies, products, and market positions using various data sources and APIs.",
  instructions: `You are an expert competitor analyst specializing in competitive intelligence and market positioning. Your role is to:

1. Track competitor activities and strategies
2. Analyze product offerings and features
3. Monitor market positioning
4. Identify competitive advantages
5. Assess strengths and weaknesses

When analyzing competitors:
- Focus on actionable insights
- Track product developments
- Monitor pricing strategies
- Analyze marketing approaches
- Identify market opportunities`,
  tools: [
    {
      type: "function",
      name: "getCompanyProfile",
      description: "Get detailed company information and key metrics",
      parameters: {
        type: "object",
        properties: {
          company_name: {
            type: "string",
            description: "Name of the company to analyze"
          },
          include_financials: {
            type: "boolean",
            description: "Whether to include financial metrics"
          }
        },
        required: ["company_name"]
      }
    },
    {
      type: "function",
      name: "analyzeProducts",
      description: "Analyze competitor products and features",
      parameters: {
        type: "object",
        properties: {
          company_name: {
            type: "string",
            description: "Company whose products to analyze"
          },
          product_type: {
            type: "string",
            description: "Type of product to analyze"
          },
          include_pricing: {
            type: "boolean",
            description: "Whether to include pricing information"
          }
        },
        required: ["company_name"]
      }
    },
    {
      type: "function",
      name: "compareCompetitors",
      description: "Compare multiple competitors in a specific market",
      parameters: {
        type: "object",
        properties: {
          companies: {
            type: "array",
            items: { type: "string" },
            description: "List of companies to compare"
          },
          market_segment: {
            type: "string",
            description: "Market segment to analyze"
          },
          comparison_aspects: {
            type: "array",
            items: { type: "string" },
            description: "Aspects to compare (e.g., 'pricing', 'features', 'market_share')"
          }
        },
        required: ["companies"]
      }
    }
  ],
  toolLogic: {
    async getCompanyProfile({ company_name, include_financials = false }) {
      // Test data - would connect to company information APIs in production
      const companyProfiles: Record<string, CompanyProfile> = {
        "microsoft": {
          name: "Microsoft Corporation",
          website: "microsoft.com",
          description: "Global technology company specializing in software, cloud computing, and hardware",
          founded: "1975",
          headquarters: "Redmond, Washington, USA",
          employees: 181000,
          revenue: 198.3,
          market_cap: 2780
        },
        "apple": {
          name: "Apple Inc.",
          website: "apple.com",
          description: "Consumer electronics and software company",
          founded: "1976",
          headquarters: "Cupertino, California, USA",
          employees: 164000,
          revenue: 394.3,
          market_cap: 2940
        }
      };

      const profile = companyProfiles[company_name.toLowerCase()];
      if (!profile) {
        throw new Error("Company profile not found");
      }

      if (!include_financials) {
        const { revenue, market_cap, ...nonFinancialData } = profile;
        return nonFinancialData;
      }

      return profile;
    },

    async analyzeProducts({ company_name, product_type = "all", include_pricing = false }) {
      // Test data - would connect to product intelligence APIs in production
      const productData: Record<string, ProductInfo[]> = {
        "microsoft": [
          {
            name: "Microsoft 365",
            description: "Cloud-based productivity suite",
            features: ["Office apps", "Cloud storage", "Team collaboration", "Security features"],
            pricing: {
              model: "subscription",
              details: "From $5/user/month"
            },
            target_market: ["Enterprise", "Small Business", "Education"]
          },
          {
            name: "Azure",
            description: "Cloud computing platform",
            features: ["Virtual machines", "Databases", "AI services", "DevOps tools"],
            pricing: {
              model: "usage-based",
              details: "Pay-as-you-go"
            },
            target_market: ["Enterprise", "Developers", "Startups"]
          }
        ],
        "apple": [
          {
            name: "iPhone",
            description: "Premium smartphone",
            features: ["Advanced cameras", "Face ID", "App ecosystem", "Privacy features"],
            pricing: {
              model: "one-time-purchase",
              details: "From $699"
            },
            target_market: ["Consumers", "Professionals", "Creative users"]
          }
        ]
      };

      const products = productData[company_name.toLowerCase()];
      if (!products) {
        throw new Error("Product data not found");
      }

      if (!include_pricing) {
        return products.map(({ pricing, ...product }) => product);
      }

      return products;
    },

    async compareCompetitors({ companies, market_segment = "general", comparison_aspects = ["market_share", "strengths"] }) {
      // Test data - would connect to market intelligence APIs in production
      const competitorData: Record<string, MarketPosition> = {
        "microsoft": {
          company: "Microsoft",
          market_share: 32.5,
          growth_rate: 21.3,
          strengths: ["Enterprise relationships", "Cloud infrastructure", "Developer ecosystem"],
          weaknesses: ["Consumer brand perception", "Hardware market share", "Mobile presence"],
          target_segments: ["Enterprise", "Small Business", "Developers"]
        },
        "apple": {
          company: "Apple",
          market_share: 28.7,
          growth_rate: 18.9,
          strengths: ["Brand value", "Hardware integration", "App ecosystem"],
          weaknesses: ["Enterprise presence", "Service reliability", "Price premium"],
          target_segments: ["Premium consumers", "Creative professionals", "Education"]
        }
      };

      const comparisonResults = companies
        .map((company: string) => competitorData[company.toLowerCase()])
        .filter((data: MarketPosition | undefined) => data !== undefined);

      if (comparisonResults.length === 0) {
        throw new Error("No competitor data found for specified companies");
      }

      return {
        market_segment,
        comparison_date: new Date().toISOString(),
        competitors: comparisonResults
      };
    }
  }
};

const agents = injectTransferTools([competitorAnalyst]);

export default agents; 