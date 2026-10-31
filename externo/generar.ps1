# externo/generar.ps1
# Genera externo/piezas-museo.svg: lámina con las 70 piezas del museo
# (10 por categoría, icono en NEGRO + nombre debajo), para uso EXTERNO.
#
# Los 70 SVG de objetos son exportaciones de Affinity con UN PNG incrustado
# cada uno. Clave de fidelidad: el PNG NO se muestra entero — la exportación
# lo coloca dentro de un <pattern> relleno por un <rect> recortado contra el
# viewBox (los del cruce, PNG 1080x1920, salen como un recorte cuadrado del
# centro; por eso hay que REPLICAR esa geometría, no usar la proporción
# natural del PNG). Proceso por icono:
#   1. leer viewBox + rect del patrón + data-uri del PNG,
#   2. reducir el PNG a 256px de lado máximo (conservando proporción),
#   3. pasar sus píxeles a NEGRO (R=G=B=0, conservando el alfa),
#   4. incrustarlo en un <svg> anidado con el viewBox ORIGINAL y el <image>
#      con el rect ORIGINAL y preserveAspectRatio="none" (recorte exacto
#      igual que el de la web).
# Títulos y rutas se leen de los datos de las 7 páginas del recorrido
# (fuente única de verdad). La carpeta externo/ no la referencia la web.
#
# Requiere el script guardado en UTF-8 con BOM (PowerShell 5).
# Uso:  powershell -ExecutionPolicy Bypass -File externo\generar.ps1
param()

$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$raiz = Split-Path -Parent $PSScriptRoot
$salida = Join-Path $PSScriptRoot 'piezas-museo.svg'
$encOut = New-Object System.Text.UTF8Encoding($false)

# Orden del recorrido y rótulos de categoría (los del catálogo)
$PAGINAS = @(
  @{ archivo = 'cruce.html';      categoria = 'El Cruce' },
  @{ archivo = 'bodega.html';     categoria = 'La bodega' },
  @{ archivo = 'cancha.html';     categoria = 'La cancha' },
  @{ archivo = 'comedor.html';    categoria = 'El Comedor' },
  @{ archivo = 'corredor.html';   categoria = 'Patio y corredores' },
  @{ archivo = 'dormitorio.html'; categoria = 'Baño y dormitorios' },
  @{ archivo = 'local.html';      categoria = 'El Local' }
)

$W = 1250; $MARGIN_X = 27; $CELL_W = 116; $GAP = 4
$ICONO = 96; $BLOCK_H = 224; $TOP = 96; $BOT = 44
$MAX_PX = 256              # lado máximo de cada icono procesado

# ---------- piezas por página (svg + titulo, en orden) ----------
function Get-Piezas([string]$archivo) {
  $html = [IO.File]::ReadAllText((Join-Path $raiz $archivo))
  $out = @()
  foreach ($m in [regex]::Matches($html, "\{\s*svg:\s*'([^']+)'\s*,\s*titulo:\s*'([^']+)'")) {
    $out += @{ svg = $m.Groups[1].Value; titulo = $m.Groups[2].Value }
  }
  if ($out.Count -ne 10) { throw ("{0}: se esperaban 10 piezas y hay {1}" -f $archivo, $out.Count) }
  return $out
}

# Lee un atributo numérico de una lista de attrs, sea el PRIMERO o no
# (sin ancla fallaba cuando width/x iba al principio del tag)
function Get-Atributo([string]$attrs, [string]$nombre) {
  $m = [regex]::Match($attrs, '(?:^|\s)' + $nombre + '="(-?[\d.]+)"')
  if ($m.Success) { return $m.Groups[1].Value }
  return $null
}

# ---------- geometría de la exportación: viewBox + rect que contiene el
# patrón (el rect es donde la web "recorta" el PNG) + transform si lo hay
# (caso dormitorio: matrix(-1..) = espejado) ----------
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
  if ($w -eq '' -or $h -eq '') {
    # variantes sin rect de patrón: colocación directa del <image>
    $imgM = [regex]::Match($texto, '<image\s+([^>]*?)/>')
    if (-not $imgM.Success) { throw ("{0}: sin rect de patrón ni image colocado" -f $rutaRel) }
    $attrs = $imgM.Groups[1].Value
    $v = Get-Atributo $attrs 'x';      if ($null -ne $v) { $x = $v }
    $v = Get-Atributo $attrs 'y';      if ($null -ne $v) { $y = $v }
    $v = Get-Atributo $attrs 'width';  if ($null -ne $v) { $w = $v }
    $v = Get-Atributo $attrs 'height'; if ($null -ne $v) { $h = $v }
    $m = [regex]::Match($attrs, '(?:^|\s)transform="([^"]+)"')
    if ($m.Success) { $t = $m.Groups[1].Value }
  }
  if ($w -eq '' -or $h -eq '') { throw ("{0}: no se pudo leer la caja del icono" -f $rutaRel) }
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
  for ($i = 0; $i -lt $len; $i += 4) { $buf[$i] = 0; $buf[$i + 1] = 0; $buf[$i + 2] = 0 }
  [Runtime.InteropServices.Marshal]::Copy($buf, 0, $data.Scan0, $len)
  $bmp.UnlockBits($data)

  $out = New-Object System.IO.MemoryStream
  $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
  $b64 = [Convert]::ToBase64String($out.ToArray())
  $dim = '{0}x{1}' -f $bmp.Width, $bmp.Height
  $bmp.Dispose(); $out.Dispose()
  return @{ b64 = $b64; dim = $dim }
}

# ---------- nombre partido en 1-2 líneas ----------
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

# ---------- construcción ----------
$categorias = @()
foreach ($p in $PAGINAS) {
  $categorias += @{ nombre = $p.categoria; piezas = Get-Piezas $p.archivo }
}
$H = $TOP + $categorias.Count * $BLOCK_H + $BOT

$sb = New-Object System.Text.StringBuilder
[void]$sb.AppendLine('<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="' + $W + '" height="' + $H + '" viewBox="0 0 ' + $W + ' ' + $H + '" font-family="Arial, Helvetica, sans-serif">')
[void]$sb.AppendLine('<rect x="1" y="1" width="' + ($W - 2) + '" height="' + ($H - 2) + '" fill="none" stroke="#000000" stroke-width="2"/>')
[void]$sb.AppendLine('<text x="' + ($W / 2) + '" y="56" text-anchor="middle" font-size="27" font-weight="bold" letter-spacing="1.5">Museo El Canario ' + [char]0x2014 + ' Piezas</text>')

$yBloque = $TOP
$total = 0
foreach ($cat in $categorias) {
  [void]$sb.AppendLine('<text x="' + $MARGIN_X + '" y="' + ($yBloque - 14) + '" font-size="17" font-weight="bold">' + (Escapar $cat.nombre) + '</text>')
  [void]$sb.AppendLine('<line x1="' + $MARGIN_X + '" y1="' + ($yBloque - 6) + '" x2="' + ($W - $MARGIN_X) + '" y2="' + ($yBloque - 6) + '" stroke="#000000" stroke-width="1" opacity="0.45"/>')

  $i = 0
  foreach ($pieza in $cat.piezas) {
    $cx = $MARGIN_X + $i * ($CELL_W + $GAP)
    $xIcono = $cx + ($CELL_W - $ICONO) / 2

    $textoSvg = [IO.File]::ReadAllText((Join-Path $raiz $pieza.svg))
    $geo = Get-Geometria $textoSvg $pieza.svg
    $png = Get-PngNegro $pieza.svg
    $href = 'data:image/png;base64,' + $png.b64

    # Réplica exacta de la exportación: viewBox original como ventana de
    # recorte (svg anidado) + caja original del patrón + transform original
    # (espejados como dormitorio) + preserveAspectRatio "none" del original.
    # Así el icono se ve IGUAL que en la web (p. ej. los del cruce, PNG
    # 1080x1920, salen recortados a su cuadro, no estirados ni desplazados).
    $tr = ''; if ($geo.t -ne '') { $tr = ' transform="' + $geo.t + '"' }
    [void]$sb.AppendLine('<svg x="' + $xIcono + '" y="' + $yBloque + '" width="' + $ICONO + '" height="' + $ICONO + '" viewBox="' + $geo.vb + '" preserveAspectRatio="xMidYMid meet">' +
      '<image x="' + $geo.x + '" y="' + $geo.y + '" width="' + $geo.w + '" height="' + $geo.h + '"' + $tr + ' preserveAspectRatio="none" href="' + $href + '" xlink:href="' + $href + '"/>' +
      '</svg>')

    $lineas = Get-Lineas $pieza.titulo
    $yNombre = $yBloque + $ICONO + 20
    $n = 0
    foreach ($linea in $lineas) {
      [void]$sb.AppendLine('<text x="' + ($cx + $CELL_W / 2) + '" y="' + ($yNombre + $n * 15) + '" text-anchor="middle" font-size="12">' + (Escapar $linea) + '</text>')
      $n++
    }
    $total++
    $i++
  }
  $yBloque += $BLOCK_H
}
[void]$sb.AppendLine('</svg>')

[IO.File]::WriteAllText($salida, $sb.ToString(), $encOut)
$kb = [math]::Round((Get-Item $salida).Length / 1KB, 1)
Write-Output ('OK: {0}' -f $salida)
Write-Output ('     {0} piezas · {1} categorías · {2}x{3} · {4} KB' -f $total, $categorias.Count, $W, $H, $kb)
