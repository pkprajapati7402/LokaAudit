# LokaAudit Documentation Generation Process

## Overview
This document provides a comprehensive overview of the documentation generation process in LokaAudit, covering the complete flow from file selection in the frontend to displaying the generated documentation results.

## Architecture Overview

```
Frontend (React/Next.js) 
    ↓ 
API Route (/api/generate-documentation)
    ↓
MongoDB (File Storage & Retrieval)
    ↓
AST Parser (Code Analysis)
    ↓
LLM Integration (AI Enhancement)
    ↓
Response Processing & Display
```

## Detailed Process Flow

### 1. Frontend Initialization & File Selection

#### 1.1 Project Loading
**File:** `src/app/documentation/page.tsx`

```typescript
// Fetch projects from MongoDB
useEffect(() => {
  const fetchProjects = async () => {
    try {
      const response = await fetch('/api/projects');
      const data = await response.json();
      setProjects(data.projects);
    } catch (error) {
      setError(error.message);
    }
  };
  fetchProjects();
}, []);
```

**Process:**
- Component mounts and fetches all available projects from MongoDB
- Projects are displayed in a searchable/filterable list
- Each project shows: name, developer ID, file count, language
- User can select a project to view its files

#### 1.2 File Selection Interface
```typescript
// Handle individual file selection
const handleFileSelect = (fileIndex: number) => {
  const newSelectedFiles = new Set(selectedFiles);
  if (newSelectedFiles.has(fileIndex)) {
    newSelectedFiles.delete(fileIndex);
  } else {
    newSelectedFiles.add(fileIndex);
  }
  setSelectedFiles(newSelectedFiles);
};
```

**Features:**
- Individual file selection with checkboxes
- "Select All" functionality
- Real-time selection counter
- File metadata display (size, upload date)

### 2. Documentation Generation Request

#### 2.1 Frontend Request Preparation
```typescript
const generateDocumentation = async () => {
  if (!selectedProject || selectedFiles.size === 0) {
    alert('Please select files to generate documentation');
    return;
  }

  setIsGenerating(true);
  setGenerationStatus('Initializing documentation generation...');
  
  const fileIndices = Array.from(selectedFiles);
  
  const response = await fetch('/api/generate-documentation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      projectName: selectedProject.projectName,
      developerId: selectedProject.developerId,
      fileIndices: fileIndices
    }),
  });
};
```

**Request Payload:**
- `projectName`: Selected project identifier
- `developerId`: Project owner identifier  
- `fileIndices`: Array of selected file indices for processing

### 3. Backend API Processing

#### 3.1 API Route Handler
**File:** `src/app/api/generate-documentation/route.ts`

```typescript
export async function POST(req: Request) {
  try {
    // Parse and validate request
    const { projectName, developerId, fileIndices } = await req.json();
    
    // Validation
    if (!projectName || !developerId || !Array.isArray(fileIndices)) {
      return NextResponse.json(
        { error: 'Invalid request data' }, 
        { status: 400 }
      );
    }
    
    // Process files and generate documentation
    const result = await processDocumentationRequest(
      projectName, 
      developerId, 
      fileIndices
    );
    
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}
```

#### 3.2 MongoDB File Retrieval
```typescript
// Connect to MongoDB and fetch project files
const client = await clientPromise;
const db = client.db("lokaaudit");
const collection = db.collection("projects");

const project = await collection.findOne({
  projectName,
  developerId
});

if (!project || !project.files) {
  throw new Error('Project not found');
}

// Extract selected files based on indices
const selectedFiles = fileIndices.map(index => project.files[index]);
```

**Process:**
- Establishes MongoDB connection using connection string
- Queries the "projects" collection for matching project
- Retrieves file content and metadata for selected files
- Validates file existence and accessibility

### 4. AST Parsing & Code Analysis

#### 4.1 AST Parser Initialization
**File:** `src/lib/ast-parser.ts`

```typescript
export async function parseFileAST(fileName: string, content: string, language: string) {
  console.log(`🔍 Processing file: ${fileName} (${language})`);
  
  try {
    switch (language.toLowerCase()) {
      case 'rust':
        return await parseRustAST(content, fileName);
      case 'move':
        return await parseMoveAST(content, fileName);
      default:
        throw new Error(`Unsupported language: ${language}`);
    }
  } catch (error) {
    console.error(`❌ Error processing file ${fileName}:`, error);
    throw error;
  }
}
```

#### 4.2 Language-Specific Parsing

##### Rust AST Parsing
```typescript
async function parseRustAST(content: string, fileName: string): Promise<ParsedFile> {
  try {
    // Parse using Babel parser with Rust plugin
    const ast = parse(content, {
      sourceType: 'module',
      plugins: ['typescript', 'decorators-legacy'],
      errorRecovery: true,
    });

    const functions: ParsedFunction[] = [];
    const structs: ParsedStruct[] = [];
    const variables: ParsedVariable[] = [];

    // Traverse AST and extract components
    traverse(ast, {
      // Function extraction
      FunctionDeclaration(path) {
        const func = extractFunctionInfo(path, content, fileName);
        functions.push(func);
      },
      
      // Struct extraction  
      TypeAlias(path) {
        const struct = extractStructInfo(path, fileName);
        structs.push(struct);
      },
      
      // Variable extraction
      VariableDeclaration(path) {
        const vars = extractVariableInfo(path, fileName);
        variables.push(...vars);
      }
    });

    return {
      fileName,
      language: 'rust',
      functions,
      structs,
      variables,
      complexity: calculateComplexity(content),
      security_insights: extractSecurityInsights(content, 'rust')
    };
  } catch (error) {
    throw new Error(`Failed to parse Rust AST: ${error.message}`);
  }
}
```

##### Move AST Parsing
```typescript
async function parseMoveAST(content: string, fileName: string): Promise<ParsedFile> {
  try {
    // Move-specific parsing logic
    const functions = extractMoveFunctions(content, fileName);
    const structs = extractMoveStructs(content, fileName);
    const events = extractMoveEvents(content, fileName);
    
    return {
      fileName,
      language: 'move',
      functions,
      structs,
      events,
      complexity: calculateComplexity(content),
      security_insights: extractSecurityInsights(content, 'move')
    };
  } catch (error) {
    throw new Error(`Failed to parse Move AST: ${error.message}`);
  }
}
```

#### 4.3 Code Complexity Analysis
```typescript
function calculateComplexity(code: string): number {
  let complexity = 1; // Base complexity
  
  // Keywords that increase complexity
  const complexityKeywords = [
    'if', 'else', 'while', 'for', 'loop', 'match', 'case',
    'and', 'or', 'try', 'catch', 'when'
  ];
  
  // Special patterns with regex escaping
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
```

#### 4.4 Security Insights Extraction
```typescript
function extractSecurityInsights(code: string, language: string): SecurityInsight[] {
  const insights: SecurityInsight[] = [];
  
  // Language-specific security patterns
  const securityPatterns = {
    rust: [
      { pattern: /unsafe\s*{/, risk: 'high', message: 'Unsafe block detected' },
      { pattern: /\.unwrap\(\)/, risk: 'medium', message: 'Potential panic with unwrap()' },
      { pattern: /transmute/, risk: 'high', message: 'Memory transmutation detected' }
    ],
    move: [
      { pattern: /borrow_global_mut/, risk: 'medium', message: 'Mutable global resource access' },
      { pattern: /signer::address_of/, risk: 'low', message: 'Signer operations present' },
      { pattern: /assert!/, risk: 'low', message: 'Assertions present' }
    ]
  };
  
  const patterns = securityPatterns[language] || [];
  
  patterns.forEach(({ pattern, risk, message }) => {
    const matches = code.match(pattern);
    if (matches) {
      insights.push({
        type: 'security_concern',
        severity: risk,
        message,
        occurrences: matches.length
      });
    }
  });
  
  return insights;
}
```

### 5. LLM Integration & AI Enhancement

#### 5.1 LLM Service Selection
**File:** `src/lib/llm-integration.ts`

```typescript
export async function generateDocumentation(
  parsedFiles: ParsedFile[], 
  projectName: string
): Promise<EnhancedDocumentation> {
  
  console.log('🚀 Starting production documentation generation');
  
  try {
    // Prepare combined AST data
    const combinedAST = combineFileASTs(parsedFiles);
    
    // Generate basic documentation using Groq
    const basicDoc = await generateBasicDocumentation(combinedAST, projectName);
    
    // Enhance with security analysis using Gemini
    const securityAnalysis = await generateSecurityAnalysis(combinedAST, basicDoc);
    
    // Combine results
    return {
      ...basicDoc,
      security_analysis: securityAnalysis,
      generation_metadata: {
        timestamp: new Date().toISOString(),
        files_processed: parsedFiles.length,
        models_used: ['groq-deepseek-r1', 'gemini-2.0-flash']
      }
    };
    
  } catch (error) {
    console.error('❌ Documentation generation error:', error);
    throw error;
  }
}
```

#### 5.2 Groq Integration (Basic Documentation)
```typescript
async function generateBasicDocumentation(
  combinedAST: CombinedAST, 
  projectName: string
): Promise<BasicDocumentation> {
  
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const prompt = `
  Analyze this smart contract and generate comprehensive documentation:
  
  Project: ${projectName}
  Functions: ${JSON.stringify(combinedAST.functions, null, 2)}
  Structs/Events: ${JSON.stringify(combinedAST.structs, null, 2)}
  Variables: ${JSON.stringify(combinedAST.variables, null, 2)}
  
  Provide detailed analysis in JSON format with:
  - module_description
  - summary
  - function_descriptions (with parameters, examples, security_notes)
  - event_descriptions
  - variable_descriptions
  - quality_assessment
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "deepseek-r1-distill-llama-70b",
    temperature: 0.1,
    max_tokens: 8000,
  });

  const response = completion.choices[0]?.message?.content;
  
  try {
    return JSON.parse(response);
  } catch (parseError) {
    console.error('Failed to parse Groq response as JSON:', response);
    throw new Error('Invalid JSON response from Groq');
  }
}
```

#### 5.3 Gemini Integration (Security Analysis)
```typescript
async function generateSecurityAnalysis(
  combinedAST: CombinedAST, 
  basicDoc: BasicDocumentation
): Promise<SecurityAnalysis> {
  
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const securityPrompt = `
  Perform security analysis on this smart contract:
  
  Combined AST: ${JSON.stringify(combinedAST, null, 2)}
  Basic Documentation: ${JSON.stringify(basicDoc, null, 2)}
  
  Focus on:
  - Global resource access patterns
  - Input validation gaps  
  - Access control mechanisms
  - Potential race conditions
  - Formal verification needs
  
  Return JSON with:
  - overall_risk (low/medium/high)
  - key_findings (array of detailed findings with severity, location, impact)
  - recommendations (array with priority and description)
  - compliance_score (0-10)
  - audit_notes
  `;

  const result = await model.generateContent(securityPrompt);
  const response = result.response.text();
  
  try {
    return JSON.parse(response);
  } catch (parseError) {
    console.error('Failed to parse Gemini response as JSON:', response);
    throw new Error('Invalid JSON response from Gemini');
  }
}
```

### 6. Response Processing & Quality Assurance

#### 6.1 Response Validation
```typescript
function validateDocumentationResponse(doc: any): boolean {
  const requiredFields = [
    'name', 'description', 'summary', 'functions', 'events', 'variables'
  ];
  
  return requiredFields.every(field => doc.hasOwnProperty(field));
}

function sanitizeDocumentationResponse(doc: any): EnhancedDocumentation {
  return {
    name: doc.name || 'Unknown Contract',
    description: doc.description || 'No description available',
    overall_summary: doc.overall_summary || '',
    summary: doc.summary || doc.description || '',
    version: doc.version || null,
    license: doc.license || null,
    functions: Array.isArray(doc.functions) ? doc.functions : [],
    events: Array.isArray(doc.events) ? doc.events : [],
    variables: Array.isArray(doc.variables) ? doc.variables : [],
    security_analysis: doc.security_analysis || null,
    complexity_analysis: doc.complexity_analysis || null,
    quality_metrics: doc.quality_metrics || null,
    file_breakdown: doc.file_breakdown || null
  };
}
```

#### 6.2 Error Handling & Fallbacks
```typescript
// Comprehensive error handling with graceful degradation
try {
  const documentation = await generateDocumentation(processedFiles, projectName);
  
  if (!validateDocumentationResponse(documentation)) {
    throw new Error('Invalid documentation structure');
  }
  
  return {
    success: true,
    documentation: sanitizeDocumentationResponse(documentation),
    metrics: {
      files_processed: processedFiles.length,
      generation_time: Date.now() - startTime,
      models_used: ['groq', 'gemini']
    }
  };
  
} catch (error) {
  console.error('Documentation generation failed:', error);
  
  // Fallback to basic AST-only documentation
  const fallbackDoc = generateFallbackDocumentation(processedFiles);
  
  return {
    success: false,
    error: error.message,
    fallback_documentation: fallbackDoc,
    partial_success: true
  };
}
```

### 7. Frontend Result Display

#### 7.1 Response Handling
```typescript
// Frontend response processing
const result = await response.json();

if (!response.ok) {
  throw new Error(result.error || 'Failed to generate documentation');
}

if (result.success && result.documentation) {
  setGenerationStatus('Documentation generated successfully!');
  setDocumentation(result.documentation);
  
  // Clear status after success message
  setTimeout(() => setGenerationStatus(''), 2000);
} else {
  throw new Error('Invalid response format');
}
```

#### 7.2 Documentation Visualization
The frontend renders the documentation with multiple sections:

1. **Contract Header**: Name, version, license badges
2. **Overall Summary**: AI-generated project overview
3. **Contract Summary**: Detailed contract description  
4. **Functions**: Complete function documentation with:
   - Parameters and return types
   - Security notes with warnings
   - Complexity scores
   - Code examples
   - Source file references

5. **Events & Structs**: Event definitions with purposes
6. **Variables**: Variable types and security implications
7. **Security Analysis**: 
   - Risk level indicators
   - Detailed findings with severity
   - Recommendations with priorities
   - Compliance scores with progress bars
   - Audit notes

8. **Quality Metrics**: Coverage and scoring visualizations
9. **Complexity Analysis**: Maintainability scores and metrics

### 8. Export Functionality

#### 8.1 PDF Export
```typescript
// Enhanced PDF generation with complete documentation
const generatePDF = (doc: DocumentationReport, projectName: string, timestamp: string) => {
  const pdf = new jsPDF();
  
  // Professional title page with branding
  // Color-coded sections for different content types
  // Complete security analysis with visual indicators
  // All function details with proper formatting
  // Quality metrics and complexity analysis
  // File breakdown for multi-file projects
  
  pdf.save(`${projectName}_documentation_${timestamp}.pdf`);
};
```

## Error Handling Strategy

### 1. Input Validation
- Request payload validation
- File existence verification
- Language support checking
- Size limit enforcement

### 2. Processing Errors
- AST parsing failures
- LLM API timeouts
- Rate limiting handling
- JSON parsing errors

### 3. Graceful Degradation
- Fallback to basic documentation
- Partial success reporting
- Alternative model usage
- Manual review flags

## Performance Optimizations

### 1. Caching Strategy
- AST parsing results caching
- LLM response caching for similar inputs
- File content caching in memory
- Database query optimization

### 2. Rate Limiting
- LLM API call throttling
- Concurrent request limiting
- Queue management for batch processing
- Timeout handling

### 3. Resource Management
- Memory cleanup after processing
- Connection pooling for database
- Efficient file streaming
- Progressive loading for large projects

## Security Considerations

### 1. Input Sanitization
- File content validation
- SQL injection prevention
- XSS protection in responses
- File size and type restrictions

### 2. API Security
- Environment variable protection
- API key rotation
- Request authentication
- CORS configuration

### 3. Data Privacy
- Temporary file cleanup
- Sensitive data redaction
- Audit trail maintenance
- Access logging

## Monitoring & Logging

### 1. Performance Metrics
- Generation time tracking
- Success/failure rates
- Model performance comparison
- Resource usage monitoring

### 2. Error Tracking
- Detailed error logging
- Stack trace capture
- User action correlation
- Performance bottleneck identification

### 3. Analytics
- Usage pattern analysis
- Popular language tracking
- Feature utilization metrics
- User engagement measurement

## Future Enhancements

### 1. Planned Features
- Additional language support (Solidity, JavaScript)
- Real-time collaboration
- Advanced security scanning
- Custom template support

### 2. Architecture Improvements
- Microservice separation
- Container deployment
- CI/CD pipeline integration
- Scalability enhancements

### 3. AI Enhancements
- Fine-tuned models for smart contracts
- Multi-model ensemble approaches
- Custom security rule engines
- Automated fix suggestions