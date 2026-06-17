import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/mongoose';
import Job from '@/lib/db/models/Job';
import User from '@/lib/db/models/User';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    let query: any = { isActive: true };

    const { userId } = await auth();
    if (userId) {
      const mongoUser = await User.findById(userId);
      if (mongoUser && mongoUser.role === 'recruiter') {
        query.recruiterId = userId;
      }
    }

    // Fetch jobs based on query, sorted by newest first
    const jobs = await Job.find(query).sort({ createdAt: -1 });
    
    return NextResponse.json({ success: true, jobs }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { title, description } = body;
    
    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }

    // Extract recruiterId from auth()
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const recruiterId = userId;
    
    // Generate a unique ID for the job
    const jobId = `REQ-${Math.floor(1000 + Math.random() * 9000)}`;
    
    const newJob = await Job.create({
      jobId,
      recruiterId,
      title,
      description,
      isActive: true
    });
    
    return NextResponse.json({ success: true, job: newJob }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating job:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
