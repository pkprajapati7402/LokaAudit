// File Management Utilities for Test Case System
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import { 
  ContractFile, 
  TestFileBundle, 
  ValidationError 
} from '../types/test-types';

export class FileManager {
  private static instance: FileManager;
  private readonly maxFileSize = 5 * 1024 * 1024; // 5MB
  private readonly allowedExtensions = ['.rs', '.move', '.mv'];
  private readonly tempDirectory: string;

  private constructor() {
    this.tempDirectory = path.join(process.cwd(), 'temp', 'test-files');
  }

  static getInstance(): FileManager {
    if (!FileManager.instance) {
      FileManager.instance = new FileManager();
    }
    return FileManager.instance;
  }

  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.tempDirectory, { recursive: true });
      console.log(`📁 File manager initialized: ${this.tempDirectory}`);
    } catch (error) {
      throw new Error(`Failed to initialize file manager: ${error}`);
    }
  }

  async validateFile(fileName: string, content: string): Promise<void> {
    // Check file extension
    const ext = path.extname(fileName).toLowerCase();
    if (!this.allowedExtensions.includes(ext)) {
      throw new ValidationError(
        `Unsupported file extension: ${ext}`,
        'fileExtension',
        ext
      );
    }

    // Check file size
    const size = Buffer.byteLength(content, 'utf8');
    if (size > this.maxFileSize) {
      throw new ValidationError(
        `File too large: ${size} bytes (max: ${this.maxFileSize})`,
        'fileSize',
        size
      );
    }

    // Check for malicious content
    if (this.containsMaliciousCode(content)) {
      throw new ValidationError(
        'File contains potentially malicious code',
        'maliciousContent',
        fileName
      );
    }

    // Language-specific validation
    const language = this.detectLanguage(fileName);
    if (language === 'rust') {
      await this.validateRustCode(content);
    } else if (language === 'move') {
      await this.validateMoveCode(content);
    }
  }

  async sanitizeCode(content: string): Promise<string> {
    // Remove potentially dangerous imports/statements
    const dangerousPatterns = [
      /std::process::/g,
      /std::fs::/g,
      /std::net::/g,
      /unsafe\s*{/g,
      /extern\s+"C"/g,
      /#\[no_mangle\]/g,
      /std::env::/g
    ];

    let sanitized = content;
    for (const pattern of dangerousPatterns) {
      sanitized = sanitized.replace(pattern, '/* REMOVED_FOR_SECURITY */');
    }

    return sanitized;
  }

  async createContractFile(fileName: string, content: string): Promise<ContractFile> {
    await this.validateFile(fileName, content);
    
    const sanitizedContent = await this.sanitizeCode(content);
    const language = this.detectLanguage(fileName);
    const size = Buffer.byteLength(sanitizedContent, 'utf8');
    const checksum = this.calculateChecksum(sanitizedContent);

    return {
      fileName,
      content: sanitizedContent,
      language: language as 'rust' | 'move',
      size,
      checksum
    };
  }

  async saveFileBundle(bundle: TestFileBundle): Promise<string> {
    const bundlePath = path.join(this.tempDirectory, `${bundle.sessionId}.bundle`);
    
    try {
      const bundleData = {
        ...bundle,
        metadata: {
          ...bundle.metadata,
          savedAt: new Date()
        }
      };

      await fs.writeFile(bundlePath, JSON.stringify(bundleData, null, 2));
      console.log(`💾 Saved file bundle: ${bundlePath}`);
      
      return bundlePath;
    } catch (error) {
      throw new Error(`Failed to save file bundle: ${error}`);
    }
  }

  async loadFileBundle(sessionId: string): Promise<TestFileBundle | null> {
    const bundlePath = path.join(this.tempDirectory, `${sessionId}.bundle`);
    
    try {
      const bundleData = await fs.readFile(bundlePath, 'utf8');
      return JSON.parse(bundleData);
    } catch (error) {
      console.warn(`Failed to load file bundle for session ${sessionId}:`, error);
      return null;
    }
  }

  async cleanupSession(sessionId: string): Promise<void> {
    const bundlePath = path.join(this.tempDirectory, `${sessionId}.bundle`);
    
    try {
      await fs.unlink(bundlePath);
      console.log(`🧹 Cleaned up file bundle: ${sessionId}`);
    } catch (error) {
      console.warn(`Failed to cleanup session ${sessionId}:`, error);
    }
  }

  private detectLanguage(fileName: string): 'rust' | 'move' | 'unknown' {
    const ext = path.extname(fileName).toLowerCase();
    
    switch (ext) {
      case '.rs':
        return 'rust';
      case '.move':
      case '.mv':
        return 'move';
      default:
        return 'unknown';
    }
  }

  private containsMaliciousCode(content: string): boolean {
    const maliciousPatterns = [
      /\beval\s*\(/,
      /\bexec\s*\(/,
      /\bsystem\s*\(/,
      /\bprocess\s*\(/,
      /include_str!\s*\(/,
      /include_bytes!\s*\(/,
      /std::process::Command/,
      /std::fs::remove/,
      /std::fs::write/,
      /std::net::/,
      /\bpanic!\s*\(/,
      /\bunreachable!\s*\(/,
      /loop\s*{\s*}/,
      /while\s+true\s*{/
    ];

    return maliciousPatterns.some(pattern => pattern.test(content));
  }

  private async validateRustCode(content: string): Promise<void> {
    // Basic Rust syntax validation
    const requiredElements = [
      // Should not require specific elements for test files
    ];

    const forbiddenElements = [
      'unsafe',
      'extern "C"',
      '#[no_mangle]',
      'std::process',
      'std::fs',
      'std::net'
    ];

    for (const forbidden of forbiddenElements) {
      if (content.includes(forbidden)) {
        throw new ValidationError(
          `Forbidden Rust element: ${forbidden}`,
          'forbiddenElement',
          forbidden
        );
      }
    }
  }

  private async validateMoveCode(content: string): Promise<void> {
    // Basic Move syntax validation
    const forbiddenElements = [
      'native',
      'borrow_global_mut',
      'move_from',
      'move_to'
    ];

    for (const forbidden of forbiddenElements) {
      if (content.includes(forbidden)) {
        throw new ValidationError(
          `Forbidden Move element: ${forbidden}`,
          'forbiddenElement',
          forbidden
        );
      }
    }
  }

  private calculateChecksum(content: string): string {
    return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
  }

  async listTempFiles(): Promise<string[]> {
    try {
      return await fs.readdir(this.tempDirectory);
    } catch (error) {
      return [];
    }
  }

  async getFileStats(sessionId: string): Promise<{
    bundleExists: boolean;
    bundleSize: number;
    lastModified: Date | null;
  }> {
    const bundlePath = path.join(this.tempDirectory, `${sessionId}.bundle`);
    
    try {
      const stats = await fs.stat(bundlePath);
      return {
        bundleExists: true,
        bundleSize: stats.size,
        lastModified: stats.mtime
      };
    } catch (error) {
      return {
        bundleExists: false,
        bundleSize: 0,
        lastModified: null
      };
    }
  }
}

// Security utilities
export class SecurityValidator {
  private static readonly DANGEROUS_PATTERNS = [
    /\beval\s*\(/gi,
    /\bexec\s*\(/gi,
    /\bsystem\s*\(/gi,
    /\bprocess\s*\(/gi,
    /include_str!\s*\(/gi,
    /include_bytes!\s*\(/gi,
    /std::process::/gi,
    /std::fs::/gi,
    /std::net::/gi,
    /unsafe\s*{/gi,
    /extern\s+"C"/gi,
    /#\[no_mangle\]/gi
  ];

  static validateCodeSecurity(code: string): { isSecure: boolean; violations: string[] } {
    const violations: string[] = [];
    
    for (const pattern of this.DANGEROUS_PATTERNS) {
      const matches = code.match(pattern);
      if (matches) {
        violations.push(`Dangerous pattern found: ${matches[0]}`);
      }
    }

    return {
      isSecure: violations.length === 0,
      violations
    };
  }

  static sanitizeFilename(filename: string): string {
    // Remove dangerous characters and ensure safe filename
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .substring(0, 100); // Limit length
  }

  static validateSessionId(sessionId: string): boolean {
    // Ensure session ID is safe and properly formatted
    return /^[a-zA-Z0-9_-]{8,64}$/.test(sessionId);
  }
}

export default FileManager;
