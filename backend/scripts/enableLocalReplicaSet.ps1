$ErrorActionPreference = 'Stop'
$logPath = Join-Path $env:TEMP 'boardlk-mongodb-setup.log'
Start-Transcript -Path $logPath -Force | Out-Null
try {
    $principal = [Security.Principal.WindowsPrincipal]::new([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        throw 'Run this script from PowerShell as Administrator.'
    }

    $configPath = 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.cfg'
    $configText = Get-Content -LiteralPath $configPath -Raw
    if ($configText -match '(?m)^replication:') {
        if ($configText -notmatch '(?m)^\s+replSetName:\s*["'']?rs0["'']?\s*$') {
            throw 'An existing replica-set configuration was found. It has not been changed.'
        }
    } else {
        $backupPath = $configPath + '.boardlk-backup-' + (Get-Date -Format 'yyyyMMdd-HHmmss')
        Copy-Item -LiteralPath $configPath -Destination $backupPath
        try {
            $updatedText = $configText + "`r`nreplication:`r`n  replSetName: rs0`r`n"
            [IO.File]::WriteAllText($configPath, $updatedText, [Text.UTF8Encoding]::new($false))
            Restart-Service -Name MongoDB
            (Get-Service MongoDB).WaitForStatus('Running', [TimeSpan]::FromSeconds(30))
        } catch {
            Copy-Item -LiteralPath $backupPath -Destination $configPath -Force
            Restart-Service -Name MongoDB -ErrorAction SilentlyContinue
            throw
        }
    }

    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        @'
import { MongoClient } from 'mongodb';
const client = new MongoClient('mongodb://127.0.0.1:27017/?directConnection=true', { serverSelectionTimeoutMS: 10000 });
try {
  await client.connect();
  const admin = client.db('admin');
  const hello = await admin.command({ hello: 1 });
  if (hello.setName && hello.setName !== 'rs0') throw new Error('Different replica set already configured.');
  if (!hello.setName) {
    await admin.command({ replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host: 'localhost:27017' }] } });
  }
  let ready = false;
  for (let attempt = 0; attempt < 30; attempt++) {
    if ((await admin.command({ hello: 1 })).isWritablePrimary) { ready = true; break; }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error('Replica set has not become writable yet.');
  console.log('SUCCESS: Existing MongoDB is writable as rs0 on port 27017. Existing data retained.');
} catch (error) {
  console.error('SETUP FAILED: ' + error.message);
  process.exitCode = 1;
} finally {
  await client.close();
}
'@ | node --input-type=module
        if ($LASTEXITCODE -ne 0) { throw 'Replica-set initialization failed. See the log.' }
    } finally {
        Pop-Location
    }
} catch {
    Write-Output ('SETUP FAILED: ' + $_.Exception.Message)
    exit 1
} finally {
    Stop-Transcript | Out-Null
}
