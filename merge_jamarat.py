#!/usr/bin/env python3
"""Merge custom code from old Jamarat Aqabah index.htm into new 3DVista export."""
import subprocess, re

OLD_PATH = 'pilgrimspath-vr/pilgrims path main/Jamarat Aqabah/index.htm'
NEW_PATH = 'pilgrimspath-vr/pilgrims path main/Jamarat Aqabah/index.htm'

# Get the old file content from git
result = subprocess.run(
    ['git', 'show', f'HEAD:{OLD_PATH}'],
    capture_output=True, text=True
)
old = result.stdout

# Read the current (new) file
with open(NEW_PATH, 'r', encoding='utf-8') as f:
    new = f.read()

# ===== Extract OLD custom sections =====

# 1. HEAD custom scripts (cache-nuke, favicon, admin-journey-content, journey-content-loader, Meta Pixel, vr-ambient-fix)
# These are from line 4 (cache-nuke) up to but not including the standard 3DVista meta tags
head_inject_match = re.search(
    r'(<script>\/\* cache-nuke.*?</script>.*?<script src="/pilgrimspath-vr/vr-ambient-fix\.js.*?</script>)',
    old, re.DOTALL
)
if head_inject_match:
    head_inject = head_inject_match.group(1)
    print("Found HEAD inject block:")
    print(head_inject[:200])
else:
    print("ERROR: Could not find head inject block")
    exit(1)

# 2. BODY custom code — everything after the viewer div up to </body>
# The viewer div ends with: <div id="viewer" class="fill-viewport"></div>
# Then custom code follows
body_match = re.search(
    r'(<div id="viewer" class="fill-viewport"></div>\s*)(.*?)(</body>)',
    old, re.DOTALL
)
if body_match:
    body_custom = body_match.group(2)
    print(f"\nFound BODY custom code: {len(body_custom)} chars")
    print("First 200 chars:", body_custom[:200])
else:
    print("ERROR: Could not find body custom code")
    exit(1)

# Also need: favicon link
favicon_match = re.search(r'(<link rel="icon"[^>]+>)', old)
favicon = favicon_match.group(1) if favicon_match else ''
print(f"\nFavicon: {favicon[:80]}")

# ===== Build the new merged file =====

# The new file structure:
# <!DOCTYPE html>
# <html lang="en">
# <head>
#     <title>jamarat Aqabah</title>  <- insert custom scripts BEFORE this
#     <meta ... />
#     ...
#     <style>...</style>
# </head>
# <body>
#     <div id="preloadContainer">...</div>
#     <div id="viewer" class="fill-viewport"></div>  <- insert body custom AFTER this
# </body>
# </html>

# Step 1: Insert HEAD custom code just before <title>
merged = new.replace(
    '    <title>jamarat Aqabah</title>',
    head_inject + '\n    ' + favicon + '\n    <title>jamarat Aqabah</title>'
)

# Step 2: Insert BODY custom code just before </body>
# Handle both same-line and separate-line </body></html>
if '</body></html>' in merged:
    merged = merged.replace('</body></html>', body_custom + '</body>\n</html>')
else:
    # Separate lines — insert before last </body>
    last_body = merged.rfind('</body>')
    merged = merged[:last_body] + body_custom + merged[last_body:]

# Step 3: Write the merged file
with open(NEW_PATH, 'w', encoding='utf-8') as f:
    f.write(merged)

print(f"\n✓ Merged file written: {len(merged.splitlines())} lines")

# Quick validation
with open(NEW_PATH, 'r') as f:
    content = f.read()
checks = [
    ('journey-content-loader.js', 'journey-content-loader'),
    ('scene-nav-overlay.js', 'scene-nav-overlay'),
    ('journey-manager.js', 'journey-manager'),
    ('jamarThrowBtn', 'throw button'),
    ('_jbChk', 'banner system'),
    ('tdvplayer.js', '3DVista player'),
]
print("\nValidation:")
for check, label in checks:
    found = check in content
    print(f"  {'✓' if found else '✗'} {label}: {check}")
