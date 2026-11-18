/*
 * Alérgenos: los 14 de declaración obligatoria (Reglamento UE 1169/2011)
 * con un icono sencillo propio (blanco sobre círculo de color).
 * Los "propios" (miel, girasol…) se guardan en los datos y usan el icono genérico.
 */
(function () {
  var W = 'fill="#fff"';
  var S = 'fill="none" stroke="#fff" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"';
  var ALERGENOS = [
    { id: 'gluten', nombre: 'Gluten', color: '#C8902B',
      svg: '<path ' + S + ' d="M12 21V7"/><path ' + W + ' d="M12 9c-2.4-.6-3.6-2.4-3.6-4.6 2.3.3 3.6 2 3.6 4.6zM12 9c2.4-.6 3.6-2.4 3.6-4.6-2.3.3-3.6 2-3.6 4.6zM12 14c-2.4-.6-3.6-2.4-3.6-4.6 2.3.3 3.6 2 3.6 4.6zM12 14c2.4-.6 3.6-2.4 3.6-4.6-2.3.3-3.6 2-3.6 4.6z"/>' },
    { id: 'crustaceos', nombre: 'Crustáceos', color: '#D9603F',
      svg: '<path ' + S + ' d="M18 6c-6 0-10 3.5-10 8.5 0 2.5 1.5 4.5 4 4.5M8 13h4M9 10l3 1M8.5 16.5l3-1M12 19l-2 2M12 19l1 2.4"/><circle ' + W + ' cx="17" cy="7.5" r="1.3"/>' },
    { id: 'huevo', nombre: 'Huevo', color: '#E0A417',
      svg: '<path ' + W + ' d="M12 3.5c-3.3 0-6 5-6 9.3 0 3.6 2.7 6.7 6 6.7s6-3.1 6-6.7C18 8.5 15.3 3.5 12 3.5z"/>' },
    { id: 'pescado', nombre: 'Pescado', color: '#2F6DB5',
      svg: '<path ' + W + ' d="M2.5 12c2.8-3.8 7.7-5 11.5-2.3L19 6.5v11L14 14.3C10.2 17 5.3 15.8 2.5 12z"/><circle fill="#2F6DB5" cx="7" cy="11.3" r="1"/>' },
    { id: 'cacahuete', nombre: 'Cacahuete', color: '#9C6233',
      svg: '<path ' + W + ' d="M12 3a4 4 0 0 1 3 6.6 4.2 4.2 0 0 1-3 7.6v0a4.2 4.2 0 0 1-3-7.6A4 4 0 0 1 12 3z" transform="translate(0 1.5)"/>' },
    { id: 'soja', nombre: 'Soja', color: '#5E8A2E',
      svg: '<rect ' + S + ' x="3" y="8.5" width="18" height="7" rx="3.5"/><circle ' + W + ' cx="7.5" cy="12" r="1.9"/><circle ' + W + ' cx="12" cy="12" r="1.9"/><circle ' + W + ' cx="16.5" cy="12" r="1.9"/>' },
    { id: 'lacteos', nombre: 'Lácteos', color: '#3D85C6',
      svg: '<path ' + W + ' d="M9.5 3h5v2.5l2.2 3.3V21H7.3V8.8l2.2-3.3z"/><path fill="#3D85C6" d="M8.5 12h7v5h-7z"/>' },
    { id: 'frutos_cascara', nombre: 'Frutos de cáscara', color: '#7D5228',
      svg: '<path ' + W + ' d="M5.5 10.5h13a6.5 6.5 0 0 0-13 0z"/><path ' + S + ' d="M7 11.5c0 5 2.2 8.5 5 8.5s5-3.5 5-8.5M12 2.5v1.5"/>' },
    { id: 'apio', nombre: 'Apio', color: '#4E9A3E',
      svg: '<path ' + S + ' d="M8 21v-9M12 21V8M16 21v-9"/><circle ' + W + ' cx="8" cy="9.5" r="2.3"/><circle ' + W + ' cx="12" cy="5.5" r="2.5"/><circle ' + W + ' cx="16" cy="9.5" r="2.3"/>' },
    { id: 'mostaza', nombre: 'Mostaza', color: '#B8960C',
      svg: '<path ' + W + ' d="M9 3.5h6V7H9z"/><path ' + W + ' d="M8 8h8l1 2.5V20H7v-9.5z"/>' },
    { id: 'sesamo', nombre: 'Sésamo', color: '#A27E4C',
      svg: '<ellipse ' + W + ' cx="8" cy="8" rx="1.7" ry="2.6" transform="rotate(-25 8 8)"/><ellipse ' + W + ' cx="15.5" cy="7" rx="1.7" ry="2.6" transform="rotate(20 15.5 7)"/><ellipse ' + W + ' cx="11.5" cy="13" rx="1.7" ry="2.6"/><ellipse ' + W + ' cx="7" cy="17" rx="1.7" ry="2.6" transform="rotate(30 7 17)"/><ellipse ' + W + ' cx="16.5" cy="16" rx="1.7" ry="2.6" transform="rotate(-30 16.5 16)"/>' },
    { id: 'sulfitos', nombre: 'Sulfitos', color: '#8E3B5F',
      svg: '<path ' + W + ' d="M7.5 3h9c0 5.3-2 8.5-4.5 8.5S7.5 8.3 7.5 3z"/><path ' + S + ' d="M12 11.5V19M8.5 20h7"/>' },
    { id: 'altramuces', nombre: 'Altramuces', color: '#C77A1E',
      svg: '<circle ' + W + ' cx="12" cy="6" r="2.4"/><circle ' + W + ' cx="12" cy="18" r="2.4"/><circle ' + W + ' cx="6" cy="12" r="2.4"/><circle ' + W + ' cx="18" cy="12" r="2.4"/><circle fill="none" stroke="#fff" stroke-width="1.6" cx="12" cy="12" r="2"/>' },
    { id: 'moluscos', nombre: 'Moluscos', color: '#2E8A87',
      svg: '<path ' + W + ' d="M3.5 15.5a8.5 8.5 0 0 1 17 0z"/><path stroke="#2E8A87" stroke-width="1.4" stroke-linecap="round" d="M12 15.5V8M12 15.5l-4.5-5.5M12 15.5l4.5-5.5"/><path ' + W + ' d="M9 16h6l-1 3h-4z"/>' }
  ];
  var PROPIO = { color: '#6F6560', svg: '<path fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" d="M12 6.5v7"/><circle fill="#fff" cx="12" cy="17.3" r="1.5"/>' };

  var MAPA = {};
  ALERGENOS.forEach(function (a) { MAPA[a.id] = a; });

  /** Devuelve {id, nombre, color, svg} de un alérgeno oficial o propio (id 'p:Miel'). */
  function info(id) {
    if (MAPA[id]) return MAPA[id];
    var nombre = String(id).replace(/^p:/, '');
    return { id: id, nombre: nombre, color: PROPIO.color, svg: PROPIO.svg, propio: true };
  }

  /** HTML de un icono. tam: '' | 'g' (grande) | 'p' (pequeño) */
  function icono(id, tam) {
    var a = info(id);
    return '<span class="al ' + (tam || '') + '" style="background:' + a.color + '" title="' + a.nombre + '" aria-label="' + a.nombre + '">' +
      '<svg viewBox="0 0 24 24" aria-hidden="true">' + a.svg + '</svg></span>';
  }

  window.ALERGENOS = ALERGENOS;
  window.AL = { info: info, icono: icono, lista: ALERGENOS };
})();
