"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Split from "react-split";
import { Folder, FileText, Search, Filter, EyeIcon, Loader2, Download, PlayCircle, FileCheck } from "lucide-react";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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


export default function ReportsAndResults() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [status, setStatus] = useState<"all" | "completed" | "pending">("all");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isStartingAudit, setIsStartingAudit] = useState(false);

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
  }, [selectedProject]);

  const handleSelect = (value: "all" | "completed" | "pending") => {
    setStatus(value);
  };

  // Handle individual file selection
  const handleFileSelect = (fileName: string) => {
    const newSelectedFiles = new Set(selectedFiles);
    if (newSelectedFiles.has(fileName)) {
      newSelectedFiles.delete(fileName);
    } else {
      newSelectedFiles.add(fileName);
    }
    setSelectedFiles(newSelectedFiles);
  };

  // Handle select all files
  const handleSelectAllFiles = () => {
    if (!selectedProject || !selectedProject.files) return;
    
    const allFileNames = selectedProject.files.map(file => file.fileName);
    const newSelectedFiles = new Set(selectedFiles);
    
    // If all files are already selected, deselect all
    const allSelected = allFileNames.every(fileName => selectedFiles.has(fileName));
    
    if (allSelected) {
      // Deselect all
      allFileNames.forEach(fileName => newSelectedFiles.delete(fileName));
    } else {
      // Select all
      allFileNames.forEach(fileName => newSelectedFiles.add(fileName));
    }
    
    setSelectedFiles(newSelectedFiles);
  };

  // Check if all files are selected
  const areAllFilesSelected = () => {
    if (!selectedProject || !selectedProject.files) return false;
    const allFileNames = selectedProject.files.map(file => file.fileName);
    return allFileNames.length > 0 && allFileNames.every(fileName => selectedFiles.has(fileName));
  };

  // Filter projects based on search and status
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.developerId.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (status === "all") return matchesSearch;
    // For now, we'll treat all projects as completed since we don't have a status field
    // You can add a status field to your Project schema later
    return matchesSearch;
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

  // Generate audit report for selected files
  const generateAuditReport = async () => {
    if (!selectedProject) {
      alert('Please select a project first');
      return;
    }

    if (selectedFiles.size === 0) {
      alert('Please select at least one file to audit');
      return;
    }

    setIsStartingAudit(true);

    try {
      // Get file contents for selected files
      const selectedFileNames = Array.from(selectedFiles);
      const fileContents: { fileName: string; content: string; size: number; uploadDate: Date }[] = [];
      
      for (const fileName of selectedFileNames) {
        try {
          const content = await getFileContent(fileName);
          const file = selectedProject.files.find(f => f.fileName === fileName);
          fileContents.push({
            fileName,
            content,
            size: file?.size || content.length,
            uploadDate: file?.uploadDate ? new Date(file.uploadDate) : new Date()
          });
        } catch (error) {
          console.error(`Failed to get content for ${fileName}:`, error);
          throw new Error(`Failed to load file: ${fileName}`);
        }
      }

      // Store audit data in sessionStorage for the audit page
      const auditData = {
        projectId: selectedProject._id,
        projectName: selectedProject.projectName,
        developerId: selectedProject.developerId,
        language: selectedProject.language,
        files: fileContents,
        selectedFileNames: selectedFileNames,
        auditType: 'comprehensive',
        startAudit: true
      };

      sessionStorage.setItem('pendingAudit', JSON.stringify(auditData));

      // Navigate to audit page
      router.push('/audit?action=generate&source=reports');

    } catch (error) {
      console.error('Error preparing audit:', error);
      alert(error instanceof Error ? error.message : 'Failed to prepare audit');
    } finally {
      setIsStartingAudit(false);
    }
  };

  // Download individual file
  const downloadFile = async (fileName: string) => {
    if (!selectedProject) return;

    try {
      const url = `/api/download?projectName=${encodeURIComponent(selectedProject.projectName)}&developerId=${encodeURIComponent(selectedProject.developerId)}&fileName=${encodeURIComponent(fileName)}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      // Create blob and trigger download
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download file');
    }
  };

  // Get file content for ZIP creation
  const getFileContent = async (fileName: string): Promise<string> => {
    if (!selectedProject) throw new Error('No project selected');

    const url = `/api/download?projectName=${encodeURIComponent(selectedProject.projectName)}&developerId=${encodeURIComponent(selectedProject.developerId)}&fileName=${encodeURIComponent(fileName)}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${fileName}`);
    }
    
    return await response.text();
  };

  // Download selected files as ZIP
  const downloadSelectedFiles = async () => {
    if (!selectedProject || selectedFiles.size === 0) {
      alert('Please select files to download');
      return;
    }

    setIsDownloading(true);
    
    try {
      const zip = new JSZip();
      const selectedFileNames = Array.from(selectedFiles);
      
      // Add each selected file to the ZIP
      const filePromises = selectedFileNames.map(async (fileName) => {
        try {
          const content = await getFileContent(fileName);
          zip.file(fileName, content);
        } catch (error) {
          console.error(`Failed to add ${fileName} to ZIP:`, error);
          throw error;
        }
      });

      await Promise.all(filePromises);

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${selectedProject.projectName}_selected_files.zip`;
      
      saveAs(zipBlob, zipFileName);
      
      // Clear selection after successful download
      setSelectedFiles(new Set());
      
    } catch (error) {
      console.error('ZIP creation error:', error);
      alert('Failed to create ZIP file');
    } finally {
      setIsDownloading(false);
    }
  };

  // Download all files as ZIP
  const downloadAllFiles = async () => {
    if (!selectedProject || !selectedProject.files || selectedProject.files.length === 0) {
      alert('No files available to download');
      return;
    }

    setIsDownloading(true);

    try {
      const zip = new JSZip();
      
      // Add all files to the ZIP
      const filePromises = selectedProject.files.map(async (file) => {
        try {
          const content = await getFileContent(file.fileName);
          zip.file(file.fileName, content);
        } catch (error) {
          console.error(`Failed to add ${file.fileName} to ZIP:`, error);
          throw error;
        }
      });

      await Promise.all(filePromises);

      // Generate and download the ZIP file
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipFileName = `${selectedProject.projectName}_all_files.zip`;
      
      saveAs(zipBlob, zipFileName);
      
    } catch (error) {
      console.error('ZIP creation error:', error);
      alert('Failed to create ZIP file');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0F1C] text-white">
      <Split
        className="flex min-h-screen"
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
        <div className="flex flex-col bg-[#0D1426] border-r border-[#1E293B]">
          <h1 className="text-2xl font-bold px-4 py-3 pt-5 border-b border-[#1E293B] text-blue-400">
            Project History
          </h1>

          {/* Search */}
          <div className="px-4 py-3">
            <div className="flex items-center bg-[#1E293B] rounded-md px-3 py-2 text-sm text-gray-300 focus-within:ring-2 focus-within:ring-blue-500">
              <Search size={18} className="text-gray-400 mr-2" />
              <input
                type="text"
                placeholder="Search via Project Name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none placeholder-gray-500"
              />
              <Filter size={18} className="text-gray-400 cursor-pointer hover:text-blue-400" />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-3 px-4 py-2 border-b border-[#1E293B]">
            <button 
              onClick={() => handleSelect("all")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                status === "all" 
                  ? "bg-blue-600 text-white" 
                  : "bg-[#1E293B] text-blue-300 hover:bg-blue-900/40"
              }`}
            >
              All Projects
            </button>
            <button 
              onClick={() => handleSelect("completed")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                status === "completed" 
                  ? "bg-blue-600 text-white" 
                  : "bg-[#1E293B] hover:bg-blue-900/40"
              }`}
            >
              Completed
            </button>
            <button 
              onClick={() => handleSelect("pending")}
              className={`px-4 py-2 rounded-md text-sm transition ${
                status === "pending" 
                  ? "bg-blue-600 text-white" 
                  : "bg-[#1E293B] hover:bg-blue-900/40"
              }`}
            >
              Pending
            </button>
          </div>

          {/* Project List */}
          <div className="overflow-y-auto flex-1">
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
                  <span className="text-center">Modified</span>
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

                    {/* Modified Date */}
                    <span className="text-xs text-gray-400 text-center">{formatDate(proj.lastUpdated)}</span>

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

        {/* RIGHT SECTION */}
        <div className="p-6 bg-[#0B1121]">
          {selectedProject ? (
            <>
              <h2 className="text-xl font-semibold text-blue-400">
                {selectedProject.projectName}
              </h2>

              {/* Metadata */}
              <div className="mt-4 space-y-2 text-sm text-gray-300">
                <div>
                  ID : <span className="text-gray-500">{selectedProject._id}</span>
                </div>
                <div>
                  Created : <span className="text-gray-500">{formatDate(selectedProject.createdDate)}</span>
                </div>
                <div>
                  Developer ID : <span className="text-gray-500">{selectedProject.developerId}</span>
                </div>
                <div>
                  Last Updated : <span className="text-gray-500">{formatDate(selectedProject.lastUpdated)}</span>
                </div>
                <div>
                  Language : <span className="text-gray-500">{selectedProject.language}</span>
                </div>
                <div>
                  Total Files : <span className="text-gray-500">{selectedProject.filesCount}</span>
                </div>
              </div>

              {/* Project Status */}
              <div className="mt-6">
                <h3 className="mb-3 text-sm font-medium text-gray-300">Project Status</h3>
                <div className="flex gap-6">
                  {/* All */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === "all"}
                      onChange={() => handleSelect("all")}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">All</span>
                  </label>

                  {/* Pending */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === "pending"}
                      onChange={() => handleSelect("pending")}
                      className="accent-yellow-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Pending</span>
                  </label>

                  {/* Completed */}
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={status === "completed"}
                      onChange={() => handleSelect("completed")}
                      className="accent-green-500 w-4 h-4"
                    />
                    <span className="text-sm text-gray-300">Completed</span>
                  </label>
                </div>
              </div>

              {/* Files */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-gray-300">Project Files</h3>
                  {selectedFiles.size > 0 && (
                    <button
                      onClick={() => setSelectedFiles(new Set())}
                      className="text-xs text-blue-400 hover:text-blue-300 transition"
                    >
                      Clear Selection
                    </button>
                  )}
                </div>

                <div className="border border-[#1E293B] rounded-lg overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-3 md:grid-cols-5 bg-[#1E293B] text-xs font-semibold text-gray-400 uppercase tracking-wide px-4 py-2">
                    <div className="col-span-2 flex items-center gap-2">
                      <input 
                        type="checkbox" 
                        className="accent-blue-500" 
                        checked={areAllFilesSelected()}
                        onChange={handleSelectAllFiles}
                      />
                      <span>Select All Files ({selectedFiles.size} selected)</span>
                    </div>
                    <div className="hidden md:block text-center">Size</div>
                    <div className="text-center">Upload Date</div>
                    <div className="text-center">Action</div>
                  </div>

                  {/* Files List */}
                  {selectedProject.files && selectedProject.files.length > 0 ? (
                    selectedProject.files.map((file, idx) => (
                      <div
                        key={idx}
                        className={`grid grid-cols-3 md:grid-cols-5 items-center px-4 py-2 border-t border-[#1E293B] hover:bg-[#0F172A] transition ${
                          selectedFiles.has(file.fileName) ? 'bg-blue-900/20' : ''
                        }`}
                      >
                        {/* File Name */}
                        <div className="col-span-2 flex items-center gap-2">
                          <input 
                            type="checkbox" 
                            className="accent-blue-500" 
                            checked={selectedFiles.has(file.fileName)}
                            onChange={() => handleFileSelect(file.fileName)}
                          />
                          <FileText size={16} className="text-blue-400" />
                          <span className="text-sm text-gray-300">{file.fileName}</span>
                        </div>

                        {/* File Size */}
                        <div className="hidden md:block text-xs text-gray-500 text-center">
                          {formatFileSize(file.size)}
                        </div>

                        {/* Upload Date */}
                        <div className="flex items-center justify-center gap-1">
                          <span className="text-xs text-gray-400">{formatDate(file.uploadDate)}</span>
                        </div>

                        {/* Action */}
                        <div className="flex justify-center">
                          <button 
                            onClick={() => downloadFile(file.fileName)}
                            className="p-1 rounded-md hover:bg-blue-600/20 transition"
                            title="Download file"
                          >
                            <Download className="w-5 h-5 text-blue-400" />
                          </button>
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
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex gap-4">
                <button 
                  onClick={selectedFiles.size > 0 ? downloadSelectedFiles : downloadAllFiles}
                  disabled={isDownloading}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-500 py-2 rounded-md text-white font-medium hover:opacity-80 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isDownloading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Creating ZIP...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      {selectedFiles.size > 0 
                        ? `Download Selected (${selectedFiles.size})` 
                        : 'Download All Files'
                      }
                    </>
                  )}
                </button>
                
                <button 
                  onClick={generateAuditReport}
                  disabled={isStartingAudit || selectedFiles.size === 0}
                  className={`flex-1 py-2 rounded-md text-white font-medium transition flex items-center justify-center gap-2 ${
                    selectedFiles.size === 0 
                      ? 'bg-gray-600 cursor-not-allowed opacity-50' 
                      : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-80'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isStartingAudit ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Starting Audit...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="w-4 h-4" />
                      Generate Report {selectedFiles.size > 0 && `(${selectedFiles.size} files)`}
                    </>
                  )}
                </button>
              </div>

              {/* File Selection Helper */}
              {selectedFiles.size === 0 && (
                <div className="mt-4 p-3 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-yellow-400" />
                    <p className="text-sm text-yellow-200">
                      Please select files from the list above to generate an audit report
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Folder className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Select a project</p>
                <p className="text-gray-500 text-sm">Choose a project from the list to view details and generate audit reports</p>
              </div>
            </div>
          )}
        </div>
      </Split>
    </div>
  );
}
