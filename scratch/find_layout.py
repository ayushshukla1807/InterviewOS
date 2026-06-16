filepath = "/Users/ayushshukla/Projects/gsoc/Internship Work /aicruter_bot/app/session/page.tsx"

with open(filepath, "r", encoding="utf-8") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "bg-blue-700" in line:
        print(f"Line {i+1}: {repr(line)}")
        print(f"Line {i+2}: {repr(lines[i+1])}")
        print(f"Line {i+3}: {repr(lines[i+2])}")
        print(f"Line {i+4}: {repr(lines[i+3])}")
