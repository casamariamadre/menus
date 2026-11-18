/*
 * CONFIGURACIÓN DE LA APP DE MENÚS – solo hay que tocar este archivo.
 *
 * API_URL: dirección del puente de Apps Script (termina en /exec).
 *          Vacía = MODO DEMOSTRACIÓN: datos de ejemplo guardados solo en este dispositivo.
 * TELEFONO_AVISO: teléfono de gestión para avisar si un dato del evento está mal
 *          (aparece el botón «Llamar a gestión»). Vacío = solo se muestra el texto.
 */
window.CONFIG = {
  API_URL: '',
  NOMBRE_CASA: 'Casa María Madre',
  NOMBRE_APP: 'Menús',
  VERSION: '0.2.0',
  TELEFONO_AVISO: ''
};
