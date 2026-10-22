const fs = require('fs');
const p = 'apps/mindmark-web/src/styles/visual-alignment.css';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(
  'box-shadow: 0 0 0 3px color-mix(in srgb, var(--mm-color-primary) 14%, transparent);',
  'box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 12%, transparent);',
);
const marker = '/* Slimmer focus state for form controls';
if (!s.includes(marker)) {
  s = s.replace(/\s*$/, '') + `

/* Slimmer focus state for form controls: keep feedback clear without a heavy border. */
.text-input:focus,
.select-input:focus,
.textarea-input:focus {
  border-color: color-mix(in srgb, var(--mm-color-primary) 68%, var(--mm-color-border));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mm-color-primary) 10%, transparent);
}

.text-input:focus-visible,
.select-input:focus-visible,
.textarea-input:focus-visible {
  outline: 0;
}

:root[data-theme='dark'] .text-input:focus,
:root[data-theme='dark'] .select-input:focus,
:root[data-theme='dark'] .textarea-input:focus {
  border-color: rgb(147 197 253 / 58%);
  box-shadow: 0 0 0 2px rgb(147 197 253 / 12%);
}
`;
}
fs.writeFileSync(p, s + '\n', 'utf8');
