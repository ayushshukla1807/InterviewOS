import re

with open('app/session/page.tsx', 'r') as f:
    content = f.read()

# First, restore the lost block:
lost_block = """           initMLTrackers(s,            const checkVolume = () => {"""
restored_block = """           initMLTrackers(s, videoRef.current);
        }
        if (videoRefMirror.current) {
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
           
           const checkVolume = () => {"""
content = content.replace(lost_block, restored_block)

# Next, clean up the duplicate `console.log('Interruption detected!');` trailing at the bottom
bad_trailing = """           checkVolume();
         } catch(e) { console.error('Audio interrupt init failed', e); }         console.log('Interruption detected!');
                   window.speechSynthesis.cancel();
                   const fallbackAudio = document.getElementById('ai-voice') as HTMLAudioElement;
                   if (fallbackAudio) fallbackAudio.pause();"""

good_trailing = """           checkVolume();
         } catch(e) { console.error('Audio interrupt init failed', e); }"""

content = content.replace(bad_trailing, good_trailing)

with open('app/session/page.tsx', 'w') as f:
    f.write(content)
print("Fixed audio mangling")
