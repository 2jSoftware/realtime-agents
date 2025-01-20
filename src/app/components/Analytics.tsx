import React from 'react';
import { analyticsLogger, AnalyticsEvent, InteractionPattern, OutcomeProjection, ScenarioContext } from '../lib/analyticsLogger';
import type { DelegationMode } from '../App';

interface AnalyticsPanelProps {
  isExpanded?: boolean;
  delegationMode: DelegationMode;
  onDelegationModeChange: (mode: DelegationMode) => void;
}

function Analytics({ isExpanded = true, delegationMode, onDelegationModeChange }: AnalyticsPanelProps) {
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  if (!isExpanded) return null;

  const { interactionInsights, outcomeInsights, recentEvents } = analyticsLogger.getInsights();
  const delegationSuggestions = analyticsLogger.getDelegationSuggestions();

  const renderEvent = (event: AnalyticsEvent) => {
    const getEventColor = (category: string) => {
      switch (category) {
        case 'system': return 'text-blue-400';
        case 'interaction': return 'text-green-400';
        case 'outcome': return 'text-purple-400';
        default: return 'text-[var(--text-primary)]';
      }
    };

    // Create a unique key combining timestamp and event type
    const eventKey = `${event.timestamp}-${event.category}-${event.type}`;

    return (
      <div key={eventKey} className="py-2 hover:bg-[var(--bubble-bg)] transition-colors">
        <div className="flex items-center justify-between">
          <span className={`text-sm ${getEventColor(event.category)}`}>
            {event.category.toUpperCase()} - {event.type}
          </span>
          <span className="text-xs text-[var(--text-secondary)]">
            {new Date(event.timestamp).toLocaleTimeString()}
          </span>
        </div>
        {event.metadata?.scenarioContext && (
          <div className="mt-1 text-xs text-[var(--text-secondary)]">
            <div>Domain: {event.metadata.scenarioContext.domain}</div>
            <div>Intent: {event.metadata.scenarioContext.intent.join(', ')}</div>
            <div>Complexity: {event.metadata.scenarioContext.complexity}</div>
          </div>
        )}
        <div className="mt-1 text-sm text-[var(--text-primary)]">
          <pre className="whitespace-pre-wrap break-words font-mono text-xs bg-[var(--input-bg)] p-2 rounded-lg">
            {JSON.stringify(event.data, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  const renderInteractionPattern = (pattern: InteractionPattern | null) => {
    if (!pattern) return null;
    return (
      <div className="mb-4 space-y-3">
        <div className="p-3 bg-[var(--input-bg)] rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Interaction Context</h3>
          <div className="text-sm text-[var(--text-secondary)]">
            <div>Domain: {pattern.contextualDomain}</div>
            <div>Primary Intent: {pattern.primaryIntent}</div>
            <div>Secondary Intents: {pattern.secondaryIntents.join(', ')}</div>
          </div>
        </div>

        <div className="p-3 bg-[var(--input-bg)] rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Knowledge Requirements</h3>
          <div className="text-sm text-[var(--text-secondary)]">
            <div>Domains: {pattern.knowledgeRequirements.domains.join(', ')}</div>
            <div>Depth: {pattern.knowledgeRequirements.depth}</div>
            <div>Temporal: {pattern.knowledgeRequirements.temporalRelevance}</div>
          </div>
        </div>

        <div className="p-3 bg-[var(--input-bg)] rounded-lg">
          <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Interaction Style</h3>
          <div className="text-sm text-[var(--text-secondary)]">
            <div>Formality: {pattern.interactionStyle.formality}</div>
            <div>Detail Level: {pattern.interactionStyle.detailLevel}</div>
            <div>Format: {pattern.interactionStyle.preferredFormat.join(', ')}</div>
          </div>
        </div>

        {pattern.userContext && (
          <div className="p-3 bg-[var(--input-bg)] rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">User Context</h3>
            <div className="text-sm text-[var(--text-secondary)]">
              <div>Expertise: {pattern.userContext.expertise}</div>
              <div>Goal Clarity: {pattern.userContext.goalClarity}</div>
              <div>Engagement: {pattern.userContext.engagementStyle}</div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOutcomeProjections = (projections: OutcomeProjection[]) => {
    if (!projections.length) return null;
    return (
      <div className="mb-4 space-y-3">
        {projections.map((projection, index) => (
          <div key={index} className="space-y-2">
            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Goals & Capabilities</h3>
              <div className="text-sm text-[var(--text-secondary)]">
                <div>Immediate: {projection.immediateGoal}</div>
                <div>Contextual: {projection.contextualGoals.join(', ')}</div>
                <div>Required: {projection.requiredCapabilities.join(', ')}</div>
              </div>
            </div>

            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Success Criteria</h3>
              <div className="text-sm text-[var(--text-secondary)]">
                <div>Primary: {projection.successCriteria.primary.join(', ')}</div>
                <div>Secondary: {projection.successCriteria.secondary.join(', ')}</div>
              </div>
            </div>

            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Risk Analysis</h3>
              <div className="text-sm text-[var(--text-secondary)]">
                {projection.riskFactors.map((risk, i) => (
                  <div key={i} className="mb-1">
                    {risk.type}: {risk.likelihood}/{risk.impact} impact
                    {risk.mitigationStrategy && ` - ${risk.mitigationStrategy}`}
                  </div>
                ))}
              </div>
            </div>

            {projection.delegationHints.suggestedAgents.length > 0 && (
              <div className="p-3 bg-[var(--input-bg)] rounded-lg">
                <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Delegation Hints</h3>
                <div className="text-sm text-[var(--text-secondary)]">
                  <div>Agents: {projection.delegationHints.suggestedAgents.join(', ')}</div>
                  <div>Confidence: {projection.delegationHints.confidenceScore}</div>
                  <div>Reasoning: {projection.delegationHints.reasoning.join(', ')}</div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderDelegationPanel = () => {
    return (
      <div className="mb-4 space-y-3">
        <div className="flex items-center justify-between p-3 bg-[var(--input-bg)] rounded-lg">
          <div className="flex items-center gap-4">
            <h3 className="text-sm font-medium text-[var(--text-primary)]">Delegation Mode</h3>
            <button
              onClick={() => {
                if (delegationMode === 'manual' && !window.confirm(
                  'Auto-delegation is experimental and requires 95% confidence with multiple supporting factors. ' +
                  'It cannot be undone. Are you sure you want to enable it?'
                )) {
                  return;
                }
                onDelegationModeChange(delegationMode === 'manual' ? 'auto' : 'manual');
              }}
              className={`px-3 py-1 rounded-md text-sm transition-colors ${
                delegationMode === 'auto' 
                  ? 'bg-red-600 text-white' 
                  : 'bg-[var(--bubble-bg)] text-[var(--text-primary)]'
              }`}
            >
              {delegationMode === 'auto' ? '⚠️ Auto (Experimental)' : 'Manual'}
            </button>
          </div>
          <button
            onClick={() => setShowSuggestions(show => !show)}
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {showSuggestions ? 'Hide Suggestions' : 'Show Suggestions'}
          </button>
        </div>

        {showSuggestions && (
          <div className="p-3 bg-[var(--input-bg)] rounded-lg">
            <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Agent Suggestions</h3>
            {delegationMode === 'auto' && (
              <div className="mb-2 p-2 bg-red-500/10 text-red-500 rounded text-sm">
                Auto-delegation requires:
                <ul className="list-disc list-inside mt-1">
                  <li>95% confidence threshold</li>
                  <li>At least 3 supporting reasons</li>
                  <li>90% context match across all factors</li>
                </ul>
              </div>
            )}
            <div className="text-sm text-[var(--text-secondary)]">
              {delegationSuggestions.suggestedAgents.length > 0 ? (
                <>
                  <div>Suggested Agents: {delegationSuggestions.suggestedAgents.join(', ')}</div>
                  <div>
                    Confidence: {(delegationSuggestions.confidence * 100).toFixed(1)}%
                    {delegationMode === 'auto' && delegationSuggestions.confidence <= 0.95 && (
                      <span className="text-red-500 ml-2">(Below auto threshold)</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <div className="font-medium mb-1">Reasoning:</div>
                    <ul className="list-disc list-inside">
                      {delegationSuggestions.reasoning.map((reason, i) => (
                        <li key={i}>{reason}</li>
                      ))}
                    </ul>
                    {delegationMode === 'auto' && delegationSuggestions.reasoning.length < 3 && (
                      <div className="text-red-500 mt-1">
                        Need {3 - delegationSuggestions.reasoning.length} more supporting reasons for auto-delegation
                      </div>
                    )}
                  </div>
                  {Object.entries(delegationSuggestions.contextMatch).length > 0 && (
                    <div className="mt-2">
                      <div className="font-medium mb-1">Context Match Scores:</div>
                      {Object.entries(delegationSuggestions.contextMatch).map(([factor, score]) => (
                        <div key={factor} className="flex items-center justify-between">
                          <span>{factor}:</span>
                          <span className={score < 0.9 ? 'text-red-500' : 'text-green-500'}>
                            {(score * 100).toFixed(1)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="italic">Gathering more context for suggestions...</div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border border-[var(--border)] rounded-xl shadow-lg">
      <div className="font-semibold px-6 py-4 border-b border-[var(--border)]">
        Scenario Analytics
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {renderDelegationPanel()}
        {renderInteractionPattern(interactionInsights)}
        {renderOutcomeProjections(outcomeInsights)}
        <div className="mb-4">
          <h3 className="text-sm font-medium mb-2 text-[var(--text-primary)]">Event Timeline</h3>
          <div className="divide-y divide-[var(--border)]">
            {recentEvents.map(renderEvent)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics; 