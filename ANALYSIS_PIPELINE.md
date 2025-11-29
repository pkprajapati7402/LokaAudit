# LokaAudit Analysis Pipeline

## Overview
LokaAudit performs **real security analysis** through a comprehensive multi-stage pipeline, not hardcoded results. The system conducts actual vulnerability detection, semantic analysis, and AI-powered reasoning to provide production-ready audit reports.

## Analysis Pipeline

### 1. Pre-processing Stage
- **File Cleaning**: Removes comments, normalizes formatting
- **Dependency Extraction**: Analyzes imports and external dependencies
- **Metadata Calculation**: Computes file complexity, size metrics
- **Language Detection**: Identifies specific blockchain language variants

### 2. Code Parsing Stage
- **AST Generation**: Builds Abstract Syntax Trees for each file
- **Symbol Table Creation**: Extracts functions, variables, structs
- **Control Flow Analysis**: Maps execution paths and conditions
- **Function Analysis**: Identifies visibility, parameters, return types

### 3. Static Analysis Stage
**Real vulnerability detection using pattern matching rules:**
- **Integer Overflow Detection**: Scans arithmetic operations without overflow checks
- **Access Control Validation**: Identifies missing authorization in public functions
- **Reentrancy Detection**: Analyzes external calls and state changes
- **Resource Leak Detection**: Finds unclosed handles and memory issues
- **Type Confusion Detection**: Identifies unsafe type casting
- **Buffer Overflow Detection**: Checks array bounds and memory access

### 4. Semantic Analysis Stage
**Context-aware vulnerability detection:**
- **Business Logic Analysis**: Validates economic and functional logic
- **Inter-procedural Analysis**: Tracks data flow across function calls
- **Contract Interaction Analysis**: Examines cross-contract communication
- **Economic Logic Validation**: Detects financial manipulation vulnerabilities
- **State Consistency Checks**: Validates state transitions and invariants

### 5. AI Function Reasoning Stage
**Advanced AI-powered analysis using OpenRouter API:**
- **Cross-file Pattern Recognition**: Identifies complex vulnerabilities spanning multiple files
- **Business Logic Flaw Detection**: Uses AI to understand intended vs actual behavior
- **Attack Vector Identification**: Recognizes sophisticated exploit patterns
- **Root Cause Analysis**: Traces vulnerability origins and impact chains
- **Enhancement with Previous Findings**: Uses static/semantic results to guide AI analysis

### 6. External Tools Analysis Stage
**Integration with specialized security tools:**
- **Rust Clippy**: Advanced linting for Rust-based contracts (Solana)
- **Move Prover**: Formal verification for Move language (Sui, Aptos)
- **Semgrep**: Pattern-based security scanning
- **Language-specific Analyzers**: Blockchain-specific vulnerability detection

### 7. Result Aggregation Stage
**Intelligent result processing:**
- **Finding Deduplication**: Removes duplicate vulnerabilities across analyzers
- **False Positive Filtering**: Uses confidence scoring to filter noise
- **Severity Ranking**: Prioritizes findings by exploitability and impact
- **Gas Optimization Extraction**: Identifies and quantifies performance improvements
- **Comprehensive Report Generation**: Creates detailed audit documentation

## Real Analysis Features

### Security Scoring
- **Dynamic Risk Assessment**: Calculated from actual findings, not hardcoded
- **Exploitability Metrics**: Based on real vulnerability characteristics
- **Confidence Scoring**: Each finding includes confidence levels (0.0-1.0)
- **Impact Analysis**: Quantified based on finding severity and context

### Gas Optimization Analysis
- **Real Gas Calculation**: Extracts actual gas savings from code patterns
- **Category-based Estimation**: Uses finding types to estimate optimization potential
- **Cost-Benefit Analysis**: Calculates implementation effort vs gas savings
- **Pattern Recognition**: Identifies common gas-wasting patterns

### Comprehensive Reporting
- **Executive Summary**: Generated from actual findings distribution
- **Technical Analysis**: Based on real code complexity and patterns
- **Risk Assessment**: Calculated from vulnerability distribution and severity
- **Recommendations**: Context-aware suggestions based on specific findings

## Verification Methods

### Testing Real Analysis
1. **Upload Vulnerable Code**: Test contracts with known vulnerabilities
2. **Compare Results**: Findings should match actual code issues
3. **Confidence Metrics**: Each finding includes confidence scores
4. **Dynamic Scoring**: Security scores vary based on actual findings

### Analysis Quality Indicators
- **Finding Specificity**: Findings reference actual code locations and patterns
- **Context Awareness**: Recommendations are specific to detected issues
- **Severity Distribution**: Realistic distribution based on actual vulnerability types
- **Gas Calculations**: Based on actual code analysis, not random numbers

## Configuration Options

### Analyzer Selection
```javascript
{
  enabledAnalyzers: ['static', 'semantic', 'ai', 'external'],
  aiAnalysisEnabled: true,
  externalToolsEnabled: true,
  confidenceThreshold: 0.6,
  severityThreshold: 'low'
}
```

### Analysis Depth
- **Comprehensive**: All analyzers enabled (default)
- **Fast**: Static and semantic only
- **AI-Enhanced**: Includes AI reasoning for complex patterns
- **Custom**: User-configurable analyzer selection

## Output Formats

### JSON Report
Complete structured data including:
- Finding details with confidence scores
- Real gas optimization calculations
- Dynamic security scoring
- Metadata from actual analysis

### HTML Report
Formatted report with:
- Executive summary from real findings
- Technical analysis based on actual code
- Interactive finding details
- Visual risk distribution

### Markdown/CSV
- Tabular finding data
- Real metric calculations
- Analysis methodology documentation

## API Integration

### Audit Request
```javascript
POST /api/audit
{
  "projectName": "Smart Contract",
  "language": "Solana (Rust)",
  "code": "actual_contract_code",
  "configuration": {
    "enabledAnalyzers": ["static", "semantic", "ai"],
    "confidenceThreshold": 0.7
  }
}
```

### Real-time Analysis
- Progress tracking through analysis stages
- Streaming results as analysis completes
- Error handling for analysis failures

The system provides **production-ready security analysis** with real vulnerability detection, not mock data. Each audit performs actual code examination and returns findings based on the submitted smart contract code.
