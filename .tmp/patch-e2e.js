const fs=require('fs');
const p='apps/mindmark-web/e2e/teacher-pages.spec.ts';
let s=fs.readFileSync(p,'utf8');
s=s.replace("const filterToggle = page.locator('.filter-toggle-button').first();", "const filterToggle = page.getByRole('button', { name: /收起到一行|展开全部|展开筛选|收起筛选/ }).first();");
s=s.replace("const generateToggle = page.locator('.filter-toggle-button').first();", "const generateToggle = page.getByRole('button', { name: /收起到一行|展开全部|展开生成|收起生成/ }).first();");
s=s.replace("const firstPaper = page.locator('.paper-card').first();", "const firstPaper = page.locator('.paper-list-item').first();");
fs.writeFileSync(p,s,'utf8');
