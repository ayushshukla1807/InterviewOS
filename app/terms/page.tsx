import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-zinc-300 py-20 px-6 md:px-12 font-sans selection:bg-cyan-500/30">
      <div className="max-w-4xl mx-auto">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
        
        <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-8">Terms of Service</h1>
        <p className="text-zinc-400 mb-12">Last Updated: June 16, 2026</p>

        <div className="space-y-8 text-lg leading-relaxed">
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using InterviewOS, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
            <p>InterviewOS provides an AI-powered technical and behavioral screening platform designed to evaluate candidate skills through simulated environments, coding sandboxes, and behavioral proctoring.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">3. User Responsibilities</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Candidates agree not to use external assistance, unauthorized AI tools, or cheat during evaluations. Employers agree to use candidate data in accordance with applicable hiring laws.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">4. Data and Privacy</h2>
            <p>Our collection and use of personal information in connection with your access to and use of the Services is described in our Privacy Policy.</p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-4">5. Limitation of Liability</h2>
            <p>InterviewOS provides evaluation tools but does not guarantee employment outcomes. We are not liable for hiring decisions made based on our platform's telemetry and scoring.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-bold text-white mb-4">6. Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@interviewos.ai.</p>
          </section>
        </div>
      </div>
    </div>
  );
}
