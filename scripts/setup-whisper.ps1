param(
  [string]$Version = "b4938",
  [string]$InstallRoot = (Join-Path $env:LOCALAPPDATA "MotionLayer\tools\whisper.cpp")
)

$ErrorActionPreference = "Stop"

$root = [System.IO.Path]::GetFullPath($InstallRoot)
$target = [System.IO.Path]::GetFullPath((Join-Path $root $Version))
if (-not $target.StartsWith($root, [System.StringComparison]::OrdinalIgnoreCase)) {
  throw "Refusing to install whisper.cpp outside the configured tool root."
}

$installed = Get-ChildItem -LiteralPath $target -Filter "whisper-cli.exe" -File -ErrorAction SilentlyContinue | Select-Object -First 1
if ($installed) {
  Write-Host "whisper.cpp $Version is already ready at $($installed.FullName)"
  exit 0
}

$archiveUrl = "https://github.com/ggml-org/whisper.cpp/releases/download/$Version/whisper-bin-x64.zip"
$tempRoot = Join-Path ([System.IO.Path]::GetTempPath()) ("motionlayer-whisper-" + [System.Guid]::NewGuid().ToString("N"))
$archive = Join-Path $tempRoot "whisper-bin-x64.zip"
$expanded = Join-Path $tempRoot "expanded"

try {
  New-Item -ItemType Directory -Path $expanded -Force | Out-Null
  Invoke-WebRequest -Uri $archiveUrl -OutFile $archive -UseBasicParsing
  Expand-Archive -LiteralPath $archive -DestinationPath $expanded -Force

  $downloaded = Get-ChildItem -LiteralPath $expanded -Filter "whisper-cli.exe" -File -Recurse | Select-Object -First 1
  if (-not $downloaded) { throw "The official whisper.cpp archive did not contain whisper-cli.exe." }

  New-Item -ItemType Directory -Path $target -Force | Out-Null
  Copy-Item -Path (Join-Path $downloaded.Directory.FullName "*") -Destination $target -Recurse -Force

  $installed = Join-Path $target "whisper-cli.exe"
  if (-not (Test-Path -LiteralPath $installed -PathType Leaf)) { throw "whisper-cli.exe was not installed." }
  Write-Host "whisper.cpp $Version is ready at $installed"
} finally {
  if (Test-Path -LiteralPath $tempRoot) {
    Remove-Item -LiteralPath $tempRoot -Recurse -Force
  }
}
