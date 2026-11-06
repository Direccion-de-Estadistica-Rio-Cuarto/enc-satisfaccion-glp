# datos-fuente/ — los datos crudos van acá, y NO se suben

Esta carpeta está en `.gitignore`: nada de lo que pongas adentro (salvo este
LEEME) llega al repositorio. Es donde dejás el Excel que te mandaron, el export
del sistema, el CSV con todo.

El flujo es siempre así:

```
datos-fuente/   ← el archivo crudo, con lo que sea que tenga. NO se sube.
     ↓  lo procesás en tu máquina (a mano o con un script)
datos/          ← el resultado agregado, sin personas. Esto SÍ se publica.
```

**Nunca muevas un archivo de `datos-fuente/` a `datos/` "para probar".** Es el
camino más común a publicar un dato personal sin querer. Ver `SECURITY.md`.
