import { PreprocessedData } from '../preprocessors/pre-processor';

export interface ParsedData {
  projectId: string;
  language: string;
  ast: Record<string, any>;
  symbols: SymbolTable;
  controlFlow: ControlFlowGraph;
  complexity: number;
  functions: FunctionInfo[];
  imports: ImportInfo[];
  contracts: ContractInfo[];
}

export interface SymbolTable {
  functions: Array<{
    name: string;
    file: string;
    line: number;
    parameters: string[];
    returnType?: string;
    visibility: 'public' | 'private' | 'internal';
  }>;
  variables: Array<{
    name: string;
    file: string;
    line: number;
    type?: string;
    scope: string;
  }>;
  structs: Array<{
    name: string;
    file: string;
    line: number;
    fields: Array<{ name: string; type: string }>;
  }>;
}

export interface ControlFlowGraph {
  nodes: Array<{
    id: string;
    type: 'function' | 'condition' | 'loop' | 'return';
    file: string;
    line: number;
  }>;
  edges: Array<{
    from: string;
    to: string;
    condition?: string;
  }>;
}

export interface FunctionInfo {
  name: string;
  file: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  complexity: number;
  calls: string[];
  visibility: 'public' | 'private' | 'internal';
}

export interface ImportInfo {
  module: string;
  file: string;
  line: number;
  items: string[];
}

export interface ContractInfo {
  name: string;
  file: string;
  line: number;
  type: 'contract' | 'module' | 'program';
  functions: string[];
  events?: string[];
}

export class CodeParser {
  async parse(data: PreprocessedData): Promise<ParsedData> {
    console.log(`Parsing code for project ${data.projectId}`);

    const sourceFiles = data.cleanedFiles.filter(f => f.type === 'source');
    
    // Parse based on language
    const parseResult = await this.parseByLanguage(sourceFiles, data.language);
    
    return {
      projectId: data.projectId,
      language: data.language,
      ast: parseResult.ast,
      symbols: parseResult.symbols,
      controlFlow: parseResult.controlFlow,
      complexity: this.calculateComplexity(parseResult.functions),
      functions: parseResult.functions,
      imports: parseResult.imports,
      contracts: parseResult.contracts
    };
  }

  private async parseByLanguage(
    files: Array<{ fileName: string; content: string }>,
    language: string
  ) {
    if (language.includes('Rust')) {
      return this.parseRust(files);
    } else if (language.includes('Move')) {
      return this.parseMove(files);
    } else if (language.includes('Cairo')) {
      return this.parseCairo(files);
    }
    
    throw new Error(`Unsupported language: ${language}`);
  }

  private async parseRust(files: Array<{ fileName: string; content: string }>) {
    const symbols: SymbolTable = { functions: [], variables: [], structs: [] };
    const functions: FunctionInfo[] = [];
    const imports: ImportInfo[] = [];
    const contracts: ContractInfo[] = [];
    const controlFlow: ControlFlowGraph = { nodes: [], edges: [] };
    const ast: Record<string, any> = {};

    for (const file of files) {
      // Parse functions
      const functionMatches = file.content.matchAll(/(?:pub\s+)?fn\s+(\w+)\s*\((.*?)\)\s*(?:->\s*([^{]+))?\s*\{/gs);
      for (const match of functionMatches) {
        const functionName = match[1];
        const params = this.parseParameters(match[2]);
        const line = this.getLineNumber(file.content, match.index || 0);
        
        const functionInfo: FunctionInfo = {
          name: functionName,
          file: file.fileName,
          startLine: line,
          endLine: this.findFunctionEnd(file.content, match.index || 0),
          parameters: params,
          complexity: this.calculateFunctionComplexity(file.content, match.index || 0),
          calls: this.extractFunctionCalls(file.content, match.index || 0),
          visibility: match[0].includes('pub') ? 'public' : 'private'
        };
        
        functions.push(functionInfo);
        symbols.functions.push({
          name: functionName,
          file: file.fileName,
          line,
          parameters: params,
          visibility: functionInfo.visibility
        });
      }

      // Parse structs
      const structMatches = file.content.matchAll(/(?:pub\s+)?struct\s+(\w+)\s*\{(.*?)\}/gs);
      for (const match of structMatches) {
        const structName = match[1];
        const line = this.getLineNumber(file.content, match.index || 0);
        const fields = this.parseStructFields(match[2]);
        
        symbols.structs.push({
          name: structName,
          file: file.fileName,
          line,
          fields
        });
      }

      // Parse imports
      const importMatches = file.content.matchAll(/use\s+([\w:]+)(?:::\{([^}]+)\})?;/g);
      for (const match of importMatches) {
        const line = this.getLineNumber(file.content, match.index || 0);
        imports.push({
          module: match[1],
          file: file.fileName,
          line,
          items: match[2] ? match[2].split(',').map(s => s.trim()) : []
        });
      }

      // Parse modules/contracts
      const moduleMatches = file.content.matchAll(/(?:pub\s+)?mod\s+(\w+)/g);
      for (const match of moduleMatches) {
        const line = this.getLineNumber(file.content, match.index || 0);
        contracts.push({
          name: match[1],
          file: file.fileName,
          line,
          type: 'module',
          functions: functions.filter(f => f.file === file.fileName).map(f => f.name)
        });
      }

      ast[file.fileName] = {
        content: file.content, // Store the actual file content for static analysis
        functions: functions.filter(f => f.file === file.fileName),
        structs: symbols.structs.filter(s => s.file === file.fileName),
        imports: imports.filter(i => i.file === file.fileName)
      };
    }

    return { ast, symbols, controlFlow, functions, imports, contracts };
  }

  private async parseMove(files: Array<{ fileName: string; content: string }>) {
    const symbols: SymbolTable = { functions: [], variables: [], structs: [] };
    const functions: FunctionInfo[] = [];
    const imports: ImportInfo[] = [];
    const contracts: ContractInfo[] = [];
    const controlFlow: ControlFlowGraph = { nodes: [], edges: [] };
    const ast: Record<string, any> = {};

    for (const file of files) {
      // Parse Move functions
      const functionMatches = file.content.matchAll(/(?:public\s+)?fun\s+(\w+)\s*\((.*?)\)(?:\s*:\s*([^{]+))?\s*\{/gs);
      for (const match of functionMatches) {
        const functionName = match[1];
        const params = this.parseParameters(match[2]);
        const line = this.getLineNumber(file.content, match.index || 0);
        
        const functionInfo: FunctionInfo = {
          name: functionName,
          file: file.fileName,
          startLine: line,
          endLine: this.findFunctionEnd(file.content, match.index || 0),
          parameters: params,
          complexity: this.calculateFunctionComplexity(file.content, match.index || 0),
          calls: this.extractFunctionCalls(file.content, match.index || 0),
          visibility: match[0].includes('public') ? 'public' : 'private'
        };
        
        functions.push(functionInfo);
        symbols.functions.push({
          name: functionName,
          file: file.fileName,
          line,
          parameters: params,
          visibility: functionInfo.visibility
        });
      }

      // Parse structs
      const structMatches = file.content.matchAll(/struct\s+(\w+)\s*\{(.*?)\}/gs);
      for (const match of structMatches) {
        const structName = match[1];
        const line = this.getLineNumber(file.content, match.index || 0);
        const fields = this.parseStructFields(match[2]);
        
        symbols.structs.push({
          name: structName,
          file: file.fileName,
          line,
          fields
        });
      }

      // Parse modules
      const moduleMatches = file.content.matchAll(/module\s+([\w:]+)\s*\{/g);
      for (const match of moduleMatches) {
        const line = this.getLineNumber(file.content, match.index || 0);
        contracts.push({
          name: match[1],
          file: file.fileName,
          line,
          type: 'module',
          functions: functions.filter(f => f.file === file.fileName).map(f => f.name)
        });
      }

      ast[file.fileName] = {
        content: file.content, // Store the actual file content for static analysis
        functions: functions.filter(f => f.file === file.fileName),
        structs: symbols.structs.filter(s => s.file === file.fileName),
        imports: imports.filter(i => i.file === file.fileName)
      };
    }

    return { ast, symbols, controlFlow, functions, imports, contracts };
  }

  private async parseCairo(files: Array<{ fileName: string; content: string }>) {
    const symbols: SymbolTable = { functions: [], variables: [], structs: [] };
    const functions: FunctionInfo[] = [];
    const imports: ImportInfo[] = [];
    const contracts: ContractInfo[] = [];
    const controlFlow: ControlFlowGraph = { nodes: [], edges: [] };
    const ast: Record<string, any> = {};

    for (const file of files) {
      // Parse Cairo functions
      const functionMatches = file.content.matchAll(/fn\s+(\w+)\s*\((.*?)\)(?:\s*->\s*([^{]+))?\s*\{/gs);
      for (const match of functionMatches) {
        const functionName = match[1];
        const params = this.parseParameters(match[2]);
        const line = this.getLineNumber(file.content, match.index || 0);
        
        const functionInfo: FunctionInfo = {
          name: functionName,
          file: file.fileName,
          startLine: line,
          endLine: this.findFunctionEnd(file.content, match.index || 0),
          parameters: params,
          complexity: this.calculateFunctionComplexity(file.content, match.index || 0),
          calls: this.extractFunctionCalls(file.content, match.index || 0),
          visibility: 'public' // Cairo functions are generally public
        };
        
        functions.push(functionInfo);
        symbols.functions.push({
          name: functionName,
          file: file.fileName,
          line,
          parameters: params,
          visibility: functionInfo.visibility
        });
      }

      ast[file.fileName] = {
        content: file.content, // Store the actual file content for static analysis
        functions: functions.filter(f => f.file === file.fileName),
        structs: symbols.structs.filter(s => s.file === file.fileName),
        imports: imports.filter(i => i.file === file.fileName)
      };
    }

    return { ast, symbols, controlFlow, functions, imports, contracts };
  }

  private parseParameters(paramString: string): string[] {
    if (!paramString.trim()) return [];
    return paramString.split(',').map(p => p.trim().split(':')[0].trim()).filter(p => p);
  }

  private parseStructFields(fieldsString: string): Array<{ name: string; type: string }> {
    const fields: Array<{ name: string; type: string }> = [];
    const lines = fieldsString.split('\n');
    
    for (const line of lines) {
      const match = line.match(/(\w+):\s*([^,]+)/);
      if (match) {
        fields.push({
          name: match[1].trim(),
          type: match[2].trim().replace(',', '')
        });
      }
    }
    
    return fields;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split('\n').length;
  }

  private findFunctionEnd(content: string, startIndex: number): number {
    let braceCount = 0;
    let inFunction = false;
    
    for (let i = startIndex; i < content.length; i++) {
      if (content[i] === '{') {
        braceCount++;
        inFunction = true;
      } else if (content[i] === '}') {
        braceCount--;
        if (inFunction && braceCount === 0) {
          return this.getLineNumber(content, i);
        }
      }
    }
    
    return this.getLineNumber(content, content.length);
  }

  private calculateFunctionComplexity(content: string, functionStart: number): number {
    const functionEnd = this.findFunctionEnd(content, functionStart);
    const functionContent = content.substring(functionStart, functionEnd);
    
    let complexity = 1; // Base complexity
    
    // Count decision points
    const conditions = (functionContent.match(/if\s|else\s|match\s|while\s|for\s/g) || []).length;
    const logicalOps = (functionContent.match(/&&|\|\|/g) || []).length;
    
    return complexity + conditions + logicalOps;
  }

  private extractFunctionCalls(content: string, functionStart: number): string[] {
    const functionEnd = this.findFunctionEnd(content, functionStart);
    const functionContent = content.substring(functionStart, functionEnd);
    
    const calls: string[] = [];
    const callMatches = functionContent.matchAll(/(\w+)\s*\(/g);
    
    for (const match of callMatches) {
      calls.push(match[1]);
    }
    
    return [...new Set(calls)]; // Remove duplicates
  }

  private calculateComplexity(functions: FunctionInfo[]): number {
    return functions.reduce((total, func) => total + func.complexity, 0);
  }
}
