import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import Session from '../../../../lib/db/models/Session';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

// ─── Base32 Encoding/Decoding Helper Functions ────────────────────────────────
function generateBase32Secret(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = crypto.randomBytes(16);
  let secret = '';
  for (let i = 0; i < bytes.length; i++) {
    secret += chars[bytes[i] % 32];
  }
  return secret;
}

function base32Decode(base32: string): Buffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const clean = base32.toUpperCase().replace(/=+$/, '');
  let bits = '';
  for (let i = 0; i < clean.length; i++) {
    const val = chars.indexOf(clean[i]);
    if (val === -1) throw new Error('Invalid base32 character');
    bits += val.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

function generateTOTP(secretBuffer: Buffer, counter: number): string {
  const buffer = Buffer.alloc(8);
  let tmp = counter;
  for (let i = 7; i >= 0; i--) {
    buffer[i] = tmp & 0xff;
    tmp = tmp >> 8;
  }
  
  const hmac = crypto.createHmac('sha1', secretBuffer);
  hmac.update(buffer);
  const hmacResult = hmac.digest();
  
  const offset = hmacResult[hmacResult.length - 1] & 0xf;
  const code = ((hmacResult[offset] & 0x7f) << 24) |
               ((hmacResult[offset + 1] & 0xff) << 16) |
               ((hmacResult[offset + 2] & 0xff) << 8) |
               (hmacResult[offset + 3] & 0xff);
  
  return (code % 1000000).toString().padStart(6, '0');
}

function verifyTOTP(secretBase32: string, code: string): boolean {
  try {
    const key = base32Decode(secretBase32);
    const currentCounter = Math.floor(Date.now() / 30000);
    // Allow clock drift of 1 time step (30 seconds) in either direction
    for (let i = -1; i <= 1; i++) {
      if (generateTOTP(key, currentCounter + i) === code.trim()) {
        return true;
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

// ─── API Endpoints ────────────────────────────────────────────────────────────
export async function POST(req: Request) {
  try {
    const { action, code, tempToken, secret: clientSecret } = await req.json();

    if (!action) {
      return NextResponse.json({ message: 'Action is required' }, { status: 400 });
    }

    await connectDB();

    // 1. MFA Setup (Generate secret)
    if (action === 'setup') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await User.findById(decoded.id);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const secret = generateBase32Secret();
      user.mfaSecret = secret;
      await user.save();

      // Return configuration metadata
      const otpauthUrl = `otpauth://totp/InterviewOS:${encodeURIComponent(user.email)}?secret=${secret}&issuer=InterviewOS&algorithm=SHA1&digits=6&period=30`;

      return NextResponse.json({
        secret,
        otpauthUrl,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(otpauthUrl)}`
      });
    }

    // 2. Setup Verification (Enable MFA)
    if (action === 'verify-setup') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await User.findById(decoded.id);
      if (!user || !user.mfaSecret) {
        return NextResponse.json({ message: 'Setup secret is missing. Initiate setup first.' }, { status: 400 });
      }

      const isValid = verifyTOTP(user.mfaSecret, code);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid 6-digit code. Please check your authenticator app.' }, { status: 400 });
      }

      user.mfaEnabled = true;
      await user.save();

      return NextResponse.json({ success: true, message: 'Multi-Factor Authentication enabled successfully!' });
    }

    // 3. Disable MFA
    if (action === 'disable') {
      const authHeader = req.headers.get('authorization');
      if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

      const user = await User.findById(decoded.id);
      if (!user) {
        return NextResponse.json({ message: 'User not found' }, { status: 404 });
      }

      const isValid = verifyTOTP(user.mfaSecret || '', code);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid 6-digit code' }, { status: 400 });
      }

      user.mfaEnabled = false;
      user.mfaSecret = undefined;
      await user.save();

      // Revoke other active sessions for safety
      await Session.deleteMany({ userId: user._id, token: { $ne: token.split('.').pop() } });

      return NextResponse.json({ success: true, message: 'Multi-Factor Authentication disabled.' });
    }

    // 4. MFA Login Verification (Temporary session validation)
    if (action === 'verify-login') {
      if (!tempToken || !code) {
        return NextResponse.json({ message: 'Temp token and verification code are required' }, { status: 400 });
      }

      let decodedTemp;
      try {
        decodedTemp = jwt.verify(tempToken, JWT_SECRET) as { id: string; mfaTemp: boolean };
      } catch (e) {
        return NextResponse.json({ message: 'Temporary session expired. Please log in again.' }, { status: 401 });
      }

      if (!decodedTemp.mfaTemp) {
        return NextResponse.json({ message: 'Invalid verification token' }, { status: 400 });
      }

      const user = await User.findById(decodedTemp.id);
      if (!user || !user.mfaSecret) {
        return NextResponse.json({ message: 'Authentication configurations missing' }, { status: 400 });
      }

      const isValid = verifyTOTP(user.mfaSecret, code);
      if (!isValid) {
        return NextResponse.json({ message: 'Invalid 6-digit verification code' }, { status: 400 });
      }

      // MFA Success: Issue full 7-day token
      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userAgent = req.headers.get('user-agent') || 'Unknown Device';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';

      // Record active session in DB
      await Session.create({
        userId: user._id,
        token: token.split('.').pop(),
        userAgent,
        ipAddress,
        lastActiveAt: new Date(),
      });

      const response = NextResponse.json({
        success: true,
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
    }

    return NextResponse.json({ message: 'Invalid action parameter' }, { status: 400 });

  } catch (err: any) {
    console.error('[auth/mfa]', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}
