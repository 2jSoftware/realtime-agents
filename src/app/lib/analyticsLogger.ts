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

interface SearchResult {
  title: string;
  url: string;
  description: string;
  score: {
    relevance: number;
    reliability: number;
    recency: number;
  };
  metadata: {
    domain: string;
    type: "official" | "academic" | "news" | "discussion" | "other";
    lastUpdated?: string;
  };
}

interface SearchValidation {
  qualityIndicators: {
    sourceDiversity: number;
    informationDensity: number;
    consistencyScore: number;
  };
  potentialBiases: {
    type: string;
    severity: "low" | "medium" | "high";
    mitigation?: string;
  }[];
  confidenceMetrics: {
    dataQuality: number;
    sourceReliability: number;
    contextMatch: number;
  };
}

interface SearchReasoning {
  trigger: {
    type: "knowledge_gap" | "verification_needed" | "context_expansion" | "pattern_validation";
    source: string;
    confidence: number;
  };
  chain: {
    step: number;
    reasoning: string;
    query: string;
    expectedOutcome: string;
    dependsOn?: number[];  // Previous step numbers this depends on
  }[];
  contextualFactors: {
    relevantPatterns: string[];
    uncertaintyAreas: string[];
    requiredValidation: string[];
  };
}

class AnalyticsLogger {
  private events: AnalyticsEvent[] = [];
  private currentSessionId: string;
  private currentAgent: AgentConfig | null = null;
  private interactionPatterns: InteractionPattern | null = null;
  private activeOutcomeProjections: OutcomeProjection[] = [];
  private currentScenarioContext: ScenarioContext | null = null;
  private readonly BRAVE_SEARCH_API_KEY = "BSApMnNeOZz1kBa-J_e9LX8jcu2LfG5";
  private searchHistory: SearchReasoning[] = [];

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
      philosophical: {
        keywords: ["principle", "foundation", "methodology", "paradigm", "framework", "nature", "practical", "empirical"],
        weight: 0,
        uncertaintyIndicators: ["assumption", "bias", "interpretation", "perspective", "context-dependent"]
      },
      research: {
        keywords: ["analysis", "investigation", "observation", "pattern", "evidence", "methodology", "demonstration"],
        weight: 0,
        uncertaintyIndicators: ["preliminary", "hypothesis", "potential", "indication", "suggests"]
      },
      development: {
        keywords: ["implementation", "iteration", "growth", "evolution", "adaptation", "refinement"],
        weight: 0,
        uncertaintyIndicators: ["constraint", "dependency", "limitation", "requirement"]
      },
      interaction: {
        keywords: ["conversation", "dialogue", "exchange", "communication", "understanding", "context"],
        weight: 0,
        uncertaintyIndicators: ["ambiguity", "misalignment", "confusion", "unclear"]
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

  async updateScenarioContext(content: string) {
    const analysis = this.analyzeContent(content);
    
    this.currentScenarioContext = {
      domain: analysis.domain,
      intent: analysis.intents,
      complexity: analysis.complexity,
      requiredCapabilities: await this.deriveRequiredCapabilities(analysis)
    };

    this.logSystemEvent("scenario_context_updated", {
      previousContext: this.currentScenarioContext,
      analysis
    });
  }

  private async deriveRequiredCapabilities(analysis: ReturnType<typeof this.analyzeContent>): Promise<string[]> {
    const capabilities = new Set<string>();

    // Base capabilities
    capabilities.add("contextual_understanding");
    capabilities.add("bias_recognition");

    // Domain-specific capabilities
    switch (analysis.domain) {
      case "philosophical":
        capabilities.add("principle_extraction");
        capabilities.add("methodology_assessment");
        capabilities.add("paradigm_analysis");
        break;
      case "research":
        capabilities.add("pattern_recognition");
        capabilities.add("evidence_evaluation");
        capabilities.add("hypothesis_formation");
        break;
      case "development":
        capabilities.add("iterative_refinement");
        capabilities.add("growth_assessment");
        capabilities.add("adaptation_planning");
        break;
      case "interaction":
        capabilities.add("context_preservation");
        capabilities.add("ambiguity_resolution");
        capabilities.add("continuity_maintenance");
        break;
    }

    // Add complexity-based capabilities
    if (analysis.complexity === "high") {
      capabilities.add("deep_pattern_analysis");
      capabilities.add("bias_mitigation");
      capabilities.add("extrapolation_management");
    }

    // Add search-based capabilities if needed
    if (analysis.complexity === "high") {
      capabilities.add("external_knowledge_integration");
      capabilities.add("source_validation");
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

  private async processEvent(event: AnalyticsEvent) {
    // Analyze event for patterns and update insights
    if (event.category === "interaction") {
      this.analyzeInteractionEvent(event);
    } else if (event.category === "outcome") {
      this.analyzeOutcomeEvent(event);
    }

    // Add search reasoning
    const searchNeeds = await this.determineSearchNeeds(event);
    if (searchNeeds) {
      this.logSystemEvent("search_reasoning_generated", {
        reasoning: searchNeeds,
        context: {
          scenarioContext: this.currentScenarioContext,
          interactionPatterns: this.interactionPatterns
        }
      });
    }
  }

  private analyzeInteractionEvent(event: AnalyticsEvent) {
    // Implement interaction pattern analysis
    const patterns = {
      biasIndicators: [
        "premature_categorization",
        "over_simplification",
        "false_dichotomy",
        "assumed_causation"
      ],
      extrapolationPoints: [
        "pattern_emergence",
        "principle_application",
        "context_extension"
      ],
      practicalityMetrics: [
        "implementation_feasibility",
        "resource_alignment",
        "growth_potential"
      ]
    };

    // TODO: Implement pattern matching against these indicators
  }

  private analyzeOutcomeEvent(event: AnalyticsEvent) {
    // Implement outcome analysis focusing on practical growth
    const growthPatterns = {
      natural: ["emergent_behavior", "adaptive_response", "organic_development"],
      practical: ["resource_utilization", "implementation_path", "measurable_progress"],
      sustainable: ["self_reinforcing", "context_aware", "bias_resistant"]
    };

    // TODO: Implement pattern matching against these growth indicators
  }

  private async validateSearchContext(query: string): Promise<boolean> {
    // Determine if search is appropriate based on context
    const sensitivePatterns = [
      /private|confidential|classified/i,
      /internal|proprietary/i,
      /personal|identifier|secret/i
    ];

    const hasRestrictedContent = sensitivePatterns.some(pattern => pattern.test(query));
    if (hasRestrictedContent) {
      this.logSystemEvent("search_restricted", {
        reason: "Query contains sensitive or restricted content",
        query
      });
      return false;
    }

    return true;
  }

  private async searchWithValidation(query: string): Promise<{
    results: SearchResult[];
    validation: SearchValidation;
  } | null> {
    try {
      const isValid = await this.validateSearchContext(query);
      if (!isValid) return null;

      const searchParams = new URLSearchParams({
        q: query,
        count: '5',
        safesearch: 'strict'
      });

      const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'X-Subscription-Token': this.BRAVE_SEARCH_API_KEY
        }
      });

      if (!response.ok) {
        throw new Error(`Search API error: ${response.statusText}`);
      }

      const rawResults = await response.json();
      
      // Transform and validate results
      const results: SearchResult[] = rawResults.web.results.map((result: any) => ({
        title: result.title,
        url: result.url,
        description: result.description,
        score: {
          relevance: this.calculateRelevance(result, query),
          reliability: this.assessSourceReliability(result.url),
          recency: this.calculateRecency(result.age)
        },
        metadata: {
          domain: new URL(result.url).hostname,
          type: this.categorizeSource(result.url),
          lastUpdated: result.age
        }
      }));

      const validation = this.validateResults(results, query);

      // Log search analytics
      this.logSystemEvent("web_search_performed", {
        query,
        resultCount: results.length,
        validation
      });

      return { results, validation };

    } catch (error) {
      this.logSystemEvent("search_error", {
        error: error instanceof Error ? error.message : "Unknown error",
        query
      });
      return null;
    }
  }

  private calculateRelevance(result: any, query: string): number {
    // Implement relevance scoring based on:
    // - Keyword matching
    // - Context alignment
    // - Content freshness
    return 0.8; // Placeholder
  }

  private assessSourceReliability(url: string): number {
    // Implement source reliability assessment based on:
    // - Domain reputation
    // - Content type
    // - Citation patterns
    return 0.7; // Placeholder
  }

  private calculateRecency(age: string): number {
    // Implement recency scoring
    return 0.9; // Placeholder
  }

  private categorizeSource(url: string): SearchResult['metadata']['type'] {
    // Implement source categorization
    return "other"; // Placeholder
  }

  private validateResults(results: SearchResult[], query: string): SearchValidation {
    // Implement result validation
    return {
      qualityIndicators: {
        sourceDiversity: 0.8,
        informationDensity: 0.7,
        consistencyScore: 0.9
      },
      potentialBiases: [
        {
          type: "recency_bias",
          severity: "low",
          mitigation: "Consider historical context"
        }
      ],
      confidenceMetrics: {
        dataQuality: 0.85,
        sourceReliability: 0.8,
        contextMatch: 0.9
      }
    };
  }

  private async determineSearchNeeds(event: AnalyticsEvent): Promise<SearchReasoning | null> {
    const reasoning: SearchReasoning = {
      trigger: {
        type: "knowledge_gap",
        source: "initial_analysis",
        confidence: 0.8
      },
      chain: [],
      contextualFactors: {
        relevantPatterns: [],
        uncertaintyAreas: [],
        requiredValidation: []
      }
    };

    // Analyze current context for search needs
    if (this.currentScenarioContext?.ambiguityFactors) {
      reasoning.contextualFactors.uncertaintyAreas.push(
        ...this.currentScenarioContext.ambiguityFactors
          .filter(f => f.impactLevel === "high")
          .map(f => f.description)
      );
    }

    // Check interaction patterns for knowledge gaps
    if (this.interactionPatterns?.knowledgeRequirements.uncertaintyAreas) {
      reasoning.contextualFactors.relevantPatterns.push(
        ...this.interactionPatterns.knowledgeRequirements.uncertaintyAreas
          .filter(a => a.impact === "high")
          .map(a => a.reason)
      );
    }

    // Build search chain based on context
    if (reasoning.contextualFactors.uncertaintyAreas.length > 0 || 
        reasoning.contextualFactors.relevantPatterns.length > 0) {
      
      // Start with foundational queries
      reasoning.chain.push({
        step: 1,
        reasoning: "Establish baseline understanding of uncertain areas",
        query: this.constructBaselineQuery(reasoning.contextualFactors),
        expectedOutcome: "Framework and terminology validation"
      });

      // Add specific validation queries
      if (reasoning.contextualFactors.uncertaintyAreas.length > 0) {
        reasoning.chain.push({
          step: 2,
          reasoning: "Validate specific uncertainty areas",
          query: this.constructValidationQuery(reasoning.contextualFactors.uncertaintyAreas),
          expectedOutcome: "Uncertainty resolution or mitigation strategies",
          dependsOn: [1]
        });
      }

      // Add pattern validation queries
      if (reasoning.contextualFactors.relevantPatterns.length > 0) {
        reasoning.chain.push({
          step: 3,
          reasoning: "Verify and expand identified patterns",
          query: this.constructPatternQuery(reasoning.contextualFactors.relevantPatterns),
          expectedOutcome: "Pattern validation and extension",
          dependsOn: [1, 2]
        });
      }

      this.searchHistory.push(reasoning);
      return reasoning;
    }

    return null;
  }

  private constructBaselineQuery(factors: SearchReasoning['contextualFactors']): string {
    // Construct a query that establishes foundational understanding
    const terms = [
      ...new Set([
        ...factors.relevantPatterns,
        ...factors.uncertaintyAreas
      ])
    ];
    
    return terms
      .slice(0, 3)  // Limit to top 3 most important terms
      .join(" AND ") + " methodology framework";
  }

  private constructValidationQuery(uncertainties: string[]): string {
    return uncertainties
      .slice(0, 2)  // Limit to top 2 uncertainties
      .map(u => `"${u}" validation OR verification`)
      .join(" AND ");
  }

  private constructPatternQuery(patterns: string[]): string {
    return patterns
      .slice(0, 2)  // Limit to top 2 patterns
      .map(p => `"${p}" examples OR applications`)
      .join(" AND ");
  }

  // Add method to get search history
  getSearchHistory(): SearchReasoning[] {
    return this.searchHistory;
  }
}

export const analyticsLogger = new AnalyticsLogger(); 