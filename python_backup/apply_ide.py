import re

with open('app/components/CodeIDE.tsx', 'r') as f:
    content = f.read()

ide_mount_code = """
  const handleEditorWillMount = (monaco: any) => {
    // Enable advanced JS/TS diagnostics
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
      noSemanticValidation: false,
      noSyntaxValidation: false,
    });
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true
    });
  };

  useEffect(() => {
    // Prevent Copy/Paste outside of Monaco if needed, though Monaco handles its own.
    // For strictly blocking paste in the whole IDE component:
    const blockPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      alert("Copy/Paste is disabled during the interview for integrity reasons.");
    };
    const container = document.getElementById('code-ide-container');
    if (container) {
      container.addEventListener('paste', blockPaste as any);
      container.addEventListener('copy', blockPaste as any);
    }
    return () => {
      if (container) {
        container.removeEventListener('paste', blockPaste as any);
        container.removeEventListener('copy', blockPaste as any);
      }
    };
  }, []);
"""

if "handleEditorWillMount" not in content:
    # Insert before return statement of CodeIDE component
    content = content.replace("  return (", ide_mount_code + "\n  return (")

if "beforeMount={handleEditorWillMount}" not in content:
    content = content.replace("onMount={editor => { editorRef.current = editor; }}", "onMount={editor => { editorRef.current = editor; }}\n              beforeMount={handleEditorWillMount}")

if 'id="code-ide-container"' not in content:
    content = content.replace('className="h-full flex flex-col bg-[#050508] relative"', 'id="code-ide-container" className="h-full flex flex-col bg-[#050508] relative"')

with open('app/components/CodeIDE.tsx', 'w') as f:
    f.write(content)
print("Done")
