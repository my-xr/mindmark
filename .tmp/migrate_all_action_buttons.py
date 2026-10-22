from pathlib import Path
import re

root = Path('apps/mindmark-web/src')
files = [p for p in root.rglob('*.vue') if p.name != 'AppActionButton.vue']
button_re = re.compile(r'<button(?P<attrs>[^>]*)>(?P<body>.*?)</button>', re.S)
router_re = re.compile(r'<RouterLink(?P<attrs>[^>]*)>(?P<body>.*?)</RouterLink>', re.S)

button_tokens = {'primary-button', 'secondary-button', 'danger-button'}

def class_value(attrs: str):
    m = re.search(r'\sclass="([^"]*)"', attrs)
    return m.group(1) if m else None

def clean_attrs(attrs: str, variant: str):
    cls = class_value(attrs)
    attrs2 = attrs
    remaining = []
    if cls is not None:
        tokens = cls.split()
        if 'danger-text' in tokens:
            variant = 'danger'
        remaining = [t for t in tokens if t not in {'primary-button','secondary-button','danger-button','danger-text'}]
        attrs2 = re.sub(r'\sclass="[^"]*"', '', attrs2, count=1)
    attrs2 = re.sub(r'\stype="button"', '', attrs2)
    attrs2 = re.sub(r'\stype="submit"', ' html-type="submit"', attrs2)
    # keep existing indentation/line breaks; add class/variant near the beginning
    insert = ''
    if remaining:
        insert += f' class="{" ".join(remaining)}"'
    if variant != 'secondary':
        insert += f' variant="{variant}"'
    return insert + attrs2

def has_button_class(attrs: str):
    cls = class_value(attrs)
    if not cls:
        return False
    return any(t in cls.split() for t in button_tokens) or 'danger-text' in cls.split()

def determine_variant(attrs: str):
    cls = class_value(attrs) or ''
    tokens = cls.split()
    if 'danger-button' in tokens or 'danger-text' in tokens:
        return 'danger'
    if 'primary-button' in tokens:
        return 'primary'
    return 'secondary'

changed_files=[]
for p in files:
    s = p.read_text(encoding='utf-8-sig')
    original = s

    def repl_button(m):
        attrs = m.group('attrs')
        if not has_button_class(attrs):
            return m.group(0)
        variant = determine_variant(attrs)
        new_attrs = clean_attrs(attrs, variant)
        return f'<AppActionButton{new_attrs}>{m.group("body")}</AppActionButton>'

    def repl_router(m):
        attrs = m.group('attrs')
        if not has_button_class(attrs):
            return m.group(0)
        variant = determine_variant(attrs)
        new_attrs = clean_attrs(attrs, variant)
        return f'<AppActionButton{new_attrs}>{m.group("body")}</AppActionButton>'

    s = button_re.sub(repl_button, s)
    s = router_re.sub(repl_router, s)

    if '<AppActionButton' in s and "@/components/common/AppActionButton.vue" not in s:
        if '<script setup' not in s:
            s = '<script setup lang="ts">\nimport AppActionButton from \'@/components/common/AppActionButton.vue\';\n</script>\n\n' + s
        else:
            # insert after script setup line
            s = re.sub(r'(<script setup[^>]*>\n)', r"\1import AppActionButton from '@/components/common/AppActionButton.vue';\n", s, count=1)
    if s != original:
        p.write_text(s, encoding='utf-8')
        changed_files.append(str(p))

print('\n'.join(changed_files))
