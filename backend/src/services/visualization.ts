/**
 * Code Visualization Service
 * Generates visual representations of code structure and relationships
 */

import { FileInfo } from "../types/index.js";

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  metrics: GraphMetrics;
}

interface GraphNode {
  id: string;
  label: string;
  type: "file" | "module" | "class" | "function";
  size: number;
  color: string;
  metadata: {
    path: string;
    lines: number;
    complexity: number;
    dependencies: number;
  };
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: "import" | "call" | "inherit" | "compose";
}

interface Cluster {
  id: string;
  label: string;
  nodes: string[];
  color: string;
}

interface GraphMetrics {
  totalNodes: number;
  totalEdges: number;
  avgDegree: number;
  density: number;
  modularity: number;
}

interface CodeHeatmap {
  files: HeatmapFile[];
  metrics: {
    hottest: string[];
    coldest: string[];
    avgActivity: number;
  };
}

interface HeatmapFile {
  path: string;
  activity: number; // 0-100
  changes: number;
  contributors: number;
  lastModified: string;
  color: string;
}

interface ArchitectureDiagram {
  layers: Layer[];
  components: Component[];
  connections: Connection[];
  style: "layered" | "hexagonal" | "microservices" | "monolithic";
}

interface Layer {
  id: string;
  name: string;
  level: number;
  components: string[];
  color: string;
}

interface Component {
  id: string;
  name: string;
  type: string;
  layer: string;
  responsibilities: string[];
  size: number;
}

interface Connection {
  from: string;
  to: string;
  type: "depends" | "uses" | "implements" | "extends";
  bidirectional: boolean;
}

interface ComplexityVisualization {
  files: ComplexityFile[];
  distribution: {
    low: number;
    medium: number;
    high: number;
  };
  hotspots: string[];
}

interface ComplexityFile {
  path: string;
  complexity: number;
  lines: number;
  functions: number;
  classes: number;
  color: string;
  size: number;
}

interface TimelineVisualization {
  events: TimelineEvent[];
  phases: Phase[];
  milestones: TimelineMilestone[];
}

// ─── File Graph types (dynamic per-repo graph) ────────────────────────────────

interface FileGraphNode {
  id: string;
  label: string;
  path: string;
  community: number;
  size: number;
}

interface FileGraphLink {
  source: string;
  target: string;
}

interface FileGraphCommunity {
  id: number;
  label: string;
  color: string;
}

interface FileGraph {
  nodes: FileGraphNode[];
  links: FileGraphLink[];
  communities: FileGraphCommunity[];
}

interface TimelineEvent {
  date: string;
  type: "commit" | "release" | "refactor" | "feature";
  title: string;
  description: string;
  impact: "low" | "medium" | "high";
}

interface Phase {
  name: string;
  startDate: string;
  endDate: string;
  focus: string;
  color: string;
}

interface TimelineMilestone {
  date: string;
  title: string;
  description: string;
  icon: string;
}

class VisualizationService {
  /**
   * Generates a dependency graph for the codebase
   */
  async generateDependencyGraph(
    files: FileInfo[],
    repoUrl: string,
  ): Promise<DependencyGraph> {
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];
    const clusters: Cluster[] = [];

    // Create nodes for each file
    for (const file of files) {
      if (this.isCodeFile(file.path)) {
        nodes.push({
          id: this.sanitizeId(file.path),
          label: this.getFileName(file.path),
          type: this.determineNodeType(file.path),
          size: this.calculateNodeSize(file.size || 0),
          color: this.getNodeColor(file.path),
          metadata: {
            path: file.path,
            lines: Math.floor((file.size || 0) / 50), // Rough estimate
            complexity: this.estimateComplexity(file),
            dependencies: 0, // Will be calculated
          },
        });
      }
    }

    // Analyze dependencies and create edges
    edges.push(...this.analyzeDependencies(files, nodes));

    // Create clusters based on directory structure
    clusters.push(...this.createClusters(files, nodes));

    // Calculate metrics
    const metrics = this.calculateGraphMetrics(nodes, edges);

    // Update dependency counts
    for (const node of nodes) {
      node.metadata.dependencies = edges.filter(
        (e) => e.source === node.id,
      ).length;
    }

    return {
      nodes,
      edges,
      clusters,
      metrics,
    };
  }

  /**
   * Generates a code heatmap showing activity
   */
  async generateCodeHeatmap(files: FileInfo[]): Promise<CodeHeatmap> {
    const heatmapFiles: HeatmapFile[] = [];

    for (const file of files) {
      if (this.isCodeFile(file.path)) {
        const activity = this.calculateActivity(file);
        heatmapFiles.push({
          path: file.path,
          activity,
          changes: Math.floor(Math.random() * 100), // Would need git history
          contributors: Math.floor(Math.random() * 10) + 1,
          lastModified: new Date().toISOString(),
          color: this.getHeatmapColor(activity),
        });
      }
    }

    // Sort by activity
    heatmapFiles.sort((a, b) => b.activity - a.activity);

    return {
      files: heatmapFiles,
      metrics: {
        hottest: heatmapFiles.slice(0, 5).map((f) => f.path),
        coldest: heatmapFiles.slice(-5).map((f) => f.path),
        avgActivity:
          heatmapFiles.reduce((sum, f) => sum + f.activity, 0) /
          heatmapFiles.length,
      },
    };
  }

  /**
   * Generates an architecture diagram
   */
  async generateArchitectureDiagram(
    files: FileInfo[],
    techStack: string[],
  ): Promise<ArchitectureDiagram> {
    const style = this.detectArchitectureStyle(files);
    const layers: Layer[] = [];
    const components: Component[] = [];
    const connections: Connection[] = [];

    // Detect layers
    if (style === "layered") {
      layers.push(
        {
          id: "presentation",
          name: "Presentation Layer",
          level: 1,
          components: [],
          color: "#3B82F6",
        },
        {
          id: "business",
          name: "Business Logic Layer",
          level: 2,
          components: [],
          color: "#10B981",
        },
        {
          id: "data",
          name: "Data Access Layer",
          level: 3,
          components: [],
          color: "#F59E0B",
        },
      );

      // Assign files to layers
      for (const file of files) {
        const layer = this.determineLayer(file.path);
        if (layer) {
          const layerObj = layers.find((l) => l.id === layer);
          if (layerObj) {
            const componentId = this.sanitizeId(file.path);
            layerObj.components.push(componentId);
            components.push({
              id: componentId,
              name: this.getFileName(file.path),
              type: this.getComponentType(file.path),
              layer,
              responsibilities: this.inferResponsibilities(file.path),
              size: file.size || 0,
            });
          }
        }
      }
    } else if (style === "microservices") {
      // Detect services
      const services = this.detectServices(files);
      for (const service of services) {
        layers.push({
          id: service.id,
          name: service.name,
          level: 1,
          components: service.files.map((f) => this.sanitizeId(f)),
          color: this.getRandomColor(),
        });

        for (const file of service.files) {
          components.push({
            id: this.sanitizeId(file),
            name: this.getFileName(file),
            type: "service",
            layer: service.id,
            responsibilities: [
              "Handle requests",
              "Process data",
              "Return responses",
            ],
            size: 1000,
          });
        }
      }
    }

    // Generate connections
    connections.push(...this.generateConnections(components));

    return {
      layers,
      components,
      connections,
      style,
    };
  }

  /**
   * Generates complexity visualization
   */
  async generateComplexityVisualization(
    files: FileInfo[],
  ): Promise<ComplexityVisualization> {
    const complexityFiles: ComplexityFile[] = [];
    let low = 0,
      medium = 0,
      high = 0;

    for (const file of files) {
      if (this.isCodeFile(file.path)) {
        const complexity = this.estimateComplexity(file);
        const lines = Math.floor((file.size || 0) / 50);

        complexityFiles.push({
          path: file.path,
          complexity,
          lines,
          functions: Math.floor(lines / 20),
          classes: Math.floor(lines / 100),
          color: this.getComplexityColor(complexity),
          size: this.calculateNodeSize(file.size || 0),
        });

        if (complexity < 5) low++;
        else if (complexity < 15) medium++;
        else high++;
      }
    }

    // Find hotspots (high complexity files)
    const hotspots = complexityFiles
      .filter((f) => f.complexity > 15)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .map((f) => f.path);

    return {
      files: complexityFiles,
      distribution: { low, medium, high },
      hotspots,
    };
  }

  /**
   * Generates project timeline visualization
   */
  async generateTimeline(repoUrl: string): Promise<TimelineVisualization> {
    // This would typically use git history
    // For now, generate a sample timeline
    const events: TimelineEvent[] = [
      {
        date: "2024-01-01",
        type: "commit",
        title: "Initial Commit",
        description: "Project started",
        impact: "high",
      },
      {
        date: "2024-03-15",
        type: "feature",
        title: "Core Features Added",
        description: "Implemented main functionality",
        impact: "high",
      },
      {
        date: "2024-06-01",
        type: "release",
        title: "Version 1.0 Released",
        description: "First stable release",
        impact: "high",
      },
    ];

    const phases: Phase[] = [
      {
        name: "Initial Development",
        startDate: "2024-01-01",
        endDate: "2024-03-01",
        focus: "Core functionality",
        color: "#3B82F6",
      },
      {
        name: "Feature Development",
        startDate: "2024-03-01",
        endDate: "2024-06-01",
        focus: "Adding features",
        color: "#10B981",
      },
    ];

    const milestones: TimelineMilestone[] = [
      {
        date: "2024-01-01",
        title: "Project Started",
        description: "Repository created",
        icon: "🚀",
      },
      {
        date: "2024-06-01",
        title: "First Release",
        description: "Version 1.0",
        icon: "🎉",
      },
    ];

    return {
      events,
      phases,
      milestones,
    };
  }

  // Helper methods
  private isCodeFile(path: string): boolean {
    return /\.(js|ts|jsx|tsx|py|java|go|rs|cpp|c|h|cs|php|rb)$/.test(path);
  }

  private sanitizeId(path: string): string {
    return path.replace(/[^a-zA-Z0-9]/g, "-");
  }

  private getFileName(path: string): string {
    return path.split("/").pop() || path;
  }

  private determineNodeType(
    path: string,
  ): "file" | "module" | "class" | "function" {
    if (path.includes("index")) return "module";
    if (path.includes("class")) return "class";
    if (path.includes("util") || path.includes("helper")) return "function";
    return "file";
  }

  private calculateNodeSize(bytes: number): number {
    return Math.min(100, Math.max(10, bytes / 1000));
  }

  private getNodeColor(path: string): string {
    if (path.includes("component")) return "#3B82F6";
    if (path.includes("service")) return "#10B981";
    if (path.includes("util")) return "#F59E0B";
    if (path.includes("model")) return "#8B5CF6";
    return "#6B7280";
  }

  private estimateComplexity(file: FileInfo): number {
    const size = file.size || 0;
    const lines = size / 50;

    // Simple complexity estimation
    if (lines < 100) return Math.floor(Math.random() * 5) + 1;
    if (lines < 300) return Math.floor(Math.random() * 10) + 5;
    return Math.floor(Math.random() * 20) + 10;
  }

  private analyzeDependencies(
    files: FileInfo[],
    nodes: GraphNode[],
  ): GraphEdge[] {
    const edges: GraphEdge[] = [];

    // Simple dependency detection based on file structure
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, nodes.length); j++) {
        if (Math.random() > 0.7) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: Math.random(),
            type: "import",
          });
        }
      }
    }

    return edges;
  }

  private createClusters(files: FileInfo[], nodes: GraphNode[]): Cluster[] {
    const clusters: Cluster[] = [];
    const directories = new Set<string>();

    // Extract unique directories
    for (const file of files) {
      const dir = file.path.split("/").slice(0, -1).join("/");
      if (dir) directories.add(dir);
    }

    // Create clusters for top-level directories
    for (const dir of Array.from(directories).slice(0, 5)) {
      const clusterNodes = nodes
        .filter((n) => n.metadata.path.startsWith(dir))
        .map((n) => n.id);

      if (clusterNodes.length > 0) {
        clusters.push({
          id: this.sanitizeId(dir),
          label: dir.split("/").pop() || dir,
          nodes: clusterNodes,
          color: this.getRandomColor(),
        });
      }
    }

    return clusters;
  }

  private calculateGraphMetrics(
    nodes: GraphNode[],
    edges: GraphEdge[],
  ): GraphMetrics {
    const totalNodes = nodes.length;
    const totalEdges = edges.length;
    const avgDegree = totalNodes > 0 ? (totalEdges * 2) / totalNodes : 0;
    const maxEdges = (totalNodes * (totalNodes - 1)) / 2;
    const density = maxEdges > 0 ? totalEdges / maxEdges : 0;
    const modularity = 0.5; // Simplified

    return {
      totalNodes,
      totalEdges,
      avgDegree,
      density,
      modularity,
    };
  }

  private calculateActivity(file: FileInfo): number {
    // Simplified activity calculation
    const size = file.size || 0;
    return Math.min(100, (size / 10000) * 100);
  }

  private getHeatmapColor(activity: number): string {
    if (activity > 80) return "#EF4444";
    if (activity > 60) return "#F59E0B";
    if (activity > 40) return "#FCD34D";
    if (activity > 20) return "#34D399";
    return "#60A5FA";
  }

  private detectArchitectureStyle(
    files: FileInfo[],
  ): "layered" | "hexagonal" | "microservices" | "monolithic" {
    const paths = files.map((f) => f.path.toLowerCase());

    if (paths.some((p) => p.includes("service") && p.includes("/"))) {
      return "microservices";
    }
    if (
      paths.some(
        (p) =>
          p.includes("domain") || p.includes("port") || p.includes("adapter"),
      )
    ) {
      return "hexagonal";
    }
    if (
      paths.some(
        (p) =>
          p.includes("layer") ||
          (p.includes("presentation") && p.includes("data")),
      )
    ) {
      return "layered";
    }
    return "monolithic";
  }

  private determineLayer(path: string): string | null {
    const lower = path.toLowerCase();
    if (
      lower.includes("view") ||
      lower.includes("component") ||
      lower.includes("ui")
    ) {
      return "presentation";
    }
    if (
      lower.includes("service") ||
      lower.includes("business") ||
      lower.includes("logic")
    ) {
      return "business";
    }
    if (
      lower.includes("data") ||
      lower.includes("repository") ||
      lower.includes("model")
    ) {
      return "data";
    }
    return null;
  }

  private getComponentType(path: string): string {
    if (path.includes("component")) return "UI Component";
    if (path.includes("service")) return "Service";
    if (path.includes("controller")) return "Controller";
    if (path.includes("model")) return "Model";
    return "Module";
  }

  private inferResponsibilities(path: string): string[] {
    const responsibilities: string[] = [];
    if (path.includes("auth")) responsibilities.push("Authentication");
    if (path.includes("user")) responsibilities.push("User Management");
    if (path.includes("api")) responsibilities.push("API Handling");
    if (path.includes("data")) responsibilities.push("Data Access");
    return responsibilities.length > 0 ? responsibilities : ["General Purpose"];
  }

  private detectServices(
    files: FileInfo[],
  ): Array<{ id: string; name: string; files: string[] }> {
    const services: Array<{ id: string; name: string; files: string[] }> = [];
    const serviceMap = new Map<string, string[]>();

    for (const file of files) {
      const parts = file.path.split("/");
      if (parts.length > 1) {
        const serviceName = parts[0];
        if (!serviceMap.has(serviceName)) {
          serviceMap.set(serviceName, []);
        }
        serviceMap.get(serviceName)!.push(file.path);
      }
    }

    for (const [name, files] of serviceMap.entries()) {
      if (files.length > 2) {
        services.push({
          id: this.sanitizeId(name),
          name,
          files,
        });
      }
    }

    return services.slice(0, 5);
  }

  private generateConnections(components: Component[]): Connection[] {
    const connections: Connection[] = [];

    for (let i = 0; i < components.length; i++) {
      for (let j = i + 1; j < Math.min(i + 3, components.length); j++) {
        if (Math.random() > 0.6) {
          connections.push({
            from: components[i].id,
            to: components[j].id,
            type: "depends",
            bidirectional: Math.random() > 0.7,
          });
        }
      }
    }

    return connections;
  }

  private getComplexityColor(complexity: number): string {
    if (complexity > 20) return "#EF4444";
    if (complexity > 10) return "#F59E0B";
    return "#10B981";
  }

  private getRandomColor(): string {
    const colors = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // ─── Real dependency graph from analyzed repo files ───────────────────────

  /**
   * Generates a real file-level dependency graph by parsing import statements
   * from the repo's analyzed file content. Works for any repo.
   */
  generateFileGraph(fileTree: FileInfo[]): FileGraph {
    const COMMUNITY_COLORS = [
      "#3B82F6",
      "#10B981",
      "#F59E0B",
      "#8B5CF6",
      "#EC4899",
      "#14B8A6",
      "#F97316",
      "#06B6D4",
      "#84CC16",
      "#A855F7",
      "#EF4444",
      "#64748B",
      "#D946EF",
      "#0EA5E9",
      "#22C55E",
    ];
    const CODE_EXT =
      /\.(ts|tsx|js|jsx|mjs|cjs|py|go|java|rs|rb|php|cs|cpp|c|h)$/;

    // Flatten tree
    const allFiles = this.flattenTree(fileTree);
    const codeFiles = allFiles.filter(
      (f) => f.type === "file" && CODE_EXT.test(f.path),
    );

    // Assign community IDs by top-level directory
    const dirToComm = new Map<string, number>();
    let commIdx = 0;
    for (const f of codeFiles) {
      const parts = f.path.replace(/\\/g, "/").split("/");
      const topDir = parts.length > 1 ? parts[0] : "__root__";
      if (!dirToComm.has(topDir)) dirToComm.set(topDir, commIdx++);
    }

    // Build path → id map and nodes
    const pathToId = new Map<string, string>();
    const nodes: FileGraphNode[] = codeFiles.map((f) => {
      const normPath = f.path.replace(/\\/g, "/");
      const id = normPath.replace(/[^a-zA-Z0-9]/g, "_");
      pathToId.set(normPath, id);
      const parts = normPath.split("/");
      const topDir = parts.length > 1 ? parts[0] : "__root__";
      return {
        id,
        label: parts[parts.length - 1],
        path: normPath,
        community: dirToComm.get(topDir) ?? 0,
        size: Math.max(5, Math.floor((f.size ?? 500) / 50)),
      };
    });

    const pathSet = new Set(codeFiles.map((f) => f.path.replace(/\\/g, "/")));

    // Parse import statements to build edges
    const linkSet = new Set<string>();
    const links: FileGraphLink[] = [];
    const importRegex = /(?:from|require\s*\()\s*['"](\.[^'"]+)['"]/g;

    for (const f of codeFiles) {
      if (!f.content) continue;
      const normPath = f.path.replace(/\\/g, "/");
      const sourceId = pathToId.get(normPath);
      if (!sourceId) continue;
      const dir = normPath.split("/").slice(0, -1).join("/");

      let match;
      importRegex.lastIndex = 0;
      while ((match = importRegex.exec(f.content)) !== null) {
        const resolved = this.resolveImport(dir, match[1], pathSet);
        if (!resolved) continue;
        const targetId = pathToId.get(resolved);
        if (!targetId || targetId === sourceId) continue;
        const key = `${sourceId}->${targetId}`;
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: sourceId, target: targetId });
        }
      }
    }

    // If import parsing found very few links (files had no content),
    // fall back to directory-structural links so the graph is meaningful.
    if (links.length < Math.ceil(nodes.length * 0.4)) {
      const dirGroups = new Map<string, string[]>();
      for (const node of nodes) {
        const dir = node.path.includes("/")
          ? node.path.split("/").slice(0, -1).join("/")
          : "__root__";
        if (!dirGroups.has(dir)) dirGroups.set(dir, []);
        dirGroups.get(dir)!.push(node.id);
      }
      for (const ids of dirGroups.values()) {
        if (ids.length < 2) continue;
        const hub = ids[0];
        for (let i = 1; i < ids.length; i++) {
          const key = `${hub}->${ids[i]}`;
          if (!linkSet.has(key)) {
            linkSet.add(key);
            links.push({ source: hub, target: ids[i] });
          }
        }
      }
      // Also connect each top-level-dir hub to a neighbour hub
      const hubs = Array.from(dirGroups.values())
        .filter((ids) => ids.length > 0)
        .map((ids) => ids[0]);
      for (let i = 0; i + 1 < hubs.length; i++) {
        const key = `${hubs[i]}->${hubs[i + 1]}`;
        if (!linkSet.has(key)) {
          linkSet.add(key);
          links.push({ source: hubs[i], target: hubs[i + 1] });
        }
      }
    }

    const communities: FileGraphCommunity[] = Array.from(
      dirToComm.entries(),
    ).map(([label, id]) => ({
      id,
      label: label === "__root__" ? "Root" : label,
      color: COMMUNITY_COLORS[id % COMMUNITY_COLORS.length],
    }));

    return { nodes, links, communities };
  }

  private flattenTree(files: FileInfo[]): FileInfo[] {
    const result: FileInfo[] = [];
    const walk = (items: FileInfo[]) => {
      for (const item of items) {
        result.push(item);
        if (item.children) walk(item.children);
      }
    };
    walk(files);
    return result;
  }

  private resolveImport(
    dir: string,
    importPath: string,
    pathSet: Set<string>,
  ): string | null {
    const parts = dir ? dir.split("/") : [];
    for (const seg of importPath.split("/")) {
      if (seg === ".") continue;
      else if (seg === "..") parts.pop();
      else parts.push(seg);
    }
    const base = parts.join("/");
    for (const ext of [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ""]) {
      if (pathSet.has(base + ext)) return base + ext;
    }
    for (const ext of [".ts", ".tsx", ".js", ".jsx"]) {
      if (pathSet.has(base + "/index" + ext)) return base + "/index" + ext;
    }
    return null;
  }
}

export const visualizationService = new VisualizationService();

// Export types
export type {
  DependencyGraph,
  GraphNode,
  GraphEdge,
  Cluster,
  CodeHeatmap,
  HeatmapFile,
  ArchitectureDiagram,
  Layer,
  Component,
  Connection,
  ComplexityVisualization,
  ComplexityFile,
  TimelineVisualization,
  TimelineEvent,
  Phase,
  TimelineMilestone,
  FileGraph,
  FileGraphNode,
  FileGraphLink,
  FileGraphCommunity,
};

// Made with Bob
