import { NextResponse } from 'next/server';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { connectDB } from '../../../../lib/db/mongoose';
import User from '../../../../lib/db/models/User';
import Session from '../../../../lib/db/models/Session';

const JWT_SECRET = process.env.JWT_SECRET || 'interviewos_secret_2026';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || '';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '';

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url);
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || urlObj.host;
    const proto = req.headers.get('x-forwarded-proto') || 'http';
    const fallbackOrigin = `${proto}://${host}`;
    const origin = (process.env.RENDER_EXTERNAL_URL || process.env.NEXT_PUBLIC_APP_URL || fallbackOrigin).replace(/\/$/, '');

    const provider = urlObj.searchParams.get('provider');
    const code = urlObj.searchParams.get('code');
    const state = urlObj.searchParams.get('state');

    // ─── 1. INITIATE REDIRECTS ────────────────────────────────────────────────
    if (provider) {
      const redirectUri = `${origin}/api/auth/oauth`;
      
      if (provider === 'google') {
        if (!GOOGLE_CLIENT_ID) {
          // Trigger developer sandbox mock screen
          return new Response(generateMockHtml('Google', redirectUri), {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        // Real Google Redirect
        const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent('openid email profile')}&state=google`;
        return NextResponse.redirect(googleUrl);
      }
      
      if (provider === 'github') {
        if (!GITHUB_CLIENT_ID) {
          // Trigger developer sandbox mock screen
          return new Response(generateMockHtml('GitHub', redirectUri), {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        // Real GitHub Redirect
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('user:email')}&state=github`;
        return NextResponse.redirect(githubUrl);
      }
      
      return NextResponse.json({ message: 'Invalid OAuth provider' }, { status: 400 });
    }

    // ─── 2. OAUTH CALLBACK PROCESSING ─────────────────────────────────────────
    if (code && state) {
      let email = '';
      let name = '';
      
      const redirectUri = `${origin}/api/auth/oauth`;

      // A. Google Callback
      if (state === 'google' || state.startsWith('mock_google_')) {
        if (code.startsWith('mock_')) {
          // Parse mock details from code/state
          email = 'sandbox.google.candidate@interviewos.ai';
          name = 'Google Sandbox User';
        } else {
          // Exchange real Google Auth Code for Access Token
          const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              code,
              client_id: GOOGLE_CLIENT_ID,
              client_secret: GOOGLE_CLIENT_SECRET,
              redirect_uri: redirectUri,
              grant_type: 'authorization_code'
            })
          });
          const tokenData = await tokenRes.json();
          if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Failed to exchange Google token');

          // Fetch User details
          const userRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
            headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
          });
          const userData = await userRes.json();
          if (!userRes.ok) throw new Error('Failed to retrieve Google user profile');
          
          email = userData.email;
          name = userData.name || userData.given_name || 'Google Candidate';
        }
      } 
      // B. GitHub Callback
      else if (state === 'github' || state.startsWith('mock_github_')) {
        if (code.startsWith('mock_')) {
          email = 'sandbox.github.candidate@interviewos.ai';
          name = 'GitHub Sandbox User';
        } else {
          // Exchange real GitHub Auth Code
          const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              code,
              client_id: GITHUB_CLIENT_ID,
              client_secret: GITHUB_CLIENT_SECRET,
              redirect_uri: redirectUri
            })
          });
          const tokenData = await tokenRes.json();
          if (!tokenRes.ok || tokenData.error) throw new Error(tokenData.error_description || 'Failed to exchange GitHub token');

          // Fetch User Details
          const userRes = await fetch('https://api.github.com/user', {
            headers: { 
              'Authorization': `Bearer ${tokenData.access_token}`,
              'User-Agent': 'InterviewOS-Auth-Engine'
            }
          });
          const userData = await userRes.json();
          if (!userRes.ok) throw new Error('Failed to retrieve GitHub profile');

          name = userData.name || userData.login || 'GitHub Candidate';
          email = userData.email;

          // GitHub emails can be private, so fetch email collection if null
          if (!email) {
            const emailRes = await fetch('https://api.github.com/user/emails', {
              headers: { 
                'Authorization': `Bearer ${tokenData.access_token}`,
                'User-Agent': 'InterviewOS-Auth-Engine'
              }
            });
            const emailData = await emailRes.json();
            if (emailRes.ok && Array.isArray(emailData)) {
              const primaryEmail = emailData.find((e: any) => e.primary && e.verified);
              if (primaryEmail) email = primaryEmail.email;
            }
          }
        }
      }

      if (!email) {
        return NextResponse.json({ message: 'Email address not provided by OAuth provider' }, { status: 400 });
      }

      // Find or create user in MongoDB
      await connectDB();
      let user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Create user as candidate
        user = await User.create({
          name,
          email: email.toLowerCase().trim(),
          password: crypto.randomBytes(16).toString('hex'), // Secure random password
          role: 'candidate',
          isEmailVerified: true
        });
      }

      // Generate 7-day token
      const token = jwt.sign(
        { id: user._id.toString(), role: user.role },
        JWT_SECRET,
        { expiresIn: '7d' }
      );

      const userAgent = req.headers.get('user-agent') || 'Unknown Device';
      const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '127.0.0.1';

      // Create session
      await Session.create({
        userId: user._id,
        token: token.split('.').pop(),
        userAgent,
        ipAddress,
        lastActiveAt: new Date()
      });

      // Redirect client to their dashboard and set cookie
      const redirectDashboard = user.role === 'founder' ? '/founder' : user.role === 'recruiter' ? '/recruiter' : '/candidate';
      const response = NextResponse.redirect(new URL(redirectDashboard, origin));
      
      response.cookies.set('interviewos_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ message: 'OAuth credentials missing or invalid callback code' }, { status: 400 });

  } catch (err: any) {
    console.error('[auth/oauth]', err);
    return NextResponse.json({ message: err.message || 'Internal server error' }, { status: 500 });
  }
}

// ─── Visual simulated OAuth HTML for Dev Sandboxes ────────────────────────────
function generateMockHtml(provider: string, redirectUri: string): string {
  const mockCode = `mock_${provider.toLowerCase()}_${crypto.randomBytes(8).toString('hex')}`;
  const mockUrl = `${redirectUri}?code=${mockCode}&state=mock_${provider.toLowerCase()}_state`;

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${provider} Sandbox Authorization</title>
      <style>
        body {
          background-color: #050508;
          color: #f3f4f6;
          font-family: sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }
        .card {
          background: linear-gradient(145deg, #111827 0%, #030712 100%);
          border: 1px solid rgba(16, 185, 129, 0.2);
          border-radius: 16px;
          padding: 36px;
          max-width: 480px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.5);
          text-align: center;
        }
        h2 {
          color: #10b981;
          margin-top: 0;
          letter-spacing: 1px;
        }
        p {
          color: #9ca3af;
          font-size: 13px;
          line-height: 1.6;
        }
        .code-box {
          background: #090d16;
          border: 1px solid #1e293b;
          font-family: monospace;
          padding: 12px;
          border-radius: 8px;
          font-size: 11px;
          color: #38bdf8;
          text-align: left;
          margin: 18px 0;
          word-break: break-all;
        }
        .btn {
          display: block;
          padding: 14px;
          background: #10b981;
          color: #020617;
          text-decoration: none;
          font-weight: bold;
          border-radius: 8px;
          font-size: 13px;
          letter-spacing: 1px;
          text-transform: uppercase;
          transition: background 0.2s;
        }
        .btn:hover {
          background: #059669;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🛠️ OAUTH DEV SANDBOX</h2>
        <p>You are in <strong>Local Development Mode</strong>. Since no <code>${provider.toUpperCase()}_CLIENT_ID</code> is configured in your <code>.env.local</code>, we have initialized the mock sandbox handshake.</p>
        <p>Click below to complete the simulated ${provider} authentication handshake and log into InterviewOS:</p>
        <div class="code-box">
          REDIRECTING TO:<br/>
          ${mockUrl}
        </div>
        <a href="${mockUrl}" class="btn">Authorize ${provider} Sandbox</a>
      </div>
    </body>
    </html>
  `;
}
