const fs = require('fs');
const p = 'apps/mindmark-web/src/styles/visual-alignment.css';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(`.papers-page .paper-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px;
  padding: 12px;
  margin: 0;
  background: color-mix(in srgb, var(--mm-color-card) 86%, var(--mm-color-bg));
  border: 1px solid var(--mm-color-border);
  border-radius: 7px;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}`, `.papers-page .paper-list-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 10px;
  align-items: center;
  padding: 12px;
  margin: 0;
  background: color-mix(in srgb, var(--mm-color-card) 86%, var(--mm-color-bg));
  border: 1px solid var(--mm-color-border);
  border-radius: 7px;
  transition:
    background-color 0.16s ease,
    border-color 0.16s ease,
    box-shadow 0.16s ease;
}`);
const after = `.papers-page .paper-list-item--active,
.papers-page .paper-list-item--active:hover {
  padding: 12px;
  background: color-mix(in srgb, var(--mm-color-primary) 7%, var(--mm-color-card));
  border-color: color-mix(in srgb, var(--mm-color-primary) 42%, var(--mm-color-border));
  box-shadow: inset 3px 0 0 var(--mm-color-primary);
}
`;
const insert = `${after}
.papers-page .paper-list-item__clickable {
  display: grid;
  min-width: 0;
  gap: 8px;
  padding: 0;
  margin: 0;
  color: inherit;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  appearance: none;
}

.papers-page .paper-list-item__clickable:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--mm-color-primary) 42%, transparent);
  outline-offset: 3px;
}

.papers-page .paper-list-item__actions {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  justify-content: flex-end;
}
`;
if (!s.includes('.papers-page .paper-list-item__clickable')) {
  s = s.replace(after, insert);
}
s = s.replace(`  .papers-page .paper-list-card--full .paper-list-item {
    grid-template-columns: minmax(0, 1fr);
  }
`, `  .papers-page .paper-list-card--full .paper-list-item {
    grid-template-columns: minmax(0, 1fr);
  }

  .papers-page .paper-list-item__actions {
    justify-content: flex-start;
  }
`);
fs.writeFileSync(p, s, 'utf8');
