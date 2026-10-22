const fs = require('fs');
const p = 'apps/mindmark-web/src/styles/visual-alignment.css';
let s = fs.readFileSync(p, 'utf8');
s = s.replace(/\n\/\* Filter and generation option chips:[\s\S]*?(?=\n\/\* Slimmer focus state for form controls)/, '\n');
fs.writeFileSync(p, s, 'utf8');
