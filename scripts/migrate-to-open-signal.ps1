$ErrorActionPreference = "Stop"
$ref = "agrnbsaaxdbvlcdqtnwo"
$token = $args[0]

$deepseek = [Environment]::GetEnvironmentVariable('DEEPSEEK_API_KEY','User')
$tavily = [Environment]::GetEnvironmentVariable('TAVILY_API_KEY','User')
$hubspot = [Environment]::GetEnvironmentVariable('HUBSPOT_API_KEY','User')
if (-not $token) { throw "Pass the PAT as arg 1" }
if (-not $deepseek) { throw "DEEPSEEK_API_KEY missing" }
if (-not $tavily) { throw "TAVILY_API_KEY missing" }
if (-not $hubspot) { throw "HUBSPOT_API_KEY missing" }

$env:SUPABASE_ACCESS_TOKEN = $token

Write-Output "== Setting secrets =="
npx supabase secrets set --project-ref $ref "DEEPSEEK_API_KEY=$deepseek" "TAVILY_API_KEY=$tavily" "HUBSPOT_API_KEY=$hubspot"
if ($LASTEXITCODE -ne 0) { throw "secrets set failed" }

Write-Output "== Deploying functions =="
$fns = Get-ChildItem "supabase\functions" -Directory | Where-Object { $_.Name -ne '_shared' } | Select-Object -ExpandProperty Name
foreach ($fn in $fns) {
  Write-Output "deploying $fn"
  npx supabase functions deploy $fn --project-ref $ref --no-verify-jwt
  if ($LASTEXITCODE -ne 0) { Write-Output "!! FAILED: $fn" }
}
Write-Output "DONE"