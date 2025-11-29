#Processing Engine – Backend Flow (Step by Step)

### 1. API Gateway / Job Intake

* Accepts **API request** with uploaded smart contract code (zip/tarball etc.).
* Generates a unique **jobId**.
* Stores raw source in object storage temporary untill the result has been sent back.
* Publishes message job.preprocess with { jobId, artifactUrl }.

---

### 2. Pre-Processing Service

* Downloads artifact.
* Pre-process as detected language sent from the frontend.
* Sanitizes code (removes unused files, strips secrets).
* Extracts dependencies (Cargo.toml, Move.toml).
* Generates metadata (file list, complexity, hashes).
* Stores cleaned artifact + metadata back to storage.
* Updates DB stage status = `DONE`.
* Publishes message `job.parser` with `{ jobId, metadataUrl, cleanedArtifactUrl }`.

---

### 3. Parser Service

* Loads cleaned artifact.
* Runs language-specific parser inside seperate environment. (Use Algorithm for Production ready responce).
* Generates:

  * **AST (Abstract Syntax Tree)**
  * **Syntax Tree / Tokens**
  * **Control Flow Graph**
  * **Symbol Table**
  * **Cross-reference map**
* Stores JSON outputs in storage.
* Updates DB stage status.
* Publishes `job.staticAnalysis`.

---

### 4. Static Analysis Service

* Loads AST + CFG.
* Runs:

  * Pattern matching rules
  * Vulnerability detection rules
  * Type & memory safety checks
  * Access control checks
* Produces **initial findings list** (with severity + confidence).
* Stores results as `static-findings.json`.
* Publishes `job.semanticAnalysis`.

---

### 5. Semantic Analysis Service

* Loads static findings + AST.
* Performs:

  * Business logic checks
  * Context analysis
  * Inter-procedural analysis (cross-function)
  * Resource & state management validation
  * Concurrency checks
* Produces **refined findings** with exploit traces.
* Stores `semantic-findings.json`.
* Publishes `job.mlAnalysis`.

---

### 6. ML / AI Analysis Service

Note: ML model is currently not present, so use Open Router's "deepseek/deepseek-chat-v3.1" model, with api key.
* Loads features (AST, code tokens, static/semantic results).
* Runs ML models for:

  * Anomaly detection
  * Pattern learning
  * Similarity matching with known vulnerabilities
  * Risk scoring
  * False positive reduction
* Outputs `ml-scores.json` (findingId → scores).
* Publishes `job.externalTools`.

---

### 7. External Tools Integration Service

* Runs external analyzers inside sandbox:

  * Rust Clippy
  * Move Prover
  * Semgrep rules
  * CodeQL queries
  * Dependency scanners
* Normalizes results into the same **finding schema**.
* Produces `external-findings.json`.
* Publishes `job.aggregator`.

---

### 8. Result Aggregator Service

* Collects all findings (static, semantic, ML, external).
* Deduplicates overlapping issues.
* Merges severity/confidence scores.
* Filters false positives.
* Prioritizes results by severity.
* Produces **final audit report**:

  * `final-report.json` (machine readable): which can be well represented later by on the frotend also.
* Stores report in storage + updates DB status = `COMPLETED`.
* Notifies frontend (via WebSocket, webhook, or polling).

