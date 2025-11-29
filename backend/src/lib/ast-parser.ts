// Production-Ready AST Parser for Rust and Move Smart Contracts
import * as parser from '@babel/parser';

export interface ParsedFunction {
  name: string;
  visibility: 'public' | 'private';
  parameters: Array<{
    name: string;
    type: string;
    description?: string;
  }>;
  return_type: string | null;
  doc_comments: string[];
  body_text: string;
  line_number: number;
  complexity_score: number;
  is_entry_function?: boolean;
  modifiers: string[];
}

export interface ParsedEvent {
  name: string;
  fields: Array<{
    name: string;
    type: string;
  }>;
  doc_comments: string[];
  line_number: number;
  has_drop?: boolean;
  has_store?: boolean;
  has_copy?: boolean;
  has_key?: boolean;
}

export interface ParsedVariable {
  name: string;
  type: string;
  visibility: 'public' | 'private';
  doc_comments: string[];
  line_number: number;
  is_mutable: boolean;
  value?: string;
}

export interface ParsedAST {
  name: string;
  module_type: 'rust_crate' | 'move_module';
  functions: ParsedFunction[];
  events: ParsedEvent[];
  variables: ParsedVariable[];
  doc_comments: string[];
  imports: string[];
  dependencies: string[];
  total_lines: number;
  complexity_metrics: {
    cyclomatic_complexity: number;
    function_count: number;
    struct_count: number;
    const_count: number;
  };
  security_insights: string[];
  language_features: string[];
}

/**
 * Production-ready Rust AST parser with enhanced analysis
 */
export function parseRustAST(sourceCode: string, fileName: string): ParsedAST {
  const lines = sourceCode.split('\n');
  const result: ParsedAST = {
    name: extractModuleName(fileName, 'rust'),
    module_type: 'rust_crate',
    functions: [],
    events: [],
    variables: [],
    doc_comments: extractModuleDocComments(sourceCode),
    imports: extractImports(sourceCode, 'rust'),
    dependencies: extractDependencies(sourceCode, 'rust'),
    total_lines: lines.length,
    complexity_metrics: {
      cyclomatic_complexity: 0,
      function_count: 0,
      struct_count: 0,
      const_count: 0
    },
    security_insights: [],
    language_features: []
  };

  // Enhanced function parsing with better regex and error handling
  const functionPatterns = [
    // Standard functions
    /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(?:(async|const|unsafe)\s+)*fn\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*->\s*([^{]+?))?\s*(?:where[^{]*?)?\{/gs,
    // Impl block functions
    /impl(?:<[^>]*>)?\s+(?:\w+(?:<[^>]*>)?(?:\s+for\s+\w+(?:<[^>]*>)?)?)\s*\{[^}]*?(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(?:(async|const|unsafe)\s+)*fn\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*->\s*([^{]+?))?\s*(?:where[^{]*?)?\{/gs
  ];

  for (const pattern of functionPatterns) {
    let match;
    while ((match = pattern.exec(sourceCode)) !== null) {
      const [fullMatch, visibility, modifiers, name, params, returnType] = match;
      const lineNumber = getLineNumber(sourceCode, match.index);
      const docComments = extractDocComments(fullMatch);
      const bodyText = extractFunctionBody(sourceCode, match.index + fullMatch.length);
      const complexity = calculateComplexity(bodyText);
      
      result.functions.push({
        name,
        visibility: determineVisibility(visibility || ''),
        parameters: parseParameters(params, 'rust'),
        return_type: returnType?.trim() || null,
        doc_comments: docComments,
        body_text: bodyText,
        line_number: lineNumber,
        complexity_score: complexity,
        modifiers: modifiers ? [modifiers] : []
      });

      result.complexity_metrics.cyclomatic_complexity += complexity;
      result.complexity_metrics.function_count++;
    }
  }

  // Enhanced struct parsing
  const structRegex = /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*(?:\{([^}]+)\}|;)/gs;
  let match;
  while ((match = structRegex.exec(sourceCode)) !== null) {
    const [fullMatch, visibility, name, fields] = match;
    const lineNumber = getLineNumber(sourceCode, match.index);
    const docComments = extractDocComments(fullMatch);
    
    result.events.push({
      name,
      fields: fields ? parseStructFields(fields) : [],
      doc_comments: docComments,
      line_number: lineNumber
    });

    result.complexity_metrics.struct_count++;
  }

  // Enhanced constants/static parsing
  const constRegex = /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(const|static)\s+(mut\s+)?(\w+):\s*([^=]+)=([^;]+);/gs;
  while ((match = constRegex.exec(sourceCode)) !== null) {
    const [fullMatch, visibility, constType, mutability, name, type, value] = match;
    const lineNumber = getLineNumber(sourceCode, match.index);
    const docComments = extractDocComments(fullMatch);
    
    result.variables.push({
      name,
      type: type.trim(),
      visibility: determineVisibility(visibility || ''),
      doc_comments: docComments,
      line_number: lineNumber,
      is_mutable: !!mutability,
      value: value.trim()
    });

    result.complexity_metrics.const_count++;
  }

  // Extract language features and security insights
  result.language_features = extractRustFeatures(sourceCode);
  result.security_insights = analyzeRustSecurity(sourceCode);

  return result;
}

/**
 * Production-ready Move AST parser with enhanced analysis
 */
export function parseMoveAST(sourceCode: string, fileName: string): ParsedAST {
  const lines = sourceCode.split('\n');
  const result: ParsedAST = {
    name: extractModuleName(fileName, 'move'),
    module_type: 'move_module',
    functions: [],
    events: [],
    variables: [],
    doc_comments: extractModuleDocComments(sourceCode),
    imports: extractImports(sourceCode, 'move'),
    dependencies: extractDependencies(sourceCode, 'move'),
    total_lines: lines.length,
    complexity_metrics: {
      cyclomatic_complexity: 0,
      function_count: 0,
      struct_count: 0,
      const_count: 0
    },
    security_insights: [],
    language_features: []
  };

  // Enhanced Move function parsing
  const functionRegex = /(?:\/\/\/.*\n)*\s*(public(?:\([^)]*\))?\s+)?(entry\s+)?(native\s+)?fun\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*:\s*([^{]+?))?\s*(?:acquires\s+([^{]+?))?\s*\{/gs;
  let match;

  while ((match = functionRegex.exec(sourceCode)) !== null) {
    const [fullMatch, visibility, entry, native, name, params, returnType, acquires] = match;
    const lineNumber = getLineNumber(sourceCode, match.index);
    const docComments = extractDocComments(fullMatch);
    const bodyText = extractFunctionBody(sourceCode, match.index + fullMatch.length);
    const complexity = calculateComplexity(bodyText);
    
    result.functions.push({
      name,
      visibility: visibility ? 'public' : 'private',
      parameters: parseParameters(params, 'move'),
      return_type: returnType?.trim() || null,
      doc_comments: docComments,
      body_text: bodyText,
      line_number: lineNumber,
      complexity_score: complexity,
      is_entry_function: !!entry,
      modifiers: [entry, native].filter(Boolean)
    });

    result.complexity_metrics.cyclomatic_complexity += complexity;
    result.complexity_metrics.function_count++;
  }

  // Enhanced Move struct parsing with abilities
  const structRegex = /(?:\/\/\/.*\n)*\s*(public\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*(?:has\s+((?:copy|drop|store|key)(?:\s*,\s*(?:copy|drop|store|key))*))?\s*\{([^}]+)\}/gs;
  while ((match = structRegex.exec(sourceCode)) !== null) {
    const [fullMatch, visibility, name, abilities, fields] = match;
    const lineNumber = getLineNumber(sourceCode, match.index);
    const docComments = extractDocComments(fullMatch);
    const abilityList = abilities ? abilities.split(',').map(a => a.trim()) : [];
    
    result.events.push({
      name,
      fields: parseStructFields(fields),
      doc_comments: docComments,
      line_number: lineNumber,
      has_copy: abilityList.includes('copy'),
      has_drop: abilityList.includes('drop'),
      has_store: abilityList.includes('store'),
      has_key: abilityList.includes('key')
    });

    result.complexity_metrics.struct_count++;
  }

  // Enhanced Move constants parsing
  const constRegex = /(?:\/\/\/.*\n)*\s*(public\s+)?const\s+(\w+):\s*([^=]+)=([^;]+);/gs;
  while ((match = constRegex.exec(sourceCode)) !== null) {
    const [fullMatch, visibility, name, type, value] = match;
    const lineNumber = getLineNumber(sourceCode, match.index);
    const docComments = extractDocComments(fullMatch);
    
    result.variables.push({
      name,
      type: type.trim(),
      visibility: visibility ? 'public' : 'private',
      doc_comments: docComments,
      line_number: lineNumber,
      is_mutable: false,
      value: value.trim()
    });

    result.complexity_metrics.const_count++;
  }

  // Extract language features and security insights
  result.language_features = extractMoveFeatures(sourceCode);
  result.security_insights = analyzeMoveSecuri(sourceCode);

  return result;
}

// Utility Functions for Enhanced Production-Ready Parsing

/**
 * Extract module name from file path
 */
function extractModuleName(fileName: string, language: 'rust' | 'move'): string {
  const baseName = fileName.split('/').pop()?.split('\\').pop() || '';
  return baseName.replace(/\.(rs|move)$/, '');
}

/**
 * Extract module-level documentation comments
 */
function extractModuleDocComments(sourceCode: string): string[] {
  const docComments: string[] = [];
  const lines = sourceCode.split('\n');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('//!') || line.startsWith('/**') || line.startsWith('/*!')) {
      docComments.push(line.replace(/^\/\/!?\s?|^\/\*\*?\s?|\*\/$/g, ''));
    } else if (line && !line.startsWith('//')) {
      break; // Stop at first non-comment, non-empty line
    }
  }
  
  return docComments;
}

/**
 * Extract imports/use statements
 */
function extractImports(sourceCode: string, language: 'rust' | 'move'): string[] {
  const imports: string[] = [];
  const patterns = language === 'rust' 
    ? [/use\s+([^;]+);/g, /extern\s+crate\s+([^;]+);/g]
    : [/use\s+([^;]+);/g, /friend\s+([^;]+);/g];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(sourceCode)) !== null) {
      imports.push(match[1].trim());
    }
  }
  
  return imports;
}

/**
 * Extract dependencies from source code
 */
function extractDependencies(sourceCode: string, language: 'rust' | 'move'): string[] {
  const deps: string[] = [];
  
  if (language === 'rust') {
    // Extract crate dependencies from extern statements
    const externRegex = /extern\s+crate\s+(\w+)/g;
    let match;
    while ((match = externRegex.exec(sourceCode)) !== null) {
      deps.push(match[1]);
    }
  } else {
    // Extract Move module dependencies
    const moduleRegex = /use\s+0x[a-fA-F0-9]+::(\w+)/g;
    let match;
    while ((match = moduleRegex.exec(sourceCode)) !== null) {
      deps.push(match[1]);
    }
  }
  
  return [...new Set(deps)]; // Remove duplicates
}

/**
 * Get line number from character index
 */
function getLineNumber(sourceCode: string, index: number): number {
  return sourceCode.slice(0, index).split('\n').length;
}

/**
 * Extract documentation comments from a matched string
 */
function extractDocComments(matchedText: string): string[] {
  const comments: string[] = [];
  const lines = matchedText.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('///') || trimmed.startsWith('/**')) {
      comments.push(trimmed.replace(/^\/\/\/\s?|^\/\*\*\s?|\*\/$/g, ''));
    }
  }
  
  return comments;
}

/**
 * Extract function body text
 */
function extractFunctionBody(sourceCode: string, startIndex: number): string {
  let braceCount = 1;
  let index = startIndex;
  let body = '';
  
  while (index < sourceCode.length && braceCount > 0) {
    const char = sourceCode[index];
    if (char === '{') braceCount++;
    else if (char === '}') braceCount--;
    
    if (braceCount > 0) {
      body += char;
    }
    index++;
  }
  
  return body.trim();
}

/**
 * Calculate cyclomatic complexity of code
 */
function calculateComplexity(code: string): number {
  let complexity = 1; // Base complexity
  
  // Keywords that increase complexity (avoiding special regex characters)
  const complexityKeywords = [
    'if', 'else', 'while', 'for', 'loop', 'match', 'case',
    'and', 'or', 'try', 'catch', 'when'
  ];
  
  // Special patterns that need regex escaping
  const specialPatterns = [
    { pattern: /&&/g, name: 'logical_and' },
    { pattern: /\|\|/g, name: 'logical_or' },
    { pattern: /\?/g, name: 'ternary' }
  ];
  
  // Count keyword-based complexity
  for (const keyword of complexityKeywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'g');
    const matches = code.match(regex);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  // Count special pattern complexity
  for (const special of specialPatterns) {
    const matches = code.match(special.pattern);
    if (matches) {
      complexity += matches.length;
    }
  }
  
  return complexity;
}

/**
 * Determine visibility from visibility string
 */
function determineVisibility(visibilityStr: string): 'public' | 'private' {
  if (visibilityStr.includes('pub')) {
    return 'public';
  }
  return 'private';
}

/**
 * Parse function parameters
 */
function parseParameters(params: string, language: 'rust' | 'move'): Array<{name: string; type: string; description?: string}> {
  const parameters: Array<{name: string; type: string; description?: string}> = [];
  
  if (!params.trim()) return parameters;
  
  const paramList = params.split(',').map(p => p.trim()).filter(p => p);
  
  for (const param of paramList) {
    if (language === 'rust') {
      // Rust: name: type or &mut name: type
      const match = param.match(/(?:&?(?:mut\s+)?)?(\w+):\s*(.+)/);
      if (match) {
        parameters.push({
          name: match[1],
          type: match[2].trim()
        });
      }
    } else {
      // Move: name: type
      const match = param.match(/(\w+):\s*(.+)/);
      if (match) {
        parameters.push({
          name: match[1],
          type: match[2].trim()
        });
      }
    }
  }
  
  return parameters;
}

/**
 * Parse struct fields
 */
function parseStructFields(fields: string): Array<{name: string; type: string}> {
  const fieldList: Array<{name: string; type: string}> = [];
  const fieldLines = fields.split(/[,\n]/).map(f => f.trim()).filter(f => f);
  
  for (const field of fieldLines) {
    const match = field.match(/(\w+):\s*(.+?)(?:,|$)/);
    if (match) {
      fieldList.push({
        name: match[1],
        type: match[2].trim()
      });
    }
  }
  
  return fieldList;
}

/**
 * Extract Rust-specific language features
 */
function extractRustFeatures(sourceCode: string): string[] {
  const features: string[] = [];
  
  // Check for common Rust features
  const featureChecks = [
    { pattern: /async\s+fn/, feature: 'async_functions' },
    { pattern: /unsafe\s+/, feature: 'unsafe_code' },
    { pattern: /#\[derive\(/, feature: 'derive_macros' },
    { pattern: /impl\s+.*\s+for\s+/, feature: 'trait_implementations' },
    { pattern: /macro_rules!/, feature: 'declarative_macros' },
    { pattern: /\?\s*;/, feature: 'error_propagation' },
    { pattern: /Box</, feature: 'heap_allocation' },
    { pattern: /Rc<|Arc</, feature: 'reference_counting' },
    { pattern: /lifetime/, feature: 'explicit_lifetimes' }
  ];
  
  for (const check of featureChecks) {
    if (check.pattern.test(sourceCode)) {
      features.push(check.feature);
    }
  }
  
  return features;
}

/**
 * Analyze Rust security patterns
 */
function analyzeRustSecurity(sourceCode: string): string[] {
  const insights: string[] = [];
  
  // Security pattern checks
  if (/unsafe\s+/.test(sourceCode)) {
    insights.push('Contains unsafe code blocks - requires careful review');
  }
  
  if (/unwrap\(\)/.test(sourceCode)) {
    insights.push('Uses unwrap() which can panic - consider error handling');
  }
  
  if (/expect\(/.test(sourceCode)) {
    insights.push('Uses expect() which can panic - verify error messages');
  }
  
  if (/transmute|from_raw/.test(sourceCode)) {
    insights.push('Uses memory transmutation - high risk operation');
  }
  
  if (/ptr::|raw::/.test(sourceCode)) {
    insights.push('Direct pointer manipulation detected');
  }
  
  return insights;
}

/**
 * Extract Move-specific language features
 */
function extractMoveFeatures(sourceCode: string): string[] {
  const features: string[] = [];
  
  const featureChecks = [
    { pattern: /entry\s+fun/, feature: 'entry_functions' },
    { pattern: /native\s+fun/, feature: 'native_functions' },
    { pattern: /has\s+(?:copy|drop|store|key)/, feature: 'struct_abilities' },
    { pattern: /acquires\s+/, feature: 'resource_acquisition' },
    { pattern: /move_to</, feature: 'resource_operations' },
    { pattern: /borrow_global/, feature: 'global_storage_access' },
    { pattern: /assert!\(/, feature: 'assertions' },
    { pattern: /vector::|Vector::/, feature: 'vector_operations' },
    { pattern: /signer::/, feature: 'signer_operations' }
  ];
  
  for (const check of featureChecks) {
    if (check.pattern.test(sourceCode)) {
      features.push(check.feature);
    }
  }
  
  return features;
}

/**
 * Analyze Move security patterns
 */
function analyzeMoveSecuri(sourceCode: string): string[] {
  const insights: string[] = [];
  
  // Move-specific security checks
  if (/entry\s+fun/.test(sourceCode) && !/public\s+entry/.test(sourceCode)) {
    insights.push('Entry function without public visibility - verify access control');
  }
  
  if (/move_to<.*>\(/.test(sourceCode)) {
    insights.push('Resource publishing detected - ensure proper authorization');
  }
  
  if (/borrow_global_mut</.test(sourceCode)) {
    insights.push('Mutable global resource access - review for race conditions');
  }
  
  if (/assert!\(/.test(sourceCode)) {
    insights.push('Assertions present - verify all edge cases are handled');
  }
  
  if (/abort\s+/.test(sourceCode)) {
    insights.push('Explicit abort statements - ensure proper error codes');
  }
  
  if (!/@pre|@post|@aborts_if/.test(sourceCode) && /public\s+/.test(sourceCode)) {
    insights.push('Public functions without formal verification specs');
  }
  
  return insights;
}
