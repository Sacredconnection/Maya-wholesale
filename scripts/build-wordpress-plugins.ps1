$ErrorActionPreference = 'Stop'

Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem

$workspace = [IO.Path]::GetFullPath((Resolve-Path (Join-Path $PSScriptRoot '..')).Path).TrimEnd('\')

function Assert-WorkspacePath {
	param([Parameter(Mandatory = $true)][string] $Path)

	$fullPath = [IO.Path]::GetFullPath($Path)
	if (-not $fullPath.StartsWith($workspace + '\', [StringComparison]::OrdinalIgnoreCase)) {
		throw "Path is outside the workspace: $fullPath"
	}

	return $fullPath
}

function New-WordPressPluginZip {
	param(
		[Parameter(Mandatory = $true)][string] $Slug,
		[Parameter(Mandatory = $true)][string] $SourceFile,
		[Parameter(Mandatory = $true)][string[]] $Destinations
	)

	$sourcePath = Assert-WorkspacePath (Join-Path $workspace $SourceFile)
	if (-not (Test-Path -LiteralPath $sourcePath -PathType Leaf)) {
		throw "Plugin source does not exist: $sourcePath"
	}

	$entryName = "$Slug/$Slug.php"
	foreach ($destination in $Destinations) {
		$destinationPath = Assert-WorkspacePath (Join-Path $workspace $destination)
		$destinationDirectory = Split-Path -Parent $destinationPath
		if (-not (Test-Path -LiteralPath $destinationDirectory -PathType Container)) {
			throw "Destination directory does not exist: $destinationDirectory"
		}

		if (Test-Path -LiteralPath $destinationPath) {
			Remove-Item -LiteralPath $destinationPath -Force
		}

		$fileStream = [IO.File]::Open(
			$destinationPath,
			[IO.FileMode]::CreateNew,
			[IO.FileAccess]::ReadWrite,
			[IO.FileShare]::None
		)
		try {
			$archive = [IO.Compression.ZipArchive]::new(
				$fileStream,
				[IO.Compression.ZipArchiveMode]::Create,
				$false
			)
			try {
				$entry = $archive.CreateEntry(
					$entryName,
					[IO.Compression.CompressionLevel]::Optimal
				)
				$entryStream = $entry.Open()
				try {
					$sourceStream = [IO.File]::OpenRead($sourcePath)
					try {
						$sourceStream.CopyTo($entryStream)
					} finally {
						$sourceStream.Dispose()
					}
				} finally {
					$entryStream.Dispose()
				}
			} finally {
				$archive.Dispose()
			}
		} finally {
			$fileStream.Dispose()
		}

		$validationArchive = [IO.Compression.ZipFile]::OpenRead($destinationPath)
		try {
			$entryNames = @($validationArchive.Entries | ForEach-Object FullName)
			if ($entryNames.Count -ne 1 -or $entryNames[0] -cne $entryName) {
				throw "Invalid WordPress plugin archive structure: $destinationPath"
			}
			if ($entryNames[0].Contains('\')) {
				throw "ZIP entry contains a Windows path separator: $destinationPath"
			}
		} finally {
			$validationArchive.Dispose()
		}

		Write-Output "Created $destination with entry $entryName"
	}
}

$coreParams = @{
	Slug = 'maya-wholesale-core'
	SourceFile = 'integrations\wordpress\maya-wholesale-core\maya-wholesale-core.php'
	Destinations = @('maya-wholesale-core.zip', 'maya-wholesale-core-v1.0.3.zip')
}
New-WordPressPluginZip @coreParams

$adminToolsParams = @{
	Slug = 'maya-wholesale-admin-tools'
	SourceFile = 'integrations\wordpress\maya-wholesale-admin-tools\maya-wholesale-admin-tools.php'
	Destinations = @(
		'maya-wholesale-admin-tools-v1.4.3.zip',
		'integrations\wordpress\maya-wholesale-admin-tools.zip'
	)
}
New-WordPressPluginZip @adminToolsParams
