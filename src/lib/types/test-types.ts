// Types for Test Case Generation and Execution System

export interface TestSession {
  _id?: string;
  sessionId: string;
  projectId: string;
  projectName: string;
  developerId: string;
  selectedFiles: string[];
  testType: TestType;
  status: TestSessionStatus;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
}

export interface TestCase {
  _id?: string;
  sessionId: string;
  testId: string;
  fileName: string;
  testType: TestType;
  name: string;
  description: string;
  code: string;
  language: 'rust' | 'move';
  status: TestCaseStatus;
  createdAt: Date;
  executionTime?: number;
  errorMessage?: string;
  metadata?: {
    complexity: number;
    priority: number;
    category: string;
    dependencies?: string[];
  };
}

export interface TestResult {
  _id?: string;
  sessionId: string;
  testId: string;
  testCaseId: string;
  fileName: string;
  testName: string;
  status: TestResultStatus;
  executionTime: number;
  message: string;
  output?: string;
  error?: string;
  metrics?: {
    memoryUsage?: number;
    cpuTime?: number;
    exitCode?: number;
  };
  timestamp: Date;
}

export interface AuditLog {
  _id?: string;
  sessionId: string;
  userId: string;
  action: AuditAction;
  details: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface TestGenerationRequest {
  projectId: string;
  selectedFiles: string[];
  testType: TestType;
  language: 'rust' | 'move';
  options?: {
    includeEdgeCases?: boolean;
    generateMockData?: boolean;
    complexity?: 'basic' | 'intermediate' | 'advanced';
  };
}

export interface TestExecutionRequest {
  sessionId: string;
  testIds?: string[]; // If not provided, run all tests in session
  timeoutMs?: number;
  maxMemoryMB?: number;
}

export interface TestGenerationResponse {
  sessionId: string;
  generatedTests: TestCase[];
  summary: {
    totalTests: number;
    testsByType: Record<TestType, number>;
    estimatedExecutionTime: number;
  };
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
}

export interface TestExecutionResponse {
  sessionId: string;
  results: TestResult[];
  summary: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    totalExecutionTime: number;
    successRate: number;
  };
  status: 'completed' | 'partial' | 'failed';
  errorMessage?: string;
}

// Enums
export type TestType = 'functional' | 'security' | 'integration' | 'performance';

export type TestSessionStatus = 
  | 'created' 
  | 'generating' 
  | 'generated' 
  | 'executing' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type TestCaseStatus = 
  | 'generated' 
  | 'pending' 
  | 'running' 
  | 'passed' 
  | 'failed' 
  | 'skipped' 
  | 'timeout' 
  | 'error';

export type TestResultStatus = 
  | 'passed' 
  | 'failed' 
  | 'error' 
  | 'timeout' 
  | 'skipped';

export type AuditAction = 
  | 'session_created' 
  | 'tests_generated' 
  | 'tests_executed' 
  | 'session_cancelled' 
  | 'export_downloaded' 
  | 'error_occurred';

// AI Integration Types
export interface AITestGenerator {
  generateTestCases(
    sourceCode: string, 
    fileName: string, 
    testType: TestType, 
    language: 'rust' | 'move'
  ): Promise<GeneratedTestCase[]>;
}

export interface GeneratedTestCase {
  name: string;
  description: string;
  code: string;
  category: string;
  priority: number;
  estimatedComplexity: number;
  dependencies?: string[];
}

// Virtual Environment Types
export interface ExecutionEnvironment {
  language: 'rust' | 'move';
  timeoutMs: number;
  maxMemoryMB: number;
  workingDirectory: string;
}

export interface ExecutionResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  executionTime: number;
  memoryUsage: number;
  timedOut: boolean;
  error?: string;
}

// File Management Types
export interface ContractFile {
  fileName: string;
  content: string;
  language: 'rust' | 'move';
  size: number;
  checksum: string;
}

export interface TestFileBundle {
  sessionId: string;
  files: ContractFile[];
  testFiles: TestCase[];
  metadata: {
    createdAt: Date;
    language: 'rust' | 'move';
    totalSize: number;
  };
}

// Export Types
export interface ExportOptions {
  format: 'json' | 'md' | 'pdf';
  includeSourceCode?: boolean;
  includeTestResults?: boolean;
  includeMetrics?: boolean;
}

export interface ExportData {
  session: TestSession;
  testCases: TestCase[];
  results: TestResult[];
  summary: {
    projectInfo: {
      name: string;
      developerId: string;
      language: string;
      filesCount: number;
    };
    testSummary: {
      totalTests: number;
      passed: number;
      failed: number;
      executionTime: number;
      coverage?: number;
    };
    performanceMetrics: {
      averageExecutionTime: number;
      memoryUsage: number;
      successRate: number;
    };
  };
  generatedAt: Date;
}

// Error Types
export class TestGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TestGenerationError';
  }
}

export class TestExecutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly exitCode?: number,
    public readonly details?: any
  ) {
    super(message);
    this.name = 'TestExecutionError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value?: any
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// Validation Schemas (for runtime validation)
export const TestGenerationRequestSchema = {
  projectId: { type: 'string', required: true },
  selectedFiles: { type: 'array', required: true, minItems: 1 },
  testType: { type: 'string', enum: ['functional', 'security', 'integration', 'performance'], required: true },
  language: { type: 'string', enum: ['rust', 'move'], required: true }
};

export const TestExecutionRequestSchema = {
  sessionId: { type: 'string', required: true },
  testIds: { type: 'array', required: false },
  timeoutMs: { type: 'number', min: 1000, max: 300000, required: false },
  maxMemoryMB: { type: 'number', min: 64, max: 2048, required: false }
};
