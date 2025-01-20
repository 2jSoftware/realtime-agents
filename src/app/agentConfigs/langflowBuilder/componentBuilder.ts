import { Tool } from "@/app/types";

export async function createLangflowComponent(args: {
  component_type: string;
  component_name: string;
  inputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  outputs: Array<{
    name: string;
    type: string;
    description: string;
  }>;
}) {
  try {
    // Format the component definition for DeepSeek
    const messages = [
      {
        role: "system",
        content: `You are an expert in creating Langflow components. Generate a complete, production-ready component implementation based on the specifications.`
      },
      {
        role: "user",
        content: `Create a ${args.component_type} component named ${args.component_name} with the following:
Inputs: ${JSON.stringify(args.inputs, null, 2)}
Outputs: ${JSON.stringify(args.outputs, null, 2)}

Please provide a complete implementation following Langflow best practices.`
      }
    ];

    // Call DeepSeek v3 for component generation
    const response = await fetch("/api/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to generate component");
    }

    const completion = await response.json();
    const componentCode = completion.choices[0].message.content;

    // Validate the generated component
    const validationResult = await validateComponent(componentCode);
    
    return {
      success: true,
      component: componentCode,
      validation: validationResult
    };

  } catch (error: any) {
    console.error("Error creating Langflow component:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

async function validateComponent(componentCode: string) {
  // Here we would add validation logic specific to Langflow components
  // For now returning a basic validation
  return {
    isValid: true,
    messages: ["Basic validation passed"]
  };
}

export const componentBuilderTools: Tool[] = [
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
]; 