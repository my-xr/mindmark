const fs = require('fs');
const p = 'apps/mindmark-web/src/services/paperService.ts';
let s = fs.readFileSync(p, 'utf8');
if (!s.includes('export async function deletePaper(')) {
  const insert = `export async function deletePaper(paperId: string): Promise<void> {
  if (!useMockApi) {
    await apiDelete<boolean>(\`/v1/papers/\${paperId}\`);
    return;
  }

  papers = papers.filter((paper) => paper.id !== paperId);
  await mockDelay(undefined);
}

`;
  s = s.replace('export async function listPapers(): Promise<Paper[]> {', insert + 'export async function listPapers(): Promise<Paper[]> {');
}
fs.writeFileSync(p, s, 'utf8');
