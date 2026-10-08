import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      roadmap,
      knownNode,
      career,
      level,
      hours,
      months,
    } = body;

    if (!roadmap || !knownNode || !career) {
      return NextResponse.json(
        { error: "Roadmap, known milestone and career are required." },
        { status: 400 }
      );
    }

    const prompt = `
You are an expert career-roadmap architect.

The user is building a personalized roadmap toward:

Target career: ${career}
Current level: ${level}
Study time: ${hours} hours per week
Timeline: ${months} months

The user has already completed or already knows this milestone:

${knownNode.title}

Description:
${knownNode.description}
The known milestone has this exact ID:
${knownNode.id}

Keep this exact ID in the returned roadmap so the frontend can recognize it as completed.

Here is the current roadmap:

${JSON.stringify(roadmap)}

IMPORTANT ROADMAP LOCK:
The roadmap is ordered from the beginning of the user's journey toward the target career.

The known milestone is:
${knownNode.title}

Its exact ID is:
${knownNode.id}

Find the known milestone in the current roadmap.

EVERY node that appears BEFORE the known milestone is LOCKED.
You must copy those nodes EXACTLY as they are.
Do not change their:
- id
- title
- description
- type
- phase
- estimated_time

The known milestone itself is also LOCKED.
Copy it EXACTLY as it is.

ONLY nodes that appear AFTER the known milestone may be changed, removed, replaced, or added.

The connections involving the locked nodes should also remain logically consistent.

This is critical: do NOT regenerate the earlier part of the roadmap.

Now intelligently REPLAN the roadmap.
IMPORTANT:
The known milestone must remain in the returned roadmap.
Do not remove it.
Keep its exact id, title, description, type, phase, and estimated_time.
Treat it as already completed.
Re-route or replace the milestones that come after it.

Requirements:
- Keep every milestone that comes before the known milestone unchanged.
- Keep the known milestone unchanged and treat it as completed.
- Only replan, replace, or add milestones that come AFTER the known milestone.
- Do not modify or remove any earlier milestone.
- Do not modify the known milestone's id, title, description, type, phase, or estimated_time.
- The updated roadmap should feel like the user is continuing from the known milestone, not restarting their career path.
- Keep the roadmap realistic for the user's available time.
- Keep concrete projects, intermediate roles and interview preparation where useful.
- The roadmap must remain logically connected toward the target career.
- The updated roadmap must be different when the known skill makes later steps unnecessary.
- Do not simply return the same roadmap.

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

    const updatedRoadmap = JSON.parse(text);
    const knownNodeExists = updatedRoadmap.nodes.some(
  (node: any) => node.id === knownNode.id
);

if (!knownNodeExists) {
  updatedRoadmap.nodes.unshift({
    ...knownNode,
  });
}

    return NextResponse.json(updatedRoadmap);
  } catch (error) {
    console.error("Replan error:", error);

    return NextResponse.json(
      { error: "Failed to replan roadmap." },
      { status: 500 }
    );
  }
}