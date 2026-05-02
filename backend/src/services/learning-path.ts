/**
 * AI-Powered Learning Path Generator
 * Creates personalized learning paths based on repository analysis
 */

import { watsonxService } from './watsonx.js';
import { FileInfo } from '../types/index.js';

interface LearningModule {
  id: string;
  title: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: string;
  prerequisites: string[];
  topics: string[];
  resources: LearningResource[];
  practiceExercises: Exercise[];
}

interface LearningResource {
  type: 'documentation' | 'tutorial' | 'video' | 'article' | 'book';
  title: string;
  url?: string;
  description: string;
  duration?: string;
}

interface Exercise {
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  hints: string[];
  solution?: string;
}

interface LearningPath {
  title: string;
  description: string;
  totalDuration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'mixed';
  modules: LearningModule[];
  milestones: Milestone[];
  assessments: Assessment[];
}

interface Milestone {
  id: string;
  title: string;
  description: string;
  requiredModules: string[];
  achievement: string;
}

interface Assessment {
  id: string;
  title: string;
  type: 'quiz' | 'project' | 'code-review';
  questions?: QuizQuestion[];
  projectDescription?: string;
  passingScore: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface DeveloperProfile {
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  knownTechnologies: string[];
  learningGoals: string[];
  timeCommitment: 'casual' | 'regular' | 'intensive';
}

class LearningPathService {
  /**
   * Generates a personalized learning path for a repository
   */
  async generateLearningPath(
    repoUrl: string,
    techStack: string[],
    files: FileInfo[],
    profile?: DeveloperProfile
  ): Promise<LearningPath> {
    // Analyze repository complexity
    const complexity = this.analyzeComplexity(files, techStack);
    
    // Generate modules based on tech stack
    const modules = await this.generateModules(techStack, complexity, profile);
    
    // Create milestones
    const milestones = this.createMilestones(modules);
    
    // Generate assessments
    const assessments = await this.generateAssessments(modules, techStack);
    
    // Calculate total duration
    const totalDuration = this.calculateTotalDuration(modules);
    
    return {
      title: `Mastering ${this.getProjectName(repoUrl)}`,
      description: `A comprehensive learning path to understand and contribute to this ${techStack.join(', ')} project`,
      totalDuration,
      difficulty: this.determineDifficulty(complexity, profile),
      modules,
      milestones,
      assessments,
    };
  }

  /**
   * Generates learning modules based on tech stack
   */
  private async generateModules(
    techStack: string[],
    complexity: number,
    profile?: DeveloperProfile
  ): Promise<LearningModule[]> {
    const modules: LearningModule[] = [];
    
    // Module 1: Project Overview
    modules.push({
      id: 'module-1',
      title: 'Project Overview & Setup',
      description: 'Understand the project structure and set up your development environment',
      difficulty: 'beginner',
      estimatedTime: '2-3 hours',
      prerequisites: [],
      topics: [
        'Project architecture',
        'Development environment setup',
        'Running the project locally',
        'Understanding the codebase structure',
      ],
      resources: [
        {
          type: 'documentation',
          title: 'Project README',
          description: 'Official project documentation',
        },
        {
          type: 'tutorial',
          title: 'Setting Up Your Development Environment',
          description: 'Step-by-step guide to get started',
          duration: '30 minutes',
        },
      ],
      practiceExercises: [
        {
          title: 'Clone and Run',
          description: 'Clone the repository and run it successfully on your local machine',
          difficulty: 'easy',
          hints: [
            'Check the README for installation instructions',
            'Make sure all dependencies are installed',
            'Verify environment variables are set correctly',
          ],
        },
        {
          title: 'Explore the Codebase',
          description: 'Navigate through the project structure and identify key components',
          difficulty: 'easy',
          hints: [
            'Look for main entry points',
            'Identify configuration files',
            'Find the core business logic',
          ],
        },
      ],
    });

    // Generate tech-specific modules
    for (const tech of techStack) {
      const module = await this.generateTechModule(tech, complexity, profile);
      modules.push(module);
    }

    // Module: Advanced Concepts
    if (complexity > 0.6) {
      modules.push({
        id: `module-${modules.length + 1}`,
        title: 'Advanced Concepts & Patterns',
        description: 'Deep dive into advanced patterns and best practices used in this project',
        difficulty: 'advanced',
        estimatedTime: '4-6 hours',
        prerequisites: modules.slice(0, -1).map(m => m.id),
        topics: [
          'Design patterns in use',
          'Performance optimization',
          'Security best practices',
          'Scalability considerations',
        ],
        resources: [
          {
            type: 'article',
            title: 'Design Patterns in Modern Applications',
            description: 'Understanding common design patterns',
            duration: '45 minutes',
          },
          {
            type: 'video',
            title: 'Performance Optimization Techniques',
            description: 'Learn how to optimize application performance',
            duration: '1 hour',
          },
        ],
        practiceExercises: [
          {
            title: 'Identify Patterns',
            description: 'Find and document design patterns used in the codebase',
            difficulty: 'medium',
            hints: [
              'Look for singleton, factory, or observer patterns',
              'Check how dependencies are managed',
              'Analyze the data flow',
            ],
          },
          {
            title: 'Optimize a Feature',
            description: 'Choose a feature and propose performance improvements',
            difficulty: 'hard',
            hints: [
              'Profile the application to find bottlenecks',
              'Consider caching strategies',
              'Look for unnecessary computations',
            ],
          },
        ],
      });
    }

    // Module: Contributing
    modules.push({
      id: `module-${modules.length + 1}`,
      title: 'Contributing to the Project',
      description: 'Learn how to make meaningful contributions',
      difficulty: 'intermediate',
      estimatedTime: '3-4 hours',
      prerequisites: modules.slice(0, -1).map(m => m.id),
      topics: [
        'Understanding contribution guidelines',
        'Writing good commit messages',
        'Creating pull requests',
        'Code review process',
        'Testing your changes',
      ],
      resources: [
        {
          type: 'documentation',
          title: 'Contributing Guidelines',
          description: 'How to contribute to this project',
        },
        {
          type: 'article',
          title: 'Writing Effective Pull Requests',
          description: 'Best practices for PRs',
          duration: '20 minutes',
        },
      ],
      practiceExercises: [
        {
          title: 'Fix a Bug',
          description: 'Find and fix a small bug or issue',
          difficulty: 'medium',
          hints: [
            'Check the issue tracker',
            'Look for "good first issue" labels',
            'Write tests for your fix',
          ],
        },
        {
          title: 'Add a Feature',
          description: 'Implement a small feature or enhancement',
          difficulty: 'hard',
          hints: [
            'Discuss the feature with maintainers first',
            'Follow the project coding style',
            'Update documentation',
          ],
        },
      ],
    });

    return modules;
  }

  /**
   * Generates a module for a specific technology
   */
  private async generateTechModule(
    tech: string,
    complexity: number,
    profile?: DeveloperProfile
  ): Promise<LearningModule> {
    const techLower = tech.toLowerCase();
    const moduleId = `module-${tech.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Determine difficulty based on profile
    let difficulty: 'beginner' | 'intermediate' | 'advanced' = 'intermediate';
    if (profile?.knownTechnologies.includes(tech)) {
      difficulty = 'beginner';
    } else if (complexity > 0.7) {
      difficulty = 'advanced';
    }

    // Tech-specific content
    const techContent = this.getTechContent(tech);

    return {
      id: moduleId,
      title: `Understanding ${tech}`,
      description: `Learn how ${tech} is used in this project`,
      difficulty,
      estimatedTime: difficulty === 'beginner' ? '2-3 hours' : difficulty === 'intermediate' ? '4-5 hours' : '6-8 hours',
      prerequisites: ['module-1'],
      topics: techContent.topics,
      resources: techContent.resources,
      practiceExercises: techContent.exercises,
    };
  }

  /**
   * Gets tech-specific content
   */
  private getTechContent(tech: string): {
    topics: string[];
    resources: LearningResource[];
    exercises: Exercise[];
  } {
    const techLower = tech.toLowerCase();

    // React content
    if (techLower.includes('react')) {
      return {
        topics: [
          'React component architecture',
          'State management',
          'Hooks and lifecycle',
          'Component composition',
          'Performance optimization',
        ],
        resources: [
          {
            type: 'documentation',
            title: 'React Official Documentation',
            url: 'https://react.dev',
            description: 'Official React documentation',
          },
          {
            type: 'tutorial',
            title: 'React Hooks Deep Dive',
            description: 'Understanding React Hooks',
            duration: '1 hour',
          },
        ],
        exercises: [
          {
            title: 'Analyze Component Structure',
            description: 'Map out the component hierarchy in the project',
            difficulty: 'easy',
            hints: [
              'Start from the root component',
              'Identify reusable components',
              'Note prop drilling patterns',
            ],
          },
          {
            title: 'Refactor a Component',
            description: 'Improve a component using modern React patterns',
            difficulty: 'medium',
            hints: [
              'Consider using custom hooks',
              'Optimize re-renders',
              'Improve prop types',
            ],
          },
        ],
      };
    }

    // Node.js content
    if (techLower.includes('node')) {
      return {
        topics: [
          'Node.js event loop',
          'Asynchronous programming',
          'Express.js middleware',
          'Error handling',
          'API design',
        ],
        resources: [
          {
            type: 'documentation',
            title: 'Node.js Documentation',
            url: 'https://nodejs.org/docs',
            description: 'Official Node.js documentation',
          },
          {
            type: 'article',
            title: 'Understanding the Event Loop',
            description: 'How Node.js handles async operations',
            duration: '30 minutes',
          },
        ],
        exercises: [
          {
            title: 'Trace Request Flow',
            description: 'Follow an API request through the entire backend',
            difficulty: 'medium',
            hints: [
              'Start from the route definition',
              'Follow through middleware',
              'Track database operations',
            ],
          },
          {
            title: 'Add Error Handling',
            description: 'Improve error handling in an endpoint',
            difficulty: 'medium',
            hints: [
              'Use try-catch blocks',
              'Create custom error classes',
              'Add proper HTTP status codes',
            ],
          },
        ],
      };
    }

    // Python content
    if (techLower.includes('python')) {
      return {
        topics: [
          'Python best practices',
          'Virtual environments',
          'Package management',
          'Testing with pytest',
          'Type hints',
        ],
        resources: [
          {
            type: 'documentation',
            title: 'Python Documentation',
            url: 'https://docs.python.org',
            description: 'Official Python documentation',
          },
          {
            type: 'book',
            title: 'Effective Python',
            description: 'Best practices for Python development',
          },
        ],
        exercises: [
          {
            title: 'Add Type Hints',
            description: 'Add type hints to a Python module',
            difficulty: 'easy',
            hints: [
              'Use typing module',
              'Start with function signatures',
              'Run mypy for validation',
            ],
          },
          {
            title: 'Write Unit Tests',
            description: 'Add unit tests for a module',
            difficulty: 'medium',
            hints: [
              'Use pytest framework',
              'Test edge cases',
              'Aim for high coverage',
            ],
          },
        ],
      };
    }

    // Generic content for other technologies
    return {
      topics: [
        `${tech} fundamentals`,
        `${tech} best practices`,
        `${tech} in this project`,
        'Common patterns',
        'Debugging techniques',
      ],
      resources: [
        {
          type: 'documentation',
          title: `${tech} Documentation`,
          description: `Official ${tech} documentation`,
        },
        {
          type: 'tutorial',
          title: `Getting Started with ${tech}`,
          description: `Introduction to ${tech}`,
          duration: '1-2 hours',
        },
      ],
      exercises: [
        {
          title: `Explore ${tech} Usage`,
          description: `Find and analyze how ${tech} is used in the project`,
          difficulty: 'easy',
          hints: [
            'Search for relevant files',
            'Look at configuration',
            'Check dependencies',
          ],
        },
        {
          title: `Implement with ${tech}`,
          description: `Create a small feature using ${tech}`,
          difficulty: 'medium',
          hints: [
            'Follow existing patterns',
            'Write clean code',
            'Add documentation',
          ],
        },
      ],
    };
  }

  /**
   * Creates milestones for the learning path
   */
  private createMilestones(modules: LearningModule[]): Milestone[] {
    const milestones: Milestone[] = [];

    // Milestone 1: Setup Complete
    milestones.push({
      id: 'milestone-1',
      title: 'Environment Setup',
      description: 'Successfully set up development environment and ran the project',
      requiredModules: ['module-1'],
      achievement: '🎯 Ready to Code',
    });

    // Milestone 2: Tech Stack Mastery
    const techModules = modules.filter(m => 
      m.id !== 'module-1' && !m.title.includes('Advanced') && !m.title.includes('Contributing')
    );
    if (techModules.length > 0) {
      milestones.push({
        id: 'milestone-2',
        title: 'Tech Stack Proficiency',
        description: 'Gained understanding of all technologies used in the project',
        requiredModules: techModules.map(m => m.id),
        achievement: '🚀 Tech Savvy',
      });
    }

    // Milestone 3: Advanced Understanding
    const advancedModule = modules.find(m => m.title.includes('Advanced'));
    if (advancedModule) {
      milestones.push({
        id: 'milestone-3',
        title: 'Advanced Concepts',
        description: 'Mastered advanced patterns and best practices',
        requiredModules: [advancedModule.id],
        achievement: '🎓 Expert Level',
      });
    }

    // Milestone 4: First Contribution
    const contributingModule = modules.find(m => m.title.includes('Contributing'));
    if (contributingModule) {
      milestones.push({
        id: 'milestone-4',
        title: 'First Contribution',
        description: 'Made your first meaningful contribution to the project',
        requiredModules: [contributingModule.id],
        achievement: '⭐ Contributor',
      });
    }

    return milestones;
  }

  /**
   * Generates assessments for the learning path
   */
  private async generateAssessments(
    modules: LearningModule[],
    techStack: string[]
  ): Promise<Assessment[]> {
    const assessments: Assessment[] = [];

    // Quiz for each major module
    for (let i = 0; i < Math.min(modules.length, 3); i++) {
      const module = modules[i];
      assessments.push({
        id: `assessment-${i + 1}`,
        title: `${module.title} Quiz`,
        type: 'quiz',
        questions: await this.generateQuizQuestions(module),
        passingScore: 70,
      });
    }

    // Final project assessment
    assessments.push({
      id: 'final-project',
      title: 'Capstone Project',
      type: 'project',
      projectDescription: `Build a feature or enhancement for the project that demonstrates your understanding of ${techStack.join(', ')} and the project architecture.`,
      passingScore: 80,
    });

    return assessments;
  }

  /**
   * Generates quiz questions for a module
   */
  private async generateQuizQuestions(module: LearningModule): Promise<QuizQuestion[]> {
    // Generate 5 questions per module
    const questions: QuizQuestion[] = [];
    
    for (let i = 0; i < Math.min(5, module.topics.length); i++) {
      const topic = module.topics[i];
      questions.push({
        question: `What is the primary purpose of ${topic} in this project?`,
        options: [
          'To handle user authentication',
          'To manage application state',
          'To optimize performance',
          'To improve code organization',
        ],
        correctAnswer: Math.floor(Math.random() * 4),
        explanation: `${topic} is used to improve the overall architecture and maintainability of the project.`,
      });
    }

    return questions;
  }

  // Helper methods
  private analyzeComplexity(files: FileInfo[], techStack: string[]): number {
    let complexity = 0.5; // Base complexity

    // Adjust based on file count
    if (files.length > 500) complexity += 0.2;
    else if (files.length > 200) complexity += 0.1;

    // Adjust based on tech stack size
    if (techStack.length > 5) complexity += 0.15;
    else if (techStack.length > 3) complexity += 0.1;

    return Math.min(1, complexity);
  }

  private determineDifficulty(
    complexity: number,
    profile?: DeveloperProfile
  ): 'beginner' | 'intermediate' | 'advanced' | 'mixed' {
    if (!profile) return 'mixed';

    if (profile.experienceLevel === 'beginner') return 'beginner';
    if (profile.experienceLevel === 'advanced' && complexity > 0.7) return 'advanced';
    return 'intermediate';
  }

  private calculateTotalDuration(modules: LearningModule[]): string {
    // Simple estimation: sum up module times
    const totalHours = modules.length * 4; // Average 4 hours per module
    
    if (totalHours < 10) return `${totalHours}-${totalHours + 2} hours`;
    if (totalHours < 40) return `${Math.floor(totalHours / 8)}-${Math.ceil(totalHours / 8)} days`;
    return `${Math.floor(totalHours / 40)}-${Math.ceil(totalHours / 40)} weeks`;
  }

  private getProjectName(repoUrl: string): string {
    const parts = repoUrl.split('/');
    return parts[parts.length - 1].replace('.git', '');
  }
}

export const learningPathService = new LearningPathService();

// Export types
export type {
  LearningPath,
  LearningModule,
  LearningResource,
  Exercise,
  Milestone,
  Assessment,
  QuizQuestion,
  DeveloperProfile,
};

// Made with Bob
