import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import User from '../../../../lib/db/models/User';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', req.url));
    }

    user.isEmailVerified = true;
    user.verificationToken = undefined;
    await user.save();

    return NextResponse.redirect(new URL('/login?verified=true', req.url));
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.redirect(new URL('/login?error=server_error', req.url));
  }
}
