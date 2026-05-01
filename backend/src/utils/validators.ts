/**
 * Validation utilities for input data
 */

import { ValidationError } from '../types/index.js';

/**
 * Validates a GitHub repository URL
 * @param url - The URL to validate
 * @returns The validated URL
 * @throws ValidationError if URL is invalid
 */
export function validateGitHubUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    throw new ValidationError('Repository URL is required');
  }

  const trimmedUrl = url.trim();
  
  // GitHub URL patterns
  const patterns = [
    /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\/?$/,
    /^https?:\/\/(www\.)?github\.com\/[\w-]+\/[\w.-]+\.git$/,
  ];

  const isValid = patterns.some(pattern => pattern.test(trimmedUrl));

  if (!isValid) {
    throw new ValidationError(
      'Invalid GitHub URL. Expected format: https://github.com/owner/repo'
    );
  }

  // Normalize URL (remove trailing slash and .git)
  return trimmedUrl.replace(/\.git$/, '').replace(/\/$/, '');
}

/**
 * Extracts owner and repo name from GitHub URL
 * @param url - GitHub repository URL
 * @returns Object with owner and repo name
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } {
  const normalizedUrl = validateGitHubUrl(url);
  const match = normalizedUrl.match(/github\.com\/([\w-]+)\/([\w.-]+)/);

  if (!match) {
    throw new ValidationError('Could not parse GitHub URL');
  }

  return {
    owner: match[1],
    repo: match[2],
  };
}

/**
 * Validates context ID format
 * @param contextId - The context ID to validate
 * @returns The validated context ID
 * @throws ValidationError if context ID is invalid
 */
export function validateContextId(contextId: string): string {
  if (!contextId || typeof contextId !== 'string') {
    throw new ValidationError('Context ID is required');
  }

  // Context ID should be alphanumeric with hyphens
  const pattern = /^[a-zA-Z0-9-]+$/;
  if (!pattern.test(contextId)) {
    throw new ValidationError('Invalid context ID format');
  }

  return contextId;
}

/**
 * Validates chat question
 * @param question - The question to validate
 * @returns The validated question
 * @throws ValidationError if question is invalid
 */
export function validateQuestion(question: string): string {
  if (!question || typeof question !== 'string') {
    throw new ValidationError('Question is required');
  }

  const trimmed = question.trim();
  
  if (trimmed.length === 0) {
    throw new ValidationError('Question cannot be empty');
  }

  if (trimmed.length > 1000) {
    throw new ValidationError('Question is too long (max 1000 characters)');
  }

  return trimmed;
}

/**
 * Sanitizes file path to prevent directory traversal
 * @param path - The file path to sanitize
 * @returns Sanitized path
 */
export function sanitizeFilePath(path: string): string {
  // Remove any .. or absolute paths
  return path
    .replace(/\.\./g, '')
    .replace(/^\/+/, '')
    .replace(/^[A-Za-z]:[\\\/]/, '');
}

/**
 * Validates environment variables
 * @throws Error if required environment variables are missing
 */
export function validateEnvironment(): void {
  // If using mock service, IBM credentials are optional
  const useMock = process.env.USE_MOCK_WATSONX === 'true';
  
  if (useMock) {
    console.warn('⚠️  Running in MOCK mode - IBM watsonx credentials not required');
    console.warn('⚠️  Set USE_MOCK_WATSONX=false and add real credentials for production');
    return;
  }

  const required = [
    'IBM_WATSONX_API_KEY',
    'IBM_WATSONX_PROJECT_ID',
    'IBM_WATSONX_URL',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error(
      `\n❌ Missing required environment variables: ${missing.join(', ')}\n` +
      '\n📝 Options:\n' +
      '  1. Add IBM watsonx credentials to .env (see ENV_SETUP_GUIDE.md)\n' +
      '  2. Set USE_MOCK_WATSONX=true in .env to use mock service for testing\n'
    );
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
}

// Made with Bob
