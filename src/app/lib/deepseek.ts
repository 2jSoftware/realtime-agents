export const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/beta/v1/chat/completions";

export interface DeepSeekMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface DeepSeekConfig {
  model: string;
  messages: DeepSeekMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' } | { type: 'text' };
}

export async function callDeepSeek(config: DeepSeekConfig) {
  const response = await fetch(DEEPSEEK_API_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: config.model || "deepseek-chat",
      messages: config.messages,
      temperature: config.temperature || 0.7,
      max_tokens: config.max_tokens || 2000,
      response_format: config.response_format || { type: 'text' }
    })
  });

  if (!response.ok) {
    throw new Error(`DeepSeek API error: ${response.statusText}`);
  }

  return response.json();
}

export const LANGFLOW_SYSTEM_PROMPT = `You are an expert in creating Langflow components. Your role is to help users design and implement production-ready components that follow best practices.

When designing components:
1. Focus on reusability and modularity
2. Implement proper error handling
3. Add clear documentation
4. Follow Langflow's component patterns
5. Consider performance implications

For each component request:
1. Analyze the requirements
2. Suggest appropriate input/output parameters
3. Generate clean, well-documented code
4. Provide usage examples
5. Include validation logic`;

export function createLangflowPrompt(componentType: string, componentName: string, inputs: any[], outputs: any[]) {
  return {
    role: "user" as const,
    content: `Create a ${componentType} component named ${componentName} with the following specifications:

Inputs:
${JSON.stringify(inputs, null, 2)}

Outputs:
${JSON.stringify(outputs, null, 2)}

Please provide:
1. Complete component implementation
2. Input validation
3. Error handling
4. Usage examples
5. Integration guidance`
  };
} 