# Hook PostToolUse (Write): pasa Prettier y ESLint por el archivo recién creado.
# Prettier siempre; ESLint solo en js/ts/jsx/tsx/mjs/cjs. Errores de lint -> exit 2 (Claude los ve).
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = [Text.Encoding]::UTF8

$payload = [Console]::In.ReadToEnd() | ConvertFrom-Json
$file = $payload.tool_response.filePath
if (-not $file) { $file = $payload.tool_input.file_path }
if (-not $file -or -not (Test-Path -LiteralPath $file -PathType Leaf)) { exit 0 }

$root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$file = (Resolve-Path -LiteralPath $file).Path
# Solo archivos dentro del proyecto y fuera de node_modules/.next/.claude.
if (-not $file.StartsWith($root, [StringComparison]::OrdinalIgnoreCase)) { exit 0 }
if ($file -match '[\\/](node_modules|\.next|\.claude|\.git)[\\/]') { exit 0 }

Set-Location $root
$bin = Join-Path $root 'node_modules\.bin'

& "$bin\prettier.cmd" --write --ignore-unknown $file | Out-Null
$prettierExit = $LASTEXITCODE

$lintOut = ''
$lintExit = 0
if ($file -match '\.(jsx?|tsx?|mjs|cjs)$') {
  $lintOut = (& "$bin\eslint.cmd" --fix $file 2>&1 | Out-String)
  $lintExit = $LASTEXITCODE
}

if ($prettierExit -ne 0) {
  [Console]::Error.WriteLine("Prettier falló (exit $prettierExit) en $file")
  exit 2
}
if ($lintExit -ne 0) {
  [Console]::Error.WriteLine("ESLint reporta errores en ${file}:`n$lintOut")
  exit 2
}
exit 0
