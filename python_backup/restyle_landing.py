import re

with open('app/page.tsx', 'r') as f:
    content = f.read()

# Replace the hero text gradient
old_hero_gradient = "backgroundImage: 'linear-gradient(to right, var(--primary), #8b5cf6)'"
new_hero_gradient = "backgroundImage: 'linear-gradient(to right, #ec4899, #8b5cf6, #3b82f6)'"
content = content.replace(old_hero_gradient, new_hero_gradient)

# Add beautiful natural colorful glowing blobs to the background
old_bg = '<div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px] bg-indigo-500/10 blur-[120px] rounded-full" />'
new_bg = '''<div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-fuchsia-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[600px] h-[600px] bg-rose-500/10 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[800px] h-[800px] bg-amber-500/10 blur-[150px] rounded-full mix-blend-screen" />'''
content = content.replace(old_bg, new_bg)

# Make the feature cards on the landing page more vibrant
# E.g. hover effects or border colors
content = content.replace('hover:border-[var(--primary)]', 'hover:border-rose-500/50 hover:shadow-[0_0_30px_rgba(244,63,94,0.2)]')
content = content.replace('shadow-sm hover:shadow-md', 'shadow-lg hover:shadow-2xl')

with open('app/page.tsx', 'w') as f:
    f.write(content)
print("Updated landing UI")
