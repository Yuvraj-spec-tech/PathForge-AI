"use client";

import { useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type RoadmapNode = {
  id: string;
  title: string;
  description: string;
  type: string;
  phase: string;
  estimated_time: string;
};
function getNodePositions(
  nodes: RoadmapNode[],
  connections: { from: string; to: string }[]
) {
  const incoming = new Map<string, string[]>();

  nodes.forEach((node) => {
    incoming.set(node.id, []);
  });

  connections.forEach(({ from, to }) => {
    incoming.get(to)?.push(from);
  });

  const depth = new Map<string, number>();

  function getDepth(id: string, visiting = new Set<string>()): number {
    if (depth.has(id)) return depth.get(id)!;
    if (visiting.has(id)) return 0;

    visiting.add(id);

    const parents = incoming.get(id) ?? [];

    if (parents.length === 0) {
      depth.set(id, 0);
      return 0;
    }

    const currentDepth =
      Math.max(
        ...parents.map((parent) =>
          getDepth(parent, new Set(visiting))
        )
      ) + 1;

    depth.set(id, currentDepth);
    return currentDepth;
  }

  nodes.forEach((node) => getDepth(node.id));

  const columns = new Map<number, RoadmapNode[]>();

  nodes.forEach((node) => {
    const d = depth.get(node.id) ?? 0;

    if (!columns.has(d)) {
      columns.set(d, []);
    }

    columns.get(d)!.push(node);
  });

  const positions = new Map<
    string,
    { x: number; y: number }
  >();

  columns.forEach((columnNodes, column) => {
    columnNodes.forEach((node, index) => {
      positions.set(node.id, {
  x: (index - (columnNodes.length - 1) / 2) * 300,
  y: column * 260,
});
    });
  });

  return positions;
}
type Roadmap = {
  career_goal: string;
  timeline: string;
  summary: string;
  nodes: RoadmapNode[];
  connections: {
    from: string;
    to: string;
  }[];
};

export default function Home() {
  const [career, setCareer] = useState("");
  const [level, setLevel] = useState("College Student");
  const [hours, setHours] = useState("10");
  const [months, setMonths] = useState("6");

  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null);
  const [knownNodes, setKnownNodes] = useState<string[]>([]);
  const [nodeAdvice, setNodeAdvice] = useState<any>(null);
const [adviceLoading, setAdviceLoading] = useState(false);
const completedCount = knownNodes.length;
const totalCount = roadmap?.nodes.length ?? 0;
const progressPercent =
  totalCount > 0
    ? Math.round((completedCount / totalCount) * 100)
    : 0;

  async function generateRoadmap() {
    if (!career.trim()) {
      setError("Please enter your dream career.");
      return;
    }

    setLoading(true);
    setError("");
    setRoadmap(null);

    try {
      const response = await fetch("/api/roadmap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          career,
          level,
          hours,
          months,
        }),
      });

      const data = await response.json();

      console.log("AI ROADMAP:", JSON.stringify(data, null, 2));

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      setRoadmap(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to generate roadmap."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">
      {/* NAVBAR */}
      <nav className="border-b border-white/10 bg-[#070b18]/90 px-6 py-5">
        <div className="mx-auto flex w-full items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              PathForge <span className="text-indigo-400">AI</span>
            </h1>
            <p className="text-xs text-gray-500">
              Your dream job. Reverse-engineered.
            </p>
          </div>

          <div className="hidden rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300 sm:block">
            AI Career Navigation
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="mx-auto max-w-7xl px-8 pb-24 pt-20">
        <div className="max-w-3xl">
          <div className="mb-5 inline-flex rounded-full border border-indigo-400/20 bg-indigo-500/10 px-4 py-2 text-sm text-indigo-300">
            AI-powered career navigation
          </div>

          <h2 className="text-5xl font-bold leading-tight tracking-tight sm:text-6xl">
            Your dream job.
            <br />
            <span className="text-indigo-400">Reverse-engineered.</span>
          </h2>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-gray-400">
            Tell PathForge exactly where you want to go. Our AI breaks the
            destination into skills, projects, roles and milestones that form
            your personalized career path.
          </p>
        </div>

        {/* FORM */}
        <div className="mt-12 rounded-3xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl sm:p-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                What is your dream job?
              </label>

              <input
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                placeholder="e.g. Data Analyst at a fintech startup"
                className="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-4 text-white outline-none transition focus:border-indigo-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Current level
              </label>

              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101526] px-4 py-4 text-white outline-none"
              >
                <option>College Student</option>
                <option>Beginner</option>
                <option>Intermediate</option>
                <option>Working Professional</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Hours per week
              </label>

              <select
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101526] px-4 py-4 text-white outline-none"
              >
                <option value="5">5 hours</option>
                <option value="10">10 hours</option>
                <option value="15">15 hours</option>
                <option value="20">20 hours</option>
                <option value="30">30+ hours</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Target timeline
              </label>

              <select
                value={months}
                onChange={(e) => setMonths(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[#101526] px-4 py-4 text-white outline-none"
              >
                <option value="3">3 months</option>
                <option value="6">6 months</option>
                <option value="9">9 months</option>
                <option value="12">12 months</option>
                <option value="18">18 months</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-5 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          )}

          <button
            onClick={generateRoadmap}
            disabled={loading}
            className="mt-7 w-full rounded-xl bg-indigo-500 px-6 py-4 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "AI is building your roadmap..."
              : "Generate My Career Roadmap →"}
          </button>

          <p className="mt-3 text-center text-xs text-gray-500">
            Your roadmap is generated dynamically by AI based on your inputs.
          </p>
        </div>

        {/* AI ROADMAP */}
        {roadmap && (          
          <section className="mt-16">
            <div className="mb-8">
              <p className="text-sm font-medium text-indigo-400">
                YOUR AI-GENERATED PATH
              </p>

              <h3 className="mt-2 text-3xl font-bold">
                {roadmap.career_goal}
              </h3>

              <p className="mt-3 max-w-3xl text-gray-400">
                {roadmap.summary}
              </p>

              <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300">
                Target timeline: {roadmap.timeline}
              </div>
              <p className="mb-4 text-xs text-gray-500">
  🤖 AI-generated roadmap. PathForge AI uses your inputs to generate and
  continuously adapt your career path.
</p>
            </div>

            <p className="mb-4 text-xs text-gray-500">
  🤖 AI-generated roadmap. PathForge AI uses your inputs to generate and
  continuously adapt your career path.
</p>
            <div className="h-[750px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]">
              <ReactFlow
              proOptions={{ hideAttribution: true }}
                nodes={roadmap.nodes.map((node, index) => ({
                  id: node.id,
                  className: knownNodes.includes(node.id)
  ? "border-2 border-green-400 opacity-70"
  : "",
                  position: getNodePositions(roadmap.nodes, roadmap.connections).get(node.id) ?? {
  x: 0,
  y: 0,
},
                  data: {
                    label: (
                      <div className="w-full">
                        <div className="mb-2 text-xs font-medium uppercase tracking-wider text-indigo-400">
                          {node.type}
                        </div>

                        <div className="text-base font-semibold text-white">
                          {node.title}
                        </div>

                        <div className="mt-2 text-xs leading-5 text-gray-400">
                          {node.description}
                        </div>

                        <div className="mt-3 text-xs text-gray-500">
                          {node.phase} • {node.estimated_time}
                        </div>
                      </div>
                    ),
                  },
                  style: {
  width: 280,
  borderRadius: 18,
  border: knownNodes.includes(node.id)
    ? "2px solid #22c55e"
    : "1px solid rgba(129, 140, 248, 0.3)",
  background: knownNodes.includes(node.id)
    ? "#10251a"
    : "#101526",
  color: "white",
  padding: 18,
  opacity: knownNodes.includes(node.id) ? 0.85 : 1,
},
                }))}
                edges={roadmap.connections.map((connection) => ({
                  id: `${connection.from}-${connection.to}`,
                  source: connection.from,
                  target: connection.to,
                  animated: true,
                  style: {
                    stroke: "#818cf8",
                    strokeWidth: 2,
                  },
                                }))}
                onNodeClick={async (_, node) => {
  const selected = roadmap.nodes.find(
    (item) => item.id === node.id
  );

  if (!selected) return;

  setSelectedNode(selected);
  setNodeAdvice(null);
  setAdviceLoading(true);

  try {
    const response = await fetch("/api/node-advice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        career: roadmap.career_goal,
        nodeTitle: selected.title,
        nodeDescription: selected.description,
        currentLevel: level,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to get AI advice.");
    }

    setNodeAdvice(data);
  } catch (error) {
    console.error("Node advice error:", error);
  } finally {
    setAdviceLoading(false);
  }
}}
                fitView
                minZoom={0.3}
              >
                <Background />
              </ReactFlow>
            </div>
          </section>  
        )}
        {selectedNode && (
  <div className="mt-8 rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-6">
    <h4 className="text-2xl font-bold">
      {selectedNode.title}
    </h4>

    {adviceLoading && (
      <p className="mt-4 text-indigo-300">
        AI is preparing actionable advice...
      </p>
    )}

    {nodeAdvice && (
      <div className="mt-6 space-y-5">
        <div>
          <h5 className="font-semibold text-indigo-300">
            What to learn
          </h5>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
            {nodeAdvice.what_to_learn?.map(
              (item: string, index: number) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>
        </div>

        <div>
          <h5 className="font-semibold text-indigo-300">
            Weekend project
          </h5>
          <p className="mt-2 text-sm text-gray-400">
            {nodeAdvice.weekend_project}
          </p>
        </div>

        <div>
          <h5 className="font-semibold text-indigo-300">
            GitHub idea
          </h5>
          <p className="mt-2 text-sm text-gray-400">
            {nodeAdvice.github_idea}
          </p>
        </div>

        <div>
          <h5 className="font-semibold text-indigo-300">
            Interview questions
          </h5>

          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
            {nodeAdvice.interview_questions?.map(
              (item: string, index: number) => (
                <li key={index}>{item}</li>
              )
            )}
          </ul>
        </div>

        <div className="rounded-xl bg-indigo-500/10 p-4">
          <h5 className="font-semibold text-indigo-300">
            Your next action
          </h5>
          <p className="mt-2 text-sm text-gray-300">
            {nodeAdvice.next_action}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

  {/* OPTION 1: COMPLETED */}
  <button
    onClick={() => {
      if (!selectedNode || !roadmap) return;

      // Mark current milestone as completed
      setKnownNodes((current) =>
        current.includes(selectedNode.id)
          ? current
          : [...current, selectedNode.id]
      );

      // Find the next milestone connected to this one
      const nextConnection = roadmap.connections.find(
        (connection) => connection.from === selectedNode.id
      );

      const nextNode = nextConnection
        ? roadmap.nodes.find(
            (node) => node.id === nextConnection.to
          )
        : null;

      // Move the user to the next milestone
      if (nextNode) {
        setSelectedNode(nextNode);
        setNodeAdvice(null);
      } else {
        setSelectedNode(null);
        setNodeAdvice(null);
      }
    }}
    className="w-full rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-left transition hover:bg-green-500/20"
  >
    <div className="font-semibold text-green-300">
      ✓ I've completed this
    </div>
    <div className="mt-1 text-xs text-gray-400">
      Mark it complete and continue to the next milestone.
    </div>
  </button>

  {/* OPTION 2: ALREADY KNOW → REPLAN */}
  <button
    onClick={async () => {
      if (!selectedNode || !roadmap) return;

      setKnownNodes((current) =>
        current.includes(selectedNode.id)
          ? current
          : [...current, selectedNode.id]
      );

      setAdviceLoading(true);

      try {
        const response = await fetch("/api/replan", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roadmap,
            knownNode: selectedNode,
            career: roadmap.career_goal,
            level,
            hours,
            months,
          }),
        });

        const updatedRoadmap = await response.json();

        if (!response.ok) {
          throw new Error(
            updatedRoadmap.error ||
              "Failed to replan roadmap."
          );
        }

        setRoadmap(updatedRoadmap);
        setSelectedNode(null);
        setNodeAdvice(null);
      } catch (error) {
        console.error("Replan error:", error);
      } finally {
        setAdviceLoading(false);
      }
    }}
    className="w-full rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-left transition hover:bg-indigo-500/20"
  >
    <div className="font-semibold text-indigo-300">
      🧠 I already know this — Replan my roadmap
    </div>
    <div className="mt-1 text-xs text-gray-400">
      Skip this skill and let AI adapt the remaining path.
    </div>
  </button>

</div>
      </div>
    )} 
  </div>
)}
        {/* FEATURES */}
        {!roadmap && (
          <section className="mt-20 grid gap-5 md:grid-cols-3">
            <Feature
              title="Reverse Engineer"
              text="Start with a hyper-specific dream role and work backwards to discover what actually gets you there."
            />

            <Feature
              title="AI Generated"
              text="Every roadmap is created dynamically from your goal, current level, available time and deadline."
            />

            <Feature
              title="Actionable"
              text="Turn abstract career advice into skills, projects, roles and interview preparation."
            />
          </section>
        )}
      </section>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-gray-600">
        PathForge AI • Your dream job. Reverse-engineered.
      </footer>
    </main>
  );
}

function Feature({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-gray-400">{text}</p>
    </div>
  );
}