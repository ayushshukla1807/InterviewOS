import os
import re

# Regex for emojis and common symbols
emoji_pattern = re.compile(
    r"[\U00010000-\U0010ffff]"  # SMP (e.g. Emojis, historical scripts)
    r"|[\u2600-\u27bf]"         # Miscellaneous Symbols and Dingbats
)

root_dir = "/Users/ayushshukla/Projects/gsoc/Internship Work /aicruter_bot/app"

found = {}

for dirpath, _, filenames in os.walk(root_dir):
    for filename in filenames:
        if filename.endswith((".tsx", ".ts", ".js", ".jsx", ".css")):
            filepath = os.path.join(dirpath, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    for idx, line in enumerate(f, 1):
                        matches = emoji_pattern.findall(line)
                        if matches:
                            if filepath not in found:
                                found[filepath] = []
                            found[filepath].append((idx, line.strip(), matches))
            except Exception as e:
                print(f"Error reading {filepath}: {e}")

# Output results
for path, occurrences in found.items():
    print(f"\nFile: {path}")
    for line_num, text, matches in occurrences:
        print(f"  Line {line_num}: {text} -> Matches: {matches}")
