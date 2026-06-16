import re
import os

target_files = [
    "app/page.tsx",
    "app/candidate/page.tsx",
    "app/recruiter/page.tsx",
    "app/founder/page.tsx",
    "app/session/page.tsx",
    "app/instructions/page.tsx",
    "app/permissions/page.tsx"
]

replacements = [
    # Replace gradients
    (r"from-emerald-400 via-green-300 to-teal-400", "from-sky-400 via-blue-400 to-indigo-400"),
    (r"from-emerald-400 to-teal-300", "from-sky-400 to-blue-400"),
    (r"from-emerald-500 via-indigo-500 to-emerald-800", "from-sky-500 via-indigo-600 to-blue-700"),
    (r"from-emerald-500 to-teal-500", "from-sky-500 to-blue-600"),
    (r"from-emerald-600 to-teal-500", "from-sky-600 to-blue-500"),
    (r"from-emerald-600 via-fuchsia-600 to-rose-600", "from-sky-600 via-indigo-600 to-blue-700"),
    (r"from-violet-600 via-fuchsia-600 to-rose-600", "from-sky-600 via-blue-600 to-indigo-600"),
    (r"from-violet-500 to-teal-500", "from-sky-500 to-indigo-600"),
    (r"from-violet-400 via-sky-400 to-emerald-400", "from-sky-400 via-indigo-400 to-blue-400"),
    
    # Replace backgrounds and borders
    (r"bg-emerald-50", "bg-zinc-800"),
    (r"border-emerald-500/25", "border-sky-500/15"),
    (r"border-emerald-500/10", "border-sky-500/10"),
    (r"bg-emerald-950/10", "bg-sky-950/5"),
    (r"border-emerald-500/40", "border-sky-500/20"),
    (r"focus:border-emerald-500", "focus:border-sky-500"),
    (r"accent-emerald-500", "accent-sky-500"),
    (r"border-emerald-500", "border-sky-500"),
    (r"shadow-emerald-500/30", "shadow-sky-500/10"),
    (r"shadow-emerald-500/5", "shadow-sky-500/5"),
    (r"shadow-emerald-500/10", "shadow-sky-500/5"),
    (r"shadow-emerald-900/5", "shadow-sky-900/5"),
    (r"shadow-emerald-900/20", "shadow-sky-900/10"),
    (r"bg-emerald-600", "bg-sky-600"),
    (r"hover:bg-emerald-600", "hover:bg-sky-500"),
    (r"text-emerald-400", "text-sky-400"),
    (r"bg-emerald-950/40", "bg-sky-950/40"),
    (r"bg-emerald-950/20", "bg-sky-950/20"),
    (r"border-emerald-400", "border-sky-400"),
    (r"shadow-emerald-600/10", "shadow-sky-600/10"),
    (r"text-emerald-300", "text-sky-300"),
    (r"from-emerald-500 to-teal-500", "from-sky-500 to-indigo-600"),
    (r"bg-gradient-to-r from-emerald-500 to-teal-500", "bg-gradient-to-r from-sky-500 to-indigo-600"),
]

for filename in target_files:
    filepath = os.path.join(os.getcwd(), filename)
    if not os.path.exists(filepath):
        print(f"Skipping {filename} (does not exist)")
        continue
        
    print(f"Processing {filename}...")
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
        
    new_content = content
    for pattern, replacement in replacements:
        new_content = re.sub(pattern, replacement, new_content)
        
    if new_content != content:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated {filename} successfully.")
    else:
        print(f"No changes made to {filename}.")
print("Done!")
