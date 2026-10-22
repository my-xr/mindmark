const fs = require('fs');
const file = 'apps/mindmark-web/src/styles/themes.css';
let s = fs.readFileSync(file, 'utf8');
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
s = s.replace(`body,
#app,`, `:root body,
#app,`);
s = s.replace(`.portal-topbar-left > strong,
.page-header h1:not(.unused-page-header-title),
.section-title h2,`, `.portal-topbar-left > strong,
.portal-content .page-header h1:not(.unused-page-header-title),
.student-content .page-header h1:not(.unused-page-header-title),
.blank-layout .page-header h1:not(.unused-page-header-title),
.section-title h2,`);
fs.writeFileSync(file, s, 'utf8');
