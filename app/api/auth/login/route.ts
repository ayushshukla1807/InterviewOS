import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import Session from '../../../../lib/db/models/Session';

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
      let name = 'Demo Candidate';
      
      if (lowerEmail === 'demo.recruiter@interviewos.com') {
        role = 'recruiter';
        name = 'Demo Recruiter';
      } else if (lowerEmail === 'founder@interviewos.com') {
        role = 'founder';
        name = 'Founder Admin';
      }

      await connectDB();
      let dbUser = await User.findOne({ email: lowerEmail });
      if (!dbUser) {
        dbUser = await User.create({
          name,
          email: lowerEmail,
          password: await bcrypt.hash(cleanPassword, 10),
          role: role as 'candidate' | 'recruiter' | 'founder',
          organization: role === 'candidate' ? '' : 'InterviewOS Core',
          isEmailVerified: true
        });
      }

      // Check if MFA is enabled
      if (dbUser.mfaEnabled && dbUser.mfaSecret) {
        const tempToken = jwt.sign(
          { id: dbUser._id.toString(), mfaTemp: true },
          JWT_SECRET,
          { expiresIn: '5m' }
        );
        return NextResponse.json({
          mfaRequired: true,
          tempToken,
          email: dbUser.email
        });
      }

      const token = jwt.sign(
        { id: dbUser._id.toString(), role: dbUser.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userAgent = req.headers.get('user-agent') || 'Unknown Device';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';

      await Session.create({
        userId: dbUser._id,
        token: token.split('.').pop(),
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
      });

      const response = NextResponse.json({
        token,
        user: {
          id: dbUser._id.toString(),
          name: dbUser.name,
          email: dbUser.email,
          role: dbUser.role,
          organization: dbUser.organization,
        }
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

    // Check if MFA is enabled
    if (user.mfaEnabled && user.mfaSecret) {
      const tempToken = jwt.sign(
        { id: user._id.toString(), mfaTemp: true },
        JWT_SECRET,
        { expiresIn: '5m' }
      );
      return NextResponse.json({
        mfaRequired: true,
        tempToken,
        email: user.email
      });
    }

    const token = jwt.sign(
      { id: user._id.toString(), role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const userAgent = req.headers.get('user-agent') || 'Unknown Device';
    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';

    await Session.create({
      userId: user._id,
      token: token.split('.').pop(),
      userAgent,
      ipAddress,
      lastActiveAt: new Date(),
    });

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
