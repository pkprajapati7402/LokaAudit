// Production-Ready API Route for Documentation Generation
import { NextRequest, NextResponse } from 'next/server';
import { parseRustAST, parseMoveAST, parseTypeScriptAST } from '@/lib/ast-parser';
import { generateDocumentationWithLLM, isLLMConfigured, generateBasicDocumentation } from '@/lib/llm-integration';
import { getAllProjects, getProject } from '@/lib/mongodb';

// Production configuration
const PRODUCTION_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB per file
  maxFiles: 20, // Maximum files per request
  timeout: 60000, // 60 seconds timeout
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  enableMetrics: true
};

// Request metrics for monitoring
interface RequestMetrics {
  startTime: number;
  filesProcessed: number;
  llmCallsSuccessful: number;
  llmCallsFailed: number;
  totalProcessingTime: number;
  errors: string[];
}

// Enhanced error types
class DocumentationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'DocumentationError';
  }
}

// Input validation
function validateRequest(body: any): { projectName: string; developerId: string; fileIndices: number[] } {
  if (!body) {
    throw new DocumentationError('Request body is required', 'MISSING_BODY', 400);
  }

  const { projectName, developerId, fileIndices } = body;

  if (!projectName || typeof projectName !== 'string' || projectName.trim().length === 0) {
    throw new DocumentationError('Valid projectName is required', 'INVALID_PROJECT_NAME', 400);
  }

  if (!developerId || typeof developerId !== 'string' || developerId.trim().length === 0) {
    throw new DocumentationError('Valid developerId is required', 'INVALID_DEVELOPER_ID', 400);
  }

  if (!fileIndices || !Array.isArray(fileIndices) || fileIndices.length === 0) {
    throw new DocumentationError('fileIndices must be a non-empty array', 'INVALID_FILE_INDICES', 400);
  }

  if (fileIndices.length > PRODUCTION_CONFIG.maxFiles) {
    throw new DocumentationError(
      `Too many files requested. Maximum ${PRODUCTION_CONFIG.maxFiles} files allowed`,
      'TOO_MANY_FILES',
      400
    );
  }

  // Validate file indices are numbers
  if (!fileIndices.every(index => typeof index === 'number' && index >= 0)) {
    throw new DocumentationError(
      'All file indices must be non-negative numbers',
      'INVALID_FILE_INDEX',
      400
    );
  }

  return { projectName: projectName.trim(), developerId: developerId.trim(), fileIndices };
}

// File language detection with enhanced support
function detectFileLanguage(fileName: string): 'rust' | 'move' | 'typescript' | 'javascript' | null {
  const extension = fileName.toLowerCase().split('.').pop();
  
  switch (extension) {
    case 'rs': return 'rust';
    case 'move': return 'move';
    case 'ts': return 'typescript';
    case 'js': return 'javascript';
    default: return null;
  }
}

// Enhanced file processing with production error handling
async function processFile(
  file: any,
  fileIndex: number,
  metrics: RequestMetrics,
  projectContext: any
): Promise<any> {
  const startTime = Date.now();
  
  try {
    // Validate file size
    if (file.content && file.content.length > PRODUCTION_CONFIG.maxFileSize) {
      throw new DocumentationError(
        `File ${file.fileName} exceeds maximum size limit`,
        'FILE_TOO_LARGE',
        413
      );
    }

    // Detect language
    const language = detectFileLanguage(file.fileName);
    if (!language) {
      throw new DocumentationError(
        `Unsupported file type: ${file.fileName}`,
        'UNSUPPORTED_FILE_TYPE',
        422
      );
    }

    if (PRODUCTION_CONFIG.enableDetailedLogging) {
      console.log(`🔍 Processing file: ${file.fileName} (${language})`);
    }

    // Parse AST based on language
    let parsedAST;
    switch (language) {
      case 'rust':
        parsedAST = parseRustAST(file.content, file.fileName);
        break;
      case 'move':
        parsedAST = parseMoveAST(file.content, file.fileName);
        break;
      case 'typescript':
      case 'javascript':
        parsedAST = await parseTypeScriptAST(file.content, file.fileName);
        break;
      default:
        throw new DocumentationError(
          `Language ${language} not yet supported for parsing`,
          'LANGUAGE_NOT_SUPPORTED',
          422
        );
    }

    // Generate documentation with enhanced error handling
    let documentation;
    let llmUsed = false;
    
    if (isLLMConfigured()) {
      try {
        documentation = await generateDocumentationWithLLM(parsedAST, file.content);
        metrics.llmCallsSuccessful++;
        llmUsed = true;
        
        if (PRODUCTION_CONFIG.enableDetailedLogging) {
          console.log(`✅ LLM documentation generated for ${file.fileName}`);
        }
      } catch (llmError) {
        console.warn(`⚠️ LLM generation failed for ${file.fileName}:`, llmError);
        documentation = generateEnhancedFallbackDocumentation(parsedAST, file.fileName);
        metrics.llmCallsFailed++;
        metrics.errors.push(`LLM failed for ${file.fileName}: ${(llmError as Error).message}`);
      }
    } else {
      documentation = generateEnhancedFallbackDocumentation(parsedAST, file.fileName);
      if (PRODUCTION_CONFIG.enableDetailedLogging) {
        console.log(`📝 Basic documentation generated for ${file.fileName} (no LLM configured)`);
      }
    }

    const processingTime = Date.now() - startTime;
    metrics.filesProcessed++;

    return {
      fileIndex,
      fileName: file.fileName,
      language,
      documentation,
      llmUsed,
      processingTimeMs: processingTime,
      success: true
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`❌ Error processing file ${file.fileName}:`, error);
    metrics.errors.push(`${file.fileName}: ${errorMessage}`);

    return {
      fileIndex,
      fileName: file.fileName,
      error: errorMessage,
      processingTimeMs: processingTime,
      success: false
    };
  }
}

export async function POST(request: NextRequest) {
  const metrics: RequestMetrics = {
    startTime: Date.now(),
    filesProcessed: 0,
    llmCallsSuccessful: 0,
    llmCallsFailed: 0,
    totalProcessingTime: 0,
    errors: []
  };

  try {
    // Set timeout for the entire request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new DocumentationError(
        'Request timeout exceeded',
        'REQUEST_TIMEOUT',
        408
      )), PRODUCTION_CONFIG.timeout);
    });

    // Main processing logic
    const processingPromise = async () => {
      // Validate request
      const validatedInput = validateRequest(await request.json());
      const { projectName, developerId, fileIndices } = validatedInput;

      if (PRODUCTION_CONFIG.enableDetailedLogging) {
        console.log(`🚀 Starting documentation generation for project: ${projectName}`);
        console.log(`📊 Files to process: ${fileIndices.length}`);
      }

      // Get project with error handling
      const project = await getProject(projectName, developerId);
      if (!project) {
        throw new DocumentationError(
          'Project not found',
          'PROJECT_NOT_FOUND',
          404
        );
      }

      // Validate file indices against available files
      const maxIndex = project.files.length - 1;
      const invalidIndices = fileIndices.filter(index => index > maxIndex);
      if (invalidIndices.length > 0) {
        throw new DocumentationError(
          `Invalid file indices: ${invalidIndices.join(', ')}. Max index: ${maxIndex}`,
          'INVALID_FILE_INDICES',
          400
        );
      }

      // Filter and validate selected files
      const selectedFiles = fileIndices
        .map((index: number) => ({
          ...project.files[index],
          originalIndex: index
        }))
        .filter(file => file && file.content);

      if (selectedFiles.length === 0) {
        throw new DocumentationError(
          'No valid files found with content',
          'NO_VALID_FILES',
          404
        );
      }

      // Process files with enhanced error handling
      const documentationResults = await Promise.all(
        selectedFiles.map((file, i) => 
          processFile(file, fileIndices[i], metrics, project)
        )
      );

      // Separate successful and failed results
      const successfulDocs = documentationResults.filter(result => result.success);
      const failedDocs = documentationResults.filter(result => !result.success);

      if (successfulDocs.length === 0) {
        throw new DocumentationError(
          'Failed to process any files successfully',
          'ALL_FILES_FAILED',
          500,
          { failedFiles: failedDocs }
        );
      }

      // Combine documentations for multiple files
      const finalDocumentation = successfulDocs.length === 1 
        ? successfulDocs[0].documentation
        : combineMultipleDocumentations(successfulDocs, project);

      // Calculate final metrics
      metrics.totalProcessingTime = Date.now() - metrics.startTime;

      const response = {
        success: true,
        projectName: project.projectName,
        processedFiles: successfulDocs.length,
        failedFiles: failedDocs.length,
        documentation: finalDocumentation,
        llmUsed: isLLMConfigured(),
        metrics: PRODUCTION_CONFIG.enableMetrics ? {
          totalProcessingTimeMs: metrics.totalProcessingTime,
          filesProcessed: metrics.filesProcessed,
          llmCallsSuccessful: metrics.llmCallsSuccessful,
          llmCallsFailed: metrics.llmCallsFailed,
          averageProcessingTimePerFile: metrics.totalProcessingTime / Math.max(metrics.filesProcessed, 1)
        } : undefined,
        warnings: failedDocs.length > 0 ? failedDocs.map(doc => ({
          fileName: doc.fileName,
          error: doc.error
        })) : undefined
      };

      if (PRODUCTION_CONFIG.enableDetailedLogging) {
        console.log(`✅ Documentation generation completed in ${metrics.totalProcessingTime}ms`);
        console.log(`📊 Success rate: ${successfulDocs.length}/${documentationResults.length} files`);
      }

      return NextResponse.json(response);
    };

    // Race between processing and timeout
    return await Promise.race([processingPromise(), timeoutPromise]);

  } catch (error) {
    // Enhanced error logging
    console.error('❌ Documentation generation error:', error);
    
    if (error instanceof DocumentationError) {
      return NextResponse.json(
        { 
          error: error.message,
          code: error.code,
          details: error.details,
          metrics: PRODUCTION_CONFIG.enableMetrics ? {
            totalProcessingTimeMs: Date.now() - metrics.startTime,
            filesProcessed: metrics.filesProcessed,
            errors: metrics.errors
          } : undefined
        },
        { status: error.statusCode }
      );
    }

    // Generic error fallback
    return NextResponse.json(
      { 
        error: 'Internal server error during documentation generation',
        code: 'INTERNAL_ERROR',
        requestId: crypto.randomUUID()
      },
      { status: 500 }
    );
  }
}

// Enhanced fallback documentation generator
function generateEnhancedFallbackDocumentation(parsedAST: any, fileName: string) {
  const documentation = {
    name: parsedAST.name || fileName.replace(/\.(rs|move|ts|js)$/, ''),
    description: `${getLanguageDisplayName(parsedAST.module_type)} module with comprehensive functionality`,
    overall_summary: generateIntelligentOverallSummary(parsedAST),
    summary: generateDetailedSummary(parsedAST),
    version: extractVersionFromComments(parsedAST.doc_comments) || null,
    license: extractLicenseFromComments(parsedAST.doc_comments) || null,
    functions: parsedAST.functions.map((func: any) => ({
      name: func.name,
      visibility: func.visibility,
      description: func.doc_comments.join(' ') || generateSmartFunctionDescription(func),
      parameters: func.parameters.map((param: any) => ({
        name: param.name,
        type: param.type,
        description: param.description || generateParameterDescription(param)
      })),
      return_type: func.return_type,
      examples: generateBasicExamples(func),
      complexity_score: func.complexity_score,
      security_notes: func.modifiers?.includes('unsafe') ? ['Contains unsafe code - requires careful review'] : []
    })),
    events: parsedAST.events.map((event: any) => ({
      name: event.name,
      fields: event.fields,
      description: event.doc_comments.join(' ') || generateEventDescription(event),
      purpose: generateEventPurpose(event)
    })),
    variables: parsedAST.variables.map((variable: any) => ({
      name: variable.name,
      type: variable.type,
      visibility: variable.visibility,
      description: variable.doc_comments.join(' ') || generateVariableDescription(variable),
      security_implications: variable.is_mutable ? ['Mutable state - verify access controls'] : []
    })),
    security_analysis: {
      overall_risk: parsedAST.security_insights?.length > 2 ? 'medium' : 'low',
      key_findings: parsedAST.security_insights || [],
      recommendations: generateSecurityRecommendations(parsedAST)
    },
    complexity_analysis: {
      total_complexity: parsedAST.complexity_metrics?.cyclomatic_complexity || 0,
      high_complexity_functions: parsedAST.functions?.filter((f: any) => f.complexity_score > 10).map((f: any) => f.name) || [],
      maintainability_score: calculateMaintainabilityScore(parsedAST)
    }
  };

  return documentation;
}

// Utility functions for enhanced documentation
function getLanguageDisplayName(moduleType: string): string {
  return moduleType === 'rust_crate' ? 'Rust' : 'Move';
}

function generateIntelligentOverallSummary(parsedAST: any): string {
  const language = getLanguageDisplayName(parsedAST.module_type);
  const functionCount = parsedAST.functions?.length || 0;
  const publicFunctions = parsedAST.functions?.filter((f: any) => f.visibility === 'public').length || 0;
  const hasEntryFunctions = parsedAST.functions?.some((f: any) => f.is_entry_function) || false;
  
  let summary = `This ${language} smart contract provides `;
  
  if (hasEntryFunctions) {
    summary += `public blockchain entry points through ${publicFunctions} public functions `;
  } else {
    summary += `utility functionality through ${functionCount} functions `;
  }
  
  summary += `and ${parsedAST.events?.length || 0} data structures. `;
  
  if (parsedAST.language_features?.length > 0) {
    summary += `It utilizes advanced ${language} features for enhanced functionality and security.`;
  } else {
    summary += `The contract implements standard patterns for reliable blockchain operations.`;
  }
  
  return summary;
}

function generateDetailedSummary(parsedAST: any): string {
  const complexity = parsedAST.complexity_metrics?.cyclomatic_complexity || 0;
  const securityInsights = parsedAST.security_insights?.length || 0;
  
  return `This smart contract contains ${parsedAST.functions?.length || 0} functions with a total complexity of ${complexity}. ` +
         `${securityInsights > 0 ? `Security analysis identified ${securityInsights} areas requiring attention. ` : 'Initial security analysis shows standard implementation patterns. '}` +
         `The contract is designed for ${parsedAST.module_type === 'rust_crate' ? 'Rust ecosystem' : 'Move blockchain'} deployment with comprehensive functionality.`;
}

function generateSmartFunctionDescription(func: any): string {
  if (func.is_entry_function) {
    return `Entry function for blockchain interactions with ${func.parameters?.length || 0} parameters`;
  }
  if (func.visibility === 'public') {
    return `Public utility function providing core functionality`;
  }
  return `Internal helper function supporting contract operations`;
}

function generateParameterDescription(param: any): string {
  return `${param.type} parameter for function execution`;
}

function generateBasicExamples(func: any): string[] {
  if (func.parameters?.length === 0) {
    return [`${func.name}()`];
  }
  return [];
}

function generateEventDescription(event: any): string {
  return `Data structure with ${event.fields?.length || 0} fields for contract state management`;
}

function generateEventPurpose(event: any): string {
  const abilities = [];
  if (event.has_copy) abilities.push('copyable');
  if (event.has_drop) abilities.push('droppable');
  if (event.has_store) abilities.push('storable');
  if (event.has_key) abilities.push('key resource');
  
  return abilities.length > 0 
    ? `Resource with ${abilities.join(', ')} abilities for blockchain operations`
    : 'Contract data structure for state management';
}

function generateVariableDescription(variable: any): string {
  return `${variable.visibility} ${variable.is_mutable ? 'mutable' : 'immutable'} ${variable.type} variable`;
}

function generateSecurityRecommendations(parsedAST: any): string[] {
  const recommendations = [];
  
  if (parsedAST.functions?.some((f: any) => f.complexity_score > 15)) {
    recommendations.push('Review high-complexity functions for potential simplification');
  }
  
  if (parsedAST.functions?.some((f: any) => f.visibility === 'public' && (!f.doc_comments || f.doc_comments.length === 0))) {
    recommendations.push('Add comprehensive documentation for all public functions');
  }
  
  recommendations.push('Conduct thorough testing and formal verification before deployment');
  
  return recommendations;
}

function calculateMaintainabilityScore(parsedAST: any): number {
  let score = 7; // Base score
  
  const avgComplexity = (parsedAST.complexity_metrics?.cyclomatic_complexity || 0) / Math.max(parsedAST.functions?.length || 1, 1);
  if (avgComplexity > 10) score -= 2;
  else if (avgComplexity > 5) score -= 1;
  
  const documentedFunctions = parsedAST.functions?.filter((f: any) => f.doc_comments?.length > 0).length || 0;
  const documentationRatio = documentedFunctions / Math.max(parsedAST.functions?.length || 1, 1);
  if (documentationRatio > 0.8) score += 1;
  else if (documentationRatio < 0.3) score -= 1;
  
  return Math.max(1, Math.min(10, Math.round(score)));
}

function extractVersionFromComments(comments: string[]): string | null {
  for (const comment of comments || []) {
    const versionMatch = comment.match(/version\s*[:=]\s*([^\s,;]+)/i);
    if (versionMatch) return versionMatch[1];
  }
  return null;
}

function extractLicenseFromComments(comments: string[]): string | null {
  for (const comment of comments || []) {
    const licenseMatch = comment.match(/license\s*[:=]\s*([^\s,;]+)/i);
    if (licenseMatch) return licenseMatch[1];
  }
  return null;
}

// Helper function to combine multiple file documentations with enhanced merging
function combineMultipleDocumentations(documentationResults: any[], project: any) {
  const successfulDocs = documentationResults.filter(result => result.success);
  
  // Calculate combined metrics
  const totalComplexity = successfulDocs.reduce((sum, doc) => 
    sum + (doc.documentation?.complexity_analysis?.total_complexity || 0), 0
  );
  
  const totalFunctions = successfulDocs.reduce((sum, doc) => 
    sum + (doc.documentation?.functions?.length || 0), 0
  );

  const combinedRisks = new Set();
  const combinedRecommendations = new Set();

  successfulDocs.forEach(doc => {
    if (doc.documentation?.security_analysis?.key_findings) {
      doc.documentation.security_analysis.key_findings.forEach((finding: string) => combinedRisks.add(finding));
    }
    if (doc.documentation?.security_analysis?.recommendations) {
      doc.documentation.security_analysis.recommendations.forEach((rec: string) => combinedRecommendations.add(rec));
    }
  });

  const combined = {
    name: project.projectName,
    description: `Multi-file project containing ${successfulDocs.length} smart contract modules`,
    overall_summary: generateCombinedOverallSummary(successfulDocs, project),
    summary: `Combined documentation from ${successfulDocs.length} files with ${totalFunctions} total functions across all modules. This project implements comprehensive blockchain functionality with distributed architecture and modular design patterns.`,
    version: extractProjectVersion(successfulDocs) || null,
    license: extractProjectLicense(successfulDocs) || null,
    functions: [] as any[],
    events: [] as any[],
    variables: [] as any[],
    security_analysis: {
      overall_risk: determineCombinedRisk(successfulDocs),
      key_findings: Array.from(combinedRisks),
      recommendations: Array.from(combinedRecommendations)
    },
    complexity_analysis: {
      total_complexity: totalComplexity,
      high_complexity_functions: getHighComplexityFunctions(successfulDocs),
      maintainability_score: calculateCombinedMaintainabilityScore(successfulDocs)
    },
    quality_metrics: {
      documentation_coverage: calculateCombinedDocumentationCoverage(successfulDocs),
      test_coverage_estimate: 0,
      code_quality_score: calculateCombinedCodeQuality(successfulDocs)
    },
    file_breakdown: successfulDocs.map(doc => ({
      fileName: doc.fileName,
      language: doc.language,
      functions: doc.documentation?.functions?.length || 0,
      complexity: doc.documentation?.complexity_analysis?.total_complexity || 0,
      risk_level: doc.documentation?.security_analysis?.overall_risk || 'unknown'
    }))
  };

  // Merge all components with file context
  successfulDocs.forEach(doc => {
    if (doc.documentation) {
      // Add file context to functions
      const functionsWithContext = (doc.documentation.functions || []).map((func: any) => ({
        ...func,
        source_file: doc.fileName,
        file_language: doc.language
      }));
      
      const eventsWithContext = (doc.documentation.events || []).map((event: any) => ({
        ...event,
        source_file: doc.fileName,
        file_language: doc.language
      }));
      
      const variablesWithContext = (doc.documentation.variables || []).map((variable: any) => ({
        ...variable,
        source_file: doc.fileName,
        file_language: doc.language
      }));

      combined.functions.push(...functionsWithContext);
      combined.events.push(...eventsWithContext);
      combined.variables.push(...variablesWithContext);
    }
  });

  return combined;
}

// Additional utility functions for combined documentation
function generateCombinedOverallSummary(successfulDocs: any[], project: any): string {
  const fileCount = successfulDocs.length;
  const languages = [...new Set(successfulDocs.map(doc => doc.language))];
  const totalFunctions = successfulDocs.reduce((sum, doc) => sum + (doc.documentation?.functions?.length || 0), 0);
  
  return `This multi-module project "${project.projectName}" consists of ${fileCount} smart contract files written in ${languages.join(' and ')}. ` +
         `The project provides comprehensive blockchain functionality through ${totalFunctions} functions across all modules, ` +
         `implementing a distributed architecture for scalable and maintainable smart contract development.`;
}

function extractProjectVersion(successfulDocs: any[]): string | null {
  for (const doc of successfulDocs) {
    if (doc.documentation?.version) {
      return doc.documentation.version;
    }
  }
  return null;
}

function extractProjectLicense(successfulDocs: any[]): string | null {
  for (const doc of successfulDocs) {
    if (doc.documentation?.license) {
      return doc.documentation.license;
    }
  }
  return null;
}

function determineCombinedRisk(successfulDocs: any[]): 'low' | 'medium' | 'high' {
  const risks = successfulDocs.map(doc => doc.documentation?.security_analysis?.overall_risk || 'low');
  
  if (risks.includes('high')) return 'high';
  if (risks.includes('medium')) return 'medium';
  return 'low';
}

function getHighComplexityFunctions(successfulDocs: any[]): string[] {
  const highComplexityFunctions: string[] = [];
  
  successfulDocs.forEach(doc => {
    if (doc.documentation?.complexity_analysis?.high_complexity_functions) {
      highComplexityFunctions.push(...doc.documentation.complexity_analysis.high_complexity_functions.map((func: string) => 
        `${func} (${doc.fileName})`
      ));
    }
  });
  
  return highComplexityFunctions;
}

function calculateCombinedMaintainabilityScore(successfulDocs: any[]): number {
  const scores = successfulDocs
    .map(doc => doc.documentation?.complexity_analysis?.maintainability_score || 5)
    .filter(score => score > 0);
  
  return scores.length > 0 ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 5;
}

function calculateCombinedDocumentationCoverage(successfulDocs: any[]): number {
  const coverages = successfulDocs
    .map(doc => doc.documentation?.quality_metrics?.documentation_coverage || 0)
    .filter(coverage => coverage >= 0);
  
  return coverages.length > 0 ? Math.round(coverages.reduce((sum, coverage) => sum + coverage, 0) / coverages.length) : 0;
}

function calculateCombinedCodeQuality(successfulDocs: any[]): number {
  const qualities = successfulDocs
    .map(doc => doc.documentation?.quality_metrics?.code_quality_score || 5)
    .filter(quality => quality > 0);
  
  return qualities.length > 0 ? Math.round(qualities.reduce((sum, quality) => sum + quality, 0) / qualities.length) : 5;
}
