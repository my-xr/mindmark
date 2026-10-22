from pathlib import Path

def replace_once(text, old, new, path):
    if old not in text:
        raise SystemExit(f'Missing pattern in {path}: {old!r}')
    return text.replace(old, new, 1)

p = Path('apps/mindmark-web/src/components/admin/AdminAuditSection.vue')
text = p.read_text(encoding='utf-8')
if 'data-testid="admin-audits-section"' not in text:
    text = replace_once(text, '<section class="content-card admin-section-card">', '<section class="content-card admin-section-card" data-testid="admin-audits-section">', p)
if 'data-testid="admin-audit-filter-toggle"' not in text:
    text = replace_once(text, 'class="secondary-button filter-toggle-button"', 'data-testid="admin-audit-filter-toggle" class="secondary-button filter-toggle-button"', p)
if 'data-testid="admin-audit-query"' not in text:
    text = replace_once(text, '<button\n          class="secondary-button"\n          type="button"\n          :disabled="auditLoading"', '<button\n          data-testid="admin-audit-query"\n          class="secondary-button"\n          type="button"\n          :disabled="auditLoading"', p)
for key in ['actorId','targetUserId','action','result']:
    testid = {'actorId':'admin-audit-actor','targetUserId':'admin-audit-target','action':'admin-audit-action','result':'admin-audit-result'}[key]
    if f'data-testid="{testid}"' not in text:
        tag = 'input' if key != 'result' else 'select'
        text = replace_once(text, f'<{tag}\n          :value="filters.{key}"', f'<{tag}\n          data-testid="{testid}"\n          :value="filters.{key}"', p)
if 'data-testid="admin-audit-row"' not in text:
    text = replace_once(text, '<article v-for="log in auditLogs" :key="log.id" class="audit-item">', '<article v-for="log in auditLogs" :key="log.id" class="audit-item" data-testid="admin-audit-row">', p)
p.write_text(text, encoding='utf-8', newline='\n')
print('finished audit test ids')
