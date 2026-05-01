/**
 * Helper utility functions
 */

import crypto from 'crypto';

/**
 * Generates a unique context ID for a repository
 * @param repoUrl - The repository URL
 * @returns A unique context ID
 */
export function generateContextId(repoUrl: string): string {
  const timestamp = Date.now();
  const hash = crypto
    .createHash('md5')
    .update(repoUrl + timestamp)
    .digest('hex')
    .substring(0, 8);
  
  return `ctx-${hash}-${timestamp}`;
}

/**
 * Extracts keywords from text for search indexing
 * @param text - The text to extract keywords from
 * @returns Array of keywords
 */
export function extractKeywords(text: string): string[] {
  if (!text) return [];

  // Convert to lowercase and remove special characters
  const cleaned = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  
  // Split into words
  const words = cleaned.split(/\s+/).filter(word => word.length > 2);
  
  // Remove common stop words
  const stopWords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'as', 'by', 'from', 'this', 'that',
    'these', 'those', 'are', 'was', 'were', 'been', 'be', 'have', 'has',
    'had', 'do', 'does', 'did', 'will', 'would', 'should', 'could', 'may',
    'might', 'must', 'can', 'it', 'its', 'you', 'your', 'we', 'our', 'they',
    'their', 'them', 'he', 'she', 'his', 'her', 'him',
  ]);
  
  const keywords = words.filter(word => !stopWords.has(word));
  
  // Return unique keywords
  return [...new Set(keywords)];
}

/**
 * Calculates similarity score between two texts based on keyword overlap
 * @param text1 - First text
 * @param text2 - Second text
 * @returns Similarity score between 0 and 1
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));
  
  if (keywords1.size === 0 || keywords2.size === 0) return 0;
  
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);
  
  return intersection.size / union.size;
}

/**
 * Detects programming language from file extension
 * @param filename - The filename to check
 * @returns The detected language or 'unknown'
 */
export function detectLanguage(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    js: 'JavaScript',
    jsx: 'JavaScript',
    ts: 'TypeScript',
    tsx: 'TypeScript',
    py: 'Python',
    java: 'Java',
    cpp: 'C++',
    c: 'C',
    cs: 'C#',
    go: 'Go',
    rs: 'Rust',
    rb: 'Ruby',
    php: 'PHP',
    swift: 'Swift',
    kt: 'Kotlin',
    scala: 'Scala',
    html: 'HTML',
    css: 'CSS',
    scss: 'SCSS',
    sass: 'SASS',
    json: 'JSON',
    xml: 'XML',
    yaml: 'YAML',
    yml: 'YAML',
    md: 'Markdown',
    sql: 'SQL',
    sh: 'Shell',
    bash: 'Bash',
  };
  
  return ext ? languageMap[ext] || 'Unknown' : 'Unknown';
}

/**
 * Determines if a file is important for analysis
 * @param path - File path
 * @returns Importance level
 */
export function getFileImportance(path: string): 'high' | 'medium' | 'low' {
  const filename = path.split('/').pop()?.toLowerCase() || '';
  
  // High importance files
  const highImportance = [
    'readme.md',
    'package.json',
    'requirements.txt',
    'setup.py',
    'cargo.toml',
    'go.mod',
    'pom.xml',
    'build.gradle',
    'dockerfile',
    'docker-compose.yml',
    '.env.example',
    'config.js',
    'config.ts',
  ];
  
  if (highImportance.includes(filename)) return 'high';
  
  // Medium importance patterns
  const mediumPatterns = [
    /^index\.(js|ts|jsx|tsx|py|html)$/,
    /^main\.(js|ts|py|go|rs)$/,
    /^app\.(js|ts|py)$/,
    /^server\.(js|ts)$/,
    /\.config\.(js|ts)$/,
    /^\..*rc$/,
  ];
  
  if (mediumPatterns.some(pattern => pattern.test(filename))) return 'medium';
  
  return 'low';
}

/**
 * Truncates text to a maximum length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Formats a date to ISO string
 * @param date - Date to format
 * @returns ISO formatted date string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toISOString();
}

/**
 * Delays execution for specified milliseconds
 * @param ms - Milliseconds to delay
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retries an async operation with exponential backoff
 * @param fn - Function to retry
 * @param maxRetries - Maximum number of retries
 * @param baseDelay - Base delay in milliseconds
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (i < maxRetries - 1) {
        const delayMs = baseDelay * Math.pow(2, i);
        await delay(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * Safely parses JSON with error handling
 * @param json - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

/**
 * Chunks an array into smaller arrays
 * @param array - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

// Made with Bob
