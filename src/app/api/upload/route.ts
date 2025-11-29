import { NextRequest, NextResponse } from 'next/server';
import { saveProject, Project } from '@/lib/mongodb';

// Helper function to get file extension from language/network
function getFileExtensionFromLanguage(language: string): string {
  const extensionMap: { [key: string]: string } = {
    'Solana (Rust)': '.rs',
    'Near (Rust)': '.rs',
    'Aptos (Move)': '.move',
    'Sui (Move)': '.move',
    'StarkNet (Cairo)': '.cairo',
    'Rust': '.rs',
    'Move': '.move',
    'Cairo': '.cairo'
  };
  return extensionMap[language] || '.rs';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    
    const projectName = formData.get('projectName') as string;
    const developerId = formData.get('developerId') as string;
    const language = formData.get('language') as string;
    const date = formData.get('date') as string;
    const uploadType = formData.get('uploadType') as string;
    const code = formData.get('code') as string;
    
    if (!projectName || !developerId || !language) {
      return NextResponse.json(
        { error: 'Missing required fields: projectName, developerId, or language' },
        { status: 400 }
      );
    }

    let projectFiles;

    if (uploadType === 'code' && code) {
      // Handle pasted code upload
      const fileExtension = getFileExtensionFromLanguage(language);
      const fileName = `${projectName.replace(/\s+/g, '_').toLowerCase()}${fileExtension}`;
      
      projectFiles = [{
        fileName,
        content: code,
        size: code.length,
        uploadDate: new Date()
      }];
    } else {
      // Handle file uploads
      const files = formData.getAll('files') as File[];
      
      if (files.length === 0) {
        return NextResponse.json(
          { error: 'No files uploaded' },
          { status: 400 }
        );
      }

      // Process files and convert to ProjectFile format
      projectFiles = await Promise.all(
        files.map(async (file) => {
          const content = await file.text();
          return {
            fileName: file.name,
            content,
            size: file.size,
            uploadDate: new Date()
          };
        })
      );
    }

    // Prepare project data
    const projectData: Omit<Project, '_id' | 'lastUpdated'> = {
      projectName,
      developerId,
      language,
      createdDate: new Date(date),
      files: projectFiles
    };

    // Save to MongoDB
    const result = await saveProject(projectData);

    return NextResponse.json({
      success: true,
      message: result.updated 
        ? `Code added to existing project "${projectName}"` 
        : `New project "${projectName}" created successfully`,
      projectId: result.projectId,
      filesCount: projectFiles.length,
      updated: result.updated,
      uploadType: uploadType || 'files'
    });

  } catch (error) {
    console.error('Error saving project:', error);
    return NextResponse.json(
      { error: 'Failed to save project' },
      { status: 500 }
    );
  }
}
