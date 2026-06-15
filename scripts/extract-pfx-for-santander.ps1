param(
  [string]$PfxPath = "$env:USERPROFILE\Desktop\26453405.pfx",
  [string]$OutputDirectory = ".\certs",
  [string]$CertFileName = "santander-cert.pem",
  [string]$KeyFileName = "santander-key.pem",
  [string]$OpenSslPath = ""
)

$ErrorActionPreference = "Stop"

function Resolve-OpenSslPath {
  param([string]$ExplicitPath)

  if ($ExplicitPath -and (Test-Path -LiteralPath $ExplicitPath)) {
    return (Resolve-Path -LiteralPath $ExplicitPath).Path
  }

  $command = Get-Command openssl -ErrorAction SilentlyContinue

  if ($command) {
    return $command.Source
  }

  $candidatePaths = @(
    "C:\Program Files\Git\mingw64\bin\openssl.exe",
    "C:\Program Files\Git\usr\bin\openssl.exe",
    "C:\Program Files\OpenSSL-Win64\bin\openssl.exe",
    "C:\Program Files\OpenSSL-Win32\bin\openssl.exe"
  )

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path -LiteralPath $candidatePath) {
      return $candidatePath
    }
  }

  throw "OpenSSL was not found. Install Git for Windows or OpenSSL, then run this script again."
}

function Resolve-OpenSslModulesPath {
  param([string]$Executable)

  $candidatePaths = @(
    (Join-Path (Split-Path (Split-Path $Executable -Parent) -Parent) "lib\ossl-modules"),
    "C:\Program Files\Git\mingw64\lib\ossl-modules",
    "C:\Program Files\OpenSSL-Win64\lib\ossl-modules",
    "C:\Program Files\OpenSSL-Win32\lib\ossl-modules"
  )

  foreach ($candidatePath in $candidatePaths) {
    if (Test-Path -LiteralPath (Join-Path $candidatePath "legacy.dll")) {
      return $candidatePath
    }
  }

  return $null
}

function Invoke-OpenSsl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Executable,
    [Parameter(Mandatory = $true)]
    [string[]]$Arguments,
    [Parameter(Mandatory = $true)]
    [string]$Password
  )

  $previousPassword = [Environment]::GetEnvironmentVariable(
    "SERVERBOX_PFX_PASSWORD",
    "Process"
  )
  $previousModulesPath = [Environment]::GetEnvironmentVariable(
    "OPENSSL_MODULES",
    "Process"
  )
  $modulesPath = Resolve-OpenSslModulesPath -Executable $Executable

  try {
    [Environment]::SetEnvironmentVariable(
      "SERVERBOX_PFX_PASSWORD",
      $Password,
      "Process"
    )

    if ($modulesPath) {
      [Environment]::SetEnvironmentVariable(
        "OPENSSL_MODULES",
        $modulesPath,
        "Process"
      )
    }

    & $Executable @Arguments

    if ($LASTEXITCODE -ne 0) {
      throw "OpenSSL exited with code $LASTEXITCODE."
    }
  } finally {
    [Environment]::SetEnvironmentVariable(
      "SERVERBOX_PFX_PASSWORD",
      $previousPassword,
      "Process"
    )
    [Environment]::SetEnvironmentVariable(
      "OPENSSL_MODULES",
      $previousModulesPath,
      "Process"
    )
  }
}

function Export-WithOpenSsl {
  param(
    [Parameter(Mandatory = $true)]
    [string]$Executable,
    [Parameter(Mandatory = $true)]
    [string]$Password,
    [Parameter(Mandatory = $true)]
    [string]$CertPath,
    [Parameter(Mandatory = $true)]
    [string]$KeyPath,
    [switch]$Legacy
  )

  $legacyArgs = if ($Legacy) { @("-legacy") } else { @() }
  $commonArgs = @(
    "pkcs12",
    "-in",
    $PfxPath,
    "-passin",
    "env:SERVERBOX_PFX_PASSWORD"
  ) + $legacyArgs

  Invoke-OpenSsl `
    -Executable $Executable `
    -Password $Password `
    -Arguments ($commonArgs + @("-clcerts", "-nokeys", "-out", $CertPath))

  Invoke-OpenSsl `
    -Executable $Executable `
    -Password $Password `
    -Arguments ($commonArgs + @("-nocerts", "-nodes", "-out", $KeyPath))
}

if (-not (Test-Path -LiteralPath $PfxPath)) {
  throw "PFX file not found: $PfxPath"
}

$resolvedPfxPath = (Resolve-Path -LiteralPath $PfxPath).Path
$resolvedOpenSslPath = Resolve-OpenSslPath -ExplicitPath $OpenSslPath
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$resolvedOutputDirectory = (Resolve-Path -LiteralPath $OutputDirectory).Path
$certPath = Join-Path $resolvedOutputDirectory $CertFileName
$keyPath = Join-Path $resolvedOutputDirectory $KeyFileName
$securePassword = Read-Host -Prompt "PFX password" -AsSecureString
$passwordPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
$plainPassword = $null

try {
  $plainPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($passwordPointer)
  $PfxPath = $resolvedPfxPath

  try {
    Export-WithOpenSsl `
      -Executable $resolvedOpenSslPath `
      -Password $plainPassword `
      -CertPath $certPath `
      -KeyPath $keyPath
  } catch {
    Write-Warning "OpenSSL failed without -legacy. Retrying with -legacy..."
    Export-WithOpenSsl `
      -Executable $resolvedOpenSslPath `
      -Password $plainPassword `
      -CertPath $certPath `
      -KeyPath $keyPath `
      -Legacy
  }

  Write-Host "Certificate exported to: $certPath"
  Write-Host "Private key exported to: $keyPath"
  Write-Host ""
  Write-Host "Use these values in .env.local:"
  Write-Host "SANTANDER_CERT_PATH=./certs/$CertFileName"
  Write-Host "SANTANDER_KEY_PATH=./certs/$KeyFileName"
  Write-Host "SANTANDER_KEY_PASSPHRASE="
} finally {
  if ($passwordPointer -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($passwordPointer)
  }

  if ($plainPassword) {
    $plainPassword = $null
  }
}
