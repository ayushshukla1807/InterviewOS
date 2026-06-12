import re

with open('app/components/CodeIDE.tsx', 'r') as f:
    content = f.read()

content = content.replace("monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions", "try { monaco?.languages?.typescript?.javascriptDefaults?.setDiagnosticsOptions")
content = content.replace("allowNonTsExtensions: true\n    });", "allowNonTsExtensions: true\n    }); } catch(e){ console.error(e) }")

with open('app/components/CodeIDE.tsx', 'w') as f:
    f.write(content)
print("Done")
