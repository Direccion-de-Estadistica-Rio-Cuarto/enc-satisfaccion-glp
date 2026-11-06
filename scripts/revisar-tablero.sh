#!/usr/bin/env bash
# ============================================================================
# revisar-tablero.sh — controles automáticos del tablero.
#
# Corre local  ->  bash scripts/revisar-tablero.sh
# Corre en CI  ->  .github/workflows/ci.yml (job "reglas")
#
# Verifica los puntos marcados 🤖 en CHECKLIST.md. Lo que necesita criterio
# (👤) se repasa a mano con la guía de CHECKLIST.md.
#
# ALCANCE: solo unificación visual (header/footer iguales, design system,
# metadata, accesibilidad). NO toca seguridad ni datos — cada equipo sigue con
# su método (ver SECURITY.md del repo, que no cambió).
#
# Salida: ✗ = falla, corregir antes de publicar (exit 1)
#         ⚠ = aviso, no bloquea pero conviene mirarlo (exit 0)
# ============================================================================

AQUI="$(cd "$(dirname "$0")" && pwd)"
cd "$AQUI/.." || exit 2

# Mientras exista el archivo PLANTILLA en la raíz, esto es la plantilla sin
# instanciar: los textos de ejemplo y la metadata a medio llenar se reportan
# como aviso, no como falla. Al crear un tablero, se borra ese archivo.
modo_plantilla=0
[ -f PLANTILLA ] && modo_plantilla=1

# Páginas que NO son un tablero (andamiaje de la plantilla).
EXCEPTUADAS_RE='^guia-diseno\.html$'

# --- Colores (se apagan si la salida no es una terminal) --------------------
if [ -t 1 ]; then
  ROJO=$'\e[31m'; VERDE=$'\e[32m'; AMAR=$'\e[33m'; GRIS=$'\e[90m'; FIN=$'\e[0m'
else
  ROJO=; VERDE=; AMAR=; GRIS=; FIN=
fi

fallos=0
avisos=0

ok()      { printf '  %s✓%s %s\n' "$VERDE" "$FIN" "$1"; }
mal()     { printf '  %s✗%s %s\n' "$ROJO" "$FIN" "$1"; fallos=$((fallos + 1)); }
aviso()   { printf '  %s⚠%s %s\n' "$AMAR" "$FIN" "$1"; avisos=$((avisos + 1)); }
# Falla, salvo en la plantilla sin instanciar (ahí es solo un recordatorio).
pendiente() { if [ "$modo_plantilla" = 1 ]; then aviso "$1"; else mal "$1"; fi; }
detalle() { printf '%s\n' "$1" | sed '/^[[:space:]]*$/d;s/^/      /'; }
seccion() { printf '\n%s%s%s\n' "$GRIS" "$1" "$FIN"; }

# Contenido de un HTML sin sus comentarios <!-- ... --> (cada línea sigue en su lugar, para
# que los números de línea que se reportan coincidan con el archivo).
sin_comentarios() {
  awk 'BEGIN{c=0} {line=$0; out=""; while(length(line)>0){ if(c==0){ i=index(line,"<!--"); if(i==0){out=out line; line=""} else {out=out substr(line,1,i-1); line=substr(line,i+4); c=1} } else { j=index(line,"-->"); if(j==0){line=""} else {line=substr(line,j+3); c=0} } } print out}' "$1"
}
# grep -nE de un patrón sobre varias páginas HTML, ignorando comentarios; salida "pagina:linea:texto".
grep_paginas() {
  _pat="$1"; shift
  for _p in "$@"; do sin_comentarios "$_p" | grep -nE "$_pat" | sed "s|^|$_p:|"; done
}

# Filesystem, no git: una página nueva sin commitear igual tiene que cumplir.
paginas_todas() {
  find . -name '*.html' -not -path './.git/*' | sed 's|^\./||' | sort
}
paginas_tablero() {
  paginas_todas | grep -vE "$EXCEPTUADAS_RE"
}

# ===========================================================================
seccion "1. Consistencia del tablero"
# ===========================================================================

# Piezas que tienen que estar en TODA página de tablero, iguales a la plantilla.
HEADER_REQ='class="encabezado" class="logo" id="boton-tema" icono-luna icono-sol'
FOOTER_REQ='class="pie" pie-escudos pie-acciones modal-ia modal-ods enlaces-paginas guia-diseno.html'

for page in $(paginas_tablero); do
  falta=""
  for tok in $HEADER_REQ; do grep -qF "$tok" "$page" || falta="$falta header:$tok"; done
  for tok in $FOOTER_REQ; do grep -qF "$tok" "$page" || falta="$falta footer:$tok"; done
  grep -q 'class="intro"' "$page" || falta="$falta seccion:.intro"
  if [ -n "$falta" ]; then
    mal "$page: header/footer/intro incompletos o modificados —$falta"
  else
    ok "$page: header, footer e intro completos y sin cambios de estructura"
  fi

  # La Fuente del dato es obligatoria: el footer tiene que decir de dónde salen los datos.
  if grep -q '<strong>Fuente:</strong>' "$page"; then
    ok "$page: el footer declara la Fuente del dato"
  else
    mal "$page: el footer no tiene la línea <strong>Fuente:</strong> (de dónde salen los datos)"
  fi

  # Declaración de uso de IA (modal "Río Cuarto IA"): tiene que existir y nombrar el modelo
  # realmente usado. El modelo se lee de los commits (línea "Co-Authored-By: Claude ...").
  if ! grep -qiE 'modelos?:' "$page"; then
    aviso "$page: la declaración de IA no indica el modelo (\"modelo: …\" o \"modelos: …\"). El agente la completa con el atajo ia: (AGENTS.md §7)"
  else
    modelos=$(git log --format=%B 2>/dev/null | grep -oE 'Co-Authored-By: Claude [A-Za-z]+ [0-9][0-9.]*' | sed 's/^Co-Authored-By: //' | sort -u)
    faltan=""
    while IFS= read -r m; do
      [ -n "$m" ] && { grep -qF "$m" "$page" || faltan="$faltan [$m]"; }
    done <<< "$modelos"
    if [ -n "$faltan" ]; then
      aviso "$page: la declaración de IA no menciona el modelo que firmó commits:$faltan — actualizala con el atajo ia:"
    else
      ok "$page: la declaración de IA coincide con el modelo usado"
    fi
  fi

  # Modal de ODS: tiene que mostrar al menos un ODS (o borrarse junto con su botón).
  if grep -q 'id="modal-ods"' "$page"; then
    if grep -qE 'assets/img/ods/ods-[0-9]{2}\.png' "$page"; then
      ok "$page: el modal de ODS muestra los ODS del tablero"
    else
      pendiente "$page: el modal de ODS está vacío — agregá los ODS del tablero o borrá el botón y el modal"
    fi
    # La Ordenanza N° 148/2021 es la base normativa de los ODS en el municipio: va siempre.
    if ! grep -q 'Ordenanza N° 148/2021' "$page"; then
      mal "$page: al modal de ODS le falta la referencia a la Ordenanza N° 148/2021 (va siempre, con su link)"
    fi
  fi

  # Textos de ejemplo de la plantilla que hay que reemplazar.
  ph=$(grep -nFe 'Título del tablero' \
                -e 'Una línea que explica qué muestra este tablero' \
                -e 'Una línea que describe qué muestra este tablero' \
                -e 'Actualizá esta fecha' \
                -e 'Texto a definir' \
                -e '[completar' \
                -e 'Elaboración propia con datos agregados y publicables' \
                -e 'Empezá tu tablero acá' "$page")
  if [ -n "$ph" ]; then
    pendiente "$page: quedaron textos de ejemplo de la plantilla sin reemplazar:"
    detalle "$ph"
  fi
done

if [ "$modo_plantilla" = 1 ]; then
  aviso "Existe el archivo PLANTILLA: esto es la plantilla sin instanciar. Al crear tu tablero, borralo (y así estos controles pasan a bloquear de verdad)."
fi

# ===========================================================================
seccion "2. Metadata mínima"
# ===========================================================================

for page in $(paginas_tablero); do
  meta_falta=""
  meta_pend=""

  grep -qE '<title>[^<]+</title>' "$page" || meta_falta="$meta_falta <title>"
  grep -qF '<title>Tablero — Gobierno de Río Cuarto</title>' "$page" && meta_pend="$meta_pend <title>(sigue el de la plantilla)"

  if grep -qiE '<meta[^>]+name="description"' "$page"; then
    grep -qiE '<meta[^>]+name="description"[^>]+content="[^"]{15,}"' "$page" \
      || meta_pend="$meta_pend description(vacía o muy corta)"
  else
    meta_falta="$meta_falta meta-description"
  fi

  grep -qiE '<link[^>]+rel="icon"' "$page" || meta_falta="$meta_falta favicon"
  grep -qiE '<meta[^>]+name="author"[^>]+content="[^"]{5,}"' "$page" || meta_falta="$meta_falta meta-author"

  grep -qE 'class="actualizado"|name="dcterms.modified"' "$page" || meta_falta="$meta_falta fecha-de-actualización"

  [ -n "$meta_falta" ] && mal "$page: falta metadata —$meta_falta"
  [ -n "$meta_pend" ]  && pendiente "$page: metadata a medio llenar —$meta_pend"
  [ -z "$meta_falta$meta_pend" ] && ok "$page: metadata mínima completa"
done

# ===========================================================================
seccion "3. Sistema de diseño"
# ===========================================================================

CSS_REQ="fuentes tokens base componentes iconos tablero"
JS_REQ="tema pie tablero"

for page in $(paginas_tablero); do
  falta=""
  for c in $CSS_REQ; do grep -q "css/$c\.css" "$page" || falta="$falta css/$c.css"; done
  for j in $JS_REQ; do grep -q "js/$j\.js" "$page" || falta="$falta js/$j.js"; done
  grep -q 'id="boton-tema"' "$page" || falta="$falta #boton-tema"
  grep -q "tablero-tema" "$page" || falta="$falta script-anti-titileo(<head>)"
  if [ -n "$falta" ]; then
    mal "$page no enlaza / no incluye:$falta"
  else
    ok "$page: design system completo (6 CSS, tema.js, pie.js, tablero.js, header)"
  fi
done

# sha256sum viene con Git para Windows y con Linux; shasum, con macOS. El archivo de hashes
# tiene el mismo formato para los dos.
verificar_hashes=""
if command -v sha256sum >/dev/null 2>&1; then verificar_hashes="sha256sum -c"
elif command -v shasum >/dev/null 2>&1; then verificar_hashes="shasum -a 256 -c"; fi
if [ -n "$verificar_hashes" ]; then
  res=$($verificar_hashes scripts/sistema.sha256 2>&1)
  if printf '%s\n' "$res" | grep -qE ':[[:space:]]*(FAILED|FALL)'; then
    mal "Un archivo compartido del design system fue modificado (no se tocan):"
    detalle "$(printf '%s\n' "$res" | grep -vE ':[[:space:]]*OK$')"
    printf '      %sSi el cambio es a propósito, regenerá los hashes:%s\n' "$GRIS" "$FIN"
    printf '      shasum -a 256 css/base.css css/componentes.css css/iconos.css css/fuentes.css js/tema.js js/pie.js js/graficos.js js/mapa.js js/vendor/echarts.min.js js/vendor/leaflet/leaflet.js js/vendor/leaflet/leaflet.css > scripts/sistema.sha256\n'
  else
    ok "Archivos compartidos (base, componentes, iconos, fuentes.css, tema.js, pie.js, graficos.js, mapa.js, echarts, leaflet) intactos"
  fi
else
  aviso "Sin sha256sum ni shasum: no se pudo verificar que los archivos compartidos estén intactos"
fi

hex=$(grep -rnE '#[0-9a-fA-F]{3}([0-9a-fA-F]{3})?\b' css/tablero.css js/tablero.js 2>/dev/null \
  | grep -vE '#(fff|ffffff|000|000000)\b')
if [ -n "$hex" ]; then
  aviso "Colores hexadecimales a mano (deberían salir de css/tokens.css):"
  detalle "$hex"
else
  ok "Sin colores a mano en css/tablero.css ni js/tablero.js"
fi

# ECharts (gráficos) y Leaflet (mapas) son las librerías que el equipo acordó: no avisa.
vendor=$(git ls-files 'js/vendor/*' 'vendor/*' 'js/lib/*' '*.min.js' | grep -viE '/LEEME\.md$|js/vendor/(echarts\.min\.js|LICENSE-echarts\.txt|LICENSE-leaflet\.txt|leaflet/.*)$')
if [ -n "$vendor" ]; then
  aviso "Hay librerías de terceros en el repo — confirmá que el equipo las acordó (AGENTS.md §4):"
  detalle "$vendor"
else
  ok "Sin librerías de terceros además de las acordadas (ECharts, Leaflet)"
fi

# ===========================================================================
seccion "4. Accesibilidad"
# ===========================================================================

sin_lang=""
for page in $(paginas_todas); do
  grep -qE '<html[^>]*\blang=' "$page" || sin_lang="$sin_lang $page"
done
[ -n "$sin_lang" ] && mal "Páginas sin lang= en <html>:$sin_lang" \
                   || ok "Todas las páginas declaran lang= en <html>"

img_sin_alt=$(grep -rnoE '<img[^>]*>' --include='*.html' --exclude-dir=.git . 2>/dev/null | grep -viE '\balt=')
if [ -n "$img_sin_alt" ]; then
  mal "Hay <img> sin atributo alt:"
  detalle "$img_sin_alt"
else
  ok "Todas las <img> tienen alt"
fi

onclick=$(grep -rnE '<(div|span)[^>]*\bonclick=' --include='*.html' --exclude-dir=.git . 2>/dev/null)
if [ -n "$onclick" ]; then
  mal "Elementos no interactivos con onclick (usá <button> o <a>):"
  detalle "$onclick"
else
  ok "Sin <div>/<span> con onclick"
fi

for page in $(paginas_todas); do
  n=$(grep -oE '<h1[ >]' "$page" | wc -l | tr -d ' ')
  [ "$n" = "1" ] || aviso "$page: tiene $n elementos <h1> (debería haber exactamente 1)"
done

# ===========================================================================
seccion "5. Datos remotos y recursos externos (SECURITY.md, Regla 3)"
# ===========================================================================

# JS propios del tablero: todo lo que no es del sistema compartido ni de js/vendor.
js_propios=$(find js -name '*.js' -not -path 'js/vendor/*' ! -name tema.js ! -name pie.js ! -name graficos.js ! -name mapa.js 2>/dev/null | sort | tr '\n' ' ')
paginas=$(paginas_tablero | tr '\n' ' ')

# a) Ningún <script>, <img>, <iframe> ni <link> apuntando a internet (un <a href> sí vale).
externos=""
for page in $paginas; do
  r=$(sin_comentarios "$page" | grep -nE "<(script|img|iframe|source|video|audio)[^>]*[[:space:]]src=[\"']?(https?:)?//|<link[^>]*[[:space:]]href=[\"']?(https?:)?//" \
      | grep -vE 'rel="(canonical|alternate|author|license|me)"')
  [ -n "$r" ] && externos="$externos$(printf '%s\n' "$r" | sed "s|^|$page:|")
"
done
if [ -n "$externos" ]; then
  mal "Recursos cargados desde internet (se descargan y van en css/, js/ o assets/):"
  detalle "$externos"
else
  ok "Ningún <script>, <img>, <iframe> ni <link> apunta a internet"
fi

if [ -n "$js_propios" ]; then
  # b) Nada sin cifrar: http:// ni ws:// en los JS propios.
  inseguro=$(grep -nE "(http|ws)://" $js_propios | grep -vE "w3\.org|localhost|127\.0\.0\.1")
  if [ -n "$inseguro" ]; then
    mal "Direcciones sin cifrar (usá https:// / wss://):"
    detalle "$inseguro"
  else
    ok "Sin direcciones http:// ni ws:// en los JS del tablero"
  fi

  # c) Ninguna credencial a la vista: lo que está en el navegador lo ve cualquiera.
  datos_cred=$(find datos -type f \( -name '*.json' -o -name '*.csv' -o -name '*.js' -o -name '*.geojson' -o -name '*.txt' \) 2>/dev/null | tr '\n' ' ')
  PAT_CRED="api[_-]?key|apikey|access[_-]?token|auth[_-]?token|[?&](api_?key|key|token|access_token)=|bearer[[:space:]]|authorization|eyJ[A-Za-z0-9_-]{20,}\\.[A-Za-z0-9_-]{10,}|AKIA[0-9A-Z]{16}|-----BEGIN"
  cred=$( { grep -inE "$PAT_CRED" $js_propios $datos_cred 2>/dev/null; grep_paginas "$PAT_CRED" $paginas; } | grep -v "tablero-tema")
  if [ -n "$cred" ]; then
    mal "Posible credencial a la vista (en el JS, el HTML o los datos). Si la API pide clave, va por un endpoint del backend del Observatorio — SECURITY.md:"
    detalle "$cred"
  else
    ok "Sin claves ni tokens a la vista (JS, HTML y datos)"
  fi

  # d) El tablero solo lee: avisa si envía datos.
  envia=$(grep -nE "method[[:space:]]*:[[:space:]]*['\"](POST|PUT|PATCH|DELETE)|sendBeacon\(" $js_propios)
  if [ -n "$envia" ]; then
    aviso "El tablero envía datos (POST/PUT/PATCH/DELETE o sendBeacon): los tableros solo leen — confirmalo con el equipo:"
    detalle "$envia"
  fi

  # e) A qué APIs le habla (para que se vea en el PR).
  origenes=$(grep -ohE "https://[A-Za-z0-9._:-]+" $js_propios | grep -v "w3.org" | sort -u)
  if [ -n "$origenes" ]; then
    aviso "El tablero se conecta a estas APIs — la Fuente del footer tiene que nombrarlas, y los datos tienen que llegar ya agregados:"
    detalle "$origenes"
  else
    ok "El tablero no consume APIs externas"
  fi
else
  ok "No hay JS propio del tablero que revisar"
fi

# ===========================================================================
seccion "6. Contenido y código del tablero (el harness)"
# ===========================================================================
# Por qué existe: los tableros se despliegan como archivos estáticos que sirve el
# Observatorio, SIN sandbox y en el mismo origen que el portal. Todo lo que está
# en el repo se publica, y el JS corre con los privilegios de quien mira.

# Datos propios del tablero (sin los LEEME).
datos_files=$(find datos -type f \( -name '*.json' -o -name '*.csv' -o -name '*.tsv' -o -name '*.js' -o -name '*.geojson' -o -name '*.txt' \) 2>/dev/null | sort | tr '\n' ' ')

# a) Qué archivos hay en el repo: solo lo que un tablero necesita.
todos=$( (git ls-files --cached --others --exclude-standard 2>/dev/null || find . -type f -not -path './.git/*' | sed 's|^\./||') | sort -u)
prohibidos=""; raros=""
while IFS= read -r f; do
  [ -z "$f" ] && continue
  case "$f" in
    scripts/*|.github/*|PLANTILLA|.gitignore|.gitattributes|.editorconfig|.gitleaks.toml|LICENSE*|*/LICENSE*|*.sha256) continue ;;
    node_modules/*|*/node_modules/*|venv/*|.venv/*|env/*|*/site-packages/*|__pycache__/*|*/__pycache__/*|.git/*)
      prohibidos="$prohibidos$f  (carpeta de dependencias o entorno)
"; continue ;;
    .env|.env.*|*/.env|*/.env.*|*.pem|*.key|*.p12|*.pfx|*.crt|*.cer|*id_rsa*|*serviceAccount*|*service-account*|*credentials*|*.kdbx)
      prohibidos="$prohibidos$f  (credenciales)
"; continue ;;
  esac
  ext=$(printf '%s' "${f##*.}" | tr 'A-Z' 'a-z')
  case "$ext" in
    py|gs|sql|php|rb|go|java|class|jar|exe|dll|so|sh|bat|ps1|cgi|pl)
      prohibidos="$prohibidos$f  (código de servidor o ejecutable: un tablero es HTML, CSS, JS, imágenes y datos)
" ;;
    xlsx|xls|xlsm|docx|doc|pptx|ppt|zip|tar|gz|tgz|7z|rar|db|sqlite|sqlite3|bak|log|ipynb|parquet|dump)
      prohibidos="$prohibidos$f  (datos crudos o archivo comprimido: no se publica)
" ;;
    html|htm|css|js|mjs|json|geojson|csv|tsv|txt|md|png|jpg|jpeg|gif|webp|avif|svg|ico|woff|woff2|ttf|otf|pdf|xml|webmanifest|map) ;;
    *) case "$(basename "$f")" in .DS_Store|Thumbs.db) raros="$raros$f  (ruido del sistema operativo)
" ;; *) raros="$raros$f
" ;; esac ;;
  esac
done <<< "$todos"
if [ -n "$prohibidos" ]; then
  mal "Archivos que no pueden estar en el repo de un tablero (se publicarían tal cual):"
  detalle "$prohibidos"
else
  ok "El repo solo tiene archivos de tablero (sin código de servidor, credenciales ni datos crudos)"
fi
[ -n "$raros" ] && { aviso "Archivos de un tipo inesperado — confirmá que hacen falta:"; detalle "$raros"; }

# b) Rutas: relativas y que existan (el tablero se sirve desde una subcarpeta; un archivo
#    que falta puede disparar miles de pedidos).
roto=""
for page in $paginas; do
  d=$(dirname "$page")
  refs=$(sin_comentarios "$page" | grep -oE '(src|href)="[^"]*"' | sed -E 's/^(src|href)="//; s/"$//')
  while IFS= read -r r; do
    [ -z "$r" ] && continue
    case "$r" in
      \#*|http:*|https:*|//*|mailto:*|tel:*|data:*|javascript:*|blob:*) continue ;;
      /*) roto="$roto$page: ruta absoluta \"$r\" (usá rutas relativas: el tablero se sirve desde una subcarpeta)
"; continue ;;
    esac
    ruta="${r%%[?#]*}"
    [ -e "$d/$ruta" ] || roto="$roto$page: no existe \"$r\"
"
  done <<< "$refs"
done
if [ -f css/tablero.css ]; then
  urls=$(grep -oE 'url\([^)]*\)' css/tablero.css | sed -E "s/^url\\(//; s/\\)$//; s/^[\"']//; s/[\"']$//")
  while IFS= read -r r; do
    [ -z "$r" ] && continue
    case "$r" in data:*|http:*|https:*|//*|\#*) continue ;; /*) roto="${roto}css/tablero.css: ruta absoluta \"$r\"
"; continue ;; esac
    [ -e "css/${r%%[?#]*}" ] || roto="${roto}css/tablero.css: no existe \"$r\"
"
  done <<< "$urls"
fi
if [ -n "$roto" ]; then
  mal "Rutas que no son relativas o apuntan a archivos que no existen:"
  detalle "$roto"
else
  ok "Todas las rutas del tablero son relativas y los archivos existen"
fi

# c) Código que no puede tocar la sesión ni el almacenamiento del portal. El nombre de la
#    clave del tema ('tablero-tema') es la única excepción: es del sistema compartido.
if [ -n "$js_propios$paginas" ]; then
  PAT_SESION="localStorage|sessionStorage|indexedDB|document\\.cookie|window\\.(parent|top)\\b|(^|[^.A-Za-z_])(parent|top)\\.(location|document|postMessage|frames|window)|\\beval\\(|new[[:space:]]+Function\\(|document\\.write\\(|importScripts|serviceWorker|['\"\`]/api/"
  sesion=$( { [ -n "$js_propios" ] && grep -nE "$PAT_SESION" $js_propios 2>/dev/null; grep_paginas "$PAT_SESION" $paginas; } | grep -v "tablero-tema")
  if [ -n "$sesion" ]; then
    mal "Código que toca la sesión, el almacenamiento o el portal (corre con los privilegios de quien mira el tablero):"
    detalle "$sesion"
  else
    ok "Ningún código toca la sesión, el almacenamiento ni la API del portal"
  fi
  PAT_RIESGO="innerHTML[[:space:]]*\\+?=|outerHTML[[:space:]]*=|insertAdjacentHTML|postMessage\\(|<form[^>]*action="
  riesgo=$( { [ -n "$js_propios" ] && grep -nE "$PAT_RIESGO" $js_propios 2>/dev/null; grep_paginas "$PAT_RIESGO" $paginas; } )
  if [ -n "$riesgo" ]; then
    aviso "Revisá a mano: inyectar HTML con datos (innerHTML) abre la puerta a XSS — usá textContent; postMessage y formularios con action también:"
    detalle "$riesgo"
  fi
  # d) Pedidos desbocados.
  PAT_BUCLE="while[[:space:]]*\\([[:space:]]*(true|1)[[:space:]]*\\)|for[[:space:]]*\\([[:space:]]*;[[:space:]]*;[[:space:]]*\\)|setInterval\\([^)]*,[[:space:]]*([0-9]{1,3}|[1-4][0-9]{3})[[:space:]]*\\)|onerror[[:space:]]*=[^;]*\\.src"
  bucles=$( { [ -n "$js_propios" ] && grep -nE "$PAT_BUCLE" $js_propios 2>/dev/null; grep_paginas "$PAT_BUCLE" $paginas; } )
  if [ -n "$bucles" ]; then
    aviso "Posible bucle de pedidos (intervalo menor a 5 s, bucle infinito o reintento de imagen en onerror) — el Observatorio ya vio 19.384 pedidos en 20 s por uno así:"
    detalle "$bucles"
  fi
fi

# Lee un JSON por stdin y lo aplana a líneas "ruta<TAB>valor" (ej.: .datasets[0].nombre). Sin
# dependencias: solo awk. Si el JSON no es válido, imprime una línea "ERROR<TAB>motivo".
aplanar_json() {
  awk '
  function ws() { while (pos <= n && index(" \t\r\n", substr(txt, pos, 1)) > 0) pos++ }
  function fail(m) { if (!failed) { failed = 1; msg = m " (posición " pos ")" } }
  function parse_str(   out, c, e) {
    pos++; out = ""
    while (pos <= n) {
      c = substr(txt, pos, 1)
      if (c == "\\") { e = substr(txt, pos + 1, 1); if (e == "n" || e == "t" || e == "r") out = out " "; else out = out e; pos += 2; continue }
      if (c == "\"") { pos++; return out }
      out = out c; pos++
    }
    fail("cadena sin cerrar"); return out
  }
  function parse_value(path,   c, v) {
    ws(); c = substr(txt, pos, 1)
    if (c == "{") { parse_obj(path); return }
    if (c == "[") { parse_arr(path); return }
    if (c == "\"") { v = parse_str(); print path "\t" v; return }
    if (match(substr(txt, pos), /^(-?[0-9][0-9.eE+-]*|true|false|null)/)) { print path "\t" substr(txt, pos, RLENGTH); pos += RLENGTH; return }
    fail("valor inesperado")
  }
  function parse_obj(path,   key, c) {
    pos++; ws()
    if (substr(txt, pos, 1) == "}") { pos++; print path "\t{}"; return }
    while (!failed) {
      ws(); if (substr(txt, pos, 1) != "\"") { fail("se esperaba una clave entre comillas"); return }
      key = parse_str(); ws()
      if (substr(txt, pos, 1) != ":") { fail("falta : después de la clave"); return }
      pos++; parse_value(path "." key); if (failed) return
      ws(); c = substr(txt, pos, 1)
      if (c == ",") { pos++; continue }
      if (c == "}") { pos++; return }
      fail("se esperaba , o }"); return
    }
  }
  function parse_arr(path,   idx, c) {
    pos++; ws()
    if (substr(txt, pos, 1) == "]") { pos++; print path "\t[]"; return }
    idx = 0
    while (!failed) {
      parse_value(path "[" idx "]"); if (failed) return
      idx++; ws(); c = substr(txt, pos, 1)
      if (c == ",") { pos++; continue }
      if (c == "]") { pos++; return }
      fail("se esperaba , o ]"); return
    }
  }
  { txt = txt $0 "\n" }
  END {
    n = length(txt); pos = 1; failed = 0
    parse_value("")
    ws(); if (!failed && pos <= n) fail("hay texto después del JSON")
    if (failed) print "ERROR\t" msg
  }'
}
# json_get "<aplanado>" ".ruta"  ->  el valor de esa ruta (vacío si no está).
json_get() { printf '%s\n' "$1" | awk -F'\t' -v k="$2" '$1 == k { print substr($0, length(k) + 2); exit }'; }
# json_error "<aplanado>"  ->  el motivo, si el JSON no es válido.
json_error() { printf '%s\n' "$1" | awk -F'\t' '$1 == "ERROR" { print $2 }'; }
fecha_ok() { printf '%s' "$1" | grep -qE '^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$'; }
NL=$'\n'

# Excepciones registradas (excepciones.json): SOLO para datos personales, con responsable,
# motivo y vencimiento. Se validan acá; el detalle se muestra en
# la sección 8. Si una excepción no es válida, no se honra y el hallazgo sigue bloqueando.
exc_archivos=""; exc_lineas=""
if [ -f excepciones.json ]; then
  aj_exc=$(aplanar_json < excepciones.json)
  tj_exc=""; [ -f tablero.json ] && tj_exc=$(aplanar_json < tablero.json)
  hoy="${HOY:-$(date +%Y-%m-%d)}"
  privado=$(printf '%s' "${REPO_PRIVADO:-}" | tr 'A-Z' 'a-z')
  sens_exc=$(json_get "$tj_exc" ".sensibilidad")
  if [ -n "$(json_error "$aj_exc")" ]; then
    exc_lineas="ERR|excepciones.json no es un JSON válido: $(json_error "$aj_exc")${NL}"
  else
    idxs=$(printf '%s\n' "$aj_exc" | sed -n 's/^\.excepciones\[\([0-9]*\)\].*/\1/p' | sort -un)
    [ -n "$idxs" ] && [ -z "$privado" ] && exc_lineas="WARN|No pude comprobar si el repo es privado (en GitHub se verifica solo): confirmalo antes de publicar una excepción de datos personales${NL}"
    for i in $idxs; do
      n=$((i + 1)); p=".excepciones[$i]"; errs=""
      [ "$(json_get "$aj_exc" "$p.regla")" = "datos-personales" ] || errs="$errs\"regla\" tiene que ser \"datos-personales\": es la única que se puede exceptuar${NL}"
      arch=$(printf '%s\n' "$aj_exc" | awk -F'\t' -v q="$p.archivos[" 'index($1, q) == 1 { print $2 }')
      if [ -z "$arch" ]; then errs="$errs\"archivos\": lista de archivos dentro de datos/${NL}"
      else
        while IFS= read -r a; do
          case "$a" in datos/*) [ -f "$a" ] || errs="${errs}el archivo \"$a\" no existe${NL}" ;; *) errs="${errs}\"$a\" no está dentro de datos/${NL}" ;; esac
        done <<< "$arch"
      fi
      resp=$(json_get "$aj_exc" "$p.responsable")
      motivo=$(json_get "$aj_exc" "$p.motivo"); fecha=$(json_get "$aj_exc" "$p.fecha"); vence=$(json_get "$aj_exc" "$p.vence")
      [ -n "$resp" ] || errs="${errs}falta \"responsable\" (nombre y cargo)${NL}"
      [ "${#motivo}" -ge 20 ] || errs="${errs}\"motivo\": explicá por qué hace falta publicar esos datos (mínimo 20 caracteres)${NL}"
      fecha_ok "$fecha" || errs="${errs}\"fecha\": formato AAAA-MM-DD${NL}"
      fecha_ok "$vence" || errs="${errs}\"vence\": formato AAAA-MM-DD${NL}"
      if fecha_ok "$fecha" && fecha_ok "$vence"; then
        [[ "$vence" < "$hoy" ]] && errs="${errs}VENCIDA el $vence: renovarla es una decisión nueva${NL}"
        limite="$(( ${fecha%%-*} + 1 ))-${fecha#*-}"
        [[ "$vence" > "$limite" ]] && errs="${errs}\"vence\" no puede superar 1 año desde \"fecha\"${NL}"
      fi
      [ "$sens_exc" = "confidencial" ] || errs="${errs}tablero.json tiene que declarar \"sensibilidad\": \"confidencial\" (hoy: ${sens_exc:-sin declarar})${NL}"
      [ "$privado" = "false" ] && errs="${errs}el repo es PÚBLICO: los datos personales quedarían expuestos a cualquiera y en el historial para siempre${NL}"
      if [ -n "$errs" ]; then
        while IFS= read -r m; do [ -n "$m" ] && exc_lineas="${exc_lineas}ERR|excepción #$n: $m${NL}"; done <<< "$errs"
      else
        while IFS= read -r a; do exc_lineas="${exc_lineas}OK|$a|$resp|$vence|$motivo${NL}"; done <<< "$arch"
      fi
    done
  fi
  exc_archivos=$(printf '%s\n' "$exc_lineas" | sed -n 's/^OK|\([^|]*\)|.*/\1/p')
fi

# Saca de un listado "archivo:línea:texto" los archivos cubiertos por una excepción válida.
filtrar_exceptuados() {
  if [ -z "$exc_archivos" ]; then cat; return; fi
  _re=$(printf '%s\n' "$exc_archivos" | sed 's/[][\.*^$/]/\\&/g' | paste -sd'|' -)
  grep -vE "^(${_re}):"
}

# e) Datos personales en datos/ (Regla 2): lo que se publica es el resumen, no la fila.
if [ -n "$datos_files" ]; then
  pii=""
  r=$(grep -nHEi "(dni|documento)[^0-9a-z]{0,6}[0-9]{7,8}|\b(20|23|24|27|30|33|34)-[0-9]{8}-[0-9]\b|[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}|(tel|celular|whatsapp|móvil)[^0-9a-z]{0,6}\+?[0-9][0-9 ()-]{6,}" $datos_files 2>/dev/null | filtrar_exceptuados | head -8)
  [ -n "$r" ] && pii="$r"
  if [ -n "$pii" ]; then
    mal "Datos que parecen identificar personas (DNI, CUIT, correo, teléfono) en datos/ — Regla 2:"
    detalle "$pii"
  else
    ok "datos/ no tiene DNI, CUIT, correos ni teléfonos"
  fi
  cols=$(grep -nHEi "\"(dni|cuil|cuit|nombre|apellido|domicilio|direccion|dirección|telefono|teléfono|email|correo|expediente)\"[[:space:]]*:" $datos_files 2>/dev/null | filtrar_exceptuados | head -5)
  for csv in $(printf '%s\n' $datos_files | grep -E '\.(csv|tsv)$'); do
    h=$(head -1 "$csv" | grep -Ei "(^|[,;\"])(dni|cuil|cuit|nombre|apellido|domicilio|direccion|dirección|telefono|teléfono|email|correo|expediente)([,;\"]|$)" && echo "$csv:1: columnas que parecen identificar personas")
    if [ -n "$h" ] && ! printf '%s\n' "$exc_archivos" | grep -qxF "$csv"; then cols="$cols
$csv:1: $(head -1 "$csv" | cut -c1-100)"; fi
  done
  if [ -n "$(printf '%s' "$cols" | tr -d '[:space:]')" ]; then
    aviso "Campos que suelen identificar personas — confirmá que son datos agregados (regla de los 5, SECURITY.md):"
    detalle "$cols"
  fi
  puntos=$(grep -nHE "\"type\"[[:space:]]*:[[:space:]]*\"Point\"" $datos_files 2>/dev/null | filtrar_exceptuados | head -3)
  [ -n "$puntos" ] && { aviso "Hay puntos en el mapa: un punto es un domicilio — usá polígonos por barrio (SECURITY.md):"; detalle "$puntos"; }
fi

# ===========================================================================
seccion "7. Manifiesto del tablero (tablero.json — metadatos mínimos, Ord. 162/2025 Art. 13°)"
# ===========================================================================

if [ ! -f tablero.json ]; then
  mal "Falta tablero.json (identificador, título, descripción, autoría, contacto, datasets, sensibilidad)"
else
  tj=$(aplanar_json < tablero.json)
  if [ -n "$(json_error "$tj")" ]; then
    mal "tablero.json no es un JSON válido: $(json_error "$tj")"
  else
    errores=""; pends=""
    for k in identificador titulo descripcion fecha_creacion tematica contacto sensibilidad modo_datos; do
      v=$(json_get "$tj" ".$k")
      if [ -z "$(printf '%s' "$v" | tr -d '[:space:]')" ]; then errores="${errores}falta \"$k\"${NL}"
      elif printf '%s' "$v" | grep -qF '[completar'; then pends="${pends}\"$k\" sin completar${NL}"
      else
        case "$k" in
          identificador) printf '%s' "$v" | grep -qE '^[a-z0-9][a-z0-9-]{1,63}$' || errores="${errores}\"identificador\": solo minúsculas, números y guiones (sin espacios)${NL}" ;;
          fecha_creacion) fecha_ok "$v" || errores="${errores}\"fecha_creacion\": formato AAAA-MM-DD${NL}" ;;
          contacto) printf '%s' "$v" | grep -qE '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' || errores="${errores}\"contacto\": tiene que ser un correo${NL}" ;;
          sensibilidad) case "$v" in bajo|medio|alto|confidencial) ;; *) errores="${errores}\"sensibilidad\": bajo, medio, alto o confidencial${NL}" ;; esac ;;
          modo_datos) case "$v" in estatico|api) ;; *) errores="${errores}\"modo_datos\": estatico o api${NL}" ;; esac ;;
        esac
      fi
    done
    autores=$(printf '%s\n' "$tj" | awk -F'\t' '$1 ~ /^\.autoria\[[0-9]+\]$/ { print $2 }')
    if [ -z "$autores" ]; then errores="${errores}falta \"autoria\" (lista de nombres)${NL}"
    elif printf '%s\n' "$autores" | grep -qF '[completar'; then pends="${pends}\"autoria\" sin completar${NL}"
    elif printf '%s\n' "$autores" | grep -qE '^[[:space:]]*$'; then errores="${errores}\"autoria\": hay un nombre vacío${NL}"; fi
    didx=$(printf '%s\n' "$tj" | sed -n 's/^\.datasets\[\([0-9]*\)\].*/\1/p' | sort -un)
    if [ -z "$didx" ]; then errores="${errores}falta \"datasets\" (lista con \"nombre\" y \"fuente\" en cada uno)${NL}"
    else
      for i in $didx; do
        dn=$(json_get "$tj" ".datasets[$i].nombre"); df=$(json_get "$tj" ".datasets[$i].fuente")
        if [ -z "$dn" ] || [ -z "$df" ]; then errores="${errores}\"datasets\"[$i]: tiene que tener \"nombre\" y \"fuente\"${NL}"
        elif printf '%s%s' "$dn" "$df" | grep -qF '[completar'; then pends="${pends}\"datasets\"[$i] sin completar${NL}"; fi
      done
    fi
    [ -n "$errores" ] && { mal "tablero.json con errores:"; detalle "$errores"; }
    [ -n "$pends" ] && { pendiente "tablero.json: hay campos sin completar:"; detalle "$pends"; }
    [ -z "$errores$pends" ] && ok "tablero.json completo y válido"
    sens=$(json_get "$tj" ".sensibilidad"); modo=$(json_get "$tj" ".modo_datos")
    case "$sens" in
      alto|confidencial) aviso "Sensibilidad \"$sens\": en el Observatorio exige sesión y aprobación (fiscal primero si es confidencial) — confirmá require_login al cargarlo" ;;
    esac
    # Coherencia entre el modo de datos declarado y lo que hace el código.
    if [ "$modo" = "estatico" ] && [ -n "${origenes:-}" ]; then
      mal "tablero.json dice modo_datos \"estatico\" pero el código se conecta a una API: corregí el manifiesto o el código"
    elif [ "$modo" = "api" ] && [ -z "${origenes:-}" ]; then
      aviso "tablero.json dice modo_datos \"api\" pero el código no se conecta a ninguna API"
    fi
  fi
fi

# ===========================================================================
seccion "8. Excepciones registradas (excepciones.json)"
# ===========================================================================
# Una excepción NO hace legal publicar datos personales ni los saca del historial de git:
# deja constancia de quién lo decidió, por qué y hasta cuándo.

hay_exc=$(printf '%s\n' "$exc_lineas" | grep -c .)
if [ ! -f excepciones.json ]; then
  ok "Sin excepciones registradas"
elif [ "$hay_exc" = "0" ]; then
  ok "excepciones.json sin excepciones"
else
  errores_exc=$(printf '%s\n' "$exc_lineas" | sed -n 's/^ERR|//p')
  avisos_exc=$(printf '%s\n' "$exc_lineas" | sed -n 's/^WARN|//p')
  [ -n "$errores_exc" ] && { mal "Excepciones que no son válidas (no se honran: el hallazgo sigue bloqueando):"; detalle "$errores_exc"; }
  [ -n "$avisos_exc" ] && { aviso "$avisos_exc"; }
  printf '%s\n' "$exc_lineas" | sed -n 's/^OK|//p' | while IFS='|' read -r arch resp vence motivo; do
    printf '  %s⚠%s EXCEPCIÓN REGISTRADA — %s\n      responsable: %s · vence: %s\n      motivo: %s\n' "$AMAR" "$FIN" "$arch" "$resp" "$vence" "$motivo"
  done
  n_ok=$(printf '%s\n' "$exc_lineas" | grep -c '^OK|')
  avisos=$((avisos + n_ok))
fi

# Una excepción no puede escribirla un agente de IA: tiene que ser una decisión humana. Se
# mira solo a los commits que CAMBIAN las excepciones (el que crea el archivo vacío no cuenta).
if [ -f excepciones.json ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  ia_exc=""
  for c in $(git log --format=%H -- excepciones.json 2>/dev/null); do
    despues=$(git show "$c:excepciones.json" 2>/dev/null | aplanar_json | grep '^\.excepciones\[')
    antes=""
    git rev-parse --verify -q "$c^" >/dev/null 2>&1 && antes=$(git show "$c^:excepciones.json" 2>/dev/null | aplanar_json | grep '^\.excepciones\[')
    if [ "$despues" != "$antes" ]; then
      m=$(git log -1 --format=%B "$c" | grep -iE "Co-Authored-By:.*(Claude|Copilot|GPT|Gemini|Codex|Cursor)" | head -1)
      [ -n "$m" ] && ia_exc="${ia_exc}$(printf '%s' "$c" | cut -c1-7) ${m}${NL}"
    fi
  done
  if [ -n "$ia_exc" ]; then
    mal "Hay commits que cambian excepciones.json firmados por una IA — una excepción tiene que escribirla una persona, con su nombre:"
    detalle "$ia_exc"
  fi
fi

# ===========================================================================
printf '\n%s────────────────────────────────────────%s\n' "$GRIS" "$FIN"
if [ "$fallos" -gt 0 ]; then
  printf '%s%d falla(s)%s y %d aviso(s). Corregí los ✗ antes de publicar.\n' \
    "$ROJO" "$fallos" "$FIN" "$avisos"
  printf 'Falta además el repaso a mano (👤 en CHECKLIST.md): consistencia\n'
  printf 'de header/footer, ODS, contraste de colores nuevos y teclado.\n'
  exit 1
elif [ "$avisos" -gt 0 ]; then
  printf '%s0 fallas, %d aviso(s).%s Mirá los ⚠ (no bloquean).\n' "$AMAR" "$avisos" "$FIN"
  printf 'Falta el repaso a mano (👤 en CHECKLIST.md; con IA, el atajo "revisar:").\n'
  exit 0
else
  printf '%sTodos los controles automáticos pasan.%s\n' "$VERDE" "$FIN"
  printf 'Falta el repaso a mano (👤 en CHECKLIST.md; con IA, el atajo "revisar:").\n'
  exit 0
fi
