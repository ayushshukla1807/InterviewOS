import re

with open('app/login/page.tsx', 'r') as f:
    content = f.read()

# Add bright natural blobs to the login background
old_bg = '<div className="ios-auth-left-bg" />'
new_bg = '''<div className="ios-auth-left-bg overflow-hidden relative">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-rose-500/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-amber-500/20 blur-[120px] rounded-full mix-blend-screen" />
          <div className="absolute top-[40%] left-[20%] w-[500px] h-[500px] bg-fuchsia-500/20 blur-[120px] rounded-full mix-blend-screen" />
        </div>'''
content = content.replace(old_bg, new_bg)

with open('app/login/page.tsx', 'w') as f:
    f.write(content)
print("Updated login UI")
