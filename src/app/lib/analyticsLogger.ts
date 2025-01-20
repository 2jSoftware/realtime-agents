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
}

export interface InteractionPattern {
  primaryIntent: string;
  secondaryIntents: string[];
  contextualDomain: string;
  knowledgeRequirements: {
    domains: string[];
    depth: "surface" | "moderate" | "deep";
    temporalRelevance: "historical" | "current" | "predictive";
  };
  interactionStyle: {
    formality: "casual" | "professional" | "technical";
    detailLevel: "concise" | "detailed" | "comprehensive";
    preferredFormat: string[];
  };
  userContext?: {
    expertise: "novice" | "intermediate" | "expert";
    goalClarity: "vague" | "moderate" | "clear";
    engagementStyle: "passive" | "active" | "collaborative";
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
  } {
    // TODO: Implement more sophisticated content analysis
    // For now, using simple heuristics
    const words = content.toLowerCase().split(/\s+/);
    const intents = [];
    
    // Detect information-seeking intent
    if (content.includes("?") || words.some(w => ["how", "what", "why", "when", "where"].includes(w))) {
      intents.push("information_seeking");
    }
    
    // Detect action-oriented intent
    if (words.some(w => ["need", "want", "please", "can", "could"].includes(w))) {
      intents.push("action_request");
    }

    // Simple complexity heuristic
    const complexity = content.length > 100 ? "high" : content.length > 50 ? "medium" : "low";

    // Simple domain detection
    const domains = {
      business: ["market", "business", "company", "finance", "strategy"],
      technology: ["tech", "software", "digital", "computer", "system"],
      news: ["news", "events", "update", "current", "latest"],
      analysis: ["analyze", "research", "study", "investigate", "examine"]
    };

    let domain = "general";
    for (const [key, keywords] of Object.entries(domains)) {
      if (keywords.some(k => words.includes(k))) {
        domain = key;
        break;
      }
    }

    return { intents, domain, complexity };
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
    capabilities.add("natural_language_understanding");

    // Domain-specific capabilities
    switch (analysis.domain) {
      case "business":
        capabilities.add("business_analysis");
        capabilities.add("market_understanding");
        break;
      case "technology":
        capabilities.add("technical_knowledge");
        capabilities.add("system_analysis");
        break;
      case "news":
        capabilities.add("current_events_awareness");
        capabilities.add("information_synthesis");
        break;
    }

    // Complexity-based capabilities
    if (analysis.complexity === "high") {
      capabilities.add("detailed_analysis");
      capabilities.add("complex_reasoning");
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