$ErrorActionPreference = 'Stop'
$root = 'D:\abuhu\Desktop\pilgrimspath code\pilgrimspath-vr'
$files = Get-ChildItem -LiteralPath $root -Recurse -Include *.htm,*.html -File | Where-Object { $_.FullName -notmatch '\.backup' }
$count = 0
foreach($f in $files) {
  $bytes = [System.IO.File]::ReadAllBytes($f.FullName)
  $txt = [System.Text.Encoding]::UTF8.GetString($bytes)
  $orig = $txt
  $txt = $txt -replace 'journey-content-loader\.js\?v=9', 'journey-content-loader.js?v=10'
  $txt = $txt -replace 'admin-journey-content\.js\?v=9', 'admin-journey-content.js?v=11'
  if ($txt -ne $orig) {
    [System.IO.File]::WriteAllBytes($f.FullName, [System.Text.Encoding]::UTF8.GetBytes($txt))
    Write-Host "Updated: $($f.FullName.Substring($root.Length+1))"
    $count++
  }
}
Write-Host "Total updated: $count"
