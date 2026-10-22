const fs = require('fs');
const file = 'apps/mindmark-web/src/styles/themes.css';
let s = fs.readFileSync(file, 'utf8');
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
s = s.replace(`:root[data-theme='dark'] {
  --mm-color-primary: #60a5fa;
  --mm-color-primary-hover: #93c5fd;
  --mm-color-primary-soft: #172554;
  --mm-color-accent: #22d3ee;
  --mm-color-accent-soft: #083344;
  --mm-color-text: #e5edf7;
  --mm-color-text-secondary: #a8b4c7;
  --mm-color-text-tertiary: #7c8aa2;
  --mm-color-border: #263348;
  --mm-color-border-strong: #334155;
  --mm-color-bg: #0b1020;
  --mm-color-card: #111827;
  --mm-color-card-glass: rgb(17 24 39 / 88%);
  --mm-sidebar-bg: #0f172a;
  --mm-sidebar-text: #e2e8f0;
  --mm-sidebar-muted: #94a3b8;
  --mm-sidebar-active-bg: rgb(96 165 250 / 16%);
  --mm-sidebar-active-text: #bfdbfe;
  --mm-sidebar-border: #1f2937;
  --mm-topbar-bg: #111827;
}`, `:root[data-theme='dark'] {
  --mm-color-primary: #60a5fa;
  --mm-color-primary-hover: #93c5fd;
  --mm-color-primary-soft: #1d315b;
  --mm-color-accent: #22d3ee;
  --mm-color-accent-soft: #103846;
  --mm-color-text: #e6edf7;
  --mm-color-text-secondary: #aebbd0;
  --mm-color-text-tertiary: #8290a6;
  --mm-color-border: #2b3950;
  --mm-color-border-strong: #3a4a62;
  --mm-color-bg: #101827;
  --mm-color-card: #182235;
  --mm-color-card-glass: rgb(24 34 53 / 90%);
  --mm-sidebar-bg: #121c2e;
  --mm-sidebar-text: #e6edf7;
  --mm-sidebar-muted: #9aa8bd;
  --mm-sidebar-active-bg: rgb(96 165 250 / 18%);
  --mm-sidebar-active-text: #d7e8ff;
  --mm-sidebar-border: #2b3950;
  --mm-topbar-bg: #151f31;
}`);

const anchor = `.portal-layout > .portal-sidebar,\n.portal-sidebar.admin-sidebar {`;
const insert = `body,
#app,
.portal-layout,
.portal-main,
.student-layout,
.blank-layout {
  background: var(--mm-color-bg);
}

.portal-content,
.student-content {
  color: var(--mm-color-text);
  background: transparent;
}

`;
if (!s.includes('body,\n#app,\n.portal-layout,')) {
  s = s.replace(anchor, insert + anchor);
}

const titleRule = `.portal-topbar-left > strong,
.section-title h2,`;
if (!s.includes('.page-header h1:not(.unused-page-header-title),')) {
  s = s.replace(titleRule, `.portal-topbar-left > strong,
.page-header h1:not(.unused-page-header-title),
.section-title h2,`);
}

const darkBlock = `
:root[data-theme='dark'] .portal-layout,
:root[data-theme='dark'] .student-layout,
:root[data-theme='dark'] .blank-layout {
  background:
    radial-gradient(circle at 16% -10%, rgb(96 165 250 / 10%), transparent 30%),
    linear-gradient(180deg, #121a2b 0%, var(--mm-color-bg) 42%, #0f1726 100%);
}

:root[data-theme='dark'] .content-card,
:root[data-theme='dark'] .state-card,
:root[data-theme='dark'] .auth-card,
:root[data-theme='dark'] .filter-card,
:root[data-theme='dark'] .preview-card,
:root[data-theme='dark'] .question-panel,
:root[data-theme='dark'] .question-card,
:root[data-theme='dark'] .metric-card,
:root[data-theme='dark'] .exam-list-card article.exam-row {
  box-shadow: 0 10px 26px rgb(0 0 0 / 18%);
}

:root[data-theme='dark'] .content-card:hover,
:root[data-theme='dark'] .filter-card:hover,
:root[data-theme='dark'] .preview-card:hover {
  border-color: #45566f;
  box-shadow: 0 14px 32px rgb(0 0 0 / 24%);
}

:root[data-theme='dark'] .portal-menu-emoji,
:root[data-theme='dark'] .portal-menu .portal-menu-item.active .portal-menu-emoji {
  background: rgb(230 237 247 / 7%);
  border-color: rgb(230 237 247 / 10%);
}

:root[data-theme='dark'] .text-input::placeholder,
:root[data-theme='dark'] .textarea-input::placeholder {
  color: #6f7d92;
}

`;
if (!s.includes(`:root[data-theme='dark'] .portal-layout,`)) {
  s = s.replace(`:root[data-theme='dark'] .status-tag--default {`, darkBlock + `:root[data-theme='dark'] .status-tag--default {`);
}

fs.writeFileSync(file, s, 'utf8');
