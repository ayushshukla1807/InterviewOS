import { NextResponse } from 'next/server';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';

// Configure nodemailer transporter using environment variables
const smtpHost = process.env.SMTP_HOST || '';
const smtpPort = parseInt(process.env.SMTP_PORT || '587');
const smtpUser = process.env.SMTP_USER || '';
const smtpPass = process.env.SMTP_PASS || '';
const smtpFrom = process.env.SMTP_FROM || 'InterviewOS <no-reply@interviewos.ai>';

let transporter: nodemailer.Transporter | null = null;
if (smtpHost && smtpUser && smtpPass) {
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function POST(req: Request) {
  try {
    const { action, email, token, password } = await req.json();

    if (!action) {
      return NextResponse.json({ message: 'Action is required' }, { status: 400 });
    }

    await connectDB();

    // ─── 1. REQUEST RESET LINK ────────────────────────────────────────────────
    if (action === 'request') {
      if (!email) {
        return NextResponse.json({ message: 'Email address is required' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Return 200/success for security reasons to prevent email enumeration attacks
        return NextResponse.json({ success: true, message: 'If that email exists in our records, a recovery link has been dispatched.' });
      }

      // Generate secure token
      const rawToken = crypto.randomBytes(32).toString('hex');
      // Simple hash storage (SHA-256)
      const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

      user.resetPasswordToken = hashedToken;
      user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour expiration
      await user.save();

      const urlObj = new URL(req.url);
      const resetUrl = `${urlObj.origin}/login?resetToken=${rawToken}&email=${encodeURIComponent(user.email)}`;

      console.log(`\n======================================================`);
      console.log(`🔑 PASSWORD RESET REQUESTED FOR: ${user.email}`);
      console.log(`🔗 RESET LINK: ${resetUrl}`);
      console.log(`======================================================\n`);

      let emailSent = false;
      if (transporter) {
        try {
          await transporter.sendMail({
            from: smtpFrom,
            to: user.email,
            subject: 'Reset your InterviewOS account password',
            text: `We received a request to reset your password. Click the link below to set a new password:\n\n${resetUrl}\n\nIf you did not request this, you can ignore this email.`,
            html: `
              <div style="font-family: sans-serif; padding: 24px; max-width: 600px; margin: auto; background: #0b0f19; color: #f3f4f6; border-radius: 12px;">
                <h2 style="color: #10b981;">InterviewOS Security</h2>
                <p>We received a request to reset the password for your account.</p>
                <p>Click the button below to configure a new password:</p>
                <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #10b981; color: #020617; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 16px 0;">Configure New Password</a>
                <p style="font-size: 12px; color: #6b7280;">If you cannot click the button, copy and paste this URL into your browser:<br/>${resetUrl}</p>
                <p style="font-size: 11px; color: #4b5563; border-top: 1px solid #1e293b; padding-top: 16px; margin-top: 24px;">This link will expire in 1 hour. If you did not make this request, you can safely ignore this mail.</p>
              </div>
            `,
          });
          emailSent = true;
        } catch (mailErr) {
          console.error('Failed to dispatch password recovery email:', mailErr);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'If that email exists in our records, a recovery link has been dispatched.',
        // Expose url in development for easy offline testing without SMTP servers
        developmentLink: process.env.NODE_ENV !== 'production' ? resetUrl : undefined,
        emailSent,
      });
    }

    // ─── 2. RESET PASSWORD ──────────────────────────────────────────────────
    if (action === 'reset') {
      if (!email || !token || !password) {
        return NextResponse.json({ message: 'Email, token, and new password are required' }, { status: 400 });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user || !user.resetPasswordToken || !user.resetPasswordExpires) {
        return NextResponse.json({ message: 'Invalid or expired password reset request' }, { status: 400 });
      }

      // Check token expiration
      if (new Date(user.resetPasswordExpires).getTime() < Date.now()) {
        return NextResponse.json({ message: 'Password reset token has expired. Please request a new one.' }, { status: 400 });
      }

      // Hash raw token and check match
      const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
      if (user.resetPasswordToken !== hashedToken) {
        return NextResponse.json({ message: 'Invalid or expired password reset token' }, { status: 400 });
      }

      // Update password
      user.password = await bcrypt.hash(password.trim(), 10);
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      return NextResponse.json({ success: true, message: 'Password updated successfully! You can now log in.' });
    }

    return NextResponse.json({ message: 'Invalid action parameter' }, { status: 400 });

  } catch (err: any) {
    console.error('[auth/reset-password]', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
