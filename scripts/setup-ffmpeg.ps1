param(
  [string]$PackageId = "Gyan.FFmpeg"
)

$ErrorActionPreference = "Stop"

$packageRoot = Join-Path $env:LOCALAPPDATA "Microsoft\WinGet\Packages"
function Find-FFmpeg {
  if (-not (Test-Path -LiteralPath $packageRoot -PathType Container)) { return $null }
  return Get-ChildItem -LiteralPath $packageRoot -Filter "ffmpeg.exe" -File -Recurse -ErrorAction SilentlyContinue |
    Where-Object FullName -Match "Gyan\.FFmpeg_" |
    Select-Object -First 1
}

$ffmpeg = Find-FFmpeg
if (-not $ffmpeg) {
  $winget = Get-Command "winget" -ErrorAction SilentlyContinue
  if (-not $winget) { throw "winget is required to install the Windows FFmpeg package." }
  & $winget.Source install --id $PackageId -e --accept-source-agreements --accept-package-agreements --silent --scope user
  $ffmpeg = Find-FFmpeg
}

$ffprobe = if ($ffmpeg) { Join-Path $ffmpeg.Directory.FullName "ffprobe.exe" } else { $null }

if (-not $ffmpeg -or -not (Test-Path -LiteralPath $ffprobe -PathType Leaf)) {
  throw "The Gyan FFmpeg package is installed, but its binaries could not be located."
}

Write-Host "FFmpeg is ready at $($ffmpeg.FullName)"
Write-Host "FFprobe is ready at $ffprobe"
