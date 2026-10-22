const fs = require('fs');
const p = 'scripts/api-smoke/run-pagination-contract-smoke.ps1';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const helper = `
function Get-ItemCount([object] $Items) {
    return ($Items | Measure-Object).Count
}

function Get-ItemIdSignature([object] $Items) {
    return (($Items | ForEach-Object { $_.id }) -join ",")
}

function Assert-SecondPageWindow([string] $Path, [object] $FirstPage, [string] $Name) {
    if ($FirstPage.total -le $FirstPage.pageSize) {
        return
    }

    $secondPage = (Invoke-MindMarkApi GET $Path $null $headers).data
    Assert-PageResponse $secondPage $FirstPage.pageSize "$Name second page"
    Assert-True ((Get-ItemIdSignature $FirstPage.items) -ne (Get-ItemIdSignature $secondPage.items)) "$Name first and second page windows differ"
}

function Assert-Ascending([object] $Items, [string] $PropertyName, [string] $Name) {
    $previous = $null
    foreach ($item in $Items) {
        $current = $item.$PropertyName
        if ($null -ne $previous) {
            Assert-True ($previous -le $current) "$Name is sorted ascending by $PropertyName"
        }
        $previous = $current
    }
}

function Assert-DescendingDate([object] $Items, [string] $PropertyName, [string] $Name) {
    $previous = $null
    foreach ($item in $Items) {
        $current = [datetimeoffset]$item.$PropertyName
        if ($null -ne $previous) {
            Assert-True ($previous -ge $current) "$Name is sorted descending by $PropertyName"
        }
        $previous = $current
    }
}
`;
s = s.replace(`function Assert-PageResponse([object] $Page, [int] $ExpectedPageSize, [string] $Name) {
    Assert-True ($null -ne $Page.items) "$Name has items array"
    Assert-True ($Page.total -ge 0) "$Name total is non-negative"
    Assert-True ($Page.page -ge 1) "$Name page is one-based"
    Assert-True ($Page.pageSize -eq $ExpectedPageSize) "$Name pageSize is normalized"
    Assert-True ($Page.totalPages -ge 1) "$Name totalPages is present"
    Assert-True ($Page.page -le $Page.totalPages) "$Name page is not beyond totalPages"
    Assert-True (($Page.items | Measure-Object).Count -le $ExpectedPageSize) "$Name item count does not exceed pageSize"
    Assert-True ($null -ne $Page.hasPrevious) "$Name hasPrevious is present"
    Assert-True ($null -ne $Page.hasNext) "$Name hasNext is present"
}
`, `function Assert-PageResponse([object] $Page, [int] $ExpectedPageSize, [string] $Name) {
    Assert-True ($null -ne $Page.items) "$Name has items array"
    Assert-True ($Page.total -ge 0) "$Name total is non-negative"
    Assert-True ($Page.page -ge 1) "$Name page is one-based"
    Assert-True ($Page.pageSize -eq $ExpectedPageSize) "$Name pageSize is normalized"
    Assert-True ($Page.totalPages -ge 1) "$Name totalPages is present"
    Assert-True ($Page.page -le $Page.totalPages) "$Name page is not beyond totalPages"
    Assert-True ((Get-ItemCount $Page.items) -le $ExpectedPageSize) "$Name item count does not exceed pageSize"
    Assert-True ($null -ne $Page.hasPrevious) "$Name hasPrevious is present"
    Assert-True ($null -ne $Page.hasNext) "$Name hasNext is present"
}
${helper}`);
s = s.replace(`$summary.questionBankTotal = $questionPage.total
`, `$summary.questionBankTotal = $questionPage.total
Assert-SecondPageWindow "/api/v1/questions?page=2&pageSize=2" $questionPage "question bank"
`);
s = s.replace(`    Assert-PageResponse $paperQuestionPage 2 "paper questions page"
    $summary.paperQuestionTotal = $paperQuestionPage.total
`, `    Assert-PageResponse $paperQuestionPage 2 "paper questions page"
    Assert-Ascending $paperQuestionPage.items "order" "paper questions page"
    $paperQuestionAllPage = (Invoke-MindMarkApi GET "/api/v1/papers/$($paperItem.id)/questions?page=1&pageSize=100" $null $headers).data
    $selectedQuestionIds = @($paperQuestionAllPage.items | ForEach-Object { $_.questionId })
    $availableQuestionPage = (Invoke-MindMarkApi GET "/api/v1/questions?status=ACTIVE&excludePaperId=$($paperItem.id)&page=1&pageSize=20" $null $headers).data
    Assert-PageResponse $availableQuestionPage 20 "available question excludePaperId page"
    foreach ($availableQuestion in $availableQuestionPage.items) {
        Assert-True (-not ($selectedQuestionIds -contains $availableQuestion.id)) "excludePaperId removes selected paper questions from available pool"
    }
    $summary.paperQuestionTotal = $paperQuestionPage.total
    $summary.availableQuestionTotal = $availableQuestionPage.total
`);
s = s.replace(`    Assert-PageResponse $securityEventPage 2 "security events page"
    $summary.securityEventTotal = $securityEventPage.total
`, `    Assert-PageResponse $securityEventPage 2 "security events page"
    Assert-DescendingDate $securityEventPage.items "serverReceivedAt" "security events page"
    $summary.securityEventTotal = $securityEventPage.total
`);
s = s.replace(`$summary.reviewReportTotal = $reviewPage.total
`, `$summary.reviewReportTotal = $reviewPage.total
Assert-SecondPageWindow "/api/v1/exams/reviews?page=2&pageSize=2" $reviewPage "review reports"
`);
s = s.replace(`$summary.gradingTaskTotal = $gradingPage.total
`, `$summary.gradingTaskTotal = $gradingPage.total
Assert-SecondPageWindow "/api/v1/grading-tasks?page=2&pageSize=2" $gradingPage "grading tasks"
`);
s = s.replace(`    Assert-PageResponse $itemPage 2 "grading task items page"
    $summary.gradingItemTotal = $itemPage.total
`, `    Assert-PageResponse $itemPage 2 "grading task items page"
    $summary.gradingItemTotal = $itemPage.total
`);
fs.writeFileSync(p, s, 'utf8');
