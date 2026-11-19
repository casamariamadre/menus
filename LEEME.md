# Casa María Madre – App de Menús · VERSIÓN DE PRUEBA 0.2 (modo demostración)

Versión para **enseñar a los cocineros**. Funciona solo en el dispositivo: todavía no hay hoja de Google ni puente.
Los datos de ejemplo imitan lo que llegará de la app de gestión: Emaús (20–22 nov, 42 personas, con la línea `ALERGIAS: huevo - miel, girasol - soja`), Lectura creyente (día / sala, 25 nov), Confirmación San Pedro (provisional) y dos eventos pasados ya cerrados.

**Lo pendiente y las decisiones están en `PENDIENTES.md`** (en esta carpeta y en el proyecto de Claude).

## Qué hay en esta carpeta
| Archivo | Para qué sirve |
|---|---|
| `web/` | La app. Su **contenido** (no la carpeta) es lo que va en la raíz del repositorio `menus` de GitHub. |
| `web/config.js` | Configuración: nombre, versión, `API_URL` (vacía = modo demostración) y `TELEFONO_AVISO` (teléfono de gestión para el botón «Llamar»). |
| `web/datos-demo.js` | Datos de ejemplo (con códigos fijos «d-…», iguales en todos los dispositivos). |
| `web/alergenos.js` | Los 14 alérgenos con sus iconos. |
| `web/icons/logo-casa-maria-madre.png` | Logo de la casa para el cartel de la puerta. |
| `versiones/v0.1/` | Copia de la versión anterior, por si hay que volver atrás. |
| `copias/` | Carpeta propuesta para guardar las copias de seguridad de la app. |
| `PENDIENTES.md` | Decisiones y cosas pendientes. |

## Probarla
- **En el móvil o el ordenador:** https://casamariamadre.github.io/menus/
- **Sin internet, en el ordenador:** doble clic en `web/index.html`.
- La primera vez pide un **nombre para el dispositivo** (Cocina – móvil 1…): sirve para saber de dónde viene cada cambio al fusionar.
- Cada dispositivo guarda **sus propios** datos. Para juntar lo de varios: **Más → Comparar y fusionar**.
- Los datos de la 0.1 que hubiera en un dispositivo se pasan solos al formato nuevo.

## Novedades de la 0.2
- **Panel** (inicio): lo pendiente (avisos, próximos 14 días, carteles de la semana) y estadísticas (raciones por mes, platos más servidos y olvidados, equilibrio por familias, alergias, compra propuesta frente a pedida, fusiones). Mismo estilo que el panel de la app de eventos.
- **Eventos de solo lectura** (vienen de gestión) con botón/aviso para llamar si algo está mal, aviso cuando cambian fechas, personas o estado, y archivo de **eventos pasados**: se cierran 2 días después de la salida y guardan una **foto fija** de lo servido.
- **Alergias desde observaciones**: `ALERGIAS: huevo - miel, girasol - soja` → A, B, C automáticos. Si la línea falta o está mal, aviso y se pueden apuntar a mano.
- **Dos vistas del menú**: *Por días* (Detalle / Lista) y *Por familias* (con avisos de equilibrio y repetición). Nuevo campo **familia** en los platos.
- **Cartel A4 para la puerta**: logo, día como título y debajo comida y cena; personalizable (textos, notas por servicio, nombre visible del plato, color, tamaño, leyenda) e Imprimir / Guardar PDF. Los alérgenos no se pueden tocar.
- **Compra**: paso de despensa (Hay / Poco / Comprar), presentaciones de compra (lata de 3 kg…), margen configurable, raciones especiales incluidas, líneas libres (a elección / fuera de menú), notas, marca recibida y pedido por WhatsApp agrupado por sección.
- **Copia de seguridad**, **restaurar**, **deshacer**, **exportar CSV** y **comparar y fusionar** entre dispositivos (con códigos únicos, fecha, dispositivo y borrados marcados).
- En **Más → Eventos de prueba** se puede simular la app de gestión (solo en modo demostración).

## Subir una versión nueva a GitHub
1. Entra en `github.com/casamariamadre/menus` → **Add file → Upload files**.
2. Arrastra **todo el contenido de `web/`** (archivos y la carpeta `icons`) a la raíz → **Commit changes**.
3. En 1–2 minutos estará en https://casamariamadre.github.io/menus/. En el móvil, cierra la app y vuelve a abrirla.
4. En cada cambio, sube `VERSION` en `web/sw.js` y en `web/config.js`.

## Decisiones tomadas sin consultar (revisar)
- Margen de compra general del 10 %; la merluza empanada lleva un 20 % propio (como el pedido a mano: 50 para 42).
- Los productos comerciales del ejemplo (merluza empanada, patatas prefritas, preparado de paella, lomo adobado) salen marcados «revisar etiqueta» hasta que alguien confirme sus alérgenos.
- El cartel excluye los platos no aprobados y avisa antes de imprimir.
- Al elegir la ración especial de un comensal, solo se ofrecen platos sin sus alérgenos.

Diseño completo: documento «Diseño_App_Menus_BORRADOR» en el proyecto de Claude "Menús María Madre".
