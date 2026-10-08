import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const career = body.career;
    const level = body.level;
    const hours = body.hours;
    const months = body.months;

    if (!career) {
      return NextResponse.json(
        { error: "Career goal is required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert career-roadmap architect.

Create a realistic, personalized career roadmap for:

Target career: ${career}
Current level: ${level}
Available study time: ${hours} hours per week
Target timeline: ${months} months

The roadmap must be practical and specific, not generic.

Include:
- Skills that are actually relevant to the target role
- Logical learning phases
- Realistic intermediate roles where useful
- Concrete projects that can become portfolio/GitHub proof
- Relevant certifications only when genuinely useful
- Interview preparation
- Job/application preparation

Return ONLY valid JSON in exactly this structure:

{
  "career_goal": "string",
  "timeline": "string",
  "summary": "string",
  "nodes": [
    {
      "id": "unique-string",
      "title": "short milestone title",
      "description": "short explanation",
      "type": "skill | project | role | interview | milestone",
      "phase": "phase name",
      "estimated_time": "string"
    }
  ],
  "connections": [
    {
      "from": "node id",
      "to": "node id"
    }
  ]
}

Create 8 to 12 nodes.

Make the roadmap feel like a real career decision tree, not a simple linear checklist.

Include meaningful branching where appropriate:
- foundational skills can lead to different specialization paths
- projects should connect to the skills they demonstrate
- some milestones can have more than one prerequisite
- later milestones should clearly depend on earlier milestones

Do not add branches just for visual effect. Every connection must make career sense.

The roadmap must be specifically tailored to the target career, current level, available weekly hours, and timeline.

The connections must form a logical progression from beginner/current level toward the target career.

Do not use markdown.
Do not wrap the JSON in backticks.
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

    const roadmap = JSON.parse(text);

    return NextResponse.json(roadmap);
  } catch (error) {
    console.error("Roadmap generation error:", error);

    return NextResponse.json(
      { error: "Failed to generate roadmap." },
      { status: 500 }
    );
  }
}