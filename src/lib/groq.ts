import "server-only";

import Groq from "groq-sdk";

let groqClient: Groq | null = null;

export function getGroqClient() {
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY is missing");
  }

  if (!groqClient) {
    groqClient = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
  }

  return groqClient;
}

export const GROQ_MODEL = "openai/gpt-oss-120b";