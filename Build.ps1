#Requires -Version 6

$InformationPreference = 'Continue'
$WarningPreference = 'Continue'
$ErrorActionPreference = 'Stop'
$baseDir = (Resolve-Path .).Path
$srcDir = [System.IO.Path]::Join($baseDir, 'src')
if (!(Test-Path $srcDir)) {
    throw [System.IO.DirectoryNotFoundException]::new("Source directory not found.")
}
$distDir = [System.IO.Path]::Join($baseDir, 'dist')
if (!(Test-Path $distDir)) {
    New-Item -ItemType Directory $distDir -Force > $null
}
$targetCss = [System.IO.Path]::Join($srcDir, 'common.css')
$targetJs = [System.IO.Path]::Join($srcDir, 'nptu-redux.js')
$cssConfig = [System.IO.Path]::Join($srcDir, 'config_css.json')
$outputCss = [System.IO.Path]::Join($distDir, 'common.min.css')
function Start-Build {
    begin {
        $cssPurgeExecutable = Get-Command "css-purge" -ErrorAction SilentlyContinue
        if ($null -eq $cssPurgeExecutable) {
            Write-Warning "css-purge not found; attempting to install via npm..."
            $npmExecutable = Get-Command "npm" -ErrorAction SilentlyContinue
            if ($null -eq $npmExecutable) {
                throw [System.IO.FileNotFoundException]::new("npm not found. Please install npm before building.")
            }
            Start-Process $npmExecutable.Source -ArgumentList "install css-purge -g"
            $cssPurgeExecutable = Get-Command "css-purge"
        }
        $argBuilder = [System.Text.StringBuilder]::new("-i $targetCss -o $outputCss")
        if (Test-Path $cssConfig) {
            $argBuilder.AppendJoin($cssConfig) > $null
        }
        $args = $argBuilder.ToString()
    }
    process {
        Write-Information "Minifying CSS with args '$args'..."
        Invoke-Expression "$cssPurgeExecutable $args"
        $minifiedCss = Get-Content $outputCss
        $newJsName = [System.IO.Path]::GetFileNameWithoutExtension($targetJs) + "-dist.user" + [System.IO.Path]::GetExtension($targetJs)
        $outputFile = [System.IO.Path]::Join($distDir, $newJsName)
        Copy-Item -LiteralPath $targetJs -Destination $outputFile
        Write-Information "Injecting 'injectCustomCss' to $targetJs..."
@"


function injectCustomCss(head){
    head.appendChild(make({el: 'style', html: ``$minifiedCss``}))
}
"@      | Out-File $outputFile -Append
    }
    end {
        Write-Information "Finished."
    }

}

Start-Build