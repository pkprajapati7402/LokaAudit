import { NextRequest, NextResponse } from 'next/server';
import { AuditJobQueue } from '@/lib/audit/job-queue';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get('jobId');

  if (!jobId) {
    return NextResponse.json(
      { error: 'jobId parameter is required' },
      { status: 400 }
    );
  }

  try {
    const jobQueue = AuditJobQueue.getInstance();
    const job = await jobQueue.getJobStatus(jobId);
    const stages = await jobQueue.getJobStages(jobId);

    if (!job) {
      return NextResponse.json(
        { error: 'Job not found' },
        { status: 404 }
      );
    }

    // Calculate detailed progress
    const completedStages = stages.filter(s => s.status === 'completed').length;
    const totalStages = stages.length;
    const detailedProgress = totalStages > 0 ? (completedStages / totalStages) * 100 : 0;

    const currentStage = stages.find(s => s.status === 'running') || 
                        stages.find(s => s.status === 'pending');

    const response = {
      jobId: job.jobId,
      projectId: job.projectId,
      status: job.status,
      stage: job.stage,
      progress: job.progress,
      detailedProgress: Math.round(detailedProgress),
      currentStage: currentStage?.stage || 'completed',
      estimatedTimeRemaining: calculateEstimatedTime(stages),
      stages: stages.map(stage => ({
        name: stage.stage,
        status: stage.status,
        startTime: stage.startTime,
        endTime: stage.endTime,
        duration: stage.duration,
        findings: stage.metadata?.findings || 0
      })),
      createdAt: job.createdAt,
      updatedAt: job.updatedAt
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Failed to get job progress:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve job progress' },
      { status: 500 }
    );
  }
}

function calculateEstimatedTime(stages: any[]): number {
  const runningStage = stages.find(s => s.status === 'running');
  if (!runningStage || !runningStage.startTime) return 0;

  const elapsedTime = Date.now() - runningStage.startTime.getTime();
  const avgStageTime = 30000; // 30 seconds average per stage
  const remainingStages = stages.filter(s => s.status === 'pending').length;
  
  return remainingStages * avgStageTime;
}
