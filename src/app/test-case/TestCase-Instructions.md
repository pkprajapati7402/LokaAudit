
# GitHub Copilot Implementation Prompt: Smart Contract Testing Backend

## Feature Overview

Implement a **Test Case Generation and Execution System** for smart contracts written in **Rust** and **Move**, using **Next.js (App Router)** and **MongoDB**.

## Core Requirements

### Functionality

1. **Test Case Generation**: AI-powered test generation
2. **Test Execution**: Run tests in isolated virtual environment (no Docker)
3. **Result Processing**: Parse, analyze, and store results
4. **Export/Download**: Provide JSON reports

### Test Types

* **Functional Tests** (Critical)
* **Security Tests** (Critical)
* **Integration Tests** (Medium)
* **Performance Tests** (Low)

---

## Database (MongoDB/Mongoose)

Collections:

* `contracts` – uploaded contracts & metadata
* `test_sessions` – track sessions
* `test_cases` – generated test cases
* `test_results` – execution results & metrics
* `audit_logs` – operations log

Schema guidelines:

* Indexes for performance
* Validation rules & required fields
* GridFS for file storage if needed
* Timestamps & user tracking

---

## API Routes (`/app/api/tests/`) (May change as per need)

```
/generate/route.ts          # POST - Generate test cases
/execute/[sessionId]/route.ts   # POST - Execute tests
/results/[sessionId]/route.ts   # GET - Get test results
/download/[sessionId]/route.ts  # GET - Download test cases
/export/[sessionId]/route.ts    # GET - Export results
/sessions/route.ts              # GET - List sessions
```

Requirements:

* Proper error handling & status codes
* Auth middleware
* Request validation (Zod)
* Rate limiting for AI calls
* Streaming responses for long ops

---

## AI Test Generation

* **TestCaseGenerator Class**

  * Integrate Gemini 2.0 Flash + DeepSeek 70B
  * Fallback logic between providers
  * Parse contract code → functions, states, events
  * Generate contextual tests

* **Language-Specific Generators**

  * Rust → Cargo-compatible tests
  * Move → Move-compatible tests

* **Test Type Generators**

  * Functional, Security, Integration, Performance

---

## Virtual Execution Environment

* Execute tests via Node.js child processes
* No Docker
* Resource limits (CPU, memory, timeout)
* Support Rust (Cargo) + Move CLI
* Capture stdout, stderr, metrics
* Sandbox FS, block network, cleanup after run

---

## Result Processing

* **TestResultProcessor**: parse raw outputs, calculate metrics, vulnerability reports, AI-based recommendations
* **ReportGenerator**: generate JSON/PDF reports with charts, summaries

---

## Background Jobs

* Async operations via API routes
* Job queue (Redis optional) or in-memory
* WebSocket/SSE for progress updates
* Retry & status tracking

---

## File Management

* Upload, validate, sanitize contract files
* Support `.rs` & `.move`
* Manage temp files during execution
* Auto-cleanup

---

## Technical Guidelines

* TypeScript strict mode
* Error handling (try/catch, typed errors)
* Structured logging (Winston)
* Unit tests for core classes
* JSDoc documentation
* Input validation & sanitization
* Rate limiting & resource management
* Secure execution environment

---

## Environment Variables

```
MONGODB_URI=
GEMINI_API_KEY=
GROQ_API_KEY=

```

---

## Folder Structure

whatever fits good as per the requirements. 
sample structure(Optional to use).
```
/app/api/tests/
/lib/
  ├── ai/
  │   ├── gemini-client.ts
  │   ├── deepseek-client.ts
  │   └── test-generators/
  ├── execution/
  │   ├── virtual-environment.ts
  │   ├── rust-runner.ts
  │   └── move-runner.ts
  ├── database/
  │   ├── models/
  │   └── connections/
  ├── utils/
  │   ├── file-manager.ts
  │   ├── result-processor.ts
  │   └── security.ts
  └── types/
      └── test-types.ts
```

---

## Success Criteria

1. Scalable (100+ sessions)
2. Reliable (99.9% uptime, error recovery)
3. Secure (no code injection/resource abuse)
4. Usable (clear errors, progress updates)
5. Auditable (logs & compliance tracking)

---

## Priority Order

1. Database schemas & models
2. API routes with auth
3. AI integration for test generation
4. Virtual execution environment (Depending upon Programming Language selected)
5. Result processing & storage
6. Export/download
7. Background jobs
8. Rust & Move support
9. Security hardening
10. Performance optimizations

---

👉 Please implement this system with **production-grade TypeScript code, strong error handling, and clear documentation**.
