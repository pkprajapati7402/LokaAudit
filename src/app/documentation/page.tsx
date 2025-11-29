// Documentation Generation Page
"use client";
import { useState, useEffect } from "react";
import Split from "react-split";
import { 
  Folder, 
  FileText, 
  Search, 
  Filter, 
  Loader2, 
  Download, 
  Copy, 
  Check,
  Code,
  BookOpen,
  AlertTriangle,
  CheckCircle,
  Info,
  FileDown,
  Shield
} from "lucide-react";
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';

interface ProjectFile {
  fileName: string;
  size: number;
  uploadDate: string;
}

interface Project {
  _id: string;
  projectName: string;
  developerId: string;
  language: string;
  createdDate: string;
  lastUpdated: string;
  filesCount: number;
  files: ProjectFile[];
}

interface DocumentationReport {
  name: string;
  description: string;
  overall_summary: string;
  summary: string;
  version: string | null;
  license: string | null;
  functions: {
    name: string;
    visibility: 'public' | 'private' | 'internal';
    description: string;
    parameters: {
      name: string;
      type: string;
      description: string;
    }[];
    return_type: string | null;
    examples: string[];
    security_notes?: string[];
    complexity_score?: number;
    source_file?: string;
    file_language?: string;
  }[];
  events: {
    name: string;
    fields: {
      name: string;
      type: string;
    }[];
    description: string;
    purpose?: string;
    source_file?: string;
    file_language?: string;
  }[];
  variables: {
    name: string;
    type: string;
    visibility: 'public' | 'private';
    description: string;
    security_implications?: string[];
    source_file?: string;
    file_language?: string;
  }[];
  security_analysis?: {
    overall_risk: 'low' | 'medium' | 'high';
    key_findings: string[];
    recommendations: string[];
    compliance_score?: number;
    audit_notes?: string[];
  };
  complexity_analysis?: {
    total_complexity: number;
    high_complexity_functions: string[];
    maintainability_score: number;
  };
  quality_metrics?: {
    documentation_coverage: number;
    test_coverage_estimate: number;
    code_quality_score: number;
  };
  file_breakdown?: {
    fileName: string;
    language: string;
    functions: number;
    complexity: number;
    risk_level: string;
  }[];
}


export default function Documentation() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');
  const [documentation, setDocumentation] = useState<DocumentationReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // Fetch projects from MongoDB
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/projects');
        
        if (!response.ok) {
          throw new Error('Failed to fetch projects');
        }
        
        const data = await response.json();
        setProjects(data.projects);
        
        // Set first project as selected by default
        if (data.projects.length > 0) {
          setSelectedProject(data.projects[0]);
        }
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Reset selected files when project changes
  useEffect(() => {
    setSelectedFiles(new Set());
    setDocumentation(null);
  }, [selectedProject]);

  // Handle individual file selection
  const handleFileSelect = (fileIndex: number) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileIndex)) {
      newSelectedFiles.delete(fileIndex);
    } else {
      newSelectedFiles.add(fileIndex);
    }
    setSelectedFiles(newSelectedFiles);
  };

  // Handle select all files
  const handleSelectAllFiles = () => {
    if (!selectedProject || !selectedProject.files) return;
    
    const allFileIndices = selectedProject.files.map((_, index) => index);
    const newSelectedFiles = new Set(selectedFiles);
    
    // If all files are already selected, deselect all
    const allSelected = allFileIndices.every(index => selectedFiles.has(index));
    
    if (allSelected) {
      // Deselect all
      allFileIndices.forEach(index => newSelectedFiles.delete(index));
    } else {
      // Select all
      allFileIndices.forEach(index => newSelectedFiles.add(index));
    }
    
    setSelectedFiles(newSelectedFiles);
  };

  // Check if all files are selected
  const areAllFilesSelected = () => {
    if (!selectedProject || !selectedProject.files) return false;
    const allFileIndices = selectedProject.files.map((_, index) => index);
    return allFileIndices.length > 0 && allFileIndices.every(index => selectedFiles.has(index));
  };

  // Generate documentation for selected files
  const generateDocumentation = async () => {
    if (!selectedProject || selectedFiles.size === 0) {
      alert('Please select files to generate documentation');
      return;
    }

    setIsGenerating(true);
    setGenerationStatus('Initializing documentation generation...');
    
    try {
      // Convert Set to array of indices
      const fileIndices = Array.from(selectedFiles);
      
      setGenerationStatus('Fetching file content and parsing code structure...');
      
      const response = await fetch('/api/generate-documentation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectName: selectedProject.projectName,
          developerId: selectedProject.developerId,
          fileIndices: fileIndices
        }),
      });

      setGenerationStatus('Processing with AI language models for enhanced analysis...');

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate documentation');
      }

      if (result.success && result.documentation) {
        setGenerationStatus('Documentation generated successfully!');
        setDocumentation(result.documentation);
        
        // Clear status after a brief success message
        setTimeout(() => setGenerationStatus(''), 2000);
      } else {
        throw new Error('Invalid response format');
      }
      
    } catch (error) {
      console.error('Documentation generation error:', error);
      setGenerationStatus('');
      alert(`Failed to generate documentation: ${(error as Error).message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Copy JSON to clipboard
  const copyToClipboard = () => {
    if (!documentation) return;
    
    navigator.clipboard.writeText(JSON.stringify(documentation, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Export documentation
  const exportDocumentation = (format: 'json' | 'md' | 'pdf') => {
    if (!documentation || !selectedProject) return;

    const timestamp = new Date().toISOString().split('T')[0];
    
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(documentation, null, 2)], { type: 'application/json' });
      saveAs(blob, `${selectedProject.projectName}_documentation_${timestamp}.json`);
    } else if (format === 'md') {
      // Convert to Markdown format
      const markdownContent = generateMarkdown(documentation);
      const blob = new Blob([markdownContent], { type: 'text/markdown' });
      saveAs(blob, `${selectedProject.projectName}_documentation_${timestamp}.md`);
    } else if (format === 'pdf') {
      // Generate PDF
      generatePDF(documentation, selectedProject.projectName, timestamp);
    }
  };

  // Generate Markdown from documentation
  const generateMarkdown = (doc: DocumentationReport): string => {
    return `# ${doc.name}

**Version:** ${doc.version || 'N/A'}
**License:** ${doc.license || 'N/A'}

## Overall Summary
${doc.overall_summary}

## Contract Summary
${doc.summary}

## Description
${doc.description}

## Functions

${doc.functions.map(func => `### ${func.name} (${func.visibility})

${func.description}

**Parameters:**
${func.parameters.map(param => `- \`${param.name}\` (${param.type}): ${param.description}`).join('\n')}

${func.return_type ? `**Returns:**
- \`${func.return_type}\`: Return value` : ''}

${func.examples.length > 0 ? `**Examples:**
${func.examples.map(example => `\`\`\`\n${example}\n\`\`\``).join('\n')}` : ''}
`).join('\n')}

## Events/Structs

${doc.events.map(event => `### ${event.name}

${event.description}

**Fields:**
${event.fields.map(field => `- \`${field.name}\` (${field.type})`).join('\n')}
`).join('\n')}

## Variables/Constants

${doc.variables.map(variable => `### ${variable.name} (${variable.visibility})

**Type:** ${variable.type}
**Description:** ${variable.description}
`).join('\n')}`;
  };

  // Generate PDF from documentation
  const generatePDF = (doc: DocumentationReport, projectName: string, timestamp: string) => {
    const pdf = new jsPDF();
    let yPosition = 20;
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const maxLineWidth = pageWidth - 2 * margin;

    // Helper function to add text with automatic page breaks
    const addText = (text: string, fontSize: number = 12, isBold: boolean = false, color: [number, number, number] = [0, 0, 0]) => {
      pdf.setFontSize(fontSize);
      pdf.setTextColor(color[0], color[1], color[2]);
      if (isBold) {
        pdf.setFont(undefined, 'bold');
      } else {
        pdf.setFont(undefined, 'normal');
      }

      const lines = pdf.splitTextToSize(text, maxLineWidth);
      
      for (let i = 0; i < lines.length; i++) {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(lines[i], margin, yPosition);
        yPosition += fontSize * 0.5;
      }
      yPosition += 5; // Add some spacing after each section
    };

    // Helper function to add a colored section header
    const addSectionHeader = (title: string, color: [number, number, number] = [0, 0, 0]) => {
      yPosition += 10;
      addText(title, 16, true, color);
      yPosition += 5;
    };

    // Title Page
    pdf.setFillColor(41, 98, 255);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont(undefined, 'bold');
    pdf.text('Smart Contract Documentation', margin, 25);
    
    yPosition = 60;
    pdf.setTextColor(0, 0, 0);
    addText(doc.name, 20, true);
    yPosition += 10;

    // Basic Info
    addText(`Version: ${doc.version || 'N/A'}`, 12);
    addText(`License: ${doc.license || 'N/A'}`, 12);
    addText(`Generated: ${new Date().toLocaleDateString()}`, 12);
    yPosition += 15;

    // Description
    addSectionHeader('Description', [0, 100, 0]);
    addText(doc.description, 12);

    // Overall Summary
    if (doc.overall_summary) {
      addSectionHeader('Overall Summary', [255, 140, 0]);
      addText(doc.overall_summary, 12);
    }

    // Contract Summary
    addSectionHeader('Contract Summary', [0, 123, 255]);
    addText(doc.summary, 12);

    // Functions
    if (doc.functions.length > 0) {
      addSectionHeader('Functions', [128, 0, 128]);
      
      doc.functions.forEach((func, idx) => {
        addText(`${idx + 1}. ${func.name} (${func.visibility})`, 14, true);
        addText(func.description, 12);
        
        // Complexity Score
        if (func.complexity_score) {
          addText(`Complexity Score: ${func.complexity_score}`, 11, false, [255, 140, 0]);
        }
        
        // Source File
        if (func.source_file) {
          addText(`Source: ${func.source_file}`, 11, false, [128, 128, 128]);
        }
        
        // Security Notes
        if (func.security_notes && func.security_notes.length > 0) {
          addText('Security Notes:', 12, true, [255, 0, 0]);
          func.security_notes.forEach(note => {
            const noteText = typeof note === 'string' ? note : JSON.stringify(note);
            addText(`  ⚠ ${noteText}`, 11, false, [255, 0, 0]);
          });
        }
        
        // Parameters
        if (func.parameters.length > 0) {
          addText('Parameters:', 12, true);
          func.parameters.forEach(param => {
            addText(`  • ${param.name} (${param.type}): ${param.description}`, 11);
          });
        } else {
          addText('Parameters: None', 12);
        }
        
        // Return Type
        if (func.return_type) {
          addText(`Returns: ${func.return_type}`, 12, true);
        }
        
        // Examples
        if (func.examples && func.examples.length > 0) {
          addText('Examples:', 12, true);
          func.examples.forEach(example => {
            addText(`  ${example}`, 11, false, [0, 128, 0]);
          });
        }
        yPosition += 15;
      });
    }

    // Events & Structs
    if (doc.events && doc.events.length > 0) {
      addSectionHeader('Events & Structs', [0, 150, 0]);
      
      doc.events.forEach((event, idx) => {
        addText(`${idx + 1}. ${event.name}`, 14, true);
        addText(event.description, 12);
        
        // Purpose
        if (event.purpose) {
          addText(`Purpose: ${event.purpose}`, 12, false, [0, 100, 200]);
        }
        
        // Source File
        if (event.source_file) {
          addText(`Source: ${event.source_file}`, 11, false, [128, 128, 128]);
        }
        
        // Fields
        if (event.fields.length > 0) {
          addText('Fields:', 12, true);
          event.fields.forEach(field => {
            addText(`  • ${field.name}: ${field.type}`, 11);
          });
        }
        yPosition += 15;
      });
    }

    // Variables & Constants
    if (doc.variables && doc.variables.length > 0) {
      addSectionHeader('Variables & Constants', [150, 0, 150]);
      
      doc.variables.forEach((variable, idx) => {
        addText(`${idx + 1}. ${variable.name} (${variable.visibility})`, 14, true);
        addText(`Type: ${variable.type}`, 12);
        addText(variable.description, 12);
        
        // Source File
        if (variable.source_file) {
          addText(`Source: ${variable.source_file}`, 11, false, [128, 128, 128]);
        }
        
        // Security Implications
        if (variable.security_implications && variable.security_implications.length > 0) {
          addText('Security Implications:', 12, true, [255, 0, 0]);
          variable.security_implications.forEach(implication => {
            const implText = typeof implication === 'string' ? implication : JSON.stringify(implication);
            addText(`  ⚠ ${implText}`, 11, false, [255, 0, 0]);
          });
        }
        yPosition += 15;
      });
    }

    // Security Analysis
    if (doc.security_analysis) {
      addSectionHeader('Security Analysis', [255, 0, 0]);
      
      // Overall Risk
      addText(`Overall Risk Level: ${doc.security_analysis.overall_risk.toUpperCase()}`, 14, true, [255, 0, 0]);
      yPosition += 10;
      
      // Compliance Score
      if (doc.security_analysis.compliance_score !== undefined) {
        addText(`Compliance Score: ${doc.security_analysis.compliance_score}/10`, 12, true);
        yPosition += 5;
      }
      
      // Key Findings
      if (doc.security_analysis.key_findings && doc.security_analysis.key_findings.length > 0) {
        addText('Key Security Findings:', 14, true, [255, 0, 0]);
        doc.security_analysis.key_findings.forEach((finding, idx) => {
          let findingObj;
          try {
            findingObj = typeof finding === 'string' ? JSON.parse(finding) : finding;
          } catch {
            findingObj = { title: finding, severity: 'unknown' };
          }
          
          addText(`${idx + 1}. ${findingObj.title || `Finding #${idx + 1}`}`, 12, true);
          
          if (findingObj.severity) {
            addText(`   Severity: ${findingObj.severity.toUpperCase()}`, 11, false, [255, 140, 0]);
          }
          
          if (findingObj.location) {
            addText(`   Location: ${findingObj.location}`, 11);
          }
          
          if (findingObj.impact) {
            addText(`   Impact: ${findingObj.impact}`, 11);
          }
          
          if (findingObj.description && !findingObj.impact) {
            addText(`   Description: ${findingObj.description}`, 11);
          }
          
          yPosition += 5;
        });
      }
      
      // Recommendations
      if (doc.security_analysis.recommendations && doc.security_analysis.recommendations.length > 0) {
        addText('Security Recommendations:', 14, true, [0, 150, 0]);
        doc.security_analysis.recommendations.forEach((rec, idx) => {
          let recObj;
          try {
            recObj = typeof rec === 'string' ? JSON.parse(rec) : rec;
          } catch {
            recObj = { title: rec, priority: 'unknown' };
          }
          
          addText(`${idx + 1}. ${recObj.title || `Recommendation #${idx + 1}`}`, 12, true);
          
          if (recObj.priority) {
            addText(`   Priority: ${recObj.priority.toUpperCase()}`, 11, false, [255, 140, 0]);
          }
          
          if (recObj.description) {
            addText(`   Description: ${recObj.description}`, 11);
          }
          
          if (recObj.recommendation && !recObj.description) {
            addText(`   Recommendation: ${recObj.recommendation}`, 11);
          }
          
          yPosition += 5;
        });
      }
      
      // Audit Notes
      if (doc.security_analysis.audit_notes && doc.security_analysis.audit_notes.length > 0) {
        addText('Audit Notes:', 14, true, [0, 0, 255]);
        doc.security_analysis.audit_notes.forEach((note, idx) => {
          const noteText = typeof note === 'string' ? note : JSON.stringify(note);
          addText(`${idx + 1}. ${noteText}`, 11);
        });
      }
    }

    // Complexity Analysis
    if (doc.complexity_analysis) {
      addSectionHeader('Complexity Analysis', [128, 0, 128]);
      
      addText(`Total Complexity: ${doc.complexity_analysis.total_complexity}`, 12, true);
      addText(`Maintainability Score: ${doc.complexity_analysis.maintainability_score}/10`, 12, true);
      
      if (doc.complexity_analysis.high_complexity_functions.length > 0) {
        addText('High Complexity Functions:', 12, true, [255, 140, 0]);
        doc.complexity_analysis.high_complexity_functions.forEach((func, idx) => {
          addText(`${idx + 1}. ${func}`, 11);
        });
      }
    }

    // Quality Metrics
    if (doc.quality_metrics) {
      addSectionHeader('Quality Metrics', [0, 150, 150]);
      
      addText(`Documentation Coverage: ${doc.quality_metrics.documentation_coverage}%`, 12);
      addText(`Code Quality Score: ${doc.quality_metrics.code_quality_score}/10`, 12);
      addText(`Test Coverage Estimate: ${doc.quality_metrics.test_coverage_estimate}%`, 12);
    }

    // File Breakdown
    if (doc.file_breakdown && doc.file_breakdown.length > 1) {
      addSectionHeader('File Breakdown', [100, 100, 100]);
      
      doc.file_breakdown.forEach((file, idx) => {
        addText(`${idx + 1}. ${file.fileName} (${file.language})`, 12, true);
        addText(`   Functions: ${file.functions}`, 11);
        addText(`   Complexity: ${file.complexity}`, 11);
        addText(`   Risk Level: ${file.risk_level.toUpperCase()}`, 11, false, file.risk_level === 'high' ? [255, 0, 0] : file.risk_level === 'medium' ? [255, 140, 0] : [0, 150, 0]);
        yPosition += 5;
      });
    }

    // Footer
    yPosition = pageHeight - 20;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text(`Generated by LokaAudit on ${new Date().toLocaleDateString()}`, margin, yPosition);
    pdf.text(`Page ${pdf.internal.getCurrentPageInfo().pageNumber}`, pageWidth - margin - 20, yPosition);

    // Save the PDF
    pdf.save(`${projectName}_documentation_${timestamp}.pdf`);
  };

  // Filter projects based on search
  const filteredProjects = projects.filter(project => {
    return project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           project.developerId.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Format file size helper
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-screen bg-[#0A0F1C] text-white overflow-hidden">
      <Split
        className="flex h-screen"
        sizes={[50, 50]}
        minSize={250}
        gutterSize={10}
        gutterAlign="center"
        snapOffset={30}
        dragInterval={1}
        gutterStyle={() => ({
          backgroundColor: "#0F172A",
          cursor: "col-resize",
          width: "10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
        gutter={(index, direction) => {
          const element = document.createElement('div');
          element.innerHTML = `<div style="
            height: 30px;
            width: 4px;
            background: repeating-linear-gradient(
              to bottom,
              rgba(255,255,255,0.3) 0px,
              rgba(255,255,255,0.3) 2px,
              transparent 2px,
              transparent 4px
            );
            border-radius: 2px;
          "></div>`;
          return element;
        }}
      >
        {/* LEFT SECTION */}
        <div className="flex flex-col bg-[#0D1426] border-r border-[#1E293B] h-full overflow-hidden">
          <h1 className="text-2xl font-bold px-4 py-3 pt-5 border-b border-[#1E293B] text-blue-400 flex-shrink-0">
            Documentation Generator
          </h1>

          {/* Search */}
          <div className="px-4 py-3 flex-shrink-0">
            <div className="flex items-center bg-[#1E293B] rounded-md px-3 py-2 text-sm text-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none placeholder-gray-500"
              />
              <Filter size={18} className="text-gray-400 cursor-pointer hover:text-blue-400" />
            </div>
          </div>

          {/* Project List */}
          <div className="overflow-y-auto flex-1 min-h-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                <span className="ml-2 text-gray-400">Loading projects...</span>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <p className="text-red-400 mb-2">Error loading projects</p>
                  <p className="text-gray-500 text-sm">{error}</p>
                </div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="flex items-center justify-center p-8">
                <div className="text-center">
                  <FileText className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">No projects found</p>
                  <p className="text-gray-500 text-sm">
                    {searchTerm ? "Try adjusting your search" : "Upload some files to get started"}
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Table Header */}
                <div className="grid grid-cols-3 px-4 py-2 bg-[#1E293B] text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  <span className="text-left">Project Name</span>
                  <span className="text-center">Files</span>
                  <span className="text-right">Language</span>
                </div>

                {/* Table Rows */}
                {filteredProjects.map((proj) => (
                  <div
                    key={proj._id}
                    onClick={() => setSelectedProject(proj)}
                    className={`grid grid-cols-3 items-center px-4 py-3 cursor-pointer transition-colors border-b border-[#1E293B] 
            ${selectedProject?._id === proj._id
                        ? "bg-blue-900/30"
                        : "hover:bg-[#0F172A]"
                      }`}
                  >
                    {/* Project Name */}
                    <div className="flex items-center gap-2 text-left">
                      <Folder size={18} className="text-yellow-400" />
                      <div>
                        <span className="text-sm text-gray-200 block">{proj.projectName}</span>
                        <span className="text-xs text-gray-500">Dev: {proj.developerId}</span>
                      </div>
                    </div>

                    {/* File Count */}
                    <span className="text-xs text-gray-400 text-center">{proj.filesCount} files</span>

                    {/* Language */}
                    <span className="text-xs font-medium text-right text-blue-400">
                      {proj.language}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* RIGHT SECTION - Documentation Display */}
        <div className="bg-[#0B1121] flex flex-col h-full overflow-hidden">
          {!documentation ? (
            selectedProject ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="px-6 pt-6 pb-4 flex-shrink-0">
                  <h2 className="text-xl font-semibold text-blue-400 mb-4">
                    {selectedProject.projectName}
                  </h2>

                  {/* Project Metadata */}
                  <div className="bg-[#1E293B] rounded-lg p-4 mb-6">
                    <h3 className="text-sm font-medium text-gray-300 mb-3">Project Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Developer:</span>
                        <span className="text-gray-300 ml-2">{selectedProject.developerId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Language:</span>
                        <span className="text-gray-300 ml-2">{selectedProject.language}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Files:</span>
                        <span className="text-gray-300 ml-2">{selectedProject.filesCount}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Last Updated:</span>
                        <span className="text-gray-300 ml-2">{formatDate(selectedProject.lastUpdated)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Scrollable File Selection Area */}
                <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-0">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-300">Select Files for Documentation</h3>
                    {selectedFiles.size > 0 && (
                      <button
                        onClick={() => setSelectedFiles(new Set())}
                        className="text-xs text-blue-400 hover:text-blue-300 transition"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>

                  <div className="border border-[#1E293B] rounded-lg overflow-hidden mb-6">
                    {/* Table Header */}
                    <div className="grid grid-cols-4 bg-[#1E293B] text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">
                      <div className="col-span-2 flex items-center gap-2">
                        <input 
                          type="checkbox" 
                          className="accent-blue-500" 
                          checked={areAllFilesSelected()}
                          onChange={handleSelectAllFiles}
                        />
                        <span>Select All ({selectedFiles.size} selected)</span>
                      </div>
                      <div className="text-center">Size</div>
                      <div className="text-center">Date</div>
                    </div>

                    {/* Files List */}
                    {selectedProject.files && selectedProject.files.length > 0 ? (
                      selectedProject.files.map((file, idx) => (
                        <div
                          key={idx}
                          className={`grid grid-cols-4 items-center px-4 py-3 border-t border-[#1E293B] hover:bg-[#0F172A] transition ${
                            selectedFiles.has(idx) ? 'bg-blue-900/20' : ''
                          }`}
                        >
                          {/* File Name */}
                          <div className="col-span-2 flex items-center gap-2">
                            <input 
                              type="checkbox" 
                              className="accent-blue-500" 
                              checked={selectedFiles.has(idx)}
                              onChange={() => handleFileSelect(idx)}
                            />
                            <FileText size={16} className="text-blue-400" />
                            <span className="text-sm text-gray-300">{file.fileName}</span>
                          </div>

                          {/* File Size */}
                          <div className="text-xs text-gray-500 text-center">
                            {formatFileSize(file.size)}
                          </div>

                          {/* Upload Date */}
                          <div className="text-xs text-gray-400 text-center">
                            {formatDate(file.uploadDate)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        <FileText className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <p>No files found in this project</p>
                      </div>
                    )}
                  </div>

                  {/* Generate Documentation Button */}
                  <div className="space-y-2">
                    <button 
                      onClick={generateDocumentation}
                      disabled={selectedFiles.size === 0 || isGenerating}
                      className={`w-full py-3 rounded-md text-white font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
                        isGenerating 
                          ? 'bg-gradient-to-r from-blue-400 to-purple-500 animate-pulse shadow-lg shadow-blue-500/25' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-80 hover:shadow-lg hover:shadow-blue-500/25'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isGenerating ? (
                        <>
                          <div className="relative">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <div className="absolute inset-0 w-5 h-5 border border-white/30 rounded-full animate-ping"></div>
                          </div>
                          <span className="animate-pulse">Generating...</span>
                        </>
                      ) : (
                        <>
                          <BookOpen className="w-5 h-5" />
                          Generate Documentation
                        </>
                      )}
                    </button>
                    
                    {/* Status Message with Enhanced Animation */}
                    {generationStatus && (
                      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-blue-600/20 backdrop-blur-sm border border-blue-400/30 rounded-lg p-6 mt-4">
                        {/* Animated Background */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 animate-pulse"></div>
                        
                        {/* Main Content */}
                        <div className="relative z-10">
                          {/* Header with Icon */}
                          <div className="flex items-center justify-center gap-3 mb-4">
                            {isGenerating ? (
                              <div className="relative">
                                {/* Outer rotating ring */}
                                <div className="w-8 h-8 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                                {/* Inner pulsing dot */}
                                <div className="absolute inset-2 bg-blue-400 rounded-full animate-pulse"></div>
                              </div>
                            ) : (
                              <div className="relative">
                                <CheckCircle className="w-8 h-8 text-green-400 animate-bounce" />
                                {/* Success glow effect */}
                                <div className="absolute inset-0 w-8 h-8 bg-green-400/30 rounded-full animate-ping"></div>
                              </div>
                            )}
                            <h3 className="text-lg font-semibold text-white">
                              {isGenerating ? 'Generating Documentation...' : 'Generation Complete!'}
                            </h3>
                          </div>

                          {/* Status Text with Typewriter Effect */}
                          <p className="text-center text-blue-100 mb-4 font-medium">
                            <span className="inline-block">
                              {generationStatus}
                              {isGenerating && <span className="animate-pulse ml-1">|</span>}
                            </span>
                          </p>

                          {/* Progress Steps */}
                          {isGenerating && (
                            <div className="space-y-3">
                              {/* Step indicators */}
                              <div className="flex justify-between items-center text-xs text-gray-300">
                                <div className={`flex items-center gap-2 transition-all duration-500 ${
                                  generationStatus.includes('Initializing') ? 'text-blue-400 scale-110' : 
                                  generationStatus.includes('Fetching') || generationStatus.includes('Processing') ? 'text-green-400' : 'text-gray-500'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    generationStatus.includes('Initializing') ? 'bg-blue-400 animate-pulse' :
                                    generationStatus.includes('Fetching') || generationStatus.includes('Processing') ? 'bg-green-400' : 'bg-gray-500'
                                  }`}></div>
                                  Initialize
                                </div>
                                
                                <div className={`flex items-center gap-2 transition-all duration-500 ${
                                  generationStatus.includes('Fetching') ? 'text-blue-400 scale-110' : 
                                  generationStatus.includes('Processing') ? 'text-green-400' : 'text-gray-500'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    generationStatus.includes('Fetching') ? 'bg-blue-400 animate-pulse' :
                                    generationStatus.includes('Processing') ? 'bg-green-400' : 'bg-gray-500'
                                  }`}></div>
                                  Parse Code
                                </div>
                                
                                <div className={`flex items-center gap-2 transition-all duration-500 ${
                                  generationStatus.includes('Processing') ? 'text-blue-400 scale-110' : 'text-gray-500'
                                }`}>
                                  <div className={`w-2 h-2 rounded-full ${
                                    generationStatus.includes('Processing') ? 'bg-blue-400 animate-pulse' : 'bg-gray-500'
                                  }`}></div>
                                  AI Analysis
                                </div>
                              </div>

                              {/* Animated Progress Bar */}
                              <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 rounded-full animate-pulse"></div>
                                {/* Moving shimmer effect */}
                                <div className="absolute top-0 left-0 w-full h-full">
                                  <div className="w-8 h-full bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse transform translate-x-0 transition-transform duration-1000 ease-in-out"
                                       style={{
                                         animation: 'shimmer 2s infinite linear',
                                         transform: 'translateX(-100%)'
                                       }}>
                                  </div>
                                </div>
                              </div>
                              
                              {/* Add keyframes for shimmer */}
                              <style dangerouslySetInnerHTML={{
                                __html: `
                                  @keyframes shimmer {
                                    0% { transform: translateX(-100%); }
                                    100% { transform: translateX(400%); }
                                  }
                                `
                              }} />

                              {/* Floating Code Icons Animation */}
                              <div className="relative h-12 overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center">
                                  {[...Array(5)].map((_, i) => (
                                    <div
                                      key={i}
                                      className="absolute w-6 h-6 text-blue-400/60 animate-bounce"
                                      style={{
                                        left: `${20 + i * 15}%`,
                                        animationDelay: `${i * 0.2}s`,
                                        animationDuration: '1.5s'
                                      }}
                                    >
                                      {i % 3 === 0 ? '{}' : i % 3 === 1 ? '<>' : '()'}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Fun Facts with Smooth Transitions */}
                              <div className="text-center">
                                <p className="text-xs text-gray-400 italic transition-all duration-500 ease-in-out">
                                  {generationStatus.includes('Initializing') && (
                                    <span className="inline-flex items-center gap-1 animate-fade-in">
                                      🚀 <span className="animate-pulse">Warming up the AI engines...</span>
                                    </span>
                                  )}
                                  {generationStatus.includes('Fetching') && (
                                    <span className="inline-flex items-center gap-1 animate-fade-in">
                                      📖 <span className="animate-pulse">Reading your code like a detective...</span>
                                    </span>
                                  )}
                                  {generationStatus.includes('Processing') && (
                                    <span className="inline-flex items-center gap-1 animate-fade-in">
                                      🧠 <span className="animate-pulse">AI is analyzing patterns and security...</span>
                                    </span>
                                  )}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Particle Effect Overlay */}
                        {isGenerating && (
                          <div className="absolute inset-0 pointer-events-none">
                            {[...Array(8)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-1 h-1 bg-blue-400/40 rounded-full animate-pulse"
                                style={{
                                  left: `${Math.random() * 100}%`,
                                  top: `${Math.random() * 100}%`,
                                  animationDelay: `${Math.random() * 2}s`,
                                  animationDuration: `${2 + Math.random() * 2}s`
                                }}
                              ></div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 mb-2">Select a project</p>
                  <p className="text-gray-500 text-sm">Choose a project from the list to generate documentation</p>
                </div>
              </div>
            )
          ) : (
            /* Documentation Report Display */
            <div className="flex flex-col h-full overflow-hidden">
              {/* Header with Export Options */}
              <div className="flex items-center justify-between mb-6 px-6 pt-6 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setDocumentation(null)}
                    className="text-gray-400 hover:text-white transition"
                  >
                    ← Back
                  </button>
                  <h2 className="text-xl font-semibold text-blue-400">Documentation Report</h2>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={copyToClipboard}
                    className="flex items-center gap-2 px-3 py-2 bg-[#1E293B] rounded-lg text-gray-300 hover:text-white transition"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied!' : 'Copy JSON'}
                  </button>
                  
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 rounded-lg text-white hover:opacity-80 transition"
                    >
                      <Download className="w-4 h-4" />
                      Export
                      <svg
                        className={`w-4 h-4 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    
                    {showExportDropdown && (
                      <div className="absolute top-full right-0 mt-1 bg-[#1E293B] border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                        <button
                          onClick={() => {
                            exportDocumentation('json');
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                          <FileText className="w-4 h-4" />
                          JSON
                        </button>
                        <button
                          onClick={() => {
                            exportDocumentation('md');
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                          <FileDown className="w-4 h-4" />
                          Markdown
                        </button>
                        <button
                          onClick={() => {
                            exportDocumentation('pdf');
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 hover:bg-gray-700 flex items-center gap-2 text-gray-300 hover:text-white"
                        >
                          <FileText className="w-4 h-4" />
                          PDF
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Documentation Content */}
              <div className="flex-1 overflow-auto px-6 pb-6 min-h-0">
                {/* Contract Header */}
                <div className="bg-[#1E293B] rounded-lg p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Code className="w-8 h-8 text-blue-400" />
                    <div>
                      <h1 className="text-2xl font-bold text-white">{documentation.name}</h1>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300 text-sm">
                          {documentation.version || 'No version'}
                        </span>
                        <span className="px-2 py-1 bg-green-900/50 rounded text-green-300 text-sm">
                          {documentation.license || 'No license'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{documentation.description}</p>
                </div>

                {/* Overall Summary Section */}
                {documentation.overall_summary && (
                  <div className="bg-gradient-to-r from-yellow-900/20 to-orange-900/20 border border-yellow-500/30 rounded-lg p-6 mb-6">
                    <h2 className="text-lg font-semibold text-yellow-300 mb-3 flex items-center gap-2">
                      <BookOpen className="w-5 h-5" />
                      Overall Summary
                    </h2>
                    <p className="text-gray-200 leading-relaxed text-base">{documentation.overall_summary}</p>
                  </div>
                )}

                {/* Contract Summary Section */}
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
                  <h2 className="text-lg font-semibold text-blue-300 mb-3 flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Contract Summary
                  </h2>
                  <p className="text-gray-200 leading-relaxed text-base">{documentation.summary}</p>
                </div>

                {/* Functions Section */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Code className="w-5 h-5 text-blue-400" />
                    Functions
                  </h2>
                  <div className="space-y-4">
                    {documentation.functions.map((func, idx) => (
                      <div key={idx} className="bg-[#1E293B] rounded-lg p-4">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="font-mono text-white font-semibold">{func.name}</span>
                          <span className="px-2 py-1 bg-purple-900/50 rounded text-purple-300 text-xs">
                            {func.visibility}
                          </span>
                          {func.complexity_score && func.complexity_score > 10 && (
                            <span className="px-2 py-1 bg-orange-900/50 rounded text-orange-300 text-xs">
                              High Complexity ({func.complexity_score})
                            </span>
                          )}
                          {func.source_file && (
                            <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                              {func.source_file}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-300 mb-3">{func.description}</p>
                        
                        {/* Security Notes */}
                        {func.security_notes && func.security_notes.length > 0 && (
                          <div className="mb-3 p-3 bg-orange-900/20 border border-orange-500/30 rounded">
                            <h4 className="text-sm font-medium text-orange-400 mb-2">Security Notes:</h4>
                            <ul className="text-orange-300 text-sm space-y-1">
                              {func.security_notes.map((note, noteIdx) => (
                                <li key={noteIdx} className="flex items-start gap-2">
                                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  {typeof note === 'string' ? note : JSON.stringify(note)}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        <div className="space-y-3">
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Parameters:</h4>
                            {func.parameters.length > 0 ? func.parameters.map((param, pidx) => (
                              <div key={pidx} className="bg-[#0F172A] rounded p-3 mb-2">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-mono text-blue-400">_{param.name}</span>
                                  <span className="text-gray-500">({param.type})</span>
                                </div>
                                <p className="text-gray-400 text-sm">{param.description}</p>
                              </div>
                            )) : (
                              <p className="text-gray-500 text-sm italic">No parameters</p>
                            )}
                          </div>
                          
                          {func.return_type && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Returns:</h4>
                              <div className="bg-[#0F172A] rounded p-3">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-gray-500">({func.return_type})</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Examples */}
                          {func.examples && func.examples.length > 0 && (
                            <div>
                              <h4 className="text-sm font-medium text-gray-400 mb-2">Examples:</h4>
                              <div className="space-y-2">
                                {func.examples.map((example, exampleIdx) => (
                                  <div key={exampleIdx} className="bg-[#0F172A] rounded p-3">
                                    <code className="text-green-400 text-sm font-mono">{example}</code>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Events/Structs Section */}
                {documentation.events && documentation.events.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Info className="w-5 h-5 text-blue-400" />
                      Events & Structs
                    </h2>
                    <div className="space-y-4">
                      {documentation.events.map((event, idx) => (
                        <div key={idx} className="bg-[#1E293B] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <h3 className="text-white font-medium">{event.name}</h3>
                            {event.source_file && (
                              <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                                {event.source_file}
                              </span>
                            )}
                          </div>
                          <p className="text-gray-300 text-sm mb-3">{event.description}</p>
                          
                          {/* Purpose */}
                          {event.purpose && (
                            <div className="mb-3 p-3 bg-blue-900/20 border border-blue-500/30 rounded">
                              <span className="text-blue-400 text-sm font-medium">Purpose: </span>
                              <span className="text-blue-300 text-sm">{event.purpose}</span>
                            </div>
                          )}
                          
                          <div>
                            <h4 className="text-sm font-medium text-gray-400 mb-2">Fields:</h4>
                            <div className="space-y-2">
                              {event.fields.map((field, fieldIdx) => (
                                <div key={fieldIdx} className="bg-[#0F172A] rounded p-3">
                                  <div className="flex items-center gap-2">
                                    <span className="text-blue-400 font-mono">{field.name}</span>
                                    <span className="text-gray-500">({field.type})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variables/Constants Section */}
                {documentation.variables && documentation.variables.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Variables & Constants
                    </h2>
                    <div className="space-y-4">
                      {documentation.variables.map((variable, idx) => (
                        <div key={idx} className="bg-[#1E293B] rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-white font-medium">{variable.name}</span>
                            <span className={`px-2 py-1 rounded text-xs ${
                              variable.visibility === 'public' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {variable.visibility}
                            </span>
                            {variable.source_file && (
                              <span className="px-2 py-1 bg-gray-600 rounded text-xs text-gray-300">
                                {variable.source_file}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-gray-400 text-sm">Type:</span>
                            <span className="text-blue-400 font-mono text-sm">{variable.type}</span>
                          </div>
                          <p className="text-gray-300 text-sm">{variable.description}</p>
                          {variable.security_implications && variable.security_implications.length > 0 && (
                            <div className="mt-2">
                              <span className="text-orange-400 text-xs font-medium">Security Notes:</span>
                              <ul className="text-orange-300 text-xs ml-4 mt-1">
                                {variable.security_implications.map((note, noteIdx) => (
                                  <li key={noteIdx}>• {typeof note === 'string' ? note : JSON.stringify(note)}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Security Analysis Section */}
                {documentation.security_analysis && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-red-400" />
                      Security Analysis
                    </h2>
                    <div className="bg-[#1E293B] rounded-lg p-6 space-y-6">
                      {/* Risk Level Indicator */}
                      <div className="flex items-center justify-between bg-[#0F172A] rounded-lg p-4">
                        <div>
                          <span className="text-gray-400 text-sm block">Overall Risk Level</span>
                          <span className="text-white font-medium">Security Assessment</span>
                        </div>
                        <span className={`px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wide ${
                          documentation.security_analysis.overall_risk === 'high' 
                            ? 'bg-red-500 text-white' 
                            : documentation.security_analysis.overall_risk === 'medium'
                            ? 'bg-yellow-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}>
                          {documentation.security_analysis.overall_risk?.toUpperCase() || 'UNKNOWN'}
                        </span>
                      </div>

                      {/* Key Findings */}
                      {documentation.security_analysis.key_findings && documentation.security_analysis.key_findings.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            Key Security Findings ({documentation.security_analysis.key_findings.length})
                          </h4>
                          <div className="space-y-3">
                            {documentation.security_analysis.key_findings.map((finding, idx) => {
                              const findingObj = typeof finding === 'string' ? 
                                (() => {
                                  try {
                                    return JSON.parse(finding);
                                  } catch {
                                    return { title: finding, severity: 'unknown' };
                                  }
                                })() : finding;
                              
                              return (
                                <div key={idx} className="bg-[#0F172A] border-l-4 border-red-500 rounded-r-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="text-white font-medium text-sm">
                                      {findingObj.title || `Security Finding #${idx + 1}`}
                                    </h5>
                                    {findingObj.severity && (
                                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                                        findingObj.severity === 'high' 
                                          ? 'bg-red-900/50 text-red-300' 
                                          : findingObj.severity === 'medium'
                                          ? 'bg-yellow-900/50 text-yellow-300'
                                          : 'bg-blue-900/50 text-blue-300'
                                      }`}>
                                        {findingObj.severity}
                                      </span>
                                    )}
                                  </div>
                                  {findingObj.location && (
                                    <div className="mb-2">
                                      <span className="text-gray-400 text-xs font-medium">Location:</span>
                                      <span className="text-gray-300 text-xs ml-2">{findingObj.location}</span>
                                    </div>
                                  )}
                                  {findingObj.impact && (
                                    <div className="mb-2">
                                      <span className="text-gray-400 text-xs font-medium">Impact:</span>
                                      <p className="text-gray-300 text-xs mt-1 leading-relaxed">{findingObj.impact}</p>
                                    </div>
                                  )}
                                  {findingObj.description && !findingObj.impact && (
                                    <p className="text-gray-300 text-xs leading-relaxed">{findingObj.description}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {documentation.security_analysis.recommendations && documentation.security_analysis.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Security Recommendations ({documentation.security_analysis.recommendations.length})
                          </h4>
                          <div className="space-y-3">
                            {documentation.security_analysis.recommendations.map((rec, idx) => {
                              const recObj = typeof rec === 'string' ? 
                                (() => {
                                  try {
                                    return JSON.parse(rec);
                                  } catch {
                                    return { title: rec, priority: 'unknown' };
                                  }
                                })() : rec;
                              
                              return (
                                <div key={idx} className="bg-[#0F172A] border-l-4 border-green-500 rounded-r-lg p-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h5 className="text-white font-medium text-sm">
                                      {recObj.title || `Recommendation #${idx + 1}`}
                                    </h5>
                                    {recObj.priority && (
                                      <span className={`px-2 py-1 rounded text-xs font-medium uppercase ${
                                        recObj.priority === 'high' 
                                          ? 'bg-red-900/50 text-red-300' 
                                          : recObj.priority === 'medium'
                                          ? 'bg-yellow-900/50 text-yellow-300'
                                          : 'bg-green-900/50 text-green-300'
                                      }`}>
                                        {recObj.priority} Priority
                                      </span>
                                    )}
                                  </div>
                                  {recObj.description && (
                                    <p className="text-gray-300 text-xs leading-relaxed">{recObj.description}</p>
                                  )}
                                  {recObj.recommendation && !recObj.description && (
                                    <p className="text-gray-300 text-xs leading-relaxed">{recObj.recommendation}</p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Compliance Score */}
                      {documentation.security_analysis.compliance_score !== undefined && (
                        <div className="bg-[#0F172A] rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400 text-sm">Compliance Score</span>
                            <span className="text-white font-bold text-lg">
                              {documentation.security_analysis.compliance_score}/10
                            </span>
                          </div>
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                documentation.security_analysis.compliance_score >= 8 
                                  ? 'bg-green-500' 
                                  : documentation.security_analysis.compliance_score >= 6
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${(documentation.security_analysis.compliance_score / 10) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {/* Audit Notes */}
                      {documentation.security_analysis.audit_notes && documentation.security_analysis.audit_notes.length > 0 && (
                        <div>
                          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-400" />
                            Audit Notes
                          </h4>
                          <div className="bg-[#0F172A] rounded-lg p-4">
                            <ul className="space-y-2">
                              {documentation.security_analysis.audit_notes.map((note, idx) => (
                                <li key={idx} className="text-gray-300 text-xs flex items-start gap-2">
                                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-1.5 flex-shrink-0"></span>
                                  <span className="leading-relaxed">
                                    {typeof note === 'string' ? note : JSON.stringify(note)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Complexity Analysis Section */}
                {documentation.complexity_analysis && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Code className="w-5 h-5 text-purple-400" />
                      Complexity Analysis
                    </h2>
                    <div className="bg-[#1E293B] rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">Total Complexity</span>
                          <div className="text-2xl font-bold text-purple-300 mt-1">
                            {documentation.complexity_analysis.total_complexity}
                          </div>
                        </div>
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">High Complexity Functions</span>
                          <div className="text-2xl font-bold text-orange-300 mt-1">
                            {documentation.complexity_analysis.high_complexity_functions.length}
                          </div>
                        </div>
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">Maintainability Score</span>
                          <div className={`text-2xl font-bold mt-1 ${
                            documentation.complexity_analysis.maintainability_score >= 7 
                              ? 'text-green-300' 
                              : documentation.complexity_analysis.maintainability_score >= 5
                              ? 'text-yellow-300'
                              : 'text-red-300'
                          }`}>
                            {documentation.complexity_analysis.maintainability_score}/10
                          </div>
                        </div>
                      </div>

                      {documentation.complexity_analysis.high_complexity_functions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-gray-400 mb-2">High Complexity Functions:</h4>
                          <ul className="space-y-1">
                            {documentation.complexity_analysis.high_complexity_functions.map((func, idx) => (
                              <li key={idx} className="text-orange-300 text-sm font-mono bg-[#0F172A] rounded px-2 py-1">
                                {func}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Quality Metrics Section */}
                {documentation.quality_metrics && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      Quality Metrics
                    </h2>
                    <div className="bg-[#1E293B] rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">Documentation Coverage</span>
                          <div className="text-2xl font-bold text-blue-300 mt-1">
                            {documentation.quality_metrics.documentation_coverage}%
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${documentation.quality_metrics.documentation_coverage}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">Code Quality Score</span>
                          <div className={`text-2xl font-bold mt-1 ${
                            documentation.quality_metrics.code_quality_score >= 7 
                              ? 'text-green-300' 
                              : documentation.quality_metrics.code_quality_score >= 5
                              ? 'text-yellow-300'
                              : 'text-red-300'
                          }`}>
                            {documentation.quality_metrics.code_quality_score}/10
                          </div>
                          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                            <div 
                              className={`h-2 rounded-full ${
                                documentation.quality_metrics.code_quality_score >= 7 
                                  ? 'bg-green-500' 
                                  : documentation.quality_metrics.code_quality_score >= 5
                                  ? 'bg-yellow-500'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${documentation.quality_metrics.code_quality_score * 10}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="bg-[#0F172A] rounded p-4">
                          <span className="text-gray-400 text-sm">Test Coverage Est.</span>
                          <div className="text-2xl font-bold text-gray-300 mt-1">
                            {documentation.quality_metrics.test_coverage_estimate}%
                          </div>
                          <span className="text-xs text-gray-500">Requires test analysis</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* File Breakdown Section (for multi-file projects) */}
                {documentation.file_breakdown && documentation.file_breakdown.length > 1 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-blue-400" />
                      File Breakdown
                    </h2>
                    <div className="bg-[#1E293B] rounded-lg p-6">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-400 border-b border-gray-600">
                              <th className="text-left py-2">File</th>
                              <th className="text-left py-2">Language</th>
                              <th className="text-left py-2">Functions</th>
                              <th className="text-left py-2">Complexity</th>
                              <th className="text-left py-2">Risk Level</th>
                            </tr>
                          </thead>
                          <tbody>
                            {documentation.file_breakdown.map((file, idx) => (
                              <tr key={idx} className="border-b border-gray-700">
                                <td className="py-2 text-white font-mono">{file.fileName}</td>
                                <td className="py-2">
                                  <span className="px-2 py-1 bg-blue-900/50 rounded text-blue-300 text-xs">
                                    {file.language}
                                  </span>
                                </td>
                                <td className="py-2 text-gray-300">{file.functions}</td>
                                <td className="py-2 text-gray-300">{file.complexity}</td>
                                <td className="py-2">
                                  <span className={`px-2 py-1 rounded text-xs ${
                                    file.risk_level === 'high' 
                                      ? 'bg-red-900/50 text-red-300' 
                                      : file.risk_level === 'medium'
                                      ? 'bg-yellow-900/50 text-yellow-300'
                                      : 'bg-green-900/50 text-green-300'
                                  }`}>
                                    {file.risk_level}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Split>
    </div>
  );
}
