# Seguridad — leelo una vez, son tres reglas

Un tablero es un sitio **estático**: el servidor le manda todos los archivos al
navegador de quien entra. Cualquiera puede abrir esos archivos y descargar el
JSON, el JS o el CSV **enteros**. No existe una "parte privada" del tablero.

De ahí salen las tres reglas. GitHub las revisa solo en cada cambio (verás una
tilde verde o una cruz roja), pero entenderlas es lo que evita el accidente.

---

## Regla 1 — Ninguna clave en el tablero. Nunca.

No va al repositorio, ni "un ratito para probar":

- claves de API, tokens, contraseñas
- cadenas de conexión (`postgresql://usuario:clave@servidor/base`)
- la clave `service_role` de Supabase, ni claves de Firebase, Google, etc.
- archivos `.env`, `credenciales.json`, `.pem`, `.key`

**"Pero necesito datos de una base."** Entonces la consulta se corre **antes**,
en tu computadora (con la clave en un `.env` que se queda ahí), y publicás solo
el resultado ya agregado:

```
Base de datos  →  script tuyo, en tu máquina (la clave vive acá, en .env)
               →  datos/tu-archivo   (agregado, sin personas)
               →  el tablero lo carga (fetch, <script>, lo que uses)
```

**"Es la anon key de Supabase, es pública."** Aun así, no la pongas sin
avisar al equipo: solo es segura si la base tiene las políticas (RLS) bien
puestas y expone únicamente vistas agregadas. Eso se revisa de a dos.

**Si ya subiste una clave:** dala por comprometida. Hay que **cambiarla** (no
alcanza con borrarla: queda en el historial de git) y avisar al equipo.

---

## Regla 2 — Se publica el resumen, no la fila.

No van al tablero, ni siquiera en una columna "que no se muestra":

> nombre · DNI · CUIL/CUIT · domicilio · teléfono · correo · legajo · patente ·
> expediente asociado a una persona · datos de salud, judiciales o de programas
> sociales.

Lo que sí se publica es el **dato agregado**: totales, promedios y porcentajes
por área, barrio, mes o categoría.

```
❌  una fila por expediente, con el domicilio y el titular
✅  cantidad de expedientes por barrio y por mes
```

**Cuidado con la reidentificación:** si una celda dice "Barrio X, agosto, 1 caso
de un programa social", esa persona quedó identificada aunque no figure el
nombre. Regla práctica: **si un cruce da menos de 5 casos, no se publica esa
celda** (agrupala en "otros" o ampliá el período). Un punto en un mapa **es** un
domicilio: usá polígonos por barrio, no puntos.

---

## Regla 3 — Todo desde el repo, nada desde internet.

Las librerías (como ECharts y Leaflet, en `js/vendor/`) van dentro del proyecto.
Lo mismo vale para el **mapa base**: los mosaicos de Argenmap están guardados en
`assets/mapa/` y el mapa no pide nada al servidor del IGN. No se
enlaza nada con `https://...` desde el HTML o el JS: un CDN puede caerse o
cambiar, y no controlás qué código te entrega. Todo lo que el tablero necesita
tiene que estar en `css/`, `js/` o `assets/`.

Esto vale para el **código y los recursos** (scripts, estilos, fuentes,
imágenes, mosaicos). Los **datos** son otra cosa: ver "Datos en tiempo real
desde una API" más abajo.

---

## Excepciones por datos personales

La Regla 2 es "se publica el resumen, no la fila". Si por una razón de gestión
un tablero **tiene que** mostrar datos de personas (nombres, contactos), no se
esconde: se registra como una **excepción** en `excepciones.json`, una decisión
humana, firmada y con fecha de vencimiento. Es la **única** regla que se puede
exceptuar; las demás (credenciales, código de servidor, acceso a la sesión del
portal) nunca.

Cada excepción exige, y el revisor valida:

- **`archivos`**: qué archivos de `datos/` cubre (solo esos).
- **`responsable`**: la persona que decide publicar esos datos y se hace cargo,
  con nombre y cargo.
- **`motivo`**: por qué hace falta publicar esos datos (no una frase vacía).
- **`fecha`** y **`vence`**: la excepción dura como máximo **un año**; vencida,
  deja de valer y el hallazgo vuelve a bloquear. Renovarla es una decisión nueva.
- El tablero tiene que declarar **`"sensibilidad": "confidencial"`** en
  `tablero.json`, para que el Observatorio lo restrinja con sesión y con la
  aprobación del fiscal.
- El repo tiene que ser **privado**. En un repo público el revisor no acepta la
  excepción: los datos quedarían expuestos a cualquiera.

```json
{
  "excepciones": [
    {
      "regla": "datos-personales",
      "archivos": ["datos/referentes.csv"],
      "responsable": "Nombre Apellido — Cargo",
      "motivo": "El área necesita el contacto de cada referente para coordinar visitas.",
      "fecha": "2026-10-15",
      "vence": "2027-04-15"
    }
  ]
}
```

Una excepción válida no hace desaparecer el aviso: el revisor la lista en cada
corrida como **"EXCEPCIÓN REGISTRADA"**, con responsable, motivo y vencimiento,
para que nadie la olvide.

**Quién la escribe y cómo queda registrado**
- La escribe **una persona**, nunca un agente de IA: el revisor falla si algún
  commit de `excepciones.json` está firmado por una IA (`Co-Authored-By`).
- No hay un paso de aprobación de una segunda persona: **quien firma la
  excepción es responsable de ella** y tiene claros los riesgos. Con el historial
  de git quedan la fecha y el autor del cambio: es la constancia para una
  auditoría.

**Lo que una excepción NO hace**
- No vuelve legal publicar datos personales: la ley de protección de datos
  personales y las normas del Observatorio (consentimiento, trazabilidad,
  conservación) siguen aplicando. Ante la duda, consultá antes con el fiscal o
  con legales.
- No los saca del historial de git: aunque después se borren, quedan en los
  commits anteriores. Por eso lo mejor sigue siendo no tenerlos: pseudonimizar o
  agregar los datos antes de subirlos.

---

## Dónde corre tu tablero (y por qué importa)

Los tableros se despliegan desde su repositorio como **archivos estáticos que
sirve el Observatorio**, detrás de su control de acceso. Tres consecuencias:

1. **Todo lo que está en el repo se publica.** Por eso el revisor solo admite
   HTML, CSS, JS, imágenes y datos: nada de código de servidor (`.py`, `.gs`,
   `.sql`, `.php`…), credenciales (`.env`, `.pem`, `.key`…), planillas
   (`.xlsx`) ni carpetas de dependencias (`node_modules`, `venv`).
2. **El JS del tablero corre en el mismo origen que el portal, sin sandbox**,
   con los privilegios de quien lo está mirando. Un código que toque
   `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`,
   `window.parent`/`top` o llame a `/api/` del portal podría leer la sesión de
   un administrador. Está prohibido, y el revisor lo bloquea. Tampoco `eval`,
   `new Function` ni `document.write`. Para armar HTML con datos, usá
   `createElement` + `textContent` (ver los ayudantes de `js/tablero.js`), no
   `innerHTML`.
3. **Se sirve desde una subcarpeta.** Todas las rutas son relativas
   (`css/…`, nunca `/css/…`) y cada archivo referenciado tiene que existir: un
   archivo que falta puede disparar miles de pedidos por reintento.

Además, cada tablero lleva un **`tablero.json`** (identificador, título,
descripción, fecha, temática, autoría, contacto, datasets, sensibilidad y modo
de datos): son los metadatos mínimos que exige la Ordenanza 162/2025 (Art. 13°)
y la sensibilidad decide quién puede verlo. El revisor lo valida.

---

## Datos en tiempo real desde una API

Un tablero puede traer datos de una API mientras está abierto (`fetch`,
`XMLHttpRequest`, `WebSocket`, `EventSource`). Las reglas 1 y 2 siguen
valiendo, y además:

1. **Solo `https://`.** Nunca `http://` ni `ws://` (sin cifrar). Cualquier
   API `https` sirve, mientras cumpla lo que sigue.
2. **Sin credenciales en el navegador.** Ninguna API key, token,
   `Authorization`, `Bearer` ni contraseña en el código ni en la URL: lo que
   está en el navegador lo ve cualquiera. Si la API pide clave, **no se llama
   desde el tablero**: la consulta la hace un **endpoint del backend del
   Observatorio**, que guarda la clave y devuelve solo datos agregados, y el
   tablero llama a ese endpoint. **Nunca código de servidor dentro del repo del
   tablero**: el repo se publica tal cual, y ese código quedaría a la vista. Si
   necesitás un endpoint así, pedíselo a quien administra el Observatorio.
3. **Solo lectura (`GET`).** El tablero no envía datos a ningún lado. Si hace
   falta un `POST`, se discute antes.
4. **Solo datos agregados** (Regla 2): si la API devuelve filas con personas
   (nombre, DNI, domicilio…), el tablero no puede consumirla tal cual — hay que
   resumir del lado del servidor. La regla de los 5 también aplica.
5. **Plan B visible.** Si la API cae o tarda, el tablero muestra el componente
   de error (`.error`) y la hora del **último dato bueno** en la fecha de
   actualización. Un tablero que se queda en blanco o con un número viejo sin
   decirlo es peor que uno que avisa.
6. **Decí de dónde viene:** la **Fuente** del footer nombra la API.

El revisor (`scripts/revisar-tablero.sh`) verifica lo que se puede
automatizar: bloquea `http://`/`ws://`, credenciales a la vista y recursos
externos en el HTML, y **lista a qué APIs le habla el tablero** para que se vea
en el PR.

---

## Qué revisa GitHub por vos

| Chequeo | Qué evita |
|---|---|
| **gitleaks** | Claves o tokens filtrados, también en el historial de git |
| Sin recursos de internet | Un CDN caído o alterado que rompa o comprometa el tablero |
| Datos remotos solo por `https` y sin credenciales | Una clave expuesta en el navegador, o datos que viajan sin cifrar |
| Solo archivos de tablero en el repo | Código de servidor, credenciales o datos crudos publicados por error |
| Sin código que toque la sesión o el portal | Un tablero que lea la sesión de quien lo mira |
| Sin datos personales en `datos/` (DNI, CUIT, correo, teléfono) | Publicar la fila en vez del resumen |
| Rutas relativas y archivos que existen | Pedidos desbocados por un archivo que falta |
| `tablero.json` completo | Metadatos mínimos de la Ordenanza 162/2025 |
| `excepciones.json` válida, firmada y con vencimiento | Que una violación de la Regla 2 pase sin que nadie haya decidido |
| Sin archivos de credenciales | Un `.env` o `.key` subido por error |
| Sin datos crudos ni planillas | Un Excel con personas subido sin querer |

Si algo sale en rojo, el mensaje dice qué archivo es y cómo arreglarlo. Ante la
duda, **preguntá antes de publicar**. Nadie se enoja por una pregunta; el
problema es el otro caso.
