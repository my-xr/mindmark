const fs = require('fs');
const s = fs.readFileSync('apps/mindmark-web/src/views/teacher/ReviewsView.vue', 'utf8');
const esc = (x) => x.replace(/[^\x00-\x7F]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
console.log(esc(s.slice(0, 500)));
const start = s.indexOf('<section class="content-card review-current-card">');
const end = s.indexOf('\n        </section>', start) + '\n        </section>'.length;
console.log({ start, end });
console.log(esc(s.slice(start, end)));
