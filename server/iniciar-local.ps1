param([switch]$Demostracion)

$ErrorActionPreference = 'Stop'
Push-Location -LiteralPath $PSScriptRoot
try {
    npm.cmd run db:init
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    if ($Demostracion) {
        if ($env:NODE_ENV -eq 'production') { throw 'La demostracion requiere un entorno de desarrollo.' }
        $env:NODE_ENV = 'development'
        $env:SIGEP_DEMOSTRACION = '1'
        $env:HOST = '127.0.0.1'
    }
    npm.cmd start
    exit $LASTEXITCODE
} finally {
    Pop-Location
}
