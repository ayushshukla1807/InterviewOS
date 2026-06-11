import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required' }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase().trim();
    const cleanPassword = password.trim();
    
    // Hardcoded Demo & Founder Bypass
    if (
      (lowerEmail === 'demo.candidate@interviewos.com' && cleanPassword === 'demo1234') ||
      (lowerEmail === 'demo.recruiter@interviewos.com' && cleanPassword === 'demo1234') ||
      (lowerEmail === 'founder@interviewos.com' && cleanPassword === 'founder2026')
    ) {
      let role = 'candidate';
      let id = 'demo_candidate_id';
      let name = 'Demo Candidate';
      
      if (lowerEmail === 'demo.recruiter@interviewos.com') {
        role = 'recruiter';
        id = 'demo_recruiter_id';
        name = 'Demo Recruiter';
      } else if (lowerEmail === 'founder@interviewos.com') {
        role = 'founder';
        id = 'demo_founder_id';
        name = 'Founder Admin';
      }

      const demoUser = {
        id,
        name,
        email: lowerEmail,
        role,
        organization: role === 'candidate' ? '' : 'InterviewOS Core',
      };

      const token = jwt.sign(
        { id: demoUser.id, role: demoUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const response = NextResponse.json({
        token,
        user: demoUser
      });

      response.cookies.set('interviewos_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        path: '/',
      });

      return response;
    }

    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ message: 'Invalid email or password' }, { status: 401 });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        organization: user.organization,
      }
    });

    // Set HTTP-only cookie so middleware can guard routes
    response.cookies.set('interviewos_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (err) {
    console.error('[auth/login]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
