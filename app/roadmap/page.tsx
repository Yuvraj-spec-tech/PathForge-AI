"use client";

import { useEffect, useState } from "react";
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

  function getDepth(
    id: string,
    visiting = new Set<string>()
  ): number {
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
        x:
          (index - (columnNodes.length - 1) / 2) *
          300,
        y: column * 170,
      });
    });
  });

  return positions;
}

export default function RoadmapPage() {
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [career, setCareer] = useState("");
  const [level, setLevel] = useState("College Student");
  const [hours, setHours] = useState("10");
  const [months, setMonths] = useState("6");

  const [selectedNode, setSelectedNode] =
    useState<RoadmapNode | null>(null);

  const [knownNodes, setKnownNodes] = useState<string[]>([]);
  const [nodeAdvice, setNodeAdvice] = useState<any>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);

  useEffect(() => {
    const savedRoadmap =
      sessionStorage.getItem("pathforge-roadmap");

    const savedSettings =
      sessionStorage.getItem("pathforge-settings");

    if (savedRoadmap) {
      setRoadmap(JSON.parse(savedRoadmap));
    }

    if (savedSettings) {
      const settings = JSON.parse(savedSettings);

      setCareer(settings.career || "");
      setLevel(settings.level || "College Student");
      setHours(settings.hours || "10");
      setMonths(settings.months || "6");
    }
  }, []);

  const completedCount = knownNodes.length;
  const totalCount = roadmap?.nodes.length ?? 0;

  const progressPercent =
    totalCount > 0
      ? Math.round(
          (completedCount / totalCount) * 100
        )
      : 0;

  async function getNodeAdvice(node: RoadmapNode) {
    if (!roadmap) return;

    setSelectedNode(node);
    setNodeAdvice(null);
    setAdviceLoading(true);

    try {
      const response = await fetch(
        "/api/node-advice",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            career: roadmap.career_goal,
            nodeTitle: node.title,
            nodeDescription: node.description,
            currentLevel: level,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to get AI advice."
        );
      }

      setNodeAdvice(data);
    } catch (error) {
      console.error(
        "Node advice error:",
        error
      );
    } finally {
      setAdviceLoading(false);
    }
  }

  function completeNode() {
    if (!selectedNode || !roadmap) return;

    setKnownNodes((current) =>
      current.includes(selectedNode.id)
        ? current
        : [...current, selectedNode.id]
    );

    const nextConnection =
      roadmap.connections.find(
        (connection) =>
          connection.from === selectedNode.id
      );

    const nextNode = nextConnection
      ? roadmap.nodes.find(
          (node) =>
            node.id === nextConnection.to
        )
      : null;

    if (nextNode) {
      getNodeAdvice(nextNode);
    } else {
      setSelectedNode(null);
      setNodeAdvice(null);
    }
  }

  async function replanRoadmap() {
    if (!selectedNode || !roadmap) return;

    setKnownNodes((current) =>
      current.includes(selectedNode.id)
        ? current
        : [...current, selectedNode.id]
    );

    setAdviceLoading(true);

    try {
      const response = await fetch(
        "/api/replan",
        {
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
        }
      );

      const updatedRoadmap =
        await response.json();

      if (!response.ok) {
        throw new Error(
          updatedRoadmap.error ||
            "Failed to replan roadmap."
        );
      }

      setRoadmap(updatedRoadmap);

      sessionStorage.setItem(
        "pathforge-roadmap",
        JSON.stringify(updatedRoadmap)
      );

      setSelectedNode(null);
      setNodeAdvice(null);
    } catch (error) {
      console.error(
        "Replan error:",
        error
      );
    } finally {
      setAdviceLoading(false);
    }
  }

  if (!roadmap) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070b18] text-white">
        <div className="text-center">
          <p className="text-lg text-gray-300">
            Loading your AI roadmap...
          </p>
          <p className="mt-2 text-sm text-gray-500">
            If nothing appears, return to the home page and generate a roadmap again.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070b18] text-white">

      {/* NAVBAR */}

      <nav className="border-b border-white/10 bg-[#070b18]/95 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              PathForge{" "}
              <span className="text-indigo-400">
                AI
              </span>
            </h1>

            <p className="text-xs text-gray-500">
              Your dream job. Reverse-engineered.
            </p>
          </div>

          <button
            onClick={() => {
              window.location.href = "/";
            }}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:bg-white/10"
          >
            ← Back to setup
          </button>

        </div>
      </nav>

      {/* HEADER */}

      <section className="mx-auto max-w-7xl px-6 pt-8">

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>
            <p className="text-sm font-medium text-indigo-400">
              YOUR AI-GENERATED PATH
            </p>

            <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
              {roadmap.career_goal}
            </h2>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-400">
              {roadmap.summary}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div className="text-xs text-gray-500">
              ROADMAP PROGRESS
            </div>

            <div className="mt-2 text-2xl font-bold">
              {progressPercent}%
            </div>

            <div className="mt-2 h-2 w-40 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all"
                style={{
                  width: `${progressPercent}%`,
                }}
              />
            </div>

            <div className="mt-2 text-xs text-gray-500">
              {completedCount} of{" "}
              {totalCount} milestones
            </div>
          </div>

        </div>

        <div className="mt-4 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-gray-400">
          Target timeline: {roadmap.timeline}
        </div>

        <p className="mt-3 text-xs text-gray-500">
          🤖 AI-generated roadmap. PathForge AI uses your inputs to generate and continuously adapt your career path.
        </p>

      </section>

      {/* ROADMAP */}

      <section className="mx-auto max-w-7xl px-6 py-6">

        <div className="h-[calc(100vh-250px)] min-h-[650px] w-full overflow-hidden rounded-3xl border border-white/10 bg-[#0b1020]">

          <ReactFlow
            proOptions={{
              hideAttribution: true,
            }}

            nodes={roadmap.nodes.map(
              (node) => ({
                id: node.id,

                position:
                  getNodePositions(
                    roadmap.nodes,
                    roadmap.connections
                  ).get(node.id) ?? {
                    x: 0,
                    y: 0,
                  },

                data: {
                  label: (
                    <div className="w-full">

                      <div className="mb-2 text-xs font-medium uppercase tracking-wider text-indigo-400">
                        {node.type}
                      </div>

                      <div className="text-sm font-semibold text-white">
                        {node.title}
                      </div>

                      <div className="mt-2 text-xs leading-5 text-gray-400">
                        {node.description}
                      </div>

                      <div className="mt-3 text-xs text-gray-500">
                        {node.phase} •{" "}
                        {node.estimated_time}
                      </div>

                    </div>
                  ),
                },

                style: {
                  width: 280,
                  borderRadius: 18,

                  border:
                    knownNodes.includes(
                      node.id
                    )
                      ? "2px solid #22c55e"
                      : "1px solid rgba(129, 140, 248, 0.3)",

                  background:
                    knownNodes.includes(
                      node.id
                    )
                      ? "#10251a"
                      : "#101526",

                  color: "white",
                  padding: 18,

                  opacity:
                    knownNodes.includes(
                      node.id
                    )
                      ? 0.85
                      : 1,
                },
              })
            )}

            edges={roadmap.connections.map(
              (connection) => ({
                id: `${connection.from}-${connection.to}`,
                source: connection.from,
                target: connection.to,
                animated: true,
                style: {
                  stroke: "#818cf8",
                  strokeWidth: 2,
                },
              })
            )}

            onNodeClick={(_, node) => {
              const selected =
                roadmap.nodes.find(
                  (item) =>
                    item.id === node.id
                );

              if (selected) {
                getNodeAdvice(selected);
              }
            }}

            fitView
            minZoom={0.45}
          >

            <Background />

            <Controls />

            <MiniMap />

          </ReactFlow>

        </div>

      </section>

      {/* AI ADVICE */}

      {selectedNode && (
        <section className="mx-auto max-w-4xl px-6 pb-12">

          <div className="rounded-3xl border border-indigo-400/20 bg-indigo-500/5 p-6">

            <h3 className="text-2xl font-bold">
              {selectedNode.title}
            </h3>

            {adviceLoading && (
              <p className="mt-4 text-indigo-300">
                AI is preparing actionable advice...
              </p>
            )}

            {nodeAdvice && (
              <div className="mt-6 space-y-5">

                <div>
                  <h4 className="font-semibold text-indigo-300">
                    What to learn
                  </h4>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
                    {nodeAdvice.what_to_learn?.map(
                      (
                        item: string,
                        index: number
                      ) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-indigo-300">
                    Weekend project
                  </h4>

                  <p className="mt-2 text-sm text-gray-400">
                    {nodeAdvice.weekend_project}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-indigo-300">
                    GitHub idea
                  </h4>

                  <p className="mt-2 text-sm text-gray-400">
                    {nodeAdvice.github_idea}
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-indigo-300">
                    Interview questions
                  </h4>

                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-400">
                    {nodeAdvice.interview_questions?.map(
                      (
                        item: string,
                        index: number
                      ) => (
                        <li key={index}>
                          {item}
                        </li>
                      )
                    )}
                  </ul>
                </div>

                <div className="rounded-xl bg-indigo-500/10 p-4">

                  <h4 className="font-semibold text-indigo-300">
                    Your next action
                  </h4>

                  <p className="mt-2 text-sm text-gray-300">
                    {nodeAdvice.next_action}
                  </p>

                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    onClick={completeNode}
                    className="w-full rounded-xl border border-green-400/30 bg-green-500/10 px-4 py-3 text-left transition hover:bg-green-500/20"
                  >
                    <div className="font-semibold text-green-300">
                      ✓ I've completed this
                    </div>

                    <div className="mt-1 text-xs text-gray-400">
                      Mark it complete and continue to the next milestone.
                    </div>
                  </button>

                  <button
                    onClick={replanRoadmap}
                    disabled={adviceLoading}
                    className="w-full rounded-xl border border-indigo-400/30 bg-indigo-500/10 px-4 py-3 text-left transition hover:bg-indigo-500/20 disabled:opacity-50"
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

        </section>
      )}

      <footer className="border-t border-white/10 px-6 py-6 text-center text-sm text-gray-600">
        PathForge AI • Your dream job. Reverse-engineered.
      </footer>

    </main>
  );
}