$ErrorActionPreference = 'Stop'
$runtime = Join-Path $PSScriptRoot '.runtime-local'
New-Item -ItemType Directory -Path $runtime -Force | Out-Null
foreach ($name in @('package.json','package-lock.json','prisma.config.ts','prisma','src','scripts')) {
    Copy-Item -LiteralPath (Join-Path $PSScriptRoot $name) -Destination $runtime -Recurse -Force
}
Push-Location -LiteralPath $runtime
try {
    $hash = (Get-FileHash -LiteralPath 'package-lock.json').Hash
    $stamp = '.dependencies'
    if (!(Test-Path 'node_modules/@prisma/adapter-libsql') -or !(Test-Path $stamp) -or (Get-Content $stamp) -ne $hash) {
        npm.cmd ci --ignore-scripts
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
        Set-Content -LiteralPath $stamp -Value $hash
    }
    $env:DATABASE_URL = 'file:./.sigep-local/grados.sqlite'
    npm.cmd run db:generate
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    node scripts/preparar-local.js
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    foreach ($variable in @('DATABASE_URL','SIGEP_JWT_SECRET','SIGEP_UPLOAD_DIR','SIGEP_NORMATIVA_PATH')) {
        Remove-Item -LiteralPath "Env:$variable" -ErrorAction SilentlyContinue
    }
    $env:HOST = '127.0.0.1'
    $env:SIGEP_DEMOSTRACION = '1'
    $opcionesNode = @('--env-file=.sigep-local/.env')
    $googleLocal = Join-Path $PSScriptRoot '.env.google.local'
    if (Test-Path -LiteralPath $googleLocal) {
        $opcionesNode += "--env-file=$googleLocal"
    }
    node @opcionesNode src/index.js
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
