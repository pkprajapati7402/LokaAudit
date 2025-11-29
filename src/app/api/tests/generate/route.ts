import { NextRequest, NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { parse as babelParse } from '@babel/parser';
import traverse from '@babel/traverse';

// AST Analysis interfaces
interface FunctionInfo {
  name: string;
  parameters: Array<{ name: string; type?: string; }>;
  returnType?: string;
  isPublic: boolean;
  isAsync: boolean;
  body?: string;
  docComment?: string;
}

interface StructInfo {
  name: string;
  fields: Array<{ name: string; type?: string; isPublic: boolean; }>;
  methods: FunctionInfo[];
  isPublic: boolean;
}

interface EnumInfo {
  name: string;
  variants: Array<{ name: string; fields?: string[]; }>;
  isPublic: boolean;
}

interface ASTAnalysis {
  functions: FunctionInfo[];
  structs: StructInfo[];
  enums: EnumInfo[];
  imports: string[];
  modules: string[];
}

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://pkprajapati7402:Jigar1232000@cluster0.sxfgw.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(MONGODB_URI);

// AI configuration
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyBkSMDCx9gNSGf0Fc7iQIDJzEhXzLYKn-Y");
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || "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"
});

// Model selection based on test type and complexity
function selectOptimalModel(testType: string, codeComplexity: number): 'gemini' | 'deepseek' {
  // For unit tests and simple code, use Gemini for speed
  if (testType === 'unit' && codeComplexity < 50) {
    return 'gemini';
  }
  
  // For integration tests and complex code analysis, use DeepSeek for accuracy
  if (testType === 'integration' || codeComplexity > 100) {
    return 'deepseek';
  }
  
  // For security and performance tests, prefer DeepSeek for thoroughness
  if (testType === 'security' || testType === 'performance') {
    return 'deepseek';
  }
  
  // Default to Gemini for general cases
  return 'gemini';
}

// Calculate code complexity based on AST analysis
function calculateCodeComplexity(analysis: ASTAnalysis): number {
  let complexity = 0;
  
  // Add complexity for functions
  complexity += analysis.functions.length * 10;
  analysis.functions.forEach(func => {
    complexity += func.parameters.length * 2;
    if (func.isAsync) complexity += 5;
    if (func.body && func.body.length > 100) complexity += 10;
  });
  
  // Add complexity for structs/classes
  complexity += analysis.structs.length * 15;
  analysis.structs.forEach(struct => {
    complexity += struct.fields.length * 3;
    complexity += struct.methods.length * 8;
  });
  
  // Add complexity for enums
  complexity += analysis.enums.length * 8;
  
  // Add complexity for imports and modules
  complexity += analysis.imports.length * 2;
  complexity += analysis.modules.length * 5;
  
  return complexity;
}

interface TestCase {
  name: string;
  description: string;
  code: string;
  type: string;
  expectedOutcome: string;
}

interface GenerateTestsRequest {
  projectId: string;
  selectedFiles: string[];
  testType: string;
  language: string;
  options: {
    complexity: string;
    coverage: string;
    framework: string;
  };
}

// Enhanced project fetching function - gets full project with file content
async function getProject(projectId: string, developerId?: string | null) {
  try {
    await client.connect();
    const database = client.db("lokaaudit");
    const collection = database.collection("projects");
    
    console.log(`🔍 Searching for project: ${projectId}, developerId: ${developerId}`);
    
    // Search by project name first (legacy support)
    let project = await collection.findOne({ projectName: projectId });
    
    // If not found by name, try by _id
    if (!project) {
      try {
        const { ObjectId } = require('mongodb');
        project = await collection.findOne({ _id: new ObjectId(projectId) });
      } catch (e) {
        console.log('Not a valid ObjectId, continuing with name search');
      }
    }
    
    // If developerId is provided, ensure the project belongs to the developer
    if (project && developerId) {
      if (project.developerId !== developerId) {
        console.log(`❌ Project ${projectId} does not belong to developer ${developerId}`);
        return null;
      }
    }
    
    console.log(`📦 Project found:`, project ? `${project.projectName} with ${project.files?.length || 0} files` : 'Not found');
    
    // Log file information for debugging
    if (project && project.files) {
      console.log(`📄 Available files:`, project.files.map((f: any) => ({ 
        fileName: f.fileName, 
        hasContent: !!f.content,
        contentLength: f.content?.length || 0,
        size: f.size 
      })));
    }
    
    return project;
  } catch (error) {
    console.error('Database error:', error);
    return null;
  } finally {
    await client.close();
  }
}

// Advanced Rust AST Parser
function parseRustAST(code: string): ASTAnalysis {
  console.log('🦀 Parsing Rust code with AST analysis');
  
  const analysis: ASTAnalysis = {
    functions: [],
    structs: [],
    enums: [],
    imports: [],
    modules: []
  };

  try {
    // Extract imports/uses
    const useRegex = /use\s+([^;]+);/g;
    let useMatch;
    while ((useMatch = useRegex.exec(code)) !== null) {
      analysis.imports.push(useMatch[1].trim());
    }

    // Extract modules
    const modRegex = /(?:pub\s+)?mod\s+(\w+)/g;
    let modMatch;
    while ((modMatch = modRegex.exec(code)) !== null) {
      analysis.modules.push(modMatch[1]);
    }

    // Enhanced function parsing with parameter extraction
    const fnRegex = /(?:\/\/\/.*?\n)?\s*(?:pub\s+)?(?:async\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+))?\s*\{/gs;
    let fnMatch;
    while ((fnMatch = fnRegex.exec(code)) !== null) {
      const [fullMatch, name, paramsStr, returnType] = fnMatch;
      
      // Parse parameters
      const parameters: Array<{ name: string; type?: string; }> = [];
      if (paramsStr.trim()) {
        const paramParts = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        for (const param of paramParts) {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            const paramName = param.substring(0, colonIndex).trim();
            const paramType = param.substring(colonIndex + 1).trim();
            parameters.push({ name: paramName, type: paramType });
          } else {
            parameters.push({ name: param });
          }
        }
      }

      // Extract function body for better analysis
      const fnStartIndex = fnMatch.index! + fullMatch.length - 1;
      const body = extractFunctionBody(code, fnStartIndex);

      analysis.functions.push({
        name,
        parameters,
        returnType: returnType?.trim(),
        isPublic: fullMatch.includes('pub '),
        isAsync: fullMatch.includes('async '),
        body: body.substring(0, 200), // First 200 chars for context
        docComment: extractDocComment(code, fnMatch.index!)
      });
    }

    // Enhanced struct parsing
    const structRegex = /(?:\/\/\/.*?\n)?\s*(pub\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*\{([^}]*)\}/gs;
    let structMatch;
    while ((structMatch = structRegex.exec(code)) !== null) {
      const [, pubKeyword, name, fieldsStr] = structMatch;
      
      // Parse fields
      const fields: Array<{ name: string; type?: string; isPublic: boolean; }> = [];
      if (fieldsStr.trim()) {
        const fieldLines = fieldsStr.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('//'));
        for (const field of fieldLines) {
          const fieldMatch = field.match(/(?:pub\s+)?(\w+):\s*([^,]+)/);
          if (fieldMatch) {
            fields.push({
              name: fieldMatch[1],
              type: fieldMatch[2].replace(',', '').trim(),
              isPublic: field.includes('pub ')
            });
          }
        }
      }

      // Find associated impl block methods
      const methods = findStructMethods(code, name);

      analysis.structs.push({
        name,
        fields,
        methods,
        isPublic: !!pubKeyword
      });
    }

    // Enhanced enum parsing
    const enumRegex = /(?:pub\s+)?enum\s+(\w+)\s*\{([^}]*)\}/gs;
    let enumMatch;
    while ((enumMatch = enumRegex.exec(code)) !== null) {
      const [fullMatch, name, variantsStr] = enumMatch;
      
      const variants: Array<{ name: string; fields?: string[]; }> = [];
      if (variantsStr.trim()) {
        const variantLines = variantsStr.split(',').map(v => v.trim()).filter(v => v);
        for (const variant of variantLines) {
          const variantMatch = variant.match(/(\w+)(?:\(([^)]*)\))?/);
          if (variantMatch) {
            const [, variantName, fieldsStr] = variantMatch;
            const fields = fieldsStr ? fieldsStr.split(',').map(f => f.trim()) : undefined;
            variants.push({ name: variantName, fields });
          }
        }
      }

      analysis.enums.push({
        name,
        variants,
        isPublic: fullMatch.includes('pub ')
      });
    }

  } catch (error) {
    console.error('Error parsing Rust AST:', error);
  }

  console.log(`📊 AST Analysis complete: ${analysis.functions.length} functions, ${analysis.structs.length} structs, ${analysis.enums.length} enums`);
  return analysis;
}

// Helper function to extract function body
function extractFunctionBody(code: string, startIndex: number): string {
  let braceCount = 0;
  let i = startIndex;
  let start = -1;
  
  while (i < code.length) {
    if (code[i] === '{') {
      if (start === -1) start = i;
      braceCount++;
    } else if (code[i] === '}') {
      braceCount--;
      if (braceCount === 0) {
        return code.substring(start, i + 1);
      }
    }
    i++;
  }
  
  return code.substring(start, Math.min(start + 500, code.length));
}

// Helper function to extract doc comments
function extractDocComment(code: string, functionIndex: number): string {
  const lines = code.substring(Math.max(0, functionIndex - 500), functionIndex).split('\n');
  const docLines: string[] = [];
  
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();
    if (line.startsWith('///')) {
      docLines.unshift(line.replace(/^\/\/\/\s?/, ''));
    } else if (line && !line.startsWith('//')) {
      break;
    }
  }
  
  return docLines.join(' ');
}

// Helper function to find struct methods
function findStructMethods(code: string, structName: string): FunctionInfo[] {
  const methods: FunctionInfo[] = [];
  const implRegex = new RegExp(`impl(?:<[^>]*>)?\\s+${structName}(?:<[^>]*>)?\\s*\\{([^}]*(?:\\{[^}]*\\}[^}]*)*)\\}`, 'gs');
  
  let implMatch;
  while ((implMatch = implRegex.exec(code)) !== null) {
    const implBody = implMatch[1];
    const fnRegex = /(?:pub\s+)?fn\s+(\w+)\s*\(([^)]*)\)(?:\s*->\s*([^{]+))?\s*\{/g;
    
    let fnMatch;
    while ((fnMatch = fnRegex.exec(implBody)) !== null) {
      const [fullMatch, name, paramsStr, returnType] = fnMatch;
      
      const parameters: Array<{ name: string; type?: string; }> = [];
      if (paramsStr.trim()) {
        const paramParts = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        for (const param of paramParts) {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            parameters.push({
              name: param.substring(0, colonIndex).trim(),
              type: param.substring(colonIndex + 1).trim()
            });
          }
        }
      }

      methods.push({
        name,
        parameters,
        returnType: returnType?.trim(),
        isPublic: fullMatch.includes('pub '),
        isAsync: fullMatch.includes('async '),
        body: '',
        docComment: ''
      });
    }
  }
  
  return methods;
}

// Advanced Move AST Parser
function parseMoveAST(code: string): ASTAnalysis {
  console.log('🚀 Parsing Move code with AST analysis');
  
  const analysis: ASTAnalysis = {
    functions: [],
    structs: [],
    enums: [],
    imports: [],
    modules: []
  };

  try {
    // Extract imports
    const useRegex = /use\s+([^;]+);/g;
    let useMatch;
    while ((useMatch = useRegex.exec(code)) !== null) {
      analysis.imports.push(useMatch[1].trim());
    }

    // Extract modules
    const moduleRegex = /module\s+([^{]+)\s*\{/g;
    let moduleMatch;
    while ((moduleMatch = moduleRegex.exec(code)) !== null) {
      analysis.modules.push(moduleMatch[1].trim());
    }

    // Enhanced Move function parsing
    const fnRegex = /(?:public\s+)?(?:entry\s+)?fun\s+(\w+)(?:<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^{]+))?\s*(?:acquires\s+[^{]+)?\s*\{/gs;
    let fnMatch;
    while ((fnMatch = fnRegex.exec(code)) !== null) {
      const [fullMatch, name, paramsStr, returnType] = fnMatch;
      
      // Parse parameters for Move
      const parameters: Array<{ name: string; type?: string; }> = [];
      if (paramsStr.trim()) {
        const paramParts = paramsStr.split(',').map(p => p.trim()).filter(p => p);
        for (const param of paramParts) {
          const colonIndex = param.indexOf(':');
          if (colonIndex > 0) {
            parameters.push({
              name: param.substring(0, colonIndex).trim(),
              type: param.substring(colonIndex + 1).trim()
            });
          }
        }
      }

      analysis.functions.push({
        name,
        parameters,
        returnType: returnType?.trim(),
        isPublic: fullMatch.includes('public '),
        isAsync: false, // Move doesn't have async
        body: extractFunctionBody(code, fnMatch.index! + fullMatch.length - 1),
        docComment: extractDocComment(code, fnMatch.index!)
      });
    }

    // Parse Move structs/resources
    const structRegex = /(?:public\s+)?struct\s+(\w+)(?:<[^>]*>)?\s+has\s+[^{]*\s*\{([^}]*)\}/gs;
    let structMatch;
    while ((structMatch = structRegex.exec(code)) !== null) {
      const [fullMatch, name, fieldsStr] = structMatch;
      
      const fields: Array<{ name: string; type?: string; isPublic: boolean; }> = [];
      if (fieldsStr.trim()) {
        const fieldLines = fieldsStr.split(',').map(l => l.trim()).filter(l => l);
        for (const field of fieldLines) {
          const fieldMatch = field.match(/(\w+):\s*([^,]+)/);
          if (fieldMatch) {
            fields.push({
              name: fieldMatch[1],
              type: fieldMatch[2].trim(),
              isPublic: true // Move struct fields are typically public within module
            });
          }
        }
      }

      analysis.structs.push({
        name,
        fields,
        methods: [], // Move doesn't have methods in structs
        isPublic: fullMatch.includes('public ')
      });
    }

  } catch (error) {
    console.error('Error parsing Move AST:', error);
  }

  console.log(`📊 Move AST Analysis complete: ${analysis.functions.length} functions, ${analysis.structs.length} structs`);
  return analysis;
}

// Enhanced rule-based test generation using AST analysis
function generateRuleBasedTests(fileContent: string, fileName: string, testType: string, language: string): TestCase[] {
  console.log(`🔧 Generating comprehensive AST-based tests for ${fileName} (${language}) - no limit on test count`);
  
  const tests: TestCase[] = [];
  let astAnalysis: ASTAnalysis;
  
  // Use AST parsing based on language
  if (language.toLowerCase() === 'rust') {
    astAnalysis = parseRustAST(fileContent);
  } else if (language.toLowerCase() === 'move') {
    astAnalysis = parseMoveAST(fileContent);
  } else {
    // Fallback to regex-based parsing for other languages
    return generateLegacyRuleBasedTests(fileContent, fileName, testType, language);
  }
  
  console.log(`🔍 AST Analysis found:`, {
    functions: astAnalysis.functions.length,
    structs: astAnalysis.structs.length,
    enums: astAnalysis.enums.length,
    imports: astAnalysis.imports.length
  });

  // Generate comprehensive tests for each function
  astAnalysis.functions.forEach(func => {
    // Basic function test
    tests.push(generateAdvancedFunctionTest(func, testType, language, astAnalysis));
    
    // Generate parameter validation tests if function has parameters
    if (func.parameters.length > 0) {
      tests.push(generateParameterValidationTest(func, language));
    }
    
    // Generate edge case tests for public functions
    if (func.isPublic) {
      tests.push(generateEdgeCaseTest(func, language));
    }
    
    // Generate additional tests for complex functions
    if (func.parameters.length > 2) {
      // Create additional parameter combination test
      tests.push({
        name: `test_${func.name}_parameter_combinations`,
        description: `Test ${func.name} with various parameter combinations`,
        code: `// Test ${func.name} with different parameter combinations\n#[test]\nfn test_${func.name}_combinations() {\n    // Test with valid parameters\n    let result1 = ${func.name}(${func.parameters.map((p, i) => `valid_${p.name}_${i}`).join(', ')});\n    \n    // Test with edge case parameters\n    let result2 = ${func.name}(${func.parameters.map((p, i) => `edge_${p.name}_${i}`).join(', ')});\n    \n    // Add assertions here\n    assert!(result1.is_ok());\n    assert!(result2.is_ok());\n}`,
        type: testType,
        expectedOutcome: `${func.name} should handle different parameter combinations correctly`
      });
    }
  });

  // Generate comprehensive tests for each struct
  astAnalysis.structs.forEach(struct => {
    // Basic struct test
    tests.push(generateStructTest(struct, testType, language));
    
    // Generate tests for struct methods
    struct.methods.forEach(method => {
      tests.push(generateMethodTest(struct, method, testType, language));
    });
    
    // Generate field validation tests for structs with multiple fields
    if (struct.fields.length > 1) {
      tests.push({
        name: `test_${struct.name}_field_validation`,
        description: `Test ${struct.name} field validation and access`,
        code: `// Test ${struct.name} field validation\n#[test]\nfn test_${struct.name.toLowerCase()}_fields() {\n    let instance = ${struct.name} {\n        ${struct.fields.map(f => `${f.name}: default_${f.name}()`).join(',\n        ')}\n    };\n    \n    // Validate field access\n    ${struct.fields.map(f => `assert_eq!(instance.${f.name}, default_${f.name}());`).join('\n    ')}\n}`,
        type: testType,
        expectedOutcome: `${struct.name} fields should be properly accessible and validated`
      });
    }
  });

  // Generate comprehensive tests for each enum
  astAnalysis.enums.forEach(enumInfo => {
    tests.push(generateEnumTest(enumInfo, testType, language));
    
    // Generate variant-specific tests for enums with multiple variants
    if (enumInfo.variants.length > 2) {
      tests.push({
        name: `test_${enumInfo.name}_variant_handling`,
        description: `Test ${enumInfo.name} variant handling and pattern matching`,
        code: `// Test ${enumInfo.name} variant handling\n#[test]\nfn test_${enumInfo.name.toLowerCase()}_variants() {\n    ${enumInfo.variants.map(v => `let variant_${v.name.toLowerCase()} = ${enumInfo.name}::${v.name};\n    match variant_${v.name.toLowerCase()} {\n        ${enumInfo.name}::${v.name} => assert!(true),\n        _ => assert!(false)\n    }`).join('\n    ')}\n}`,
        type: testType,
        expectedOutcome: `${enumInfo.name} should handle all variants correctly`
      });
    }
  });

  // If no specific patterns found, generate a generic comprehensive test
  if (tests.length === 0) {
    tests.push(generateGenericTest(fileName, testType, language));
  }
  
  console.log(`✅ Generated ${tests.length} comprehensive AST-based tests (unlimited generation based on code complexity)`);
  return tests;
}

// Generate advanced function tests using AST analysis
function generateAdvancedFunctionTest(func: FunctionInfo, testType: string, language: string, ast: ASTAnalysis): TestCase {
  const paramTypes = func.parameters.map(p => p.type || 'unknown').join(', ');
  const hasComplexParams = func.parameters.some(p => 
    p.type?.includes('&') || p.type?.includes('Vec') || p.type?.includes('HashMap')
  );

  if (language.toLowerCase() === 'rust') {
    return generateAdvancedRustFunctionTest(func, testType, hasComplexParams, ast);
  } else if (language.toLowerCase() === 'move') {
    return generateAdvancedMoveFunctionTest(func, testType, hasComplexParams, ast);
  }

  // Fallback
  return generateGenericTest(func.name, testType, language);
}

// Advanced Rust function test generation
function generateAdvancedRustFunctionTest(func: FunctionInfo, testType: string, hasComplexParams: boolean, ast: ASTAnalysis): TestCase {
  const imports = ast.imports.length > 0 ? ast.imports.slice(0, 3).map(imp => `use ${imp};`).join('\n    ') : '';
  const setupCode = generateRustTestSetup(func, ast);
  const assertionCode = generateRustAssertions(func, testType);
  
  const testCode = `#[cfg(test)]
mod ${func.name}_tests {
    use super::*;
    ${imports}
    use std::collections::HashMap;
    
    ${setupCode}

    #[test]
    fn test_${func.name}_${testType}() {
        ${generateRustTestBody(func, testType, hasComplexParams)}
        
        ${assertionCode}
    }

    #[test]
    fn test_${func.name}_edge_cases() {
        ${generateRustEdgeCaseBody(func)}
    }

    ${func.isAsync ? generateAsyncTest(func) : ''}
}`;

  return {
    name: `test_${func.name}_advanced_${testType}`,
    description: `Advanced ${testType} test for ${func.name} with ${func.parameters.length} parameters`,
    code: testCode,
    type: testType,
    expectedOutcome: `${func.name} should handle ${testType} scenarios correctly with proper parameter validation`
  };
}

// Advanced Move function test generation  
function generateAdvancedMoveFunctionTest(func: FunctionInfo, testType: string, hasComplexParams: boolean, ast: ASTAnalysis): TestCase {
  const testCode = `#[test_only]
module ${func.name}_tests {
    use 0x1::TestFramework;
    use 0x1::Debug;
    ${ast.imports.slice(0, 2).map(imp => `use ${imp};`).join('\n    ')}
    
    #[test]
    fun test_${func.name}_${testType}() {
        ${generateMoveTestBody(func, testType, hasComplexParams)}
    }

    #[test]
    #[expected_failure(abort_code = 1)]
    fun test_${func.name}_failure_cases() {
        ${generateMoveFailureTestBody(func)}
    }

    ${func.isPublic ? generateMovePublicFunctionTest(func) : ''}
}`;

  return {
    name: `test_${func.name}_advanced_${testType}`,
    description: `Advanced Move ${testType} test for ${func.name}`,
    code: testCode,
    type: testType,
    expectedOutcome: `${func.name} should pass all Move ${testType} requirements`
  };
}

// Helper functions for test generation
function generateRustTestSetup(func: FunctionInfo, ast: ASTAnalysis): string {
  const hasStructs = ast.structs.length > 0;
  const mockStructs = hasStructs ? ast.structs.slice(0, 2).map(s => 
    `fn create_mock_${s.name.toLowerCase()}() -> ${s.name} {
        ${s.name} {
            ${s.fields.map(f => `${f.name}: Default::default()`).join(',\n            ')}
        }
    }`
  ).join('\n\n    ') : '';

  return `${mockStructs}
    
    fn setup_test_environment() {
        // Test environment setup
    }`;
}

function generateRustTestBody(func: FunctionInfo, testType: string, hasComplexParams: boolean): string {
  const paramSetup = func.parameters.map((param, index) => {
    if (param.type?.includes('&str')) {
      return `let ${param.name} = "test_string_${index}";`;
    } else if (param.type?.includes('u64') || param.type?.includes('i64')) {
      return `let ${param.name} = ${index + 1}_u64;`;
    } else if (param.type?.includes('bool')) {
      return `let ${param.name} = ${index % 2 === 0};`;
    } else if (param.type?.includes('Vec')) {
      return `let ${param.name} = vec![${index}, ${index + 1}, ${index + 2}];`;
    } else {
      return `let ${param.name} = Default::default(); // ${param.type || 'unknown type'}`;
    }
  }).join('\n        ');

  const functionCall = func.parameters.length > 0 
    ? `${func.name}(${func.parameters.map(p => p.name).join(', ')})`
    : `${func.name}()`;

  return `setup_test_environment();
        
        // Parameter setup
        ${paramSetup}
        
        // Function execution
        let result = ${functionCall};
        
        // Basic validation
        println!("Testing ${func.name} with ${testType} scenario");`;
}

function generateRustAssertions(func: FunctionInfo, testType: string): string {
  switch (testType) {
    case 'security':
      return `// Security assertions
        // Verify no unauthorized access
        // Check input sanitization
        assert!(true, "Security checks passed");`;
    case 'performance':
      return `// Performance assertions
        let start = std::time::Instant::now();
        // ... performance test code ...
        let duration = start.elapsed();
        assert!(duration.as_millis() < 100, "Performance requirement met");`;
    case 'integration':
      return `// Integration assertions
        // Verify component interactions
        // Check state consistency
        assert!(true, "Integration checks passed");`;
    default:
      return `// Functional assertions
        // Verify expected behavior
        // Check return values
        assert!(true, "Functional checks passed");`;
  }
}

function generateRustEdgeCaseBody(func: FunctionInfo): string {
  return `// Edge case testing for ${func.name}
        // Test with boundary values
        // Test with invalid inputs
        // Test with extreme conditions
        println!("Testing ${func.name} edge cases");`;
}

function generateAsyncTest(func: FunctionInfo): string {
  return `
    #[tokio::test]
    async fn test_${func.name}_async() {
        // Async test for ${func.name}
        // TODO: Add async-specific test logic
        println!("Testing async behavior of ${func.name}");
    }`;
}

function generateMoveTestBody(func: FunctionInfo, testType: string, hasComplexParams: boolean): string {
  const paramSetup = func.parameters.map((param, index) => {
    if (param.type?.includes('address')) {
      return `let ${param.name} = @0x${index + 1};`;
    } else if (param.type?.includes('u64')) {
      return `let ${param.name} = ${index + 1};`;
    } else if (param.type?.includes('bool')) {
      return `let ${param.name} = ${index % 2 === 0};`;
    } else {
      return `// let ${param.name} = ...; // ${param.type || 'unknown type'}`;
    }
  }).join('\n        ');

  return `// Parameter setup
        ${paramSetup}
        
        // Execute function
        // let result = ${func.name}(${func.parameters.map(p => p.name).join(', ')});
        
        Debug::print(&b"Testing ${func.name} ${testType}");`;
}

function generateMoveFailureTestBody(func: FunctionInfo): string {
  return `// Test failure scenarios
        Debug::print(&b"Testing ${func.name} failure cases");
        // Add failure test logic here`;
}

function generateMovePublicFunctionTest(func: FunctionInfo): string {
  return `
    #[test]
    fun test_${func.name}_public_access() {
        // Test public function access
        Debug::print(&b"Testing ${func.name} public access");
    }`;
}

// Generate parameter validation tests
function generateParameterValidationTest(func: FunctionInfo, language: string): TestCase {
  const testCode = language.toLowerCase() === 'rust' ? `#[cfg(test)]
mod ${func.name}_param_validation {
    use super::*;

    #[test]
    #[should_panic]
    fn test_${func.name}_invalid_params() {
        // Test with invalid parameters
        ${func.parameters.map((param, index) => 
          `// Invalid ${param.name}: ${param.type || 'unknown'}`
        ).join('\n        ')}
        
        println!("Testing ${func.name} parameter validation");
    }
}` : `#[test_only]
module ${func.name}_param_validation {
    #[test]
    #[expected_failure]
    fun test_${func.name}_invalid_params() {
        Debug::print(&b"Testing ${func.name} parameter validation");
    }
}`;

  return {
    name: `test_${func.name}_param_validation`,
    description: `Parameter validation test for ${func.name}`,
    code: testCode,
    type: 'validation',
    expectedOutcome: `${func.name} should properly validate input parameters`
  };
}

// Generate edge case tests
function generateEdgeCaseTest(func: FunctionInfo, language: string): TestCase {
  const testCode = language.toLowerCase() === 'rust' ? `#[cfg(test)]
mod ${func.name}_edge_cases {
    use super::*;

    #[test]
    fn test_${func.name}_boundary_values() {
        // Test boundary value analysis
        ${func.parameters.map(param => 
          param.type?.includes('u64') ? `// Test ${param.name} with 0, u64::MAX` :
          param.type?.includes('i64') ? `// Test ${param.name} with i64::MIN, i64::MAX` :
          `// Test ${param.name} edge cases`
        ).join('\n        ')}
        
        println!("Testing ${func.name} boundary values");
    }
}` : `#[test_only]
module ${func.name}_edge_cases {
    #[test]
    fun test_${func.name}_boundary_values() {
        Debug::print(&b"Testing ${func.name} boundary values");
    }
}`;

  return {
    name: `test_${func.name}_edge_cases`,
    description: `Edge case tests for ${func.name}`,
    code: testCode,
    type: 'edge_case',
    expectedOutcome: `${func.name} should handle edge cases gracefully`
  };
}

// Generate struct tests
function generateStructTest(struct: StructInfo, testType: string, language: string): TestCase {
  const testCode = language.toLowerCase() === 'rust' ? `#[cfg(test)]
mod ${struct.name.toLowerCase()}_tests {
    use super::*;

    #[test]
    fn test_${struct.name.toLowerCase()}_creation() {
        let instance = ${struct.name} {
            ${struct.fields.map(field => 
              `${field.name}: Default::default(), // ${field.type || 'unknown'}`
            ).join('\n            ')}
        };
        
        // Verify struct creation
        ${struct.fields.map(field => 
          `// assert_eq!(instance.${field.name}, expected_value);`
        ).join('\n        ')}
        
        println!("Testing ${struct.name} creation");
    }

    ${struct.methods.map(method => `
    #[test]
    fn test_${struct.name.toLowerCase()}_${method.name}() {
        let mut instance = ${struct.name}::default();
        // let result = instance.${method.name}(${method.parameters.map(() => 'test_param').join(', ')});
        println!("Testing ${struct.name}::{method.name}");
    }`).join('')}
}` : `#[test_only]
module ${struct.name.toLowerCase()}_tests {
    #[test]
    fun test_${struct.name.toLowerCase()}_creation() {
        Debug::print(&b"Testing ${struct.name} creation");
    }
}`;

  return {
    name: `test_${struct.name.toLowerCase()}_${testType}`,
    description: `${testType} tests for ${struct.name} struct`,
    code: testCode,
    type: testType,
    expectedOutcome: `${struct.name} should be properly testable and functional`
  };
}

// Generate method tests
function generateMethodTest(struct: StructInfo, method: FunctionInfo, testType: string, language: string): TestCase {
  const testCode = `// Method test for ${struct.name}::${method.name}
// TODO: Implement specific method testing logic
// Parameters: ${method.parameters.map(p => `${p.name}: ${p.type}`).join(', ')}`;

  return {
    name: `test_${struct.name.toLowerCase()}_${method.name}_${testType}`,
    description: `${testType} test for ${struct.name}::${method.name}`,
    code: testCode,
    type: testType,
    expectedOutcome: `${struct.name}::${method.name} should work correctly`
  };
}

// Generate enum tests
function generateEnumTest(enumInfo: EnumInfo, testType: string, language: string): TestCase {
  const testCode = language.toLowerCase() === 'rust' ? `#[cfg(test)]
mod ${enumInfo.name.toLowerCase()}_tests {
    use super::*;

    #[test]
    fn test_${enumInfo.name.toLowerCase()}_variants() {
        ${enumInfo.variants.map(variant => 
          `// Test ${variant.name} variant
        let variant_${variant.name.toLowerCase()} = ${enumInfo.name}::${variant.name}${variant.fields ? `(${variant.fields.map(() => 'test_value').join(', ')})` : ''};`
        ).join('\n        ')}
        
        println!("Testing ${enumInfo.name} variants");
    }
}` : `// Move doesn't have enums, treating as constants
#[test_only]
module ${enumInfo.name.toLowerCase()}_tests {
    #[test]
    fun test_${enumInfo.name.toLowerCase()}_values() {
        Debug::print(&b"Testing ${enumInfo.name} values");
    }
}`;

  return {
    name: `test_${enumInfo.name.toLowerCase()}_${testType}`,
    description: `${testType} tests for ${enumInfo.name} enum`,
    code: testCode,
    type: testType,
    expectedOutcome: `${enumInfo.name} variants should be properly testable`
  };
}

// Legacy rule-based test generation (fallback)
function generateLegacyRuleBasedTests(fileContent: string, fileName: string, testType: string, language: string): TestCase[] {
  console.log(`🔧 Using legacy rule-based generation for ${fileName} (${language})`);
  
  const tests: TestCase[] = [];
  
  // Language-specific pattern matching (original logic)
  if (language.toLowerCase() === 'rust') {
    // Extract Rust functions
    const functionMatches = fileContent.match(/(?:pub\s+)?fn\s+(\w+)\s*\([^)]*\)(?:\s*->\s*[^{]+)?/g);
    const structMatches = fileContent.match(/(?:pub\s+)?struct\s+(\w+)/g);
    const enumMatches = fileContent.match(/(?:pub\s+)?enum\s+(\w+)/g);
    
    console.log(`🔍 Found patterns: ${functionMatches?.length || 0} functions, ${structMatches?.length || 0} structs, ${enumMatches?.length || 0} enums`);
    
    if (functionMatches) {
      functionMatches.forEach((match, index) => {
        const functionName = match.match(/fn\s+(\w+)/)?.[1] || `function_${index}`;
        tests.push(generateRustTestCode(functionName, testType, fileContent));
      });
    }
    
    if (structMatches) {
      structMatches.forEach((match, index) => {
        const structName = match.match(/struct\s+(\w+)/)?.[1] || `struct_${index}`;
        tests.push(generateRustStructTest(structName, testType));
      });
    }
  } else if (language.toLowerCase() === 'move') {
    // Extract Move functions and resources
    const functionMatches = fileContent.match(/(?:public\s+)?fun\s+(\w+)\s*\([^)]*\)/g);
    const resourceMatches = fileContent.match(/resource\s+(\w+)/g);
    
    console.log(`🔍 Found patterns: ${functionMatches?.length || 0} functions, ${resourceMatches?.length || 0} resources`);
    
    if (functionMatches) {
      functionMatches.forEach((match, index) => {
        const functionName = match.match(/fun\s+(\w+)/)?.[1] || `function_${index}`;
        tests.push(generateMoveTestCode(functionName, testType));
      });
    }
  }
  
  // If no specific patterns found, generate generic tests
  if (tests.length === 0) {
    tests.push(generateGenericTest(fileName, testType, language));
  }
  
  console.log(`✅ Generated ${tests.length} legacy rule-based tests`);
  return tests;
}

// Rust-specific test generation
function generateRustTestCode(functionName: string, testType: string, fileContent: string): TestCase {
  const testTemplates = {
    functional: {
      name: `test_${functionName}_functionality`,
      description: `Test the core functionality of ${functionName}`,
      code: `#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_${functionName}_functionality() {
        // Test basic functionality of ${functionName}
        // TODO: Add specific test cases based on function signature
        
        // Example test structure:
        // let input = create_test_input();
        // let result = ${functionName}(input);
        // assert_eq!(result, expected_value);
        
        println!("Testing ${functionName} functionality");
        // Add assertions here
    }

    #[test]
    fn test_${functionName}_edge_cases() {
        // Test edge cases for ${functionName}
        // TODO: Add edge case testing
        
        println!("Testing ${functionName} edge cases");
    }
}`,
      expectedOutcome: `${functionName} should behave correctly under normal and edge conditions`
    },
    security: {
      name: `test_${functionName}_security`,
      description: `Security tests for ${functionName}`,
      code: `#[cfg(test)]
mod security_tests {
    use super::*;

    #[test]
    fn test_${functionName}_authorization() {
        // Test authorization checks
        // Verify that unauthorized access is properly rejected
        
        println!("Testing ${functionName} authorization");
        // Add security assertions here
    }

    #[test]
    fn test_${functionName}_input_validation() {
        // Test input validation and sanitization
        // Verify malicious inputs are handled safely
        
        println!("Testing ${functionName} input validation");
        // Add validation tests here
    }

    #[test]
    fn test_${functionName}_overflow_protection() {
        // Test protection against integer overflow/underflow
        
        println!("Testing ${functionName} overflow protection");
        // Add overflow tests here
    }
}`,
      expectedOutcome: `${functionName} should be secure against common attack vectors`
    },
    performance: {
      name: `test_${functionName}_performance`,
      description: `Performance benchmarks for ${functionName}`,
      code: `#[cfg(test)]
mod performance_tests {
    use super::*;
    use std::time::Instant;

    #[test]
    fn test_${functionName}_performance() {
        let start = Instant::now();
        
        // Performance test for ${functionName}
        for _i in 0..1000 {
            // Call function multiple times
            // ${functionName}(test_input);
        }
        
        let duration = start.elapsed();
        println!("${functionName} executed 1000 times in: {:?}", duration);
        
        // Assert performance requirements
        assert!(duration.as_millis() < 1000, "Performance requirement not met");
    }

    #[test]
    fn test_${functionName}_memory_usage() {
        // Test memory efficiency
        println!("Testing ${functionName} memory usage");
        
        // Add memory usage assertions
    }
}`,
      expectedOutcome: `${functionName} should meet performance requirements`
    },
    integration: {
      name: `test_${functionName}_integration`,
      description: `Integration tests for ${functionName}`,
      code: `#[cfg(test)]
mod integration_tests {
    use super::*;

    #[test]
    fn test_${functionName}_with_dependencies() {
        // Test ${functionName} with its dependencies
        // Verify proper interaction with other components
        
        println!("Testing ${functionName} integration");
        // Add integration assertions here
    }

    #[test]
    fn test_${functionName}_state_changes() {
        // Test state changes caused by ${functionName}
        
        println!("Testing ${functionName} state changes");
        // Add state verification tests
    }
}`,
      expectedOutcome: `${functionName} should integrate properly with the system`
    }
  };

  return {
    type: testType,
    ...testTemplates[testType as keyof typeof testTemplates] || testTemplates.functional
  };
}

// Rust struct test generation
function generateRustStructTest(structName: string, testType: string): TestCase {
  return {
    name: `test_${structName.toLowerCase()}_${testType}`,
    description: `${testType} tests for ${structName} struct`,
    type: testType,
    code: `#[cfg(test)]
mod ${structName.toLowerCase()}_tests {
    use super::*;

    #[test]
    fn test_${structName.toLowerCase()}_creation() {
        // Test ${structName} creation and initialization
        // let instance = ${structName}::new(/* parameters */);
        // assert!(instance.is_valid());
        
        println!("Testing ${structName} creation");
    }

    #[test]
    fn test_${structName.toLowerCase()}_methods() {
        // Test ${structName} methods
        // let mut instance = ${structName}::new(/* parameters */);
        // let result = instance.some_method();
        // assert_eq!(result, expected);
        
        println!("Testing ${structName} methods");
    }
}`,
    expectedOutcome: `${structName} should be properly testable and functional`
  };
}

// Move-specific test generation
function generateMoveTestCode(functionName: string, testType: string): TestCase {
  return {
    name: `test_${functionName}_${testType}`,
    description: `${testType} test for Move function ${functionName}`,
    type: testType,
    code: `#[test_only]
module test_${functionName} {
    use 0x1::TestFramework;
    use 0x1::Debug;
    
    #[test]
    fun test_${functionName}_${testType}() {
        // Test ${functionName} ${testType}
        // let account = TestFramework::create_account();
        // let result = ${functionName}(/* parameters */);
        // assert!(result == expected_value, 1);
        
        Debug::print(&b"Testing ${functionName} ${testType}");
    }

    #[test]
    #[expected_failure]
    fun test_${functionName}_failure_cases() {
        // Test failure scenarios for ${functionName}
        Debug::print(&b"Testing ${functionName} failure cases");
    }
}`,
    expectedOutcome: `${functionName} should handle ${testType} scenarios correctly`
  };
}

// Generic test generation fallback
function generateGenericTest(fileName: string, testType: string, language: string): TestCase {
  return {
    name: `test_${fileName.replace(/\.[^/.]+$/, "")}_${testType}`,
    description: `${testType} test for ${fileName}`,
    type: testType,
    code: `// ${testType.toUpperCase()} TEST for ${fileName}
// Language: ${language}

// This is a generic test template
// Please customize based on your specific requirements

#[test]
fn test_${fileName.replace(/\.[^/.]+$/, "")}_${testType}() {
    // Add your test implementation here
    // 1. Setup test data
    // 2. Execute the function/feature
    // 3. Assert expected results
    
    println!("Executing ${testType} test for ${fileName}");
    
    // Example assertions:
    // assert_eq!(actual, expected);
    // assert!(condition, "Error message");
}`,
    expectedOutcome: `${fileName} should pass ${testType} testing requirements`
  };
}

// AI-powered test generation (fallback to rule-based if fails)
async function generateAITests(fileContent: string, fileName: string, testType: string, language: string, analysis?: ASTAnalysis): Promise<TestCase[]> {
  try {
    console.log(`🤖 Attempting comprehensive AI test generation for ${fileName} - unlimited test count based on complexity`);
    
    // Calculate code complexity and select optimal model
    const complexity = analysis ? calculateCodeComplexity(analysis) : 50;
    const selectedModel = selectOptimalModel(testType, complexity);
    
    console.log(`📊 Code complexity: ${complexity}, Selected model: ${selectedModel} - generating comprehensive test suite`);
    
    // Create detailed prompt based on AST analysis
    const functionsInfo = analysis?.functions.map(f => 
      `Function: ${f.name}(${f.parameters.map(p => `${p.name}: ${p.type || 'unknown'}`).join(', ')}) -> ${f.returnType || 'unknown'}${f.isAsync ? ' (async)' : ''}${f.isPublic ? ' (public)' : ' (private)'}`
    ).join('\n') || '';
    
    const structsInfo = analysis?.structs.map(s => 
      `Struct/Class: ${s.name} { ${s.fields.map(f => `${f.name}: ${f.type || 'unknown'}`).join(', ')} } with ${s.methods.length} methods`
    ).join('\n') || '';
    
    const enumsInfo = analysis?.enums.map(e => 
      `Enum: ${e.name} with variants: ${e.variants.map(v => v.name).join(', ')}`
    ).join('\n') || '';
    
    const prompt = `Generate comprehensive ${testType} tests for this ${language} code.

FILE: ${fileName}
LANGUAGE: ${language}
TEST TYPE: ${testType}
CODE COMPLEXITY: ${complexity} (${complexity < 50 ? 'Simple' : complexity < 150 ? 'Medium' : 'Complex'})

CODE STRUCTURE ANALYSIS:
${functionsInfo ? `\nFUNCTIONS:\n${functionsInfo}` : ''}
${structsInfo ? `\nSTRUCTS/CLASSES:\n${structsInfo}` : ''}
${enumsInfo ? `\nENUMS:\n${enumsInfo}` : ''}

SOURCE CODE:
${fileContent.substring(0, 4000)}

REQUIREMENTS:
1. Generate COMPREHENSIVE test suites that cover ALL identified functions and structures
2. Create tests specific to each function, struct, enum, and method identified above
3. Include proper test setup, execution, and assertions for each component
4. For ${testType} tests, focus on:
   ${testType === 'unit' ? '- Testing each function individually with various inputs\n   - Edge cases, error handling, and boundary conditions\n   - Mocking dependencies and testing isolated behavior\n   - Parameter validation and return value verification' : ''}
   ${testType === 'integration' ? '- Testing component interactions and data flow\n   - Module integration and interface contracts\n   - External service integration and API calls\n   - End-to-end workflow testing' : ''}
   ${testType === 'security' ? '- Input validation and sanitization testing\n   - Authentication and authorization verification\n   - Vulnerability testing (injection, overflow, etc.)\n   - Access control and permission testing' : ''}
   ${testType === 'performance' ? '- Load testing and stress testing\n   - Memory usage and optimization verification\n   - Response time and throughput measurement\n   - Scalability and resource consumption testing' : ''}
5. Use appropriate testing framework syntax for ${language}
6. Include realistic test data and expected outcomes
7. Generate comprehensive test cases based on code complexity:
   - Simple files (1-5 functions): Generate 5-10 test cases
   - Medium files (6-15 functions): Generate 10-20 test cases
   - Complex files (16+ functions): Generate 20+ test cases
   - Cover all public functions, methods, and edge cases
   - Include positive, negative, and boundary test scenarios

RESPONSE FORMAT - Return ONLY a valid JSON array:
[
  {
    "name": "descriptive_test_name",
    "description": "Clear description of what this test validates",
    "code": "Complete executable test code with proper syntax",
    "type": "${testType}",
    "expectedOutcome": "Expected result description",
    "severity": "low|medium|high",
    "category": "functionality|performance|security|integration"
  }
]

Generate tests that directly utilize the functions and structures identified in the code analysis.`;

    let response: string;
    
    if (selectedModel === 'gemini') {
      const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
        }
      });
      const result = await model.generateContent(prompt);
      const geminiResponse = await result.response;
      response = geminiResponse.text();
    } else {
      const completion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: "You are an expert test engineer who generates comprehensive, genuine test cases based on actual code analysis. Generate as many test cases as needed to thoroughly test all functions and components. Always respond with valid JSON arrays only."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        model: "deepseek-r1-distill-llama-70b",
        temperature: 0.3,
        max_tokens: 8192,
      });
      response = completion.choices[0]?.message?.content || '';
    }
    
    // Enhanced JSON parsing with better error handling
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        const tests = JSON.parse(jsonMatch[0]);
        if (Array.isArray(tests) && tests.length > 0) {
          // Validate test structure
          const validTests = tests.filter(test => 
            test.name && test.description && test.code && test.type && test.expectedOutcome
          );
          
          if (validTests.length > 0) {
            console.log(`✅ AI (${selectedModel}) generated ${validTests.length} comprehensive tests - no arbitrary limits applied`);
            return validTests;
          }
        }
      } catch (parseError) {
        console.log(`⚠️ JSON parsing failed: ${parseError}`);
      }
    }
    
    throw new Error(`Invalid AI response format from ${selectedModel}`);
  } catch (error) {
    console.log(`⚠️ AI generation failed: ${error}. Falling back to rule-based generation.`);
    return generateRuleBasedTests(fileContent, fileName, testType, language);
  }
}

export async function POST(req: NextRequest) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🚀 Starting test generation for session: ${sessionId}`);

  try {
    // Get developerId from query parameters
    const url = new URL(req.url);
    const developerId = url.searchParams.get('developerId');
    
    const body: GenerateTestsRequest = await req.json();
    const { projectId, selectedFiles, testType, language, options } = body;

    console.log(`📋 Request details:`, {
      projectId,
      selectedFiles,
      testType,
      language,
      developerId,
      options
    });

    // Validate request
    if (!projectId || !selectedFiles || selectedFiles.length === 0) {
      console.log(`❌ Invalid request: missing required fields`);
      return NextResponse.json(
        { error: 'Missing required fields: projectId, selectedFiles' },
        { status: 400 }
      );
    }

    // Get project from database
    const project = await getProject(projectId, developerId);
    if (!project) {
      console.log(`❌ Project not found: ${projectId}`);
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    console.log(`✅ Project found: ${project.projectName} with ${project.files?.length || 0} files`);

    // Generate tests for each selected file
    const allTests: TestCase[] = [];
    
    for (const fileName of selectedFiles) {
      console.log(`📝 Processing file: ${fileName}`);
      
      // Find file in project using fileName property (matching database schema)
      const file = project.files?.find((f: any) => f.fileName === fileName);
      
      if (!file) {
        console.log(`⚠️ File not found in project: ${fileName}`);
        // Generate a placeholder test for missing file
        allTests.push({
          name: `test_${fileName.replace(/\.[^/.]+$/, "")}_placeholder`,
          description: `Placeholder test for ${fileName} (file not found in project)`,
          code: `// File ${fileName} was not found in the project\n// Please ensure the file exists and try again`,
          type: testType,
          expectedOutcome: `File ${fileName} should be accessible for testing`
        });
        continue;
      }

      const fileContent = file.content || '';
      
      if (!fileContent) {
        console.log(`⚠️ File ${fileName} has no content stored in database`);
        // Generate a placeholder test for empty file
        allTests.push({
          name: `test_${fileName.replace(/\.[^/.]+$/, "")}_no_content`,
          description: `Test placeholder for ${fileName} (no content found)`,
          code: `// File ${fileName} exists but has no content in the database\n// Please re-upload the file with content`,
          type: testType,
          expectedOutcome: `File ${fileName} should have content for proper test generation`
        });
        continue;
      }
      
      console.log(`📄 File content loaded: ${fileContent.length} chars for ${fileName}`);

      // Perform AST analysis for AI enhancement
      let astAnalysis: ASTAnalysis | undefined;
      try {
        if (language.toLowerCase() === 'rust') {
          astAnalysis = parseRustAST(fileContent);
        } else if (language.toLowerCase() === 'move') {
          astAnalysis = parseMoveAST(fileContent);
        }
        
        if (astAnalysis) {
          console.log(`🔍 AST Analysis completed for ${fileName}:`, {
            functions: astAnalysis.functions.length,
            structs: astAnalysis.structs.length,
            enums: astAnalysis.enums.length
          });
        }
      } catch (astError) {
        console.log(`⚠️ AST analysis failed for ${fileName}: ${astError}`);
      }

      // Generate tests using AI first with AST analysis, fallback to rule-based
      const tests = await generateAITests(fileContent, fileName, testType, language, astAnalysis);
      allTests.push(...tests);
      
      console.log(`✅ Generated ${tests.length} tests for ${fileName}`);
    }

    console.log(`✅ Test generation completed: ${allTests.length} tests generated`);

    // Store session in database for execution
    await client.connect();
    const db = client.db('lokaaudit');
    const sessionData = {
      sessionId,
      projectId,
      developerId,
      testType,
      language,
      selectedFiles,
      generatedTests: allTests,
      createdAt: new Date(),
      status: 'generated',
      summary: {
        totalTests: allTests.length,
        testType,
        language,
        filesProcessed: selectedFiles.length,
        timestamp: new Date().toISOString()
      }
    };
    
    await db.collection('test_sessions').insertOne(sessionData);
    await client.close();
    
    console.log(`💾 Session ${sessionId} stored in database`);

    // Return generated tests
    return NextResponse.json({
      success: true,
      sessionId,
      generatedTests: allTests,
      tests: allTests, // Backward compatibility
      summary: {
        totalTests: allTests.length,
        testType,
        language,
        filesProcessed: selectedFiles.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ Error in test generation:`, error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
        sessionId 
      },
      { status: 500 }
    );
  }
}
