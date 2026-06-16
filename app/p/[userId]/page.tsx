'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Trophy, Flame, Star, Zap, Share2, Globe, MapPin, ChevronLeft, Award, Shield, CheckCircle2, TrendingUp
} from 'lucide-react';
import { 
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  Radar, ResponsiveContainer, Tooltip 
} from 'recharts';
import Link from 'next/link';

interface PublicProfile {
  name: string;
  xp: number;
  level: number;
  streak: number;
  badges: any[];
}

export default function PublicProfilePage() {
  const params = useParams();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [pastInterviews, setPastInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const userId = params?.userId;
        if (!userId) return;

        // Fetch User gamification details
        const userRes = await fetch(`/api/gamification/user/${userId}`);
        let userDetails = null;
        if (userRes.ok) {
          const userData = await userRes.json();
          userDetails = userData.user;
        }

        // Fetch user interview reports
        const reportsRes = await fetch(`/api/reports/user/${userId}`);
        let reportsList = [];
        if (reportsRes.ok) {
          const reportsData = await reportsRes.json();
          reportsList = reportsData.reports || [];
        }

        if (userDetails) {
          setProfile(userDetails);
          setPastInterviews(reportsList);
        }
      } catch (err) {
        console.error("Failed to fetch public profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, [params]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center space-y-4 text-slate-100">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium  tracking-[0.3em] text-[10px]">
          Parsing Profile Nodes...
        </p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="h-screen w-screen bg-[#020617] flex flex-col items-center justify-center space-y-4 text-slate-100">
        <h2 className="text-2xl font-medium  text-rose-500">Node not found</h2>
        <p className="text-zinc-500 font-bold  tracking-tight text-xs">The requested candidate profile does not exist.</p>
        <Link href="/" className="px-6 py-3 bg-zinc-900/50 border border-zinc-800 rounded-xl text-xs font-medium  tracking-tight text-zinc-400 hover:text-white mt-4">
          Go Home
        </Link>
      </div>
    );
  }

  // Calculate Radar skill matrix
  const calculateRadarData = () => {
    if (!pastInterviews.length) {
      // Return default capability distribution if they have no interviews yet
      return [
        { subject: 'Direct Skill', score: 75, fullMark: 100 },
        { subject: 'Embedded Skills', score: 65, fullMark: 100 },
        { subject: 'Workplace Intel', score: 80, fullMark: 100 }
      ];
    }

    let directSkillSum = 0;
    let embeddedSkillsSum = 0;
    let workplaceSum = 0;

    pastInterviews.forEach(a => {
      directSkillSum += a.fullReportData?.directSkill?.score || 0;
      embeddedSkillsSum += a.fullReportData?.embeddedSkills?.score || 0;
      workplaceSum += a.fullReportData?.workplaceIntelligence?.score || 0;
    });

    const count = pastInterviews.length;
    return [
      { subject: 'Direct Skill', score: Math.round(directSkillSum / count), fullMark: 100 },
      { subject: 'Embedded Skills', score: Math.round(embeddedSkillsSum / count), fullMark: 100 },
      { subject: 'Workplace Intel', score: Math.round(workplaceSum / count), fullMark: 100 }
    ];
  };

  const radarData = calculateRadarData();
  const averageScore = pastInterviews.length > 0
    ? Math.round(pastInterviews.reduce((acc, curr) => acc + curr.score, 0) / pastInterviews.length)
    : 0;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8 pb-20 relative z-10">
        
        {/* Header Navigation */}
        <div className="flex justify-between items-center">
          <Link 
            href="/candidate" 
            className="inline-flex items-center gap-2 text-xs font-medium  tracking-tight text-zinc-500 hover:text-white transition-colors group"
          >
            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Candidate Dashboard
          </Link>

          <span className="text-[10px] font-medium text-zinc-100  tracking-tight bg-zinc-800/50 px-3 py-1 rounded-full border border-zinc-700 flex items-center gap-2 shadow-sm">
            <div className="w-1.5 h-1.5 bg-zinc-200 rounded-full " /> Verified Node
          </span>
        </div>

        {/* Hero Card */}
        <div className="relative glass-card p-10 pt-20 rounded-[3rem] border border-zinc-800/50 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-40 bg-gradient-to-r from-indigo-600/15 via-purple-600/15 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-end gap-8">
            <div className="w-36 h-36 rounded-[2rem] bg-gradient-to-br from-indigo-600/25 to-sky-600/25 border-2 border-indigo-500/30 flex items-center justify-center font-medium text-zinc-300 text-5xl shadow-2xl relative">
              {profile.name[0].toUpperCase()}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-white rounded-xl border-4 border-[#020617]" />
            </div>

            <div className="flex-1 space-y-3">
              <div className="flex items-center gap-4 flex-wrap">
                <h1 className="text-4xl font-medium text-white tracking-tighter ">{profile.name}</h1>
                <span className="px-3 py-1 bg-indigo-500/10 text-zinc-300 text-[10px] font-medium  tracking-tight rounded-lg border border-indigo-500/20">
                  Level {profile.level}
                </span>
              </div>
              <div className="flex flex-wrap gap-6 text-zinc-400 font-bold text-xs  tracking-tight">
                <div className="flex items-center gap-2"><Globe size={14} className="text-zinc-500" /> p/{params?.userId}</div>
                <div className="flex items-center gap-2"><MapPin size={14} className="text-zinc-500" /> Node OS 0.72</div>
                <div className="flex items-center gap-2"><Zap size={14} className="text-amber-500" /> {profile.xp.toLocaleString()} XP</div>
              </div>
            </div>

            <div className="flex gap-4 w-full md:w-auto">
              <button 
                onClick={handleShare}
                className="flex-1 md:flex-initial px-6 py-4 bg-zinc-900/50 text-slate-350 rounded-2xl hover:text-white transition-all border border-zinc-800/50 flex items-center justify-center gap-2 font-medium text-[10px]  tracking-tight hover:bg-white/10 active:scale-95"
              >
                <Share2 size={16} /> {copied ? 'Copied!' : 'Share Portfolio'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Stats & Badges */}
          <div className="lg:col-span-1 space-y-8">
            {/* Resonance metrics */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-zinc-800/50 space-y-6">
              <h3 className="text-xs font-medium text-zinc-400  tracking-tight flex items-center gap-2">
                <Flame size={16} className="text-orange-500 " /> Performance Analytics
              </h3>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-black/20 border border-zinc-800/50 rounded-2xl">
                  <span className="text-[9px] font-bold text-zinc-500  tracking-tight block">Completed</span>
                  <p className="text-2xl font-medium text-white mt-1.5">{pastInterviews.length}</p>
                </div>
                <div className="p-4 bg-black/20 border border-zinc-800/50 rounded-2xl">
                  <span className="text-[9px] font-bold text-zinc-500  tracking-tight block">Average Score</span>
                  <p className="text-2xl font-medium text-zinc-100 mt-1.5">{averageScore}%</p>
                </div>
              </div>

              <div className="bg-orange-500/10 border border-orange-500/20 p-5 rounded-2xl flex items-center justify-between text-orange-400">
                <div className="flex items-center gap-3">
                  <Flame className="w-5 h-5 fill-orange-500/10 animate-bounce" />
                  <div>
                    <span className="text-[9px] font-medium  tracking-tight text-zinc-500 block">Consecutive Days</span>
                    <span className="text-lg font-medium">{profile.streak} Day Streak</span>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-orange-500/10 border border-orange-500/25 flex items-center justify-center font-bold text-xs">
                  🔥
                </div>
              </div>
            </div>

            {/* Achievements & Badges */}
            <div className="glass-card p-8 rounded-[2.5rem] border border-zinc-800/50 space-y-6">
              <h3 className="text-xs font-medium text-zinc-400  tracking-tight flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" /> Unlocked Achievements
              </h3>
              
              <div className="grid grid-cols-4 gap-3">
                {profile.badges && profile.badges.length > 0 ? (
                  profile.badges.map((badge: any) => (
                    <div 
                      key={badge.id}
                      className="aspect-square bg-indigo-500/10 border border-indigo-500/20 text-zinc-300 rounded-xl flex items-center justify-center relative group/badge cursor-help shadow-lg hover:scale-105 transition-all"
                    >
                      <Star size={20} className="fill-indigo-500/10" />
                      <span className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 text-center bg-zinc-950 border border-zinc-800 p-2.5 rounded-lg text-[10px] text-white font-bold opacity-0 pointer-events-none group-hover/badge:opacity-100 transition-opacity z-50 shadow-2xl">
                        <p className="font-medium text-zinc-300  tracking-tight mb-0.5">{badge.name}</p>
                        {badge.description}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="col-span-4 p-6 text-center border border-zinc-800/50 rounded-2xl bg-black/15 text-[10px] font-bold text-zinc-500  tracking-tight">
                    No badges unlocked yet
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Skill Radar Chart */}
          <div className="lg:col-span-2 glass-card p-10 rounded-[3rem] border border-zinc-800/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] pointer-events-none" />
            
            <div className="flex justify-between items-center mb-10">
              <div>
                <h3 className="text-lg font-medium text-white tracking-tight  flex items-center gap-2">
                  <Award size={18} className="text-zinc-300" /> Capability Matrix
                </h3>
                <p className="text-[10px] font-medium text-zinc-500  tracking-tight mt-1">Multi-dimensional verification stats</p>
              </div>
              <div className="w-10 h-10 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center justify-center text-zinc-300 shadow-md">
                <Zap size={18} />
              </div>
            </div>

            <div className="h-[320px] w-full flex items-center justify-center bg-black/10 rounded-2xl border border-zinc-800/50 p-4">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="#ffffff10" />
                  <PolarAngleAxis dataKey="subject" stroke="#ffffff40" fontSize={10} fontWeight="bold" />
                  <PolarRadiusAxis stroke="#ffffff10" fontSize={10} />
                  <Radar name="Candidate" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.3} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #ffffff10', borderRadius: '1rem' }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
