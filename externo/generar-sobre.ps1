# externo/generar-sobre.ps1
# Genera externo/sobres-museo.svg: las 7 capas "sobre" del recorrido
# (una por estancia), en NEGRO con el nombre de la estancia debajo,
# SIN marco visible — misma estética de lámina que piezas-museo.svg.
#
# Los sobres son SVG con un PNG incrustado (2560x4096, arte de primer plano
# con mucha transparencia). Clave de fidelidad (igual que las piezas): el PNG
# NO se muestra entero — la exportación lo coloca en un <pattern> relleno por
# un <rect> recortado contra el viewBox (p. ej. rect 700x1120 recortado a la
# ventana 400x400). Hay que REPLICAR esa geometría para que se vea igual que
# en la web. Proceso por capa:
#   1. leer viewBox + rect del patrón + data-uri del PNG,
#   2. reducir el PNG a 256px de lado máximo (conservando proporción),
#   3. pasar sus píxeles a NEGRO (R=G=B=0, conservando el alfa),
#   4. incrustarlo en un <svg> anidado con el viewBox y caja ORIGINALES y
#      preserveAspectRatio="none" (recorte exacto).
# Las rutas de los sobres van en la tabla $ESCENAS (los ficheros no los
# referencia ninguna página; el de local lleva el typo histórico "loca").
#
# Requiere el script guardado en UTF-8 con BOM (PowerShell 5).
# Uso:  powershell -ExecutionPolicy Bypass -File externo\generar-sobre.ps1
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$salida = Join-Path $PSScriptRoot 'sobres-museo.svg'
$encOut = New-Object System.Text.UTF8Encoding($false)

$ESCENAS = @(
  @{ nombre = 'El Cruce';            sobre = 'assets/svg/recorrido-cruce-sobre.svg' },
  @{ nombre = 'La bodega';           sobre = 'assets/svg/recorrido-bodega-sobre.svg' },
  @{ nombre = 'La cancha';           sobre = 'assets/svg/recorrido-cancha-sobre.svg' },
  @{ nombre = 'El Comedor';          sobre = 'assets/svg/recorrido-comedor-sobre.svg' },
  @{ nombre = 'Patio y corredores';  sobre = 'assets/svg/recorrido-corredor-sobre.svg' },
  @{ nombre = 'Baño y dormitorios';  sobre = 'assets/svg/recorrido-dormitorio-sobre.svg' },
  # el fichero de local lleva el typo histórico "loca" (no renombrar: la web
  # y el catálogo pueden querer el nombre original)
  @{ nombre = 'El Local';            sobre = 'assets/svg/recorrido-loca-sobre.svg' }
)

$W = 890; $MARGIN_X = 27; $CELL_W = 116; $GAP = 4
$ICONO = 96; $TOP = 96; $ROW_H = 156; $BOT = 44
$MAX_PX = 256

# Lee un atributo numérico de una lista de attrs, sea el PRIMERO o no
# (sin ancla fallaba cuando width/x iba al principio del tag)
function Get-Atributo([string]$attrs, [string]$nombre) {
  $m = [regex]::Match($attrs, '(?:^|\s)' + $nombre + '="(-?[\d.]+)"')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

# ---------- geometría de la exportación: viewBox + rect del patrón +
# transform si lo hay (dormitorio: matrix(-1..) = espejado) ----------
function Get-Geometria([string]$texto, [string]$rutaRel) {
  $vbM = [regex]::Match($texto, 'viewBox="([^"]+)"')
  if (-not $vbM.Success) { throw ("{0}: sin viewBox" -f $rutaRel) }

  $rectM = [regex]::Match($texto, '<rect\s+([^>]*?)fill="url\(#pattern[^"]*\)"')
  $x = '0'; $y = '0'; $w = ''; $h = ''; $t = ''
  if ($rectM.Success) {
    $attrs = $rectM.Groups[1].Value
    $v = Get-Atributo $attrs 'x';      if ($null -ne $v) { $x = $v }
    $v = Get-Atributo $attrs 'y';      if ($null -ne $v) { $y = $v }
    $v = Get-Atributo $attrs 'width';  if ($null -ne $v) { $w = $v }
    $v = Get-Atributo $attrs 'height'; if ($null -ne $v) { $h = $v }
    $m = [regex]::Match($attrs, '(?:^|\s)transform="([^"]+)"')
    if ($m.Success) { $t = $m.Groups[1].Value }
  }
  if ($w -eq '' -or $h -eq '') { throw ("{0}: sin rect de patrón" -f $rutaRel) }
  return @{ vb = $vbM.Groups[1].Value; x = $x; y = $y; w = $w; h = $h; t = $t }
}

# ---------- PNG: extraer -> reducir -> negro -> base64 ----------
function Get-PngNegro([string]$rutaRel) {
  $texto = [IO.File]::ReadAllText((Join-Path $raiz $rutaRel))
  $m = [regex]::Match($texto, 'data:image/(?:png|jpeg);base64,([A-Za-z0-9+/=]+)')
  if (-not $m.Success) { throw ("{0}: sin PNG incrustado" -f $rutaRel) }
  $bytes = [Convert]::FromBase64String($m.Groups[1].Value)
  $ms = New-Object System.IO.MemoryStream(, $bytes)
  $orig = [System.Drawing.Image]::FromStream($ms)

  $bmp = $null
  if ($orig.Width -gt $MAX_PX -or $orig.Height -gt $MAX_PX) {
    $esc = [math]::Min($MAX_PX / $orig.Width, $MAX_PX / $orig.Height)
    $nw = [int][math]::Round($orig.Width * $esc)
    $nh = [int][math]::Round($orig.Height * $esc)
    $bmp = New-Object System.Drawing.Bitmap($nw, $nh)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    [void]$g.DrawImage($orig, 0, 0, $nw, $nh)
    $g.Dispose()
    $orig.Dispose(); $ms.Dispose()
  } else {
    $bmp = $orig
    $ms.Dispose()
  }

  $rect = New-Object System.Drawing.Rectangle(0, 0, $bmp.Width, $bmp.Height)
  $data = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadWrite,
                        [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
  $len = $data.Stride * $bmp.Height
  $buf = New-Object byte[] $len
  [Runtime.InteropServices.Marshal]::Copy($data.Scan0, $buf, 0, $len)
  $total = 0; $opacos = 0
  for ($i = 0; $i -lt $len; $i += 4) {
    $buf[$i] = 0; $buf[$i + 1] = 0; $buf[$i + 2] = 0
    $total++
    if ($buf[$i + 3] -gt 128) { $opacos++ }
  }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $len)
  $bmp.UnlockBits($data)

  $out = New-Object System.IO.MemoryStream
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($out.ToArray())
  $dim = '{0}x{1}' -f $bmp.Width, $bmp.Height
  $pct = [math]::Round(100 * $opacos / [math]::Max(1, $total), 1)
  $bmp.Dispose(); $out.Dispose()
  return @{ b64 = $b64; dim = $dim; pct = $pct }
}

function Get-Lineas([string]$t) {
  if ($t.Length -le 16) { return @($t) }
  $media = [int][math]::Ceiling($t.Length / 2)
  $i = $t.LastIndexOf(' ', $media)
  if ($i -lt 4) { $i = $t.IndexOf(' ', $media + 1) }
  if ($i -lt 0) { return @($t) }
  $a = $t.Substring(0, $i); $b = $t.Substring($i + 1)
  if ($b.Length -gt 20) {
    $j = $b.LastIndexOf(' ', 16)
    if ($j -gt 4) { $a = $a + ' ' + $b.Substring(0, $j); $b = $b.Substring($j + 1) }
  }
  return @($a, $b)
}

function Escapar([string]$s) {
  return $s.Replace('&', '&amp;').Replace('<', '&lt;').Replace('>', '&gt;')
}

# ---------- construcción: fila única de 7, SIN marco ----------
$H = $TOP + $ROW_H + $BOT
$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + $W + '" height="' + $H + '" viewBox="0 0 ' + $W + ' ' + $H + '" font-family="Arial, Helvetica, sans-serif">')
[void]$sb.AppendLine('<text x="' + ($W / 2) + '" y="56" text-anchor="middle" font-size="27" font-weight="bold" letter-spacing="1.5">Museo El Canario ' + [char]0x2014 + ' Sobre</text>')

$i = 0
foreach ($e in $ESCENAS) {
  $ruta = $e.sobre
  if (-not (Test-Path (Join-Path $raiz $ruta))) { throw ("no existe: " + $ruta) }
  $cx = $MARGIN_X + $i * ($CELL_W + $GAP)
  $xIcono = $cx + ($CELL_W - $ICONO) / 2

  $textoSvg = [IO.File]::ReadAllText((Join-Path $raiz $ruta))
  $geo = Get-Geometria $textoSvg $ruta
  $png = Get-PngNegro $ruta
  $href = 'data:image/png;base64,' + $png.b64

  # Réplica exacta de la exportación: viewBox original como ventana de recorte
  # (svg anidado) + caja original del patrón + transform original + "none"
  $tr = ''; if ($geo.t -ne '') { $tr = ' transform="' + $geo.t + '"' }
  [void]$sb.AppendLine('<svg x="' + $xIcono + '" y="' + $TOP + '" width="' + $ICONO + '" height="' + $ICONO + '" viewBox="' + $geo.vb + '" preserveAspectRatio="xMidYMid meet">' +
    '<image x="' + $geo.x + '" y="' + $geo.y + '" width="' + $geo.w + '" height="' + $geo.h + '"' + $tr + ' preserveAspectRatio="none" href="' + $href + '" xlink:href="' + $href + '"/>' +
    '</svg>')

  $lineas = Get-Lineas $e.nombre
  $yNombre = $TOP + $ICONO + 20
  $n = 0
  foreach ($linea in $lineas) {
    [void]$sb.AppendLine('<text x="' + ($cx + $CELL_W / 2) + '" y="' + ($yNombre + $n * 15) + '" text-anchor="middle" font-size="12">' + (Escapar $linea) + '</text>')
    $n++
  }
  Write-Output ('  {0} -> {1} | opacos {2}% | recorte {3} {4}x{5}' -f (Split-Path $ruta -Leaf), $png.dim, $png.pct, $geo.vb, $geo.w, $geo.h)
  $i++
}
[void]$sb.AppendLine('</svg>')

[IO.File]::WriteAllText($salida, $sb.ToString(), $encOut)
$kb = [math]::Round((Get-Item $salida).Length / 1KB, 1)
Write-Output ('OK: {0}' -f $salida)
Write-Output ('     7 sobres · {0}x{1} · {2} KB · sin marco' -f $W, $H, $kb)
