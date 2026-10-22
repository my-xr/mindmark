from pathlib import Path
p=Path('scripts/api-smoke/run-exam-loop-smoke.ps1')
s=p.read_text(encoding='utf-8')
old='''    $response = Invoke-RestMethod @params
    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }

    return $response
'''
new='''    try {
        $response = Invoke-RestMethod @params
    } catch {
        $statusCode = $null
        $responseBody = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                if ($null -ne $stream) {
                    $reader = New-Object System.IO.StreamReader($stream)
                    $responseBody = $reader.ReadToEnd()
                    $reader.Dispose()
                }
            } catch {
                $responseBody = "<failed to read response body: $($_.Exception.Message)>"
            }
        }
        $requestBody = if ($null -ne $Body) { $Body | ConvertTo-Json -Depth 30 -Compress } else { "<empty>" }
        throw "HTTP failed: $Method $Path status=$statusCode request=$requestBody response=$responseBody"
    }

    if (($response.PSObject.Properties.Name -contains "code") -and $response.code -ne "0") {
        throw "API failed: $Method $Path code=$($response.code) message=$($response.message)"
    }

    return $response
'''
if old not in s:
    raise SystemExit('old snippet not found')
p.write_text(s.replace(old,new),encoding='utf-8')
