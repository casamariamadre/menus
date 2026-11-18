/*
 * Casa María Madre – App de Menús (BORRADOR 0.1 · modo demostración)
 * Los datos se guardan solo en este dispositivo (localStorage).
 */
(function () {
  'use strict';

  // =====================================================================
  // DATOS
  // =====================================================================
  var CLAVE = 'mm-menus-demo-v1';
  var D = null;
  var memoria = null; // por si el navegador no deja guardar

  function cargar() {
    try {
      var t = localStorage.getItem(CLAVE);
      if (t) { D = JSON.parse(t); return; }
    } catch (e) { /* sin almacenamiento */ }
    D = memoria || window.DATOS_DEMO();
    guardar();
  }
  function guardar() {
    memoria = D;
    try { localStorage.setItem(CLAVE, JSON.stringify(D)); } catch (e) { /* sigue en memoria */ }
  }
  function restablecer() {
    D = window.DATOS_DEMO();
    guardar();
  }

  var CURSOS = [
    { id: 'primero', nombre: 'Primero' },
    { id: 'segundo', nombre: 'Segundo' },
    { id: 'postre', nombre: 'Postre' }
  ];
  var TIPOS = [
    { id: 'primero', nombre: 'Primero' },
    { id: 'segundo', nombre: 'Segundo' },
    { id: 'postre', nombre: 'Postre' },
    { id: 'otro', nombre: 'Otro' }
  ];
  var ESTADOS = {
    aprobado: { nombre: 'Aprobado', clase: '' },
    pendiente: { nombre: 'Pendiente de aprobar', clase: 'pendiente' },
    corregir: { nombre: 'Requiere corrección', clase: 'corregir' }
  };
  var UNIDADES = ['g', 'ml', 'ud.'];
  var CATEGORIAS = ['Carnes', 'Pescados', 'Huevos y lácteos', 'Verduras y frutas', 'Despensa', 'Aceites y condimentos', 'Otros'];

  // =====================================================================
  // UTILIDADES
  // =====================================================================
  function $(sel, raiz) { return (raiz || document).querySelector(sel); }
  function $$(sel, raiz) { return Array.prototype.slice.call((raiz || document).querySelectorAll(sel)); }
  function esc(v) {
    return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function nuevoId(pref) { return pref + Date.now().toString(36) + Math.floor(Math.random() * 1000).toString(36); }
  function porId(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function plato(id) { return porId(D.platos, id); }
  function ingrediente(id) { return porId(D.ingredientes, id); }
  function estancia(id) { return porId(D.estancias, id); }
  function servicio(id) { return porId(D.servicios, id); }
  function serviciosDe(eid) {
    return D.servicios.filter(function (s) { return s.estancia === eid; }).sort(ordenServ);
  }
  function ordenServ(a, b) { return a.fecha === b.fecha ? (a.turno === 'comida' ? -1 : 1) : (a.fecha < b.fecha ? -1 : 1); }

  var DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  var DIAS_C = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
  var MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  var MESES_C = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  function fechaD(t) { var p = t.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function fechaT(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
  function hoyT() { return fechaT(new Date()); }
  function sumaDias(t, n) { var d = fechaD(t); d.setDate(d.getDate() + n); return fechaT(d); }
  function difDias(a, b) { return Math.round((fechaD(b) - fechaD(a)) / 86400000); }
  function fechaLarga(t) { var d = fechaD(t); return DIAS[d.getDay()] + ' ' + d.getDate() + ' de ' + MESES[d.getMonth()]; }
  function fechaCorta(t) { var d = fechaD(t); return DIAS_C[d.getDay()] + ' ' + d.getDate() + ' ' + MESES_C[d.getMonth()]; }
  function rango(e) {
    var a = fechaD(e.entrada), b = fechaD(e.salida);
    return a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MESES_C[a.getMonth()] : '') + ' → ' + b.getDate() + ' ' + MESES_C[b.getMonth()];
  }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }
  function turnoN(t) { return t === 'comida' ? 'Comida' : 'Cena'; }
  function num(n, dec) { return n.toLocaleString('es-ES', { maximumFractionDigits: dec == null ? 1 : dec }); }

  /** Cantidad legible: g → kg, ml → l, ud. → redondeo hacia arriba. */
  function cantidad(n, unidad) {
    if (unidad === 'g') return n >= 1000 ? num(n / 1000, 1) + ' kg' : num(Math.round(n), 0) + ' g';
    if (unidad === 'ml') return n >= 1000 ? num(n / 1000, 1) + ' l' : num(Math.round(n), 0) + ' ml';
    return num(Math.ceil(n - 1e-9), 0) + ' ud.';
  }
  function cantPorPersona(n, unidad) { return num(n, 2) + ' ' + unidad; }

  // ---------- Alérgenos ----------
  function ordenAl(lista) {
    var oficiales = window.ALERGENOS.map(function (a) { return a.id; });
    return lista.slice().sort(function (a, b) {
      var ia = oficiales.indexOf(a), ib = oficiales.indexOf(b);
      if (ia < 0) ia = 100; if (ib < 0) ib = 100;
      return ia === ib ? (a < b ? -1 : 1) : ia - ib;
    });
  }
  function alergenosPlato(p) {
    var set = {};
    (p.ingredientes || []).forEach(function (x) {
      var i = ingrediente(x.ing);
      if (i) i.alergenos.forEach(function (a) { set[a] = 1; });
    });
    return ordenAl(Object.keys(set));
  }
  function iconosDe(lista, tam) {
    if (!lista.length) return '<span class="sin-al" title="Sin alérgenos">✓</span>';
    return '<span class="iconos">' + lista.map(function (a) { return AL.icono(a, tam); }).join('') + '</span>';
  }
  function iconosPlato(p, tam) { return iconosDe(alergenosPlato(p), tam); }
  function nombresAl(lista) { return lista.map(function (a) { return AL.info(a).nombre.toLowerCase(); }).join(', '); }
  function todosAlergenos() {
    return window.ALERGENOS.map(function (a) { return a.id; }).concat(D.propios || []);
  }

  // ---------- Cálculos ----------
  function platosServicio(s) {
    var r = [];
    CURSOS.forEach(function (c) { (s.platos[c.id] || []).forEach(function (id) { r.push({ curso: c.id, id: id }); }); });
    return r;
  }
  function racionesGrupo(s) {
    var e = estancia(s.estancia);
    return Math.max(0, (e ? e.personas : 0) - s.especiales.length);
  }
  function servicioVacio(s) { return platosServicio(s).length === 0; }

  /** Texto de la última vez que se sirvió un plato antes de (o en) una fecha de referencia. */
  function ultimaVez(pid, ref, excluir) {
    ref = ref || hoyT();
    var mejor = null;
    D.servicios.forEach(function (s) {
      if (s.id === excluir || s.fecha > ref) return;
      var esta = platosServicio(s).some(function (x) { return x.id === pid; }) ||
        s.especiales.some(function (es) { return (es.platos || []).indexOf(pid) >= 0; });
      if (!esta) return;
      if (!mejor || s.fecha > mejor.fecha || (s.fecha === mejor.fecha && s.turno === 'cena')) mejor = s;
    });
    if (!mejor) return { txt: 'Nunca servido', dias: null };
    var d = difDias(mejor.fecha, ref);
    var t;
    if (d === 0) t = 'el mismo día (' + mejor.turno + ')';
    else if (d === 1) t = 'el día anterior (' + mejor.turno + ')';
    else if (d < 14) t = 'hace ' + d + ' días';
    else if (d < 60) t = 'hace ' + Math.round(d / 7) + ' semanas';
    else t = 'hace ' + Math.round(d / 30) + ' meses';
    return { txt: 'Última vez: ' + t, dias: d };
  }

  /** Lista de la compra de una estancia: { ingId: total } */
  function calcularCompra(eid) {
    var tot = {};
    function suma(pid, n) {
      var p = plato(pid); if (!p) return;
      p.ingredientes.forEach(function (x) { tot[x.ing] = (tot[x.ing] || 0) + x.cant * n; });
    }
    serviciosDe(eid).forEach(function (s) {
      var n = racionesGrupo(s);
      platosServicio(s).forEach(function (x) { suma(x.id, n); });
      s.especiales.forEach(function (es) { (es.platos || []).forEach(function (pid) { suma(pid, 1); }); });
    });
    return tot;
  }

  function usosPlato(pid) {
    return D.servicios.filter(function (s) {
      return platosServicio(s).some(function (x) { return x.id === pid; }) ||
        s.especiales.some(function (es) { return (es.platos || []).indexOf(pid) >= 0; });
    }).length;
  }
  function usosIngrediente(iid) {
    return D.platos.filter(function (p) { return p.ingredientes.some(function (x) { return x.ing === iid; }); }).length;
  }

  // =====================================================================
  // INTERFAZ BÁSICA
  // =====================================================================
  var SVG = {
    atras: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    izq: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    der: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    lapiz: '<svg viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4z"/></svg>'
  };
  var estado = { vistaEst: 'lista', mesCal: null, diaSel: null, filtroPlatos: 'todos', sinAl: '', buscaPlatos: '', verPasadas: false };

  function titulo(vista, atras) {
    $('#tituloVista').textContent = vista;
    var b = $('#btnAtras');
    if (atras) { b.hidden = false; b.onclick = function () { ir(atras); }; } else b.hidden = true;
    document.title = vista + ' · Menús María Madre';
  }
  function marcarMenu(nombre) {
    $$('#menu button').forEach(function (b) { b.classList.toggle('activo', b.dataset.ir === nombre); });
  }
  function pintar(html) { var v = $('#vista'); v.innerHTML = html; window.scrollTo(0, 0); }
  function ir(ruta) { if (location.hash === '#' + ruta) render(); else location.hash = ruta; }
  function toast(msg) {
    var t = $('#toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function modal(tituloM, cuerpo) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal-caja" role="dialog" aria-modal="true"><h2><span>' + esc(tituloM) + '</span>' +
      '<button class="quitar" aria-label="Cerrar" onclick="A.cerrar()">' + SVG.x + '</button></h2>' + cuerpo + '</div>';
    m.hidden = false;
    m.onclick = function (ev) { if (ev.target === m) cerrar(); };
    var f = $('input, textarea', m); if (f && f.type !== 'checkbox') setTimeout(function () { f.focus(); }, 50);
  }
  function cerrar() { $('#modal').hidden = true; $('#modal').innerHTML = ''; }
  function pedirTexto(tituloM, etiqueta, valor, fn, alCancelar) {
    modal(tituloM, '<label class="campo"><span>' + esc(etiqueta) + '</span><input class="entrada" id="ptTxt" value="' + esc(valor || '') + '"></label>' +
      '<p class="error-txt" id="ptErr" hidden></p><div class="fila-btns"><button class="btn borde" id="ptNo">Cancelar</button><button class="btn" id="ptOk">Aceptar</button></div>');
    $('#ptNo').onclick = function () { cerrar(); if (alCancelar) alCancelar(); };
    $('#ptOk').onclick = function () {
      var v = $('#ptTxt').value.trim();
      if (!v) { var x = $('#ptErr'); x.textContent = 'Escribe algo.'; x.hidden = false; return; }
      cerrar(); fn(v);
    };
    $('#ptTxt').onkeydown = function (ev) { if (ev.key === 'Enter') $('#ptOk').click(); };
  }
  function confirmar(texto, siTxt, fn, peligro) {
    modal('¿Seguro?', '<p>' + esc(texto) + '</p><div class="fila-btns"><button class="btn borde" onclick="A.cerrar()">Cancelar</button>' +
      '<button class="btn ' + (peligro ? 'peligro' : '') + '" id="btnSi">' + esc(siTxt) + '</button></div>');
    $('#btnSi').onclick = function () { cerrar(); fn(); };
  }

  // =====================================================================
  // RUTAS
  // =====================================================================
  function render() {
    cerrar();
    var h = (location.hash || '#/estancias').slice(2).split('/');
    var r = h[0], a = h[1], b = h[2];
    try {
      switch (r) {
        case 'estancias': marcarMenu('estancias'); vEstancias(); break;
        case 'estancia': marcarMenu('estancias'); vEstancia(a); break;
        case 'estancia-editar': marcarMenu('estancias'); vEstanciaForm(a); break;
        case 'servicio': marcarMenu('estancias'); vServicio(a); break;
        case 'elegir': marcarMenu('estancias'); vElegir(a, b); break;
        case 'comedor': marcarMenu('estancias'); vComedor(a); break;
        case 'platos': marcarMenu('platos'); vPlatos(); break;
        case 'plato': marcarMenu('platos'); vPlato(a); break;
        case 'plato-editar': marcarMenu('platos'); vPlatoForm(a); break;
        case 'compras': marcarMenu('compras'); a ? vCompra(a) : vCompras(); break;
        case 'ingredientes': marcarMenu('compras'); vIngredientes(); break;
        case 'ingrediente': marcarMenu('compras'); vIngredienteForm(a); break;
        case 'mas': marcarMenu('mas'); vMas(); break;
        case 'menus': marcarMenu('mas'); vMenus(); break;
        case 'sugerencias': marcarMenu('mas'); vSugerencias(); break;
        case 'ayuda': marcarMenu('mas'); vAyuda(); break;
        default: ir('/estancias');
      }
    } catch (err) {
      console.error(err);
      pintar('<div class="tarjeta"><b>Algo ha fallado en esta pantalla.</b><p class="sub">' + esc(err.message) +
        '</p><p class="sub">Anótalo en Más → Sugerencia o fallo.</p><button class="btn" onclick="A.ir(\'/estancias\')">Volver al inicio</button></div>');
    }
  }

  // =====================================================================
  // ESTANCIAS
  // =====================================================================
  function avisos() {
    var hoy = hoyT(), items = [];
    var pend = D.platos.filter(function (p) { return p.estado === 'pendiente'; }).length;
    var corr = D.platos.filter(function (p) { return p.estado === 'corregir'; }).length;
    if (pend) items.push({ txt: pend + (pend === 1 ? ' plato pendiente' : ' platos pendientes') + ' de aprobar', acc: "A.filtrarPlatos('pendiente')" });
    if (corr) items.push({ txt: corr + (corr === 1 ? ' plato requiere' : ' platos requieren') + ' corrección', acc: "A.filtrarPlatos('corregir')" });
    D.servicios.forEach(function (s) {
      if (s.fecha < hoy) return;
      var sin = s.especiales.filter(function (es) { return !(es.platos || []).length; });
      if (sin.length) {
        var e = estancia(s.estancia);
        items.push({ txt: 'Ración especial sin plato: ' + (e ? e.grupo : '') + ', ' + fechaCorta(s.fecha) + ' (' + s.turno + ')', acc: "A.ir('/servicio/" + s.id + "')" });
      }
    });
    D.estancias.forEach(function (e) {
      if (e.salida < hoy) return;
      var vac = serviciosDe(e.id).filter(servicioVacio).length;
      if (vac && difDias(hoy, e.entrada) <= 14) items.push({ txt: e.grupo + ': ' + vac + (vac === 1 ? ' servicio sin menú' : ' servicios sin menú'), acc: "A.ir('/estancia/" + e.id + "')" });
    });
    if (!items.length) return '';
    return '<div class="avisos">' + items.map(function (i) {
      return '<button onclick="' + i.acc + '">⚠︎ <span>' + esc(i.txt) + '</span></button>';
    }).join('') + '</div>';
  }

  function tarjetaEstancia(e) {
    var d = fechaD(e.entrada);
    var servs = serviciosDe(e.id);
    var vac = servs.filter(servicioVacio).length;
    var pasada = e.salida < hoyT();
    return '<button class="reserva' + (pasada ? ' pasada' : '') + '" onclick="A.ir(\'/estancia/' + e.id + '\')">' +
      '<div class="fecha"><span class="d">' + d.getDate() + '</span><span class="m">' + MESES_C[d.getMonth()] + '</span></div>' +
      '<div class="info"><b>' + esc(e.grupo) + '</b><div class="sub">' + rango(e) + ' · ' + e.personas + ' personas</div>' +
      '<div class="sub">' + servs.length + ' servicios' + (e.comensales.length ? ' · ' + e.comensales.length + ' con alergias' : '') +
      (vac ? ' · <span style="color:#8A5A10;font-weight:600">' + vac + ' sin menú</span>' : '') + '</div></div></button>';
  }

  function vEstancias() {
    titulo('Estancias');
    var hoy = hoyT();
    var seg = '<div class="segmento"><button class="' + (estado.vistaEst === 'lista' ? 'activo' : '') + '" onclick="A.vistaEst(\'lista\')">Lista</button>' +
      '<button class="' + (estado.vistaEst === 'cal' ? 'activo' : '') + '" onclick="A.vistaEst(\'cal\')">Calendario</button></div>';
    if (estado.vistaEst === 'cal') { pintar(seg + calendario()); return; }
    var ord = D.estancias.slice().sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; });
    var prox = ord.filter(function (e) { return e.salida >= hoy; });
    var pas = ord.filter(function (e) { return e.salida < hoy; }).reverse();
    var html = seg + avisos();
    html += '<h3>Próximas</h3>' + (prox.length ? prox.map(tarjetaEstancia).join('') :
      '<div class="vacio">No hay estancias próximas.<br><button class="btn sec" style="margin-top:10px" onclick="A.ir(\'/estancia-editar/nueva\')">Crear estancia</button></div>');
    if (pas.length) {
      html += '<h3>Anteriores</h3>';
      html += estado.verPasadas ? pas.map(tarjetaEstancia).join('') :
        '<button class="enlace" onclick="A.verPasadas()">Ver ' + pas.length + (pas.length === 1 ? ' estancia anterior' : ' estancias anteriores') + '</button>';
    }
    pintar(html);
  }

  function calendario() {
    var hoy = hoyT();
    if (!estado.mesCal) {
      var prox = D.estancias.filter(function (e) { return e.salida >= hoy; }).sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; })[0];
      var ref = prox ? prox.entrada : hoy;
      estado.mesCal = ref.slice(0, 7) + '-01';
      estado.diaSel = estado.diaSel || (prox && prox.entrada > hoy ? prox.entrada : hoy);
    }
    var m = fechaD(estado.mesCal);
    var primero = new Date(m.getFullYear(), m.getMonth(), 1);
    var desfase = (primero.getDay() + 6) % 7;
    var inicio = new Date(primero); inicio.setDate(1 - desfase);
    var porDia = {};
    D.servicios.forEach(function (s) { (porDia[s.fecha] = porDia[s.fecha] || []).push(s); });
    var celdas = '';
    for (var i = 0; i < 42; i++) {
      var d = new Date(inicio); d.setDate(inicio.getDate() + i);
      var t = fechaT(d);
      var servs = porDia[t] || [];
      var cls = 'dia' + (d.getMonth() !== m.getMonth() ? ' fuera' : '') + (servs.length ? ' ocupado' : '') + (t === hoy ? ' hoy' : '') + (t === estado.diaSel ? ' sel' : '');
      celdas += '<button class="' + cls + '" onclick="A.diaSel(\'' + t + '\')"><span class="n">' + d.getDate() + '</span>' +
        (servs.length ? '<span class="r">' + servs.length + (servs.length === 1 ? ' serv.' : ' serv.') + '</span>' : '') + '</button>';
      if (i === 34 && d.getMonth() !== m.getMonth()) break;
    }
    var html = '<div class="tarjeta"><div class="mes-cab"><button class="icono" aria-label="Mes anterior" onclick="A.mes(-1)">' + SVG.izq + '</button>' +
      '<h2>' + cap(MESES[m.getMonth()]) + ' ' + m.getFullYear() + '</h2><button class="icono" aria-label="Mes siguiente" onclick="A.mes(1)">' + SVG.der + '</button></div>' +
      '<div class="dias-sem"><div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div></div><div class="rejilla">' + celdas + '</div></div>';
    html += diaDetalle(estado.diaSel);
    return html;
  }

  function diaDetalle(t) {
    if (!t) return '';
    var servs = D.servicios.filter(function (s) { return s.fecha === t; });
    var html = '<h3>' + cap(fechaLarga(t)) + '</h3>';
    if (!servs.length) return html + '<div class="vacio">No hay servicios este día.</div>';
    ['comida', 'cena'].forEach(function (turno) {
      var ss = servs.filter(function (s) { return s.turno === turno; });
      if (!ss.length) return;
      var total = 0;
      var cuerpo = ss.map(function (s) {
        var e = estancia(s.estancia), n = racionesGrupo(s);
        total += e.personas;
        var filas = platosServicio(s).map(function (x) {
          var p = plato(x.id);
          return '<div class="fila"><span class="izq">' + esc(p ? p.nombre : '¿?') + ' ' + (p ? iconosPlato(p, 'p') : '') + '</span><span class="der">' + n + '</span></div>';
        }).join('');
        if (!filas) filas = '<div class="fila"><span class="izq sub">Sin menú asignado</span></div>';
        if (s.especiales.length) filas += '<div class="fila especial"><span class="izq">Raciones especiales (' + s.especiales.map(function (x) { return x.comensal; }).join(', ') + ')</span><span class="der">' + s.especiales.length + '</span></div>';
        return '<div class="fila toca" onclick="A.ir(\'/servicio/' + s.id + '\')" style="border:0;padding-bottom:2px"><b class="izq">' + esc(e.grupo) + ' · ' + e.personas + ' pers.</b>' +
          (s.modalidad ? '<span class="etiqueta modalidad">' + esc(s.modalidad) + '</span>' : '') + '</div>' + filas;
      }).join('<div style="height:8px"></div>');
      html += '<div class="tarjeta fina"><div class="servicio-cab"><b>' + turnoN(turno) + '</b>' +
        (ss.length > 1 ? '<span class="sub">Total: ' + total + ' raciones</span>' : '') + '</div>' + cuerpo + '</div>';
    });
    return html;
  }

  function vEstancia(id) {
    var e = estancia(id);
    if (!e) { ir('/estancias'); return; }
    titulo(e.grupo, '/estancias');
    var html = '<div class="tarjeta"><div class="servicio-cab"><b>' + esc(e.grupo) + '</b><button class="btn mini sec" onclick="A.ir(\'/estancia-editar/' + e.id + '\')">Editar</button></div>' +
      '<div class="sub">' + cap(fechaLarga(e.entrada)) + ' → ' + fechaLarga(e.salida) + '</div>' +
      '<div class="sub"><b style="color:var(--texto)">' + e.personas + ' personas</b>' + (e.obs ? ' · ' + esc(e.obs) : '') + '</div></div>';

    html += '<h3>Comensales con alergias (anónimos)</h3><div class="tarjeta fina">';
    html += e.comensales.length ? e.comensales.map(function (c, i) {
      return '<div class="fila toca" onclick="A.editarComensal(\'' + e.id + '\',' + i + ')"><span class="izq"><b>' + esc(c.cod) + '</b> · ' + esc(nombresAl(c.alergias) || 'sin indicar') + '</span><span>' + iconosDe(c.alergias, 'p') + '</span></div>';
    }).join('') : '<p class="sub" style="margin:6px 0">Nadie con alergias en este grupo.</p>';
    html += '<button class="enlace" onclick="A.editarComensal(\'' + e.id + '\',-1)">+ Añadir comensal con alergias</button></div>';

    html += '<h3>Comidas y cenas</h3>';
    var servs = serviciosDe(e.id);
    if (!servs.length) html += '<div class="vacio">Sin servicios.</div>';
    servs.forEach(function (s) {
      var n = racionesGrupo(s);
      var filas = platosServicio(s).map(function (x) {
        var p = plato(x.id);
        return '<div class="fila"><span class="izq">' + esc(p ? p.nombre : '¿?') + ' ' + (p ? iconosPlato(p, 'p') : '') + '</span><span class="der">' + n + '</span></div>';
      }).join('');
      if (!filas) filas = '<div class="fila"><span class="izq" style="color:#8A5A10;font-weight:600">Sin menú · toca para asignar</span></div>';
      s.especiales.forEach(function (es) {
        var ps = (es.platos || []).map(function (pid) { var p = plato(pid); return p ? p.nombre : '¿?'; });
        filas += '<div class="fila especial"><span class="izq">' + esc(es.comensal) + ' → ' + esc(ps.length ? ps.join(', ') : 'sin asignar') + '</span><span class="der">1</span></div>';
      });
      html += '<div class="tarjeta fina toca" onclick="A.ir(\'/servicio/' + s.id + '\')" style="cursor:pointer"><div class="servicio-cab"><b>' + cap(fechaCorta(s.fecha)) + ' · ' + turnoN(s.turno) + '</b>' +
        (s.modalidad ? '<span class="etiqueta modalidad">' + esc(s.modalidad) + '</span>' : '') + '</div>' + filas + '</div>';
    });
    html += '<button class="enlace" onclick="A.nuevoServicio(\'' + e.id + '\')">+ Añadir comida o cena</button>';
    html += '<div class="fila-btns"><button class="btn sec" onclick="A.ir(\'/comedor/' + e.id + '\')">Hoja del comedor</button>' +
      '<button class="btn sec" onclick="A.ir(\'/compras/' + e.id + '\')">Lista de la compra</button></div>';
    html += '<div class="fila-btns"><button class="btn peligro" onclick="A.borrarEstancia(\'' + e.id + '\')">Eliminar estancia</button></div>';
    pintar(html);
  }

  function vEstanciaForm(id) {
    var e = id === 'nueva' ? null : estancia(id);
    titulo(e ? 'Editar estancia' : 'Nueva estancia', e ? '/estancia/' + e.id : '/estancias');
    var hoy = hoyT();
    var html = '<div class="tarjeta">' +
      '<label class="campo"><span>Grupo</span><input class="entrada" id="fGrupo" value="' + esc(e ? e.grupo : '') + '" placeholder="Emaús"></label>' +
      '<div class="dos"><label class="campo"><span>Entrada</span><input class="entrada" type="date" id="fEntrada" value="' + (e ? e.entrada : hoy) + '"></label>' +
      '<label class="campo"><span>Salida</span><input class="entrada" type="date" id="fSalida" value="' + (e ? e.salida : sumaDias(hoy, 2)) + '"></label></div>' +
      '<label class="campo"><span>Personas</span><input class="entrada" type="number" min="1" inputmode="numeric" id="fPersonas" value="' + (e ? e.personas : '') + '" placeholder="42"></label>' +
      '<label class="campo"><span>Observaciones</span><textarea class="entrada" id="fObs">' + esc(e ? e.obs : '') + '</textarea></label>' +
      (e ? '' : '<label style="display:flex;gap:10px;align-items:center;margin-bottom:6px"><input type="checkbox" id="fAuto" checked style="width:20px;height:20px"> <span>Crear las comidas y cenas automáticamente<br><span class="sub">Cena el primer día, comida y cena los intermedios, comida el último.</span></span></label>') +
      '<p class="error-txt" id="fError" hidden></p></div>' +
      '<button class="btn ancho" onclick="A.guardarEstancia(\'' + (e ? e.id : '') + '\')">Guardar</button>';
    pintar(html);
  }

  function guardarEstancia(id) {
    var g = $('#fGrupo').value.trim(), en = $('#fEntrada').value, sa = $('#fSalida').value, pe = parseInt($('#fPersonas').value, 10);
    var err = !g ? 'Escribe el nombre del grupo.' : (!en || !sa) ? 'Indica las fechas.' : sa < en ? 'La salida no puede ser antes de la entrada.' : !(pe > 0) ? 'Indica el número de personas.' : '';
    if (err) { var x = $('#fError'); x.textContent = err; x.hidden = false; return; }
    var e = id ? estancia(id) : null;
    if (e) {
      e.grupo = g; e.entrada = en; e.salida = sa; e.personas = pe; e.obs = $('#fObs').value.trim();
      var fuera = serviciosDe(e.id).filter(function (s) { return s.fecha < en || s.fecha > sa; }).length;
      guardar(); toast(fuera ? 'Guardado. Ojo: ' + fuera + ' servicios quedan fuera de las fechas.' : 'Guardado');
    } else {
      e = { id: nuevoId('e'), grupo: g, entrada: en, salida: sa, personas: pe, obs: $('#fObs').value.trim(), comensales: [] };
      D.estancias.push(e);
      if ($('#fAuto').checked) {
        var dias = difDias(en, sa);
        for (var i = 0; i <= dias; i++) {
          var f = sumaDias(en, i);
          if (dias === 0) { crearServicio(e.id, f, 'comida'); continue; }
          if (i > 0) crearServicio(e.id, f, 'comida');
          if (i < dias) crearServicio(e.id, f, 'cena');
        }
      }
      guardar(); toast('Estancia creada');
    }
    ir('/estancia/' + e.id);
  }
  function crearServicio(eid, fecha, turno) {
    var s = { id: nuevoId('s'), estancia: eid, fecha: fecha, turno: turno, modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [] };
    D.servicios.push(s); return s;
  }

  function nuevoServicio(eid) {
    var e = estancia(eid), ops = '';
    for (var i = 0; i <= difDias(e.entrada, e.salida); i++) {
      var f = sumaDias(e.entrada, i);
      ops += '<option value="' + f + '">' + cap(fechaCorta(f)) + '</option>';
    }
    modal('Añadir comida o cena',
      '<label class="campo"><span>Día</span><select class="entrada" id="nsFecha">' + ops + '</select></label>' +
      '<label class="campo"><span>Servicio</span><select class="entrada" id="nsTurno"><option value="comida">Comida</option><option value="cena">Cena</option></select></label>' +
      '<p class="error-txt" id="nsError" hidden></p><button class="btn ancho" id="nsOk">Añadir</button>');
    $('#nsOk').onclick = function () {
      var f = $('#nsFecha').value, t = $('#nsTurno').value;
      if (D.servicios.some(function (s) { return s.estancia === eid && s.fecha === f && s.turno === t; })) {
        var x = $('#nsError'); x.textContent = 'Ese servicio ya existe.'; x.hidden = false; return;
      }
      var s = crearServicio(eid, f, t); guardar(); cerrar(); ir('/servicio/' + s.id);
    };
  }

  function editarComensal(eid, i) {
    var e = estancia(eid), c = i >= 0 ? e.comensales[i] : null;
    var sel = c ? c.alergias.slice() : [];
    var cod = c ? c.cod : String.fromCharCode(65 + e.comensales.length);
    function cuerpo() {
      return '<label class="campo"><span>Código (anónimo)</span><input class="entrada" id="cCod" value="' + esc(cod) + '" maxlength="6"></label>' +
        '<label class="campo"><span>Alergias o intolerancias</span></label>' + selectorAl(sel, 'A.togAlCom') +
        '<button class="enlace" onclick="A.nuevoPropio(\'com\')">+ Otra alergia que no está en la lista</button>' +
        '<p class="error-txt" id="cError" hidden></p>' +
        '<div class="fila-btns">' + (c ? '<button class="btn peligro" id="cBorrar">Quitar</button>' : '') + '<button class="btn" id="cOk">Guardar</button></div>';
    }
    A._com = { sel: sel, guardaCod: function () { var x = $('#cCod'); if (x) cod = x.value; },
      repintar: function () { modal(c ? 'Comensal ' + c.cod : 'Nuevo comensal', cuerpo()); enlazar(); } };
    function enlazar() {
      $('#cOk').onclick = function () {
        var v = $('#cCod').value.trim().toUpperCase();
        var x = $('#cError');
        if (!v) { x.textContent = 'Pon un código (A, B, C…).'; x.hidden = false; return; }
        if (e.comensales.some(function (o, j) { return j !== i && o.cod === v; })) { x.textContent = 'Ese código ya existe en el grupo.'; x.hidden = false; return; }
        if (!sel.length) { x.textContent = 'Marca al menos una alergia.'; x.hidden = false; return; }
        if (c) {
          D.servicios.forEach(function (s) { if (s.estancia === eid) s.especiales.forEach(function (es) { if (es.comensal === c.cod) es.comensal = v; }); });
          c.cod = v; c.alergias = ordenAl(sel);
        } else e.comensales.push({ cod: v, alergias: ordenAl(sel) });
        guardar(); cerrar(); render();
      };
      if (c) $('#cBorrar').onclick = function () {
        e.comensales.splice(i, 1);
        D.servicios.forEach(function (s) { if (s.estancia === eid) s.especiales = s.especiales.filter(function (es) { return es.comensal !== c.cod; }); });
        guardar(); cerrar(); render(); toast('Comensal quitado');
      };
    }
    modal(c ? 'Comensal ' + c.cod : 'Nuevo comensal', cuerpo()); enlazar();
  }

  function selectorAl(sel, fn) {
    return '<div class="sel-al">' + todosAlergenos().map(function (a) {
      return '<button type="button" class="' + (sel.indexOf(a) >= 0 ? 'activo' : '') + '" onclick="' + fn + '(\'' + esc(a) + '\', this)">' + AL.icono(a) + '<span>' + esc(AL.info(a).nombre) + '</span></button>';
    }).join('') + '</div>';
  }
  function togSel(lista, a, btn) {
    var i = lista.indexOf(a);
    if (i >= 0) lista.splice(i, 1); else lista.push(a);
    btn.classList.toggle('activo', i < 0);
  }
  function nuevoPropio(origen) {
    if (origen === 'com') A._com.guardaCod();
    var volver = origen === 'com' ? function () { A._com.repintar(); } : null;
    pedirTexto('Otra alergia o intolerancia', 'Nombre (por ejemplo, Kiwi)', '', function (nombre) {
      var id = 'p:' + cap(nombre);
      if (D.propios.indexOf(id) < 0) D.propios.push(id);
      guardar();
      if (origen === 'com') { if (A._com.sel.indexOf(id) < 0) A._com.sel.push(id); A._com.repintar(); }
      else { if (A._ing.sel.indexOf(id) < 0) A._ing.sel.push(id); A._ing.repintar(); }
    }, volver);
  }

  function borrarEstancia(id) {
    var e = estancia(id);
    confirmar('Se eliminará la estancia "' + e.grupo + '" con sus menús y su lista de la compra.', 'Eliminar', function () {
      D.estancias = D.estancias.filter(function (x) { return x.id !== id; });
      D.servicios = D.servicios.filter(function (s) { return s.estancia !== id; });
      delete D.compras[id];
      guardar(); toast('Estancia eliminada'); ir('/estancias');
    }, true);
  }

  // =====================================================================
  // SERVICIO (asignar menú)
  // =====================================================================
  function vServicio(id) {
    var s = servicio(id);
    if (!s) { ir('/estancias'); return; }
    var e = estancia(s.estancia);
    titulo(cap(fechaCorta(s.fecha)) + ' · ' + turnoN(s.turno), '/estancia/' + e.id);
    var n = racionesGrupo(s);
    var mods = D.modalidades.slice();
    if (s.modalidad && mods.indexOf(s.modalidad) < 0) mods.push(s.modalidad);
    var html = '<div class="sub" style="margin-bottom:10px">' + esc(e.grupo) + ' · ' + e.personas + ' personas</div>';
    html += '<div class="tarjeta"><h2>Modalidad del grupo</h2><div class="chips">' + mods.map(function (m) {
      return '<button class="chip' + (s.modalidad === m ? ' activo' : '') + '" onclick="A.modalidad(\'' + s.id + '\',\'' + esc(m).replace(/&#39;/g, "\\'") + '\')">' + esc(m) + '</button>';
    }).join('') + '<button class="chip" onclick="A.otraModalidad(\'' + s.id + '\')">+ Otra</button></div></div>';

    if (D.menus.length) {
      html += '<div class="tarjeta fina"><div class="sub" style="margin-bottom:6px">Atajo: usar un menú guardado</div><div class="chips">' +
        D.menus.map(function (m) { return '<button class="chip" onclick="A.aplicarMenu(\'' + s.id + '\',\'' + m.id + '\')">' + esc(m.nombre) + '</button>'; }).join('') + '</div></div>';
    }

    html += '<h3>Platos · ' + n + ' raciones</h3><div class="tarjeta fina">';
    CURSOS.forEach(function (c) {
      var lista = s.platos[c.id] || [];
      lista.forEach(function (pid, i) {
        var p = plato(pid);
        html += '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br>' + esc(p ? p.nombre : '¿?') + ' ' + (p ? iconosPlato(p, 'p') : '') + '</span>' +
          '<button class="quitar" aria-label="Quitar" onclick="A.quitarPlato(\'' + s.id + '\',\'' + c.id + '\',' + i + ')">' + SVG.x + '</button></div>';
      });
      html += '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br><button class="enlace" style="padding:2px 0" onclick="A.ir(\'/elegir/' + s.id + '/' + c.id + '\')">+ Elegir ' + c.nombre.toLowerCase() + (lista.length ? ' (otro)' : '') + '</button></span></div>';
    });
    html += '</div>';

    html += '<h3>Alergias del grupo</h3><div class="tarjeta fina">';
    if (!e.comensales.length) html += '<p class="sub" style="margin:6px 0">Nadie con alergias en este grupo.</p>';
    e.comensales.forEach(function (c) {
      html += '<div class="fila"><span class="izq"><b>' + esc(c.cod) + '</b> · ' + esc(nombresAl(c.alergias)) + '</span>' + iconosDe(c.alergias, 'p') + '</div>';
    });
    if (s.especiales.length) {
      html += '<div class="sub" style="margin-top:10px;font-weight:600">Raciones especiales en este servicio</div>';
      s.especiales.forEach(function (es, i) {
        var ps = (es.platos || []).map(function (pid) { var p = plato(pid); return p ? esc(p.nombre) + ' ' + iconosPlato(p, 'p') : '¿?'; });
        html += '<div class="fila especial"><span class="izq"><b>' + esc(es.comensal) + '</b> → ' + (ps.length ? ps.join(' · ') : '<i>sin plato</i>') +
          '<br><button class="enlace" style="padding:2px 0" onclick="A.ir(\'/elegir/' + s.id + '/esp-' + encodeURIComponent(es.comensal) + '\')">+ Añadir plato</button>' +
          (ps.length ? ' <button class="enlace" style="padding:2px 0;margin-left:10px;color:var(--texto-2)" onclick="A.vaciarEsp(\'' + s.id + '\',' + i + ')">Vaciar</button>' : '') + '</span>' +
          '<button class="quitar" aria-label="Quitar ración especial" onclick="A.quitarEsp(\'' + s.id + '\',' + i + ')">' + SVG.x + '</button></div>';
      });
    }
    var libres = e.comensales.filter(function (c) { return !s.especiales.some(function (es) { return es.comensal === c.cod; }); });
    if (libres.length) html += '<button class="enlace" onclick="A.nuevaEsp(\'' + s.id + '\')">+ Ración especial</button>';
    html += '<p class="sub peq" style="margin:6px 0 0">Si un comensal puede comer el menú del grupo, no hagas nada.</p></div>';

    html += '<div class="tarjeta fina"><div class="fila"><span class="izq">Menú del grupo</span><span class="der">' + n + '</span></div>' +
      '<div class="fila especial"><span class="izq">Raciones especiales</span><span class="der">' + s.especiales.length + '</span></div>' +
      '<div class="fila"><b class="izq">Total</b><b class="der">' + e.personas + '</b></div></div>';

    html += '<button class="btn ancho" onclick="A.ir(\'/estancia/' + e.id + '\')">Listo</button>' +
      '<div class="fila-btns"><button class="btn sec" onclick="A.guardarMenu(\'' + s.id + '\')">Guardar como menú</button>' +
      '<button class="btn peligro" onclick="A.borrarServicio(\'' + s.id + '\')">Eliminar servicio</button></div>' +
      '<p class="sub peq" style="text-align:center">Los cambios se guardan solos.</p>';
    pintar(html);
  }

  function nuevaEsp(sid) {
    var s = servicio(sid), e = estancia(s.estancia);
    var libres = e.comensales.filter(function (c) { return !s.especiales.some(function (es) { return es.comensal === c.cod; }); });
    modal('Ración especial', '<p class="sub">¿Para quién?</p>' + libres.map(function (c) {
      return '<button class="reserva" onclick="A.crearEsp(\'' + sid + '\',\'' + esc(c.cod) + '\')"><div class="info"><b>' + esc(c.cod) + '</b><div class="sub">' + esc(nombresAl(c.alergias)) + ' ' + iconosDe(c.alergias, 'p') + '</div></div></button>';
    }).join(''));
  }
  function crearEsp(sid, cod) {
    var s = servicio(sid);
    s.especiales.push({ comensal: cod, platos: [] });
    guardar(); cerrar(); ir('/elegir/' + sid + '/esp-' + encodeURIComponent(cod));
  }

  // ---------- Elegir plato ----------
  var filtroElegir = { tipo: null, txt: '' };
  function vElegir(sid, destino) {
    var s = servicio(sid);
    if (!s) { ir('/estancias'); return; }
    var esEsp = destino.indexOf('esp-') === 0;
    var cod = esEsp ? decodeURIComponent(destino.slice(4)) : null;
    var curso = esEsp ? null : destino;
    var e = estancia(s.estancia);
    var com = esEsp ? e.comensales.filter(function (c) { return c.cod === cod; })[0] : null;
    if (filtroElegir.clave !== sid + destino) filtroElegir = { clave: sid + destino, tipo: esEsp ? 'todos' : curso, txt: '' };
    titulo(esEsp ? 'Plato para ' + cod : 'Elegir ' + (CURSOS.filter(function (c) { return c.id === curso; })[0] || {}).nombre.toLowerCase(), '/servicio/' + sid);
    var html = '<div class="sub" style="margin-bottom:8px">' + esc(e.grupo) + ' · ' + cap(fechaCorta(s.fecha)) + ' · ' + s.turno + '</div>';
    if (com) html += '<div class="tarjeta fina"><b>' + esc(com.cod) + '</b> · ' + esc(nombresAl(com.alergias)) + ' ' + iconosDe(com.alergias, 'p') + '<div class="sub peq">Elige platos que pueda comer. Puedes añadir varios.</div></div>';
    html += '<input class="entrada" id="buscaEleg" placeholder="Buscar plato…" value="' + esc(filtroElegir.txt) + '" style="margin-bottom:10px">';
    html += '<div class="chips" style="margin-bottom:10px">' + TIPOS.concat([{ id: 'todos', nombre: 'Todos' }]).map(function (t) {
      return '<button class="chip' + (filtroElegir.tipo === t.id ? ' activo' : '') + '" onclick="A.tipoEleg(\'' + t.id + '\')">' + t.nombre + (t.id === 'todos' ? '' : 's') + '</button>';
    }).join('') + '</div><div id="listaEleg"></div>';
    html += '<button class="enlace" onclick="A.ir(\'/plato-editar/nuevo\')">+ Crear plato nuevo</button><p class="sub peq">Los platos nuevos deben aprobarse antes de poder elegirse.</p>';
    pintar(html);
    var yaEsp = esEsp ? (s.especiales.filter(function (x) { return x.comensal === cod; })[0] || { platos: [] }).platos : [];
    function lista() {
      var q = filtroElegir.txt.toLowerCase();
      var ps = D.platos.filter(function (p) {
        return p.estado === 'aprobado' && (filtroElegir.tipo === 'todos' || p.tipo === filtroElegir.tipo) && (!q || p.nombre.toLowerCase().indexOf(q) >= 0);
      }).map(function (p) { return { p: p, u: ultimaVez(p.id, s.fecha, s.id) }; });
      ps.sort(function (a, b) { return a.p.nombre.localeCompare(b.p.nombre, 'es'); });
      var yaGrupo = platosServicio(s).map(function (x) { return x.id; });
      $('#listaEleg').innerHTML = ps.length ? '<div class="tarjeta fina">' + ps.map(function (x) {
        var ya = esEsp ? yaEsp.indexOf(x.p.id) >= 0 : yaGrupo.indexOf(x.p.id) >= 0;
        var reciente = x.u.dias !== null && x.u.dias <= 7;
        return '<div class="fila toca" onclick="A.elegido(\'' + sid + '\',\'' + destino + '\',\'' + x.p.id + '\')"><span class="izq">' + esc(x.p.nombre) + ' ' + iconosPlato(x.p, 'p') +
          '<br><span class="sub peq" style="' + (reciente ? 'color:#8A5A10;font-weight:600' : '') + '">' + esc(x.u.txt) + '</span></span>' +
          '<span class="der" style="color:' + (ya ? 'var(--ok)' : 'var(--linea)') + ';font-size:22px">' + (ya ? '●' : '○') + '</span></div>';
      }).join('') + '</div>' : '<div class="vacio">No hay platos aprobados con ese filtro.</div>';
    }
    lista();
    $('#buscaEleg').oninput = function () { filtroElegir.txt = this.value; lista(); };
  }
  function elegido(sid, destino, pid) {
    var s = servicio(sid);
    if (destino.indexOf('esp-') === 0) {
      var cod = decodeURIComponent(destino.slice(4));
      var es = s.especiales.filter(function (x) { return x.comensal === cod; })[0];
      if (!es) { es = { comensal: cod, platos: [] }; s.especiales.push(es); }
      if (es.platos.indexOf(pid) < 0) es.platos.push(pid);
      guardar(); toast('Añadido para ' + cod); ir('/servicio/' + sid); return;
    }
    s.platos[destino] = s.platos[destino] || [];
    if (s.platos[destino].indexOf(pid) < 0) s.platos[destino].push(pid);
    guardar(); toast('Plato añadido'); ir('/servicio/' + sid);
  }

  // =====================================================================
  // HOJA DEL COMEDOR
  // =====================================================================
  function vComedor(eid) {
    var e = estancia(eid);
    if (!e) { ir('/estancias'); return; }
    titulo('Hoja del comedor', '/estancia/' + eid);
    var usados = {};
    var html = '<div class="fila-btns no-imprimir" style="margin:0 0 12px"><button class="btn" onclick="A.imprimir()">Imprimir</button></div>';
    html += '<div class="hoja"><div class="titulo"><div class="casa-h">Casa María Madre</div><h1>Menú · ' + esc(e.grupo) + '</h1><div class="sub">' + cap(fechaLarga(e.entrada)) + ' → ' + fechaLarga(e.salida) + '</div></div>';
    var diaAnt = '';
    serviciosDe(eid).forEach(function (s) {
      if (servicioVacio(s)) return;
      if (s.fecha !== diaAnt) { html += '<div class="dia-h">' + cap(fechaLarga(s.fecha)) + '</div>'; diaAnt = s.fecha; }
      html += '<div class="serv-h">' + turnoN(s.turno) + '</div>';
      platosServicio(s).forEach(function (x) {
        var p = plato(x.id); if (!p) return;
        var als = alergenosPlato(p); als.forEach(function (a) { usados[a] = 1; });
        html += '<div class="plato-h"><span>' + esc(p.nombre) + '</span>' + iconosDe(als) + '</div>';
      });
    });
    if (!diaAnt) html += '<div class="vacio">Todavía no hay menús asignados.</div>';
    var ley = ordenAl(Object.keys(usados));
    html += '<div class="pie"><div style="display:flex;gap:14px;align-items:center"><div class="qr">QR<br>fase 2</div><div>' +
      '<b style="color:var(--texto)">Si tienes alguna alergia o intolerancia, avisa en cocina.</b><br>Te prepararemos un plato adecuado.</div></div>' +
      '<div class="leyenda" style="margin-top:12px">' + ley.map(function (a) { return '<span>' + AL.icono(a, 'p') + esc(AL.info(a).nombre) + '</span>'; }).join('') +
      '<span><span class="sin-al" style="width:18px;height:18px;font-size:11px">✓</span>Sin alérgenos</span></div></div></div>';
    pintar(html);
  }

  // =====================================================================
  // PLATOS
  // =====================================================================
  function vPlatos() {
    titulo('Platos');
    var f = estado.filtroPlatos;
    var cont = function (st) { return D.platos.filter(function (p) { return p.estado === st; }).length; };
    var html = '<input class="entrada" id="buscaPl" placeholder="Buscar plato…" value="' + esc(estado.buscaPlatos) + '" style="margin-bottom:10px">';
    html += '<div class="chips" style="margin-bottom:10px">' + [['todos', 'Todos'], ['aprobado', 'Aprobados'], ['pendiente', 'Pendientes (' + cont('pendiente') + ')'], ['corregir', 'Corregir (' + cont('corregir') + ')']].map(function (x) {
      return '<button class="chip' + (f === x[0] ? ' activo' : '') + '" onclick="A.filtrarPlatos(\'' + x[0] + '\')">' + x[1] + '</button>';
    }).join('') + '</div>';
    html += '<label class="campo"><span>Mostrar solo platos sin…</span><select class="entrada" id="sinAl"><option value="">(cualquier alérgeno)</option>' +
      todosAlergenos().map(function (a) { return '<option value="' + esc(a) + '"' + (estado.sinAl === a ? ' selected' : '') + '>' + esc(AL.info(a).nombre) + '</option>'; }).join('') + '</select></label>';
    html += '<div id="listaPl"></div><button class="btn ancho" onclick="A.ir(\'/plato-editar/nuevo\')">+ Nuevo plato</button>';
    pintar(html);
    function lista() {
      var q = estado.buscaPlatos.toLowerCase();
      var ps = D.platos.filter(function (p) {
        return (f === 'todos' || p.estado === f) && (!q || p.nombre.toLowerCase().indexOf(q) >= 0) && (!estado.sinAl || alergenosPlato(p).indexOf(estado.sinAl) < 0);
      }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
      var html2 = '';
      TIPOS.forEach(function (t) {
        var g = ps.filter(function (p) { return p.tipo === t.id; });
        if (!g.length) return;
        html2 += '<h3>' + t.nombre + 's</h3><div class="tarjeta fina">' + g.map(function (p) {
          var st = ESTADOS[p.estado] || ESTADOS.pendiente;
          return '<div class="fila toca" onclick="A.ir(\'/plato/' + p.id + '\')"><span class="izq">' + esc(p.nombre) + '<br>' +
            (p.estado !== 'aprobado' ? '<span class="etiqueta ' + st.clase + '">' + st.nombre + '</span>' : '') + '</span>' + iconosPlato(p, 'p') + '</div>';
        }).join('') + '</div>';
      });
      $('#listaPl').innerHTML = html2 || '<div class="vacio">No hay platos con ese filtro.</div>';
    }
    lista();
    $('#buscaPl').oninput = function () { estado.buscaPlatos = this.value; lista(); };
    $('#sinAl').onchange = function () { estado.sinAl = this.value; lista(); };
  }

  function vPlato(id) {
    var p = plato(id);
    if (!p) { ir('/platos'); return; }
    titulo(p.nombre, '/platos');
    var st = ESTADOS[p.estado] || ESTADOS.pendiente;
    var als = alergenosPlato(p);
    var html = '<div class="tarjeta"><div class="servicio-cab"><span class="etiqueta ' + st.clase + '">' + st.nombre + '</span><span class="sub">' + (TIPOS.filter(function (t) { return t.id === p.tipo; })[0] || {}).nombre + '</span></div>';
    if (p.estado === 'corregir' && p.comentario) html += '<div class="avisos" style="margin:10px 0 0;background:var(--error-suave);color:var(--error)"><b>Corrección pedida:</b> ' + esc(p.comentario) + '</div>';
    html += '<h3>Alérgenos (automáticos)</h3>' + (als.length ? '<div class="leyenda" style="font-size:14px;color:var(--texto)">' + als.map(function (a) { return '<span>' + AL.icono(a, 'g') + esc(AL.info(a).nombre) + '</span>'; }).join('') + '</div>' :
      '<div><span class="sin-al">✓</span> Sin alérgenos</div>') + '</div>';
    html += '<h3>Ingredientes · por persona</h3><div class="tarjeta fina">' + (p.ingredientes.length ? p.ingredientes.map(function (x) {
      var i = ingrediente(x.ing);
      return '<div class="fila"><span class="izq">' + esc(i ? i.nombre : '¿?') + ' ' + (i && i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</span><span class="der">' + (i ? cantPorPersona(x.cant, i.unidad) : '') + '</span></div>';
    }).join('') : '<p class="sub">Sin ingredientes.</p>') + '</div>';
    if (p.notas) html += '<div class="tarjeta fina"><b>Notas</b><div class="sub">' + esc(p.notas) + '</div></div>';
    html += '<div class="sub" style="margin-bottom:12px">' + esc(ultimaVez(p.id).txt) + ' · Receta: próximamente</div>';
    if (p.estado !== 'aprobado') html += '<button class="btn ok ancho" onclick="A.aprobar(\'' + p.id + '\')">✓ Aprobar</button>';
    html += '<div class="fila-btns">' + (p.estado !== 'corregir' ? '<button class="btn sec" onclick="A.pedirCorreccion(\'' + p.id + '\')">Pedir corrección</button>' : '') +
      '<button class="btn sec" onclick="A.ir(\'/plato-editar/' + p.id + '\')">Editar</button></div>' +
      '<div class="fila-btns"><button class="btn borde" onclick="A.duplicar(\'' + p.id + '\')">Duplicar (para variante)</button>' +
      '<button class="btn peligro" onclick="A.borrarPlato(\'' + p.id + '\')">Eliminar</button></div>';
    pintar(html);
  }

  var borradorPlato = null;
  function vPlatoForm(id) {
    var p = id === 'nuevo' ? null : plato(id);
    if (!borradorPlato || borradorPlato.id !== (p ? p.id : 'nuevo')) {
      borradorPlato = p ? JSON.parse(JSON.stringify(p)) : { id: 'nuevo', nombre: '', tipo: 'segundo', notas: '', ingredientes: [] };
    }
    var b = borradorPlato;
    titulo(p ? 'Editar plato' : 'Nuevo plato', p ? '/plato/' + p.id : '/platos');
    var opsIng = '<option value="">Elige ingrediente…</option>' + CATEGORIAS.map(function (cat) {
      var g = D.ingredientes.filter(function (i) { return (i.categoria || 'Otros') === cat; }).sort(function (x, y) { return x.nombre.localeCompare(y.nombre, 'es'); });
      return g.length ? '<optgroup label="' + cat + '">' + g.map(function (i) { return '<option value="' + i.id + '">' + esc(i.nombre) + ' (' + i.unidad + ')</option>'; }).join('') + '</optgroup>' : '';
    }).join('');
    var html = '<div class="tarjeta"><label class="campo"><span>Nombre del plato</span><input class="entrada" id="pNombre" value="' + esc(b.nombre) + '" placeholder="Merluza rebozada"></label>' +
      '<label class="campo"><span>Tipo</span><select class="entrada" id="pTipo">' + TIPOS.map(function (t) { return '<option value="' + t.id + '"' + (b.tipo === t.id ? ' selected' : '') + '>' + t.nombre + '</option>'; }).join('') + '</select></label></div>';
    html += '<h3>Ingredientes · cantidad para una persona</h3><div class="tarjeta fina">';
    b.ingredientes.forEach(function (x, k) {
      var i = ingrediente(x.ing);
      html += '<div class="fila"><span class="izq">' + esc(i ? i.nombre : '¿?') + ' ' + (i && i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</span>' +
        '<input class="entrada" type="number" step="any" min="0" inputmode="decimal" style="width:90px;min-height:38px;padding:6px 8px;text-align:right" value="' + x.cant + '" onchange="A.cantIng(' + k + ', this.value)"><span class="sub" style="width:30px">' + (i ? i.unidad : '') + '</span>' +
        '<button class="quitar" aria-label="Quitar" onclick="A.quitarIng(' + k + ')">' + SVG.x + '</button></div>';
    });
    html += '<div style="display:flex;gap:8px;margin-top:8px"><select class="entrada" id="pIngSel" style="flex:1">' + opsIng + '</select></div>' +
      '<button class="enlace" onclick="A.ingRapido()">¿No está? Crear ingrediente</button></div>';
    var als = alergenosPlato(b);
    html += '<div class="tarjeta fina"><b>Alérgenos del plato:</b> ' + (als.length ? iconosDe(als) + ' <span class="sub">' + esc(nombresAl(als)) + '</span>' : '<span class="sin-al">✓</span> ninguno') + '</div>';
    html += '<div class="tarjeta"><label class="campo" style="margin:0"><span>Notas (opcional)</span><textarea class="entrada" id="pNotas" placeholder="Variante sin huevo: rebozar solo con harina y agua">' + esc(b.notas) + '</textarea></label></div>';
    html += '<p class="error-txt" id="pError" hidden></p><button class="btn ancho" onclick="A.guardarPlato()">Guardar</button>' +
      '<p class="sub peq" style="text-align:center">Al guardar, el plato queda pendiente de aprobar por el jefe de cocina.</p>';
    pintar(html);
    $('#pNombre').oninput = function () { b.nombre = this.value; };
    $('#pTipo').onchange = function () { b.tipo = this.value; };
    $('#pNotas').oninput = function () { b.notas = this.value; };
    $('#pIngSel').onchange = function () {
      var v = this.value; if (!v) return;
      if (b.ingredientes.some(function (x) { return x.ing === v; })) { toast('Ese ingrediente ya está'); this.value = ''; return; }
      var i = ingrediente(v);
      b.ingredientes.push({ ing: v, cant: i.unidad === 'ud.' ? 1 : 100 });
      vPlatoForm(id);
      var ult = $$('#vista input[type=number]').pop(); if (ult) { ult.focus(); ult.select(); }
    };
  }
  function guardarPlato() {
    var b = borradorPlato;
    var err = !b.nombre.trim() ? 'Escribe el nombre del plato.' : !b.ingredientes.length ? 'Añade al menos un ingrediente.' :
      b.ingredientes.some(function (x) { return !(x.cant > 0); }) ? 'Revisa las cantidades: deben ser mayores que 0.' : '';
    if (err) { var x = $('#pError'); x.textContent = err; x.hidden = false; return; }
    var p;
    if (b.id === 'nuevo') {
      p = { id: nuevoId('p'), nombre: b.nombre.trim(), tipo: b.tipo, estado: 'pendiente', comentario: '', notas: b.notas.trim(), ingredientes: b.ingredientes };
      D.platos.push(p); toast('Plato creado · pendiente de aprobar');
    } else {
      p = plato(b.id);
      var antes = p.estado;
      p.nombre = b.nombre.trim(); p.tipo = b.tipo; p.notas = b.notas.trim(); p.ingredientes = b.ingredientes; p.estado = 'pendiente'; p.comentario = '';
      toast(antes === 'aprobado' ? 'Guardado · vuelve a revisión' : 'Guardado · pendiente de aprobar');
    }
    borradorPlato = null; guardar(); ir('/plato/' + p.id);
  }
  function ingRapido() {
    modal('Nuevo ingrediente', '<label class="campo"><span>Nombre</span><input class="entrada" id="qNom"></label>' +
      '<label class="campo"><span>Unidad</span><select class="entrada" id="qUni">' + UNIDADES.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Categoría</span><select class="entrada" id="qCat">' + CATEGORIAS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label>' +
      '<p class="sub peq">Los alérgenos se marcan después en Compras → Ingredientes. Recuerda hacerlo.</p><p class="error-txt" id="qErr" hidden></p><button class="btn ancho" id="qOk">Crear y añadir</button>');
    $('#qOk').onclick = function () {
      var n = $('#qNom').value.trim();
      if (!n) { var x = $('#qErr'); x.textContent = 'Escribe el nombre.'; x.hidden = false; return; }
      var i = { id: nuevoId('i'), nombre: n, unidad: $('#qUni').value, categoria: $('#qCat').value, alergenos: [] };
      D.ingredientes.push(i); guardar();
      borradorPlato.ingredientes.push({ ing: i.id, cant: i.unidad === 'ud.' ? 1 : 100 });
      cerrar(); render();
    };
  }
  function pedirCorreccion(id) {
    modal('Pedir corrección', '<label class="campo"><span>¿Qué hay que corregir?</span><textarea class="entrada" id="corrTxt" placeholder="Falta el pan rallado del rebozado"></textarea></label><p class="error-txt" id="corrErr" hidden></p><button class="btn ancho" id="corrOk">Enviar</button>');
    $('#corrOk').onclick = function () {
      var t = $('#corrTxt').value.trim();
      if (!t) { var x = $('#corrErr'); x.textContent = 'Escribe qué hay que corregir.'; x.hidden = false; return; }
      var p = plato(id); p.estado = 'corregir'; p.comentario = t; guardar(); cerrar(); render(); toast('Corrección pedida');
    };
  }

  // =====================================================================
  // INGREDIENTES
  // =====================================================================
  function vIngredientes() {
    titulo('Ingredientes', '/compras');
    var html = '<input class="entrada" id="buscaIng" placeholder="Buscar ingrediente…" style="margin-bottom:10px"><div id="listaIng"></div>' +
      '<button class="btn ancho" onclick="A.ir(\'/ingrediente/nuevo\')">+ Nuevo ingrediente</button>';
    pintar(html);
    function lista(q) {
      q = (q || '').toLowerCase();
      var h = '';
      CATEGORIAS.forEach(function (cat) {
        var g = D.ingredientes.filter(function (i) { return (i.categoria || 'Otros') === cat && (!q || i.nombre.toLowerCase().indexOf(q) >= 0); })
          .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
        if (!g.length) return;
        h += '<h3>' + cat + '</h3><div class="tarjeta fina">' + g.map(function (i) {
          return '<div class="fila toca" onclick="A.ir(\'/ingrediente/' + i.id + '\')"><span class="izq">' + esc(i.nombre) + ' <span class="sub">(' + i.unidad + ')</span></span>' + (i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</div>';
        }).join('') + '</div>';
      });
      $('#listaIng').innerHTML = h || '<div class="vacio">No hay ingredientes con ese nombre.</div>';
    }
    lista('');
    $('#buscaIng').oninput = function () { lista(this.value); };
  }

  function vIngredienteForm(id) {
    var i = id === 'nuevo' ? null : ingrediente(id);
    titulo(i ? i.nombre : 'Nuevo ingrediente', '/ingredientes');
    var b = A._ing && A._ing.id === id ? A._ing.b : { nombre: i ? i.nombre : '', unidad: i ? i.unidad : 'g', categoria: i ? i.categoria : 'Despensa' };
    var sel = A._ing && A._ing.id === id ? A._ing.sel : (i ? i.alergenos.slice() : []);
    A._ing = { id: id, b: b, sel: sel, repintar: function () { vIngredienteForm(id); } };
    var usos = i ? usosIngrediente(i.id) : 0;
    var html = '<div class="tarjeta"><label class="campo"><span>Nombre</span><input class="entrada" id="iNom" value="' + esc(b.nombre) + '" placeholder="Tomate frito (bote)"></label>' +
      '<label class="campo"><span>Unidad</span></label><div class="chips" style="margin-bottom:12px">' + UNIDADES.map(function (u) {
        return '<button class="chip' + (b.unidad === u ? ' activo' : '') + '" onclick="A.unidadIng(\'' + u + '\')">' + u + '</button>';
      }).join('') + '</div>' +
      '<label class="campo"><span>Categoría (para ordenar la compra)</span><select class="entrada" id="iCat">' + CATEGORIAS.map(function (c) { return '<option' + (b.categoria === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div>';
    html += '<h3>Toca los alérgenos que contiene</h3>' + selectorAl(sel, 'A.togAlIng') +
      '<button class="enlace" onclick="A.nuevoPropio(\'ing\')">+ Otro que no está en la lista (miel, kiwi…)</button>';
    if (usos) html += '<p class="sub peq">Se usa en ' + usos + (usos === 1 ? ' plato' : ' platos') + '. Si cambias sus alérgenos, cambian también los de esos platos.</p>';
    html += '<p class="error-txt" id="iErr" hidden></p><div class="fila-btns">' + (i && !usos ? '<button class="btn peligro" onclick="A.borrarIng(\'' + i.id + '\')">Eliminar</button>' : '') +
      '<button class="btn" onclick="A.guardarIng()">Guardar</button></div>';
    pintar(html);
    $('#iNom').oninput = function () { b.nombre = this.value; };
    $('#iCat').onchange = function () { b.categoria = this.value; };
  }
  function guardarIng() {
    var s = A._ing, b = s.b;
    if (!b.nombre.trim()) { var x = $('#iErr'); x.textContent = 'Escribe el nombre.'; x.hidden = false; return; }
    if (s.id === 'nuevo') {
      D.ingredientes.push({ id: nuevoId('i'), nombre: b.nombre.trim(), unidad: b.unidad, categoria: b.categoria, alergenos: ordenAl(s.sel) });
      toast('Ingrediente creado');
    } else {
      var i = ingrediente(s.id);
      var cambia = JSON.stringify(ordenAl(i.alergenos)) !== JSON.stringify(ordenAl(s.sel));
      i.nombre = b.nombre.trim(); i.unidad = b.unidad; i.categoria = b.categoria; i.alergenos = ordenAl(s.sel);
      if (cambia) {
        var n = 0;
        D.platos.forEach(function (p) {
          if (p.estado === 'aprobado' && p.ingredientes.some(function (x) { return x.ing === i.id; })) { p.estado = 'pendiente'; n++; }
        });
        toast(n ? 'Guardado · ' + n + (n === 1 ? ' plato vuelve' : ' platos vuelven') + ' a revisión' : 'Guardado');
      } else toast('Guardado');
    }
    A._ing = null; guardar(); ir('/ingredientes');
  }

  // =====================================================================
  // COMPRAS
  // =====================================================================
  function vCompras() {
    titulo('Compras');
    var hoy = hoyT();
    var ord = D.estancias.slice().sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; });
    var prox = ord.filter(function (e) { return e.salida >= hoy; });
    var html = '<h3>Lista de la compra por estancia</h3>' + (prox.length ? prox.map(function (e) {
      var d = fechaD(e.entrada), n = Object.keys(calcularCompra(e.id)).length;
      var c = D.compras[e.id] || {}, hechos = Object.keys(c).filter(function (k) { return c[k].hecho; }).length;
      return '<button class="reserva" onclick="A.ir(\'/compras/' + e.id + '\')"><div class="fecha"><span class="d">' + d.getDate() + '</span><span class="m">' + MESES_C[d.getMonth()] + '</span></div>' +
        '<div class="info"><b>' + esc(e.grupo) + '</b><div class="sub">' + rango(e) + ' · ' + e.personas + ' personas</div><div class="sub">' + (n ? n + ' ingredientes · ' + hechos + ' comprados' : 'Sin menús todavía') + '</div></div></button>';
    }).join('') : '<div class="vacio">No hay estancias próximas.</div>');
    html += '<h3>Suministros</h3><div class="tarjeta fina"><div class="fila toca" onclick="A.ir(\'/ingredientes\')"><span class="izq"><b>Ingredientes</b><br><span class="sub">' + D.ingredientes.length + ' ingredientes con sus alérgenos</span></span><span class="der">›</span></div>' +
      '<div class="fila"><span class="izq sub">Proveedores y precios: en el futuro (conexión con el gestor)</span></div></div>';
    pintar(html);
  }

  function vCompra(eid) {
    var e = estancia(eid);
    if (!e) { ir('/compras'); return; }
    titulo('Compra · ' + e.grupo, '/compras');
    var tot = calcularCompra(eid);
    var c = D.compras[eid] = D.compras[eid] || {};
    var ids = Object.keys(tot);
    var hechos = ids.filter(function (k) { return c[k] && c[k].hecho; }).length;
    var html = '<div class="tarjeta fina"><b>' + esc(e.grupo) + '</b> · ' + rango(e) + ' · ' + e.personas + ' personas<div class="sub">' + serviciosDe(eid).length + ' servicios · ' + hechos + ' de ' + ids.length + ' comprados</div></div>';
    if (!ids.length) { pintar(html + '<div class="vacio">Asigna platos a la estancia para calcular la compra.</div>'); return; }
    html += '<p class="sub peq">Propuesto = cantidad por persona × raciones. Escribe a la derecha la cantidad que vas a pedir (por ejemplo, "3 docenas").</p>';
    CATEGORIAS.forEach(function (cat) {
      var g = ids.filter(function (k) { var i = ingrediente(k); return i && (i.categoria || 'Otros') === cat; })
        .sort(function (a, b) { return ingrediente(a).nombre.localeCompare(ingrediente(b).nombre, 'es'); });
      if (!g.length) return;
      html += '<div class="cat-cab">' + cat + '</div><div class="tarjeta fina">' + g.map(function (k) {
        var i = ingrediente(k), r = c[k] || {};
        return '<div class="compra' + (r.hecho ? ' hecho' : '') + '"><input type="checkbox" aria-label="Comprado" ' + (r.hecho ? 'checked' : '') + ' onchange="A.hecho(\'' + eid + '\',\'' + k + '\',this.checked)">' +
          '<div><div class="nom">' + esc(i.nombre) + '</div><div class="sub peq">Propuesto: ' + cantidad(tot[k], i.unidad) + '</div></div>' +
          '<input class="entrada ajuste" value="' + esc(r.ajuste || '') + '" placeholder="' + esc(cantidad(tot[k], i.unidad)) + '" onchange="A.ajuste(\'' + eid + '\',\'' + k + '\',this.value)"></div>';
      }).join('') + '</div>';
    });
    html += '<div class="fila-btns"><button class="btn sec" onclick="A.compartir(\'' + eid + '\')">Compartir lista</button><button class="btn borde" onclick="A.reiniciarCompra(\'' + eid + '\')">Volver a lo propuesto</button></div>';
    pintar(html);
  }
  function textoCompra(eid) {
    var e = estancia(eid), tot = calcularCompra(eid), c = D.compras[eid] || {};
    var t = 'Compra · ' + e.grupo + ' (' + rango(e) + ', ' + e.personas + ' pers.)\n';
    CATEGORIAS.forEach(function (cat) {
      var g = Object.keys(tot).filter(function (k) { var i = ingrediente(k); return i && (i.categoria || 'Otros') === cat; });
      if (!g.length) return;
      t += '\n' + cat.toUpperCase() + '\n';
      g.sort(function (a, b) { return ingrediente(a).nombre.localeCompare(ingrediente(b).nombre, 'es'); }).forEach(function (k) {
        var i = ingrediente(k), r = c[k] || {};
        t += (r.hecho ? '✓ ' : '• ') + i.nombre + ': ' + (r.ajuste || cantidad(tot[k], i.unidad)) + '\n';
      });
    });
    return t;
  }
  function compartir(eid) {
    var t = textoCompra(eid);
    if (navigator.share) {
      navigator.share({ title: 'Lista de la compra', text: t }).catch(function (e) { if (!e || e.name !== 'AbortError') copiarTexto(t); });
      return;
    }
    copiarTexto(t);
  }
  function copiarTexto(t) {
    try {
      navigator.clipboard.writeText(t).then(function () { toast('Lista copiada: pégala en WhatsApp o en un correo'); },
        function () { mostrarTexto(t); });
    } catch (e) { mostrarTexto(t); }
  }
  function mostrarTexto(t) { modal('Lista de la compra', '<textarea class="entrada" style="min-height:300px" readonly>' + esc(t) + '</textarea><p class="sub peq">Selecciona y copia el texto.</p>'); }

  // =====================================================================
  // MÁS
  // =====================================================================
  function vMas() {
    titulo('Más');
    var pend = D.sugerencias.filter(function (s) { return !s.hecho; }).length;
    var html = '<div class="tarjeta fina">' +
      fila('/sugerencias', 'Sugerencia o fallo', 'Anota lo que falla o falta' + (pend ? ' · ' + pend + ' pendientes' : '')) +
      fila('/ingredientes', 'Ingredientes', D.ingredientes.length + ' ingredientes') +
      fila('/menus', 'Menús guardados', D.menus.length + ' menús') +
      fila('/ayuda', 'Ayuda (manual breve)', 'Cómo se usa la app') + '</div>';
    html += '<div class="tarjeta fina"><div class="fila toca" onclick="A.descargar()"><span class="izq"><b>Descargar copia de los datos</b><br><span class="sub">Archivo JSON (para guardar en el NAS, por ejemplo)</span></span><span class="der">›</span></div>' +
      '<div class="fila toca" onclick="A.restablecer()"><span class="izq"><b style="color:var(--error)">Restablecer datos de ejemplo</b><br><span class="sub">Borra lo que hayas cambiado en este dispositivo</span></span><span class="der">›</span></div></div>';
    html += '<p class="sub peq" style="text-align:center">' + esc(CONFIG.NOMBRE_CASA) + ' · Menús ' + esc(CONFIG.VERSION) + '<br>Modo demostración: los datos se guardan solo en este dispositivo.</p>';
    pintar(html);
    function fila(r, t, s) { return '<div class="fila toca" onclick="A.ir(\'' + r + '\')"><span class="izq"><b>' + t + '</b><br><span class="sub">' + esc(s) + '</span></span><span class="der">›</span></div>'; }
  }

  function vMenus() {
    titulo('Menús guardados', '/mas');
    var html = D.menus.length ? D.menus.map(function (m) {
      var ps = [];
      CURSOS.forEach(function (c) { (m.platos[c.id] || []).forEach(function (pid) { var p = plato(pid); if (p) ps.push(p.nombre); }); });
      return '<div class="tarjeta fina"><div class="servicio-cab"><b>' + esc(m.nombre) + '</b>' + (m.modalidad ? '<span class="etiqueta modalidad">' + esc(m.modalidad) + '</span>' : '') + '</div>' +
        '<div class="sub">' + esc(ps.join(' · ')) + '</div><button class="enlace" style="color:var(--error)" onclick="A.borrarMenu(\'' + m.id + '\')">Eliminar</button></div>';
    }).join('') : '<div class="vacio">Aún no hay menús guardados.</div>';
    html += '<p class="sub peq">Para guardar un menú: abre una comida o cena de una estancia → "Guardar como menú".</p>';
    pintar(html);
  }

  function vSugerencias() {
    titulo('Sugerencia o fallo', '/mas');
    var html = '<div class="tarjeta"><label class="campo"><span>¿Qué falla o qué falta?</span><textarea class="entrada" id="sugTxt" placeholder="No encuentro dónde cambiar el número de personas"></textarea></label>' +
      '<p class="error-txt" id="sugErr" hidden></p><button class="btn ancho" onclick="A.enviarSug()">Anotar</button></div>';
    var ord = D.sugerencias.slice().reverse();
    html += '<h3>Anotadas</h3>' + (ord.length ? '<div class="tarjeta fina">' + ord.map(function (s) {
      return '<div class="fila"><label class="izq" style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" style="width:20px;height:20px;margin-top:2px" ' + (s.hecho ? 'checked' : '') + ' onchange="A.sugHecha(\'' + s.id + '\',this.checked)">' +
        '<span' + (s.hecho ? ' style="text-decoration:line-through;color:var(--texto-2)"' : '') + '>' + esc(s.texto) + '<br><span class="sub peq">' + fechaCorta(s.fecha) + '</span></span></label></div>';
    }).join('') + '</div>' : '<div class="vacio">Nada anotado.</div>');
    pintar(html);
  }

  function vAyuda() {
    titulo('Ayuda', '/mas');
    var pasos = [
      ['Entrar', 'Abre la app en el móvil. La primera vez, "Añadir a pantalla de inicio".'],
      ['Ingredientes', 'Compras → Ingredientes → + Nuevo: nombre, unidad y toca los alérgenos que contiene.'],
      ['Platos', '+ → Plato: nombre, tipo y sus ingredientes con la cantidad para una persona. Los alérgenos salen solos. Queda pendiente de aprobar.'],
      ['Aprobar', 'El jefe de cocina abre el plato (aviso en Estancias) → Aprobar o Pedir corrección. Solo los aprobados se pueden poner en un menú.'],
      ['Preparar una estancia', '+ → Estancia: grupo, fechas y personas. Añade los comensales con alergias (A, B…), siempre anónimos.'],
      ['Asignar el menú', 'Estancia → toca la comida o cena → modalidad → + Elegir primero, segundo y postre. Se guarda solo.'],
      ['Raciones especiales', 'En el servicio mira las alergias de A, B, C y los iconos de los platos. Si alguien no puede comer algo → + Ración especial → elige su plato. Si no hay problema, no hagas nada.'],
      ['Qué hay que servir', 'Estancias → Calendario → toca el día.'],
      ['Comedor', 'Estancia → Hoja del comedor → Imprimir.'],
      ['Compra', 'Compras → la estancia → ajusta las cantidades propuestas → marca lo comprado → Compartir lista.'],
      ['¿Falla algo?', 'Más → Sugerencia o fallo → escríbelo en una línea.']
    ];
    var html = '<div class="tarjeta">' + pasos.map(function (p) { return '<div class="fila" style="display:block"><b>' + p[0] + '</b><div class="sub">' + esc(p[1]) + '</div></div>'; }).join('') + '</div>';
    html += '<h3>Alérgenos</h3><div class="tarjeta"><div class="leyenda" style="font-size:13px;color:var(--texto)">' +
      todosAlergenos().map(function (a) { return '<span>' + AL.icono(a) + esc(AL.info(a).nombre) + '</span>'; }).join('') +
      '<span><span class="sin-al">✓</span>Sin alérgenos</span></div></div>';
    pintar(html);
  }

  // =====================================================================
  // ACCIONES (window.A)
  // =====================================================================
  window.A = {
    ir: ir, cerrar: cerrar,
    vistaEst: function (v) { estado.vistaEst = v; render(); },
    verPasadas: function () { estado.verPasadas = true; render(); },
    mes: function (d) { var m = fechaD(estado.mesCal); m.setMonth(m.getMonth() + d); estado.mesCal = fechaT(m); render(); },
    diaSel: function (t) { estado.diaSel = t; render(); },
    filtrarPlatos: function (f) { estado.filtroPlatos = f; if (location.hash !== '#/platos') location.hash = '/platos'; else render(); },
    guardarEstancia: guardarEstancia, borrarEstancia: borrarEstancia, nuevoServicio: nuevoServicio,
    editarComensal: editarComensal,
    togAlCom: function (a, btn) { togSel(A._com.sel, a, btn); },
    togAlIng: function (a, btn) { togSel(A._ing.sel, a, btn); },
    nuevoPropio: nuevoPropio,
    modalidad: function (sid, m) { var s = servicio(sid); s.modalidad = s.modalidad === m ? '' : m; guardar(); render(); },
    otraModalidad: function (sid) {
      pedirTexto('Nueva modalidad', 'Nombre (por ejemplo, Vegetariano)', '', function (m) {
        m = cap(m); if (D.modalidades.indexOf(m) < 0) D.modalidades.push(m);
        servicio(sid).modalidad = m; guardar(); render();
      });
    },
    aplicarMenu: function (sid, mid) {
      var s = servicio(sid), m = porId(D.menus, mid);
      var fn = function () { s.platos = JSON.parse(JSON.stringify(m.platos)); if (m.modalidad) s.modalidad = m.modalidad; guardar(); render(); toast('Menú aplicado'); };
      if (servicioVacio(s)) fn(); else confirmar('Se sustituirán los platos de este servicio por los del menú "' + m.nombre + '".', 'Sustituir', fn);
    },
    guardarMenu: function (sid) {
      var s = servicio(sid);
      if (servicioVacio(s)) { toast('Primero elige los platos'); return; }
      pedirTexto('Guardar como menú', 'Nombre del menú', (s.modalidad ? s.modalidad + ' ' : 'Menú ') + (D.menus.length + 1), function (n) {
        D.menus.push({ id: nuevoId('m'), nombre: n, modalidad: s.modalidad, platos: JSON.parse(JSON.stringify(s.platos)) }); guardar(); render(); toast('Menú guardado');
      });
    },
    borrarMenu: function (mid) { confirmar('Se eliminará este menú guardado (no afecta a las estancias).', 'Eliminar', function () { D.menus = D.menus.filter(function (m) { return m.id !== mid; }); guardar(); render(); }, true); },
    quitarPlato: function (sid, c, i) { servicio(sid).platos[c].splice(i, 1); guardar(); render(); },
    nuevaEsp: nuevaEsp, crearEsp: crearEsp,
    quitarEsp: function (sid, i) { servicio(sid).especiales.splice(i, 1); guardar(); render(); toast('Ración especial quitada'); },
    vaciarEsp: function (sid, i) { servicio(sid).especiales[i].platos = []; guardar(); render(); },
    borrarServicio: function (sid) {
      var s = servicio(sid);
      confirmar('Se eliminará la ' + s.turno + ' del ' + fechaCorta(s.fecha) + '.', 'Eliminar', function () {
        D.servicios = D.servicios.filter(function (x) { return x.id !== sid; }); guardar(); ir('/estancia/' + s.estancia);
      }, true);
    },
    tipoEleg: function (t) { filtroElegir.tipo = t; render(); },
    elegido: elegido,
    aprobar: function (id) { var p = plato(id); p.estado = 'aprobado'; p.comentario = ''; guardar(); render(); toast('Plato aprobado'); },
    pedirCorreccion: pedirCorreccion,
    duplicar: function (id) {
      var p = plato(id), n = JSON.parse(JSON.stringify(p));
      n.id = nuevoId('p'); n.nombre = p.nombre + ' (variante)'; n.estado = 'pendiente'; n.comentario = '';
      D.platos.push(n); guardar(); borradorPlato = null; ir('/plato-editar/' + n.id); toast('Copia creada: cambia el nombre y los ingredientes');
    },
    borrarPlato: function (id) {
      var u = usosPlato(id);
      if (u) { modal('No se puede eliminar', '<p>Este plato está en ' + u + (u === 1 ? ' servicio' : ' servicios') + '. Quítalo antes de los menús.</p><button class="btn ancho" onclick="A.cerrar()">Entendido</button>'); return; }
      confirmar('Se eliminará el plato "' + plato(id).nombre + '".', 'Eliminar', function () { D.platos = D.platos.filter(function (p) { return p.id !== id; }); guardar(); ir('/platos'); }, true);
    },
    cantIng: function (k, v) { borradorPlato.ingredientes[k].cant = parseFloat(String(v).replace(',', '.')) || 0; },
    quitarIng: function (k) { borradorPlato.ingredientes.splice(k, 1); render(); },
    ingRapido: ingRapido, guardarPlato: guardarPlato,
    unidadIng: function (u) { A._ing.b.unidad = u; vIngredienteForm(A._ing.id); },
    guardarIng: guardarIng,
    borrarIng: function (id) { confirmar('Se eliminará el ingrediente.', 'Eliminar', function () { D.ingredientes = D.ingredientes.filter(function (i) { return i.id !== id; }); A._ing = null; guardar(); ir('/ingredientes'); }, true); },
    hecho: function (eid, k, v) { var c = D.compras[eid]; c[k] = c[k] || {}; c[k].hecho = v; guardar(); render(); },
    ajuste: function (eid, k, v) { var c = D.compras[eid]; c[k] = c[k] || {}; c[k].ajuste = v.trim(); guardar(); },
    compartir: compartir,
    reiniciarCompra: function (eid) { confirmar('Se borrarán los ajustes y las marcas de comprado de esta lista.', 'Volver a lo propuesto', function () { D.compras[eid] = {}; guardar(); render(); }); },
    enviarSug: function () {
      var t = $('#sugTxt').value.trim();
      if (!t) { var x = $('#sugErr'); x.textContent = 'Escribe algo.'; x.hidden = false; return; }
      D.sugerencias.push({ id: nuevoId('g'), fecha: hoyT(), texto: t, hecho: false }); guardar(); render(); toast('Anotado. ¡Gracias!');
    },
    sugHecha: function (id, v) { porId(D.sugerencias, id).hecho = v; guardar(); render(); },
    descargar: function () {
      try {
        var blob = new Blob([JSON.stringify(D, null, 2)], { type: 'application/json' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'menus-maria-madre-' + hoyT() + '.json';
        document.body.appendChild(a); a.click(); a.remove();
      } catch (e) { toast('No se ha podido descargar en este dispositivo'); }
    },
    restablecer: function () { confirmar('Se borrarán todos los cambios hechos en este dispositivo y se cargarán de nuevo los datos de ejemplo.', 'Restablecer', function () { restablecer(); estado.mesCal = null; ir('/estancias'); toast('Datos de ejemplo cargados'); }, true); },
    nuevo: function () {
      modal('Crear', '<div class="tarjeta fina">' +
        '<div class="fila toca" onclick="A.cerrar();A.ir(\'/estancia-editar/nueva\')"><span class="izq"><b>Estancia</b><br><span class="sub">Un grupo que viene: fechas, personas y alergias</span></span><span class="der">›</span></div>' +
        '<div class="fila toca" onclick="A.cerrar();A.nuevoPlato()"><span class="izq"><b>Plato</b><br><span class="sub">Con sus ingredientes por persona</span></span><span class="der">›</span></div>' +
        '<div class="fila toca" onclick="A.cerrar();A.ir(\'/ingrediente/nuevo\')"><span class="izq"><b>Ingrediente</b><br><span class="sub">Con sus alérgenos</span></span><span class="der">›</span></div></div>');
    },
    imprimir: function () { try { window.print(); } catch (e) { toast('Este visor no permite imprimir: abre la app en el navegador'); } },
    nuevoPlato: function () { borradorPlato = null; ir('/plato-editar/nuevo'); }
  };

  // =====================================================================
  // ARRANQUE
  // =====================================================================
  function iniciar() {
    cargar();
    $('#tituloCasa').textContent = CONFIG.NOMBRE_CASA + ' · ' + CONFIG.NOMBRE_APP;
    $('#aviso').hidden = false;
    $('#aviso').textContent = 'Borrador · modo demostración: los cambios se guardan solo en este dispositivo.';
    $$('#menu button').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.ir === 'nuevo') { A.nuevo(); return; }
        if (b.dataset.ir === 'platos') borradorPlato = null;
        ir('/' + b.dataset.ir);
      };
    });
    window.addEventListener('hashchange', render);
    render();
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
