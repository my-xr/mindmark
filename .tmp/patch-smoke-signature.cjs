const fs = require('fs');
const p = 'scripts/api-smoke/run-pagination-contract-smoke.ps1';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
s = s.replace(`function Get-ItemIdSignature([object] $Items) {
    return (($Items | ForEach-Object { $_.id }) -join ",")
}`, `function Get-ItemIdSignature([object] $Items) {
    return (($Items | ForEach-Object {
        if ($_.PSObject.Properties.Name -contains "id") { $_.id }
        elseif ($_.PSObject.Properties.Name -contains "examId") { $_.examId }
        elseif ($_.PSObject.Properties.Name -contains "questionId") { $_.questionId }
        else { $_ | ConvertTo-Json -Compress -Depth 10 }
    }) -join ",")
}`);
fs.writeFileSync(p, s, 'utf8');
