$ErrorActionPreference = 'Stop'
Set-Location 'D:\abuhu\Desktop\pilgrimspath code'
$old = 'pilgrimspath-vr\pilgrims path main\2 Safa and Marwa'
$bak = 'pilgrimspath-vr\pilgrims path main\2 Safa and Marwa.backup'
$new = 'safa and marwa update'

if (-not (Test-Path $old)) { throw "Old folder missing: $old" }
if (-not (Test-Path $new)) { throw "New folder missing: $new" }

if (Test-Path $bak) { Remove-Item -LiteralPath $bak -Recurse -Force }
Copy-Item -LiteralPath $old -Destination $bak -Recurse
Write-Host "Backup created: $bak"

$assets = 'lib','media','locale','skin','script.js','script_general.js','thumbnail.png'
foreach ($a in $assets) {
  $src = Join-Path $new $a
  $dst = Join-Path $old $a
  if (-not (Test-Path $src)) { Write-Host "  SKIP (not in new): $a"; continue }
  if (Test-Path $dst) { Remove-Item -LiteralPath $dst -Recurse -Force }
  Copy-Item -LiteralPath $src -Destination $dst -Recurse
  Write-Host "  Replaced: $a"
}
Write-Host "DONE"
