import { AnalyticsEvent, InteractionPattern, OutcomeProjection, ScenarioContext } from './analyticsLogger';

interface NaturalConclusion {
  type: 'topic_completion' | 'goal_achievement' | 'user_satisfaction' | 'context_switch';
  confidence: number;
  indicators: string[];
  timestamp: number;
}

interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  expectedPatterns: {
    setup: InteractionPattern[];
    development: InteractionPattern[];
    conclusion: InteractionPattern[];
  };
  agentPlaceholders: {
    role: string;
    required_capabilities: string[];
    optional_capabilities: string[];
    context_requirements: string[];
  }[];
  learningMetrics: {
    completion_rate: number;
    avg_duration: number;
    user_satisfaction: number;
    context_maintenance: number;
  };
}

interface TopicCluster {
  main_topic: string;
  related_topics: string[];
  importance_score: number;
  recency: number;
  context_dependencies: string[];
}

interface ExtendedInteractionPattern extends InteractionPattern {
  phase?: 'setup' | 'development' | 'conclusion';
}

export class AdvancedAnalytics {
  public readonly scenarios: Map<string, ScenarioTemplate> = new Map();
  private topicClusters: TopicCluster[] = [];
  private conclusions: NaturalConclusion[] = [];
  
  constructor() {
    this.initializeBasicTemplates();
  }

  private initializeBasicTemplates() {
    // Add basic scenario templates
    const informationalTemplate: ScenarioTemplate = {
      id: 'info_exchange',
      name: 'Information Exchange',
      description: 'General information gathering and sharing scenario',
      expectedPatterns: {
        setup: [],
        development: [],
        conclusion: []
      },
      agentPlaceholders: [
        {
          role: 'information_provider',
          required_capabilities: ['knowledge_synthesis', 'context_awareness'],
          optional_capabilities: ['real_time_updates'],
          context_requirements: ['domain_knowledge']
        }
      ],
      learningMetrics: {
        completion_rate: 0,
        avg_duration: 0,
        user_satisfaction: 0,
        context_maintenance: 0
      }
    };
    
    this.scenarios.set(informationalTemplate.id, informationalTemplate);
  }

  public identifyNaturalConclusion(events: AnalyticsEvent[]): NaturalConclusion | null {
    const recentEvents = events.slice(-5); // Look at last 5 events
    
    // Pattern matching for conclusion indicators
    const hasTopicCompletion = this.detectTopicCompletion(recentEvents);
    const hasGoalAchievement = this.detectGoalAchievement(recentEvents);
    const hasUserSatisfaction = this.detectUserSatisfaction(recentEvents);
    const hasContextSwitch = this.detectContextSwitch(recentEvents);
    
    if (hasTopicCompletion || hasGoalAchievement || hasUserSatisfaction || hasContextSwitch) {
      const conclusion: NaturalConclusion = {
        type: hasTopicCompletion ? 'topic_completion' :
              hasGoalAchievement ? 'goal_achievement' :
              hasUserSatisfaction ? 'user_satisfaction' : 'context_switch',
        confidence: this.calculateConclusionConfidence(recentEvents),
        indicators: this.gatherConclusionIndicators(recentEvents),
        timestamp: Date.now()
      };
      
      this.conclusions.push(conclusion);
      return conclusion;
    }
    
    return null;
  }

  private detectTopicCompletion(events: AnalyticsEvent[]): boolean {
    const recentEvents = events.slice(-5);
    return recentEvents.some(event => 
      event.category === 'interaction' && 
      event.type === 'topic_complete' ||
      (event.data.status === 'complete' && event.metadata?.scenarioContext?.intent.length === 0)
    );
  }

  private detectGoalAchievement(events: AnalyticsEvent[]): boolean {
    const recentEvents = events.slice(-5);
    return recentEvents.some(event => 
      event.category === 'outcome' && 
      event.type === 'goal_completed' ||
      event.data.status === 'achieved'
    );
  }

  private detectUserSatisfaction(events: AnalyticsEvent[]): boolean {
    const recentEvents = events.slice(-5);
    return recentEvents.some(event => 
      (event.category === 'interaction' && event.data.satisfaction > 0.8) ||
      (event.category === 'outcome' && event.data.userSatisfaction > 0.8)
    );
  }

  private detectContextSwitch(events: AnalyticsEvent[]): boolean {
    const recentEvents = events.slice(-5);
    let previousContext: ScenarioContext | null = null;
    
    for (const event of recentEvents) {
      if (event.metadata?.scenarioContext) {
        if (previousContext && (
          event.metadata.scenarioContext.domain !== previousContext.domain ||
          JSON.stringify(event.metadata.scenarioContext.intent) !== JSON.stringify(previousContext.intent)
        )) {
          return true;
        }
        previousContext = event.metadata.scenarioContext;
      }
    }
    return false;
  }

  private calculateConclusionConfidence(events: AnalyticsEvent[]): number {
    const recentEvents = events.slice(-5);
    let confidenceFactors = 0;
    let totalFactors = 0;
    
    // Check for clear completion indicators
    if (this.detectTopicCompletion(recentEvents)) {
      confidenceFactors += 1;
    }
    totalFactors += 1;
    
    // Check for goal achievement
    if (this.detectGoalAchievement(recentEvents)) {
      confidenceFactors += 1;
    }
    totalFactors += 1;
    
    // Check for user satisfaction
    if (this.detectUserSatisfaction(recentEvents)) {
      confidenceFactors += 1;
    }
    totalFactors += 1;
    
    // Check for context stability
    if (!this.detectContextSwitch(recentEvents)) {
      confidenceFactors += 1;
    }
    totalFactors += 1;
    
    return totalFactors > 0 ? confidenceFactors / totalFactors : 0;
  }

  private gatherConclusionIndicators(events: AnalyticsEvent[]): string[] {
    const indicators: string[] = [];
    const recentEvents = events.slice(-5);
    
    if (this.detectTopicCompletion(recentEvents)) {
      indicators.push('Topic objectives have been met');
    }
    
    if (this.detectGoalAchievement(recentEvents)) {
      indicators.push('User goals have been achieved');
    }
    
    if (this.detectUserSatisfaction(recentEvents)) {
      indicators.push('High user satisfaction detected');
    }
    
    if (this.detectContextSwitch(recentEvents)) {
      indicators.push('Natural transition to new context observed');
    }
    
    return indicators;
  }

  public generateScenarioTemplate(events: AnalyticsEvent[]): ScenarioTemplate {
    // Extract patterns from successful interactions
    const patterns = this.extractInteractionPatterns(events);
    
    // Generate template structure
    const template: ScenarioTemplate = {
      id: `template_${Date.now()}`,
      name: 'Dynamic Template',
      description: 'Automatically generated template from successful interaction',
      expectedPatterns: {
        setup: patterns.filter(p => p.phase === 'setup'),
        development: patterns.filter(p => p.phase === 'development'),
        conclusion: patterns.filter(p => p.phase === 'conclusion')
      },
      agentPlaceholders: this.identifyRequiredAgents(events),
      learningMetrics: {
        completion_rate: 0,
        avg_duration: 0,
        user_satisfaction: 0,
        context_maintenance: 0
      }
    };
    
    this.scenarios.set(template.id, template);
    return template;
  }

  public extractInteractionPatterns(events: AnalyticsEvent[]): ExtendedInteractionPattern[] {
    const patterns: ExtendedInteractionPattern[] = [];
    let currentPattern: Partial<ExtendedInteractionPattern> = {};
    
    events.forEach(event => {
      if (event.metadata?.scenarioContext) {
        currentPattern.contextualDomain = event.metadata.scenarioContext.domain;
        currentPattern.primaryIntent = event.metadata.scenarioContext.intent[0];
        currentPattern.secondaryIntents = event.metadata.scenarioContext.intent.slice(1);
        
        currentPattern.knowledgeRequirements = {
          domains: [event.metadata.scenarioContext.domain],
          depth: event.metadata.scenarioContext.complexity === 'high' ? 'deep' :
                 event.metadata.scenarioContext.complexity === 'medium' ? 'moderate' : 'surface',
          temporalRelevance: 'current',
          uncertaintyAreas: event.metadata.scenarioContext.ambiguityFactors?.map(factor => ({
            domain: factor.type,
            reason: factor.description,
            impact: factor.impactLevel
          }))
        };
      }
      
      if (event.category === 'interaction') {
        currentPattern.interactionStyle = {
          formality: this.determineFormality(event),
          detailLevel: this.determineDetailLevel(event),
          preferredFormat: this.determinePreferredFormat(event)
        };
        
        // Determine phase based on event sequence
        currentPattern.phase = patterns.length === 0 ? 'setup' :
                             patterns.length < 3 ? 'development' : 'conclusion';
        
        if (Object.keys(currentPattern).length >= 4) {
          patterns.push(currentPattern as ExtendedInteractionPattern);
          currentPattern = {};
        }
      }
    });
    
    return patterns;
  }

  private determineFormality(event: AnalyticsEvent): "casual" | "professional" | "technical" {
    const text = JSON.stringify(event.data).toLowerCase();
    if (text.includes('technical') || text.includes('specification')) return 'technical';
    if (text.includes('professional') || text.includes('formal')) return 'professional';
    return 'casual';
  }

  private determineDetailLevel(event: AnalyticsEvent): "concise" | "detailed" | "comprehensive" {
    const text = JSON.stringify(event.data).toLowerCase();
    if (text.includes('comprehensive') || text.includes('complete')) return 'comprehensive';
    if (text.includes('detailed') || text.includes('specific')) return 'detailed';
    return 'concise';
  }

  private determinePreferredFormat(event: AnalyticsEvent): string[] {
    const formats = new Set<string>();
    const text = JSON.stringify(event.data).toLowerCase();
    
    if (text.includes('list')) formats.add('list');
    if (text.includes('table')) formats.add('table');
    if (text.includes('diagram')) formats.add('diagram');
    if (text.includes('code')) formats.add('code');
    
    return Array.from(formats);
  }

  private identifyRequiredAgents(events: AnalyticsEvent[]): {
    role: string;
    required_capabilities: string[];
    optional_capabilities: string[];
    context_requirements: string[];
  }[] {
    const capabilities = new Set<string>();
    const optionalCapabilities = new Set<string>();
    const contextRequirements = new Set<string>();
    const roles = new Set<string>();
    
    events.forEach(event => {
      if (event.metadata?.scenarioContext?.requiredCapabilities) {
        event.metadata.scenarioContext.requiredCapabilities.forEach(cap => capabilities.add(cap));
      }
      
      if (event.metadata?.scenarioContext?.domain) {
        contextRequirements.add(`${event.metadata.scenarioContext.domain}_expertise`);
        roles.add(`${event.metadata.scenarioContext.domain}_specialist`);
      }
      
      if (event.metadata?.scenarioContext?.complexity === 'high') {
        capabilities.add('complex_problem_solving');
        optionalCapabilities.add('advanced_analytics');
      }

      // Add interaction-based capabilities
      if (event.category === 'interaction') {
        capabilities.add('communication');
        if (event.data.format === 'technical') {
          capabilities.add('technical_communication');
        }
      }

      // Add outcome-based capabilities
      if (event.category === 'outcome' && event.type === 'goal_completed') {
        capabilities.add('goal_oriented');
      }
    });
    
    return Array.from(roles).map(role => ({
      role,
      required_capabilities: Array.from(capabilities),
      optional_capabilities: Array.from(optionalCapabilities),
      context_requirements: Array.from(contextRequirements)
    }));
  }

  public updateLearningMetrics(templateId: string, events: AnalyticsEvent[]) {
    const template = this.scenarios.get(templateId);
    if (!template) return;
    
    // Update metrics based on recent interaction
    template.learningMetrics = {
      completion_rate: this.calculateCompletionRate(events),
      avg_duration: this.calculateAverageDuration(events),
      user_satisfaction: this.calculateUserSatisfaction(events),
      context_maintenance: this.calculateContextMaintenance(events)
    };
    
    this.scenarios.set(templateId, template);
  }

  public calculateCompletionRate(events: AnalyticsEvent[]): number {
    // Implement completion rate calculation
    return events.filter(e => e.category === 'outcome' && e.type === 'goal_completed').length / 
           events.filter(e => e.category === 'outcome').length || 0;
  }

  public calculateAverageDuration(events: AnalyticsEvent[]): number {
    // Implement average duration calculation
    const durations = events.filter(e => e.category === 'outcome' && e.data.duration)
                          .map(e => e.data.duration);
    return durations.length ? durations.reduce((sum, d) => sum + d, 0) / durations.length : 0;
  }

  public calculateUserSatisfaction(events: AnalyticsEvent[]): number {
    // Implement user satisfaction calculation
    const satisfactionEvents = events.filter(e => e.category === 'outcome' && e.data.satisfaction);
    return satisfactionEvents.length ? 
           satisfactionEvents.reduce((sum, e) => sum + e.data.satisfaction, 0) / satisfactionEvents.length : 0;
  }

  public calculateContextMaintenance(events: AnalyticsEvent[]): number {
    // Implement context maintenance calculation
    const contextEvents = events.filter(e => e.category === 'interaction' && e.metadata?.scenarioContext);
    if (!contextEvents.length) return 0;
    
    let maintainedCount = 0;
    for (let i = 1; i < contextEvents.length; i++) {
      const prev = contextEvents[i - 1].metadata?.scenarioContext;
      const curr = contextEvents[i].metadata?.scenarioContext;
      if (prev?.domain === curr?.domain && 
          JSON.stringify(prev?.intent) === JSON.stringify(curr?.intent)) {
        maintainedCount++;
      }
    }
    return maintainedCount / (contextEvents.length - 1) || 0;
  }
} 