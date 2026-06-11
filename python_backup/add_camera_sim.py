import re

with open('app/simulation/[sessionId]/page.tsx', 'r') as f:
    content = f.read()

# Add framer-motion import
if 'framer-motion' not in content:
    content = content.replace("import CodeIDE from '../../components/CodeIDE';", "import { motion } from 'framer-motion';\nimport CodeIDE from '../../components/CodeIDE';")

# Add User and GripHorizontal to lucide-react import
if 'GripHorizontal' not in content:
    content = content.replace("ChevronDown, ChevronUp, Activity, Volume2, VolumeX, BookOpen, AlertCircle", "ChevronDown, ChevronUp, Activity, Volume2, VolumeX, BookOpen, AlertCircle, User, GripHorizontal")

# Add state hooks
hook_code = """
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initHardware = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ 
           video: { facingMode: 'user' }, 
           audio: { echoCancellation: true, noiseSuppression: true } 
        });
        setStream(s);
        activeStream = s;
        if (videoRef.current) {
           videoRef.current.srcObject = s;
           videoRef.current.play();
        }
      } catch (err) {
        console.error("Hardware access denied:", err);
      }
    };
    initHardware();
    return () => {
      activeStream?.getTracks().forEach(t => t.stop());
    };
  }, []);
"""

if 'videoRef = useRef<HTMLVideoElement>' not in content:
    content = content.replace('  const { sessionId } = useParams();', '  const { sessionId } = useParams();' + hook_code)

# Add camera JSX
camera_jsx = """
      {/* Floating Draggable Candidate Camera Card */}
      <motion.div 
         drag
         dragMomentum={false}
         dragConstraints={{ left: -2000, right: 20, top: -2000, bottom: 20 }}
         className="fixed bottom-6 right-6 z-[150] w-[280px] rounded-2xl overflow-hidden hud-border shadow-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col group cursor-grab active:cursor-grabbing hover:border-cyan-500/50 transition-colors"
      >
         <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-black/80 to-transparent z-30 flex items-start justify-center pt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            <GripHorizontal className="w-5 h-5 text-white/70 drop-shadow-md" />
         </div>
         <div className="relative w-full aspect-[4/3] bg-slate-900 pointer-events-none">
            <div className="crt-scanline" />
            <video 
               ref={videoRef} 
               autoPlay 
               playsInline 
               muted 
               className={`w-full h-full object-cover scale-x-[-1] ${stream ? 'block' : 'hidden'}`} 
            />
            {!stream && (
               <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-900/80">
                  <User className="text-slate-600 w-10 h-10 animate-pulse mb-2" />
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Initializing Camera...</p>
               </div>
            )}
            <div className="absolute inset-0 shadow-[inset_0_0_40px_rgba(0,0,0,0.6)] z-10" />
            <div className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1 bg-[#020617]/80/50 backdrop-blur-md rounded-full border-none z-20 shadow-lg">
               <div className="w-1.5 h-1.5 rounded-full animate-pulse bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
               <span className="text-[7px] font-black tracking-widest text-slate-200 uppercase drop-shadow-sm">
                  Secure Pilot
               </span>
            </div>
            <div className="absolute bottom-3 left-3 text-[7px] font-black text-white/90 uppercase tracking-widest bg-[#020617]/80/50 backdrop-blur-md px-2 py-1 rounded-md border-none z-20 shadow-lg">
               Feed: Candidate Camera
            </div>
         </div>
      </motion.div>

    </div>
  );
"""

# Replace the last instances of "    </div>\n  );\n}"
content = re.sub(r'    </div>\n  \);\n}\s*$', camera_jsx + '\n}', content)

with open('app/simulation/[sessionId]/page.tsx', 'w') as f:
    f.write(content)
print("Done")
