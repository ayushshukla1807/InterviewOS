import re

with open('app/session/page.tsx', 'r') as f:
    content = f.read()

avatar_pattern = r'<motion\.img\s+src=\{interviewer\?\.avatar \|\| "https://api\.dicebear\.com/7\.x/bottts/svg\?seed=Aura"\}[\s\S]*?/>'
new_avatar = """<motion.img 
                         src={interviewer?.avatar || "https://api.dicebear.com/7.x/bottts/svg?seed=Aura"} 
                         alt="AI Interviewer" 
                         className={`w-full h-full object-cover bg-black transition-all ${isSpeaking ? 'opacity-30' : 'opacity-100'}`}
                         animate={isSpeaking ? { scale: [1, 1.05, 1] } : { scale: 1 }}
                         transition={{ repeat: Infinity, duration: 1.5 }}
                     />
                     
                     {isSpeaking && (
                       <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                         <div className="flex gap-1.5 items-center justify-center w-full h-full mix-blend-screen">
                           {[1,2,3,4,5,6,7].map(i => (
                             <motion.div key={i} className="w-1.5 bg-cyan-400 rounded-full shadow-[0_0_10px_rgba(34,211,238,0.8)]"
                               animate={{ height: [8, 15 + (i%3)*10, 8] }}
                               transition={{ repeat: Infinity, duration: 0.3 + (i*0.05), ease: "easeInOut", delay: i * 0.05 }}
                             />
                           ))}
                         </div>
                       </div>
                     )}"""

if "opacity-30" not in content:
    content = re.sub(avatar_pattern, new_avatar, content, count=1)

with open('app/session/page.tsx', 'w') as f:
    f.write(content)
print("Done")
