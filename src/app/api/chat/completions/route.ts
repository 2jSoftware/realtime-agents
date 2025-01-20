import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI();

// Add DeepSeek API configuration
const DEEPSEEK_API_ENDPOINT = "https://api.deepseek.com/beta/v1/chat/completions";

export async function POST(req: Request) {
  try {
    const { model, messages, temperature, max_tokens, response_format } = await req.json();

    // Handle DeepSeek models
    if (model.startsWith("deepseek")) {
      if (!process.env.DEEPSEEK_API_KEY) {
        return NextResponse.json({ error: "DeepSeek API key not configured" }, { status: 500 });
      }

      const response = await fetch(DEEPSEEK_API_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages,
          temperature: temperature || 0.7,
          max_tokens: max_tokens || 2000,
          response_format: response_format || { type: 'text' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      return NextResponse.json(data);
    }

    // Handle OpenAI models
    const completion = await openai.chat.completions.create({
      model,
      messages,
      temperature: temperature || 1,
      max_tokens: max_tokens || 1000
    });

    return NextResponse.json(completion);
  } catch (error: any) {
    console.error("Error in /chat/completions:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
