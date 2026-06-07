import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import nodemailer from 'nodemailer';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

export async function POST(req: Request) {
  try {
    const { name, email, password, role, organization } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ message: 'Name, email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ message: 'Password must be at least 6 characters' }, { status: 400 });
    }

    await connectDB();

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return NextResponse.json({ message: 'An account with this email already exists' }, { status: 409 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: role || 'candidate',
      organization: organization || '',
      verificationToken,
      isEmailVerified: false,
    });

    await newUser.save();

    // Send verification email using Ethereal (Zero cost for testing)
    nodemailer.createTestAccount((err, account) => {
      if (err) {
        console.error('Failed to create a testing account. ' + err.message);
        return;
      }
      const transporter = nodemailer.createTransport({
        host: account.smtp.host,
        port: account.smtp.port,
        secure: account.smtp.secure,
        auth: {
          user: account.user,
          pass: account.pass
        }
      });

      const verifyUrl = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3000'}/api/auth/verify?token=${verificationToken}`;

      transporter.sendMail({
        from: '"InterviewOS" <no-reply@interviewos.com>',
        to: email,
        subject: 'Verify your InterviewOS Account',
        text: `Please verify your email by clicking the following link: ${verifyUrl}`,
        html: `<p>Please verify your email by clicking the following link:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`
      }, (err, info) => {
        if (err) {
          console.log('Error occurred. ' + err.message);
          return;
        }
        console.log('Message sent: %s', info.messageId);
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
      });
    });

    const token = jwt.sign(
      { id: newUser._id.toString(), role: newUser.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    const response = NextResponse.json({
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        organization: newUser.organization,
      }
    }, { status: 201 });

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
    console.error('[auth/register]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
