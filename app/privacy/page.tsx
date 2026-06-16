import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 py-20 px-6 md:px-12 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-8">Privacy Policy</h1>
        <p className="text-zinc-400 mb-12">Last Updated: June 16, 2026</p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Information We Collect</h2>
            <p>When you use InterviewOS, we may collect personal information such as your name, email address, resume details, and technical background. During evaluations, we also collect telemetry data including coding activity, browser events, and optional audio/video proctoring data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. How We Use Your Information</h2>
            <p>We use the collected information to facilitate interviews, generate evaluation reports for prospective employers, improve our AI models, and ensure the integrity of the testing environment.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. Data Sharing</h2>
            <p>Candidate evaluation reports are shared exclusively with the employers or organizations that invited the candidate to the interview. We do not sell your personal data to third-party marketers.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data Security</h2>
            <p>We implement industry-standard security measures, including encryption in transit and at rest, to protect your data against unauthorized access, alteration, or destruction.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Your Rights</h2>
            <p>You have the right to access, correct, or delete your personal data. If you wish to exercise these rights, please contact the employer who requested your evaluation or email us directly.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p>If you have any questions or concerns about this Privacy Policy, please contact us at privacy@interviewos.ai.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
