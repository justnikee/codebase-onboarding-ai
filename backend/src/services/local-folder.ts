import fs from 'fs/promises';
import path from 'path';
import { FileInfo } from '../types';

interface LocalAnalysisResult {
  projectName: string;
  readme: string | null;
  fileStructure: FileInfo[];
  keyFiles: Record<string, string | null>;
  totalFiles: number;
  totalSize: number;
}

class LocalFolderService {
  private readonly MAX_FILE_SIZE = 1024 * 1024; // 1MB
  private readonly MAX_FILES = 100;
  private readonly IGNORED_DIRS = new Set([
    'node_modules',
    '.git',
    'dist',
    'build',
    '.next',
    'coverage',
    '__pycache__',
    '.venv',
    'venv',
    'target',
    'bin',
    'obj',
    '.idea',
    '.vscode'
  ]);
  
  private readonly KEY_FILES = [
    'package.json',
    'requirements.txt',
    'Cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'Gemfile',
    'composer.json',
    'setup.py',
    'pyproject.toml',
    'Dockerfile',
    'docker-compose.yml',
    '.env.example',
    'tsconfig.json',
    'webpack.config.js',
    'vite.config.js',
    'next.config.js'
  ];

  /**
   * Analyze a local folder and extract project context
   */
  async analyzeFolder(folderPath: string): Promise<LocalAnalysisResult> {
    console.log(`[LocalFolder] Analyzing folder: ${folderPath}`);
    
    // Verify folder exists
    const stats = await fs.stat(folderPath);
    if (!stats.isDirectory()) {
      throw new Error('Path is not a directory');
    }

    const projectName = path.basename(folderPath);
    
    // Read README
    const readme = await this.findReadme(folderPath);
    
    // Build file structure
    const fileStructure = await this.buildFileStructure(folderPath, folderPath);
    
    // Extract key files
    const keyFiles = await this.extractKeyFiles(folderPath);
    
    // Calculate stats
    const totalFiles = this.countFiles(fileStructure);
    const totalSize = this.calculateSize(fileStructure);
    
    console.log(`[LocalFolder] Analysis complete: ${totalFiles} files, ${(totalSize / 1024).toFixed(2)} KB`);
    
    return {
      projectName,
      readme,
      fileStructure,
      keyFiles,
      totalFiles,
      totalSize
    };
  }

  /**
   * Find and read README file
   */
  private async findReadme(folderPath: string): Promise<string | null> {
    const readmeNames = ['README.md', 'README.MD', 'readme.md', 'README', 'README.txt'];
    
    for (const name of readmeNames) {
      try {
        const readmePath = path.join(folderPath, name);
        const content = await fs.readFile(readmePath, 'utf-8');
        console.log(`[LocalFolder] Found README: ${name}`);
        return content;
      } catch (error) {
        // File doesn't exist, try next
        continue;
      }
    }
    
    console.log('[LocalFolder] No README found');
    return null;
  }

  /**
   * Build file structure recursively
   */
  private async buildFileStructure(
    currentPath: string,
    basePath: string,
    depth: number = 0
  ): Promise<FileInfo[]> {
    if (depth > 5) return []; // Limit depth
    
    const items = await fs.readdir(currentPath);
    const fileInfos: FileInfo[] = [];
    
    for (const item of items) {
      const itemPath = path.join(currentPath, item);
      const relativePath = path.relative(basePath, itemPath);
      
      try {
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory()) {
          // Skip ignored directories
          if (this.IGNORED_DIRS.has(item)) {
            continue;
          }
          
          const children = await this.buildFileStructure(itemPath, basePath, depth + 1);
          
          fileInfos.push({
            name: item,
            path: relativePath,
            type: 'dir',
            size: 0,
            children
          });
        } else if (stats.isFile()) {
          // Skip large files
          if (stats.size > this.MAX_FILE_SIZE) {
            continue;
          }
          
          fileInfos.push({
            name: item,
            path: relativePath,
            type: 'file',
            size: stats.size
          });
        }
      } catch (error) {
        console.warn(`[LocalFolder] Error processing ${item}:`, error);
        continue;
      }
    }
    
    return fileInfos;
  }

  /**
   * Extract key configuration files
   */
  private async extractKeyFiles(folderPath: string): Promise<Record<string, string | null>> {
    const keyFiles: Record<string, string | null> = {};
    
    for (const fileName of this.KEY_FILES) {
      try {
        const filePath = path.join(folderPath, fileName);
        const content = await fs.readFile(filePath, 'utf-8');
        keyFiles[fileName] = content;
        console.log(`[LocalFolder] Found key file: ${fileName}`);
      } catch (error) {
        keyFiles[fileName] = null;
      }
    }
    
    return keyFiles;
  }

  /**
   * Count total files in structure
   */
  private countFiles(structure: FileInfo[]): number {
    let count = 0;
    
    for (const item of structure) {
      if (item.type === 'file') {
        count++;
      } else if (item.children) {
        count += this.countFiles(item.children);
      }
    }
    
    return count;
  }

  /**
   * Calculate total size
   */
  private calculateSize(structure: FileInfo[]): number {
    let size = 0;
    
    for (const item of structure) {
      if (item.type === 'file') {
        size += item.size || 0;
      } else if (item.children) {
        size += this.calculateSize(item.children);
      }
    }
    
    return size;
  }

  /**
   * Get file content by path
   */
  async getFileContent(folderPath: string, relativePath: string): Promise<string> {
    const fullPath = path.join(folderPath, relativePath);
    
    // Security check: ensure path is within folder
    const resolvedPath = path.resolve(fullPath);
    const resolvedFolder = path.resolve(folderPath);
    
    if (!resolvedPath.startsWith(resolvedFolder)) {
      throw new Error('Invalid file path: outside project directory');
    }
    
    const stats = await fs.stat(fullPath);
    if (stats.size > this.MAX_FILE_SIZE) {
      throw new Error('File too large');
    }
    
    return await fs.readFile(fullPath, 'utf-8');
  }

  /**
   * Detect project type from files
   */
  detectProjectType(keyFiles: Record<string, string | null>): string {
    if (keyFiles['package.json']) return 'Node.js/JavaScript';
    if (keyFiles['requirements.txt'] || keyFiles['setup.py']) return 'Python';
    if (keyFiles['Cargo.toml']) return 'Rust';
    if (keyFiles['go.mod']) return 'Go';
    if (keyFiles['pom.xml'] || keyFiles['build.gradle']) return 'Java';
    if (keyFiles['Gemfile']) return 'Ruby';
    if (keyFiles['composer.json']) return 'PHP';
    return 'Unknown';
  }
}

export const localFolderService = new LocalFolderService();

// Made with Bob
