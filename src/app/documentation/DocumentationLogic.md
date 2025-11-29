# GOAL:
We are implementing a documentation generator for Rust and Move source code files inside an existing Next.js project.
The backend should process selected files, detect language, parse an AST, and return structured JSON documentation.

# INPUT:
- The raw source code file (Rust or Move).
- Language is already known from the frontend.
- We have access to AST parsing tools for both Rust and Move.
- We also have API keys for Groq models (for summarization) and Gemini 2.5 (for final cleanup/formatting).

# OUTPUT:
A rich, structured JSON documentation object in the format:

{
  "name": "string",                // Module, contract, or crate name
  "description": "string",         // LLM-generated overview from entire file
  "version": "string|null",         // Optional, extracted from code or Cargo.toml / Move manifest
  "license": "string|null",         // Optional, extracted from comments or manifest
  "functions": [
    {
      "name": "string",
      "visibility": "public|private|internal",
      "description": "string",      // LLM-generated from function body and doc comments
      "parameters": [
        { "name": "string", "type": "string", "description": "string" }
      ],
      "return_type": "string|null",
      "examples": ["string"]         // Optional code snippet usage example
    }
  ],
  "events": [
    {
      "name": "string",
      "fields": [
        { "name": "string", "type": "string" }
      ],
      "description": "string"
    }
  ],
  "variables": [
    {
      "name": "string",
      "type": "string",
      "visibility": "public|private",
      "description": "string"
    }
  ]
}

# BACKEND LOGIC:
1. **Read file** from frontend selection.
2. **Run AST parser**:
   - For Rust: use `syn` crate (or rust-analyzer parser) to extract modules, functions, parameters, return types, events (if applicable), constants, and visibility.
   - For Move: use an existing Move parser (e.g., `move-analyzer`) to extract modules, structs, events, functions, parameters, return types, and constants.
   - Include doc comments (///) and inline comments for context.
3. **Format AST output** into a raw intermediate JSON with:
   - Exact names, visibility, parameter names/types, return types, constants, events.
   - Attach extracted doc comments for each element.
4. **Send raw AST JSON + code excerpts** to a Groq model (e.g., `llama-3.1-70b` or `deepseek-r1-distill-llama-70b`) to:
   - Summarize each function/event/variable in plain English.
   - Fill `"description"` fields based on comments + code logic.
   - Suggest `"examples"` for functions when possible.
5. **Send Groq output to Gemini 2.5** to:
   - Clean formatting.
   - Ensure valid JSON.
   - Enforce exact schema above (no extra keys, no missing required fields).
6. **Return JSON** to the frontend for display.

# REQUIREMENTS:
- All function, event, and variable names/types must come directly from AST — LLM cannot invent them.
- All descriptions should be short, clear, and developer-friendly.
- Output must be valid JSON.
- If any field is unknown, use `null` instead of omitting it.
- Keep `"examples"` array empty if no meaningful example is possible.
- For Move, ensure `address`, `signer`, and capability structs are correctly recognized as types.

# IMPLEMENTATION NOTES:
- Write helper functions:
  - `parse_rust_ast(file_path) -> dict`
  - `parse_move_ast(file_path) -> dict`
  - `summarize_with_groq(ast_json) -> dict`
  - `cleanup_with_gemini(doc_json) -> dict`
- This tool will run locally inside Next.js API routes (not as a separate FastAPI service).
- Handle large files by chunking code before sending to LLM.
- Ensure rate limits are respected for API calls.
