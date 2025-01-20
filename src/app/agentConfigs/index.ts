import { AllAgentConfigsType } from "@/app/types";
import newsAnalysis from "./newsAnalysis";
import marketResearch from "./marketResearch";
import competitorAnalysis from "./competitorAnalysis";
import businessStrategy from "./businessStrategy";
import trendAnalysis from "./trendAnalysis";
import financialReports from "./financialReports";
import productResearch from "./productResearch";
import customerFeedback from "./customerFeedback";

// Organize agents into categories for better navigation
export const agentCategories = {
  "Market Intelligence": {
    newsAnalysis: {
      key: "newsAnalysis",
      name: "Tech & Business News Analysis",
      description: "Real-time analysis of technology and business news with actionable insights"
    },
    marketResearch: {
      key: "marketResearch",
      name: "Market Research & Analysis",
      description: "Deep dive into market dynamics, size, and growth opportunities"
    },
    trendAnalysis: {
      key: "trendAnalysis",
      name: "Trend Forecasting",
      description: "Analysis of emerging market trends and consumer behavior patterns"
    }
  },
  "Business Strategy": {
    businessStrategy: {
      key: "businessStrategy",
      name: "Strategic Planning",
      description: "Comprehensive business strategy development and implementation planning"
    },
    competitorAnalysis: {
      key: "competitorAnalysis",
      name: "Competitor Intelligence",
      description: "In-depth analysis of competitor strategies and market positioning"
    }
  },
  "Product & Finance": {
    productResearch: {
      key: "productResearch",
      name: "Product Analysis",
      description: "Product research, competitive assessment, and innovation opportunities"
    },
    financialReports: {
      key: "financialReports",
      name: "Financial Analysis",
      description: "Detailed analysis of financial reports and market performance"
    },
    customerFeedback: {
      key: "customerFeedback",
      name: "Customer Insights",
      description: "Analysis of customer feedback and satisfaction metrics"
    }
  }
};

export const allAgentSets: AllAgentConfigsType = {
  newsAnalysis,
  marketResearch,
  competitorAnalysis,
  businessStrategy,
  trendAnalysis,
  financialReports,
  productResearch,
  customerFeedback
};

export const defaultAgentSetKey = "newsAnalysis";
