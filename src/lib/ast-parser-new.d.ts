export interface ParsedFunction {
    name: string;
    visibility: 'public' | 'private';
    parameters: Array<{
        name: string;
        type: string;
        description?: string;
    }>;
    return_type: string | null;
    doc_comments: string[];
    body_text: string;
    line_number: number;
    complexity_score: number;
    is_entry_function?: boolean;
    modifiers: string[];
}
export interface ParsedEvent {
    name: string;
    fields: Array<{
        name: string;
        type: string;
    }>;
    doc_comments: string[];
    line_number: number;
    has_drop?: boolean;
    has_store?: boolean;
    has_copy?: boolean;
    has_key?: boolean;
}
export interface ParsedVariable {
    name: string;
    type: string;
    visibility: 'public' | 'private';
    doc_comments: string[];
    line_number: number;
    is_mutable: boolean;
    value?: string;
}
export interface ParsedAST {
    name: string;
    module_type: 'rust_crate' | 'move_module';
    functions: ParsedFunction[];
    events: ParsedEvent[];
    variables: ParsedVariable[];
    doc_comments: string[];
    imports: string[];
    dependencies: string[];
    total_lines: number;
    complexity_metrics: {
        cyclomatic_complexity: number;
        function_count: number;
        struct_count: number;
        const_count: number;
    };
    security_insights: string[];
    language_features: string[];
}
/**
 * Production-ready Rust AST parser with enhanced analysis
 */
export declare function parseRustAST(sourceCode: string, fileName: string): ParsedAST;
/**
 * Production-ready Move AST parser with enhanced analysis
 */
export declare function parseMoveAST(sourceCode: string, fileName: string): ParsedAST;
export declare function parseTypeScriptAST(sourceCode: string, fileName: string): Promise<ParsedAST>;
//# sourceMappingURL=ast-parser-new.d.ts.map