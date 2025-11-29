"use client";

import React, { useState, useEffect } from 'react';
import Split from "react-split";
import JSZip from 'jszip';
import { 
  Search, 
  ChevronRight, 
  ChevronDown, 
  Play, 
  Plus, 
  Download, 
  FileText, 
  Folder, 
  Calendar,
  Tag,
  CheckCircle,
  XCircle,
  Code,
  Zap,
  Shield,
  BarChart3,
  Filter,
  Settings,
  Clock,
  User,
  Check
} from 'lucide-react';

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

const TestCasePage = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [timelineFilter, setTimelineFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [selectedTimeFilters, setSelectedTimeFilters] = useState<string[]>(['all']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['all']);
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [selectedTestType, setSelectedTestType] = useState('functional');
  const [expandedCategories, setExpandedCategories] = useState({
    recent: true,
    categories: true,
    tags: true
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [testsGenerated, setTestsGenerated] = useState(false);
  const [testsExecuted, setTestsExecuted] = useState(false);
  const [generatedTests, setGeneratedTests] = useState<any[]>([]);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string | null>(null);

  // Show download status for a few seconds
  const showDownloadStatus = (message: string) => {
    setDownloadStatus(message);
    setTimeout(() => setDownloadStatus(null), 3000);
  };

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
      } catch (error) {
        console.error('Error fetching projects:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.filter-dropdown')) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isFilterDropdownOpen]);

  const files = [
    { id: 1, name: 'token.rs', path: 'src/token.rs', type: 'rust', size: '2.4kb' },
    { id: 2, name: 'market.rs', path: 'src/market.rs', type: 'rust', size: '5.1kb' },
    { id: 3, name: 'utils.rs', path: 'src/utils.rs', type: 'rust', size: '1.2kb' }
  ];

  const testTypes = [
    { 
      id: 'functional', 
      name: 'Functional Tests', 
      icon: Code, 
      description: 'Test individual functions',
      ranking: 1, // Highest priority - core functionality
      colors: {
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        borderHover: 'hover:border-emerald-400',
        text: 'text-emerald-400',
        bgSelected: 'bg-emerald-500/20',
        borderSelected: 'border-emerald-500'
      }
    },
    { 
      id: 'security', 
      name: 'Security Tests', 
      icon: Shield, 
      description: 'Test for vulnerabilities',
      ranking: 1, // High priority - security critical
      colors: {
        bg: 'bg-red-500/10',
        border: 'border-red-500/30',
        borderHover: 'hover:border-red-400',
        text: 'text-red-400',
        bgSelected: 'bg-red-500/20',
        borderSelected: 'border-red-500'
      }
    },
    { 
      id: 'integration', 
      name: 'Integration Tests', 
      icon: Zap, 
      description: 'Test component interactions',
      ranking: 3, // Medium priority - component interactions
      colors: {
        bg: 'bg-amber-500/10',
        border: 'border-amber-500/30',
        borderHover: 'hover:border-amber-400',
        text: 'text-amber-400',
        bgSelected: 'bg-amber-500/20',
        borderSelected: 'border-amber-500'
      }
    },
    { 
      id: 'performance', 
      name: 'Performance Tests', 
      icon: BarChart3, 
      description: 'Test execution efficiency',
      ranking: 4, // Lower priority - optimization
      colors: {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/30',
        borderHover: 'hover:border-purple-400',
        text: 'text-purple-400',
        bgSelected: 'bg-purple-500/20',
        borderSelected: 'border-purple-500'
      }
    }
  ];

  const logs = [
    { id: 1, type: 'info', message: 'Test environment initialized', timestamp: '10:30:25' },
    { id: 2, type: 'success', message: 'Unit test: transfer_tokens - PASSED', timestamp: '10:30:28' },
    { id: 3, type: 'error', message: 'Security test: overflow_check - FAILED', timestamp: '10:30:31' },
    { id: 4, type: 'info', message: 'Performance test: batch_transfer - PASSED', timestamp: '10:30:34' }
  ];

  const toggleCategory = (category: keyof typeof expandedCategories) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // Filter projects based on search, timeline, and language (multi-select)
  const filteredProjects = projects.filter(project => {
    const searchMatch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       project.developerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!searchMatch) return false;
    
    // Language filter (multi-select)
    const languageMatch = selectedLanguages.includes('all') || 
                         selectedLanguages.some(lang => project.language.toLowerCase() === lang.toLowerCase());
    
    if (!languageMatch) return false;
    
    // Timeline filter (multi-select)
    if (selectedTimeFilters.includes('all')) return true;
    
    const projectDate = new Date(project.lastUpdated);
    const now = new Date();
    
    return selectedTimeFilters.some(filter => {
      switch (filter) {
        case "recent":
          const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
          return projectDate >= threeDaysAgo;
        case "week":
          const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return projectDate >= weekAgo;
        case "month":
          const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          return projectDate >= monthAgo;
        default:
          return true;
      }
    });
  });

  // Get unique languages from projects
  const availableLanguages = projects.reduce((languages: string[], project) => {
    if (!languages.includes(project.language)) {
      languages.push(project.language);
    }
    return languages;
  }, []);

  // Handle time filter selection
  const handleTimeFilterChange = (filterId: string) => {
    if (filterId === 'all') {
      setSelectedTimeFilters(['all']);
    } else {
      setSelectedTimeFilters(prev => {
        const newFilters = prev.filter(f => f !== 'all');
        if (newFilters.includes(filterId)) {
          const updated = newFilters.filter(f => f !== filterId);
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...newFilters, filterId];
        }
      });
    }
  };

  // Handle language filter selection
  const handleLanguageFilterChange = (language: string) => {
    if (language === 'all') {
      setSelectedLanguages(['all']);
    } else {
      setSelectedLanguages(prev => {
        const newLanguages = prev.filter(l => l !== 'all');
        if (newLanguages.includes(language)) {
          const updated = newLanguages.filter(l => l !== language);
          return updated.length === 0 ? ['all'] : updated;
        } else {
          return [...newLanguages, language];
        }
      });
    }
  };

  // Handle file selection
  const handleFileSelection = (fileName: string) => {
    setSelectedFiles(prev => {
      if (prev.includes(fileName)) {
        return prev.filter(f => f !== fileName);
      } else {
        return [...prev, fileName];
      }
    });
  };

  // Handle select all files
  const handleSelectAllFiles = () => {
    if (!selectedFile?.files) return;
    
    const allFileNames = selectedFile.files.map(f => f.fileName);
    if (selectedFiles.length === allFileNames.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(allFileNames);
    }
  };

  // Clear selected files when project changes
  useEffect(() => {
    setSelectedFiles([]);
    setTestsGenerated(false);
    setTestsExecuted(false);
    setGeneratedTests([]);
    setTestResults([]);
  }, [selectedFile]);

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

  const handleGenerateTests = async () => {
    if (!selectedFile || selectedFiles.length === 0) return;
    
    setIsGenerating(true);
    setTestsExecuted(false);
    setTestResults([]);
    setGenerationError(null);
    setCurrentSessionId(null);
    
    try {
      console.log('🚀 Starting test generation');
      console.log('Selected file:', selectedFile);
      console.log('Selected files:', selectedFiles);
      console.log('Test type:', selectedTestType);
      
      // Detect language from file extensions
      const language = selectedFiles[0].endsWith('.rs') ? 'rust' : 'move';
      console.log('Detected language:', language);
      
      // Add developerId as query parameter for the API
      const url = `/api/tests/generate?developerId=${encodeURIComponent(selectedFile.developerId)}`;
      console.log('Request URL:', url);
      
      const requestBody = {
        projectId: selectedFile.projectName,
        selectedFiles,
        testType: selectedTestType,
        language,
        options: {
          includeEdgeCases: true,
          generateMockData: false,
          complexity: 'intermediate'
        }
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      const result = await response.json();
      console.log('Server response:', result);
      console.log('Response status:', response.status, response.statusText);
      
      if (!response.ok) {
        console.error('Server error details:', result);
        throw new Error(result.error || result.message || 'Failed to generate tests');
      }
      
      console.log('✅ Test generation completed:', result);
      
      setCurrentSessionId(result.sessionId);
      setGeneratedTests(result.generatedTests);
      setTestsGenerated(true);
      
      if (result.status === 'partial' && result.errorMessage) {
        setGenerationError(`Partial success: ${result.errorMessage}`);
      }
      
    } catch (error) {
      console.error('❌ Test generation failed:', error);
      setGenerationError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTests = async () => {
    if (!testsGenerated || !currentSessionId) return;
    
    setIsRunning(true);
    setExecutionError(null);
    
    try {
      console.log('🏃 Starting test execution');
      
      const response = await fetch('/api/tests/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          timeoutMs: 60000, // 1 minute timeout
          maxMemoryMB: 512
        })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to execute tests');
      }
      
      console.log('✅ Test execution completed:', result);
      
      setTestResults(result.results);
      setTestsExecuted(true);
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      setExecutionError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsRunning(false);
    }
  };

  // Export data function - updated to handle direct download of generated tests
  const exportData = async (type: 'tests' | 'results', format: 'json' | 'md' | 'pdf') => {
    try {
      if (type === 'tests' && testsGenerated && generatedTests.length > 0) {
        // Direct download of generated tests without API call
        const exportData = {
          sessionId: currentSessionId,
          timestamp: new Date().toISOString(),
          project: {
            name: selectedFile?.projectName,
            developerId: selectedFile?.developerId,
            language: selectedFile?.language,
            selectedFiles: selectedFiles
          },
          testType: selectedTestType,
          generatedTests: generatedTests,
          summary: {
            totalTests: generatedTests.length,
            testTypes: [...new Set(generatedTests.map(test => test.type))],
            filesProcessed: selectedFiles.length
          }
        };
        
        // Create and download the JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test-cases-${selectedFile?.projectName?.replace(/\s+/g, '-')}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        console.log(`✅ Test cases exported successfully`);
        showDownloadStatus(`✅ Downloaded: test-cases-${selectedFile?.projectName?.replace(/\s+/g, '-')}.json`);
        return;
      }
      
      // For results, try the API if session exists
      if (!currentSessionId) {
        console.warn('No session ID available for export');
        return;
      }
      
      const response = await fetch('/api/tests/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId: currentSessionId,
          format,
          includeSourceCode: type === 'tests',
          includeTestResults: type === 'results',
          includeMetrics: true
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Export failed');
      }
      
      // Download the file
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from response headers
      const contentDisposition = response.headers.get('content-disposition');
      const filename = contentDisposition?.match(/filename="([^"]+)"/)?.[1] || 
                      `export-${currentSessionId}-${Date.now()}.${format}`;
      
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`✅ Export completed: ${filename}`);
      
    } catch (error) {
      console.error('❌ Export failed:', error);
      alert(`Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // New function to download individual test case
  const downloadIndividualTest = (test: any, index: number) => {
    const exportData = {
      timestamp: new Date().toISOString(),
      project: {
        name: selectedFile?.projectName,
        developerId: selectedFile?.developerId,
        language: selectedFile?.language
      },
      testCase: test,
      metadata: {
        testIndex: index,
        testType: selectedTestType,
        fileName: test.fileName || 'Generated Test'
      }
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-case-${test.name?.replace(/\s+/g, '-') || 'test'}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Individual test case exported: ${test.name}`);
    showDownloadStatus(`✅ Downloaded: ${test.name || 'test'}.json`);
  };

  // New function to download test code only
  const downloadTestCode = (test: any) => {
    const blob = new Blob([test.code || '// No code available'], { 
      type: 'text/plain' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // Determine file extension based on language
    const language = selectedFile?.language?.toLowerCase() || 'rust';
    const extension = language === 'rust' ? 'rs' : language === 'move' ? 'move' : 'txt';
    
    a.download = `${test.name?.replace(/\s+/g, '_') || 'test_code'}.${extension}`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Test code exported: ${test.name}`);
    showDownloadStatus(`✅ Downloaded: ${test.name || 'test'} code file`);
  };

  // New function to export all tests as a single zip file
  const exportAllTestsAsZip = async () => {
    try {
      const zip = new JSZip();
      
      // Create the main data object
      const exportData = {
        sessionId: currentSessionId,
        timestamp: new Date().toISOString(),
        project: {
          name: selectedFile?.projectName,
          developerId: selectedFile?.developerId,
          language: selectedFile?.language,
          selectedFiles: selectedFiles
        },
        testType: selectedTestType,
        generatedTests: generatedTests,
        summary: {
          totalTests: generatedTests.length,
          testTypes: [...new Set(generatedTests.map(test => test.type))],
          filesProcessed: selectedFiles.length
        }
      };
      
      // Add the main JSON file
      zip.file("test-cases.json", JSON.stringify(exportData, null, 2));
      
      // Add individual test files
      generatedTests.forEach((test, index) => {
        const language = selectedFile?.language?.toLowerCase() || 'rust';
        const extension = language === 'rust' ? 'rs' : language === 'move' ? 'move' : 'txt';
        const fileName = `tests/${test.name?.replace(/\s+/g, '_') || `test_${index}`}.${extension}`;
        zip.file(fileName, test.code || '// No code available');
      });
      
      // Generate and download the zip file
      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = `test-cases-${selectedFile?.projectName?.replace(/\s+/g, '-')}-${Date.now()}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      
      console.log(`✅ All tests exported as zip successfully`);
      showDownloadStatus(`✅ Downloaded: test-cases-${selectedFile?.projectName?.replace(/\s+/g, '-')}.zip`);
    } catch (error) {
      console.error('❌ Failed to create zip file:', error);
      showDownloadStatus(`❌ Failed to create zip file`);
    }
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-200 font-inter overflow-hidden">
      <Split
        className="flex h-screen"
        sizes={[30, 40, 30]}
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
            opacity: 0.7;
          "></div>`;
          element.addEventListener('mouseenter', () => {
            element.style.backgroundColor = '#1E293B';
          });
          element.addEventListener('mouseleave', () => {
            element.style.backgroundColor = '#0F172A';
          });
          return element;
        }}
      >
        {/* Left Sidebar - Search, Filters & Projects */}
        <div className="bg-slate-900/50 border-r border-slate-800 overflow-y-auto flex flex-col h-full custom-scrollbar">
          <div className="p-4">
            <h2 className="text-lg font-semibold text-blue-300 mb-4 flex items-center gap-2">
              <Folder className="w-5 h-5" />
              Projects
            </h2>
            
            {/* Search Bar */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or developer..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-800/50 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            {/* Filter Section with Dropdown */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filters
                </h3>
                
                {/* Select Options Dropdown */}
                <div className="relative filter-dropdown">
                  <button
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-700/50 transition-colors"
                  >
                    <span className="text-slate-300">Select options</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isFilterDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50">
                      {/* Time Section */}
                      <div className="p-3 border-b border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">Time</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          {[
                            { id: 'all', label: 'All Projects' },
                            { id: 'recent', label: 'Recent' },
                            { id: 'week', label: 'Past 7 Days' },
                            { id: 'month', label: 'Last Month' }
                          ].map((filter) => (
                            <label key={filter.id} className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={selectedTimeFilters.includes(filter.id)}
                                  onChange={() => handleTimeFilterChange(filter.id)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 transition-all ${
                                  selectedTimeFilters.includes(filter.id)
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-slate-600 group-hover:border-slate-500'
                                }`}>
                                  {selectedTimeFilters.includes(filter.id) && (
                                    <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-slate-300 group-hover:text-slate-200">
                                {filter.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Language Section */}
                      <div className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Code className="w-3 h-3 text-slate-400" />
                            <span className="text-xs font-medium text-slate-300">Language</span>
                          </div>
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </div>
                        <div className="space-y-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <div className="relative">
                              <input
                                type="checkbox"
                                checked={selectedLanguages.includes('all')}
                                onChange={() => handleLanguageFilterChange('all')}
                                className="sr-only"
                              />
                              <div className={`w-4 h-4 rounded border-2 transition-all ${
                                selectedLanguages.includes('all')
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-slate-600 group-hover:border-slate-500'
                              }`}>
                                {selectedLanguages.includes('all') && (
                                  <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                                )}
                              </div>
                            </div>
                            <span className="text-xs text-slate-300 group-hover:text-slate-200">
                              All Languages
                            </span>
                          </label>
                          
                          {/* Static language options */}
                          {['Rust', 'Move'].map((language) => (
                            <label key={language} className="flex items-center gap-2 cursor-pointer group">
                              <div className="relative">
                                <input
                                  type="checkbox"
                                  checked={selectedLanguages.includes(language)}
                                  onChange={() => handleLanguageFilterChange(language)}
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 transition-all ${
                                  selectedLanguages.includes(language)
                                    ? 'bg-blue-500 border-blue-500'
                                    : 'border-slate-600 group-hover:border-slate-500'
                                }`}>
                                  {selectedLanguages.includes(language) && (
                                    <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                                  )}
                                </div>
                              </div>
                              <span className="text-xs text-slate-300 group-hover:text-slate-200">
                                {language}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Projects List */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-slate-300">Available Projects</h3>
                <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">
                  {filteredProjects.length}
                </span>
              </div>
              
              {loading ? (
                <div className="flex items-center justify-center p-8">
                  <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="ml-2 text-slate-400 text-sm">Loading projects...</span>
                </div>
              ) : error ? (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-red-400 text-sm">Error loading projects</p>
                  <p className="text-slate-500 text-xs mt-1">{error}</p>
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center p-6">
                  <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 text-sm mb-1">No projects found</p>
                  <p className="text-slate-500 text-xs">
                    {searchTerm ? "Try adjusting your search" : "Upload some files to get started"}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredProjects.map((project) => (
                    <button
                      key={project._id}
                      onClick={() => setSelectedFile(project)}
                      className={`w-full p-3 rounded-lg border transition-all ${
                        selectedFile?._id === project._id
                          ? 'border-blue-500 bg-blue-500/10'
                          : 'border-slate-700 hover:border-slate-600 bg-slate-800/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Folder className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                          <div className="text-left flex-1 min-w-0">
                            <div className="font-medium text-sm text-slate-200 truncate">
                              {project.projectName}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <User className="w-3 h-3 text-slate-500" />
                              <span className="text-xs text-slate-400 truncate">
                                {project.developerId}
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Updated: {formatDate(project.lastUpdated)}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 ml-2">
                          <span className="text-xs text-slate-400">
                            {project.filesCount} files
                          </span>
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            project.language.toLowerCase() === 'rust' 
                              ? 'bg-orange-500/20 text-orange-300' 
                              : project.language.toLowerCase() === 'move'
                              ? 'bg-purple-500/20 text-purple-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}>
                            {project.language}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Middle Section - Test Configuration */}
        <div className="bg-slate-900/30 overflow-y-auto flex flex-col h-full custom-scrollbar">
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-blue-300 mb-4 flex items-center gap-2">
                <Code className="w-6 h-6" />
                Test Cases
              </h2>
              
              {/* Selected Project Info */}
              {selectedFile && (
                <div className="mb-6 p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                  <h3 className="text-sm font-medium text-slate-300 mb-2">Selected Project</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-slate-200">{selectedFile.projectName}</div>
                      <div className="text-sm text-slate-400">
                        Developer: {selectedFile.developerId} • {selectedFile.filesCount} files • {selectedFile.language}
                      </div>
                    </div>
                    <span className={`text-xs px-3 py-1 rounded-full ${
                      selectedFile.language.toLowerCase() === 'rust' 
                        ? 'bg-orange-500/20 text-orange-300' 
                        : selectedFile.language.toLowerCase() === 'move'
                        ? 'bg-purple-500/20 text-purple-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}>
                      {selectedFile.language}
                    </span>
                  </div>
                </div>
              )}

              {!selectedFile && (
                <div className="mb-6 p-6 bg-slate-800/20 border border-slate-700 rounded-lg text-center">
                  <Code className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                  <p className="text-slate-400 mb-1">No project selected</p>
                  <p className="text-slate-500 text-sm">Choose a project from the left sidebar to generate test cases</p>
                </div>
              )}
            </div>

            {/* File Selection Section */}
            {selectedFile && selectedFile.files && selectedFile.files.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-slate-300">Select Files for Testing</h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAllFiles}
                      className={`text-xs px-3 py-1 rounded-md transition-colors ${
                        selectedFiles.length === selectedFile.files.length
                          ? 'bg-blue-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {selectedFiles.length === selectedFile.files.length ? 'Deselect All' : 'Select All'}
                    </button>
                    <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">
                      {selectedFiles.length}/{selectedFile.files.length}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                  {selectedFile.files.map((file, idx) => (
                    <label key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-700 hover:border-slate-600 bg-slate-800/30 cursor-pointer transition-all">
                      <div className="relative">
                        <input
                          type="checkbox"
                          checked={selectedFiles.includes(file.fileName)}
                          onChange={() => handleFileSelection(file.fileName)}
                          className="sr-only"
                        />
                        <div className={`w-4 h-4 rounded border-2 transition-all ${
                          selectedFiles.includes(file.fileName)
                            ? 'bg-blue-500 border-blue-500'
                            : 'border-slate-600 hover:border-slate-500'
                        }`}>
                          {selectedFiles.includes(file.fileName) && (
                            <Check className="w-3 h-3 text-white absolute top-0.5 left-0.5 transform scale-75" />
                          )}
                        </div>
                      </div>
                      
                      <FileText className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-200 truncate">
                          {file.fileName}
                        </div>
                        <div className="text-xs text-slate-400">
                          Size: {formatFileSize(file.size)} • Uploaded: {formatDate(file.uploadDate)}
                        </div>
                      </div>
                      
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        file.fileName.endsWith('.rs')
                          ? 'bg-orange-500/20 text-orange-300'
                          : file.fileName.endsWith('.move')
                          ? 'bg-purple-500/20 text-purple-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}>
                        {file.fileName.split('.').pop()?.toUpperCase()}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Test Type Selection */}
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-300 mb-3">Test Type</h3>
              <div className="grid grid-cols-2 gap-3">
                {testTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = selectedTestType === type.id;
                  return (
                    <button
                      key={type.id}
                      onClick={() => setSelectedTestType(type.id)}
                      className={`p-3 rounded-lg border transition-all ${
                        isSelected
                          ? `${type.colors.borderSelected} ${type.colors.bgSelected}`
                          : `${type.colors.border} ${type.colors.bg} ${type.colors.borderHover}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-5 h-5 ${type.colors.text}`} />
                        <div className="text-left">
                          <div className="font-medium text-sm text-slate-200">{type.name}</div>
                          <div className="text-xs text-slate-400">{type.description}</div>
                        </div>
                      </div>
                      
                      {/* Priority Indicator */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-1">
                          {Array.from({ length: 5 }, (_, i) => (
                            <div
                              key={i}
                              className={`w-1.5 h-1.5 rounded-full ${
                                i < (6 - type.ranking) ? type.colors.text.replace('text-', 'bg-') : 'bg-slate-600'
                              }`}
                            />
                          ))}
                        </div>
                        <span className={`text-xs font-medium ${type.colors.text}`}>
                          {type.ranking === 1 ? 'Critical' : 
                           type.ranking === 2 ? 'High' :
                           type.ranking === 3 ? 'Medium' : 'Low'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleGenerateTests}
                disabled={!selectedFile || selectedFiles.length === 0 || isGenerating}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg transition-colors font-medium"
              >
                <Zap className="w-4 h-4" />
                {isGenerating ? 'Generating...' : `Generate Tests (${selectedFiles.length} files)`}
              </button>
              
              <button
                onClick={handleRunTests}
                disabled={!selectedFile || selectedFiles.length === 0 || !testsGenerated || isRunning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:text-slate-400 rounded-lg transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Running...' : testsGenerated ? `Run Tests (${selectedFiles.length} files)` : 'Generate Tests First'}
              </button>
            </div>
          </div>
        </div>

        {/* Right Section - Logs & Reports */}
        <div className="bg-slate-900/50 border-l border-slate-800 overflow-y-auto flex flex-col h-full custom-scrollbar">
          <div className="p-4 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-blue-300 flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Logs & Reports
              </h2>
              
              {/* Export Options */}
              {(testsGenerated || testsExecuted) && (
                <div className="flex gap-2 flex-wrap">
                  {testsGenerated && (
                    <>
                      <button 
                        onClick={exportAllTestsAsZip}
                        className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        title="Download all tests as ZIP file"
                      >
                        <Download className="w-3 h-3" />
                        All Test JSON
                      </button>
                      
                      <button 
                        onClick={handleRunTests}
                        disabled={isRunning || !testsGenerated}
                        className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                          isRunning || !testsGenerated
                            ? 'bg-gray-600 cursor-not-allowed text-gray-300'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                        title="Run all generated tests"
                      >
                        <Play className="w-3 h-3" />
                        {isRunning ? 'Running...' : 'Run Tests'}
                      </button>
                    </>
                  )}
                  
                  {testsExecuted && (
                    <>
                      <button 
                        onClick={() => exportData('results', 'json')}
                        className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        title="Download test results as JSON"
                      >
                        <Download className="w-3 h-3" />
                        Results JSON
                      </button>
                      <button 
                        onClick={() => exportData('results', 'md')}
                        className="px-3 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors flex items-center gap-1"
                        title="Download test results as Markdown"
                      >
                        <Download className="w-3 h-3" />
                        MD Report
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Content based on state */}
            {downloadStatus && (
              <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                <div className="text-green-400 text-sm">{downloadStatus}</div>
              </div>
            )}

            {!testsGenerated && !testsExecuted && (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <Code className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">No Data Available</h3>
                <p className="text-slate-400 text-sm">
                  Generate test cases to see test information and logs here
                </p>
              </div>
            )}

            {/* Generated Test Cases View */}
            {testsGenerated && !testsExecuted && (
              <div className="space-y-4">
                {generationError && (
                  <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                    <div className="text-yellow-400 text-sm font-medium mb-1">Generation Warning</div>
                    <div className="text-yellow-300 text-xs">{generationError}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">Generated Test Cases</h3>
                  <span className="text-xs bg-blue-600/20 text-blue-300 px-2 py-1 rounded-full">
                    {generatedTests.length} tests
                  </span>
                </div>
                
                <div className="space-y-3">
                  {generatedTests.map((test, index) => (
                    <div key={`${test.name}-${test.type}-${index}`} className="p-3 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-200">{test.fileName || 'Generated Test'}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{test.type} test</span>
                          
                          {/* Individual download buttons */}
                          <div className="flex gap-1">
                            <button
                              onClick={() => downloadIndividualTest(test, index)}
                              className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded transition-colors"
                              title="Download this test as JSON"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => downloadTestCode(test)}
                              className="p-1 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded transition-colors"
                              title="Download test code file"
                            >
                              <Code className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="p-2 bg-slate-700/30 rounded text-xs">
                        <div className="font-medium text-slate-300">{test.name}</div>
                        <div className="text-slate-400 text-xs mt-1">{test.description}</div>
                        {test.metadata && (
                          <div className="flex gap-2 mt-2">
                            <span className="text-xs bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">
                              Complexity: {test.metadata.complexity}/10
                            </span>
                            <span className="text-xs bg-blue-500/20 text-blue-300 px-1 py-0.5 rounded">
                              Priority: {test.metadata.priority}/5
                            </span>
                          </div>
                        )}
                        
                        {/* Preview of test code */}
                        {test.code && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                              View Test Code
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-800/50 rounded text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap">
                              {test.code.length > 500 ? test.code.substring(0, 500) + '\n\n... (truncated)' : test.code}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Test Results View */}
            {testsExecuted && (
              <div className="space-y-4">
                {executionError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                    <div className="text-red-400 text-sm font-medium mb-1">Execution Error</div>
                    <div className="text-red-300 text-xs">{executionError}</div>
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-slate-300">Test Results</h3>
                  <span className="text-xs bg-green-600/20 text-green-300 px-2 py-1 rounded-full">
                    {testResults.length} tests
                  </span>
                </div>

                {/* Overall Summary */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                    <div className="text-lg font-semibold text-green-400">
                      {testResults.filter(r => r.status === 'passed').length}
                    </div>
                    <div className="text-xs text-green-300">Passed</div>
                  </div>
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
                    <div className="text-lg font-semibold text-red-400">
                      {testResults.filter(r => r.status === 'failed' || r.status === 'error').length}
                    </div>
                    <div className="text-xs text-red-300">Failed</div>
                  </div>
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
                    <div className="text-lg font-semibold text-blue-400">
                      {testResults.reduce((acc, result) => acc + result.executionTime, 0)}ms
                    </div>
                    <div className="text-xs text-blue-300">Duration</div>
                  </div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg text-center">
                    <div className="text-lg font-semibold text-purple-400">
                      🐳
                    </div>
                    <div className="text-xs text-purple-300">Docker</div>
                  </div>
                </div>
                
                {/* Execution Info */}
                <div className="p-3 bg-slate-800/40 border border-slate-700 rounded-lg mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-medium text-slate-300">🐳 Execution Environment</span>
                    <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded">
                      Docker Container
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-300">Runtime:</span> Rust + Solana SDK
                    </div>
                    <div>
                      <span className="text-slate-300">Isolation:</span> Containerized
                    </div>
                    <div>
                      <span className="text-slate-300">Memory Limit:</span> 512MB
                    </div>
                    <div>
                      <span className="text-slate-300">CPU Limit:</span> 1 Core
                    </div>
                  </div>
                </div>
                
                {/* Detailed Results */}
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={`result-${result.testId || result.fileName || 'test'}-${index}`} className="p-4 bg-slate-800/30 border border-slate-700 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-slate-200">
                          {result.name || result.testName || result.fileName || `Test ${index + 1}`}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                            result.status === 'passed' 
                              ? 'bg-green-500/20 text-green-300' 
                              : result.status === 'failed'
                              ? 'bg-red-500/20 text-red-300'
                              : 'bg-yellow-500/20 text-yellow-300'
                          }`}>
                            {result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️'}
                            {result.status}
                          </span>
                          <span className="text-xs text-slate-400">{result.executionTime}ms</span>
                          <span className="text-xs bg-purple-500/20 text-purple-300 px-1 py-0.5 rounded">🐳</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="text-xs text-slate-300 font-medium">
                          {result.message || 'Test completed'}
                        </div>
                        
                        {/* Docker execution output */}
                        {result.output && (
                          <div className="text-xs text-slate-400 bg-slate-900/40 p-2 rounded font-mono">
                            {result.output}
                          </div>
                        )}
                        
                        {result.error && (
                          <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-2">
                            <div className="font-medium mb-1">🚫 Error Details:</div>
                            <pre className="whitespace-pre-wrap font-mono">{result.error}</pre>
                          </div>
                        )}
                        
                        {/* Docker logs preview */}
                        {result.dockerLogs && (
                          <details className="mt-2">
                            <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300 flex items-center gap-1">
                              🐳 Docker Execution Logs
                            </summary>
                            <pre className="mt-2 p-2 bg-slate-900/40 rounded text-xs text-slate-400 overflow-x-auto whitespace-pre-wrap max-h-32 overflow-y-auto">
                              {typeof result.dockerLogs === 'string' 
                                ? result.dockerLogs.length > 1000 
                                  ? result.dockerLogs.substring(0, 1000) + '\n\n... (truncated)' 
                                  : result.dockerLogs
                                : 'Docker execution completed successfully'
                              }
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Split>
    </div>
  );
};

export default TestCasePage;