import { NextResponse } from "next/server";

export async function POST() {
  // 1. Check for API key
  if (!process.env.OPENAI_API_KEY) {
    console.error("Error: OPENAI_API_KEY environment variable is missing.");
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  // 2. Fetch session from OpenAI
  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-realtime-preview",
      voice: "alloy",
      modalities: ["audio", "text"],
    }),
  });

  // 3. Handle OpenAI API errors safely
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`OpenAI API Error (${response.status}):`, errorText);
    return NextResponse.json({ error: "OpenAI API failed", details: errorText }, { status: response.status });
  }

  // 4. Return successful data
  const data = await response.json();
  return NextResponse.json(data);
}