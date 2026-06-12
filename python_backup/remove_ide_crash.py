import re

with open('app/components/CodeIDE.tsx', 'r') as f:
    content = f.read()

# Remove the beforeMount prop
content = content.replace("              beforeMount={handleEditorWillMount}", "")

# Remove handleEditorWillMount function
pattern = r'const handleEditorWillMount = \(monaco: any\) => \{.*?\};\n'
content = re.sub(pattern, '', content, flags=re.DOTALL)

with open('app/components/CodeIDE.tsx', 'w') as f:
    f.write(content)
print("Removed handleEditorWillMount")
