param([int]$Port = 4181)
$ErrorActionPreference = 'Stop'
$siteRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$prefix = "http://localhost:$Port/"
$listener = [System.Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $Port)

try {
    $listener.Start()
    Write-Host ''
    Write-Host 'Victorias Blockwelt läuft jetzt.' -ForegroundColor Green
    Write-Host 'Dieses Fenster zum Beenden einfach schließen.'
    Write-Host ''
    try { Start-Process $prefix }
    catch { Write-Host "Öffne bei Bedarf selbst: $prefix" -ForegroundColor Yellow }

    while ($true) {
        $client = $listener.AcceptTcpClient()
        try {
        $stream = $client.GetStream()
        $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::ASCII, $false, 1024, $true)
        $requestLine = $reader.ReadLine()
        while (($headerLine = $reader.ReadLine()) -ne '') {
            if ($null -eq $headerLine) { break }
        }
        $requestPath = if ($requestLine -match '^GET\s+([^\s]+)') { $Matches[1].Split('?')[0] } else { '/' }
        $relative = [Uri]::UnescapeDataString($requestPath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($relative)) { $relative = 'index.html' }
        $candidate = Join-Path $siteRoot ($relative -replace '/', '\')
        $fullPath = [IO.Path]::GetFullPath($candidate)

        if (-not $fullPath.StartsWith($siteRoot, [StringComparison]::OrdinalIgnoreCase) -or -not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
            $body = [Text.Encoding]::UTF8.GetBytes('Nicht gefunden')
            $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 404 Not Found`r`nContent-Type: text/plain; charset=utf-8`r`nContent-Length: $($body.Length)`r`nConnection: close`r`n`r`n")
            $stream.Write($header, 0, $header.Length)
            $stream.Write($body, 0, $body.Length)
            $client.Close()
            continue
        }

        $mime = switch ([IO.Path]::GetExtension($fullPath).ToLowerInvariant()) {
            '.html' { 'text/html; charset=utf-8' }
            '.css'  { 'text/css; charset=utf-8' }
            '.js'   { 'text/javascript; charset=utf-8' }
            '.json' { 'application/json; charset=utf-8' }
            '.webmanifest' { 'application/manifest+json; charset=utf-8' }
            '.svg'  { 'image/svg+xml' }
            default { 'application/octet-stream' }
        }
        $bytes = [IO.File]::ReadAllBytes($fullPath)
        $header = [Text.Encoding]::ASCII.GetBytes("HTTP/1.1 200 OK`r`nContent-Type: $mime`r`nContent-Length: $($bytes.Length)`r`nCache-Control: no-cache`r`nConnection: close`r`n`r`n")
        $stream.Write($header, 0, $header.Length)
        $stream.Write($bytes, 0, $bytes.Length)
        $client.Close()
        }
        catch {
            if ($client) { $client.Close() }
            continue
        }
    }
}
catch {
    Write-Host ''
    Write-Host 'Der lokale Start hat nicht funktioniert:' -ForegroundColor Yellow
    Write-Host $_.Exception.Message
    Write-Host 'Vielleicht läuft das Spiel bereits in einem anderen Fenster.'
    Read-Host 'Drücke die Eingabetaste zum Schließen'
}
finally {
    $listener.Stop()
}
