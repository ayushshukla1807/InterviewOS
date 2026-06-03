import os

filepath = "/Users/ayushshukla/Projects/gsoc/Internship Work /aicruter_bot/lib/ai/roles.ts"

with open(filepath, "r", encoding="utf-8") as f:
    content = f.read()

# List of replacements
replacements = [
    ("icon: '🧩',", "icon: '',"),
    ("icon: '🎨',", "icon: '',"),
    ("icon: '⚙️',", "icon: '',"),
    ("icon: '📱',", "icon: '',"),
    ("icon: '🏥',", "icon: '',"),
    ("icon: '🔬',", "icon: '',"),
    ("icon: '🏗️',", "icon: '',"),
    ("icon: '📊',", "icon: '',"),
    ("icon: '☁️',", "icon: '',"),
    ("icon: '🔄',", "icon: '',"),
    ("icon: '🛡️',", "icon: '',"),
    ("icon: '🌐',", "icon: '',"),
    ("icon: '🖥️',", "icon: '',"),
    ("icon: '🤖',", "icon: '',"),
    ("icon: '✨',", "icon: '',"),
    ("icon: '🧠',", "icon: '',"),
    ("icon: '📋',", "icon: '',"),
    ("icon: '🔍',", "icon: '',"),
    ("icon: '🎭',", "icon: '',"),
]

for old, new in replacements:
    content = content.replace(old, new)

with open(filepath, "w", encoding="utf-8") as f:
    f.write(content)

print("Roles emojis removed successfully!")
