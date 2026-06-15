import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../lib/db/models/User';

export async function GET(req: Request) {
  const urlObj = new URL(req.url);
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || urlObj.host;
  const proto = req.headers.get('x-forwarded-proto') || 'http';
  const origin = `${proto}://${host}`;

  const token = urlObj.searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', origin));
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', origin));
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.redirect(new URL('/login?verified=true', origin));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', origin));
  }
}
