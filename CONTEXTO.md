# Mi Día · Registro de progreso

Organizador personal 100% offline en GitHub Pages:
**https://evaps1003.github.io/Mi-dia-definitiva/**

- Repo: `github.com/evaps1003/Mi-dia-definitiva` (rama `master`)
- PWA con Service Worker (`sw.js`, versión actual `midia-v29`)
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

## Sesión: vista semanal mejorada (navegación + fechas)

- **Navegación entre semanas** en la vista Semana: barra superior con flechas `<` `>` junto al rango visible (ej. "Semana 14 – 20 de septiembre") y botón **"Esta semana"**. Permite ir a semanas futuras para consultar/crear/editar con antelación (`week-prev`/`week-next`/`go-today` sobre `selectedISO`).
- **Días con número**: cabeceras de columna en el mapa y píldoras del modo "Por Día" muestran día + número (LUN 15, MAR 16…). Badge especial (círculo lavanda) para el día de hoy **solo si está dentro de la semana mostrada**.
- **Asignación contextual**: al añadir un bloque desde un día de la vista semanal, el formulario prellena su fecha concreta (`add-block-iso`). 
  - Bloques con **fecha** (`date` ISO, campo nuevo en el modal "Fecha concreta (opcional)"): bloque puntual visible solo ese día en Hoy/Calendario/Mapa.
  - Bloques sin fecha: plantilla semanal como antes.
  - `store.blocksFor(iso)`: con `date` → igualdad exacta; sin `date` → coincidencia por día de semana.
  - En el mapa, los bloques puntuales llevan un puntito (`.pinned`) y tooltip "solo este día".
- Tareas ya eran por fecha (`dueDate`); desde el mapa/Día se añaden con el ISO del día elegido.
- SW v25→v26.

## Sesión: navegación semanal solo en Semana + fix «Esta semana»

- La navegación entre semanas (flechas `<`/`>`, rango «Semana 15 – 21 Sept» y botón **Esta semana**) queda **exclusivamente en la pantalla Semana**, en sus dos modos:
  - **Por Día**: barra `week-navbar` + píldoras `LUN 15`… con badge del día de hoy.
  - **Mapa Semanal**: cabeceras `map-dow` con día y número (`LUN 15`), columna de hoy resaltada y barra de navegación.
- **Bug corregido**: `goToday` llamaba a `S.setDay` (no existía) → «Esta semana»/«Hoy» no hacía nada. Ahora llama a `A.setDay` (`js/store.js`).
- **Hoy simplificado**: `weekPillStrip(...,{nav:false})` muestra solo las 7 píldoras del día (sin flechas ni salto), la navegación ya no está en Hoy (`js/ui.js`, `js/views/hoy.js`).
- Badge del día actual en las píldoras: número dentro de un círculo lavanda (`css/styles.css`).
- Asignación contextual confirmada: tocar un día de una semana futura abre ese día y el modal de bloque/tarea lleva la fecha exacta `YYYY-MM-DD`.
- SW v26→v27.

## Sesión: botón «Esta semana» solo en la semana actual

- En la vista Semana, el botón **Esta semana** ahora solo aparece cuando la semana visible corresponde a la de hoy (días consecutivos de navegación incluidos). Al deslizar a otra semana (futura o pasada), el botón desaparece (`js/views/semana.js` `navbarHTML`).
- SW v27→v28.

## Sesión: pulsar el título «Hoy» vuelve al día actual

- Pulsar el logo/título **Hoy** de arriba a la izquierda, estés en la vista o día que estés, cambia a la vista Hoy y resetea `selectedISO` al día de hoy (`js/app.js`, delegación de clics en `.topbar`; cursor pointer en `css/styles.css`).
- SW v28→v29.

## Recordatorio de despliegue

- Tras cada cambio: `git add -A`, `git commit`, `git push` a `master`. GitHub Pages publica en ~30–40 s.
- Probar en `http://localhost:8765/` con la app servida localmente si hace falta (servidor estático Node).
- En el móvil: recargar la página una vez para actualizar el SW.