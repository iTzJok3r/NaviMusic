# sync-android-assets.ps1
# Copies the shared web UI (the single source of truth lives in desktop/) into the
# Android WebView asset folder. Run this before every `gradlew assembleDebug`.
#   desktop/renderer.html     -> android/app/src/main/assets/index.html
#   desktop/renderer.js       -> android/app/src/main/assets/renderer.js
#   desktop/design-system.css -> android/app/src/main/assets/design-system.css
#   desktop/styles.css        -> android/app/src/main/assets/styles.css
#   desktop/icon.png          -> android/app/src/main/assets/icon.png
#
# index.html links design-system.css before styles.css. If a linked file is
# missing from assets the WebView 404s it silently, the page loses its tokens
# and the two platforms drift apart — which is exactly the failure this script
# exists to prevent. Every file referenced by index.html must be listed here.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $root 'desktop'
$dst = Join-Path $root 'android\app\src\main\assets'

if (-not (Test-Path $dst)) { throw "Android asset folder not found: $dst" }

$shared = @(
    @{ From = 'renderer.html';     To = 'index.html' },
    @{ From = 'renderer.js';       To = 'renderer.js' },
    @{ From = 'youtube-embed.js';  To = 'youtube-embed.js' },
    @{ From = 'design-system.css'; To = 'design-system.css' },
    @{ From = 'styles.css';        To = 'styles.css' },
    @{ From = 'shell.css';         To = 'shell.css' },
    @{ From = 'icon.png';          To = 'icon.png' }
)

foreach ($f in $shared) {
    $from = Join-Path $src $f.From
    if (-not (Test-Path $from)) { throw "Missing shared asset: $from" }
    Copy-Item $from (Join-Path $dst $f.To) -Force
}

# Guard: every local stylesheet/script index.html references must now exist in
# assets, so a forgotten file fails the build here instead of silently on the
# phone.
$index = Get-Content (Join-Path $dst 'index.html') -Raw
$refs = [regex]::Matches($index, '(?:href|src)="(?!https?:|data:|#)([^"]+)"') |
        ForEach-Object { $_.Groups[1].Value } |
        Where-Object { $_ -notmatch '^/' } |
        Sort-Object -Unique

$missing = @()
foreach ($r in $refs) {
    if (-not (Test-Path (Join-Path $dst $r))) { $missing += $r }
}
if ($missing.Count -gt 0) {
    throw ("index.html references files that are not in Android assets: " + ($missing -join ', '))
}

Write-Host 'Android assets synced:'
Get-ChildItem $dst -File | ForEach-Object {
    '{0,-20} {1,8} bytes' -f $_.Name, $_.Length
}
Write-Host ("Local references verified present: " + ($refs -join ', '))
