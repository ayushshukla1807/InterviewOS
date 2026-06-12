import re

with open('app/session/page.tsx', 'r') as f:
    content = f.read()

bad_string = """           checkVolume();
         } catch(e) { console.error('Audio interrupt init failed', e); }
                   
                   // Automatically restart recognition
                   const micBtn = document.getElementById('mic-toggle-btn');
                   if (micBtn) micBtn.click();
                }
             }
             requestAnimationFrame(checkVolume);
           };
           checkVolume();
        } catch(e) { console.error('Audio interrupt init failed', e); }"""

good_string = """           checkVolume();
         } catch(e) { console.error('Audio interrupt init failed', e); }"""

content = content.replace(bad_string, good_string)

with open('app/session/page.tsx', 'w') as f:
    f.write(content)
print("Removed trailing audio garbage")
