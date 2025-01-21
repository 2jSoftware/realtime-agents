import React, { useState } from 'react';
import { AdvancedAnalytics } from '../lib/advancedAnalytics';
import { analyticsLogger } from '../lib/analyticsLogger';

interface AdvancedAnalyticsPanelProps {
  isExpanded?: boolean;
}

const advancedAnalytics = new AdvancedAnalytics();

function AdvancedAnalyticsPanel({ isExpanded = true }: AdvancedAnalyticsPanelProps) {
  const [activeTab, setActiveTab] = useState<'templates' | 'conclusions' | 'metrics'>('templates');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  if (!isExpanded) return null;

  const events = analyticsLogger.getEvents();
  const currentConclusion = advancedAnalytics.identifyNaturalConclusion(events);
  
  const renderTemplatesTab = () => {
    const template = selectedTemplateId 
      ? advancedAnalytics.scenarios.get(selectedTemplateId)
      : null;

    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">Scenario Templates</h3>
          <button 
            onClick={() => advancedAnalytics.generateScenarioTemplate(events)}
            className="px-3 py-1 bg-blue-500 text-white rounded-md text-sm"
          >
            Generate New Template
          </button>
        </div>

        {template && (
          <div className="space-y-3">
            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h4 className="font-medium mb-2">{template.name}</h4>
              <p className="text-sm text-[var(--text-secondary)]">{template.description}</p>
            </div>

            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h4 className="font-medium mb-2">Agent Placeholders</h4>
              {template.agentPlaceholders.map((agent, idx) => (
                <div key={idx} className="mb-2 text-sm">
                  <div className="font-medium">{agent.role}</div>
                  <div className="text-[var(--text-secondary)]">
                    Required: {agent.required_capabilities.join(', ')}
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    Optional: {agent.optional_capabilities.join(', ')}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-[var(--input-bg)] rounded-lg">
              <h4 className="font-medium mb-2">Learning Metrics</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Completion Rate: {(template.learningMetrics.completion_rate * 100).toFixed(1)}%</div>
                <div>Avg Duration: {template.learningMetrics.avg_duration.toFixed(1)}s</div>
                <div>User Satisfaction: {(template.learningMetrics.user_satisfaction * 100).toFixed(1)}%</div>
                <div>Context Maintenance: {(template.learningMetrics.context_maintenance * 100).toFixed(1)}%</div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderConclusionsTab = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Natural Conclusions</h3>
        
        {currentConclusion && (
          <div className="p-3 bg-[var(--input-bg)] rounded-lg">
            <h4 className="font-medium mb-2">Current Conclusion</h4>
            <div className="text-sm space-y-1">
              <div>Type: {currentConclusion.type}</div>
              <div>Confidence: {(currentConclusion.confidence * 100).toFixed(1)}%</div>
              <div>Indicators:</div>
              <ul className="list-disc list-inside">
                {currentConclusion.indicators.map((indicator, idx) => (
                  <li key={idx}>{indicator}</li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderMetricsTab = () => {
    const events = analyticsLogger.getEvents();
    const patterns = advancedAnalytics.extractInteractionPatterns(events);
    const metrics = {
      completionRate: advancedAnalytics.calculateCompletionRate(events),
      avgDuration: advancedAnalytics.calculateAverageDuration(events),
      userSatisfaction: advancedAnalytics.calculateUserSatisfaction(events),
      contextMaintenance: advancedAnalytics.calculateContextMaintenance(events)
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Learning Metrics</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-[var(--input-bg)] rounded-lg">
            <h4 className="font-medium mb-2">Topic Clusters</h4>
            <div className="space-y-2">
              {patterns.map((pattern, idx) => (
                <div key={idx} className="text-sm">
                  <div className="font-medium">{pattern.contextualDomain}</div>
                  <div className="text-[var(--text-secondary)]">
                    Primary: {pattern.primaryIntent}
                  </div>
                  <div className="text-[var(--text-secondary)]">
                    Secondary: {pattern.secondaryIntents.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-3 bg-[var(--input-bg)] rounded-lg">
            <h4 className="font-medium mb-2">Pattern Recognition</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Completion Rate: {(metrics.completionRate * 100).toFixed(1)}%</div>
              <div>Avg Duration: {metrics.avgDuration.toFixed(1)}s</div>
              <div>User Satisfaction: {(metrics.userSatisfaction * 100).toFixed(1)}%</div>
              <div>Context Maintenance: {(metrics.contextMaintenance * 100).toFixed(1)}%</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background border border-[var(--border)] rounded-xl shadow-lg">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-1 rounded-md text-sm ${
              activeTab === 'templates'
                ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Templates
          </button>
          <button
            onClick={() => setActiveTab('conclusions')}
            className={`px-3 py-1 rounded-md text-sm ${
              activeTab === 'conclusions'
                ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Conclusions
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1 rounded-md text-sm ${
              activeTab === 'metrics'
                ? 'bg-[var(--bubble-bg)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)]'
            }`}
          >
            Metrics
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'conclusions' && renderConclusionsTab()}
        {activeTab === 'metrics' && renderMetricsTab()}
      </div>
    </div>
  );
}

export default AdvancedAnalyticsPanel; 