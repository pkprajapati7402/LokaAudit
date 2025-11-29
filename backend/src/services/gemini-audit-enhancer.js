"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
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
exports.GeminiAuditEnhancer = void 0;
var generative_ai_1 = require("@google/generative-ai");
var logger_1 = require("../utils/logger");
var ast_parser_1 = require("../lib/ast-parser");
var GeminiAuditEnhancer = /** @class */ (function () {
    function GeminiAuditEnhancer() {
        this.hasApiKey = !!process.env.GEMINI_API_KEY;
        if (this.hasApiKey) {
            this.genAI = new generative_ai_1.GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            this.model = this.genAI.getGenerativeModel({
                model: 'gemini-1.5-pro',
                generationConfig: {
                    temperature: 0.1,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                },
            });
            logger_1.logger.info('🤖 Gemini Audit Enhancement Service initialized with AI');
        }
        else {
            this.genAI = null;
            this.model = null;
            logger_1.logger.warn('⚠️ GEMINI_API_KEY not found - running in fallback mode with AST-enhanced recommendations');
        }
    }
    /**
     * Create fallback enhanced finding when AI is not available
     */
    GeminiAuditEnhancer.prototype.createFallbackEnhancedFinding = function (finding) {
        return __assign(__assign({}, finding), { businessContext: "".concat(finding.severity, " severity issue affecting ").concat(finding.category.replace('_', ' '), " security"), attackScenarios: ["Exploitation via ".concat(finding.category, " vulnerability")], mitigationPriority: this.calculateMitigationPriority(finding.severity), implementationComplexity: this.assessImplementationComplexity(finding.category), remediationGuidance: {
                implementationSteps: [
                    'Analyze the vulnerability root cause',
                    'Design appropriate security controls',
                    'Implement and test the security fix',
                    'Conduct security review and validation'
                ],
                testingStrategy: ['Unit tests', 'Integration tests', 'Security validation'],
                monitoringRecommendations: ["Monitor ".concat(finding.category, " patterns")]
            } });
    };
    /**
     * Assess implementation complexity based on vulnerability category
     */
    GeminiAuditEnhancer.prototype.assessImplementationComplexity = function (category) {
        switch (category.toLowerCase()) {
            case 'access_control':
                return 'simple';
            case 'arithmetic':
                return 'simple';
            case 'state_management':
                return 'moderate';
            case 'logic':
                return 'complex';
            default:
                return 'moderate';
        }
    };
    /**
     * Main enhancement function - transforms basic audit report into production-grade analysis
     */
    GeminiAuditEnhancer.prototype.enhanceAuditReport = function (baseReport, sourceCode, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var startTime, enhancedFindings, intelligentAnalysis, securityScoring, prioritizedRecommendations, enhancedReport, _a, _b, processingTime, error_1;
            var _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _d.trys.push([0, 8, , 9]);
                        logger_1.logger.info("\uD83D\uDE80 Starting Gemini enhancement for ".concat(networkType, " audit report"));
                        startTime = Date.now();
                        return [4 /*yield*/, this.enhanceFindings(this.convertStandardFindingsToFindings(baseReport.findings || []), sourceCode, networkType)];
                    case 1:
                        enhancedFindings = _d.sent();
                        return [4 /*yield*/, this.generateIntelligentAnalysis(enhancedFindings, baseReport, networkType)];
                    case 2:
                        intelligentAnalysis = _d.sent();
                        return [4 /*yield*/, this.generateSecurityScoring(enhancedFindings, networkType)];
                    case 3:
                        securityScoring = _d.sent();
                        return [4 /*yield*/, this.generatePrioritizedRecommendations(enhancedFindings, networkType, sourceCode)];
                    case 4:
                        prioritizedRecommendations = _d.sent();
                        _a = this.compileEnhancedReport;
                        _b = [baseReport];
                        _c = {
                            enhancedFindings: enhancedFindings,
                            intelligentSummary: intelligentAnalysis,
                            securityScoring: securityScoring,
                            prioritizedRecommendations: prioritizedRecommendations
                        };
                        return [4 /*yield*/, this.generateComplianceAnalysis(enhancedFindings, networkType)];
                    case 5:
                        _c.complianceAnalysis = _d.sent();
                        return [4 /*yield*/, this.generateThreatModel(enhancedFindings, networkType)];
                    case 6: return [4 /*yield*/, _a.apply(this, _b.concat([(_c.threatModel = _d.sent(),
                                _c)]))];
                    case 7:
                        enhancedReport = _d.sent();
                        processingTime = (Date.now() - startTime) / 1000;
                        logger_1.logger.info("\u2705 Gemini audit enhancement completed in ".concat(processingTime, "s"));
                        return [2 /*return*/, enhancedReport];
                    case 8:
                        error_1 = _d.sent();
                        logger_1.logger.error('❌ Gemini audit enhancement failed:', error_1);
                        // Return original report with basic enhancements if AI fails
                        return [2 /*return*/, this.addBasicEnhancements(baseReport)];
                    case 9: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Enhance individual findings with AI analysis
     */
    GeminiAuditEnhancer.prototype.enhanceFindings = function (findings, sourceCode, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var enhancedFindings, batchSize, i, batch, batchResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (findings.length === 0)
                            return [2 /*return*/, []];
                        enhancedFindings = [];
                        batchSize = 5;
                        i = 0;
                        _a.label = 1;
                    case 1:
                        if (!(i < findings.length)) return [3 /*break*/, 5];
                        batch = findings.slice(i, i + batchSize);
                        return [4 /*yield*/, this.processFindingsBatch(batch, sourceCode, networkType)];
                    case 2:
                        batchResults = _a.sent();
                        enhancedFindings.push.apply(enhancedFindings, batchResults);
                        if (!(i + batchSize < findings.length)) return [3 /*break*/, 4];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, 1000); })];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        i += batchSize;
                        return [3 /*break*/, 1];
                    case 5: return [2 /*return*/, enhancedFindings];
                }
            });
        });
    };
    /**
     * Process a batch of findings through Gemini AI
     */
    GeminiAuditEnhancer.prototype.processFindingsBatch = function (findingsBatch, sourceCode, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var prompt, result, response, analysis_1, error_2;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        prompt = this.buildFindingsEnhancementPrompt(findingsBatch, sourceCode, networkType);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        if (!this.hasApiKey || !this.model) {
                            // No API key, return fallback enhanced findings
                            return [2 /*return*/, findingsBatch.map(function (f) { return _this.createFallbackEnhancedFinding(f); })];
                        }
                        return [4 /*yield*/, this.model.generateContent(prompt)];
                    case 2:
                        result = _a.sent();
                        response = result.response.text();
                        analysis_1 = this.parseAIResponse(response);
                        return [2 /*return*/, findingsBatch.map(function (finding, index) {
                                var _a, _b, _c, _d, _e, _f, _g, _h;
                                return (__assign(__assign({}, finding), { businessContext: ((_b = (_a = analysis_1.findings) === null || _a === void 0 ? void 0 : _a[index]) === null || _b === void 0 ? void 0 : _b.businessContext) || 'Business impact assessment pending', attackScenarios: ((_d = (_c = analysis_1.findings) === null || _c === void 0 ? void 0 : _c[index]) === null || _d === void 0 ? void 0 : _d.attackScenarios) || [], mitigationPriority: _this.calculateMitigationPriority(finding.severity), implementationComplexity: ((_f = (_e = analysis_1.findings) === null || _e === void 0 ? void 0 : _e[index]) === null || _f === void 0 ? void 0 : _f.implementationComplexity) || 'moderate', estimatedEffort: ((_h = (_g = analysis_1.findings) === null || _g === void 0 ? void 0 : _g[index]) === null || _h === void 0 ? void 0 : _h.estimatedEffort) || _this.estimateEffortFromSeverity(finding.severity), relatedFindings: _this.findRelatedFindings(finding, findingsBatch) }));
                            })];
                    case 3:
                        error_2 = _a.sent();
                        logger_1.logger.warn('Failed to enhance finding batch with Gemini, using fallback:', error_2);
                        // Fallback enhancement
                        return [2 /*return*/, findingsBatch.map(function (finding) { return (__assign(__assign({}, finding), { businessContext: "".concat(finding.severity, " severity issue affecting ").concat(networkType, " security"), attackScenarios: ["Exploitation via ".concat(finding.category, " vulnerability")], mitigationPriority: _this.calculateMitigationPriority(finding.severity), implementationComplexity: 'moderate', estimatedEffort: _this.estimateEffortFromSeverity(finding.severity), relatedFindings: [] })); })];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate intelligent analysis and summaries
     */
    GeminiAuditEnhancer.prototype.generateIntelligentAnalysis = function (findings, baseReport, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var analysisPrompt, result, response, analysis, error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        analysisPrompt = this.buildIntelligentAnalysisPrompt(findings, baseReport, networkType);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        if (!this.hasApiKey || !this.model) {
                            // No API key, return fallback analysis
                            return [2 /*return*/, {
                                    executiveSummary: this.generateFallbackExecutiveSummary(findings, networkType),
                                    technicalSummary: this.generateFallbackTechnicalSummary(findings),
                                    detailedAnalysis: this.generateFallbackDetailedAnalysis(findings),
                                    prioritizedRecommendations: []
                                }];
                        }
                        return [4 /*yield*/, this.model.generateContent(analysisPrompt)];
                    case 2:
                        result = _a.sent();
                        response = result.response.text();
                        analysis = this.parseAIResponse(response);
                        return [2 /*return*/, {
                                executiveSummary: analysis.executiveSummary || this.generateFallbackExecutiveSummary(findings, networkType),
                                technicalSummary: analysis.technicalSummary || this.generateFallbackTechnicalSummary(findings),
                                detailedAnalysis: analysis.detailedAnalysis || this.generateFallbackDetailedAnalysis(findings),
                                businessImpactAssessment: analysis.businessImpactAssessment || 'Business impact analysis pending',
                                deploymentRecommendation: analysis.deploymentRecommendation || this.generateDeploymentRecommendation(findings)
                            }];
                    case 3:
                        error_3 = _a.sent();
                        logger_1.logger.warn('Failed to generate intelligent analysis, using fallback:', error_3);
                        return [2 /*return*/, {
                                executiveSummary: this.generateFallbackExecutiveSummary(findings, networkType),
                                technicalSummary: this.generateFallbackTechnicalSummary(findings),
                                detailedAnalysis: this.generateFallbackDetailedAnalysis(findings),
                                businessImpactAssessment: 'Comprehensive business impact assessment requires manual review',
                                deploymentRecommendation: this.generateDeploymentRecommendation(findings)
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate advanced security scoring with explanations
     */
    GeminiAuditEnhancer.prototype.generateSecurityScoring = function (findings, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var scoringPrompt, result, response, scoring, baseScore, error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        scoringPrompt = this.buildSecurityScoringPrompt(findings, networkType);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        if (!this.hasApiKey || !this.model) {
                            // No API key, return fallback security scoring
                            return [2 /*return*/, {
                                    overallScore: this.calculateBaseSecurityScore(findings),
                                    riskLevel: 'Medium',
                                    securityBreakdown: {
                                        critical: findings.filter(function (f) { return f.severity === 'critical'; }).length,
                                        high: findings.filter(function (f) { return f.severity === 'high'; }).length,
                                        medium: findings.filter(function (f) { return f.severity === 'medium'; }).length,
                                        low: findings.filter(function (f) { return f.severity === 'low'; }).length
                                    },
                                    complianceAnalysis: []
                                }];
                        }
                        return [4 /*yield*/, this.model.generateContent(scoringPrompt)];
                    case 2:
                        result = _a.sent();
                        response = result.response.text();
                        scoring = this.parseAIResponse(response);
                        baseScore = this.calculateBaseSecurityScore(findings);
                        return [2 /*return*/, {
                                overallScore: scoring.overallScore || baseScore,
                                categoryScores: scoring.categoryScores || this.generateCategoryScores(findings),
                                scoringRationale: scoring.scoringRationale || 'Security scoring based on vulnerability severity and frequency',
                                confidenceLevel: scoring.confidenceLevel || 0.8
                            }];
                    case 3:
                        error_4 = _a.sent();
                        logger_1.logger.warn('Failed to generate AI security scoring, using fallback:', error_4);
                        return [2 /*return*/, {
                                overallScore: this.calculateBaseSecurityScore(findings),
                                categoryScores: this.generateCategoryScores(findings),
                                scoringRationale: 'Security scoring based on standard vulnerability assessment methodology',
                                confidenceLevel: 0.7
                            }];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate prioritized recommendations
     */
    GeminiAuditEnhancer.prototype.generatePrioritizedRecommendations = function (findings, networkType, sourceCode) {
        return __awaiter(this, void 0, void 0, function () {
            var parsedAST, recommendationsPrompt, result, response, recommendations, error_5;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parsedAST = null;
                        if (sourceCode) {
                            try {
                                if (networkType.toLowerCase() === 'solana' || sourceCode.includes('pub fn') || sourceCode.includes('impl ')) {
                                    parsedAST = (0, ast_parser_1.parseRustAST)(sourceCode, 'contract.rs');
                                }
                                else if (networkType.toLowerCase() === 'move' || sourceCode.includes('fun ') || sourceCode.includes('module ')) {
                                    parsedAST = (0, ast_parser_1.parseMoveAST)(sourceCode, 'contract.move');
                                }
                            }
                            catch (error) {
                                logger_1.logger.warn('Failed to parse AST, continuing without AST analysis:', error);
                            }
                        }
                        recommendationsPrompt = this.buildASTEnhancedRecommendationsPrompt(findings, networkType, parsedAST);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 5, , 6]);
                        if (!(this.hasApiKey && this.model)) return [3 /*break*/, 3];
                        return [4 /*yield*/, this.model.generateContent(recommendationsPrompt)];
                    case 2:
                        result = _a.sent();
                        response = result.response.text();
                        recommendations = this.parseAIResponse(response);
                        return [2 /*return*/, {
                                immediate: recommendations.immediate || this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
                                shortTerm: recommendations.shortTerm || this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
                                longTerm: recommendations.longTerm || this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
                                architectural: recommendations.architectural || this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
                            }];
                    case 3:
                        // No API key, use AST-enhanced fallback
                        logger_1.logger.info('🔧 Using AST-enhanced fallback recommendations');
                        return [2 /*return*/, {
                                immediate: this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
                                shortTerm: this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
                                longTerm: this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
                                architectural: this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
                            }];
                    case 4: return [3 /*break*/, 6];
                    case 5:
                        error_5 = _a.sent();
                        logger_1.logger.warn('Failed to generate AI recommendations, using AST-enhanced fallback:', error_5);
                        return [2 /*return*/, {
                                immediate: this.getCodeSpecificImmediateRecommendations(findings, parsedAST),
                                shortTerm: this.getCodeSpecificShortTermRecommendations(findings, parsedAST),
                                longTerm: this.getCodeSpecificLongTermRecommendations(findings, networkType, parsedAST),
                                architectural: this.getCodeSpecificArchitecturalRecommendations(findings, networkType, parsedAST)
                            }];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate compliance analysis
     */
    GeminiAuditEnhancer.prototype.generateComplianceAnalysis = function (findings, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            var critical, high;
            return __generator(this, function (_a) {
                critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
                high = findings.filter(function (f) { return f.severity === 'high'; }).length;
                return [2 /*return*/, {
                        standards: this.getApplicableStandards(networkType),
                        gaps: this.identifyComplianceGaps(findings),
                        recommendations: this.getComplianceRecommendations(critical, high, networkType)
                    }];
            });
        });
    };
    /**
     * Generate threat model
     */
    GeminiAuditEnhancer.prototype.generateThreatModel = function (findings, networkType) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, {
                        primaryThreats: this.identifyPrimaryThreats(findings, networkType),
                        attackVectors: this.identifyAttackVectors(findings),
                        riskMitigation: this.generateRiskMitigation(findings)
                    }];
            });
        });
    };
    /**
     * Compile the final enhanced report
     */
    GeminiAuditEnhancer.prototype.compileEnhancedReport = function (baseReport, analysis) {
        return __awaiter(this, void 0, void 0, function () {
            var critical, high, medium, low;
            var _this = this;
            var _a;
            return __generator(this, function (_b) {
                critical = analysis.enhancedFindings.filter(function (f) { return f.severity === 'critical'; }).length;
                high = analysis.enhancedFindings.filter(function (f) { return f.severity === 'high'; }).length;
                medium = analysis.enhancedFindings.filter(function (f) { return f.severity === 'medium'; }).length;
                low = analysis.enhancedFindings.filter(function (f) { return f.severity === 'low'; }).length;
                return [2 /*return*/, __assign(__assign({}, baseReport), { summary: __assign(__assign({}, baseReport.summary), { total_issues: analysis.enhancedFindings.length, critical: critical, high: high, medium: medium, low: low, security_score: analysis.securityScoring.overallScore, overall_risk_level: this.calculateRiskLevel(critical, high, medium), recommendation: analysis.intelligentSummary.deploymentRecommendation, 
                            // Enhanced sections powered by Gemini AI
                            executive_summary: {
                                overallRecommendation: analysis.intelligentSummary.deploymentRecommendation,
                                risk_assessment: {
                                    overall_risk_level: this.calculateRiskLevel(critical, high, medium),
                                    risk_factors: this.identifyRiskFactors(critical, high, medium, low),
                                    business_impact: analysis.intelligentSummary.businessImpactAssessment,
                                    deployment_readiness: analysis.intelligentSummary.deploymentRecommendation
                                },
                                key_findings: {
                                    total_vulnerabilities: analysis.enhancedFindings.length,
                                    critical_vulnerabilities: critical,
                                    high_risk_vulnerabilities: high,
                                    medium_risk_vulnerabilities: medium,
                                    low_risk_vulnerabilities: low,
                                    informational_findings: 0,
                                    security_score: analysis.securityScoring.overallScore,
                                    score_interpretation: this.interpretSecurityScore(analysis.securityScoring.overallScore),
                                    confidence_level: analysis.securityScoring.confidenceLevel
                                },
                                immediate_actions: analysis.prioritizedRecommendations.immediate
                            }, technical_summary: {
                                vulnerability_distribution: {
                                    by_category: this.analyzeVulnerabilityDistribution(analysis.enhancedFindings),
                                    by_severity: { critical: critical, high: high, medium: medium, low: low, informational: 0 }
                                },
                                top_vulnerability_categories: this.getTopVulnerabilityCategories(analysis.enhancedFindings),
                                code_quality_metrics: {
                                    average_confidence: this.calculateAverageConfidence(analysis.enhancedFindings),
                                    exploitability_assessment: this.assessExploitability(analysis.enhancedFindings),
                                    false_positive_likelihood: analysis.securityScoring.confidenceLevel > 0.8 ? 'Very Low' : 'Low',
                                    ai_enhancement_applied: true,
                                    gemini_analysis_version: '1.5-pro'
                                }
                            }, detailed_analysis: __assign(__assign({}, analysis.intelligentSummary.detailedAnalysis), { threat_model: analysis.threatModel, compliance_analysis: analysis.complianceAnalysis, ai_insights: {
                                    enhanced_findings_count: analysis.enhancedFindings.length,
                                    business_context_provided: analysis.enhancedFindings.filter(function (f) { return f.businessContext; }).length,
                                    attack_scenarios_identified: analysis.enhancedFindings.reduce(function (sum, f) { var _a; return sum + (((_a = f.attackScenarios) === null || _a === void 0 ? void 0 : _a.length) || 0); }, 0),
                                    implementation_guidance_provided: true
                                } }) }), findings: analysis.enhancedFindings.map(function (finding, index) {
                            var _a, _b, _c, _d, _e;
                            return ({
                                id: finding.id || "FND-".concat(String(index + 1).padStart(3, '0')),
                                title: finding.title,
                                severity: finding.severity.charAt(0).toUpperCase() + finding.severity.slice(1),
                                description: finding.description,
                                impact: finding.businessContext || ((_a = finding.impact) === null || _a === void 0 ? void 0 : _a.description) || 'Impact assessment pending',
                                affected_files: finding.location ? [finding.location.file] : [],
                                line_numbers: finding.location ? [finding.location.startLine] : [],
                                code_snippet: ((_b = finding.location) === null || _b === void 0 ? void 0 : _b.snippet) || finding.code || 'Code snippet not available',
                                recommendation: finding.recommendation,
                                references: finding.references || [],
                                status: 'Unresolved',
                                confidence: finding.confidence || 0.8,
                                cwe: finding.cwe,
                                exploitability: finding.exploitability || 0.5,
                                category: finding.category,
                                // Enhanced fields from Gemini AI
                                business_context: finding.businessContext,
                                attack_scenarios: finding.attackScenarios || [],
                                mitigation_priority: finding.mitigationPriority || 'medium',
                                implementation_complexity: finding.implementationComplexity || 'moderate',
                                estimated_effort: finding.estimatedEffort,
                                related_findings: finding.relatedFindings || [],
                                technical_details: {
                                    vulnerability_class: _this.classifyVulnerability(finding),
                                    attack_vector: _this.identifyAttackVector(finding),
                                    prerequisites: _this.identifyPrerequisites(finding),
                                    detection_method: finding.source,
                                    confidence_level: _this.interpretConfidence(finding.confidence || 0.8),
                                    ai_analysis: 'Enhanced with Gemini AI'
                                },
                                business_impact: {
                                    financial_impact: ((_c = finding.impact) === null || _c === void 0 ? void 0 : _c.financial) || 'medium',
                                    operational_impact: ((_d = finding.impact) === null || _d === void 0 ? void 0 : _d.operational) || 'medium',
                                    reputational_impact: ((_e = finding.impact) === null || _e === void 0 ? void 0 : _e.reputational) || 'medium',
                                    compliance_impact: _this.assessComplianceImpact(finding),
                                    user_impact: _this.assessUserImpact(finding)
                                },
                                remediation_guidance: {
                                    estimated_effort: finding.estimatedEffort,
                                    complexity: finding.implementationComplexity,
                                    required_expertise: _this.identifyRequiredExpertise(finding),
                                    testing_requirements: _this.identifyTestingRequirements(finding),
                                    implementation_steps: _this.generateImplementationSteps(finding)
                                }
                            });
                        }), recommendations: {
                            immediate_actions: analysis.prioritizedRecommendations.immediate,
                            high_priority_fixes: analysis.prioritizedRecommendations.shortTerm,
                            security_best_practices: this.getSecurityBestPractices(((_a = baseReport.report_metadata) === null || _a === void 0 ? void 0 : _a.platform) || 'blockchain'),
                            testing_and_validation: this.getTestingRecommendations(),
                            architectural_improvements: analysis.prioritizedRecommendations.architectural,
                            long_term_strategies: analysis.prioritizedRecommendations.longTerm,
                            future_improvements: analysis.prioritizedRecommendations.longTerm, // Map long term to future improvements
                            // AI-enhanced sections
                            gemini_insights: {
                                threat_model_recommendations: analysis.threatModel.riskMitigation,
                                compliance_recommendations: analysis.complianceAnalysis.recommendations,
                                business_process_improvements: this.getBusinessProcessRecommendations(analysis.enhancedFindings),
                                continuous_monitoring: this.getContinuousMonitoringRecommendations()
                            }
                        }, 
                        // Enhanced appendix with AI analysis details
                        appendix: __assign(__assign({}, baseReport.appendix), { ai_enhancement_details: {
                                gemini_model_used: 'gemini-1.5-pro',
                                analysis_timestamp: new Date().toISOString(),
                                findings_enhanced: analysis.enhancedFindings.length,
                                confidence_score: analysis.securityScoring.confidenceLevel,
                                analysis_capabilities: [
                                    'Business Context Analysis',
                                    'Attack Scenario Modeling',
                                    'Implementation Complexity Assessment',
                                    'Prioritized Remediation Planning',
                                    'Threat Model Generation',
                                    'Compliance Gap Analysis'
                                ]
                            }, security_scoring_methodology: {
                                base_scoring: 'CVSS 3.1 Compatible',
                                ai_enhancements: 'Gemini-powered contextual analysis',
                                confidence_factors: [
                                    'Code pattern recognition',
                                    'Business logic analysis',
                                    'Threat landscape assessment',
                                    'Industry best practices alignment'
                                ]
                            } }) })];
            });
        });
    };
    // ===========================================
    // PROMPT BUILDING METHODS
    // ===========================================
    GeminiAuditEnhancer.prototype.buildFindingsEnhancementPrompt = function (findings, sourceCode, networkType) {
        return "You are a senior blockchain security auditor specializing in ".concat(networkType, " smart contracts. Analyze these security findings and enhance them with production-grade insights.\n\nNETWORK: ").concat(networkType, "\nFINDINGS COUNT: ").concat(findings.length, "\n\nFINDINGS TO ANALYZE:\n").concat(findings.map(function (finding, i) {
            var _a, _b;
            return "\n".concat(i + 1, ". ").concat(finding.title, "\n   Severity: ").concat(finding.severity, "\n   Category: ").concat(finding.category, "\n   Description: ").concat(finding.description, "\n   Location: ").concat((_a = finding.location) === null || _a === void 0 ? void 0 : _a.file, ":").concat((_b = finding.location) === null || _b === void 0 ? void 0 : _b.startLine, "\n   Current Recommendation: ").concat(finding.recommendation, "\n   CWE: ").concat(finding.cwe || 'Not specified', "\n");
        }).join('\n'), "\n\nSOURCE CODE CONTEXT:\n```\n").concat(sourceCode.length > 8000 ? sourceCode.substring(0, 8000) + '\n... (truncated)' : sourceCode, "\n```\n\nFor each finding, provide:\n1. Business context and real-world impact\n2. Detailed attack scenarios and exploitation methods\n3. Implementation complexity assessment (simple/moderate/complex/architectural)\n4. Precise effort estimation with timeframes\n5. Related vulnerabilities and systemic issues\n\nRespond in JSON format:\n{\n  \"findings\": [\n    {\n      \"businessContext\": \"Clear business impact explanation\",\n      \"attackScenarios\": [\"detailed attack scenario 1\", \"attack scenario 2\"],\n      \"implementationComplexity\": \"simple|moderate|complex|architectural\",\n      \"estimatedEffort\": \"specific timeframe and resource estimate\",\n      \"systemicIssues\": [\"related pattern 1\", \"pattern 2\"]\n    }\n  ]\n}");
    };
    GeminiAuditEnhancer.prototype.buildIntelligentAnalysisPrompt = function (findings, baseReport, networkType) {
        var _a, _b;
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        var categories = __spreadArray([], new Set(findings.map(function (f) { return f.category; })), true);
        return "You are a blockchain security expert preparing a comprehensive audit report for a ".concat(networkType, " smart contract. Generate professional-grade analysis sections.\n\nAUDIT OVERVIEW:\n- Network: ").concat(networkType, "\n- Total Findings: ").concat(findings.length, "\n- Critical Issues: ").concat(critical, "\n- High Severity: ").concat(high, "\n- Top Categories: ").concat(categories.slice(0, 5).join(', '), "\n- Contract: ").concat(((_b = (_a = baseReport.report_metadata) === null || _a === void 0 ? void 0 : _a.target_contract) === null || _b === void 0 ? void 0 : _b.name) || 'Smart Contract', "\n\nDETAILED FINDINGS SUMMARY:\n").concat(findings.map(function (f) { return "\n\u2022 ".concat(f.title, " (").concat(f.severity, ")\n  Business Context: ").concat(f.businessContext, "\n  Implementation: ").concat(f.implementationComplexity, "\n  Priority: ").concat(f.mitigationPriority, "\n"); }).join(''), "\n\nGenerate the following analysis sections:\n\n1. EXECUTIVE SUMMARY (2-3 paragraphs for C-level executives)\n   - Overall security posture and business risk\n   - Key decision points and recommendations\n   - Financial and operational impact assessment\n\n2. TECHNICAL SUMMARY (for development teams)\n   - Technical risk breakdown\n   - Implementation priorities\n   - Resource requirements\n\n3. DETAILED ANALYSIS (comprehensive technical review)\n   - Vulnerability pattern analysis\n   - Systemic security issues\n   - Architecture and design concerns\n\n4. BUSINESS IMPACT ASSESSMENT\n   - Financial risk quantification\n   - Operational implications\n   - Regulatory and compliance considerations\n\n5. DEPLOYMENT RECOMMENDATION\n   - Clear go/no-go guidance with conditions\n   - Risk acceptance framework\n   - Milestone-based deployment strategy\n\nRespond in JSON format with these exact keys: executiveSummary, technicalSummary, detailedAnalysis, businessImpactAssessment, deploymentRecommendation");
    };
    GeminiAuditEnhancer.prototype.buildSecurityScoringPrompt = function (findings, networkType) {
        return "You are a security scoring specialist. Generate a comprehensive security score for this ".concat(networkType, " smart contract audit.\n\nFINDINGS ANALYSIS:\n").concat(findings.map(function (f) { return "\n\u2022 ".concat(f.title, ": ").concat(f.severity, " (confidence: ").concat(f.confidence || 0.8, ")\n  Category: ").concat(f.category, "\n  Business Impact: ").concat(f.businessContext, "\n  Exploitability: ").concat(f.exploitability || 'medium', "\n"); }).join(''), "\n\nGenerate a security scoring analysis including:\n\n1. Overall Security Score (0-100 scale)\n2. Category-specific scores (access_control, input_validation, etc.)\n3. Detailed scoring rationale explaining the methodology\n4. Confidence level in the assessment (0.0-1.0)\n\nConsider these factors in scoring:\n- Vulnerability severity and frequency\n- Business impact and exploitability\n- Code quality and defensive programming\n- Network-specific security patterns\n- Industry benchmarks and standards\n\nRespond in JSON format:\n{\n  \"overallScore\": 0-100,\n  \"categoryScores\": {\n    \"access_control\": 0-100,\n    \"input_validation\": 0-100,\n    \"state_management\": 0-100,\n    \"external_interactions\": 0-100,\n    \"error_handling\": 0-100\n  },\n  \"scoringRationale\": \"detailed explanation of scoring methodology and key factors\",\n  \"confidenceLevel\": 0.0-1.0\n}");
    };
    GeminiAuditEnhancer.prototype.buildRecommendationsPrompt = function (findings, networkType) {
        return "You are a senior security consultant providing actionable remediation guidance for a ".concat(networkType, " smart contract audit.\n\nFINDINGS REQUIRING REMEDIATION:\n").concat(findings.map(function (f) { return "\n".concat(f.title, " (").concat(f.severity, ")\n- Business Impact: ").concat(f.businessContext, "\n- Implementation Complexity: ").concat(f.implementationComplexity, "\n- Priority: ").concat(f.mitigationPriority, "\n- Current Recommendation: ").concat(f.recommendation, "\n"); }).join('\n'), "\n\nGenerate prioritized recommendations in 4 categories:\n\n1. IMMEDIATE ACTIONS (blocking deployment issues)\n   - Critical security fixes required before go-live\n   - Emergency response procedures\n\n2. SHORT-TERM (within 4-8 weeks)\n   - High-priority security improvements\n   - Process and tooling enhancements\n\n3. LONG-TERM (3-6 months)\n   - Strategic security initiatives\n   - Comprehensive security program development\n\n4. ARCHITECTURAL (major design changes)\n   - Fundamental design improvements\n   - Technology and framework upgrades\n\nEach recommendation should be:\n- Specific and actionable\n- Include success criteria\n- Estimate resource requirements\n- Consider business priorities\n\nRespond in JSON format:\n{\n  \"immediate\": [\"specific action 1\", \"action 2\"],\n  \"shortTerm\": [\"improvement 1\", \"improvement 2\"],\n  \"longTerm\": [\"strategy 1\", \"strategy 2\"],\n  \"architectural\": [\"design change 1\", \"change 2\"]\n}");
    };
    /**
     * Build AST-enhanced recommendations prompt with code-specific analysis
     */
    GeminiAuditEnhancer.prototype.buildASTEnhancedRecommendationsPrompt = function (findings, networkType, parsedAST) {
        var astAnalysis = parsedAST ? this.formatASTForPrompt(parsedAST) : null;
        return "You are a senior security consultant providing actionable remediation guidance for a ".concat(networkType, " smart contract audit.\n\nFINDINGS REQUIRING REMEDIATION:\n").concat(findings.map(function (f) { return "\n".concat(f.title, " (").concat(f.severity, ")\n- Business Impact: ").concat(f.businessContext, "\n- Implementation Complexity: ").concat(f.implementationComplexity, "\n- Priority: ").concat(f.mitigationPriority, "\n- Current Recommendation: ").concat(f.recommendation, "\n"); }).join('\n'), "\n\n").concat(astAnalysis ? "\nCODE ANALYSIS (AST):\n".concat(astAnalysis, "\n") : '', "\n\nBased on the actual code structure and findings, generate SPECIFIC and ACTIONABLE recommendations that address the exact functions, variables, and patterns found in this contract.\n\n1. IMMEDIATE ACTIONS (blocking deployment issues)\n   - Reference specific functions that need fixes (e.g., \"Add signer validation to transfer_tokens() function\")\n   - Specific code changes needed in identified functions\n   - Emergency testing for the affected functions\n\n2. SHORT-TERM (within 4-8 weeks)\n   - Improvements to specific functions identified in the AST\n   - Code patterns that need refactoring based on complexity analysis\n   - Testing strategies for the identified functions and modules\n\n3. LONG-TERM (3-6 months)\n   - Architecture improvements based on the module structure\n   - Comprehensive security patterns for the identified language features\n   - Code organization improvements for the specific dependencies\n\n4. ARCHITECTURAL (major design changes)\n   - Redesign recommendations based on the actual code structure\n   - Framework/library upgrades specific to the identified dependencies\n   - Security architecture improvements for the actual module design\n\nEach recommendation should:\n- Reference specific functions, variables, or modules from the code\n- Be implementable based on the actual code structure\n- Consider the complexity metrics and language features identified\n- Address the specific security insights found in the code\n\nRespond in JSON format with code-specific recommendations:\n{\n  \"immediate\": [\"Fix function_name() by adding validation X\", \"Update variable Y in module Z\"],\n  \"shortTerm\": [\"Refactor high-complexity function A\", \"Add tests for module B functions\"],\n  \"longTerm\": [\"Restructure module C for better security\", \"Implement pattern D across codebase\"],\n  \"architectural\": [\"Replace dependency X with Y\", \"Redesign Z pattern for security\"]\n}");
    };
    /**
     * Format parsed AST for inclusion in AI prompts
     */
    GeminiAuditEnhancer.prototype.formatASTForPrompt = function (parsedAST) {
        return "\nMODULE: ".concat(parsedAST.name, " (").concat(parsedAST.module_type, ")\nTotal Lines: ").concat(parsedAST.total_lines, "\n\nFUNCTIONS (").concat(parsedAST.functions.length, "):\n").concat(parsedAST.functions.map(function (f) { return "\n- ".concat(f.name, "() [").concat(f.visibility, ", line ").concat(f.line_number, "]\n  - Parameters: ").concat(f.parameters.map(function (p) { return "".concat(p.name, ": ").concat(p.type); }).join(', ') || 'none', "\n  - Return Type: ").concat(f.return_type || 'void', "\n  - Complexity Score: ").concat(f.complexity_score, "\n  - Entry Function: ").concat(f.is_entry_function ? 'Yes' : 'No', "\n  - Modifiers: ").concat(f.modifiers.join(', ') || 'none', "\n  - Documentation: ").concat(f.doc_comments.join(' ') || 'none', "\n"); }).join(''), "\n\nSTRUCTURES/EVENTS (").concat(parsedAST.events.length, "):\n").concat(parsedAST.events.map(function (s) { return "\n- ".concat(s.name, " [line ").concat(s.line_number, "]\n  - Fields: ").concat(s.fields.map(function (f) { return "".concat(f.name, ": ").concat(f.type); }).join(', ') || 'none', "\n  - Abilities: ").concat([s.has_copy && 'copy', s.has_drop && 'drop', s.has_store && 'store', s.has_key && 'key'].filter(Boolean).join(', ') || 'none', "\n  - Documentation: ").concat(s.doc_comments.join(' ') || 'none', "\n"); }).join(''), "\n\nCONSTANTS/VARIABLES (").concat(parsedAST.variables.length, "):\n").concat(parsedAST.variables.map(function (v) { return "\n- ".concat(v.name, ": ").concat(v.type, " [").concat(v.visibility, ", line ").concat(v.line_number, "]\n  - Mutable: ").concat(v.is_mutable ? 'Yes' : 'No', "\n  - Value: ").concat(v.value || 'not specified', "\n  - Documentation: ").concat(v.doc_comments.join(' ') || 'none', "\n"); }).join(''), "\n\nIMPORTS/DEPENDENCIES:\n").concat(parsedAST.imports.concat(parsedAST.dependencies).join(', ') || 'none', "\n\nCOMPLEXITY METRICS:\n- Cyclomatic Complexity: ").concat(parsedAST.complexity_metrics.cyclomatic_complexity, "\n- Functions: ").concat(parsedAST.complexity_metrics.function_count, "\n- Structs: ").concat(parsedAST.complexity_metrics.struct_count, "\n- Constants: ").concat(parsedAST.complexity_metrics.const_count, "\n\nLANGUAGE FEATURES:\n").concat(parsedAST.language_features.join(', ') || 'none', "\n\nSECURITY INSIGHTS:\n").concat(parsedAST.security_insights.join('\n- ') || 'none', "\n\nMODULE DOCUMENTATION:\n").concat(parsedAST.doc_comments.join(' ') || 'none');
    };
    // ===========================================
    // UTILITY AND FALLBACK METHODS
    // ===========================================
    /**
     * Convert StandardFinding[] to Finding[] for processing
     */
    GeminiAuditEnhancer.prototype.convertStandardFindingsToFindings = function (standardFindings) {
        return standardFindings.map(function (sf) {
            var _a, _b, _c;
            return ({
                id: sf.id,
                title: sf.title,
                description: sf.description,
                severity: sf.severity.toLowerCase(),
                confidence: sf.confidence || 0.8,
                category: sf.category || 'general',
                location: {
                    file: ((_a = sf.affected_files) === null || _a === void 0 ? void 0 : _a[0]) || 'unknown',
                    startLine: ((_b = sf.line_numbers) === null || _b === void 0 ? void 0 : _b[0]) || 1,
                    endLine: ((_c = sf.line_numbers) === null || _c === void 0 ? void 0 : _c[0]) || 1,
                    startColumn: 1,
                    endColumn: 50,
                    function: 'unknown',
                    snippet: sf.code_snippet || sf.recommendation || 'Code snippet not available'
                },
                code: sf.cwe || sf.category || 'UNKNOWN',
                recommendation: sf.recommendation,
                references: sf.references || [],
                cwe: sf.cwe,
                owasp: undefined,
                exploitability: sf.exploitability || 0.5,
                impact: {
                    financial: 'medium',
                    operational: 'medium',
                    reputational: 'medium',
                    description: sf.impact || 'Impact assessment pending'
                },
                source: 'static',
                tool: undefined
            });
        });
    };
    GeminiAuditEnhancer.prototype.parseAIResponse = function (response) {
        try {
            // Try direct JSON parsing
            return JSON.parse(response);
        }
        catch (e) {
            // Try extracting JSON from markdown code blocks
            var jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/);
            if (jsonMatch) {
                try {
                    return JSON.parse(jsonMatch[1]);
                }
                catch (e2) {
                    logger_1.logger.warn('Failed to parse JSON from markdown block');
                }
            }
            // Try extracting JSON object pattern
            var objectMatch = response.match(/\{[\s\S]*\}/);
            if (objectMatch) {
                try {
                    return JSON.parse(objectMatch[0]);
                }
                catch (e3) {
                    logger_1.logger.warn('Failed to parse extracted JSON object');
                }
            }
            logger_1.logger.warn('Could not parse AI response as JSON, using fallback');
            return {};
        }
    };
    GeminiAuditEnhancer.prototype.calculateMitigationPriority = function (severity) {
        switch (severity.toLowerCase()) {
            case 'critical': return 'immediate';
            case 'high': return 'high';
            case 'medium': return 'medium';
            default: return 'low';
        }
    };
    GeminiAuditEnhancer.prototype.estimateEffortFromSeverity = function (severity) {
        switch (severity.toLowerCase()) {
            case 'critical': return '1-3 days (immediate priority)';
            case 'high': return '1-2 weeks';
            case 'medium': return '2-4 weeks';
            default: return '1-2 months';
        }
    };
    GeminiAuditEnhancer.prototype.findRelatedFindings = function (finding, allFindings) {
        return allFindings
            .filter(function (other) {
            var _a, _b;
            return other.id !== finding.id &&
                (other.category === finding.category ||
                    ((_a = other.location) === null || _a === void 0 ? void 0 : _a.file) === ((_b = finding.location) === null || _b === void 0 ? void 0 : _b.file));
        })
            .map(function (related) { return related.id || related.title; })
            .slice(0, 3);
    };
    GeminiAuditEnhancer.prototype.calculateBaseSecurityScore = function (findings) {
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        var medium = findings.filter(function (f) { return f.severity === 'medium'; }).length;
        var low = findings.filter(function (f) { return f.severity === 'low'; }).length;
        return Math.max(0, 100 - (critical * 25 + high * 10 + medium * 5 + low * 2));
    };
    GeminiAuditEnhancer.prototype.generateCategoryScores = function (findings) {
        var categories = ['access_control', 'input_validation', 'state_management', 'external_interactions', 'error_handling'];
        var scores = {};
        categories.forEach(function (category) {
            var categoryFindings = findings.filter(function (f) { var _a; return (_a = f.category) === null || _a === void 0 ? void 0 : _a.toLowerCase().includes(category.replace('_', '')); });
            var critical = categoryFindings.filter(function (f) { return f.severity === 'critical'; }).length;
            var high = categoryFindings.filter(function (f) { return f.severity === 'high'; }).length;
            var medium = categoryFindings.filter(function (f) { return f.severity === 'medium'; }).length;
            scores[category] = Math.max(0, 100 - (critical * 30 + high * 15 + medium * 8));
        });
        return scores;
    };
    GeminiAuditEnhancer.prototype.calculateRiskLevel = function (critical, high, medium) {
        if (critical > 0)
            return 'Critical';
        if (high > 2 || (high > 0 && medium > 5))
            return 'High';
        if (high > 0 || medium > 3)
            return 'Medium';
        return 'Low';
    };
    GeminiAuditEnhancer.prototype.generateFallbackExecutiveSummary = function (findings, networkType) {
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        return "This ".concat(networkType, " smart contract audit identified ").concat(findings.length, " security findings across multiple categories. ").concat(critical > 0 ? "CRITICAL: ".concat(critical, " critical issue").concat(critical > 1 ? 's' : '', " requiring immediate attention before deployment.") : '', " ").concat(high > 0 ? "".concat(high, " high-severity issue").concat(high > 1 ? 's' : '', " should be addressed within the next development cycle.") : '', " The overall security posture requires improvement before production deployment. Detailed remediation guidance and implementation priorities have been provided to support the development team in addressing these security concerns systematically.");
    };
    GeminiAuditEnhancer.prototype.generateFallbackTechnicalSummary = function (findings) {
        var categories = __spreadArray([], new Set(findings.map(function (f) { return f.category; })), true);
        return "Technical analysis identified security issues across ".concat(categories.length, " categories: ").concat(categories.slice(0, 5).join(', '), ". The findings range from configuration issues to potential vulnerabilities requiring code changes. Implementation complexity varies from simple configuration updates to architectural improvements. Development team should prioritize critical and high-severity findings while establishing a systematic approach to address medium and low-priority items.");
    };
    GeminiAuditEnhancer.prototype.generateFallbackDetailedAnalysis = function (findings) {
        return {
            security_patterns: {
                common_issues: findings.slice(0, 5).map(function (f) { return f.category; }),
                systemic_concerns: findings.length > 10 ? ['Multiple security patterns suggest systematic review needed'] : [],
                positive_findings: ['Standard security practices partially implemented']
            },
            code_quality: {
                overall_assessment: findings.length < 5 ? 'Good' : findings.length < 15 ? 'Fair' : 'Needs Improvement',
                improvement_areas: __spreadArray([], new Set(findings.map(function (f) { return f.category; })), true).slice(0, 3)
            }
        };
    };
    GeminiAuditEnhancer.prototype.generateDeploymentRecommendation = function (findings) {
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        if (critical > 0) {
            return "DEPLOYMENT NOT RECOMMENDED: ".concat(critical, " critical security issue").concat(critical > 1 ? 's' : '', " must be resolved before production deployment.");
        }
        if (high > 3) {
            return "CONDITIONAL DEPLOYMENT: Address ".concat(high, " high-severity issues. Consider phased rollout with additional monitoring.");
        }
        if (high > 0) {
            return "DEPLOYMENT WITH CONDITIONS: ".concat(high, " high-severity issue").concat(high > 1 ? 's' : '', " should be resolved. Implement additional monitoring and have incident response plan ready.");
        }
        return 'DEPLOYMENT APPROVED: No blocking issues identified. Monitor and address medium/low priority findings in upcoming releases.';
    };
    // Additional utility methods for comprehensive analysis...
    GeminiAuditEnhancer.prototype.getImmediateRecommendations = function (findings) {
        var critical = findings.filter(function (f) { return f.severity === 'critical'; });
        if (critical.length === 0)
            return [];
        return [
            "\uD83D\uDEA8 URGENT: Fix ".concat(critical.length, " critical security issue").concat(critical.length > 1 ? 's' : '', " before deployment"),
            '🚨 Conduct security review with senior developers',
            '🚨 Implement comprehensive testing for critical fixes',
            '🚨 Consider external security consultant review'
        ];
    };
    GeminiAuditEnhancer.prototype.getShortTermRecommendations = function (findings) {
        var high = findings.filter(function (f) { return f.severity === 'high'; });
        return [
            "\u26A1 Address ".concat(high.length, " high-severity security issues within 4-8 weeks"),
            '⚡ Implement automated security scanning in CI/CD pipeline',
            '⚡ Establish security code review processes',
            '⚡ Provide security training for development team'
        ];
    };
    GeminiAuditEnhancer.prototype.getLongTermRecommendations = function (findings, networkType) {
        return [
            '📋 Establish regular security audit cycles (quarterly)',
            "\uD83D\uDCCB Develop ".concat(networkType, "-specific security standards and guidelines"),
            '📋 Implement comprehensive security monitoring and alerting',
            '📋 Create incident response procedures and runbooks'
        ];
    };
    GeminiAuditEnhancer.prototype.getArchitecturalRecommendations = function (findings, networkType) {
        var architecturalFindings = findings.filter(function (f) { return f.implementationComplexity === 'architectural'; });
        if (architecturalFindings.length === 0)
            return [];
        return [
            '🏗️ Consider implementing security-by-design patterns',
            "\uD83C\uDFD7\uFE0F Evaluate ".concat(networkType, "-specific security frameworks"),
            '🏗️ Design comprehensive access control architecture',
            '🏗️ Implement defense-in-depth security strategy'
        ];
    };
    GeminiAuditEnhancer.prototype.getApplicableStandards = function (networkType) {
        var commonStandards = ['OWASP Smart Contract Top 10', 'NIST Cybersecurity Framework'];
        switch (networkType.toLowerCase()) {
            case 'solana':
                return __spreadArray(__spreadArray([], commonStandards, true), ['Solana Security Best Practices', 'Anchor Framework Guidelines'], false);
            case 'ethereum':
                return __spreadArray(__spreadArray([], commonStandards, true), ['OpenZeppelin Security Guidelines', 'ConsenSys Best Practices'], false);
            default:
                return __spreadArray(__spreadArray([], commonStandards, true), ['Blockchain Security Alliance Guidelines'], false);
        }
    };
    GeminiAuditEnhancer.prototype.identifyComplianceGaps = function (findings) {
        var gaps = [];
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        if (critical > 0)
            gaps.push('Critical security vulnerabilities violate security standards');
        if (high > 2)
            gaps.push('Multiple high-risk issues indicate systematic security gaps');
        return gaps;
    };
    GeminiAuditEnhancer.prototype.getComplianceRecommendations = function (critical, high, networkType) {
        var recommendations = [];
        if (critical > 0) {
            recommendations.push("Address ".concat(critical, " critical findings to meet security compliance requirements"));
        }
        if (high > 0) {
            recommendations.push("Resolve ".concat(high, " high-severity issues to align with industry standards"));
        }
        recommendations.push("Implement ".concat(networkType, "-specific security compliance framework"));
        recommendations.push('Establish continuous compliance monitoring procedures');
        return recommendations;
    };
    GeminiAuditEnhancer.prototype.identifyPrimaryThreats = function (findings, networkType) {
        var categories = findings.reduce(function (acc, f) {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(categories)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .map(function (_a) {
            var category = _a[0];
            return "".concat(category.replace('_', ' ').toUpperCase(), " vulnerabilities");
        });
    };
    GeminiAuditEnhancer.prototype.identifyAttackVectors = function (findings) {
        var vectors = new Set();
        findings.forEach(function (f) {
            if (f.attackScenarios) {
                f.attackScenarios.forEach(function (scenario) { return vectors.add(scenario); });
            }
        });
        return Array.from(vectors).slice(0, 10);
    };
    GeminiAuditEnhancer.prototype.generateRiskMitigation = function (findings) {
        var mitigation = [];
        var critical = findings.filter(function (f) { return f.severity === 'critical'; }).length;
        var high = findings.filter(function (f) { return f.severity === 'high'; }).length;
        if (critical > 0) {
            mitigation.push("Immediately address ".concat(critical, " critical vulnerabilities"));
        }
        if (high > 0) {
            mitigation.push("Implement fixes for ".concat(high, " high-severity issues"));
        }
        mitigation.push('Deploy comprehensive monitoring and alerting');
        mitigation.push('Establish incident response procedures');
        mitigation.push('Implement defense-in-depth security architecture');
        return mitigation;
    };
    GeminiAuditEnhancer.prototype.addBasicEnhancements = function (baseReport) {
        var _a;
        logger_1.logger.warn('Applying basic enhancements due to AI service failure');
        return __assign(__assign({}, baseReport), { summary: __assign(__assign({}, baseReport.summary), { recommendation: ((_a = baseReport.summary) === null || _a === void 0 ? void 0 : _a.recommendation) || 'Manual security review recommended due to AI enhancement service unavailability' }), appendix: __assign(__assign({}, baseReport.appendix), { enhancement_status: 'Basic enhancements applied - AI service unavailable', fallback_applied: true }) });
    };
    // Additional helper methods for comprehensive analysis
    GeminiAuditEnhancer.prototype.identifyRiskFactors = function (critical, high, medium, low) {
        var factors = [];
        if (critical > 0)
            factors.push("".concat(critical, " critical security vulnerabilities present"));
        if (high > 2)
            factors.push("Multiple high-severity issues (".concat(high, ") detected"));
        if (medium > 8)
            factors.push("High density of medium-severity issues (".concat(medium, ")"));
        if ((critical + high + medium) > 15)
            factors.push('High overall vulnerability density');
        return factors.length > 0 ? factors : ['Low security risk profile'];
    };
    GeminiAuditEnhancer.prototype.interpretSecurityScore = function (score) {
        if (score >= 90)
            return 'Excellent - Strong security posture with minimal vulnerabilities';
        if (score >= 75)
            return 'Good - Solid security foundation with some areas for improvement';
        if (score >= 60)
            return 'Fair - Moderate security issues that should be addressed';
        if (score >= 40)
            return 'Poor - Significant security concerns requiring immediate attention';
        return 'Critical - Severe security issues posing immediate risk';
    };
    GeminiAuditEnhancer.prototype.analyzeVulnerabilityDistribution = function (findings) {
        var categories = findings.reduce(function (acc, f) {
            if (!acc[f.category]) {
                acc[f.category] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
            }
            acc[f.category][f.severity]++;
            acc[f.category].total++;
            return acc;
        }, {});
        return Object.entries(categories).map(function (_a) {
            var category = _a[0], counts = _a[1];
            return ({
                category: category,
                count: counts.total,
                severity_breakdown: {
                    critical: counts.critical,
                    high: counts.high,
                    medium: counts.medium,
                    low: counts.low
                }
            });
        });
    };
    GeminiAuditEnhancer.prototype.getTopVulnerabilityCategories = function (findings) {
        var _this = this;
        var categories = findings.reduce(function (acc, f) {
            acc[f.category] = (acc[f.category] || 0) + 1;
            return acc;
        }, {});
        return Object.entries(categories)
            .sort(function (_a, _b) {
            var a = _a[1];
            var b = _b[1];
            return b - a;
        })
            .slice(0, 5)
            .map(function (_a) {
            var _b;
            var category = _a[0], count = _a[1];
            return ({
                category: category,
                count: count,
                description: _this.getCategoryDescription(category),
                sample_finding: ((_b = findings.find(function (f) { return f.category === category; })) === null || _b === void 0 ? void 0 : _b.title) || 'N/A'
            });
        });
    };
    GeminiAuditEnhancer.prototype.getCategoryDescription = function (category) {
        var descriptions = {
            'access_control': 'Issues related to authentication and authorization mechanisms',
            'input_validation': 'Problems with data sanitization and validation processes',
            'state_management': 'Vulnerabilities in application state handling and transitions',
            'external_interactions': 'Security concerns in external service integrations',
            'error_handling': 'Improper error handling and information disclosure risks',
            'cryptography': 'Cryptographic implementation and key management issues',
            'business_logic': 'Flaws in application-specific business logic implementation'
        };
        return descriptions[category] || 'Security-related findings in this category';
    };
    GeminiAuditEnhancer.prototype.calculateAverageConfidence = function (findings) {
        if (findings.length === 0)
            return 0;
        var totalConfidence = findings.reduce(function (sum, f) { return sum + (f.confidence || 0.8); }, 0);
        return Math.round((totalConfidence / findings.length) * 100);
    };
    GeminiAuditEnhancer.prototype.assessExploitability = function (findings) {
        if (findings.length === 0)
            return 'Not assessed';
        var avgExploitability = findings.reduce(function (sum, f) { return sum + (f.exploitability || 0.5); }, 0) / findings.length;
        if (avgExploitability > 0.8)
            return 'High - Many findings are easily exploitable';
        if (avgExploitability > 0.6)
            return 'Medium-High - Several findings may be exploitable';
        if (avgExploitability > 0.4)
            return 'Medium - Some findings require moderate effort to exploit';
        return 'Low - Most findings require significant effort to exploit';
    };
    GeminiAuditEnhancer.prototype.classifyVulnerability = function (finding) {
        if (finding.cwe)
            return "CWE-".concat(finding.cwe);
        return finding.category.replace('_', ' ').toUpperCase();
    };
    GeminiAuditEnhancer.prototype.identifyAttackVector = function (finding) {
        if (finding.category.toLowerCase().includes('input'))
            return 'Malicious Input';
        if (finding.category.toLowerCase().includes('access'))
            return 'Authentication Bypass';
        if (finding.category.toLowerCase().includes('state'))
            return 'State Manipulation';
        return 'Direct Code Execution';
    };
    GeminiAuditEnhancer.prototype.identifyPrerequisites = function (finding) {
        switch (finding.severity) {
            case 'critical': return ['No special prerequisites - easily exploitable'];
            case 'high': return ['Basic understanding of smart contract interactions'];
            case 'medium': return ['Moderate technical knowledge required'];
            default: return ['Advanced technical knowledge and specific conditions required'];
        }
    };
    GeminiAuditEnhancer.prototype.interpretConfidence = function (confidence) {
        if (confidence > 0.9)
            return 'Very High - Confirmed vulnerability';
        if (confidence > 0.7)
            return 'High - Likely vulnerability';
        if (confidence > 0.5)
            return 'Medium - Possible vulnerability';
        return 'Low - Potential false positive';
    };
    GeminiAuditEnhancer.prototype.assessComplianceImpact = function (finding) {
        if (finding.severity === 'critical' || finding.severity === 'high') {
            return 'May significantly affect compliance with security standards';
        }
        return 'Minimal compliance impact';
    };
    GeminiAuditEnhancer.prototype.assessUserImpact = function (finding) {
        var _a, _b;
        if (((_a = finding.impact) === null || _a === void 0 ? void 0 : _a.operational) === 'high')
            return 'High - May directly affect user funds or operations';
        if (((_b = finding.impact) === null || _b === void 0 ? void 0 : _b.operational) === 'medium')
            return 'Medium - May cause user inconvenience or confusion';
        return 'Low - Minimal direct impact on end users';
    };
    GeminiAuditEnhancer.prototype.identifyRequiredExpertise = function (finding) {
        var expertise = ['Smart Contract Security'];
        if (finding.category.toLowerCase().includes('crypto'))
            expertise.push('Cryptography');
        if (finding.category.toLowerCase().includes('access'))
            expertise.push('Authentication Systems');
        if (finding.severity === 'critical')
            expertise.push('Senior Security Engineering');
        return expertise;
    };
    GeminiAuditEnhancer.prototype.identifyTestingRequirements = function (finding) {
        return [
            'Unit tests for affected functionality',
            'Integration tests for security controls',
            'Penetration testing for vulnerability verification',
            'Regression testing for fix validation'
        ];
    };
    GeminiAuditEnhancer.prototype.generateImplementationSteps = function (finding) {
        return [
            'Analyze the vulnerability root cause',
            'Design appropriate security controls',
            'Implement and test the security fix',
            'Conduct security review and validation',
            'Deploy with monitoring and rollback capability'
        ];
    };
    GeminiAuditEnhancer.prototype.getSecurityBestPractices = function (platform) {
        return [
            '✅ Implement comprehensive input validation for all user data',
            '✅ Use principle of least privilege for access controls',
            '✅ Implement proper error handling without information leakage',
            '✅ Use secure coding patterns and frameworks',
            '✅ Implement comprehensive logging and monitoring',
            '✅ Regular security testing and code reviews',
            '✅ Keep dependencies updated and monitor for vulnerabilities'
        ];
    };
    GeminiAuditEnhancer.prototype.getTestingRecommendations = function () {
        return [
            '🧪 Implement comprehensive unit tests for security-critical functions',
            '🧪 Create integration tests for authentication and authorization',
            '🧪 Develop security regression test suites',
            '🧪 Implement automated security scanning in CI/CD',
            '🧪 Conduct regular penetration testing'
        ];
    };
    GeminiAuditEnhancer.prototype.getBusinessProcessRecommendations = function (findings) {
        return [
            'Establish security-first development culture',
            'Implement security requirements in project planning',
            'Create security incident response procedures',
            'Establish regular security training programs'
        ];
    };
    GeminiAuditEnhancer.prototype.getContinuousMonitoringRecommendations = function () {
        return [
            'Deploy real-time security monitoring and alerting',
            'Implement automated vulnerability scanning',
            'Establish security metrics and KPIs tracking',
            'Create regular security posture assessment procedures'
        ];
    };
    // ===========================================
    // AST-ENHANCED CODE-SPECIFIC RECOMMENDATIONS
    // ===========================================
    /**
     * Generate immediate recommendations based on actual code structure and findings
     */
    GeminiAuditEnhancer.prototype.getCodeSpecificImmediateRecommendations = function (findings, parsedAST) {
        var critical = findings.filter(function (f) { return f.severity === 'critical'; });
        var recommendations = [];
        if (critical.length === 0)
            return [];
        // Critical findings addressing specific functions/code elements
        critical.forEach(function (finding) {
            if (finding.title.toLowerCase().includes('signer') || finding.title.toLowerCase().includes('authorization')) {
                if (parsedAST && parsedAST.functions.length > 0) {
                    var entryFunctions = parsedAST.functions.filter(function (f) { return f.is_entry_function || f.visibility === 'public'; });
                    if (entryFunctions.length > 0) {
                        recommendations.push("\uD83D\uDEA8 URGENT: Add signer validation to ".concat(entryFunctions.map(function (f) { return f.name + '()'; }).join(', '), " function").concat(entryFunctions.length > 1 ? 's' : ''));
                    }
                }
            }
            if (finding.title.toLowerCase().includes('overflow') || finding.title.toLowerCase().includes('arithmetic')) {
                if (parsedAST) {
                    var mathFunctions = parsedAST.functions.filter(function (f) {
                        return f.body_text.includes('+') || f.body_text.includes('-') || f.body_text.includes('*') || f.body_text.includes('/');
                    });
                    if (mathFunctions.length > 0) {
                        recommendations.push("\uD83D\uDEA8 URGENT: Implement safe arithmetic in ".concat(mathFunctions.slice(0, 3).map(function (f) { return f.name + '()'; }).join(', '), " ").concat(mathFunctions.length > 3 ? "and ".concat(mathFunctions.length - 3, " other functions") : ''));
                    }
                }
            }
        });
        // Generic critical recommendations with AST context
        if (parsedAST) {
            recommendations.push("\uD83D\uDEA8 Fix ".concat(critical.length, " critical security issue").concat(critical.length > 1 ? 's' : '', " in ").concat(parsedAST.name, " module before deployment"));
            var highComplexityFunctions = parsedAST.functions.filter(function (f) { return f.complexity_score > 10; });
            if (highComplexityFunctions.length > 0) {
                recommendations.push("\uD83D\uDEA8 Review high-complexity functions: ".concat(highComplexityFunctions.map(function (f) { return f.name + '()'; }).join(', '), " (complexity ").concat(highComplexityFunctions.map(function (f) { return f.complexity_score; }).join(', '), ")"));
            }
        }
        else {
            recommendations.push("\uD83D\uDEA8 Fix ".concat(critical.length, " critical security issue").concat(critical.length > 1 ? 's' : '', " before deployment"));
        }
        recommendations.push('🚨 Conduct security review with senior developers');
        return recommendations;
    };
    /**
     * Generate short-term recommendations based on code structure
     */
    GeminiAuditEnhancer.prototype.getCodeSpecificShortTermRecommendations = function (findings, parsedAST) {
        var high = findings.filter(function (f) { return f.severity === 'high'; });
        var recommendations = [];
        if (parsedAST) {
            // Function-specific recommendations
            var publicFunctions = parsedAST.functions.filter(function (f) { return f.visibility === 'public'; });
            if (publicFunctions.length > 0) {
                recommendations.push("\u26A1 Add comprehensive input validation to public functions: ".concat(publicFunctions.map(function (f) { return f.name + '()'; }).join(', ')));
            }
            // Security insights from AST
            parsedAST.security_insights.forEach(function (insight) {
                if (insight.includes('unwrap()')) {
                    recommendations.push('⚡ Replace unwrap() calls with proper error handling in identified functions');
                }
                if (insight.includes('unsafe')) {
                    recommendations.push('⚡ Audit all unsafe code blocks for memory safety');
                }
            });
            // Test coverage recommendations
            var undocumentedFunctions = parsedAST.functions.filter(function (f) { return f.doc_comments.length === 0; });
            if (undocumentedFunctions.length > 0) {
                recommendations.push("\u26A1 Add documentation and tests for ".concat(undocumentedFunctions.length, " undocumented functions"));
            }
            recommendations.push("\u26A1 Address ".concat(high.length, " high-severity issues in ").concat(parsedAST.name, " module"));
        }
        else {
            recommendations.push("\u26A1 Address ".concat(high.length, " high-severity security issues within 4-8 weeks"));
        }
        recommendations.push('⚡ Implement automated security scanning in CI/CD pipeline');
        return recommendations;
    };
    /**
     * Generate long-term recommendations based on architecture and code organization
     */
    GeminiAuditEnhancer.prototype.getCodeSpecificLongTermRecommendations = function (findings, networkType, parsedAST) {
        var recommendations = [];
        if (parsedAST) {
            // Architecture recommendations based on actual code
            if (parsedAST.complexity_metrics.cyclomatic_complexity > 50) {
                recommendations.push("\uD83D\uDCCB Refactor ".concat(parsedAST.name, " module to reduce cyclomatic complexity (current: ").concat(parsedAST.complexity_metrics.cyclomatic_complexity, ")"));
            }
            // Dependency management
            if (parsedAST.dependencies.length > 0) {
                recommendations.push("\uD83D\uDCCB Audit and update dependencies: ".concat(parsedAST.dependencies.join(', ')));
            }
            // Language-specific recommendations
            if (parsedAST.language_features.includes('unsafe_code')) {
                recommendations.push('📋 Create comprehensive unsafe code review and documentation standards');
            }
            if (parsedAST.language_features.includes('async_functions')) {
                recommendations.push('📋 Implement async/await security patterns and error handling standards');
            }
            // Module-specific security program
            recommendations.push("\uD83D\uDCCB Establish security standards specific to ".concat(parsedAST.module_type, " development"));
            recommendations.push("\uD83D\uDCCB Create automated testing framework for ".concat(parsedAST.complexity_metrics.function_count, " functions in codebase"));
        }
        else {
            recommendations.push('📋 Establish regular security audit cycles (quarterly)');
            recommendations.push("\uD83D\uDCCB Develop ".concat(networkType, "-specific security standards and guidelines"));
        }
        recommendations.push('📋 Implement comprehensive security monitoring and alerting');
        return recommendations;
    };
    /**
     * Generate architectural recommendations based on code structure
     */
    GeminiAuditEnhancer.prototype.getCodeSpecificArchitecturalRecommendations = function (findings, networkType, parsedAST) {
        var architecturalFindings = findings.filter(function (f) { return f.implementationComplexity === 'architectural'; });
        var recommendations = [];
        if (architecturalFindings.length === 0 && (!parsedAST || parsedAST.complexity_metrics.cyclomatic_complexity < 30)) {
            return [];
        }
        if (parsedAST) {
            // Specific architectural improvements based on code analysis
            if (parsedAST.functions.length > 20) {
                recommendations.push("\uD83C\uDFD7\uFE0F Consider modularizing ".concat(parsedAST.name, " - ").concat(parsedAST.functions.length, " functions suggest need for separation of concerns"));
            }
            // Framework recommendations based on actual dependencies
            var currentFrameworks = parsedAST.imports.filter(function (imp) {
                return imp.includes('anchor') || imp.includes('solana') || imp.includes('move') || imp.includes('spl');
            });
            if (currentFrameworks.length > 0) {
                recommendations.push("\uD83C\uDFD7\uFE0F Evaluate upgrading framework versions: ".concat(currentFrameworks.join(', ')));
            }
            // Security architecture based on actual patterns
            var entryPoints = parsedAST.functions.filter(function (f) { return f.is_entry_function; }).length;
            if (entryPoints > 10) {
                recommendations.push("\uD83C\uDFD7\uFE0F Implement entry point access control pattern - ".concat(entryPoints, " entry functions detected"));
            }
            // Data structure improvements
            if (parsedAST.events.length > 0) {
                var structsWithoutAbilities = parsedAST.events.filter(function (s) {
                    return !s.has_copy && !s.has_drop && !s.has_store && !s.has_key;
                });
                if (structsWithoutAbilities.length > 0) {
                    recommendations.push("\uD83C\uDFD7\uFE0F Review and add appropriate abilities to structs: ".concat(structsWithoutAbilities.map(function (s) { return s.name; }).join(', ')));
                }
            }
            recommendations.push("\uD83C\uDFD7\uFE0F Implement security-by-design patterns for ".concat(parsedAST.module_type, " architecture"));
        }
        else {
            recommendations.push('🏗️ Consider implementing security-by-design patterns');
            recommendations.push("\uD83C\uDFD7\uFE0F Evaluate ".concat(networkType, "-specific security frameworks"));
        }
        recommendations.push('🏗️ Design comprehensive access control architecture');
        return recommendations;
    };
    return GeminiAuditEnhancer;
}());
exports.GeminiAuditEnhancer = GeminiAuditEnhancer;
