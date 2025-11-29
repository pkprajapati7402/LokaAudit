import { AuditRequest } from '../audit-processor';

export interface PreprocessedData {
  projectId: string;
  language: string;
  cleanedFiles: Array<{
    fileName: string;
    content: string;
    size: number;
    type: 'source' | 'config' | 'dependency';
  }>;
  dependencies: Record<string, string>;
  metadata: {
    fileCount: number;
    totalSize: number;
    complexity: number;
  };
}

export class PreProcessor {
  async process(request: AuditRequest): Promise<PreprocessedData> {
    console.log(`Pre-processing project ${request.projectId}`);

    // Clean and categorize files
    const cleanedFiles = await this.cleanFiles(request.files, request.language);
    
    // Extract dependencies
    const dependencies = await this.extractDependencies(cleanedFiles, request.language);
    
    // Calculate metadata
    const metadata = this.calculateMetadata(cleanedFiles);

    return {
      projectId: request.projectId,
      language: request.language,
      cleanedFiles,
      dependencies,
      metadata
    };
  }

  private async cleanFiles(
    files: Array<{ fileName: string; content: string; size: number }>,
    language: string
  ) {
    return files.map(file => {
      // Remove sensitive information and clean code
      const cleanedContent = this.sanitizeCode(file.content);
      
      // Determine file type
      const fileType = this.determineFileType(file.fileName, language);
      
      return {
        fileName: file.fileName,
        content: cleanedContent,
        size: cleanedContent.length,
        type: fileType
      };
    });
  }

  private sanitizeCode(content: string): string {
    // Remove comments that might contain sensitive info
    let cleaned = content;
    
    // Remove TODO comments with potential sensitive info
    cleaned = cleaned.replace(/\/\/\s*TODO:.*$/gm, '// TODO: [sanitized]');
    
    // Remove potential API keys or secrets in comments
    cleaned = cleaned.replace(/\/\/.*(?:key|secret|password|token).*$/gmi, '// [sanitized]');
    
    // Remove potential hardcoded secrets
    cleaned = cleaned.replace(/"[a-zA-Z0-9]{32,}"/g, '"[sanitized]"');
    
    return cleaned;
  }

  private determineFileType(fileName: string, language: string): 'source' | 'config' | 'dependency' {
    const configFiles = {
      'Solana (Rust)': ['Cargo.toml', 'Cargo.lock', '.toml'],
      'Near (Rust)': ['Cargo.toml', 'Cargo.lock', '.toml'],
      'Aptos (Move)': ['Move.toml', '.toml'],
      'Sui (Move)': ['Move.toml', '.toml'],
      'StarkNet (Cairo)': ['cairo_project.toml', '.toml']
    };

    const configs = configFiles[language as keyof typeof configFiles] || [];
    
    if (configs.some(config => fileName.endsWith(config) || fileName.includes(config))) {
      return 'config';
    }
    
    if (fileName.includes('test') || fileName.includes('spec')) {
      return 'dependency';
    }
    
    return 'source';
  }

  private async extractDependencies(
    files: Array<{ fileName: string; content: string; type: string }>,
    language: string
  ): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {};

    for (const file of files) {
      if (file.type === 'config') {
        const fileDeps = await this.parseDependencyFile(file, language);
        Object.assign(dependencies, fileDeps);
      }
    }

    return dependencies;
  }

  private async parseDependencyFile(
    file: { fileName: string; content: string },
    language: string
  ): Promise<Record<string, string>> {
    const dependencies: Record<string, string> = {};

    try {
      if (language.includes('Rust')) {
        // Parse Cargo.toml
        const dependencySection = file.content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
        if (dependencySection) {
          const lines = dependencySection[1].split('\n');
          for (const line of lines) {
            const match = line.match(/^([^=]+)\s*=\s*"([^"]+)"/);
            if (match) {
              dependencies[match[1].trim()] = match[2].trim();
            }
          }
        }
      } else if (language.includes('Move')) {
        // Parse Move.toml
        const dependencySection = file.content.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
        if (dependencySection) {
          const lines = dependencySection[1].split('\n');
          for (const line of lines) {
            const match = line.match(/^([^=]+)\s*=\s*"([^"]+)"/);
            if (match) {
              dependencies[match[1].trim()] = match[2].trim();
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to parse dependency file ${file.fileName}:`, error);
    }

    return dependencies;
  }

  private calculateMetadata(files: Array<{ content: string; size: number }>) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const fileCount = files.length;
    
    // Calculate basic complexity (lines of code, function count, etc.)
    let complexity = 0;
    for (const file of files) {
      const lines = file.content.split('\n').length;
      const functions = (file.content.match(/fn\s+\w+|function\s+\w+|def\s+\w+/g) || []).length;
      const conditionals = (file.content.match(/if\s|match\s|switch\s/g) || []).length;
      complexity += lines + (functions * 2) + (conditionals * 1.5);
    }

    return {
      fileCount,
      totalSize,
      complexity: Math.round(complexity)
    };
  }
}
