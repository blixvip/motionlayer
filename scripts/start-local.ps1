$ErrorActionPreference = 'Stop'
$motionNode = (Get-Command node.exe -ErrorAction Stop).Source
& $motionNode (Join-Path $PSScriptRoot 'start-local.mjs') @args
exit $LASTEXITCODE
