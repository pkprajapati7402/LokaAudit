// Virtual Execution Environment for Smart Contract Tests
import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { 
  ExecutionEnvironment, 
  ExecutionResult, 
  TestExecutionError,
  TestCase 
} from '../types/test-types';

export class VirtualEnvironment {
  private static instance: VirtualEnvironment;
  private workingDirectory: string;
  private activeProcesses: Map<string, ChildProcess> = new Map();

  private constructor() {
    this.workingDirectory = path.join(os.tmpdir(), 'lokaaudit-tests');
  }

  static getInstance(): VirtualEnvironment {
    if (!VirtualEnvironment.instance) {
      VirtualEnvironment.instance = new VirtualEnvironment();
    }
    return VirtualEnvironment.instance;
  }

  async initialize(): Promise<void> {
    try {
      // Create working directory
      await fs.mkdir(this.workingDirectory, { recursive: true });
      console.log(`📁 Virtual environment initialized at: ${this.workingDirectory}`);
    } catch (error) {
      throw new TestExecutionError(
        'Failed to initialize virtual environment',
        'INIT_FAILED',
        undefined,
        error
      );
    }
  }

  async executeTest(
    testCase: TestCase,
    environment: ExecutionEnvironment
  ): Promise<ExecutionResult> {
    const sessionDir = path.join(this.workingDirectory, testCase.sessionId);
    const testId = `${testCase.fileName}_${testCase.testId}`;
    
    try {
      console.log(`🚀 Executing test: ${testCase.name} (${environment.language})`);
      
      // Create session-specific directory
      await fs.mkdir(sessionDir, { recursive: true });
      
      // Execute based on language
      switch (environment.language) {
        case 'rust':
          return await this.executeRustTest(testCase, environment, sessionDir);
        case 'move':
          return await this.executeMoveTest(testCase, environment, sessionDir);
        default:
          throw new TestExecutionError(
            `Unsupported language: ${environment.language}`,
            'UNSUPPORTED_LANGUAGE'
          );
      }
    } catch (error) {
      console.error(`❌ Test execution failed for ${testCase.name}:`, error);
      
      return {
        exitCode: 1,
        stdout: '',
        stderr: error instanceof Error ? error.message : 'Unknown error',
        executionTime: 0,
        memoryUsage: 0,
        timedOut: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private async executeRustTest(
    testCase: TestCase,
    environment: ExecutionEnvironment,
    sessionDir: string
  ): Promise<ExecutionResult> {
    const projectDir = path.join(sessionDir, `test_${testCase.testId}`);
    
    try {
      // Create Rust project structure
      await this.createRustTestProject(projectDir, testCase);
      
      // Run cargo test
      const result = await this.runCommand(
        'cargo',
        ['test', '--', '--nocapture'],
        {
          cwd: projectDir,
          timeout: environment.timeoutMs,
          maxMemory: environment.maxMemoryMB
        }
      );
      
      return result;
    } catch (error) {
      throw new TestExecutionError(
        'Rust test execution failed',
        'RUST_EXECUTION_FAILED',
        undefined,
        error
      );
    }
  }

  private async executeMoveTest(
    testCase: TestCase,
    environment: ExecutionEnvironment,
    sessionDir: string
  ): Promise<ExecutionResult> {
    const projectDir = path.join(sessionDir, `test_${testCase.testId}`);
    
    try {
      // Create Move project structure
      await this.createMoveTestProject(projectDir, testCase);
      
      // Run Move test
      const result = await this.runCommand(
        'move',
        ['test'],
        {
          cwd: projectDir,
          timeout: environment.timeoutMs,
          maxMemory: environment.maxMemoryMB
        }
      );
      
      return result;
    } catch (error) {
      throw new TestExecutionError(
        'Move test execution failed',
        'MOVE_EXECUTION_FAILED',
        undefined,
        error
      );
    }
  }

  private async createRustTestProject(projectDir: string, testCase: TestCase): Promise<void> {
    await fs.mkdir(projectDir, { recursive: true });
    
    // Create Cargo.toml
    const cargoToml = `
[package]
name = "test_${testCase.testId}"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.0", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

[lib]
name = "lib"
path = "src/lib.rs"

[[bin]]
name = "main"
path = "src/main.rs"
`;
    
    await fs.writeFile(path.join(projectDir, 'Cargo.toml'), cargoToml);
    
    // Create src directory
    const srcDir = path.join(projectDir, 'src');
    await fs.mkdir(srcDir, { recursive: true });
    
    // Create lib.rs with the test
    const libRs = `
// Generated test for ${testCase.fileName}
${testCase.code}

// Additional test utilities
#[cfg(test)]
mod test_utilities {
    use super::*;
    
    pub fn setup() {
        // Test setup code
    }
    
    pub fn teardown() {
        // Test cleanup code
    }
}
`;
    
    await fs.writeFile(path.join(srcDir, 'lib.rs'), libRs);
    
    // Create main.rs
    const mainRs = `
fn main() {
    println!("Test binary for ${testCase.testId}");
}
`;
    
    await fs.writeFile(path.join(srcDir, 'main.rs'), mainRs);
  }

  private async createMoveTestProject(projectDir: string, testCase: TestCase): Promise<void> {
    await fs.mkdir(projectDir, { recursive: true });
    
    // Create Move.toml
    const moveToml = `
[package]
name = "test_${testCase.testId}"
version = "0.0.1"

[dependencies]
MoveStdlib = { git = "https://github.com/move-language/move.git", subdir = "language/move-stdlib", rev = "main" }

[addresses]
TestAddress = "0x42"
`;
    
    await fs.writeFile(path.join(projectDir, 'Move.toml'), moveToml);
    
    // Create sources directory
    const sourcesDir = path.join(projectDir, 'sources');
    await fs.mkdir(sourcesDir, { recursive: true });
    
    // Create test module
    const testModule = `
module TestAddress::${testCase.testId.replace(/[^a-zA-Z0-9]/g, '_')} {
    use std::debug;
    
    ${testCase.code}
    
    #[test]
    public fun test_runner() {
        debug::print(&b"Running Move test for ${testCase.fileName}");
    }
}
`;
    
    await fs.writeFile(path.join(sourcesDir, 'test.move'), testModule);
  }

  private async runCommand(
    command: string,
    args: string[],
    options: {
      cwd: string;
      timeout: number;
      maxMemory: number;
    }
  ): Promise<ExecutionResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';
      let timedOut = false;
      let memoryUsage = 0;
      
      const child = spawn(command, args, {
        cwd: options.cwd,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        windowsHide: true
      });
      
      const processId = `${command}_${Date.now()}`;
      this.activeProcesses.set(processId, child);
      
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        timedOut = true;
        child.kill('SIGKILL');
      }, options.timeout);
      
      // Monitor memory usage (simplified for Windows)
      const memoryInterval = setInterval(() => {
        if (child.pid) {
          try {
            // On Windows, we'll use a simplified memory check
            memoryUsage = Math.max(memoryUsage, process.memoryUsage().heapUsed / 1024 / 1024);
          } catch (error) {
            // Ignore memory monitoring errors
          }
        }
      }, 100);
      
      child.stdout?.on('data', (data) => {
        stdout += data.toString();
      });
      
      child.stderr?.on('data', (data) => {
        stderr += data.toString();
      });
      
      child.on('close', (code) => {
        clearTimeout(timeoutHandle);
        clearInterval(memoryInterval);
        this.activeProcesses.delete(processId);
        
        const executionTime = Date.now() - startTime;
        
        resolve({
          exitCode: code || 0,
          stdout,
          stderr,
          executionTime,
          memoryUsage,
          timedOut,
          error: code !== 0 ? stderr || 'Process failed' : undefined
        });
      });
      
      child.on('error', (error) => {
        clearTimeout(timeoutHandle);
        clearInterval(memoryInterval);
        this.activeProcesses.delete(processId);
        
        const executionTime = Date.now() - startTime;
        
        resolve({
          exitCode: 1,
          stdout,
          stderr: stderr + error.message,
          executionTime,
          memoryUsage,
          timedOut,
          error: error.message
        });
      });
    });
  }

  async cleanup(sessionId?: string): Promise<void> {
    try {
      if (sessionId) {
        // Clean up specific session
        const sessionDir = path.join(this.workingDirectory, sessionId);
        await fs.rm(sessionDir, { recursive: true, force: true });
        console.log(`🧹 Cleaned up session: ${sessionId}`);
      } else {
        // Clean up entire working directory
        await fs.rm(this.workingDirectory, { recursive: true, force: true });
        await fs.mkdir(this.workingDirectory, { recursive: true });
        console.log('🧹 Cleaned up virtual environment');
      }
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  async killAllProcesses(): Promise<void> {
    for (const [processId, process] of this.activeProcesses) {
      try {
        process.kill('SIGKILL');
        console.log(`💀 Killed process: ${processId}`);
      } catch (error) {
        console.warn(`Failed to kill process ${processId}:`, error);
      }
    }
    this.activeProcesses.clear();
  }

  getActiveProcessCount(): number {
    return this.activeProcesses.size;
  }

  getWorkingDirectory(): string {
    return this.workingDirectory;
  }
}

// Language-specific runners
export class RustRunner {
  private virtualEnv: VirtualEnvironment;

  constructor() {
    this.virtualEnv = VirtualEnvironment.getInstance();
  }

  async executeTests(testCases: TestCase[], timeoutMs: number = 30000): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    for (const testCase of testCases) {
      if (testCase.language !== 'rust') {
        continue;
      }
      
      const environment: ExecutionEnvironment = {
        language: 'rust',
        timeoutMs,
        maxMemoryMB: 512,
        workingDirectory: this.virtualEnv.getWorkingDirectory()
      };
      
      const result = await this.virtualEnv.executeTest(testCase, environment);
      results.push(result);
    }
    
    return results;
  }

  async checkRustInstallation(): Promise<boolean> {
    try {
      const result = await this.virtualEnv['runCommand']('cargo', ['--version'], {
        cwd: process.cwd(),
        timeout: 5000,
        maxMemory: 64
      });
      
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }
}

export class MoveRunner {
  private virtualEnv: VirtualEnvironment;

  constructor() {
    this.virtualEnv = VirtualEnvironment.getInstance();
  }

  async executeTests(testCases: TestCase[], timeoutMs: number = 30000): Promise<ExecutionResult[]> {
    const results: ExecutionResult[] = [];
    
    for (const testCase of testCases) {
      if (testCase.language !== 'move') {
        continue;
      }
      
      const environment: ExecutionEnvironment = {
        language: 'move',
        timeoutMs,
        maxMemoryMB: 512,
        workingDirectory: this.virtualEnv.getWorkingDirectory()
      };
      
      const result = await this.virtualEnv.executeTest(testCase, environment);
      results.push(result);
    }
    
    return results;
  }

  async checkMoveInstallation(): Promise<boolean> {
    try {
      const result = await this.virtualEnv['runCommand']('move', ['--version'], {
        cwd: process.cwd(),
        timeout: 5000,
        maxMemory: 64
      });
      
      return result.exitCode === 0;
    } catch (error) {
      return false;
    }
  }
}

// Factory function to get appropriate runner
export function getTestRunner(language: 'rust' | 'move'): RustRunner | MoveRunner {
  switch (language) {
    case 'rust':
      return new RustRunner();
    case 'move':
      return new MoveRunner();
    default:
      throw new Error(`Unsupported language: ${language}`);
  }
}

// System resource monitoring
export class ResourceMonitor {
  private static instance: ResourceMonitor;
  
  static getInstance(): ResourceMonitor {
    if (!ResourceMonitor.instance) {
      ResourceMonitor.instance = new ResourceMonitor();
    }
    return ResourceMonitor.instance;
  }

  async checkSystemResources(): Promise<{
    availableMemoryMB: number;
    cpuUsagePercent: number;
    diskSpaceGB: number;
    canExecuteTests: boolean;
  }> {
    try {
      const memInfo = process.memoryUsage();
      const availableMemoryMB = (os.totalmem() - memInfo.rss) / 1024 / 1024;
      
      // Simplified resource check for Windows
      const canExecuteTests = availableMemoryMB > 256; // At least 256MB available
      
      return {
        availableMemoryMB,
        cpuUsagePercent: 0, // Would need more complex implementation
        diskSpaceGB: 0, // Would need more complex implementation  
        canExecuteTests
      };
    } catch (error) {
      console.warn('Resource monitoring failed:', error);
      return {
        availableMemoryMB: 512,
        cpuUsagePercent: 50,
        diskSpaceGB: 10,
        canExecuteTests: true
      };
    }
  }

  async waitForResources(maxWaitMs: number = 30000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      const resources = await this.checkSystemResources();
      if (resources.canExecuteTests) {
        return true;
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    return false;
  }
}
