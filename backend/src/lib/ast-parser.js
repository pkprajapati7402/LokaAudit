"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseRustAST = parseRustAST;
exports.parseMoveAST = parseMoveAST;
/**
 * Production-ready Rust AST parser with enhanced analysis
 */
function parseRustAST(sourceCode, fileName) {
    var lines = sourceCode.split('\n');
    var result = {
        name: extractModuleName(fileName, 'rust'),
        module_type: 'rust_crate',
        functions: [],
        events: [],
        variables: [],
        doc_comments: extractModuleDocComments(sourceCode),
        imports: extractImports(sourceCode, 'rust'),
        dependencies: extractDependencies(sourceCode, 'rust'),
        total_lines: lines.length,
        complexity_metrics: {
            cyclomatic_complexity: 0,
            function_count: 0,
            struct_count: 0,
            const_count: 0
        },
        security_insights: [],
        language_features: []
    };
    // Enhanced function parsing with better regex and error handling
    var functionPatterns = [
        // Standard functions
        /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(?:(async|const|unsafe)\s+)*fn\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*->\s*([^{]+?))?\s*(?:where[^{]*?)?\{/gs,
        // Impl block functions
        /impl(?:<[^>]*>)?\s+(?:\w+(?:<[^>]*>)?(?:\s+for\s+\w+(?:<[^>]*>)?)?)\s*\{[^}]*?(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(?:(async|const|unsafe)\s+)*fn\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*->\s*([^{]+?))?\s*(?:where[^{]*?)?\{/gs
    ];
    for (var _i = 0, functionPatterns_1 = functionPatterns; _i < functionPatterns_1.length; _i++) {
        var pattern = functionPatterns_1[_i];
        var match_1 = void 0;
        while ((match_1 = pattern.exec(sourceCode)) !== null) {
            var fullMatch = match_1[0], visibility = match_1[1], modifiers = match_1[2], name_1 = match_1[3], params = match_1[4], returnType = match_1[5];
            var lineNumber = getLineNumber(sourceCode, match_1.index);
            var docComments = extractDocComments(fullMatch);
            var bodyText = extractFunctionBody(sourceCode, match_1.index + fullMatch.length);
            var complexity = calculateComplexity(bodyText);
            result.functions.push({
                name: name_1,
                visibility: determineVisibility(visibility || ''),
                parameters: parseParameters(params, 'rust'),
                return_type: (returnType === null || returnType === void 0 ? void 0 : returnType.trim()) || null,
                doc_comments: docComments,
                body_text: bodyText,
                line_number: lineNumber,
                complexity_score: complexity,
                modifiers: modifiers ? [modifiers] : []
            });
            result.complexity_metrics.cyclomatic_complexity += complexity;
            result.complexity_metrics.function_count++;
        }
    }
    // Enhanced struct parsing
    var structRegex = /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*(?:\{([^}]+)\}|;)/gs;
    var match;
    while ((match = structRegex.exec(sourceCode)) !== null) {
        var fullMatch = match[0], visibility = match[1], name_2 = match[2], fields = match[3];
        var lineNumber = getLineNumber(sourceCode, match.index);
        var docComments = extractDocComments(fullMatch);
        result.events.push({
            name: name_2,
            fields: fields ? parseStructFields(fields) : [],
            doc_comments: docComments,
            line_number: lineNumber
        });
        result.complexity_metrics.struct_count++;
    }
    // Enhanced constants/static parsing
    var constRegex = /(?:\/\/\/.*\n)*\s*(pub(?:\([^)]*\))?\s+)?(const|static)\s+(mut\s+)?(\w+):\s*([^=]+)=([^;]+);/gs;
    while ((match = constRegex.exec(sourceCode)) !== null) {
        var fullMatch = match[0], visibility = match[1], constType = match[2], mutability = match[3], name_3 = match[4], type = match[5], value = match[6];
        var lineNumber = getLineNumber(sourceCode, match.index);
        var docComments = extractDocComments(fullMatch);
        result.variables.push({
            name: name_3,
            type: type.trim(),
            visibility: determineVisibility(visibility || ''),
            doc_comments: docComments,
            line_number: lineNumber,
            is_mutable: !!mutability,
            value: value.trim()
        });
        result.complexity_metrics.const_count++;
    }
    // Extract language features and security insights
    result.language_features = extractRustFeatures(sourceCode);
    result.security_insights = analyzeRustSecurity(sourceCode);
    return result;
}
/**
 * Production-ready Move AST parser with enhanced analysis
 */
function parseMoveAST(sourceCode, fileName) {
    var lines = sourceCode.split('\n');
    var result = {
        name: extractModuleName(fileName, 'move'),
        module_type: 'move_module',
        functions: [],
        events: [],
        variables: [],
        doc_comments: extractModuleDocComments(sourceCode),
        imports: extractImports(sourceCode, 'move'),
        dependencies: extractDependencies(sourceCode, 'move'),
        total_lines: lines.length,
        complexity_metrics: {
            cyclomatic_complexity: 0,
            function_count: 0,
            struct_count: 0,
            const_count: 0
        },
        security_insights: [],
        language_features: []
    };
    // Enhanced Move function parsing
    var functionRegex = /(?:\/\/\/.*\n)*\s*(public(?:\([^)]*\))?\s+)?(entry\s+)?(native\s+)?fun\s+(\w+)(?:<[^>]*>)?\s*\(([^{]*?)\)(?:\s*:\s*([^{]+?))?\s*(?:acquires\s+([^{]+?))?\s*\{/gs;
    var match;
    while ((match = functionRegex.exec(sourceCode)) !== null) {
        var fullMatch = match[0], visibility = match[1], entry = match[2], native = match[3], name_4 = match[4], params = match[5], returnType = match[6], acquires = match[7];
        var lineNumber = getLineNumber(sourceCode, match.index);
        var docComments = extractDocComments(fullMatch);
        var bodyText = extractFunctionBody(sourceCode, match.index + fullMatch.length);
        var complexity = calculateComplexity(bodyText);
        result.functions.push({
            name: name_4,
            visibility: visibility ? 'public' : 'private',
            parameters: parseParameters(params, 'move'),
            return_type: (returnType === null || returnType === void 0 ? void 0 : returnType.trim()) || null,
            doc_comments: docComments,
            body_text: bodyText,
            line_number: lineNumber,
            complexity_score: complexity,
            is_entry_function: !!entry,
            modifiers: [entry, native].filter(Boolean)
        });
        result.complexity_metrics.cyclomatic_complexity += complexity;
        result.complexity_metrics.function_count++;
    }
    // Enhanced Move struct parsing with abilities
    var structRegex = /(?:\/\/\/.*\n)*\s*(public\s+)?struct\s+(\w+)(?:<[^>]*>)?\s*(?:has\s+((?:copy|drop|store|key)(?:\s*,\s*(?:copy|drop|store|key))*))?\s*\{([^}]+)\}/gs;
    while ((match = structRegex.exec(sourceCode)) !== null) {
        var fullMatch = match[0], visibility = match[1], name_5 = match[2], abilities = match[3], fields = match[4];
        var lineNumber = getLineNumber(sourceCode, match.index);
        var docComments = extractDocComments(fullMatch);
        var abilityList = abilities ? abilities.split(',').map(function (a) { return a.trim(); }) : [];
        result.events.push({
            name: name_5,
            fields: parseStructFields(fields),
            doc_comments: docComments,
            line_number: lineNumber,
            has_copy: abilityList.includes('copy'),
            has_drop: abilityList.includes('drop'),
            has_store: abilityList.includes('store'),
            has_key: abilityList.includes('key')
        });
        result.complexity_metrics.struct_count++;
    }
    // Enhanced Move constants parsing
    var constRegex = /(?:\/\/\/.*\n)*\s*(public\s+)?const\s+(\w+):\s*([^=]+)=([^;]+);/gs;
    while ((match = constRegex.exec(sourceCode)) !== null) {
        var fullMatch = match[0], visibility = match[1], name_6 = match[2], type = match[3], value = match[4];
        var lineNumber = getLineNumber(sourceCode, match.index);
        var docComments = extractDocComments(fullMatch);
        result.variables.push({
            name: name_6,
            type: type.trim(),
            visibility: visibility ? 'public' : 'private',
            doc_comments: docComments,
            line_number: lineNumber,
            is_mutable: false,
            value: value.trim()
        });
        result.complexity_metrics.const_count++;
    }
    // Extract language features and security insights
    result.language_features = extractMoveFeatures(sourceCode);
    result.security_insights = analyzeMoveSecuri(sourceCode);
    return result;
}
// Utility Functions for Enhanced Production-Ready Parsing
/**
 * Extract module name from file path
 */
function extractModuleName(fileName, language) {
    var _a;
    var baseName = ((_a = fileName.split('/').pop()) === null || _a === void 0 ? void 0 : _a.split('\\').pop()) || '';
    return baseName.replace(/\.(rs|move)$/, '');
}
/**
 * Extract module-level documentation comments
 */
function extractModuleDocComments(sourceCode) {
    var docComments = [];
    var lines = sourceCode.split('\n');
    for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.startsWith('//!') || line.startsWith('/**') || line.startsWith('/*!')) {
            docComments.push(line.replace(/^\/\/!?\s?|^\/\*\*?\s?|\*\/$/g, ''));
        }
        else if (line && !line.startsWith('//')) {
            break; // Stop at first non-comment, non-empty line
        }
    }
    return docComments;
}
/**
 * Extract imports/use statements
 */
function extractImports(sourceCode, language) {
    var imports = [];
    var patterns = language === 'rust'
        ? [/use\s+([^;]+);/g, /extern\s+crate\s+([^;]+);/g]
        : [/use\s+([^;]+);/g, /friend\s+([^;]+);/g];
    for (var _i = 0, patterns_1 = patterns; _i < patterns_1.length; _i++) {
        var pattern = patterns_1[_i];
        var match = void 0;
        while ((match = pattern.exec(sourceCode)) !== null) {
            imports.push(match[1].trim());
        }
    }
    return imports;
}
/**
 * Extract dependencies from source code
 */
function extractDependencies(sourceCode, language) {
    var deps = [];
    if (language === 'rust') {
        // Extract crate dependencies from extern statements
        var externRegex = /extern\s+crate\s+(\w+)/g;
        var match = void 0;
        while ((match = externRegex.exec(sourceCode)) !== null) {
            deps.push(match[1]);
        }
    }
    else {
        // Extract Move module dependencies
        var moduleRegex = /use\s+0x[a-fA-F0-9]+::(\w+)/g;
        var match = void 0;
        while ((match = moduleRegex.exec(sourceCode)) !== null) {
            deps.push(match[1]);
        }
    }
    return __spreadArray([], new Set(deps), true); // Remove duplicates
}
/**
 * Get line number from character index
 */
function getLineNumber(sourceCode, index) {
    return sourceCode.slice(0, index).split('\n').length;
}
/**
 * Extract documentation comments from a matched string
 */
function extractDocComments(matchedText) {
    var comments = [];
    var lines = matchedText.split('\n');
    for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
        var line = lines_1[_i];
        var trimmed = line.trim();
        if (trimmed.startsWith('///') || trimmed.startsWith('/**')) {
            comments.push(trimmed.replace(/^\/\/\/\s?|^\/\*\*\s?|\*\/$/g, ''));
        }
    }
    return comments;
}
/**
 * Extract function body text
 */
function extractFunctionBody(sourceCode, startIndex) {
    var braceCount = 1;
    var index = startIndex;
    var body = '';
    while (index < sourceCode.length && braceCount > 0) {
        var char = sourceCode[index];
        if (char === '{')
            braceCount++;
        else if (char === '}')
            braceCount--;
        if (braceCount > 0) {
            body += char;
        }
        index++;
    }
    return body.trim();
}
/**
 * Calculate cyclomatic complexity of code
 */
function calculateComplexity(code) {
    var complexity = 1; // Base complexity
    // Keywords that increase complexity (avoiding special regex characters)
    var complexityKeywords = [
        'if', 'else', 'while', 'for', 'loop', 'match', 'case',
        'and', 'or', 'try', 'catch', 'when'
    ];
    // Special patterns that need regex escaping
    var specialPatterns = [
        { pattern: /&&/g, name: 'logical_and' },
        { pattern: /\|\|/g, name: 'logical_or' },
        { pattern: /\?/g, name: 'ternary' }
    ];
    // Count keyword-based complexity
    for (var _i = 0, complexityKeywords_1 = complexityKeywords; _i < complexityKeywords_1.length; _i++) {
        var keyword = complexityKeywords_1[_i];
        var regex = new RegExp("\\b".concat(keyword, "\\b"), 'g');
        var matches = code.match(regex);
        if (matches) {
            complexity += matches.length;
        }
    }
    // Count special pattern complexity
    for (var _a = 0, specialPatterns_1 = specialPatterns; _a < specialPatterns_1.length; _a++) {
        var special = specialPatterns_1[_a];
        var matches = code.match(special.pattern);
        if (matches) {
            complexity += matches.length;
        }
    }
    return complexity;
}
/**
 * Determine visibility from visibility string
 */
function determineVisibility(visibilityStr) {
    if (visibilityStr.includes('pub')) {
        return 'public';
    }
    return 'private';
}
/**
 * Parse function parameters
 */
function parseParameters(params, language) {
    var parameters = [];
    if (!params.trim())
        return parameters;
    var paramList = params.split(',').map(function (p) { return p.trim(); }).filter(function (p) { return p; });
    for (var _i = 0, paramList_1 = paramList; _i < paramList_1.length; _i++) {
        var param = paramList_1[_i];
        if (language === 'rust') {
            // Rust: name: type or &mut name: type
            var match = param.match(/(?:&?(?:mut\s+)?)?(\w+):\s*(.+)/);
            if (match) {
                parameters.push({
                    name: match[1],
                    type: match[2].trim()
                });
            }
        }
        else {
            // Move: name: type
            var match = param.match(/(\w+):\s*(.+)/);
            if (match) {
                parameters.push({
                    name: match[1],
                    type: match[2].trim()
                });
            }
        }
    }
    return parameters;
}
/**
 * Parse struct fields
 */
function parseStructFields(fields) {
    var fieldList = [];
    var fieldLines = fields.split(/[,\n]/).map(function (f) { return f.trim(); }).filter(function (f) { return f; });
    for (var _i = 0, fieldLines_1 = fieldLines; _i < fieldLines_1.length; _i++) {
        var field = fieldLines_1[_i];
        var match = field.match(/(\w+):\s*(.+?)(?:,|$)/);
        if (match) {
            fieldList.push({
                name: match[1],
                type: match[2].trim()
            });
        }
    }
    return fieldList;
}
/**
 * Extract Rust-specific language features
 */
function extractRustFeatures(sourceCode) {
    var features = [];
    // Check for common Rust features
    var featureChecks = [
        { pattern: /async\s+fn/, feature: 'async_functions' },
        { pattern: /unsafe\s+/, feature: 'unsafe_code' },
        { pattern: /#\[derive\(/, feature: 'derive_macros' },
        { pattern: /impl\s+.*\s+for\s+/, feature: 'trait_implementations' },
        { pattern: /macro_rules!/, feature: 'declarative_macros' },
        { pattern: /\?\s*;/, feature: 'error_propagation' },
        { pattern: /Box</, feature: 'heap_allocation' },
        { pattern: /Rc<|Arc</, feature: 'reference_counting' },
        { pattern: /lifetime/, feature: 'explicit_lifetimes' }
    ];
    for (var _i = 0, featureChecks_1 = featureChecks; _i < featureChecks_1.length; _i++) {
        var check = featureChecks_1[_i];
        if (check.pattern.test(sourceCode)) {
            features.push(check.feature);
        }
    }
    return features;
}
/**
 * Analyze Rust security patterns
 */
function analyzeRustSecurity(sourceCode) {
    var insights = [];
    // Security pattern checks
    if (/unsafe\s+/.test(sourceCode)) {
        insights.push('Contains unsafe code blocks - requires careful review');
    }
    if (/unwrap\(\)/.test(sourceCode)) {
        insights.push('Uses unwrap() which can panic - consider error handling');
    }
    if (/expect\(/.test(sourceCode)) {
        insights.push('Uses expect() which can panic - verify error messages');
    }
    if (/transmute|from_raw/.test(sourceCode)) {
        insights.push('Uses memory transmutation - high risk operation');
    }
    if (/ptr::|raw::/.test(sourceCode)) {
        insights.push('Direct pointer manipulation detected');
    }
    return insights;
}
/**
 * Extract Move-specific language features
 */
function extractMoveFeatures(sourceCode) {
    var features = [];
    var featureChecks = [
        { pattern: /entry\s+fun/, feature: 'entry_functions' },
        { pattern: /native\s+fun/, feature: 'native_functions' },
        { pattern: /has\s+(?:copy|drop|store|key)/, feature: 'struct_abilities' },
        { pattern: /acquires\s+/, feature: 'resource_acquisition' },
        { pattern: /move_to</, feature: 'resource_operations' },
        { pattern: /borrow_global/, feature: 'global_storage_access' },
        { pattern: /assert!\(/, feature: 'assertions' },
        { pattern: /vector::|Vector::/, feature: 'vector_operations' },
        { pattern: /signer::/, feature: 'signer_operations' }
    ];
    for (var _i = 0, featureChecks_2 = featureChecks; _i < featureChecks_2.length; _i++) {
        var check = featureChecks_2[_i];
        if (check.pattern.test(sourceCode)) {
            features.push(check.feature);
        }
    }
    return features;
}
/**
 * Analyze Move security patterns
 */
function analyzeMoveSecuri(sourceCode) {
    var insights = [];
    // Move-specific security checks
    if (/entry\s+fun/.test(sourceCode) && !/public\s+entry/.test(sourceCode)) {
        insights.push('Entry function without public visibility - verify access control');
    }
    if (/move_to<.*>\(/.test(sourceCode)) {
        insights.push('Resource publishing detected - ensure proper authorization');
    }
    if (/borrow_global_mut</.test(sourceCode)) {
        insights.push('Mutable global resource access - review for race conditions');
    }
    if (/assert!\(/.test(sourceCode)) {
        insights.push('Assertions present - verify all edge cases are handled');
    }
    if (/abort\s+/.test(sourceCode)) {
        insights.push('Explicit abort statements - ensure proper error codes');
    }
    if (!/@pre|@post|@aborts_if/.test(sourceCode) && /public\s+/.test(sourceCode)) {
        insights.push('Public functions without formal verification specs');
    }
    return insights;
}
