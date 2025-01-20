import { AllAgentConfigsType } from "@/app/types";
import newsAnalysis from "./newsAnalysis";
import marketResearch from "./marketResearch";
import competitorAnalysis from "./competitorAnalysis";
import businessStrategy from "./businessStrategy";
import trendAnalysis from "./trendAnalysis";
import financialReports from "./financialReports";
import productResearch from "./productResearch";
import customerFeedback from "./customerFeedback";

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
