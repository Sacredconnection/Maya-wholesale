$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.IO.Compression
$workspace = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$slug = 'maya-wholesale-site-corrections'
$source = Join-Path $workspace "integrations\wordpress\$slug"
$destination = Join-Path $workspace "$slug-v1.0.0.zip"
$stream = [IO.File]::Open($destination, [IO.FileMode]::Create)
try {
    $archive = [IO.Compression.ZipArchive]::new($stream, [IO.Compression.ZipArchiveMode]::Create, $false)
    try {
        foreach ($relative in @("$slug.php", 'templates/order-received.php')) {
            $entry = $archive.CreateEntry("$slug/$relative", [IO.Compression.CompressionLevel]::Optimal)
            $output = $entry.Open()
            $input = [IO.File]::OpenRead((Join-Path $source $relative))
            try { $input.CopyTo($output) } finally { $input.Dispose(); $output.Dispose() }
        }
    } finally { $archive.Dispose() }
} finally { $stream.Dispose() }
Write-Output "Created $destination"
