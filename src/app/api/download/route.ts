import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('projectName');
    const developerId = searchParams.get('developerId');
    const fileName = searchParams.get('fileName');

    if (!projectName || !developerId || !fileName) {
      return NextResponse.json(
        { error: 'Missing required parameters: projectName, developerId, or fileName' },
        { status: 400 }
      );
    }

    // Get the specific project
    const project = await getProject(projectName, developerId);
    
    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Find the specific file
    const file = project.files.find(f => f.fileName === fileName);
    
    if (!file) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      );
    }

    // Return file content as downloadable
    const headers = new Headers();
    headers.set('Content-Type', 'application/octet-stream');
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    
    return new NextResponse(file.content, { headers });

  } catch (error) {
    console.error('Error downloading file:', error);
    return NextResponse.json(
      { error: 'Failed to download file' },
      { status: 500 }
    );
  }
}
