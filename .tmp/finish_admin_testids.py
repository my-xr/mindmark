from pathlib import Path

def replace_once(text, old, new, path):
    if old not in text:
        raise SystemExit(f'Missing pattern in {path}: {old!r}')
    return text.replace(old, new, 1)

p = Path('apps/mindmark-web/src/components/admin/AdminAssignmentSection.vue')
text = p.read_text(encoding='utf-8')
# Some previous replacements may not be written because script aborted before write. Apply only if missing.
if 'data-testid="admin-assignments-section"' not in text:
    text = replace_once(text, '<section class="content-card admin-section-card">', '<section class="content-card admin-section-card" data-testid="admin-assignments-section">', p)
if 'data-testid="admin-assignments-refresh"' not in text:
    text = replace_once(text, '<button\n        class="secondary-button"', '<button\n        data-testid="admin-assignments-refresh"\n        class="secondary-button"', p)
if 'data-testid="admin-role-checkbox"' not in text:
    text = replace_once(text, '<input\n              type="checkbox"', '<input\n              data-testid="admin-role-checkbox"\n              type="checkbox"', p)
if 'data-testid="admin-assignment-class"' not in text:
    text = replace_once(text, '<select\n              :value="assignmentForm.classId"', '<select\n              data-testid="admin-assignment-class"\n              :value="assignmentForm.classId"', p)
if 'data-testid="admin-assignment-role"' not in text:
    text = replace_once(text, '<select\n              :value="assignmentForm.assignmentRole"', '<select\n              data-testid="admin-assignment-role"\n              :value="assignmentForm.assignmentRole"', p)
if 'data-testid="admin-assignment-row"' not in text:
    text = replace_once(text, '<div v-for="assignment in assignments" :key="assignment.id" class="assignment-row">', '<div v-for="assignment in assignments" :key="assignment.id" class="assignment-row" data-testid="admin-assignment-row">', p)
if 'data-testid="admin-save-roles"' not in text:
    start = text.find('<button class="primary-button" type="button" @click="emit(\'save-roles\')">')
    end = text.find('</button>', start) + len('</button>')
    text = text[:start] + '<button data-testid="admin-save-roles" class="primary-button" type="button" @click="emit(\'save-roles\')">Save roles</button>' + text[end:]
if 'data-testid="admin-assignment-save"' not in text:
    start = text.find('<button class="primary-button" type="button" @click="emit(\'upsert\')">')
    end = text.find('</button>', start) + len('</button>')
    text = text[:start] + '<button data-testid="admin-assignment-save" class="primary-button" type="button" @click="emit(\'upsert\')">Save assignment</button>' + text[end:]
if 'data-testid="admin-assignment-delete"' not in text:
    text = replace_once(text, '<button\n                class="secondary-button danger-text"', '<button\n                data-testid="admin-assignment-delete"\n                class="secondary-button danger-text"', p)
p.write_text(text, encoding='utf-8', newline='\n')

p = Path('apps/mindmark-web/src/components/admin/AdminAuditSection.vue')
text = p.read_text(encoding='utf-8')
if 'data-testid="admin-audits-section"' not in text:
    text = replace_once(text, '<section class="content-card admin-section-card">', '<section class="content-card admin-section-card" data-testid="admin-audits-section">', p)
if 'data-testid="admin-audit-filter-toggle"' not in text:
    text = replace_once(text, 'class="secondary-button filter-toggle-button"', 'data-testid="admin-audit-filter-toggle" class="secondary-button filter-toggle-button"', p)
if 'data-testid="admin-audit-query"' not in text:
    text = replace_once(text, '<button class="secondary-button" type="button" :disabled="auditLoading" @click="emit(\'query\')">', '<button data-testid="admin-audit-query" class="secondary-button" type="button" :disabled="auditLoading" @click="emit(\'query\')">', p)
if 'data-testid="admin-audit-actor"' not in text:
    text = replace_once(text, '<input\n          :value="filters.actorId"', '<input\n          data-testid="admin-audit-actor"\n          :value="filters.actorId"', p)
if 'data-testid="admin-audit-target"' not in text:
    text = replace_once(text, '<input\n          :value="filters.targetUserId"', '<input\n          data-testid="admin-audit-target"\n          :value="filters.targetUserId"', p)
if 'data-testid="admin-audit-action"' not in text:
    text = replace_once(text, '<input\n          :value="filters.action"', '<input\n          data-testid="admin-audit-action"\n          :value="filters.action"', p)
if 'data-testid="admin-audit-result"' not in text:
    text = replace_once(text, '<select\n          :value="filters.result"', '<select\n          data-testid="admin-audit-result"\n          :value="filters.result"', p)
if 'data-testid="admin-audit-row"' not in text:
    text = replace_once(text, '<article v-for="log in auditLogs" :key="log.id" class="audit-item">', '<article v-for="log in auditLogs" :key="log.id" class="audit-item" data-testid="admin-audit-row">', p)
p.write_text(text, encoding='utf-8', newline='\n')
print('finished assignment/audit test ids')
