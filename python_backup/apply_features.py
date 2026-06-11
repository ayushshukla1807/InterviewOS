import re

with open('app/session/page.tsx', 'r') as f:
    content = f.read()

# 1. Import SFX
if "import { sfx }" not in content:
    content = content.replace("import { useTTS }", "import { sfx } from '../utils/sfx';\nimport { useTTS }")

# 2. Add isSpeakingRef
if "const isSpeakingRef" not in content:
    content = content.replace(
        "const [isSpeaking, setIsSpeaking] = useState(false);",
        "const [isSpeaking, setIsSpeaking] = useState(false);\n  const isSpeakingRef = useRef(false);\n  useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);"
    )

# 3. Add AnalyserNode for Interruptibility
init_hw_pattern = r'if \(videoRefMirror\.current\) \{.*?\}'
interrupt_code = """        if (videoRefMirror.current) {
           videoRefMirror.current.srcObject = s;
           videoRefMirror.current.play();
        }
        
        // Interruptibility Analyzer
        try {
           const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
           const analyser = audioCtx.createAnalyser();
           const source = audioCtx.createMediaStreamSource(s);
           source.connect(analyser);
           analyser.fftSize = 256;
           const bufferLength = analyser.frequencyBinCount;
           const dataArray = new Uint8Array(bufferLength);
           
           const checkVolume = () => {
             if (isSpeakingRef.current) {
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) sum += dataArray[i];
                const avg = sum / bufferLength;
                
                // If candidate speaks loudly while AI is talking
                if (avg > 40) {
                   console.log('Interruption detected!');
                   window.speechSynthesis.cancel();
                   const fallbackAudio = document.getElementById('ai-voice') as HTMLAudioElement;
                   if (fallbackAudio) fallbackAudio.pause();
                   
                   // Automatically restart recognition
                   const micBtn = document.getElementById('mic-toggle-btn');
                   if (micBtn) micBtn.click();
                }
             }
             requestAnimationFrame(checkVolume);
           };
           checkVolume();
        } catch(e) { console.error('Audio interrupt init failed', e); }"""

if "// Interruptibility Analyzer" not in content:
    content = re.sub(init_hw_pattern, interrupt_code, content, flags=re.DOTALL)

# 4. Modify toggleListening
toggle_listen_pattern = r'const toggleListening = \(\) => \{.*?if \(isListening\) \{.*?recognitionRef\.current\?\.stop\(\);.*?\} else \{.*?recognitionRef\.current\?\.start\(\);.*?\}\n  \};'
new_toggle_listen = """const toggleListening = () => {
    // We remove the block during AI speaking so candidate CAN interrupt by clicking if they want
    if (isListening) {
      sfx?.playMicOff();
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      sfx?.playMicOn();
      // If AI is speaking, cancel it!
      if (isSpeakingRef.current) {
          window.speechSynthesis.cancel();
          const fallbackAudio = document.getElementById('ai-voice') as HTMLAudioElement;
          if (fallbackAudio) fallbackAudio.pause();
      }
      recognitionRef.current?.start();
      setIsListening(true);
    }
  };"""

if "sfx?.playMicOff();" not in content:
    content = re.sub(r'const toggleListening = \(\) => \{[\s\S]*?\}\n  \};', new_toggle_listen, content, count=1)

# 5. Modify send
send_pattern = r'const send = async \(\) => \{\n    if \(\!input\.trim\(\) \|\| isThinking\) return;'
new_send = """const send = async () => {
    if (!input.trim() || isThinking) return;
    sfx?.playType();"""
if "sfx?.playType();" not in content:
    content = content.replace("const send = async () => {\n    if (!input.trim() || isThinking) return;", new_send)


with open('app/session/page.tsx', 'w') as f:
    f.write(content)
print("Done")
