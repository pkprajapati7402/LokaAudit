// API Route: Manage Test Sessions
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { 
  getTestSessionsByDeveloper,
  getTestSessionsByProject,
  getSessionMetrics,
  cleanupOldSessions
} from '@/lib/database/models';
import { ValidationError } from '@/lib/types/test-types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const developerId = searchParams.get('developerId');
    const projectId = searchParams.get('projectId');
    const includeMetrics = searchParams.get('includeMetrics') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');
    
    console.log('📋 Fetching test sessions');
    
    let sessions;
    
    if (projectId) {
      sessions = await getTestSessionsByProject(projectId);
    } else if (developerId) {
      sessions = await getTestSessionsByDeveloper(developerId);
    } else {
      throw new ValidationError('Either developerId or projectId is required', 'query', '');
    }
    
    // Limit results
    const limitedSessions = sessions.slice(0, limit);
    
    let response: any = {
      sessions: limitedSessions,
      totalCount: sessions.length,
      limitApplied: limit < sessions.length
    };
    
    // Include metrics if requested
    if (includeMetrics) {
      const metrics = await getSessionMetrics(developerId || undefined);
      response.metrics = metrics;
    }
    
    console.log(`✅ Fetched ${limitedSessions.length} sessions`);
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('❌ Failed to fetch sessions:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json({
        error: error.message,
        field: error.field,
        value: error.value
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to fetch test sessions'
    }, { status: 500 });
  }
}

// DELETE method to cleanup old sessions
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const olderThanDays = parseInt(searchParams.get('olderThanDays') || '30');
    
    if (olderThanDays < 1 || olderThanDays > 365) {
      throw new ValidationError('olderThanDays must be between 1 and 365', 'olderThanDays', olderThanDays);
    }
    
    console.log(`🧹 Cleaning up sessions older than ${olderThanDays} days`);
    
    const deletedCount = await cleanupOldSessions(olderThanDays);
    
    console.log(`✅ Cleaned up ${deletedCount} old sessions`);
    
    return NextResponse.json({
      message: `Successfully cleaned up ${deletedCount} old sessions`,
      deletedCount,
      olderThanDays
    });
    
  } catch (error) {
    console.error('❌ Failed to cleanup sessions:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json({
        error: error.message,
        field: error.field,
        value: error.value
      }, { status: 400 });
    }
    
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to cleanup sessions'
    }, { status: 500 });
  }
}
