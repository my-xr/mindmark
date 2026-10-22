const fs = require('fs');
const file = 'apps/mindmark-web/src/styles/visual-alignment.css';
let s = fs.readFileSync(file, 'utf8');
if (s.charCodeAt(0) === 0xfeff) s = s.slice(1);
const anchor = `.paper-question-item {
  grid-template-columns: 32px minmax(0, 1fr) auto;
}
`;
const block = `
.paper-question-item .question-order {
  color: #fff;
  background: var(--mm-color-primary);
  border: 1px solid var(--mm-color-primary);
  box-shadow: 0 0 0 3px var(--mm-color-primary-soft);
}

:root[data-theme='dark'] .paper-question-item .question-order {
  color: #08111f;
  background: #93c5fd;
  border-color: #bfdbfe;
  box-shadow: 0 0 0 3px rgb(147 197 253 / 18%);
}
`;
if (!s.includes('.paper-question-item .question-order {')) {
  s = s.replace(anchor, anchor + block);
}
fs.writeFileSync(file, s, 'utf8');
