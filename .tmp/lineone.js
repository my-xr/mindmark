const fs = require('fs');
const p = process.argv[2];
const lines = fs.readFileSync(p, 'utf8').split(/\r?\n/);
for (let i=0;i<lines.length;i++) console.log(String(i+1).padStart(4)+': '+lines[i]);
