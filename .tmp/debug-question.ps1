$BaseUrl='http://localhost:8080'
function InvokeApi($Method,$Path,$Body=$null,$Headers=@{}){
  $params=@{Uri="$BaseUrl$Path";Method=$Method;TimeoutSec=30;Headers=$Headers}
  if($null -ne $Body){$params.ContentType='application/json; charset=utf-8'; $json=$Body|ConvertTo-Json -Depth 20; Write-Host JSON:$json; $params.Body=[Text.Encoding]::UTF8.GetBytes($json)}
  $r=Invoke-RestMethod @params
  if($r.code -and $r.code -ne '0'){throw $r.message}
  return $r
}
$login=(InvokeApi POST '/api/v1/auth/login' @{username='teacher@mindmark.local';password='dev-password'}).data
$h=@{Authorization="Bearer $($login.token)"}
$paper=(InvokeApi GET '/api/v1/papers/paper-001' $null $h).data
$title='Smoke 中文标题 test'
$q=(InvokeApi POST '/api/v1/questions' @{courseId=$paper.courseId; title=$title; type='SINGLE_CHOICE'; difficulty='MEDIUM'; knowledgePoints=@('中文'); score=2; answer='A'; analysis='中文解析'; options=@(@{key='A';content='正确'},@{key='B';content='错误'}); scoringPoints=@()} $h).data
Write-Host title=$($q.title)
Write-Host expected=$title
Write-Host equal=$($q.title -eq $title)
Write-Host id=$($q.id)
