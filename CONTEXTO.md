# Mi Día · Registro de progreso

Organizador personal 100% offline en GitHub Pages:
**https://evaps1003.github.io/Mi-dia-definitiva/**

- Repo: `github.com/evaps1003/Mi-dia-definitiva` (rama `master`)
- PWA con Service Worker (`sw.js`, versión actual `midia-v25`)
- Persistencia: IndexedDB (`midia-offline`) con tiendas `blocks`, `habits`, `habit_log`, `tasks`, `task_log`, `events`, `meta`
- Código en `js/`: `const`, `db`, `ui`, `repo`, `clock`, `store`, `add`, `app` y vistas en `js/views/` (`hoy`, `semana`, `calendario`)

## Sesión: tachado por día + calendario (recuerda: "tareas recurrentes")

- **Tachado independiente por día en tareas recurrentes** (fix del bug "se tacha en todos los días"):
  - Nuevo registro `task_log` con `{ taskId, date, completed }` (patrón igual a `habit_log`). El completado se guarda por `YYYY-MM-DD`, no como booleano global.
  - `store.taskDone(taskId, iso)` consulta el log; `tasksFor/pendingFor` filtran/ordenan por fecha.
  - Tareas sin fecha (Buzón) siguen usando el booleano `completed` de la tarea.
  - `repo.taskLog`: `all`, `upsert`, `removeForTask`, `pruneBefore`, `seedLegacy` (migra antiguas tareas ya completadas).
  - `toggleTask(id, iso, val)`: con `iso` → upsert en `task_log`; sin `iso` → booleano global.
  - `migrateOverdue` al Buzón comprueba el `task_log` por fecha, no solo `completed`.
  - `clock.run`: `seedLegacy()` + poda de `task_log` > 120 días.
  - Borrar una tarea limpia su `task_log`.

- **Selector de 3 tipos al crear en el Calendario** (sustituye el botón `+`):
  - Botones `✓ Tarea`, `🔔 Aviso`, `▦ Bloque` (acción `cal-add-*`) que abren el formulario con el día preseleccionado.
  - Antes solo se podían crear eventos desde el Calendario.
  - Las tareas creadas desde el Calendario se ven y sincronizan en Hoy y Semana de esa fecha.

- **Bloques «Mostrar también como aviso / recordatorio»**:
  - Nueva casilla en el formulario de bloque (`block-aviso`, campo `showAsAviso`).
  - Si está activa: el bloque aparece normal en el horario (con campanita 🔔 en la tarjeta), además como aviso destacado arriba del todo en **Hoy** y como píldora destacada en el panel del **Calendario** (con punto en el día del mes).

## Sesión: iconos PWA

- Iconos de instalación nuevos generados desde `logo.svg` con fondo morado `#D9CDEF`.
- Renombrados para romper caché: `icons/icon-sun-{192,512}.png`, `icons/icon-sun-maskable-512.png`, `apple-touch-icon.png` (180 px, necesario para iOS).
- `index.html` incluye el `<link rel="apple-touch-icon">` (clave en iPhone/iPad).
- SW v21→v23 por los cambios de esta sesión.

## Sesión: emoticonos personalizados de Eva

- La paleta de emojis de hábitos contiene **solo los emoticonos propios** (se quitaron los OpenMoji de la lista).
- Los iconos se colocan en `img/emoji/<CODIGO>.svg` (SVG envoltorio con el PNG redimensionado a 128 px embebido en base64).
- `Org.CUSTOM_EMOJIS` en `js/const.js` (PUA `\uE000`–`\uF8FF`); `Org.EMOJIS = Org.CUSTOM_EMOJIS`.
- Mapa: `E001` diente · `E002` cerdo · `E003` cubiertos · `E004` flor rosa · `E005` fresa · `E006` gota de agua · `E007` libro · `E008` pata blanca · `E009` sobre · `E00A` sol · `E00B` tulipán.
- Icono por defecto de hábito nuevo: la gota (`\uE006`).
- Los SVGs OpenMoji antiguos se conservan en `img/emoji/` para no romper hábitos ya creados.
- Los 11 SVGs se precachean en el SW (`ARCHIVOS`); SW v24→v25.

## Recordatorio de despliegue

- Tras cada cambio: `git add -A`, `git commit`, `git push` a `master`. GitHub Pages publica en ~30–40 s.
- Probar en `http://localhost:8765/` con la app servida localmente si hace falta (servidor estático Node).
- En el móvil: recargar la página una vez para actualizar el SW.