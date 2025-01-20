import { AgentConfig } from "../types";

export interface AnalyticsEvent {
  timestamp: number;
  category: "system" | "interaction" | "outcome";
  type: string;
  data: Record<string, any>;
  metadata?: {
    agentName?: string;
    sessionId?: string;
    contextualGoals?: string[];
    scenarioContext?: ScenarioContext;
  };
}

export interface ScenarioContext {
  domain: string;
  intent: string[];
  complexity: "low" | "medium" | "high";
  requiredCapabilities: string[];
  constraintsAndLimitations?: string[];
  ambiguityFactors?: {
    type: "context" | "intent" | "reference" | "temporal" | "semantic";
    description: string;
    impactLevel: "low" | "medium" | "high";
    resolutionHints?: string[];
  }[];
  memoryDependencies?: {
    type: "short_term" | "conversation_context" | "domain_knowledge" | "prior_interaction";
    relevance: "critical" | "helpful" | "optional";
    timeframe?: "current_session" | "recent" | "historical";
    confidence: number;
  }[];
}

export interface InteractionPattern {
  primaryIntent: string;
  secondaryIntents: string[];
  contextualDomain: string;
  knowledgeRequirements: {
    domains: string[];
    depth: "surface" | "moderate" | "deep";
    temporalRelevance: "historical" | "current" | "predictive";
    uncertaintyAreas?: {
      domain: string;
      reason: string;
      impact: "low" | "medium" | "high";
    }[];
  };
  interactionStyle: {
    formality: "casual" | "professional" | "technical";
    detailLevel: "concise" | "detailed" | "comprehensive";
    preferredFormat: string[];
    adaptabilityNeeded?: {
      aspect: "terminology" | "complexity" | "format" | "pace";
      reason: string;
      suggestedAdjustment: string;
    }[];
  };
  userContext?: {
    expertise: "novice" | "intermediate" | "expert";
    goalClarity: "vague" | "moderate" | "clear";
    engagementStyle: "passive" | "active" | "collaborative";
    consistencyMetrics?: {
      topicAdherence: number;
      clarityTrend: number;
      engagementStability: number;
    };
    adaptationHistory?: {
      timestamp: number;
      aspect: string;
      fromState: string;
      toState: string;
      trigger: string;
    }[];
  };
  conversationDynamics?: {
    topicEvolution: {
      from: string;
      to: string;
      trigger: string;
      timestamp: number;
    }[];
    clarificationNeeded: {
      aspect: string;
      frequency: number;
      pattern: string;
    }[];
    successfulStrategies: {
      type: string;
      effectiveness: number;
      context: string;
    }[];
  };
}

export interface OutcomeProjection {
  immediateGoal: string;
  contextualGoals: string[];
  requiredCapabilities: string[];
  successCriteria: {
    primary: string[];
    secondary: string[];
    metrics: Record<string, string>;
  };
  riskFactors: {
    type: string;
    likelihood: "low" | "medium" | "high";
    impact: "low" | "medium" | "high";
    mitigationStrategy?: string;
  }[];
  delegationHints: {
    suggestedAgents: string[];
    reasoning: string[];
    confidenceScore: number;
  };
}

class AnalyticsLogger {
  private events: AnalyticsEvent[] = [];
  private currentSessionId: string;
  private currentAgent: AgentConfig | null = null;
  private interactionPatterns: InteractionPattern | null = null;
  private activeOutcomeProjections: OutcomeProjection[] = [];
  private currentScenarioContext: ScenarioContext | null = null;

  constructor() {
    this.currentSessionId = crypto.randomUUID();
  }

  // Analyze message content for intent and context
  private analyzeContent(content: string): {
    intents: string[];
    domain: string;
    complexity: "low" | "medium" | "high";
    ambiguityFactors: ScenarioContext['ambiguityFactors'];
    memoryDependencies: ScenarioContext['memoryDependencies'];
  } {
    const words = content.toLowerCase().split(/\s+/);
    const intents = [];
    const ambiguityFactors: ScenarioContext['ambiguityFactors'] = [];
    const memoryDependencies: ScenarioContext['memoryDependencies'] = [];
    
    // Enhanced intent detection with ambiguity awareness
    if (content.includes("?") || words.some(w => ["how", "what", "why", "when", "where"].includes(w))) {
      intents.push("information_seeking");
      
      // Check for ambiguous questions
      if (words.some(w => ["any", "some", "maybe", "possibly", "about"].includes(w))) {
        ambiguityFactors.push({
          type: "intent",
          description: "Unclear specificity in information request",
          impactLevel: "medium",
          resolutionHints: ["Ask for specific examples", "Clarify scope"]
        });
      }
    }

    // Detect temporal references and dependencies
    if (words.some(w => ["before", "after", "previous", "last", "next", "again"].includes(w))) {
      memoryDependencies.push({
        type: "conversation_context",
        relevance: "critical",
        timeframe: "current_session",
        confidence: 0.9
      });
    }

    // Detect references to shared knowledge
    if (words.some(w => ["remember", "recall", "mentioned", "earlier", "said"].includes(w))) {
      memoryDependencies.push({
        type: "prior_interaction",
        relevance: "critical",
        timeframe: "recent",
        confidence: 0.8
      });
      
      ambiguityFactors.push({
        type: "reference",
        description: "Reference to previous context",
        impactLevel: "high",
        resolutionHints: ["Verify specific reference", "Ask for clarification"]
      });
    }

    // Enhanced domain detection with uncertainty tracking
    const domainMatches = {
      strategy: {
        keywords: ["strategy", "plan", "approach", "direction", "roadmap"],
        weight: 0,
        uncertaintyIndicators: ["potential", "consider", "might", "could", "possibly"]
      },
      business: {
        keywords: ["market", "business", "revenue", "growth", "operations"],
        weight: 0,
        uncertaintyIndicators: ["estimate", "projection", "forecast", "assumption"]
      },
      technical: {
        keywords: ["implementation", "system", "architecture", "development", "integration"],
        weight: 0,
        uncertaintyIndicators: ["dependency", "constraint", "limitation", "unknown"]
      },
      process: {
        keywords: ["workflow", "process", "procedure", "method", "practice"],
        weight: 0,
        uncertaintyIndicators: ["bottleneck", "inefficiency", "gap", "improvement"]
      }
    };

    // Calculate weights and track uncertainties
    words.forEach(word => {
      for (const [domain, data] of Object.entries(domainMatches)) {
        if (data.keywords.includes(word)) {
          data.weight += 1;
        }
        if (data.uncertaintyIndicators.includes(word)) {
          ambiguityFactors.push({
            type: "semantic",
            description: `Uncertainty in ${domain} domain: requires clarification or validation`,
            impactLevel: "medium",
            resolutionHints: [
              "Request specific business context",
              "Validate assumptions",
              "Define success metrics"
            ]
          });
        }
      }
    });

    // Find domain with highest weight
    let maxWeight = 0;
    let domain = "general";
    
    for (const [key, data] of Object.entries(domainMatches)) {
      if (data.weight > maxWeight) {
        maxWeight = data.weight;
        domain = key;
      }
    }

    // Enhanced complexity detection
    const complexityFactors = {
      score: 0,
      factors: {
        length: content.length > 100 ? 2 : content.length > 50 ? 1 : 0,
        multipleIntents: intents.length > 2 ? 2 : intents.length > 1 ? 1 : 0,
        specificDomain: domain !== "general" ? 1 : 0,
        temporalAspect: intents.includes("temporal_request") ? 1 : 0,
        ambiguityCount: ambiguityFactors.length
      }
    };

    const complexityScore = Object.values(complexityFactors.factors).reduce((a, b) => a + b, 0);
    const complexity = complexityScore >= 4 ? "high" : complexityScore >= 2 ? "medium" : "low";

    // Add domain knowledge dependency if complexity is high
    if (complexity === "high") {
      memoryDependencies.push({
        type: "domain_knowledge",
        relevance: "critical",
        timeframe: "historical",
        confidence: 0.85
      });
    }

    return { intents, domain, complexity, ambiguityFactors, memoryDependencies };
  }

  updateScenarioContext(content: string) {
    const analysis = this.analyzeContent(content);
    
    this.currentScenarioContext = {
      domain: analysis.domain,
      intent: analysis.intents,
      complexity: analysis.complexity,
      requiredCapabilities: this.deriveRequiredCapabilities(analysis)
    };

    this.logSystemEvent("scenario_context_updated", {
      previousContext: this.currentScenarioContext,
      analysis
    });
  }

  private deriveRequiredCapabilities(analysis: ReturnType<typeof this.analyzeContent>): string[] {
    const capabilities = new Set<string>();

    // Base capabilities
    capabilities.add("context_understanding");

    // Domain-specific capabilities
    switch (analysis.domain) {
      case "strategy":
        capabilities.add("strategic_planning");
        capabilities.add("business_analysis");
        break;
      case "business":
        capabilities.add("market_understanding");
        capabilities.add("operational_insight");
        break;
      case "technical":
        capabilities.add("technical_assessment");
        capabilities.add("system_analysis");
        break;
      case "process":
        capabilities.add("process_optimization");
        capabilities.add("workflow_analysis");
        break;
    }

    // Add complexity-based capabilities
    if (analysis.complexity === "high") {
      capabilities.add("detailed_analysis");
      capabilities.add("impact_assessment");
      capabilities.add("risk_evaluation");
    }

    return Array.from(capabilities);
  }

  // System Events
  logSystemEvent(type: string, data: Record<string, any>) {
    this.addEvent({
      category: "system",
      type,
      data,
    });
  }

  // Interaction Analysis
  logInteraction(type: string, data: Record<string, any>) {
    this.addEvent({
      category: "interaction",
      type,
      data: {
        ...data,
        patterns: this.interactionPatterns,
      },
    });
  }

  // Outcome Framework
  logOutcome(type: string, data: Record<string, any>) {
    this.addEvent({
      category: "outcome",
      type,
      data: {
        ...data,
        activeProjections: this.activeOutcomeProjections,
      },
    });
  }

  // Update current agent context
  setCurrentAgent(agent: AgentConfig) {
    this.currentAgent = agent;
    this.logSystemEvent("agent_context_updated", {
      agentName: agent.name,
      agentDescription: agent.publicDescription,
    });
  }

  // Update interaction patterns based on conversation analysis
  updateInteractionPatterns(patterns: Partial<InteractionPattern>) {
    this.interactionPatterns = {
      ...this.interactionPatterns,
      ...patterns,
    } as InteractionPattern;

    this.logInteraction("patterns_updated", {
      newPatterns: patterns,
      fullPatterns: this.interactionPatterns,
    });
  }

  // Add or update outcome projections
  addOutcomeProjection(projection: OutcomeProjection) {
    this.activeOutcomeProjections.push(projection);
    this.logOutcome("projection_added", {
      newProjection: projection,
      totalProjections: this.activeOutcomeProjections.length,
    });
  }

  // Get analytics insights
  getInsights(): {
    interactionInsights: InteractionPattern | null;
    outcomeInsights: OutcomeProjection[];
    recentEvents: AnalyticsEvent[];
  } {
    return {
      interactionInsights: this.interactionPatterns,
      outcomeInsights: this.activeOutcomeProjections,
      recentEvents: this.events.slice(-50), // Get last 50 events
    };
  }

  // Get delegation suggestions based on analytics
  getDelegationSuggestions(): {
    suggestedAgents: string[];
    reasoning: string[];
    confidence: number;
    contextMatch: Record<string, number>;
  } {
    if (!this.currentScenarioContext || !this.interactionPatterns) {
      return {
        suggestedAgents: [],
        reasoning: ["Insufficient context for delegation suggestions"],
        confidence: 0,
        contextMatch: {}
      };
    }

    // TODO: Implement sophisticated agent matching based on:
    // - Required capabilities vs agent capabilities
    // - Domain expertise alignment
    // - Historical success patterns
    // - Interaction style compatibility
    
    return {
      suggestedAgents: [],
      reasoning: ["Delegation suggestion logic not yet implemented"],
      confidence: 0,
      contextMatch: {}
    };
  }

  private addEvent(event: Omit<AnalyticsEvent, "timestamp" | "metadata">) {
    const fullEvent: AnalyticsEvent = {
      ...event,
      timestamp: Date.now(),
      metadata: {
        sessionId: this.currentSessionId,
        agentName: this.currentAgent?.name,
        contextualGoals: this.activeOutcomeProjections.map(p => p.immediateGoal),
        ...(this.currentScenarioContext && { scenarioContext: this.currentScenarioContext })
      },
    };

    this.events.push(fullEvent);
    this.processEvent(fullEvent);
  }

  private processEvent(event: AnalyticsEvent) {
    // Analyze event for patterns and update insights
    if (event.category === "interaction") {
      this.analyzeInteractionEvent(event);
    } else if (event.category === "outcome") {
      this.analyzeOutcomeEvent(event);
    }
  }

  private analyzeInteractionEvent(event: AnalyticsEvent) {
    // TODO: Implement interaction pattern analysis
    // - Communication style detection
    // - Topic focus identification
    // - Engagement level assessment
  }

  private analyzeOutcomeEvent(event: AnalyticsEvent) {
    // TODO: Implement outcome analysis
    // - Success pattern identification
    // - Challenge pattern recognition
    // - Goal alignment checking
  }
}

export const analyticsLogger = new AnalyticsLogger(); 