from pathlib import Path
import re
files = [p for p in Path('apps/mindmark-web/src/views/teacher').glob('*.vue') if p.name != 'QuestionBankView.vue']

def clean_attrs(attrs: str) -> str:
    attrs = re.sub(r'\s*type="button"', '', attrs)
    return attrs

def repl_button(match, variant):
    attrs = clean_attrs(match.group(1))
    body = match.group(2)
    var = '' if variant == 'secondary' else f' variant="{variant}"'
    return f'<AppActionButton{var}{attrs}>{body}</AppActionButton>'

def repl_link(match, variant):
    attrs = match.group(1)
    body = match.group(2)
    var = '' if variant == 'secondary' else f' variant="{variant}"'
    return f'<AppActionButton{var}{attrs}>{body}</AppActionButton>'

changed = []
for path in files:
    text = path.read_text(encoding='utf-8')
    original = text
    patterns = [
        (r'<button\s+class="primary-button"([^>]*)>(.*?)</button>', 'primary', repl_button),
        (r'<button\s+class="secondary-button"([^>]*)>(.*?)</button>', 'secondary', repl_button),
        (r'<button\s+class="secondary-button danger-button"([^>]*)>(.*?)</button>', 'danger', repl_button),
        (r'<RouterLink\s+class="primary-button"([^>]*)>(.*?)</RouterLink>', 'primary', repl_link),
        (r'<RouterLink\s+class="secondary-button"([^>]*)>(.*?)</RouterLink>', 'secondary', repl_link),
    ]
    # danger must run before secondary to avoid partial class exact doesn't overlap? order fix.
    patterns = [
        (r'<button\s+class="secondary-button danger-button"([^>]*)>(.*?)</button>', 'danger', repl_button),
        (r'<button\s+class="primary-button"([^>]*)>(.*?)</button>', 'primary', repl_button),
        (r'<button\s+class="secondary-button"([^>]*)>(.*?)</button>', 'secondary', repl_button),
        (r'<RouterLink\s+class="primary-button"([^>]*)>(.*?)</RouterLink>', 'primary', repl_link),
        (r'<RouterLink\s+class="secondary-button"([^>]*)>(.*?)</RouterLink>', 'secondary', repl_link),
    ]
    for pattern, variant, func in patterns:
        text = re.sub(pattern, lambda m, v=variant, f=func: f(m, v), text, flags=re.S)
    if text != original:
        if "AppActionButton" not in original:
            marker = "import EmptyState from '@/components/common/EmptyState.vue';\n"
            if marker in text:
                text = text.replace(marker, "import AppActionButton from '@/components/common/AppActionButton.vue';\n" + marker, 1)
            else:
                script_marker = "<script setup lang=\"ts\">\n"
                text = text.replace(script_marker, script_marker + "import AppActionButton from '@/components/common/AppActionButton.vue';\n", 1)
        path.write_text(text, encoding='utf-8')
        changed.append(path.name)
print('\n'.join(changed))
