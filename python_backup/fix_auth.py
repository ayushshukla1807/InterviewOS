import re

with open('app/candidate/page.tsx', 'r') as f:
    content = f.read()

# Replace user = await res.json() with handling the nested object
old_code = """        const user = await res.json();
        
        if (user.role !== 'candidate') {"""

new_code = """        const data = await res.json();
        const user = data.user || data;
        
        if (user.role !== 'candidate') {"""

content = content.replace(old_code, new_code)

with open('app/candidate/page.tsx', 'w') as f:
    f.write(content)
print("Auth fixed!")
