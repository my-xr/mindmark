const fs = require('fs');
const file = 'apps/mindmark-web/src/styles/themes.css';
let s = fs.readFileSync(file, 'utf8');
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
const block = `
:root[data-theme='dark'] .table-head,
:root[data-theme='dark'] .student-account-row--head,
:root[data-theme='dark'] .admin-user-row--head,
:root[data-theme='dark'] .assignment-row--head {
  color: var(--mm-color-text-secondary);
  background: #111c2d;
}

:root[data-theme='dark'] .paper-list-item:hover,
:root[data-theme='dark'] .paper-list-item--active,
:root[data-theme='dark'] .grading-task-button--active,
:root[data-theme='dark'] .score-exam-button--active,
:root[data-theme='dark'] .student-score-card--active,
:root[data-theme='dark'] .student-nav-item.active,
:root[data-theme='dark'] .student-nav-item:hover {
  color: var(--mm-color-primary-hover);
  background: rgb(96 165 250 / 14%);
  border-color: rgb(96 165 250 / 28%);
}

:root[data-theme='dark'] .question-order,
:root[data-theme='dark'] .question-number-grid button.answered:not(.active) {
  color: #93c5fd;
  background: rgb(96 165 250 / 14%);
  border-color: rgb(96 165 250 / 24%);
}

:root[data-theme='dark'] .question-number-grid button,
:root[data-theme='dark'] .review-question-card,
:root[data-theme='dark'] .admin-tabs,
:root[data-theme='dark'] .assignment-user-card,
:root[data-theme='dark'] .audit-item,
:root[data-theme='dark'] .student-account-table,
:root[data-theme='dark'] .admin-user-table,
:root[data-theme='dark'] .assignment-table {
  background: var(--mm-color-card);
  border-color: var(--mm-color-border);
}

:root[data-theme='dark'] .admin-tabs button.active {
  color: var(--mm-color-text);
  background: rgb(96 165 250 / 14%);
  box-shadow: none;
}

:root[data-theme='dark'] .state-card--error .state-card-icon {
  color: #fca5a5;
  background: rgb(127 29 29 / 26%);
}

`;
if (!s.includes(`:root[data-theme='dark'] .table-head,`)) {
  s = s.replace(`:root[data-theme='dark'] .status-tag--default {`, block + `:root[data-theme='dark'] .status-tag--default {`);
}
fs.writeFileSync(file, s, 'utf8');
