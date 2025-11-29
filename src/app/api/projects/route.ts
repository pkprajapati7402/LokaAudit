import { NextRequest, NextResponse } from 'next/server';
import { getAllProjects, getProject } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developerId');
    const projectName = searchParams.get('projectName');

    if (projectName && developerId) {
      // Get specific project
      const project = await getProject(projectName, developerId);
      
      if (!project) {
        return NextResponse.json(
          { error: 'Project not found' },
          { status: 404 }
        );
      }
      
      return NextResponse.json({ project });
    } else {
      // Get all projects (optionally filtered by developer ID)
      const projects = await getAllProjects(developerId || undefined);
      
      return NextResponse.json({ 
        projects: projects.map(project => ({
          ...project,
          filesCount: project.files.length,
          // Don't send file content in list view for performance
          files: project.files.map(file => ({
            fileName: file.fileName,
            size: file.size,
            uploadDate: file.uploadDate
          }))
        }))
      });
    }

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}
