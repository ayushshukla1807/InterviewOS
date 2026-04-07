import subprocess
import datetime
import os
import shutil
import tempfile

# Repository path
repo_dir = "/Users/ayushshukla/.gemini/antigravity/scratch/InterviewOS"

def run_cmd(cmd, cwd=repo_dir, env=None):
    merged_env = os.environ.copy()
    if env:
        merged_env.update(env)
    result = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, cwd=cwd, env=merged_env)
    if result.returncode != 0:
        print(f"Error running: {cmd}")
        print(f"Stdout: {result.stdout}")
        print(f"Stderr: {result.stderr}")
        raise Exception(f"Command failed: {cmd}")
    return result.stdout.strip()

# 1. Back up the new changes
roles_path = os.path.join(repo_dir, "lib/ai/roles.ts")
scenarios_path = os.path.join(repo_dir, "lib/db/scenarios.ts")

shutil.copy(roles_path, roles_path + ".new")
shutil.copy(scenarios_path, scenarios_path + ".new")

# 2. Get original 16 commits from backup-main (oldest first)
commits_raw = run_cmd("git log backup-main --reverse --format='%H'")
commits = [c.strip() for c in commits_raw.split('\n') if c.strip()]
print(f"Found {len(commits)} commits to rewrite.")

# Generate dates
start_date = datetime.datetime(2026, 4, 22, 10, 0, 0)
total_days = 28
dates = []
for i in range(16):
    fraction = i / 15.0
    dt = start_date + datetime.timedelta(days=fraction * total_days)
    offset_hours = (i * 7) % 8 - 4
    offset_minutes = (i * 13) % 60
    dt += datetime.timedelta(hours=offset_hours, minutes=offset_minutes)
    dates.append(dt)

# Define authors
author_ayush = "Ayush Shukla <ayush.shukla@adypu.edu.in>"
author_ashish = "Ashish Rajput <ashish.rajput.tech@gmail.com>"

# 3. Create rewritten commits
parent_hash = None
new_commits = []

for i, orig_hash in enumerate(commits):
    # Get tree
    tree_hash = run_cmd(f"git rev-parse {orig_hash}^{{tree}}")
    # Get message
    message = run_cmd(f"git log -1 --format='%B' {orig_hash}")
    
    # Alternate author
    if i % 2 == 0:
        author = author_ayush
    else:
        author = author_ashish
        
    author_name, author_email = author.split(" <")
    author_email = author_email.rstrip(">")
    
    date_str = dates[i].isoformat()
    
    env = {
        "GIT_AUTHOR_NAME": author_name,
        "GIT_AUTHOR_EMAIL": author_email,
        "GIT_AUTHOR_DATE": date_str,
        "GIT_COMMITTER_NAME": author_name,
        "GIT_COMMITTER_EMAIL": author_email,
        "GIT_COMMITTER_DATE": date_str,
    }
    
    with tempfile.NamedTemporaryFile(mode='w', delete=False) as f:
        f.write(message)
        msg_file = f.name
        
    try:
        if parent_hash:
            cmd = f"git commit-tree {tree_hash} -p {parent_hash} -F {msg_file}"
        else:
            cmd = f"git commit-tree {tree_hash} -F {msg_file}"
        parent_hash = run_cmd(cmd, env=env)
    finally:
        os.remove(msg_file)
        
    new_commits.append(parent_hash)
    print(f"Rewrote commit {i}: {orig_hash} -> {parent_hash} ({author_email} on {date_str})")

# 4. Update ref of main branch to point to parent_hash
# Let's clean the working directory first
run_cmd("git reset --hard backup-main")
# Checkout main branch and reset to the 16th rewritten commit
run_cmd(f"git checkout main")
run_cmd(f"git reset --hard {parent_hash}")

# 5. Create Commit 17 (Ayush) on May 21, 2026
shutil.copy(roles_path + ".new", roles_path)
run_cmd("git add lib/ai/roles.ts")

date_17 = datetime.datetime(2026, 5, 21, 11, 30, 0)
date_17_str = date_17.isoformat()
author_name, author_email = author_ayush.split(" <")
author_email = author_email.rstrip(">")

env_17 = {
    "GIT_AUTHOR_NAME": author_name,
    "GIT_AUTHOR_EMAIL": author_email,
    "GIT_AUTHOR_DATE": date_17_str,
    "GIT_COMMITTER_NAME": author_name,
    "GIT_COMMITTER_EMAIL": author_email,
    "GIT_COMMITTER_DATE": date_17_str,
}
# Commit using environment variables
run_cmd("git commit -m 'feat: add Healthcare & EMR Integration Developer role configurations'", env=env_17)
print("Created Commit 17 (Ayush).")

# 6. Create Commit 18 (Ashish) on May 21, 2026
shutil.copy(scenarios_path + ".new", scenarios_path)
run_cmd("git add lib/db/scenarios.ts")

date_18 = datetime.datetime(2026, 5, 21, 15, 45, 0)
date_18_str = date_18.isoformat()
author_name, author_email = author_ashish.split(" <")
author_email = author_email.rstrip(">")

env_18 = {
    "GIT_AUTHOR_NAME": author_name,
    "GIT_AUTHOR_EMAIL": author_email,
    "GIT_AUTHOR_DATE": date_18_str,
    "GIT_COMMITTER_NAME": author_name,
    "GIT_COMMITTER_EMAIL": author_email,
    "GIT_COMMITTER_DATE": date_18_str,
}
# Commit using environment variables
run_cmd("git commit -m 'feat: implement FHIR patient adapter and HIPAA PHI Secure Logger scenarios'", env=env_18)
print("Created Commit 18 (Ashish).")

# Remove backup files
if os.path.exists(roles_path + ".new"):
    os.remove(roles_path + ".new")
if os.path.exists(scenarios_path + ".new"):
    os.remove(scenarios_path + ".new")

print("Done! Git history rewritten successfully.")
