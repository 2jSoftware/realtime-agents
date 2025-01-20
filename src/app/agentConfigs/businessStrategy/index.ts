import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

interface StrategyAnalysis {
  objectives: string[];
  market_conditions: {
    opportunities: string[];
    threats: string[];
    key_trends: string[];
  };
  resources_needed: {
    financial: string[];
    human: string[];
    technological: string[];
  };
  risks: {
    type: "strategic" | "market" | "operational" | "financial" | "compliance";
    description: string;
    impact: "high" | "medium" | "low";
    mitigation: string[];
  }[];
  implementation: {
    phases: {
      name: string;
      duration: string;
      key_activities: string[];
      resources: string[];
      success_metrics: string[];
    }[];
    timeline: string;
    critical_path: string[];
  };
}

const businessStrategist: AgentConfig = {
  name: "businessStrategist",
  publicDescription: "Develops comprehensive business strategies with focus on innovation, risk management, and practical implementation.",
  instructions: `You are an expert business strategist combining strategic planning, innovation, and risk management. Your role is to:

1. Develop actionable business strategies
2. Identify innovation opportunities
3. Assess and mitigate risks
4. Create practical implementation plans
5. Monitor and adjust strategies

For each strategic analysis:
1. Start with understanding the current situation and objectives
2. Consider market conditions and competitive landscape
3. Evaluate internal capabilities and resources
4. Identify risks and opportunities
5. Create detailed implementation plans

Focus areas:
- Market positioning and competitive advantage
- Innovation and digital transformation
- Risk assessment and mitigation
- Resource allocation and optimization
- Implementation roadmap and timelines`,
  tools: [
    {
      type: "function",
      name: "analyzeStrategy",
      description: "Analyze a business strategy and provide comprehensive recommendations",
      parameters: {
        type: "object",
        properties: {
          industry: {
            type: "string",
            description: "Industry to analyze"
          },
          company_size: {
            type: "string",
            enum: ["startup", "small", "medium", "enterprise"],
            description: "Size of the company"
          },
          focus_areas: {
            type: "array",
            items: { type: "string" },
            description: "Areas to focus the analysis on"
          },
          time_horizon: {
            type: "string",
            enum: ["short_term", "medium_term", "long_term"],
            description: "Time horizon for the strategy"
          }
        },
        required: ["industry"]
      }
    },
    {
      type: "function",
      name: "assessRisks",
      description: "Assess risks and provide mitigation strategies",
      parameters: {
        type: "object",
        properties: {
          strategy_type: {
            type: "string",
            enum: ["growth", "innovation", "cost_optimization", "market_entry", "digital_transformation"],
            description: "Type of strategy to assess"
          },
          risk_categories: {
            type: "array",
            items: {
              type: "string",
              enum: ["strategic", "market", "operational", "financial", "compliance"]
            },
            description: "Categories of risks to assess"
          }
        },
        required: ["strategy_type"]
      }
    },
    {
      type: "function",
      name: "createImplementationPlan",
      description: "Create a detailed implementation plan for a strategy",
      parameters: {
        type: "object",
        properties: {
          strategy_name: {
            type: "string",
            description: "Name of the strategy to implement"
          },
          timeline: {
            type: "string",
            enum: ["3_months", "6_months", "1_year", "2_years"],
            description: "Timeline for implementation"
          },
          resources_available: {
            type: "object",
            properties: {
              budget: { type: "number" },
              team_size: { type: "number" }
            }
          }
        },
        required: ["strategy_name"]
      }
    }
  ],
  toolLogic: {
    async analyzeStrategy({ industry, company_size = "medium", focus_areas = ["market_position", "innovation"], time_horizon = "medium_term" }) {
      // Test data - would connect to strategy analysis APIs in production
      const analysis: StrategyAnalysis = {
        objectives: [
          "Increase market share by 15% in next 12 months",
          "Launch 2 innovative products",
          "Achieve 30% revenue growth"
        ],
        market_conditions: {
          opportunities: [
            "Growing demand for sustainable solutions",
            "Digital transformation acceleration",
            "New market segments emerging"
          ],
          threats: [
            "Increasing competition",
            "Regulatory changes",
            "Economic uncertainty"
          ],
          key_trends: [
            "Remote work adoption",
            "AI/ML integration",
            "Sustainability focus"
          ]
        },
        resources_needed: {
          financial: ["R&D budget: $2M", "Marketing budget: $1.5M"],
          human: ["Tech team expansion", "Sales force training"],
          technological: ["Cloud infrastructure", "Data analytics tools"]
        },
        risks: [
          {
            type: "strategic",
            description: "Market positioning risk",
            impact: "high",
            mitigation: ["Diversify product portfolio", "Strong brand building"]
          },
          {
            type: "operational",
            description: "Resource allocation risk",
            impact: "medium",
            mitigation: ["Agile methodology", "Regular reviews"]
          }
        ],
        implementation: {
          phases: [
            {
              name: "Foundation",
              duration: "3 months",
              key_activities: ["Market research", "Team building"],
              resources: ["Research team", "HR support"],
              success_metrics: ["Team hired", "Research completed"]
            },
            {
              name: "Development",
              duration: "6 months",
              key_activities: ["Product development", "Marketing prep"],
              resources: ["Dev team", "Marketing team"],
              success_metrics: ["MVP ready", "Marketing plan"]
            }
          ],
          timeline: "9 months",
          critical_path: ["Market research", "Team hiring", "Product development"]
        }
      };

      return {
        industry,
        company_size,
        focus_areas,
        time_horizon,
        analysis,
        recommendations: [
          "Focus on sustainable product development",
          "Invest in AI/ML capabilities",
          "Build strong digital presence"
        ],
        next_steps: [
          "Conduct detailed market research",
          "Build core team",
          "Develop MVP"
        ]
      };
    },

    async assessRisks({ strategy_type, risk_categories = ["strategic", "market", "operational"] }) {
      // Implementation would connect to risk assessment APIs
      return {
        strategy_type,
        risk_assessment: {
          overall_risk_level: "medium",
          key_risks: [
            {
              category: "strategic",
              description: "Market positioning risk",
              probability: "medium",
              impact: "high",
              mitigation_strategies: [
                "Continuous market monitoring",
                "Flexible strategy adjustment"
              ]
            }
          ],
          recommendations: [
            "Implement monthly risk reviews",
            "Set up early warning systems",
            "Create contingency plans"
          ]
        }
      };
    },

    async createImplementationPlan({ strategy_name, timeline = "6_months", resources_available }) {
      // Implementation would use project management APIs
      return {
        strategy_name,
        timeline,
        phases: [
          {
            name: "Initiation",
            duration: "1 month",
            activities: ["Team setup", "Resource allocation"],
            deliverables: ["Project charter", "Resource plan"]
          },
          {
            name: "Execution",
            duration: "4 months",
            activities: ["Development", "Testing"],
            deliverables: ["MVP", "Test results"]
          },
          {
            name: "Launch",
            duration: "1 month",
            activities: ["Market launch", "Monitoring"],
            deliverables: ["Launch report", "Performance metrics"]
          }
        ],
        milestones: [
          {
            name: "Project kickoff",
            date: "Week 1",
            deliverables: ["Team onboarded", "Plans approved"]
          },
          {
            name: "MVP complete",
            date: "Month 4",
            deliverables: ["Working product", "Test results"]
          }
        ],
        resource_allocation: {
          team_assignments: ["Product team", "Marketing team"],
          budget_breakdown: {
            development: "40%",
            marketing: "30%",
            operations: "30%"
          }
        }
      };
    }
  }
};

const agents = injectTransferTools([businessStrategist]);

export default agents; 