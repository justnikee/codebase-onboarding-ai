"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { api, type GraphData } from "@/services/api";

type GraphNode = GraphData["nodes"][number];
type GraphLink = GraphData["links"][number];
type Community = GraphData["communities"][number];

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const W = 820;
const H = 520;

// Truncate a label to fit inside a node
function short(label: string, max = 14): string {
  return label.length > max ? label.slice(0, max - 1) + "…" : label;
}

// Return a good font-size for a given node radius
function labelSize(r: number): number {
  return Math.max(7, Math.min(10, r * 0.9));
}

export function ArchitectureGraph({ contextId }: { contextId: string }) {
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [simNodes, setSimNodes] = useState<SimNode[]>([]);
  const [hovered, setHovered] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | null>(null);

  const simRef = useRef<SimNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const animRef = useRef<number>(0);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    setLoading(true);
    api
      .getGraph(contextId)
      .then((data) => {
        setGraphData(data);
        const n = data.nodes.length;
        // Seed positions: community-aware clusters, not a single circle
        const commCenters = new Map<number, { x: number; y: number }>();
        const commIds = [...new Set(data.nodes.map((nd) => nd.community))];
        commIds.forEach((cid, idx) => {
          const angle = (2 * Math.PI * idx) / commIds.length;
          commCenters.set(cid, {
            x: W / 2 + W * 0.3 * Math.cos(angle),
            y: H / 2 + H * 0.3 * Math.sin(angle),
          });
        });
        const nodes: SimNode[] = data.nodes.map((node, i) => {
          const center = commCenters.get(node.community) ?? {
            x: W / 2,
            y: H / 2,
          };
          const jitter = (Math.random() - 0.5) * 80;
          return {
            ...node,
            x: center.x + jitter,
            y: center.y + jitter,
            vx: 0,
            vy: 0,
          };
        });
        simRef.current = nodes;
        linksRef.current = data.links;
        setSimNodes([...nodes]);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [contextId]);

  // ── Force simulation ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!graphData) return;
    let alpha = 1.0;
    const commIds = [...new Set(graphData.nodes.map((nd) => nd.community))];

    function tick() {
      const nodes = simRef.current;
      const links = linksRef.current;
      const n = nodes.length;
      if (n === 0) return;

      const idx = new Map(nodes.map((nd) => [nd.id, nd]));

      // Repulsion
      const repulse = 2200;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = b.x - a.x || 0.01;
          const dy = b.y - a.y || 0.01;
          const d2 = dx * dx + dy * dy || 1;
          const d = Math.sqrt(d2);
          const f = (repulse / d2) * alpha;
          const fx = (dx / d) * f;
          const fy = (dy / d) * f;
          a.vx -= fx;
          a.vy -= fy;
          b.vx += fx;
          b.vy += fy;
        }
      }

      // Edge spring
      const ideal = 100;
      const kSpring = 0.07;
      for (const link of links) {
        const s = idx.get(link.source);
        const t = idx.get(link.target);
        if (!s || !t) continue;
        const dx = t.x - s.x;
        const dy = t.y - s.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const f = (d - ideal) * kSpring * alpha;
        const fx = (dx / d) * f;
        const fy = (dy / d) * f;
        s.vx += fx;
        s.vy += fy;
        t.vx -= fx;
        t.vy -= fy;
      }

      // Community cohesion (pull toward community centroid)
      const centroids = new Map<number, { x: number; y: number; c: number }>();
      for (const nd of nodes) {
        const cur = centroids.get(nd.community) ?? { x: 0, y: 0, c: 0 };
        cur.x += nd.x;
        cur.y += nd.y;
        cur.c++;
        centroids.set(nd.community, cur);
      }
      for (const nd of nodes) {
        const cen = centroids.get(nd.community);
        if (!cen || cen.c === 0) continue;
        nd.vx += (cen.x / cen.c - nd.x) * 0.025 * alpha;
        nd.vy += (cen.y / cen.c - nd.y) * 0.025 * alpha;
      }

      // Center gravity
      for (const nd of nodes) {
        nd.vx += (W / 2 - nd.x) * 0.004 * alpha;
        nd.vy += (H / 2 - nd.y) * 0.004 * alpha;
      }

      // Integrate
      for (const nd of nodes) {
        nd.vx *= 0.8;
        nd.vy *= 0.8;
        nd.x = Math.max(22, Math.min(W - 22, nd.x + nd.vx));
        nd.y = Math.max(22, Math.min(H - 22, nd.y + nd.vy));
      }

      alpha *= 0.985;
      setSimNodes([...nodes]);
      if (alpha > 0.003) {
        animRef.current = requestAnimationFrame(tick);
      }
    }

    animRef.current = requestAnimationFrame(tick);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [graphData]);

  // ── Derived data ───────────────────────────────────────────────────────────
  const visibleNodes =
    filter !== null ? simNodes.filter((n) => n.community === filter) : simNodes;
  const visibleIds = new Set(visibleNodes.map((n) => n.id));
  const visibleLinks = (graphData?.links ?? []).filter(
    (l) => visibleIds.has(l.source) && visibleIds.has(l.target),
  );

  // Compute node degree for sizing
  const degree = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of graphData?.links ?? []) {
      map.set(l.source, (map.get(l.source) ?? 0) + 1);
      map.set(l.target, (map.get(l.target) ?? 0) + 1);
    }
    return map;
  }, [graphData]);

  const communityColor = (id: number) =>
    graphData?.communities.find((c) => c.id === id)?.color ?? "#6B7280";

  const hovNode = simNodes.find((n) => n.id === hovered);

  // Top 3 most-connected files for the summary strip
  const topFiles = useMemo(() => {
    if (!graphData) return [];
    return [...graphData.nodes]
      .sort((a, b) => (degree.get(b.id) ?? 0) - (degree.get(a.id) ?? 0))
      .slice(0, 3);
  }, [graphData, degree]);

  // ── States ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-56 text-foreground/40 text-sm animate-pulse">
        Building module graph…
      </div>
    );
  }
  if (error || !graphData) {
    return (
      <div className="flex items-center justify-center h-56 text-foreground/40 text-sm">
        {error ?? "Graph unavailable."}
      </div>
    );
  }
  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 text-foreground/40 text-sm">
        No code files detected for graph visualization.
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-3">
      {/* ── Stats strip ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3">
          <p className="text-lg font-bold text-foreground">
            {graphData.nodes.length}
          </p>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wide">
            Files
          </p>
        </div>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3">
          <p className="text-lg font-bold text-foreground">
            {graphData.communities.length}
          </p>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wide">
            Modules
          </p>
        </div>
        <div className="bg-bg-elevated border border-border-subtle rounded-lg py-2 px-3">
          <p className="text-lg font-bold text-foreground">
            {graphData.links.length}
          </p>
          <p className="text-[10px] text-foreground/50 uppercase tracking-wide">
            Connections
          </p>
        </div>
      </div>

      {/* ── Module filter pills ──────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <button
          onClick={() => setFilter(null)}
          className={`px-2.5 py-1 rounded-full border transition-colors ${
            filter === null
              ? "bg-accent-primary/20 border-accent-primary text-accent-primary"
              : "border-border-subtle text-foreground/50 hover:border-accent-primary/40"
          }`}
        >
          All modules
        </button>
        {graphData.communities.map((c: Community) => (
          <button
            key={c.id}
            onClick={() => setFilter(filter === c.id ? null : c.id)}
            className="px-2.5 py-1 rounded-full border transition-colors"
            style={{
              backgroundColor: filter === c.id ? c.color + "28" : "transparent",
              borderColor:
                filter === c.id ? c.color : "var(--border-subtle, #2a2a3a)",
              color: filter === c.id ? c.color : "var(--foreground, #ccc)",
              opacity: filter !== null && filter !== c.id ? 0.45 : 1,
            }}
          >
            <span
              className="inline-block w-2 h-2 rounded-full mr-1.5"
              style={{ backgroundColor: c.color }}
            />
            {c.label}
          </button>
        ))}
      </div>

      {/* ── SVG canvas ──────────────────────────────────────────────────── */}
      <div className="relative rounded-xl border border-border-subtle overflow-hidden bg-bg-elevated">
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          className="block"
          style={{ minHeight: 340 }}
        >
          {/* ── Community halos ── */}
          {graphData.communities
            .filter((c) => filter === null || c.id === filter)
            .map((c) => {
              const members = visibleNodes.filter((n) => n.community === c.id);
              if (members.length === 0) return null;
              const cx = members.reduce((s, n) => s + n.x, 0) / members.length;
              const cy = members.reduce((s, n) => s + n.y, 0) / members.length;
              const maxDist = Math.max(
                60,
                ...members.map((n) =>
                  Math.sqrt((n.x - cx) ** 2 + (n.y - cy) ** 2),
                ),
              );
              return (
                <g key={c.id}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={maxDist + 28}
                    fill={c.color}
                    fillOpacity={0.05}
                    stroke={c.color}
                    strokeOpacity={0.18}
                    strokeWidth={1}
                  />
                  <text
                    x={cx}
                    y={cy - maxDist - 14}
                    textAnchor="middle"
                    fill={c.color}
                    fontSize={10}
                    fontWeight={600}
                    fontFamily="sans-serif"
                    style={{ userSelect: "none", pointerEvents: "none" }}
                    opacity={0.8}
                  >
                    {c.label}
                  </text>
                </g>
              );
            })}

          {/* ── Edges ── */}
          <g>
            {visibleLinks.map((link, i) => {
              const s = simNodes.find((n) => n.id === link.source);
              const t = simNodes.find((n) => n.id === link.target);
              if (!s || !t) return null;
              const hi = hovered === link.source || hovered === link.target;
              const color = communityColor(s.community);
              return (
                <line
                  key={i}
                  x1={s.x}
                  y1={s.y}
                  x2={t.x}
                  y2={t.y}
                  stroke={hi ? "#ffffff" : color}
                  strokeWidth={hi ? 1.5 : 0.8}
                  opacity={hi ? 0.85 : 0.35}
                />
              );
            })}
          </g>

          {/* ── Nodes ── */}
          {visibleNodes.map((node) => {
            const deg = degree.get(node.id) ?? 0;
            // radius: base size + degree bonus + file-size hint
            const r = Math.max(7, Math.min(18, node.size * 0.65 + deg * 1.2));
            const color = communityColor(node.community);
            const isHov = hovered === node.id;
            const fs = labelSize(r);
            const label = short(node.label, 13);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x},${node.y})`}
                onMouseEnter={() => setHovered(node.id)}
                onMouseLeave={() => setHovered(null)}
                style={{ cursor: "pointer" }}
              >
                {/* Hover glow */}
                {isHov && (
                  <circle
                    r={r + 7}
                    fill={color}
                    fillOpacity={0.2}
                    stroke="none"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={isHov ? r + 2 : r}
                  fill={color}
                  fillOpacity={isHov ? 1 : 0.78}
                  stroke={isHov ? "#fff" : color}
                  strokeWidth={isHov ? 1.8 : 0.6}
                  strokeOpacity={isHov ? 1 : 0.6}
                />

                {/* Always-visible label below node */}
                <text
                  y={r + fs + 2}
                  textAnchor="middle"
                  fill={isHov ? "#ffffff" : color}
                  fontSize={fs}
                  fontFamily="monospace"
                  opacity={isHov ? 1 : 0.75}
                  style={{ pointerEvents: "none", userSelect: "none" }}
                >
                  {label}
                </text>

                {/* Degree badge (top-right) for high-degree nodes */}
                {deg >= 3 && !isHov && (
                  <>
                    <circle
                      cx={r - 1}
                      cy={-(r - 1)}
                      r={5}
                      fill="#1e1e2e"
                      stroke={color}
                      strokeWidth={0.8}
                    />
                    <text
                      x={r - 1}
                      y={-(r - 5)}
                      textAnchor="middle"
                      fill={color}
                      fontSize={6}
                      fontWeight={700}
                      fontFamily="monospace"
                      style={{ pointerEvents: "none", userSelect: "none" }}
                    >
                      {deg}
                    </text>
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* ── Hover detail panel ── */}
        {hovNode && (
          <div className="absolute bottom-3 left-3 bg-bg-secondary/95 border border-border-subtle rounded-lg px-3 py-2 text-xs max-w-xs pointer-events-none backdrop-blur-sm">
            <p
              className="font-mono font-semibold truncate"
              style={{ color: communityColor(hovNode.community) }}
            >
              {hovNode.label}
            </p>
            <p className="text-foreground/50 mt-0.5 truncate">{hovNode.path}</p>
            <div className="flex gap-3 mt-1 text-foreground/40">
              <span>~{hovNode.size * 50} lines</span>
              <span>{degree.get(hovNode.id) ?? 0} connections</span>
              <span>
                {graphData.communities.find((c) => c.id === hovNode.community)
                  ?.label ?? ""}
              </span>
            </div>
          </div>
        )}

        {/* ── Stats badge ── */}
        <div className="absolute top-3 right-3 bg-bg-secondary/80 border border-border-subtle rounded-lg px-2.5 py-1.5 text-xs text-foreground/50 backdrop-blur-sm space-x-2">
          <span>{visibleNodes.length} files</span>
          <span>·</span>
          <span>{visibleLinks.length} edges</span>
        </div>
      </div>

      {/* ── Top-connected files ─────────────────────────────────────────── */}
      {topFiles.length > 0 && (
        <div className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-foreground/40 mb-2">
            Most connected files
          </p>
          <div className="flex flex-col gap-1.5">
            {topFiles.map((f) => {
              const deg = degree.get(f.id) ?? 0;
              const color = communityColor(f.community);
              return (
                <div key={f.id} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-mono text-xs text-foreground/80 truncate flex-1">
                    {f.path}
                  </span>
                  <span
                    className="text-xs font-semibold flex-shrink-0"
                    style={{ color }}
                  >
                    {deg} edges
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-xs text-foreground/30 text-center">
        Hover a node to inspect · numbers show connection count · click a module
        pill to filter
      </p>
    </div>
  );
}
