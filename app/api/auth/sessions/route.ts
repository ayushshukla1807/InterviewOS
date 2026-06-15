import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import Session from '../../../../lib/db/models/Session';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (e) {
      return NextResponse.json({ message: 'Invalid session token' }, { status: 401 });
    }

    await connectDB();

    const currentTokenSig = token.split('.').pop();

    const sessions = await Session.find({ userId: decoded.id }).sort({ lastActiveAt: -1 });

    const formattedSessions = sessions.map(s => {
      const obj = s.toObject();
      return {
        id: obj._id.toString(),
        userAgent: obj.userAgent,
        ipAddress: obj.ipAddress,
        lastActiveAt: obj.lastActiveAt,
        isCurrent: obj.token === currentTokenSig
      };
    });

    return NextResponse.json({ sessions: formattedSessions });

  } catch (err: any) {
    console.error('[auth/sessions/get]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { id: string };
    } catch (e) {
      return NextResponse.json({ message: 'Invalid session token' }, { status: 401 });
    }

    const url = new URL(req.url);
    const sessionId = url.searchParams.get('id');

    if (!sessionId) {
      return NextResponse.json({ message: 'Session ID is required' }, { status: 400 });
    }

    await connectDB();

    // Verify and delete session
    const deletedSession = await Session.findOneAndDelete({ _id: sessionId, userId: decoded.id });

    if (!deletedSession) {
      return NextResponse.json({ message: 'Session not found or already revoked' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Device session terminated successfully.' });

  } catch (err: any) {
    console.error('[auth/sessions/delete]', err);
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
  }
}
