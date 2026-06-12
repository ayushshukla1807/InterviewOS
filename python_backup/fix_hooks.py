import re

with open('app/components/CodeIDE.tsx', 'r') as f:
    content = f.read()

# Extract the injected hook
hook_pattern = r'  useEffect\(\(\) => \{\n    // Prevent Copy/Paste.*?\n  \}, \[\]\);\n'
match = re.search(hook_pattern, content, re.DOTALL)
if match:
    hook_str = match.group(0)
    # Remove it from its current position
    content = content.replace(hook_str, '')
    # Insert it right before the drag hook
    content = content.replace("  // Drag to resize top/bottom panels", hook_str + "\n  // Drag to resize top/bottom panels")

with open('app/components/CodeIDE.tsx', 'w') as f:
    f.write(content)
print("Hooks fixed")
