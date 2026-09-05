param(
  [string]$Ollama = "ollama"
)

$ErrorActionPreference = "Stop"
$model = "hf.co/superwhisper/s1-mini-GGUF:Q4_K_M"

& $Ollama pull $model
if ($LASTEXITCODE -ne 0) { throw "Ollama could not install S1-mini by Superwhisper." }

Write-Host "S1-mini by Superwhisper is ready in Ollama as $model"
