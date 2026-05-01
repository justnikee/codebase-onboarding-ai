/**
 * Mock watsonx Service for Development/Testing
 * Use this when you don't have IBM watsonx credentials yet
 */

import { WatsonXGenerationParams } from '../types/index.js';

class MockWatsonXService {
  /**
   * Mock text generation
   */
  async generate(params: WatsonXGenerationParams): Promise<string> {
    console.log('🔧 Using MOCK watsonx service (no real API calls)');
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Return mock responses based on prompt content
    const prompt = params.prompt.toLowerCase();
    
    if (prompt.includes('summary')) {
      return this.generateMockSummary();
    } else if (prompt.includes('setup')) {
      return this.generateMockSetup();
    } else if (prompt.includes('architecture')) {
      return this.generateMockArchitecture();
    } else if (prompt.includes('tech stack')) {
      return this.generateMockTechStack();
    } else if (prompt.includes('question')) {
      return this.generateMockAnswer();
    }
    
    return 'This is a mock response from the development watsonx service.';
  }

  private generateMockSummary(): string {
    return 'This project is a modern web application built with cutting-edge technologies. ' +
           'It provides developers with tools to streamline their workflow and improve productivity. ' +
           'The application features a clean, intuitive interface and robust backend architecture.';
  }

  private generateMockSetup(): string {
    return '1. Clone the repository to your local machine\n' +
           '2. Install dependencies using npm install or yarn\n' +
           '3. Configure environment variables in .env file\n' +
           '4. Run the development server with npm run dev\n' +
           '5. Access the application at http://localhost:3000';
  }

  private generateMockArchitecture(): string {
    return 'The project follows a modern microservices architecture with clear separation of concerns. ' +
           'The frontend handles user interactions and presentation logic, while the backend manages ' +
           'data processing and business logic. Components are organized in a modular structure for ' +
           'easy maintenance and scalability.';
  }

  private generateMockTechStack(): string {
    return 'Languages: JavaScript, TypeScript\n' +
           'Frameworks: React, Next.js, Express\n' +
           'Tools: Node.js, npm, Git';
  }

  private generateMockAnswer(): string {
    return 'Based on the repository structure, this functionality is implemented in the main ' +
           'application files. You can find the relevant code in the src directory. ' +
           'For more specific information, please refer to the documentation.';
  }

  async generateProjectSummary(
    repoName: string,
    description: string | null,
    readme: string | null,
    techStack: string[]
  ): Promise<string> {
    return `${repoName} is a ${techStack.join(', ')} project. ${description || 'This project provides useful functionality for developers.'}`;
  }

  async generateSetupGuide(
    repoName: string,
    packageJson: string | null,
    requirementsTxt: string | null,
    readme: string | null
  ): Promise<string[]> {
    return [
      '1. Clone the repository',
      '2. Install dependencies',
      '3. Configure environment variables',
      '4. Run the development server',
      '5. Access the application in your browser'
    ];
  }

  async generateArchitectureExplanation(
    repoName: string,
    fileStructure: string[],
    techStack: string[]
  ): Promise<string> {
    return `${repoName} uses ${techStack.join(', ')} in a well-organized structure. ` +
           `The project contains ${fileStructure.length} files organized for maintainability and scalability.`;
  }

  async generateFileSummary(
    filename: string,
    content: string,
    maxLength: number = 500
  ): Promise<string> {
    return `${filename} contains implementation code for the application's core functionality.`;
  }

  async answerQuestion(
    question: string,
    relevantContext: Array<{ path: string; summary: string }>,
    repoName: string
  ): Promise<string> {
    if (relevantContext.length > 0) {
      return `Based on the ${repoName} repository, the relevant code can be found in: ${relevantContext.map(c => c.path).join(', ')}. ${relevantContext[0].summary}`;
    }
    return `I don't have specific information about that in the ${repoName} repository.`;
  }

  async detectTechStack(
    files: string[],
    packageJson: string | null,
    requirementsTxt: string | null
  ): Promise<{
    languages: string[];
    frameworks: string[];
    tools: string[];
  }> {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const tools: string[] = [];

    // Detect from file extensions
    if (files.some(f => f.endsWith('.ts') || f.endsWith('.tsx'))) {
      languages.push('TypeScript');
    }
    if (files.some(f => f.endsWith('.js') || f.endsWith('.jsx'))) {
      languages.push('JavaScript');
    }
    if (files.some(f => f.endsWith('.py'))) {
      languages.push('Python');
    }

    // Detect from package.json
    if (packageJson) {
      if (packageJson.includes('react')) frameworks.push('React');
      if (packageJson.includes('next')) frameworks.push('Next.js');
      if (packageJson.includes('express')) frameworks.push('Express');
      if (packageJson.includes('vue')) frameworks.push('Vue');
      tools.push('npm');
    }

    // Detect from requirements.txt
    if (requirementsTxt) {
      if (requirementsTxt.includes('django')) frameworks.push('Django');
      if (requirementsTxt.includes('flask')) frameworks.push('Flask');
      tools.push('pip');
    }

    return {
      languages: languages.length > 0 ? languages : ['JavaScript'],
      frameworks: frameworks.length > 0 ? frameworks : ['Node.js'],
      tools: tools.length > 0 ? tools : ['npm', 'Git']
    };
  }
}

export const mockWatsonxService = new MockWatsonXService();

// Made with Bob
