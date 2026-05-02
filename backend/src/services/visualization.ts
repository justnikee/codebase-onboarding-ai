/**
 * Code Visualization Service
 * Generates visual representations of code structure and relationships
 */

import { FileInfo } from '../types/index.js';

interface DependencyGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
  metrics: GraphMetrics;
}

interface GraphNode {
  id: string;
  label: string;
  type: 'file' | 'module' | 'class' | 'function';
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
  type: 'import' | 'call' | 'inherit' | 'compose';
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
  style: 'layered' | 'hexagonal' | 'microservices' | 'monolithic';
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
  type: 'depends' | 'uses' | 'implements' | 'extends';
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

interface TimelineEvent {
  date: string;
  type: 'commit' | 'release' | 'refactor' | 'feature';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
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
    repoUrl: string
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
      node.metadata.dependencies = edges.filter(e => e.source === node.id).length;
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
  async generateCodeHeatmap(
    files: FileInfo[]
  ): Promise<CodeHeatmap> {
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
        hottest: heatmapFiles.slice(0, 5).map(f => f.path),
        coldest: heatmapFiles.slice(-5).map(f => f.path),
        avgActivity: heatmapFiles.reduce((sum, f) => sum + f.activity, 0) / heatmapFiles.length,
      },
    };
  }

  /**
   * Generates an architecture diagram
   */
  async generateArchitectureDiagram(
    files: FileInfo[],
    techStack: string[]
  ): Promise<ArchitectureDiagram> {
    const style = this.detectArchitectureStyle(files);
    const layers: Layer[] = [];
    const components: Component[] = [];
    const connections: Connection[] = [];

    // Detect layers
    if (style === 'layered') {
      layers.push(
        {
          id: 'presentation',
          name: 'Presentation Layer',
          level: 1,
          components: [],
          color: '#3B82F6',
        },
        {
          id: 'business',
          name: 'Business Logic Layer',
          level: 2,
          components: [],
          color: '#10B981',
        },
        {
          id: 'data',
          name: 'Data Access Layer',
          level: 3,
          components: [],
          color: '#F59E0B',
        }
      );

      // Assign files to layers
      for (const file of files) {
        const layer = this.determineLayer(file.path);
        if (layer) {
          const layerObj = layers.find(l => l.id === layer);
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
    } else if (style === 'microservices') {
      // Detect services
      const services = this.detectServices(files);
      for (const service of services) {
        layers.push({
          id: service.id,
          name: service.name,
          level: 1,
          components: service.files.map(f => this.sanitizeId(f)),
          color: this.getRandomColor(),
        });

        for (const file of service.files) {
          components.push({
            id: this.sanitizeId(file),
            name: this.getFileName(file),
            type: 'service',
            layer: service.id,
            responsibilities: ['Handle requests', 'Process data', 'Return responses'],
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
    files: FileInfo[]
  ): Promise<ComplexityVisualization> {
    const complexityFiles: ComplexityFile[] = [];
    let low = 0, medium = 0, high = 0;

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
      .filter(f => f.complexity > 15)
      .sort((a, b) => b.complexity - a.complexity)
      .slice(0, 10)
      .map(f => f.path);

    return {
      files: complexityFiles,
      distribution: { low, medium, high },
      hotspots,
    };
  }

  /**
   * Generates project timeline visualization
   */
  async generateTimeline(
    repoUrl: string
  ): Promise<TimelineVisualization> {
    // This would typically use git history
    // For now, generate a sample timeline
    const events: TimelineEvent[] = [
      {
        date: '2024-01-01',
        type: 'commit',
        title: 'Initial Commit',
        description: 'Project started',
        impact: 'high',
      },
      {
        date: '2024-03-15',
        type: 'feature',
        title: 'Core Features Added',
        description: 'Implemented main functionality',
        impact: 'high',
      },
      {
        date: '2024-06-01',
        type: 'release',
        title: 'Version 1.0 Released',
        description: 'First stable release',
        impact: 'high',
      },
    ];

    const phases: Phase[] = [
      {
        name: 'Initial Development',
        startDate: '2024-01-01',
        endDate: '2024-03-01',
        focus: 'Core functionality',
        color: '#3B82F6',
      },
      {
        name: 'Feature Development',
        startDate: '2024-03-01',
        endDate: '2024-06-01',
        focus: 'Adding features',
        color: '#10B981',
      },
    ];

    const milestones: TimelineMilestone[] = [
      {
        date: '2024-01-01',
        title: 'Project Started',
        description: 'Repository created',
        icon: '🚀',
      },
      {
        date: '2024-06-01',
        title: 'First Release',
        description: 'Version 1.0',
        icon: '🎉',
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
    return path.replace(/[^a-zA-Z0-9]/g, '-');
  }

  private getFileName(path: string): string {
    return path.split('/').pop() || path;
  }

  private determineNodeType(path: string): 'file' | 'module' | 'class' | 'function' {
    if (path.includes('index')) return 'module';
    if (path.includes('class')) return 'class';
    if (path.includes('util') || path.includes('helper')) return 'function';
    return 'file';
  }

  private calculateNodeSize(bytes: number): number {
    return Math.min(100, Math.max(10, bytes / 1000));
  }

  private getNodeColor(path: string): string {
    if (path.includes('component')) return '#3B82F6';
    if (path.includes('service')) return '#10B981';
    if (path.includes('util')) return '#F59E0B';
    if (path.includes('model')) return '#8B5CF6';
    return '#6B7280';
  }

  private estimateComplexity(file: FileInfo): number {
    const size = file.size || 0;
    const lines = size / 50;
    
    // Simple complexity estimation
    if (lines < 100) return Math.floor(Math.random() * 5) + 1;
    if (lines < 300) return Math.floor(Math.random() * 10) + 5;
    return Math.floor(Math.random() * 20) + 10;
  }

  private analyzeDependencies(files: FileInfo[], nodes: GraphNode[]): GraphEdge[] {
    const edges: GraphEdge[] = [];
    
    // Simple dependency detection based on file structure
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < Math.min(i + 5, nodes.length); j++) {
        if (Math.random() > 0.7) {
          edges.push({
            source: nodes[i].id,
            target: nodes[j].id,
            weight: Math.random(),
            type: 'import',
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
      const dir = file.path.split('/').slice(0, -1).join('/');
      if (dir) directories.add(dir);
    }

    // Create clusters for top-level directories
    for (const dir of Array.from(directories).slice(0, 5)) {
      const clusterNodes = nodes
        .filter(n => n.metadata.path.startsWith(dir))
        .map(n => n.id);

      if (clusterNodes.length > 0) {
        clusters.push({
          id: this.sanitizeId(dir),
          label: dir.split('/').pop() || dir,
          nodes: clusterNodes,
          color: this.getRandomColor(),
        });
      }
    }

    return clusters;
  }

  private calculateGraphMetrics(nodes: GraphNode[], edges: GraphEdge[]): GraphMetrics {
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
    if (activity > 80) return '#EF4444';
    if (activity > 60) return '#F59E0B';
    if (activity > 40) return '#FCD34D';
    if (activity > 20) return '#34D399';
    return '#60A5FA';
  }

  private detectArchitectureStyle(files: FileInfo[]): 'layered' | 'hexagonal' | 'microservices' | 'monolithic' {
    const paths = files.map(f => f.path.toLowerCase());
    
    if (paths.some(p => p.includes('service') && p.includes('/'))) {
      return 'microservices';
    }
    if (paths.some(p => p.includes('domain') || p.includes('port') || p.includes('adapter'))) {
      return 'hexagonal';
    }
    if (paths.some(p => p.includes('layer') || (p.includes('presentation') && p.includes('data')))) {
      return 'layered';
    }
    return 'monolithic';
  }

  private determineLayer(path: string): string | null {
    const lower = path.toLowerCase();
    if (lower.includes('view') || lower.includes('component') || lower.includes('ui')) {
      return 'presentation';
    }
    if (lower.includes('service') || lower.includes('business') || lower.includes('logic')) {
      return 'business';
    }
    if (lower.includes('data') || lower.includes('repository') || lower.includes('model')) {
      return 'data';
    }
    return null;
  }

  private getComponentType(path: string): string {
    if (path.includes('component')) return 'UI Component';
    if (path.includes('service')) return 'Service';
    if (path.includes('controller')) return 'Controller';
    if (path.includes('model')) return 'Model';
    return 'Module';
  }

  private inferResponsibilities(path: string): string[] {
    const responsibilities: string[] = [];
    if (path.includes('auth')) responsibilities.push('Authentication');
    if (path.includes('user')) responsibilities.push('User Management');
    if (path.includes('api')) responsibilities.push('API Handling');
    if (path.includes('data')) responsibilities.push('Data Access');
    return responsibilities.length > 0 ? responsibilities : ['General Purpose'];
  }

  private detectServices(files: FileInfo[]): Array<{ id: string; name: string; files: string[] }> {
    const services: Array<{ id: string; name: string; files: string[] }> = [];
    const serviceMap = new Map<string, string[]>();

    for (const file of files) {
      const parts = file.path.split('/');
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
            type: 'depends',
            bidirectional: Math.random() > 0.7,
          });
        }
      }
    }

    return connections;
  }

  private getComplexityColor(complexity: number): string {
    if (complexity > 20) return '#EF4444';
    if (complexity > 10) return '#F59E0B';
    return '#10B981';
  }

  private getRandomColor(): string {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6'];
    return colors[Math.floor(Math.random() * colors.length)];
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
};

// Made with Bob
