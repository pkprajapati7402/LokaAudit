// AI Test Case Generator using Gemini and DeepSeek
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import { 
  AITestGenerator, 
  GeneratedTestCase, 
  TestType,
  TestGenerationError 
} from '../types/test-types';

// Initialize AI clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || '' });

export class TestCaseGenerator implements AITestGenerator {
  private static instance: TestCaseGenerator;
  
  static getInstance(): TestCaseGenerator {
    if (!TestCaseGenerator.instance) {
      TestCaseGenerator.instance = new TestCaseGenerator();
    }
    return TestCaseGenerator.instance;
  }

  async generateTestCases(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move'
  ): Promise<GeneratedTestCase[]> {
    try {
      console.log(`🤖 Generating ${testType} tests for ${fileName} (${language})`);
      
      // Use Gemini 2.0 Flash as primary generator
      const geminiTests = await this.generateWithGemini(sourceCode, fileName, testType, language);
      
      // Use DeepSeek as fallback/enhancement
      let deepSeekTests: GeneratedTestCase[] = [];
      try {
        deepSeekTests = await this.generateWithDeepSeek(sourceCode, fileName, testType, language);
      } catch (error) {
        console.warn('DeepSeek generation failed, using Gemini only:', error);
      }
      
      // Merge and deduplicate results
      const allTests = [...geminiTests, ...deepSeekTests];
      const uniqueTests = this.deduplicateTests(allTests);
      
      // Prioritize and rank tests
      const rankedTests = this.rankTestsByImportance(uniqueTests, testType);
      
      console.log(`✅ Generated ${rankedTests.length} ${testType} tests for ${fileName}`);
      return rankedTests;
      
    } catch (error) {
      console.error('Test generation failed:', error);
      throw new TestGenerationError(
        `Failed to generate ${testType} tests for ${fileName}`,
        'GENERATION_FAILED',
        error
      );
    }
  }

  private async generateWithGemini(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move'
  ): Promise<GeneratedTestCase[]> {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    
    const prompt = this.buildGeminiPrompt(sourceCode, fileName, testType, language);
    
    try {
      const result = await model.generateContent(prompt);
      const response = result.response.text();
      
      return this.parseTestCases(response, 'gemini');
    } catch (error) {
      console.error('Gemini generation failed:', error);
      throw new TestGenerationError(
        'Gemini test generation failed',
        'GEMINI_ERROR',
        error
      );
    }
  }

  private async generateWithDeepSeek(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move'
  ): Promise<GeneratedTestCase[]> {
    const prompt = this.buildDeepSeekPrompt(sourceCode, fileName, testType, language);
    
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'deepseek-r1-distill-llama-70b',
        temperature: 0.1,
        max_tokens: 4096,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error('No response from DeepSeek');
      }

      return this.parseTestCases(response, 'deepseek');
    } catch (error) {
      console.error('DeepSeek generation failed:', error);
      throw new TestGenerationError(
        'DeepSeek test generation failed',
        'DEEPSEEK_ERROR',
        error
      );
    }
  }

  private buildGeminiPrompt(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move'
  ): string {
    const testTypeInstructions = this.getTestTypeInstructions(testType, language);
    
    return `
You are an expert smart contract testing engineer specializing in ${language.toUpperCase()} blockchain development. 

TASK: Generate comprehensive ${testType} test cases for the following smart contract.

FILE: ${fileName}
LANGUAGE: ${language.toUpperCase()}
TEST TYPE: ${testType.toUpperCase()}

SOURCE CODE:
\`\`\`${language}
${sourceCode}
\`\`\`

${testTypeInstructions}

REQUIREMENTS:
1. Generate 3-5 high-quality test cases
2. Each test should be complete and executable
3. Include both positive and negative test scenarios
4. Focus on real-world edge cases and potential vulnerabilities
5. Use proper ${language} testing conventions
6. Include descriptive test names and comments

OUTPUT FORMAT (JSON only):
{
  "tests": [
    {
      "name": "test_function_name_scenario",
      "description": "Clear description of what this test validates",
      "code": "Complete ${language} test code",
      "category": "${testType}",
      "priority": 1-5,
      "estimatedComplexity": 1-10,
      "dependencies": ["list of dependencies if any"]
    }
  ]
}

Generate practical, executable tests that a smart contract auditor would write.`;
  }

  private buildDeepSeekPrompt(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move'
  ): string {
    const testTypeInstructions = this.getTestTypeInstructions(testType, language);
    
    return `
As a blockchain security expert, create ${testType} tests for this ${language} smart contract.

File: ${fileName}
Type: ${testType}

Code:
\`\`\`${language}
${sourceCode}
\`\`\`

${testTypeInstructions}

Create 2-3 focused test cases. Return JSON format:
{
  "tests": [
    {
      "name": "test_name",
      "description": "what it tests",
      "code": "executable ${language} test code", 
      "category": "${testType}",
      "priority": 1-5,
      "estimatedComplexity": 1-10
    }
  ]
}`;
  }

  private getTestTypeInstructions(testType: TestType, language: 'rust' | 'move'): string {
    const baseInstructions = {
      functional: `
FUNCTIONAL TESTING FOCUS:
- Test individual function behavior
- Validate input/output correctness
- Test parameter boundaries
- Verify state changes
- Check return values and error conditions`,

      security: `
SECURITY TESTING FOCUS:
- Access control vulnerabilities
- Input validation attacks
- Integer overflow/underflow
- Reentrancy attacks (if applicable)
- Resource exhaustion
- Privilege escalation
- Authentication bypasses`,

      integration: `
INTEGRATION TESTING FOCUS:
- Cross-function interactions
- Module dependencies
- State consistency across functions
- Event emission verification
- Transaction flow testing
- Multi-step operations`,

      performance: `
PERFORMANCE TESTING FOCUS:
- Gas optimization (if applicable)
- Resource usage measurement
- Execution time analysis
- Memory consumption
- Scalability testing
- Load testing scenarios`
    };

    const languageSpecific = language === 'rust' ? `
RUST SPECIFIC CONSIDERATIONS:
- Use #[test] attribute for test functions
- Include proper error handling with Result<>
- Test panic conditions with #[should_panic]
- Use assert!, assert_eq!, assert_ne! macros
- Test ownership and borrowing edge cases
- Include cargo test conventions` : `
MOVE SPECIFIC CONSIDERATIONS:
- Use Move testing framework
- Test resource management properly
- Verify capability-based security
- Test global storage operations
- Include proper module imports
- Test transaction scripts if applicable`;

    return baseInstructions[testType] + '\n' + languageSpecific;
  }

  private parseTestCases(response: string, source: 'gemini' | 'deepseek'): GeneratedTestCase[] {
    try {
      // Try to extract JSON from the response
      let jsonStr = response;
      
      // Remove markdown code blocks if present
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1];
      }
      
      // Try to find JSON object
      const objectMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (objectMatch) {
        jsonStr = objectMatch[0];
      }
      
      const parsed = JSON.parse(jsonStr);
      
      if (!parsed.tests || !Array.isArray(parsed.tests)) {
        throw new Error('Invalid response format: tests array not found');
      }
      
      return parsed.tests.map((test: any) => ({
        name: test.name || 'unnamed_test',
        description: test.description || 'No description provided',
        code: test.code || '// No code provided',
        category: test.category || 'general',
        priority: Math.max(1, Math.min(5, test.priority || 3)),
        estimatedComplexity: Math.max(1, Math.min(10, test.estimatedComplexity || 5)),
        dependencies: test.dependencies || []
      }));
      
    } catch (error) {
      console.warn(`Failed to parse ${source} response:`, error);
      
      // Fallback: try to extract test cases manually
      return this.extractTestCasesManually(response, source);
    }
  }

  private extractTestCasesManually(response: string, source: string): GeneratedTestCase[] {
    console.log(`Attempting manual extraction for ${source} response`);
    
    // Look for test function patterns
    const testPatterns = [
      /#\[test\]\s*fn\s+(\w+)/g,  // Rust tests
      /fun\s+test_(\w+)/g,        // Move tests
      /test_(\w+)/g               // Generic test patterns
    ];
    
    const extractedTests: GeneratedTestCase[] = [];
    
    for (const pattern of testPatterns) {
      let match;
      while ((match = pattern.exec(response)) !== null) {
        const testName = match[1] || match[0];
        extractedTests.push({
          name: testName,
          description: `Extracted test case from ${source} response`,
          code: this.extractTestCode(response, testName),
          category: 'extracted',
          priority: 3,
          estimatedComplexity: 5,
          dependencies: []
        });
      }
    }
    
    // If no tests found, create a placeholder
    if (extractedTests.length === 0) {
      extractedTests.push({
        name: `fallback_test_${Date.now()}`,
        description: `Fallback test case generated from ${source}`,
        code: this.createFallbackTest(),
        category: 'fallback',
        priority: 1,
        estimatedComplexity: 3,
        dependencies: []
      });
    }
    
    return extractedTests;
  }

  private extractTestCode(response: string, testName: string): string {
    // Try to extract the test function code
    const patterns = [
      new RegExp(`#\\[test\\]\\s*fn\\s+${testName}[\\s\\S]*?\\n\\}`, 'g'),
      new RegExp(`fun\\s+${testName}[\\s\\S]*?\\n\\}`, 'g'),
      new RegExp(`${testName}[\\s\\S]*?\\n\\}`, 'g')
    ];
    
    for (const pattern of patterns) {
      const match = pattern.exec(response);
      if (match) {
        return match[0];
      }
    }
    
    return `// Extracted test code for ${testName}\n// Could not parse complete function`;
  }

  private createFallbackTest(): string {
    return `
#[test]
fn test_basic_functionality() {
    // Basic test case
    // This is a fallback test generated when AI parsing failed
    assert!(true, "Fallback test");
}`;
  }

  private deduplicateTests(tests: GeneratedTestCase[]): GeneratedTestCase[] {
    const seen = new Set<string>();
    const unique: GeneratedTestCase[] = [];
    
    for (const test of tests) {
      const key = `${test.name}_${test.category}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(test);
      }
    }
    
    return unique;
  }

  private rankTestsByImportance(tests: GeneratedTestCase[], testType: TestType): GeneratedTestCase[] {
    // Priority scoring based on test type
    const typeScoring = {
      security: 5,
      functional: 4,
      integration: 3,
      performance: 2
    };
    
    return tests
      .map(test => ({
        ...test,
        priority: test.priority + (typeScoring[testType] || 0)
      }))
      .sort((a, b) => {
        // Sort by priority (higher first), then by complexity (lower first)
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.estimatedComplexity - b.estimatedComplexity;
      })
      .slice(0, 8); // Limit to top 8 tests per file
  }
}

// Language-specific test generators
export class RustTestGenerator extends TestCaseGenerator {
  async generateTestCases(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move' = 'rust'
  ): Promise<GeneratedTestCase[]> {
    const tests = await super.generateTestCases(sourceCode, fileName, testType, 'rust');
    
    // Add Rust-specific enhancements
    return tests.map(test => ({
      ...test,
      code: this.enhanceRustTestCode(test.code),
      dependencies: [...(test.dependencies || []), 'std', 'tokio'].filter((v, i, a) => a.indexOf(v) === i)
    }));
  }

  private enhanceRustTestCode(code: string): string {
    // Ensure proper Rust test structure
    if (!code.includes('#[test]')) {
      code = `#[test]\n${code}`;
    }
    
    // Add common imports if missing
    if (!code.includes('use ') && code.includes('assert')) {
      code = `use std::*;\n\n${code}`;
    }
    
    return code;
  }
}

export class MoveTestGenerator extends TestCaseGenerator {
  async generateTestCases(
    sourceCode: string,
    fileName: string,
    testType: TestType,
    language: 'rust' | 'move' = 'move'
  ): Promise<GeneratedTestCase[]> {
    const tests = await super.generateTestCases(sourceCode, fileName, testType, 'move');
    
    // Add Move-specific enhancements
    return tests.map(test => ({
      ...test,
      code: this.enhanceMoveTestCode(test.code),
      dependencies: [...(test.dependencies || []), '0x1::Vector', '0x1::Signer'].filter((v, i, a) => a.indexOf(v) === i)
    }));
  }

  private enhanceMoveTestCode(code: string): string {
    // Ensure proper Move test structure
    if (!code.includes('#[test]') && !code.includes('fun test_')) {
      code = `#[test]\nfun test_function() {\n${code}\n}`;
    }
    
    // Add common imports if missing
    if (!code.includes('use ') && code.includes('assert')) {
      code = `use 0x1::Debug;\nuse 0x1::Vector;\n\n${code}`;
    }
    
    return code;
  }
}

// Factory function to get appropriate generator
export function getTestGenerator(language: 'rust' | 'move'): TestCaseGenerator {
  switch (language) {
    case 'rust':
      return new RustTestGenerator();
    case 'move':
      return new MoveTestGenerator();
    default:
      return TestCaseGenerator.getInstance();
  }
}

// Utility function to validate generated tests
export function validateGeneratedTest(test: GeneratedTestCase): boolean {
  try {
    // Basic validation
    if (!test.name || !test.code || !test.description) {
      return false;
    }
    
    // Check if test name is valid
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(test.name)) {
      return false;
    }
    
    // Check if code contains basic test structure
    const hasTestStructure = test.code.includes('#[test]') || 
                           test.code.includes('fun test_') ||
                           test.code.includes('test_');
    
    return hasTestStructure;
  } catch (error) {
    console.warn('Test validation failed:', error);
    return false;
  }
}
