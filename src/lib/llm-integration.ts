// Production-Ready LLM Integration for Documentation Generation
import Groq from 'groq-sdk';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { ParsedAST } from './ast-parser';

// Production configurations
const LLM_CONFIG = {
  groq: {
    model: 'deepseek-r1-distill-llama-70b',
    maxTokens: 4096,
    temperature: 0.1,
    timeout: 30000,
    retries: 3
  },
  gemini: {
    model: 'gemini-2.0-flash',
    maxTokens: 8192,
    temperature: 0.2,
    timeout: 45000,
    retries: 3
  }
};

// Rate limiting
const rateLimiter = {
  groq: { lastCall: 0, minInterval: 1000 }, // 1 second between calls
  gemini: { lastCall: 0, minInterval: 1500 } // 1.5 seconds between calls
};

interface DocumentationOutput {
  name: string;
  description: string;
  overall_summary: string;
  summary: string;
  version: string | null;
  license: string | null;
  functions: Array<{
    name: string;
    visibility: 'public' | 'private' | 'internal';
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      description: string;
    }>;
    return_type: string | null;
    examples: string[];
    security_notes?: string[];
    complexity_score?: number;
  }>;
  events: Array<{
    name: string;
    fields: Array<{
      name: string;
      type: string;
    }>;
    description: string;
    purpose?: string;
  }>;
  variables: Array<{
    name: string;
    type: string;
    visibility: 'public' | 'private';
    description: string;
    security_implications?: string[];
  }>;
  security_analysis?: {
    overall_risk: 'low' | 'medium' | 'high';
    key_findings: string[];
    recommendations: string[];
  };
  complexity_analysis?: {
    total_complexity: number;
    high_complexity_functions: string[];
    maintainability_score: number;
  };
  quality_metrics?: {
    documentation_coverage: number;
    test_coverage_estimate: number;
    code_quality_score: number;
  };
}

// Enhanced error types for better error handling
class LLMIntegrationError extends Error {
  constructor(
    message: string,
    public readonly service: 'groq' | 'gemini',
    public readonly originalError?: Error,
    public readonly retryable: boolean = true
  ) {
    super(message);
    this.name = 'LLMIntegrationError';
  }
}

class RateLimitError extends LLMIntegrationError {
  constructor(service: 'groq' | 'gemini') {
    super(`Rate limit exceeded for ${service}`, service, undefined, true);
    this.name = 'RateLimitError';
  }
}

// Enhanced validation utilities
function validateParsedAST(parsedAST: ParsedAST): void {
  if (!parsedAST.name || typeof parsedAST.name !== 'string') {
    throw new Error('Invalid ParsedAST: name is required');
  }
  if (!Array.isArray(parsedAST.functions)) {
    throw new Error('Invalid ParsedAST: functions must be an array');
  }
  if (!Array.isArray(parsedAST.events)) {
    throw new Error('Invalid ParsedAST: events must be an array');
  }
  if (!Array.isArray(parsedAST.variables)) {
    throw new Error('Invalid ParsedAST: variables must be an array');
  }
}

// Initialize clients with error handling
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Rate limiting utility
async function waitForRateLimit(service: 'groq' | 'gemini'): Promise<void> {
  const now = Date.now();
  const lastCall = rateLimiter[service].lastCall;
  const minInterval = rateLimiter[service].minInterval;
  const timeSinceLastCall = now - lastCall;
  
  if (timeSinceLastCall < minInterval) {
    const waitTime = minInterval - timeSinceLastCall;
    await new Promise(resolve => setTimeout(resolve, waitTime));
  }
  
  rateLimiter[service].lastCall = Date.now();
}

// Retry mechanism with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  service: 'groq' | 'gemini',
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      await waitForRateLimit(service);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on non-retryable errors
      if (error instanceof LLMIntegrationError && !error.retryable) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s, etc.
      if (attempt < maxRetries - 1) {
        const backoffTime = Math.pow(2, attempt) * 1000;
        console.warn(`${service} attempt ${attempt + 1} failed, retrying in ${backoffTime}ms:`, error);
        await new Promise(resolve => setTimeout(resolve, backoffTime));
      }
    }
  }
  
  throw new LLMIntegrationError(
    `All ${maxRetries} attempts failed for ${service}`,
    service,
    lastError!
  );
}

/**
 * Production-ready documentation generation with comprehensive error handling
 */
export async function generateDocumentationWithLLM(
  parsedAST: ParsedAST,
  sourceCode: string
): Promise<DocumentationOutput> {
  // Validate inputs
  validateParsedAST(parsedAST);
  
  if (!sourceCode || typeof sourceCode !== 'string') {
    throw new Error('Invalid source code provided');
  }
  
  if (!process.env.GROQ_API_KEY && !process.env.GEMINI_API_KEY) {
    console.warn('No LLM API keys configured, using fallback documentation');
    return generateBasicDocumentation(parsedAST);
  }
  
  try {
    console.log(`🚀 Starting production documentation generation for ${parsedAST.name}`);
    
    // Step 1: Generate comprehensive analysis with Groq
    const groqAnalysis = await retryWithBackoff(
      () => generateComprehensiveAnalysisWithGroq(parsedAST, sourceCode),
      'groq',
      LLM_CONFIG.groq.retries
    );
    
    // Step 2: Generate overall summary with Gemini
    const overallSummary = await retryWithBackoff(
      () => generateOverallSummaryWithGemini(parsedAST),
      'gemini',
      LLM_CONFIG.gemini.retries
    );
    
    // Step 3: Generate security and complexity analysis
    const securityAnalysis = await retryWithBackoff(
      () => generateSecurityAnalysisWithGemini(parsedAST, sourceCode),
      'gemini',
      LLM_CONFIG.gemini.retries
    );
    
    // Step 4: Combine and enhance the documentation
    const enhancedDoc = await enhanceDocumentationOutput(
      groqAnalysis,
      overallSummary,
      securityAnalysis,
      parsedAST
    );
    
    console.log('✅ Production documentation generation completed successfully');
    
    return enhancedDoc;
    
  } catch (error) {
    console.error('❌ LLM documentation generation failed:', error);
    
    // Enhanced fallback with partial LLM results if available
    return generateEnhancedFallbackDocumentation(parsedAST, error as Error);
  }
}

/**
 * Generate overall summary using Gemini by analyzing AST components
 */
async function generateOverallSummaryWithGemini(parsedAST: ParsedAST): Promise<string> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
You are a smart contract analysis expert. Analyze the following smart contract components and generate a concise overall summary explaining what this smart contract is for and what it's doing.

Contract Name: ${parsedAST.name}
Language: ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'}

FUNCTIONS:
${parsedAST.functions.map(func => `
- ${func.name} (${func.visibility})
  Parameters: ${func.parameters.map(p => `${p.name}: ${p.type}`).join(', ') || 'none'}
  Returns: ${func.return_type || 'void'}
  Comments: ${func.doc_comments.join(' ') || 'none'}
`).join('')}

EVENTS/STRUCTS:
${parsedAST.events.map(event => `
- ${event.name}
  Fields: ${event.fields.map(f => `${f.name}: ${f.type}`).join(', ') || 'none'}
  Comments: ${event.doc_comments.join(' ') || 'none'}
`).join('')}

VARIABLES/CONSTANTS:
${parsedAST.variables.map(variable => `
- ${variable.name} (${variable.visibility}): ${variable.type}
  Comments: ${variable.doc_comments.join(' ') || 'none'}
`).join('')}

Based on these functions, events, structs, and variables, write a concise 1-2 sentence summary explaining:
1. What is the primary purpose of this smart contract?
2. What main functionality does it provide?

Respond with ONLY the summary text, no additional formatting or explanations.`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text().trim();
    
    // Clean up any potential markdown code blocks and formatting
    let cleanResponse = response.replace(/```json\s*|\s*```/g, '').trim();
    cleanResponse = cleanResponse.replace(/^["']|["']$/g, '').trim();
    
    return cleanResponse;
  } catch (error) {
    console.warn('Failed to generate overall summary with Gemini:', error);
    // Fallback summary based on AST analysis
    const functionNames = parsedAST.functions.slice(0, 3).map(f => f.name).join(', ');
    return `This smart contract provides ${parsedAST.functions.length} functions including ${functionNames}, designed for ${parsedAST.module_type === 'rust_crate' ? 'Rust-based' : 'Move-based'} blockchain functionality.`;
  }
}

/**
 * Use Groq to generate descriptions and examples
 */
/**
 * Generate comprehensive analysis with Groq
 */
async function generateComprehensiveAnalysisWithGroq(parsedAST: ParsedAST, sourceCode: string): Promise<any> {
  const prompt = `
You are a senior smart contract auditor and technical documentation expert. Analyze this ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} smart contract comprehensively.

CONTRACT METADATA:
- Name: ${parsedAST.name}
- Language: ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'}
- Total Lines: ${parsedAST.total_lines}
- Functions: ${parsedAST.functions.length}
- Structs/Events: ${parsedAST.events.length}
- Constants/Variables: ${parsedAST.variables.length}
- Language Features: ${parsedAST.language_features.join(', ') || 'none'}
- Security Insights: ${parsedAST.security_insights.join(', ') || 'none'}

COMPLEXITY METRICS:
- Total Cyclomatic Complexity: ${parsedAST.complexity_metrics.cyclomatic_complexity}
- Function Count: ${parsedAST.complexity_metrics.function_count}
- Struct Count: ${parsedAST.complexity_metrics.struct_count}
- Constant Count: ${parsedAST.complexity_metrics.const_count}

DETAILED COMPONENTS:
${JSON.stringify({
  functions: parsedAST.functions.map(f => ({
    name: f.name,
    visibility: f.visibility,
    parameters: f.parameters,
    return_type: f.return_type,
    complexity_score: f.complexity_score,
    modifiers: f.modifiers,
    doc_comments: f.doc_comments
  })),
  events: parsedAST.events.map(e => ({
    name: e.name,
    fields: e.fields,
    doc_comments: e.doc_comments,
    abilities: {
      has_copy: e.has_copy,
      has_drop: e.has_drop,
      has_store: e.has_store,
      has_key: e.has_key
    }
  })),
  variables: parsedAST.variables.map(v => ({
    name: v.name,
    type: v.type,
    visibility: v.visibility,
    is_mutable: v.is_mutable,
    value: v.value,
    doc_comments: v.doc_comments
  }))
}, null, 2)}

SOURCE CODE EXCERPT:
\`\`\`${parsedAST.module_type === 'rust_crate' ? 'rust' : 'move'}
${sourceCode.length > 6000 ? sourceCode.substring(0, 6000) + '\n... (truncated)' : sourceCode}
\`\`\`

ANALYSIS REQUIREMENTS:
1. Generate a comprehensive module description explaining the contract's main purpose and business logic
2. Create detailed descriptions for each function, explaining business logic, not just technical details
3. Identify potential security concerns and best practice violations
4. Analyze code quality and maintainability
5. Provide usage examples for key public functions
6. Assess complexity and suggest optimizations

Respond ONLY with valid JSON in this exact format:

{
  "module_description": "Comprehensive description of the module's business purpose and core functionality",
  "summary": "Detailed 3-4 sentence summary explaining specific contract functionality, business logic, security considerations, and intended use cases",
  "version": "version if found in code or null",
  "license": "license if found in comments or null",
  "function_descriptions": {
    "function_name": {
      "description": "Detailed description of business logic and functionality",
      "parameter_descriptions": {
        "param_name": "Clear explanation of parameter purpose and constraints"
      },
      "examples": ["practical usage examples"],
      "security_notes": ["security considerations if any"],
      "complexity_notes": "complexity analysis if high complexity"
    }
  },
  "event_descriptions": {
    "event_name": {
      "description": "What this event/struct represents in business terms",
      "purpose": "Why this data structure exists and how it's used"
    }
  },
  "variable_descriptions": {
    "variable_name": {
      "description": "Purpose and usage of this variable",
      "security_implications": ["security implications if any"]
    }
  },
  "quality_assessment": {
    "maintainability_score": 0-10,
    "documentation_quality": 0-10,
    "code_organization": 0-10
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: LLM_CONFIG.groq.model,
    temperature: LLM_CONFIG.groq.temperature,
    max_tokens: LLM_CONFIG.groq.maxTokens,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new LLMIntegrationError('No response from Groq', 'groq');
  }

  return parseJSONResponse(response, 'groq');
}

/**
 * Generate security analysis with Gemini
 */
async function generateSecurityAnalysisWithGemini(parsedAST: ParsedAST, sourceCode: string): Promise<any> {
  const model = genAI.getGenerativeModel({ model: LLM_CONFIG.gemini.model });

  const prompt = `
You are a blockchain security expert. Perform a comprehensive security analysis of this smart contract.

CONTRACT: ${parsedAST.name}
LANGUAGE: ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'}

SECURITY INSIGHTS FROM PARSER:
${parsedAST.security_insights.join('\n- ') || 'None detected'}

LANGUAGE FEATURES:
${parsedAST.language_features.join(', ') || 'None'}

FUNCTIONS ANALYSIS:
${parsedAST.functions.map(f => `
- ${f.name} (${f.visibility}, complexity: ${f.complexity_score})
  Parameters: ${f.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}
  Modifiers: ${f.modifiers.join(', ') || 'none'}
`).join('')}

HIGH-RISK PATTERNS TO CHECK:
- Unchecked external calls
- Integer overflow/underflow
- Reentrancy vulnerabilities
- Access control issues
- Resource management problems
- Input validation gaps
- State manipulation vulnerabilities

Analyze the code for:
1. Overall security risk level
2. Specific security findings
3. Recommendations for improvement
4. Compliance with best practices

Respond with valid JSON:

{
  "overall_risk": "low|medium|high",
  "key_findings": [
    "specific security finding with location and impact"
  ],
  "recommendations": [
    "specific actionable recommendation"
  ],
  "compliance_score": 0-10,
  "audit_notes": [
    "notes for manual review"
  ]
}`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  return parseJSONResponse(response, 'gemini');
}

/**
 * Enhanced documentation output combining all analyses
 */
async function enhanceDocumentationOutput(
  groqAnalysis: any,
  overallSummary: string,
  securityAnalysis: any,
  parsedAST: ParsedAST
): Promise<DocumentationOutput> {
  
  const baseDoc: DocumentationOutput = {
    name: parsedAST.name,
    description: groqAnalysis.module_description || `${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} smart contract`,
    overall_summary: overallSummary,
    summary: groqAnalysis.summary || generateBasicSummary(parsedAST),
    version: groqAnalysis.version || null,
    license: groqAnalysis.license || null,
    functions: [],
    events: [],
    variables: [],
    security_analysis: {
      overall_risk: securityAnalysis.overall_risk || 'medium',
      key_findings: securityAnalysis.key_findings || [],
      recommendations: securityAnalysis.recommendations || []
    },
    complexity_analysis: {
      total_complexity: parsedAST.complexity_metrics.cyclomatic_complexity,
      high_complexity_functions: parsedAST.functions
        .filter(f => f.complexity_score > 10)
        .map(f => f.name),
      maintainability_score: groqAnalysis.quality_assessment?.maintainability_score || 5
    },
    quality_metrics: {
      documentation_coverage: calculateDocumentationCoverage(parsedAST),
      test_coverage_estimate: 0, // Would need actual test analysis
      code_quality_score: groqAnalysis.quality_assessment?.code_organization || 5
    }
  };

  // Enhanced function mapping
  baseDoc.functions = parsedAST.functions.map(func => {
    const funcAnalysis = groqAnalysis.function_descriptions?.[func.name] || {};
    return {
      name: func.name,
      visibility: func.visibility,
      description: funcAnalysis.description || func.doc_comments.join(' ') || `Function ${func.name}`,
      parameters: func.parameters.map(param => ({
        name: param.name,
        type: param.type,
        description: funcAnalysis.parameter_descriptions?.[param.name] || `Parameter of type ${param.type}`
      })),
      return_type: func.return_type,
      examples: funcAnalysis.examples || [],
      security_notes: funcAnalysis.security_notes || [],
      complexity_score: func.complexity_score
    };
  });

  // Enhanced event mapping
  baseDoc.events = parsedAST.events.map(event => {
    const eventAnalysis = groqAnalysis.event_descriptions?.[event.name] || {};
    return {
      name: event.name,
      fields: event.fields,
      description: eventAnalysis.description || event.doc_comments.join(' ') || `Event/Struct ${event.name}`,
      purpose: eventAnalysis.purpose || 'Data structure for contract state'
    };
  });

  // Enhanced variable mapping
  baseDoc.variables = parsedAST.variables.map(variable => {
    const varAnalysis = groqAnalysis.variable_descriptions?.[variable.name] || {};
    return {
      name: variable.name,
      type: variable.type,
      visibility: variable.visibility,
      description: varAnalysis.description || variable.doc_comments.join(' ') || `Variable of type ${variable.type}`,
      security_implications: varAnalysis.security_implications || []
    };
  });

  return baseDoc;
}

/**
 * Enhanced fallback documentation for production environments
 */
function generateEnhancedFallbackDocumentation(parsedAST: ParsedAST, error: Error): DocumentationOutput {
  console.warn('Generating enhanced fallback documentation due to:', error.message);
  
  const basicDoc = generateBasicDocumentation(parsedAST);
  
  // Add production-ready enhancements even in fallback mode
  return {
    ...basicDoc,
    overall_summary: generateIntelligentSummary(parsedAST),
    security_analysis: {
      overall_risk: parsedAST.security_insights.length > 0 ? 'medium' : 'low',
      key_findings: parsedAST.security_insights,
      recommendations: generateBasicSecurityRecommendations(parsedAST)
    },
    complexity_analysis: {
      total_complexity: parsedAST.complexity_metrics.cyclomatic_complexity,
      high_complexity_functions: parsedAST.functions
        .filter(f => f.complexity_score > 10)
        .map(f => f.name),
      maintainability_score: calculateMaintainabilityScore(parsedAST)
    },
    quality_metrics: {
      documentation_coverage: calculateDocumentationCoverage(parsedAST),
      test_coverage_estimate: 0,
      code_quality_score: calculateCodeQualityScore(parsedAST)
    }
  };
}

// Utility functions for enhanced documentation

function parseJSONResponse(response: string, service: 'groq' | 'gemini'): any {
  try {
    return JSON.parse(response);
  } catch (e) {
    console.warn(`Failed to parse ${service} response as JSON:`, response);
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.warn(`Failed to parse extracted JSON from ${service} response`);
      }
    }
    throw new LLMIntegrationError(`Invalid JSON response from ${service}`, service, e as Error, false);
  }
}

function generateBasicSummary(parsedAST: ParsedAST): string {
  const functionCount = parsedAST.functions.length;
  const publicFunctions = parsedAST.functions.filter(f => f.visibility === 'public').length;
  const complexity = parsedAST.complexity_metrics.cyclomatic_complexity;
  
  return `This ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} smart contract implements ${functionCount} functions (${publicFunctions} public) with a total complexity of ${complexity}. The contract provides core functionality through ${parsedAST.functions.slice(0, 3).map(f => f.name).join(', ')}${functionCount > 3 ? ' and other functions' : ''}. ${parsedAST.security_insights.length > 0 ? 'Security analysis has identified potential areas for review.' : 'Initial security analysis shows no major concerns.'}`;
}

function generateIntelligentSummary(parsedAST: ParsedAST): string {
  const hasEntryFunctions = parsedAST.functions.some(f => f.is_entry_function);
  const hasComplexFunctions = parsedAST.functions.some(f => f.complexity_score > 10);
  const language = parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move';
  
  let summary = `This ${language} smart contract "${parsedAST.name}" provides `;
  
  if (hasEntryFunctions) {
    summary += 'public entry points for blockchain interactions ';
  } else {
    summary += 'utility functions and data management capabilities ';
  }
  
  summary += `through ${parsedAST.functions.length} functions and ${parsedAST.events.length} data structures. `;
  
  if (hasComplexFunctions) {
    summary += 'The contract includes sophisticated business logic with higher complexity functions that require careful review. ';
  }
  
  if (parsedAST.language_features.length > 0) {
    summary += `It utilizes advanced ${language} features including ${parsedAST.language_features.slice(0, 3).join(', ')}.`;
  }
  
  return summary;
}

function generateBasicSecurityRecommendations(parsedAST: ParsedAST): string[] {
  const recommendations: string[] = [];
  
  if (parsedAST.functions.some(f => f.complexity_score > 15)) {
    recommendations.push('Consider breaking down high-complexity functions for better maintainability and security');
  }
  
  if (parsedAST.functions.some(f => f.visibility === 'public' && f.doc_comments.length === 0)) {
    recommendations.push('Add comprehensive documentation for all public functions');
  }
  
  if (parsedAST.security_insights.length === 0) {
    recommendations.push('Perform comprehensive security audit with specialized tools');
  }
  
  if (parsedAST.module_type === 'move_module') {
    recommendations.push('Ensure proper resource management and verify Move-specific security patterns');
  }
  
  return recommendations;
}

function calculateDocumentationCoverage(parsedAST: ParsedAST): number {
  const totalItems = parsedAST.functions.length + parsedAST.events.length + parsedAST.variables.length;
  if (totalItems === 0) return 100;
  
  const documentedItems = [
    ...parsedAST.functions.filter(f => f.doc_comments.length > 0),
    ...parsedAST.events.filter(e => e.doc_comments.length > 0),
    ...parsedAST.variables.filter(v => v.doc_comments.length > 0)
  ].length;
  
  return Math.round((documentedItems / totalItems) * 100);
}

function calculateMaintainabilityScore(parsedAST: ParsedAST): number {
  let score = 10;
  
  // Penalize high complexity
  const avgComplexity = parsedAST.complexity_metrics.cyclomatic_complexity / Math.max(parsedAST.functions.length, 1);
  if (avgComplexity > 10) score -= 3;
  else if (avgComplexity > 5) score -= 1;
  
  // Reward good documentation
  const docCoverage = calculateDocumentationCoverage(parsedAST);
  if (docCoverage < 30) score -= 2;
  else if (docCoverage > 80) score += 1;
  
  // Penalize security issues
  if (parsedAST.security_insights.length > 3) score -= 2;
  
  return Math.max(1, Math.min(10, score));
}

function calculateCodeQualityScore(parsedAST: ParsedAST): number {
  let score = 7; // Start with average
  
  // Factor in documentation
  const docCoverage = calculateDocumentationCoverage(parsedAST);
  score += (docCoverage / 100) * 2;
  
  // Factor in complexity
  const highComplexityRatio = parsedAST.functions.filter(f => f.complexity_score > 10).length / Math.max(parsedAST.functions.length, 1);
  if (highComplexityRatio > 0.5) score -= 2;
  
  // Factor in language features usage
  if (parsedAST.language_features.length > 5) score += 1;
  
  return Math.max(1, Math.min(10, Math.round(score)));
}

async function summarizeWithGroq(parsedAST: ParsedAST, sourceCode: string): Promise<any> {
  const prompt = `
You are a technical documentation expert. Analyze this ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} code and generate descriptions.

Source Code:
\`\`\`
${sourceCode.length > 4000 ? sourceCode.substring(0, 4000) + '...' : sourceCode}
\`\`\`

AST Analysis:
${JSON.stringify(parsedAST, null, 2)}

Instructions:
1. Generate a concise module description based on the code purpose
2. Create a comprehensive 2-3 sentence contract summary explaining specific functionality, business logic, and key features  
3. For each function, provide a clear description of what it does
4. For each parameter, explain its purpose
5. For events/structs, explain their role
6. For variables/constants, explain their purpose
7. Suggest simple usage examples for key functions
8. Respond ONLY with valid JSON in this exact format:

{
  "module_description": "Brief description of the module's purpose",
  "summary": "Comprehensive 2-3 sentence summary explaining specific contract functionality, business logic, and key features",
  "version": "version if found in code or null",
  "license": "license if found in comments or null", 
  "function_descriptions": {
    "function_name": {
      "description": "What this function does",
      "parameter_descriptions": {
        "param_name": "What this parameter is for"
      },
      "examples": ["example usage if applicable"]
    }
  },
  "event_descriptions": {
    "event_name": "What this event represents"
  },
  "variable_descriptions": {
    "variable_name": "What this variable is for"
  }
}`;

  const completion = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'deepseek-r1-distill-llama-70b',
    temperature: 0.3,
    max_tokens: 2000,
  });

  const response = completion.choices[0]?.message?.content;
  if (!response) {
    throw new Error('No response from Groq');
  }

  try {
    return JSON.parse(response);
  } catch (e) {
    console.warn('Failed to parse Groq response as JSON:', response);
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1]);
      } catch (e2) {
        console.warn('Failed to parse extracted JSON from Groq response');
      }
    }
    return {};
  }
}

/**
 * Use Gemini to clean up and format the final documentation
 */
async function cleanupWithGemini(groqSummary: any): Promise<DocumentationOutput> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

  const prompt = `
Clean up and format this documentation data into the exact JSON schema required. Pay special attention to creating a high-quality summary.

Input Data:
${JSON.stringify(groqSummary, null, 2)}

Requirements:
1. Create a professional, comprehensive contract summary that explains specific functionality and business logic
2. Ensure all technical details are accurate
3. Make descriptions clear and developer-friendly

Output the data in this EXACT format (no extra fields, all required fields present):
{
  "name": "string",
  "description": "string", 
  "summary": "Professional 2-3 sentence summary explaining specific contract functionality, business logic, and key features",
  "version": "string or null",
  "license": "string or null",
  "functions": [
    {
      "name": "string",
      "visibility": "public|private|internal",
      "description": "string",
      "parameters": [
        {"name": "string", "type": "string", "description": "string"}
      ],
      "return_type": "string or null",
      "examples": ["string array or empty array"]
    }
  ],
  "events": [
    {
      "name": "string", 
      "fields": [{"name": "string", "type": "string"}],
      "description": "string"
    }
  ],
  "variables": [
    {
      "name": "string",
      "type": "string", 
      "visibility": "public|private",
      "description": "string"
    }
  ]
}

Respond ONLY with valid JSON.`;

  const result = await model.generateContent(prompt);
  const response = result.response.text();

  try {
    const parsed = JSON.parse(response);
    // Add a placeholder overall_summary that will be overridden
    parsed.overall_summary = "";
    return parsed;
  } catch (e) {
    console.warn('Failed to parse Gemini response as JSON:', response);
    // Try to extract JSON from markdown code blocks
    const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1]);
        parsed.overall_summary = "";
        return parsed;
      } catch (e2) {
        console.warn('Failed to parse extracted JSON from Gemini response');
      }
    }
    throw new Error('Failed to generate valid documentation JSON');
  }
}

/**
 * Generate basic documentation without LLM (fallback)
 */
export function generateBasicDocumentation(parsedAST: ParsedAST): DocumentationOutput {
  return {
    name: parsedAST.name,
    description: `${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} module with ${parsedAST.functions.length} functions`,
    overall_summary: `This smart contract provides core functionality with ${parsedAST.functions.length} functions and ${parsedAST.events.length} data structures, designed for ${parsedAST.module_type === 'rust_crate' ? 'Rust-based' : 'Move-based'} blockchain applications.`,
    summary: `This ${parsedAST.module_type === 'rust_crate' ? 'Rust' : 'Move'} smart contract contains ${parsedAST.functions.length} functions, ${parsedAST.events.length} structs/events, and ${parsedAST.variables.length} constants/variables. It provides functionality for ${parsedAST.functions.map(f => f.name).slice(0, 3).join(', ')}${parsedAST.functions.length > 3 ? ' and more' : ''}.`,
    version: null,
    license: null,
    functions: parsedAST.functions.map(func => ({
      name: func.name,
      visibility: func.visibility,
      description: func.doc_comments.join(' ') || `${func.visibility} function ${func.name}`,
      parameters: func.parameters.map(param => ({
        name: param.name,
        type: param.type,
        description: param.description || `Parameter of type ${param.type}`
      })),
      return_type: func.return_type,
      examples: []
    })),
    events: parsedAST.events.map(event => ({
      name: event.name,
      fields: event.fields,
      description: event.doc_comments.join(' ') || `Struct/Event ${event.name}`
    })),
    variables: parsedAST.variables.map(variable => ({
      name: variable.name,
      type: variable.type,
      visibility: variable.visibility,
      description: variable.doc_comments.join(' ') || `${variable.visibility} variable of type ${variable.type}`
    }))
  };
}

/**
 * Check if LLM APIs are configured
 */
export function isLLMConfigured(): boolean {
  return !!(process.env.GROQ_API_KEY && process.env.GEMINI_API_KEY);
}
