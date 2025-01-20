import { AgentConfig } from "@/app/types";
import { injectTransferTools } from "../utils";

const componentBuilder: AgentConfig = {
  name: "langflow_component_builder",
  publicDescription: "Builds Langflow components using DeepSeek v3",
  instructions: `You are a specialized agent for building Langflow components. Your role is to:
1. Understand the user's component requirements
2. Design and implement Langflow components following best practices
3. Validate component structure and functionality
4. Provide guidance on component integration

Ask clarifying questions about:
- Component type (processor, connector, etc.)
- Required inputs and outputs
- Special handling requirements
- Integration points`,
  tools: [
    {
      type: "function",
      name: "createLangflowComponent",
      description: "Creates a new Langflow component with the specified configuration",
      parameters: {
        type: "object",
        properties: {
          component_type: {
            type: "string",
            description: "The type of Langflow component to create",
            enum: ["processor", "connector", "custom"]
          },
          component_name: {
            type: "string",
            description: "Name of the component"
          },
          inputs: {
            type: "array",
            description: "List of input parameters for the component",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                description: { type: "string" }
              }
            }
          },
          outputs: {
            type: "array",
            description: "List of output parameters for the component",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                type: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        },
        required: ["component_type", "component_name", "inputs", "outputs"]
      }
    }
  ]
};

const agents = injectTransferTools([componentBuilder]);

export default agents; 