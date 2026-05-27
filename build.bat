@echo off
for /f "usebackq delims=" %%v in ("version.txt") do set VERSION=%%v

powershell -NoProfile -Command ^
  "$c = Get-Content 'wails.json' -Raw | ConvertFrom-Json; $c.info.productVersion = '%VERSION%'; $c | ConvertTo-Json -Depth 10 | Set-Content 'wails.json'"

echo Version set to: %VERSION%
echo Running wails build...
wails build %*
