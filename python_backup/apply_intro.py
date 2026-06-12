import re

with open('app/session/page.tsx', 'r') as f:
    content = f.read()

# 1. Change default tab to 'code'
content = content.replace("const [activeTab, setActiveTab] = useState<TabType>('voice');", "const [activeTab, setActiveTab] = useState<TabType>('code');")

# 2. Change the opening lines
old_opening = """      const openingLines = [
        `Hey ${name.split(' ')[0]}! I'm ${interviewer.name}. I'll be your lead interviewer today.`,
        `First of all, don't sweat it. We're just here to have a solid technical chat and see how you think.`,
        `I've got some interesting challenges lined up${jobTitle}.`,
        `We have shared a coding question on your screen. Take your time to read the constraints. Whenever you're ready, let's dive into it. Sound good?`
      ];"""

new_opening = """      const openingLines = [
        `Hey ${name.split(' ')[0]}! I'm ${interviewer.name}. I'll be your lead interviewer today.`,
        `First of all, don't sweat it. We're just here to have a solid technical chat and see how you think.`,
        `Before we dive into the technical challenges, I'd love to learn a bit more about you.`,
        `Could you briefly introduce yourself and highlight a recent project you're particularly proud of?`
      ];"""

content = content.replace(old_opening, new_opening)

with open('app/session/page.tsx', 'w') as f:
    f.write(content)
print("Changes applied!")
