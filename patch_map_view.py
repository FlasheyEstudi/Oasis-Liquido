import re

file_path = 'Frontend/src/components/common/map-view-inner.tsx'
with open(file_path, 'r') as f:
    content = f.read()

# Replace with getApiUrl()
search_str = """          const res = await fetch(`/api/v1/routes/driving?origin=${route.origin}&destination=${route.destination}`);"""
replace_str = """          const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL || '/api/v1'}/routes/driving?origin=${route.origin}&destination=${route.destination}`);"""

content = content.replace(search_str, replace_str)

with open(file_path, 'w') as f:
    f.write(content)
