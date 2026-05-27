param(
    [string]$WailsArgs = ""
)

$version = (Get-Content -Path "version.txt" -Raw).Trim()

$wailsConfig = Get-Content -Path "wails.json" -Raw | ConvertFrom-Json
$wailsConfig.info.productVersion = $version
$wailsConfig | ConvertTo-Json -Depth 10 | Set-Content -Path "wails.json"

Write-Host "Version set to: $version" -ForegroundColor Green

$buildCmd = "wails build $WailsArgs"
Write-Host "Running: $buildCmd" -ForegroundColor Cyan
Invoke-Expression $buildCmd
