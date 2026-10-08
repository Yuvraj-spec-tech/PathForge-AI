import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { career, nodeTitle, nodeDescription, currentLevel } = body;

    if (!career || !nodeTitle) {
      return NextResponse.json(
        { error: "Career and milestone are required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert career coach.

The user's target career is:
${career}

The user is currently:
${currentLevel}

They clicked this roadmap milestone:
${nodeTitle}

Milestone description:
${nodeDescription}

Give highly practical, specific advice for completing this milestone.

Return ONLY valid JSON in exactly this structure:

{
  "what_to_learn": ["string", "string", "string"],
  "weekend_project": "string",
  "github_idea": "string",
  "interview_questions": ["string", "string", "string"],
  "next_action": "string"
}

Keep the advice realistic for a college student.
Avoid generic motivational advice.
Do not use markdown.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text;

    if (!text) {
      return NextResponse.json(
        { error: "AI returned an empty response." },
        { status: 500 }
      );
    }

    const advice = JSON.parse(text);

    return NextResponse.json(advice);
  } catch (error) {
    console.error("Node advice error:", error);

    return NextResponse.json(
      { error: "Failed to generate milestone advice." },
      { status: 500 }
    );
  }
}