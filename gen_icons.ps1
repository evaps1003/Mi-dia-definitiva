Add-Type -AssemblyName System.Drawing

function New-RoundedRect($g, $x, $y, $w, $h, $r) {
  $d = $r * 2
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

function New-Icon($size, $round, $out) {
  $bmp = New-Object System.Drawing.Bitmap $size, $size
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $rect = New-Object System.Drawing.Rectangle 0, 0, $size, $size
  $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush $rect, ([System.Drawing.Color]::FromArgb(212, 198, 238)), ([System.Drawing.Color]::FromArgb(188, 230, 214)), 45
  $g.FillRectangle($brush, $rect)

  $mm = if ($round) { 0.20 } else { 0.12 }
  $m = [single]($size * $mm)
  $r = [single]($size * 0.16)
  $path = New-RoundedRect $g $m $m ($size - 2 * $m) ($size - 2 * $m) $r
  $white = [System.Drawing.Color]::FromArgb(245, 255, 255, 255)
  $cardBrush = New-Object System.Drawing.SolidBrush $white
  $g.FillPath($cardBrush, $path)

  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(150, 122, 178)), ($size * 0.09)
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $g.DrawLines($pen, [System.Drawing.PointF[]]@(
    (New-Object System.Drawing.PointF ($size * 0.30), ($size * 0.50)),
    (New-Object System.Drawing.PointF ($size * 0.44), ($size * 0.64)),
    (New-Object System.Drawing.PointF ($size * 0.72), ($size * 0.34))
  ))

  $path.Dispose(); $pen.Dispose(); $cardBrush.Dispose(); $brush.Dispose(); $g.Dispose()
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
}

$dir = Join-Path $PSScriptRoot 'icons'
New-Item -ItemType Directory -Force -Path $dir | Out-Null
New-Icon 192 $false (Join-Path $dir 'icon-192.png')
New-Icon 512 $false (Join-Path $dir 'icon-512.png')
New-Icon 512 $true (Join-Path $dir 'icon-maskable-512.png')
Write-Output 'Iconos generados OK'