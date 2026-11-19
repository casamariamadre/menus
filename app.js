/*
 * Casa María Madre – App de Menús · versión 0.2 (modo demostración)
 * Los datos se guardan solo en este dispositivo (localStorage). Copia de seguridad,
 * restauración, comparación y fusión en Más.
 */
(function () {
  'use strict';

  // =====================================================================
  // DATOS
  // =====================================================================
  var CLAVE = 'mm-menus-v2';
  var CLAVE_V1 = 'mm-menus-demo-v1';
  var CLAVE_RESPALDO = 'mm-menus-respaldo';
  var FORMATO = 'mm-menus', VERSION_DATOS = 2;
  var COLECCIONES = ['ingredientes', 'platos', 'menus', 'eventos', 'servicios', 'comensales', 'compras', 'extras', 'carteles', 'sugerencias'];
  var D = null;
  var memoria = null;
  var MARGEN_BLOQUEO = 2; // días tras la salida para corregir lo servido

  function cargar() {
    var t = null;
    try { t = localStorage.getItem(CLAVE); } catch (e) { /* sin almacenamiento */ }
    if (t) { try { D = migrar(JSON.parse(t)); } catch (e) { D = null; } }
    if (!D) {
      var v1 = null;
      try { v1 = localStorage.getItem(CLAVE_V1); } catch (e) { /* nada */ }
      if (v1) { try { D = migrar(JSON.parse(v1)); } catch (e) { D = null; } }
    }
    if (!D) D = memoria || migrar(window.DATOS_DEMO());
    guardar(true);
  }
  function guardar(sinMarca) {
    memoria = D;
    try { localStorage.setItem(CLAVE, JSON.stringify(D)); } catch (e) { /* sigue en memoria */ }
  }
  function restablecer() {
    var disp = D && D.meta && D.meta.dispositivo;
    D = migrar(window.DATOS_DEMO());
    if (disp) D.meta.dispositivo = disp;
    guardar();
  }

  // ---------- Dispositivo, identificadores y marcas ----------
  function dispositivo() {
    if (!D.meta.dispositivo) {
      D.meta.dispositivo = { id: Math.random().toString(36).slice(2, 7), nombre: '' };
    }
    return D.meta.dispositivo;
  }
  function nombreDisp(id) {
    if (!id) return '¿?';
    if (id === 'ejemplo') return 'datos de ejemplo';
    if (id === 'gestor') return 'app de gestión';
    var d = dispositivo();
    if (id === d.id) return (d.nombre || 'este dispositivo');
    var conocidos = D.meta.dispositivosConocidos || {};
    return conocidos[id] || ('dispositivo ' + id);
  }
  function ahora() { return new Date().toISOString(); }
  function nuevoId(pref) {
    return pref + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6) + dispositivo().id;
  }
  /** Marca un registro como modificado ahora por este dispositivo. */
  function tocar(o) { o.mod = ahora(); o.por = dispositivo().id; if (o.borrado == null) o.borrado = false; return o; }
  function vivos(lista) { return lista.filter(function (x) { return !x.borrado; }); }

  // ---------- Migración de datos (formato 1 → 2) ----------
  function migrar(d) {
    if (!d) return null;
    if (d.formato === 'mm-menus-copia' && d.datos) d = d.datos; // archivo de copia
    if (d.formato === FORMATO && d.version === VERSION_DATOS) return completar(d);
    if (d.estancias) return completar(desdeV1(d));
    if (d.formato === FORMATO) return completar(d);
    throw new Error('El archivo no es una copia de la app de menús.');
  }
  function desdeV1(v) {
    var T = ahora(), POR = 'migrado';
    var mapa = {};
    function nid(viejo) {
      if (mapa[viejo]) return mapa[viejo];
      // Los de ejemplo de la 0.1 (p1, i1, e1…) pasan a los fijos de ejemplo; los creados a mano ya eran únicos.
      mapa[viejo] = /^[a-z]\d+$/.test(viejo) ? 'd-' + viejo : viejo;
      return mapa[viejo];
    }
    function r(o) { o.mod = T; o.por = POR; o.borrado = false; return o; }
    var n = {
      formato: FORMATO, version: VERSION_DATOS,
      meta: { dispositivo: null, ultimaCopia: '', copiaRecomendada: true, margen: 10, registro: [] },
      modalidades: v.modalidades || [], propios: v.propios || [],
      ingredientes: (v.ingredientes || []).map(function (i) { return r({ id: nid(i.id), nombre: i.nombre, unidad: i.unidad, categoria: i.categoria, alergenos: i.alergenos || [] }); }),
      platos: (v.platos || []).map(function (p) {
        return r({ id: nid(p.id), nombre: p.nombre, tipo: p.tipo, familia: '', estado: p.estado, comentario: p.comentario || '', notas: p.notas || '',
          ingredientes: (p.ingredientes || []).map(function (x) { return { ing: nid(x.ing), cant: x.cant }; }) });
      }),
      menus: (v.menus || []).map(function (m) { return r({ id: nid(m.id), nombre: m.nombre, modalidad: m.modalidad, platos: mapPlatos(m.platos) }); }),
      eventos: [], comensales: [], servicios: [], compras: [], extras: [], carteles: [],
      sugerencias: (v.sugerencias || []).map(function (s) { return r({ id: nid(s.id), fecha: s.fecha, texto: s.texto, hecho: !!s.hecho }); })
    };
    function mapPlatos(ps) {
      var o = {};
      ['primero', 'segundo', 'postre'].forEach(function (c) { o[c] = ((ps || {})[c] || []).map(nid); });
      return o;
    }
    (v.estancias || []).forEach(function (e) {
      var eid = nid(e.id);
      n.eventos.push(r({ id: eid, gestorId: '', grupo: e.grupo, tipo: 'Alojamiento', entrada: e.entrada, salida: e.salida, personas: e.personas,
        estado: 'Confirmada', observaciones: e.obs || '', origen: 'migrado', visto: { entrada: e.entrada, salida: e.salida, personas: e.personas, estado: 'Confirmada' } }));
      (e.comensales || []).forEach(function (c) {
        n.comensales.push(r({ id: 'k-' + eid + '-' + c.cod, evento: eid, cod: c.cod, alergias: c.alergias || [], origen: 'manual' }));
      });
    });
    (v.servicios || []).forEach(function (s) {
      var eid = nid(s.estancia);
      n.servicios.push(r({ id: idServicio(eid, s.fecha, s.turno), evento: eid, fecha: s.fecha, turno: s.turno, modalidad: s.modalidad || '',
        platos: mapPlatos(s.platos), especiales: (s.especiales || []).map(function (x) { return { comensal: x.comensal, platos: (x.platos || []).map(nid) }; }),
        revisarEsp: false, foto: null }));
    });
    Object.keys(v.compras || {}).forEach(function (eid) {
      var c = v.compras[eid];
      Object.keys(c).forEach(function (iid) {
        n.compras.push(r({ id: idCompra(nid(eid), nid(iid)), evento: nid(eid), ing: nid(iid), despensa: '', ajuste: c[iid].ajuste || '', hecho: !!c[iid].hecho, nota: '', marcaRecibida: '' }));
      });
    });
    return n;
  }
  /** Rellena lo que falte (datos antiguos o incompletos). */
  function completar(d) {
    d.formato = FORMATO; d.version = VERSION_DATOS;
    d.meta = d.meta || {};
    var m = d.meta;
    if (m.margen == null) m.margen = 10;
    m.registro = m.registro || [];
    m.dispositivosConocidos = m.dispositivosConocidos || {};
    m.cartelDefecto = m.cartelDefecto || {};
    var cd = m.cartelDefecto;
    if (cd.aviso == null) cd.aviso = 'Si tiene alguna alergia o intolerancia, avise al personal de cocina.';
    if (cd.pie == null) cd.pie = '';
    if (!cd.color) cd.color = '#85200C';
    if (!cd.escala) cd.escala = 100;
    if (cd.mostrarModalidad == null) cd.mostrarModalidad = true;
    if (!cd.leyenda) cd.leyenda = 'todos';
    d.modalidades = d.modalidades || [];
    d.propios = d.propios || [];
    COLECCIONES.forEach(function (c) { d[c] = d[c] || []; d[c].forEach(function (o) { if (o.borrado == null) o.borrado = false; }); });
    d.ingredientes.forEach(function (i) {
      ['presentacion', 'seccion', 'marca', 'revEtiqueta'].forEach(function (k) { if (i[k] == null) i[k] = ''; });
      if (i.cantPres == null) i.cantPres = 0; if (i.congelado == null) i.congelado = false; if (i.revisar == null) i.revisar = false;
      i.alergenos = i.alergenos || [];
    });
    d.platos.forEach(function (p) { if (p.familia == null) p.familia = ''; if (p.margen === undefined) p.margen = null; p.ingredientes = p.ingredientes || []; });
    d.servicios.forEach(function (s) {
      s.platos = s.platos || {}; ['primero', 'segundo', 'postre'].forEach(function (c) { s.platos[c] = s.platos[c] || []; });
      s.especiales = s.especiales || []; if (s.revisarEsp == null) s.revisarEsp = false; if (s.foto === undefined) s.foto = null;
    });
    return d;
  }

  // ---------- Identificadores fijos (los mismos en todos los dispositivos) ----------
  function idServicio(eid, fecha, turno) { return 's-' + eid + '-' + fecha + '-' + turno; }
  function idCompra(eid, iid) { return 'c-' + eid + '-' + iid; }
  function idComensal(eid, cod) { return 'k-' + eid + '-' + cod; }
  function idCartel(eid) { return 'cartel-' + eid; }

  // ---------- Constantes ----------
  var CURSOS = [
    { id: 'primero', nombre: 'Primero', corto: '1º' },
    { id: 'segundo', nombre: 'Segundo', corto: '2º' },
    { id: 'postre', nombre: 'Postre', corto: 'Postre' }
  ];
  var TIPOS = [
    { id: 'primero', nombre: 'Primero' },
    { id: 'segundo', nombre: 'Segundo' },
    { id: 'postre', nombre: 'Postre' },
    { id: 'otro', nombre: 'Otro' }
  ];
  var FAMILIAS = [
    { id: 'carne', nombre: 'Carne' },
    { id: 'pescado', nombre: 'Pescado' },
    { id: 'huevos', nombre: 'Huevos' },
    { id: 'legumbres', nombre: 'Legumbres' },
    { id: 'verduras', nombre: 'Verduras' },
    { id: 'pasta', nombre: 'Pasta' },
    { id: 'arroz', nombre: 'Arroz' },
    { id: 'sopas', nombre: 'Sopas y cremas' },
    { id: 'fruta', nombre: 'Fruta', postre: true },
    { id: 'lacteo', nombre: 'Lácteo', postre: true },
    { id: 'dulce', nombre: 'Dulce', postre: true }
  ];
  var FAM_PRINCIPALES = ['carne', 'pescado', 'huevos', 'legumbres', 'verduras'];
  var ESTADOS = {
    aprobado: { nombre: 'Aprobado', clase: '' },
    pendiente: { nombre: 'Pendiente de aprobar', clase: 'pendiente' },
    corregir: { nombre: 'Requiere corrección', clase: 'corregir' }
  };
  var UNIDADES = ['g', 'ml', 'ud.'];
  var CATEGORIAS = ['Carnes', 'Pescados', 'Huevos y lácteos', 'Verduras y frutas', 'Despensa', 'Aceites y condimentos', 'Otros'];
  var SECCIONES = ['Congelados', 'Carnicería', 'Pescadería', 'Charcutería', 'Frutería', 'Lácteos', 'Despensa', 'Droguería', 'Otros'];

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
  function jsq(v) { return esc(String(v)).replace(/\\/g, '\\\\').replace(/&#39;/g, "\\'"); }
  function porId(lista, id) { for (var i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return null; }
  function vivo(lista, id) { var o = porId(lista, id); return o && !o.borrado ? o : null; }
  function plato(id) { return porId(D.platos, id); }
  function ingrediente(id) { return porId(D.ingredientes, id); }
  function evento(id) { return vivo(D.eventos, id); }
  function servicio(id) { return vivo(D.servicios, id); }
  function serviciosDe(eid) {
    return D.servicios.filter(function (s) { return s.evento === eid && !s.borrado; }).sort(ordenServ);
  }
  function comensalesDe(eid) {
    return D.comensales.filter(function (c) { return c.evento === eid && !c.borrado; }).sort(function (a, b) { return a.cod < b.cod ? -1 : 1; });
  }
  function ordenServ(a, b) { return a.fecha === b.fecha ? (a.turno === 'comida' ? -1 : 1) : (a.fecha < b.fecha ? -1 : 1); }
  function norm(t) { return String(t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim(); }

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
  function momento(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d)) return iso;
    return d.getDate() + ' ' + MESES_C[d.getMonth()] + ' ' + d.getFullYear() + ', ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2);
  }
  function rango(e) {
    var a = fechaD(e.entrada), b = fechaD(e.salida);
    if (e.entrada === e.salida) return a.getDate() + ' ' + MESES_C[a.getMonth()];
    return a.getDate() + (a.getMonth() !== b.getMonth() ? ' ' + MESES_C[a.getMonth()] : '') + ' → ' + b.getDate() + ' ' + MESES_C[b.getMonth()];
  }
  function cap(t) { return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''; }
  function turnoN(t) { return t === 'comida' ? 'Comida' : 'Cena'; }
  function num(n, dec) { return n.toLocaleString('es-ES', { maximumFractionDigits: dec == null ? 1 : dec }); }
  function plural(n, uno, varios) { return n + ' ' + (n === 1 ? uno : varios); }

  /** Cantidad legible: g → kg, ml → l, ud. → redondeo hacia arriba. */
  function cantidad(n, unidad) {
    if (unidad === 'g') return n >= 1000 ? num(n / 1000, 1) + ' kg' : num(Math.round(n), 0) + ' g';
    if (unidad === 'ml') return n >= 1000 ? num(n / 1000, 1) + ' l' : num(Math.round(n), 0) + ' ml';
    return num(Math.ceil(n - 1e-9), 0) + ' ud.';
  }
  function cantPorPersona(n, unidad) { return num(n, 2) + ' ' + unidad; }
  /** «3 × lata de 3 kg» a partir del total y la presentación del ingrediente. */
  function enPresentacion(total, i) {
    if (!i || !(i.cantPres > 0) || !i.presentacion) return '';
    var n = Math.ceil(total / i.cantPres - 1e-9);
    return n + ' × ' + i.presentacion;
  }

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

  // ---------- Alergias escritas en las observaciones del evento ----------
  // Formato acordado:  ALERGIAS: huevo - miel, girasol - soja
  //   personas separadas por « - » (guion con espacios) · alergias de una persona separadas por comas.
  var SINONIMOS = {
    gluten: ['gluten', 'celiaco', 'celiaca', 'celiacos', 'celiaquia', 'trigo', 'sin gluten'],
    crustaceos: ['crustaceos', 'crustaceo', 'marisco', 'mariscos', 'gambas', 'gamba', 'langostinos'],
    huevo: ['huevo', 'huevos'],
    pescado: ['pescado', 'pescados'],
    cacahuete: ['cacahuete', 'cacahuetes', 'mani'],
    soja: ['soja', 'soya'],
    lacteos: ['lacteos', 'lacteo', 'leche', 'lactosa', 'intolerancia a la lactosa', 'proteina de leche'],
    frutos_cascara: ['frutos de cascara', 'frutos secos', 'fruto seco', 'nueces', 'almendras', 'avellanas', 'anacardos', 'pistachos'],
    apio: ['apio'],
    mostaza: ['mostaza'],
    sesamo: ['sesamo'],
    sulfitos: ['sulfitos', 'sulfito'],
    altramuces: ['altramuces', 'altramuz'],
    moluscos: ['moluscos', 'molusco', 'calamar', 'mejillones', 'sepia', 'pulpo']
  };
  function alergenoDeTexto(t) {
    var n = norm(t).replace(/^(alergi[ao]s? a |intolerancia a |sin )/, '');
    if (!n) return null;
    for (var id in SINONIMOS) if (SINONIMOS[id].indexOf(n) >= 0) return id;
    return 'p:' + cap(String(t).trim().replace(/^(alergi[ao]s? a |intolerancia a )/i, ''));
  }
  /** Devuelve { linea, personas:[[alergenos]], error } o null si no hay línea ALERGIAS. */
  function leerAlergias(obs) {
    var m = String(obs || '').match(/ALERGIAS?\s*:\s*([^\n]*)/i);
    if (!m) return null;
    var txt = m[1].replace(/[.;]\s*$/, '').trim();
    if (!txt) return { linea: m[0], personas: [], error: 'La línea ALERGIAS está vacía.' };
    var partes = txt.split(/\s+[-–—]\s+/);
    var personas = [], error = '';
    partes.forEach(function (p) {
      var lista = p.split(',').map(function (x) { return x.trim(); }).filter(Boolean).map(alergenoDeTexto).filter(Boolean);
      if (!lista.length) { error = 'Hay una persona sin alergias escritas.'; return; }
      var unicos = []; lista.forEach(function (a) { if (unicos.indexOf(a) < 0) unicos.push(a); });
      personas.push(ordenAl(unicos));
    });
    if (/\S-\S/.test(txt.replace(/\s+[-–—]\s+/g, ' | ')) && !error) error = 'Hay un guion sin espacios: revisa si separa personas.';
    return { linea: m[0], personas: personas, error: error };
  }
  function mencionaAlergias(obs) { return /alerg|intoleran|celi[aá]c|sin gluten|lactosa|vegan|vegetarian|dieta/i.test(norm(obs || '')); }

  // =====================================================================
  // EVENTOS (vienen de la app de gestión: solo lectura)
  // =====================================================================
  function eventoBloqueado(e) { return !!e && sumaDias(e.salida, MARGEN_BLOQUEO) < hoyT(); }
  function eventoPasado(e) { return e.salida < hoyT(); }
  function eventoCancelado(e) { return e.estado === 'Cancelada'; }
  function eventoConMenu(e) { return e.tipo !== 'Bloqueo' && !eventoCancelado(e); }
  function cambiosEvento(e) {
    var v = e.visto || {}, c = [];
    if (v.entrada !== e.entrada || v.salida !== e.salida) c.push('fechas ' + (v.entrada ? rango({ entrada: v.entrada, salida: v.salida }) : '¿?') + ' → ' + rango(e));
    if (v.personas !== e.personas) c.push('personas ' + v.personas + ' → ' + e.personas);
    if (v.estado !== e.estado) c.push('estado ' + (v.estado || '¿?') + ' → ' + e.estado);
    return c;
  }

  /** Comensales que salen de la línea ALERGIAS (se rehacen si cambia el texto). */
  function sincronizarComensales(e) {
    var r = leerAlergias(e.observaciones);
    if (!r || r.error) return;
    var actuales = D.comensales.filter(function (c) { return c.evento === e.id && c.origen === 'obs'; });
    var deseados = r.personas.map(function (al, i) { return { cod: String.fromCharCode(65 + i), alergias: al }; });
    var cambia = false;
    deseados.forEach(function (d) {
      var id = idComensal(e.id, d.cod), c = porId(D.comensales, id);
      if (!c) { D.comensales.push(tocar({ id: id, evento: e.id, cod: d.cod, alergias: d.alergias, origen: 'obs' })); cambia = true; }
      else if (c.borrado || c.origen !== 'obs' || JSON.stringify(c.alergias) !== JSON.stringify(d.alergias)) {
        c.alergias = d.alergias; c.origen = 'obs'; c.borrado = false; tocar(c); cambia = true;
      }
    });
    actuales.forEach(function (c) {
      if (!c.borrado && !deseados.some(function (d) { return idComensal(e.id, d.cod) === c.id; })) { c.borrado = true; tocar(c); cambia = true; }
    });
    return cambia;
  }

  /** Crea las comidas y cenas la primera vez que se ve un evento. */
  function generarServicios(e) {
    if (!eventoConMenu(e)) return false;
    if (D.servicios.some(function (s) { return s.evento === e.id; })) return false;
    var dias = difDias(e.entrada, e.salida);
    for (var i = 0; i <= dias; i++) {
      var f = sumaDias(e.entrada, i);
      if (dias === 0) { crearServicio(e.id, f, 'comida'); continue; }
      if (i > 0) crearServicio(e.id, f, 'comida');
      if (i < dias) crearServicio(e.id, f, 'cena');
    }
    return true;
  }
  function crearServicio(eid, fecha, turno) {
    var id = idServicio(eid, fecha, turno), s = porId(D.servicios, id);
    if (s) { s.borrado = false; tocar(s); return s; }
    s = tocar({ id: id, evento: eid, fecha: fecha, turno: turno, modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [], revisarEsp: false, foto: null });
    D.servicios.push(s); return s;
  }

  /** Foto fija de un servicio: así lo pasado no cambia aunque se editen los platos. */
  function fotoServicio(s) {
    var e = evento(s.evento);
    function pf(pid) { var p = plato(pid); return { id: pid, nombre: p ? p.nombre : '¿?', alergenos: p ? alergenosPlato(p) : [], familia: p ? p.familia : '' }; }
    return {
      fecha: ahora(), personas: e ? e.personas : 0, raciones: racionesGrupo(s),
      platos: CURSOS.map(function (c) { return { curso: c.id, platos: (s.platos[c.id] || []).map(pf) }; }),
      especiales: s.especiales.map(function (x) { return { comensal: x.comensal, platos: (x.platos || []).map(pf) }; })
    };
  }
  /** Revisa eventos: comensales, servicios nuevos y bloqueo de los pasados. */
  function revisarEventos() {
    var cambia = false;
    vivos(D.eventos).forEach(function (e) {
      if (sincronizarComensales(e)) cambia = true;
      if (generarServicios(e)) cambia = true;
      if (eventoBloqueado(e)) {
        serviciosDe(e.id).forEach(function (s) { if (!s.foto) { s.foto = fotoServicio(s); tocar(s); cambia = true; } });
      }
    });
    if (cambia) guardar();
  }

  // ---------- Cálculos ----------
  function platosServicio(s) {
    var r = [];
    CURSOS.forEach(function (c) { (s.platos[c.id] || []).forEach(function (id) { r.push({ curso: c.id, id: id }); }); });
    return r;
  }
  function racionesGrupo(s) {
    var e = evento(s.evento);
    return Math.max(0, (e ? e.personas : 0) - s.especiales.length);
  }
  function servicioVacio(s) { return platosServicio(s).length === 0; }
  function nombrePlato(id) { var p = plato(id); return p ? p.nombre : '¿?'; }

  /** Texto de la última vez que se sirvió un plato antes de (o en) una fecha de referencia. */
  function ultimaVez(pid, ref, excluir) {
    ref = ref || hoyT();
    var mejor = null;
    vivos(D.servicios).forEach(function (s) {
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

  /** Compra de un evento: { ingId: { total, especial } } con el margen aplicado. */
  function calcularCompra(eid) {
    var tot = {};
    function suma(pid, n, esp) {
      var p = plato(pid); if (!p || p.borrado) return;
      var marg = 1 + ((p.margen != null ? p.margen : D.meta.margen) || 0) / 100;
      p.ingredientes.forEach(function (x) {
        var t = tot[x.ing] = tot[x.ing] || { total: 0, especial: false };
        t.total += x.cant * n * (esp ? 1 : marg);
        if (esp) t.especial = true;
      });
    }
    serviciosDe(eid).forEach(function (s) {
      var n = racionesGrupo(s);
      platosServicio(s).forEach(function (x) { suma(x.id, n, false); });
      s.especiales.forEach(function (es) { (es.platos || []).forEach(function (pid) { suma(pid, 1, true); }); });
    });
    return tot;
  }
  function lineaCompra(eid, iid, crear) {
    var id = idCompra(eid, iid), c = porId(D.compras, id);
    if (c && c.borrado) {
      if (!crear) c = null;
      else { c.despensa = ''; c.ajuste = ''; c.hecho = false; c.nota = ''; c.marcaRecibida = ''; c.borrado = false; }
    }
    if (!c && crear) { c = tocar({ id: id, evento: eid, ing: iid, despensa: '', ajuste: '', hecho: false, nota: '', marcaRecibida: '' }); D.compras.push(c); }
    return c || { despensa: '', ajuste: '', hecho: false, nota: '', marcaRecibida: '' };
  }

  function usosPlato(pid) {
    return vivos(D.servicios).filter(function (s) {
      return platosServicio(s).some(function (x) { return x.id === pid; }) ||
        s.especiales.some(function (es) { return (es.platos || []).indexOf(pid) >= 0; });
    }).length;
  }
  function usosIngrediente(iid) {
    return vivos(D.platos).filter(function (p) { return p.ingredientes.some(function (x) { return x.ing === iid; }); }).length;
  }
  function familiaN(id) { var f = FAMILIAS.filter(function (x) { return x.id === id; })[0]; return f ? f.nombre : 'Sin familia'; }
  function tipoN(id) { var t = TIPOS.filter(function (x) { return x.id === id; })[0]; return t ? t.nombre : ''; }

  // =====================================================================
  // INTERFAZ BÁSICA
  // =====================================================================
  var SVG = {
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    izq: '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>',
    der: '<svg viewBox="0 0 24 24"><path d="M9 6l6 6-6 6"/></svg>',
    candado: '<svg class="candado" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    tel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>'
  };
  var estado = { vistaEv: 'lista', vistaPlatosEv: 'dias', modoDias: 'detalle', mesCal: null, diaSel: null, filtroPlatos: 'todos', famPlatos: '',
    sinAl: '', buscaPlatos: '', buscaPasados: '', periodo: 'anio', anio: null };

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
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.hidden = true; }, 2600);
  }
  function modal(tituloM, cuerpo) {
    var m = $('#modal');
    m.innerHTML = '<div class="modal-caja" role="dialog" aria-modal="true"><h2><span>' + esc(tituloM) + '</span>' +
      '<button class="quitar" aria-label="Cerrar" onclick="A.cerrar()">' + SVG.x + '</button></h2>' + cuerpo + '</div>';
    m.hidden = false;
    m.onclick = function (ev) { if (ev.target === m) cerrar(); };
    var f = $('input:not([type=checkbox]):not([type=radio]):not([type=file]), textarea', m); if (f) setTimeout(function () { f.focus(); }, 50);
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
  function recomendarCopia() { D.meta.copiaRecomendada = true; }

  // =====================================================================
  // RUTAS
  // =====================================================================
  function render() {
    cerrar();
    document.body.classList.remove('modo-cartel');
    var h = (location.hash || '#/panel').slice(2).split('/');
    var r = h[0], a = h[1] ? decodeURIComponent(h[1]) : h[1], b = h[2] ? decodeURIComponent(h[2]) : h[2];
    if (r !== 'elegir') estado.volverEleg = null;
    try {
      switch (r) {
        case 'panel': marcarMenu('panel'); vPanel(); break;
        case 'eventos': marcarMenu('eventos'); vEventos(); break;
        case 'pasados': marcarMenu('eventos'); vPasados(); break;
        case 'evento': marcarMenu('eventos'); vEvento(a); break;
        case 'servicio': marcarMenu('eventos'); vServicio(a); break;
        case 'elegir': marcarMenu('eventos'); vElegir(a, b); break;
        case 'cartel': marcarMenu('eventos'); vCartel(a); break;
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
        case 'comparar': marcarMenu('mas'); vComparar(); break;
        case 'registro': marcarMenu('mas'); vRegistro(); break;
        case 'gestor-demo': marcarMenu('mas'); vGestorDemo(a); break;
        default: ir('/panel');
      }
    } catch (err) {
      console.error(err);
      pintar('<div class="tarjeta"><b>Algo ha fallado en esta pantalla.</b><p class="sub">' + esc(err.message) +
        '</p><p class="sub">Anótalo en Más → Sugerencia o fallo.</p><button class="btn" onclick="A.ir(\'/panel\')">Volver al inicio</button></div>');
    }
  }

  // =====================================================================
  // AVISOS (los usa el Panel y la lista de eventos)
  // =====================================================================
  function listaAvisos() {
    var hoy = hoyT(), items = [];
    var pend = vivos(D.platos).filter(function (p) { return p.estado === 'pendiente'; }).length;
    var corr = vivos(D.platos).filter(function (p) { return p.estado === 'corregir'; }).length;
    if (pend) items.push({ txt: plural(pend, 'plato pendiente', 'platos pendientes') + ' de aprobar', acc: "A.filtrarPlatos('pendiente')" });
    if (corr) items.push({ txt: plural(corr, 'plato requiere', 'platos requieren') + ' corrección', acc: "A.filtrarPlatos('corregir')" });
    vivos(D.eventos).forEach(function (e) {
      if (e.salida < hoy) return;
      var cam = cambiosEvento(e);
      if (cam.length) items.push({ txt: 'El evento «' + e.grupo + '» ha cambiado en gestión: ' + cam.join(' · '), acc: "A.ir('/evento/" + jsq(e.id) + "')", fuerte: true });
      if (!eventoConMenu(e)) {
        if (eventoCancelado(e) && serviciosDe(e.id).some(function (s) { return !servicioVacio(s); })) items.push({ txt: '«' + e.grupo + '» está cancelado y tiene menús asignados', acc: "A.ir('/evento/" + jsq(e.id) + "')" });
        return;
      }
      var al = leerAlergias(e.observaciones);
      if (al && al.error) items.push({ txt: e.grupo + ': la línea ALERGIAS no se entiende (' + al.error + ')', acc: "A.ir('/evento/" + jsq(e.id) + "')", fuerte: true });
      else if (!al && mencionaAlergias(e.observaciones) && !comensalesDe(e.id).length) items.push({ txt: e.grupo + ': las observaciones hablan de alergias, pero sin la línea ALERGIAS. Revísalas.', acc: "A.ir('/evento/" + jsq(e.id) + "')", fuerte: true });
      var vac = serviciosDe(e.id).filter(servicioVacio).length;
      if (vac && difDias(hoy, e.entrada) <= 14) items.push({ txt: e.grupo + ': ' + plural(vac, 'servicio sin menú', 'servicios sin menú'), acc: "A.ir('/evento/" + jsq(e.id) + "')" });
      var fuera = serviciosDe(e.id).filter(function (s) { return s.fecha < e.entrada || s.fecha > e.salida; }).length;
      if (fuera) items.push({ txt: e.grupo + ': ' + plural(fuera, 'servicio queda', 'servicios quedan') + ' fuera de las fechas del evento', acc: "A.ir('/evento/" + jsq(e.id) + "')", fuerte: true });
    });
    vivos(D.servicios).forEach(function (s) {
      if (s.fecha < hoy) return;
      var e = evento(s.evento); if (!e) return;
      var sin = s.especiales.filter(function (es) { return !(es.platos || []).length; });
      if (sin.length) items.push({ txt: 'Ración especial sin plato: ' + e.grupo + ', ' + fechaCorta(s.fecha) + ' (' + s.turno + ')', acc: "A.ir('/servicio/" + jsq(s.id) + "')" });
      if (s.revisarEsp) items.push({ txt: 'Revisa las raciones especiales: ' + e.grupo + ', ' + fechaCorta(s.fecha) + ' (' + s.turno + '). Se cambió un plato.', acc: "A.ir('/servicio/" + jsq(s.id) + "')", fuerte: true });
      var noAprob = platosServicio(s).filter(function (x) { var p = plato(x.id); return !p || p.borrado || p.estado !== 'aprobado'; });
      if (noAprob.length) items.push({ txt: e.grupo + ', ' + fechaCorta(s.fecha) + ': hay platos no aprobados en el menú', acc: "A.ir('/servicio/" + jsq(s.id) + "')" });
    });
    vivos(D.ingredientes).forEach(function (i) {
      if (i.revisar) items.push({ txt: 'Revisa la etiqueta de «' + i.nombre + '» (alérgenos del producto comercial)', acc: "A.ir('/ingrediente/" + jsq(i.id) + "')" });
    });
    var dc = D.meta.ultimaCopia ? difDias(D.meta.ultimaCopia.slice(0, 10), hoy) : null;
    if (dc === null || dc > 7) items.push({ txt: dc === null ? 'Aún no has guardado ninguna copia de seguridad' : 'La última copia de seguridad es de hace ' + dc + ' días', acc: 'A.copia()', fuerte: true });
    else if (D.meta.copiaRecomendada) items.push({ txt: 'Hay cambios importantes desde la última copia: guarda una', acc: 'A.copia()' });
    return items;
  }
  function htmlAvisos(items) {
    if (!items.length) return '';
    return '<div class="avisos">' + items.map(function (i) {
      return '<button onclick="' + i.acc + '"' + (i.fuerte ? ' class="fuerte"' : '') + '>⚠︎ <span>' + esc(i.txt) + '</span></button>';
    }).join('') + '</div>';
  }

  // =====================================================================
  // EVENTOS
  // =====================================================================
  function etiquetasEvento(e) {
    var t = '';
    if (eventoCancelado(e)) t += '<span class="etiqueta corregir">Cancelado</span> ';
    else if (e.estado === 'Provisional') t += '<span class="etiqueta pendiente">Provisional</span> ';
    if (e.tipo && e.tipo !== 'Alojamiento') t += '<span class="etiqueta borrador">' + esc(e.tipo) + '</span> ';
    if (eventoBloqueado(e)) t += '<span class="etiqueta borrador">Cerrado</span> ';
    else if (e.salida < hoyT()) t += '<span class="etiqueta pendiente">Margen para corregir</span> ';
    else if (e.entrada <= hoyT()) t += '<span class="etiqueta">En curso</span> ';
    if (cambiosEvento(e).length && e.salida >= hoyT()) t += '<span class="etiqueta corregir">Ha cambiado</span> ';
    return t;
  }
  function tarjetaEvento(e) {
    var d = fechaD(e.entrada);
    var servs = serviciosDe(e.id);
    var vac = servs.filter(servicioVacio).length;
    var com = comensalesDe(e.id).length;
    return '<button class="reserva' + (eventoPasado(e) || eventoCancelado(e) ? ' pasada' : '') + '" onclick="A.ir(\'/evento/' + jsq(e.id) + '\')">' +
      '<div class="fecha"><span class="d">' + d.getDate() + '</span><span class="m">' + MESES_C[d.getMonth()] + '</span></div>' +
      '<div class="info"><b>' + esc(e.grupo) + '</b><div>' + etiquetasEvento(e) + '</div><div class="sub">' + rango(e) + ' · ' + e.personas + ' personas</div>' +
      (eventoConMenu(e) ? '<div class="sub">' + servs.length + ' servicios' + (com ? ' · ' + com + ' con alergias' : '') +
      (vac ? ' · <span class="ambar">' + vac + ' sin menú</span>' : '') + '</div>' : '') + '</div></button>';
  }

  function vEventos() {
    titulo('Eventos');
    var hoy = hoyT();
    var seg = '<div class="segmento"><button class="' + (estado.vistaEv === 'lista' ? 'activo' : '') + '" onclick="A.vistaEv(\'lista\')">Lista</button>' +
      '<button class="' + (estado.vistaEv === 'cal' ? 'activo' : '') + '" onclick="A.vistaEv(\'cal\')">Calendario</button></div>';
    if (estado.vistaEv === 'cal') { pintar(seg + calendario()); return; }
    var ord = vivos(D.eventos).filter(function (e) { return e.tipo !== 'Bloqueo'; }).sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; });
    var curso = ord.filter(function (e) { return e.entrada <= hoy && e.salida >= hoy; });
    var prox = ord.filter(function (e) { return e.entrada > hoy; });
    var margen = ord.filter(function (e) { return e.salida < hoy && !eventoBloqueado(e); });
    var pas = ord.filter(function (e) { return eventoBloqueado(e); });
    var html = seg + '<p class="sub peq">Los eventos vienen de la app de gestión y no se modifican aquí. Si algún dato está mal, avisa por teléfono.</p>';
    if (curso.length) html += '<h3>En curso</h3>' + curso.map(tarjetaEvento).join('');
    html += '<h3>Próximos</h3>' + (prox.length ? prox.map(tarjetaEvento).join('') : '<div class="vacio">No hay eventos próximos.</div>');
    if (margen.length) html += '<h3>Recién terminados · aún se puede corregir lo servido</h3>' + margen.map(tarjetaEvento).join('');
    html += '<button class="btn borde ancho" onclick="A.ir(\'/pasados\')">Ver eventos pasados (' + pas.length + ')</button>';
    pintar(html);
  }

  function vPasados() {
    titulo('Eventos pasados', '/eventos');
    var html = '<input class="entrada" id="buscaPas" placeholder="Buscar por grupo o fecha (2026-10)…" value="' + esc(estado.buscaPasados) + '" style="margin-bottom:10px">' +
      '<p class="sub peq">Solo para consultar: los eventos cerrados no se pueden modificar. Se ve lo que se sirvió tal como quedó.</p><div id="listaPas"></div>';
    pintar(html);
    function lista() {
      var q = norm(estado.buscaPasados);
      var ps = vivos(D.eventos).filter(function (e) { return eventoBloqueado(e) && e.tipo !== 'Bloqueo' && (!q || norm(e.grupo).indexOf(q) >= 0 || e.entrada.indexOf(q) >= 0); })
        .sort(function (a, b) { return a.entrada < b.entrada ? 1 : -1; });
      $('#listaPas').innerHTML = ps.length ? ps.map(tarjetaEvento).join('') : '<div class="vacio">No hay eventos pasados con ese filtro.</div>';
    }
    lista();
    $('#buscaPas').oninput = function () { estado.buscaPasados = this.value; lista(); };
  }

  function calendario() {
    var hoy = hoyT();
    if (!estado.mesCal) {
      estado.mesCal = hoy.slice(0, 7) + '-01';
      estado.diaSel = estado.diaSel || hoy;
    }
    var m = fechaD(estado.mesCal);
    var primero = new Date(m.getFullYear(), m.getMonth(), 1);
    var desfase = (primero.getDay() + 6) % 7;
    var inicio = new Date(primero); inicio.setDate(1 - desfase);
    var porDia = {};
    vivos(D.servicios).forEach(function (s) { var e = evento(s.evento); if (e && eventoConMenu(e)) (porDia[s.fecha] = porDia[s.fecha] || []).push(s); });
    var celdas = '';
    for (var i = 0; i < 42; i++) {
      var d = new Date(inicio); d.setDate(inicio.getDate() + i);
      var t = fechaT(d);
      var servs = porDia[t] || [];
      var cls = 'dia' + (d.getMonth() !== m.getMonth() ? ' fuera' : '') + (servs.length ? ' ocupado' : '') + (t < hoy ? ' pasado' : '') + (t === hoy ? ' hoy' : '') + (t === estado.diaSel ? ' sel' : '');
      celdas += '<button class="' + cls + '" onclick="A.diaSel(\'' + t + '\')"><span class="n">' + d.getDate() + '</span>' +
        (servs.length ? '<span class="r">' + servs.length + ' serv.</span>' : '') + '</button>';
      if (i === 34 && d.getMonth() !== m.getMonth()) break;
    }
    var html = '<div class="tarjeta"><div class="mes-cab"><button class="icono" aria-label="Mes anterior" onclick="A.mes(-1)">' + SVG.izq + '</button>' +
      '<h2>' + cap(MESES[m.getMonth()]) + ' ' + m.getFullYear() + '</h2><button class="icono" aria-label="Mes siguiente" onclick="A.mes(1)">' + SVG.der + '</button></div>' +
      '<div class="dias-sem"><div>L</div><div>M</div><div>X</div><div>J</div><div>V</div><div>S</div><div>D</div></div><div class="rejilla">' + celdas + '</div>' +
      '<p class="sub peq" style="margin:8px 0 0">Los días pasados salen en gris: solo para consultar.</p></div>';
    html += diaDetalle(estado.diaSel);
    return html;
  }

  /** Platos de un servicio para mostrar: los actuales o la foto fija si el evento está cerrado. */
  function vistaServicio(s) {
    var e = evento(s.evento);
    if (s.foto && eventoBloqueado(e)) {
      return { cerrado: true, raciones: s.foto.raciones,
        filas: [].concat.apply([], s.foto.platos.map(function (c) { return c.platos.map(function (p) { return { curso: c.curso, id: p.id, nombre: p.nombre, alergenos: p.alergenos, familia: p.familia }; }); })),
        especiales: s.foto.especiales.map(function (x) { return { comensal: x.comensal, platos: x.platos }; }) };
    }
    return { cerrado: false, raciones: racionesGrupo(s),
      filas: platosServicio(s).map(function (x) { var p = plato(x.id); return { curso: x.curso, id: x.id, nombre: p ? p.nombre : '¿?', alergenos: p ? alergenosPlato(p) : [], familia: p ? p.familia : '', estado: p ? p.estado : '' }; }),
      especiales: s.especiales.map(function (x) { return { comensal: x.comensal, platos: (x.platos || []).map(function (pid) { var p = plato(pid); return { id: pid, nombre: p ? p.nombre : '¿?', alergenos: p ? alergenosPlato(p) : [] }; }) }; }) };
  }

  function diaDetalle(t) {
    if (!t) return '';
    var servs = vivos(D.servicios).filter(function (s) { var e = evento(s.evento); return s.fecha === t && e && eventoConMenu(e); });
    var html = '<h3>' + cap(fechaLarga(t)) + '</h3>';
    if (!servs.length) return html + '<div class="vacio">No hay servicios este día.</div>';
    ['comida', 'cena'].forEach(function (turno) {
      var ss = servs.filter(function (s) { return s.turno === turno; });
      if (!ss.length) return;
      var total = 0;
      var cuerpo = ss.map(function (s) {
        var e = evento(s.evento), v = vistaServicio(s);
        total += e.personas;
        var filas = v.filas.map(function (x) {
          return '<div class="fila"><span class="izq">' + esc(x.nombre) + ' ' + iconosDe(x.alergenos, 'p') + '</span><span class="der">' + v.raciones + '</span></div>';
        }).join('');
        if (!filas) filas = '<div class="fila"><span class="izq sub">Sin menú asignado</span></div>';
        if (v.especiales.length) filas += '<div class="fila especial"><span class="izq">Raciones especiales (' + v.especiales.map(function (x) { return x.comensal; }).join(', ') + ')</span><span class="der">' + v.especiales.length + '</span></div>';
        return '<div class="fila toca" onclick="A.ir(\'/servicio/' + jsq(s.id) + '\')" style="border:0;padding-bottom:2px"><b class="izq">' + esc(e.grupo) + ' · ' + e.personas + ' pers.</b>' +
          (s.modalidad ? '<span class="etiqueta modalidad">' + esc(s.modalidad) + '</span>' : '') + '</div>' + filas;
      }).join('<div style="height:8px"></div>');
      html += '<div class="tarjeta fina"><div class="servicio-cab"><b>' + turnoN(turno) + '</b>' +
        (ss.length > 1 ? '<span class="sub">Total: ' + total + ' raciones</span>' : '') + '</div>' + cuerpo + '</div>';
    });
    return html;
  }

  // ---------- Ficha de un evento ----------
  function vEvento(id) {
    var e = evento(id);
    if (!e) { ir('/eventos'); return; }
    titulo(e.grupo, eventoBloqueado(e) ? '/pasados' : '/eventos');
    var bloq = eventoBloqueado(e);
    var tel = (window.CONFIG && CONFIG.TELEFONO_AVISO) || '';
    var html = '<div class="tarjeta"><div class="servicio-cab"><b>' + esc(e.grupo) + '</b><span class="solo-lectura">' + SVG.candado + ' De gestión</span></div>' +
      '<div>' + etiquetasEvento(e) + '</div>' +
      '<div class="sub">' + cap(fechaLarga(e.entrada)) + (e.salida !== e.entrada ? ' → ' + fechaLarga(e.salida) : '') + '</div>' +
      '<div class="sub"><b style="color:var(--texto)">' + e.personas + ' personas</b>' + (e.tipo ? ' · ' + esc(e.tipo) : '') + '</div>' +
      (e.observaciones ? '<div class="obs"><span class="sub peq">Observaciones</span><br>' + esc(e.observaciones) + '</div>' : '') +
      '<div class="sub peq" style="margin-top:8px">Código del evento: <b>' + esc(e.gestorId || e.id) + '</b>. ¿Algún dato mal? ' +
      (tel ? '<a class="btn mini sec" href="tel:' + esc(tel) + '">' + SVG.tel + ' Llamar a gestión</a>' : 'Avisa por teléfono a gestión.') + '</div></div>';

    var cam = cambiosEvento(e);
    if (cam.length) html += '<div class="avisos"><b>⚠︎ Ha cambiado en gestión:</b> ' + esc(cam.join(' · ')) +
      '<div class="sub peq" style="color:inherit">Revisa los servicios y las raciones.</div><button class="btn mini" style="margin-top:6px" onclick="A.vistoEvento(\'' + jsq(e.id) + '\')">Entendido</button></div>';
    if (eventoCancelado(e)) html += '<div class="avisos">Este evento está <b>cancelado</b> en gestión. No hace falta preparar menús.</div>';
    if (bloq) html += '<div class="avisos gris">' + SVG.candado + ' Evento cerrado: solo consulta. Se muestra lo que se sirvió tal como quedó.</div>';
    else if (eventoPasado(e)) html += '<div class="avisos">Este evento terminó el ' + fechaCorta(e.salida) + '. Hasta el ' + fechaCorta(sumaDias(e.salida, MARGEN_BLOQUEO)) + ' puedes corregir lo que se sirvió de verdad; después se cierra.</div>';

    // Alergias
    var al = leerAlergias(e.observaciones), com = comensalesDe(e.id);
    html += '<h3>Comensales con alergias (anónimos)</h3><div class="tarjeta fina">';
    if (al && !al.error) html += '<p class="sub peq" style="margin:4px 0 6px">Leídas de las observaciones de gestión: <code>' + esc(al.linea) + '</code></p>';
    else if (al && al.error) html += '<p class="error-txt" style="margin:4px 0 6px">La línea <code>' + esc(al.linea) + '</code> no se entiende: ' + esc(al.error) + ' Pide a gestión que la corrija o apúntalas a mano.</p>';
    else if (mencionaAlergias(e.observaciones)) html += '<p class="error-txt" style="margin:4px 0 6px">Las observaciones hablan de alergias, pero no tienen la línea <code>ALERGIAS: …</code>. Apúntalas a mano o pide a gestión que la añada.</p>';
    html += com.length ? com.map(function (c) {
      var manual = c.origen !== 'obs';
      return '<div class="fila' + (manual && !bloq ? ' toca" onclick="A.editarComensal(\'' + jsq(e.id) + '\',\'' + jsq(c.id) + '\')' : '') + '"><span class="izq"><b>' + esc(c.cod) + '</b> · ' + esc(nombresAl(c.alergias) || 'sin indicar') +
        (manual ? ' <span class="etiqueta borrador">a mano</span>' : '') + '</span><span>' + iconosDe(c.alergias, 'p') + '</span></div>';
    }).join('') : '<p class="sub" style="margin:6px 0">Nadie con alergias en este grupo.</p>';
    if (!bloq && !(al && !al.error)) html += '<button class="enlace" onclick="A.editarComensal(\'' + jsq(e.id) + '\',\'\')">+ Apuntar comensal con alergias a mano</button>';
    html += '</div>';

    if (!eventoConMenu(e)) { pintar(html); return; }

    // Vistas de los platos
    html += '<h3>Menú del evento</h3><div class="segmento"><button class="' + (estado.vistaPlatosEv === 'dias' ? 'activo' : '') + '" onclick="A.vistaPlatosEv(\'dias\')">Por días</button>' +
      '<button class="' + (estado.vistaPlatosEv === 'familias' ? 'activo' : '') + '" onclick="A.vistaPlatosEv(\'familias\')">Por familias</button></div>';
    html += estado.vistaPlatosEv === 'familias' ? vistaFamilias(e) : vistaDias(e);

    if (!bloq) html += '<button class="enlace" onclick="A.nuevoServicio(\'' + jsq(e.id) + '\')">+ Añadir comida o cena</button>';
    html += '<div class="fila-btns"><button class="btn" onclick="A.ir(\'/cartel/' + jsq(e.id) + '\')">Cartel para la puerta</button>' +
      '<button class="btn sec" onclick="A.ir(\'/compras/' + jsq(e.id) + '\')">Lista de la compra</button></div>';
    pintar(html);
  }

  function vistaDias(e) {
    var bloq = eventoBloqueado(e);
    var html = '<div class="segmento peq"><button class="' + (estado.modoDias === 'detalle' ? 'activo' : '') + '" onclick="A.modoDias(\'detalle\')">Detalle</button>' +
      '<button class="' + (estado.modoDias === 'lista' ? 'activo' : '') + '" onclick="A.modoDias(\'lista\')">Lista</button></div>';
    var servs = serviciosDe(e.id);
    if (!servs.length) return html + '<div class="vacio">Sin comidas ni cenas.</div>';
    var diaAnt = '';
    if (estado.modoDias === 'lista') {
      html += '<div class="tarjeta fina lista-dias">';
      servs.forEach(function (s) {
        if (s.fecha !== diaAnt) { html += '<div class="dia-l">' + cap(fechaLarga(s.fecha)) + '</div>'; diaAnt = s.fecha; }
        var v = vistaServicio(s);
        html += '<div class="serv-l"><span class="turno-l">' + turnoN(s.turno) + '</span><span class="platos-l">' + (v.filas.length ? v.filas.map(function (x, k) {
          var c = CURSOS.filter(function (cc) { return cc.id === x.curso; })[0];
          return '<button class="plato-l" ' + (bloq ? 'disabled' : 'onclick="A.tocarPlato(\'' + jsq(s.id) + '\',\'' + x.curso + '\',\'' + jsq(x.id) + '\')"') + '><span class="sub">' + c.corto + '</span> ' + esc(x.nombre) + '</button>';
        }).join('') : '<button class="plato-l ambar" onclick="A.ir(\'/servicio/' + jsq(s.id) + '\')">Sin menú · asignar</button>') + '</span></div>';
      });
      return html + '</div><p class="sub peq">Toca un plato para cambiarlo o quitarlo.</p>';
    }
    servs.forEach(function (s) {
      if (s.fecha !== diaAnt) { html += '<div class="dia-titulo">' + cap(fechaLarga(s.fecha)) + '</div>'; diaAnt = s.fecha; }
      var v = vistaServicio(s);
      var filas = v.filas.map(function (x) {
        var c = CURSOS.filter(function (cc) { return cc.id === x.curso; })[0];
        return '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br>' + esc(x.nombre) + ' ' + iconosDe(x.alergenos, 'p') +
          (x.estado && x.estado !== 'aprobado' ? ' <span class="etiqueta pendiente">no aprobado</span>' : '') + '</span><span class="der">' + v.raciones + '</span></div>';
      }).join('');
      if (!filas) filas = '<div class="fila"><span class="izq ambar">Sin menú · toca para asignar</span></div>';
      v.especiales.forEach(function (es) {
        filas += '<div class="fila especial"><span class="izq">' + esc(es.comensal) + ' → ' + esc(es.platos.length ? es.platos.map(function (p) { return p.nombre; }).join(', ') : 'sin asignar') + '</span><span class="der">1</span></div>';
      });
      html += '<div class="tarjeta fina toca" onclick="A.ir(\'/servicio/' + jsq(s.id) + '\')"><div class="servicio-cab"><b>' + turnoN(s.turno) + '</b>' +
        (s.modalidad ? '<span class="etiqueta modalidad">' + esc(s.modalidad) + '</span>' : '') + (s.revisarEsp ? '<span class="etiqueta corregir">revisar raciones especiales</span>' : '') + '</div>' + filas + '</div>';
    });
    return html;
  }

  function vistaFamilias(e) {
    var bloq = eventoBloqueado(e);
    var grupos = {}, usos = {};
    var servs = serviciosDe(e.id);
    servs.forEach(function (s) {
      vistaServicio(s).filas.forEach(function (x) {
        var f = x.familia || '';
        (grupos[f] = grupos[f] || []).push({ s: s, x: x });
        usos[x.id] = (usos[x.id] || 0) + 1;
      });
    });
    // Avisos de equilibrio y repetición
    var av = [];
    FAM_PRINCIPALES.forEach(function (f) { if (!grupos[f]) av.push('Ningún plato de ' + familiaN(f).toLowerCase()); });
    Object.keys(usos).forEach(function (pid) { if (usos[pid] > 1 && !/fruta/i.test(nombrePlato(pid))) av.push('«' + nombrePlato(pid) + '» se repite ' + usos[pid] + ' veces'); });
    for (var i = 1; i < servs.length; i++) {
      var a = vistaServicio(servs[i - 1]).filas.filter(function (x) { return x.curso === 'segundo'; }).map(function (x) { return x.familia; });
      var b = vistaServicio(servs[i]).filas.filter(function (x) { return x.curso === 'segundo'; }).map(function (x) { return x.familia; });
      a.forEach(function (f) { if (f && b.indexOf(f) >= 0) av.push(familiaN(f) + ' de segundo en dos servicios seguidos (' + fechaCorta(servs[i - 1].fecha) + ' ' + servs[i - 1].turno + ' y ' + fechaCorta(servs[i].fecha) + ' ' + servs[i].turno + ')'); });
    }
    var html = '<div class="tarjeta fina"><div class="chips">' + FAMILIAS.concat([{ id: '', nombre: 'Sin familia' }]).filter(function (f) { return grupos[f.id] || FAM_PRINCIPALES.indexOf(f.id) >= 0; }).map(function (f) {
      var n = (grupos[f.id] || []).length;
      return '<span class="chip' + (n ? '' : ' cero') + '">' + esc(f.nombre) + ' <b>' + n + '</b></span>';
    }).join('') + '</div></div>';
    if (av.length) html += '<div class="avisos">' + av.map(function (t) { return '<div>⚠︎ ' + esc(t) + '</div>'; }).join('') + '</div>';
    FAMILIAS.concat([{ id: '', nombre: 'Sin familia' }]).forEach(function (f) {
      var g = grupos[f.id]; if (!g) return;
      html += '<h3>' + esc(f.nombre) + ' · ' + g.length + '</h3><div class="tarjeta fina">' + g.map(function (y) {
        var c = CURSOS.filter(function (cc) { return cc.id === y.x.curso; })[0];
        return '<div class="fila' + (bloq ? '' : ' toca" onclick="A.tocarPlato(\'' + jsq(y.s.id) + '\',\'' + y.x.curso + '\',\'' + jsq(y.x.id) + '\')') + '"><span class="izq">' + esc(y.x.nombre) + ' ' + iconosDe(y.x.alergenos, 'p') +
          '<br><span class="sub peq">' + cap(fechaCorta(y.s.fecha)) + ' · ' + y.s.turno + ' · ' + c.nombre.toLowerCase() + '</span></span></div>';
      }).join('') + '</div>';
    });
    if (!Object.keys(grupos).length) html += '<div class="vacio">Todavía no hay platos asignados.</div>';
    else if (!bloq) html += '<p class="sub peq">Toca un plato para cambiarlo por otro en su servicio. La familia es un dato del plato (se cambia en su ficha).</p>';
    return html;
  }

  function tocarPlato(sid, curso, pid) {
    var s = servicio(sid);
    modal(nombrePlato(pid), '<p class="sub">' + cap(fechaCorta(s.fecha)) + ' · ' + s.turno + ' · ' + curso + '</p>' +
      '<div class="fila-btns"><button class="btn" onclick="A.cerrar();A.volverEleg(\'/evento/' + jsq(s.evento) + '\');A.ir(\'/elegir/' + jsq(sid) + '/' + curso + '~' + jsq(pid) + '\')">Cambiar por otro</button>' +
      '<button class="btn peligro" onclick="A.quitarPlatoId(\'' + jsq(sid) + '\',\'' + curso + '\',\'' + jsq(pid) + '\')">Quitar</button></div>' +
      '<button class="btn borde ancho" style="margin-top:10px" onclick="A.cerrar();A.ir(\'/servicio/' + jsq(sid) + '\')">Abrir el servicio</button>');
  }
  /** Al cambiar o quitar un plato de un servicio con raciones especiales, se pide revisarlas. */
  function marcarRevisionEsp(s) {
    if (s.especiales.length) { s.revisarEsp = true; toast('El servicio tiene raciones especiales (' + s.especiales.map(function (x) { return x.comensal; }).join(', ') + '): revísalas'); }
  }

  function nuevoServicio(eid) {
    var e = evento(eid), ops = '';
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
      if (servicio(idServicio(eid, f, t))) { var x = $('#nsError'); x.textContent = 'Ese servicio ya existe.'; x.hidden = false; return; }
      var s = crearServicio(eid, f, t); guardar(); cerrar(); ir('/servicio/' + s.id);
    };
  }

  function editarComensal(eid, cid) {
    var e = evento(eid), c = cid ? porId(D.comensales, cid) : null;
    var sel = c ? c.alergias.slice() : [];
    var cod = c ? c.cod : (function () { var usados = comensalesDe(eid).map(function (x) { return x.cod; }); for (var k = 0; k < 26; k++) { var l = String.fromCharCode(65 + k); if (usados.indexOf(l) < 0) return l; } return 'Z1'; })();
    function cuerpo() {
      return '<p class="sub peq">Siempre anónimo: solo una letra. Nada de nombres.</p><label class="campo"><span>Código</span><input class="entrada" id="cCod" value="' + esc(cod) + '" maxlength="3" ' + (c ? 'disabled' : '') + '></label>' +
        '<label class="campo"><span>Alergias o intolerancias</span></label>' + selectorAl(sel, 'A.togAlCom') +
        '<button class="enlace" onclick="A.nuevoPropio(\'com\')">+ Otra alergia que no está en la lista</button>' +
        '<p class="error-txt" id="cError" hidden></p>' +
        '<div class="fila-btns">' + (c ? '<button class="btn peligro" id="cBorrar">Quitar</button>' : '') + '<button class="btn" id="cOk">Guardar</button></div>';
    }
    A._com = { sel: sel, guardaCod: function () { var x = $('#cCod'); if (x) cod = x.value; },
      repintar: function () { modal(c ? 'Comensal ' + c.cod : 'Nuevo comensal', cuerpo()); enlazar(); } };
    function enlazar() {
      $('#cOk').onclick = function () {
        var v = c ? c.cod : $('#cCod').value.trim().toUpperCase();
        var x = $('#cError');
        if (!/^[A-Z][0-9]?$/.test(v)) { x.textContent = 'Pon una letra (A, B, C…).'; x.hidden = false; return; }
        if (!c && comensalesDe(eid).some(function (o) { return o.cod === v; })) { x.textContent = 'Ese código ya existe en el grupo.'; x.hidden = false; return; }
        if (!sel.length) { x.textContent = 'Marca al menos una alergia.'; x.hidden = false; return; }
        if (c) { c.alergias = ordenAl(sel); tocar(c); }
        else {
          var id = idComensal(eid, v), ex = porId(D.comensales, id);
          if (ex) { ex.alergias = ordenAl(sel); ex.borrado = false; ex.origen = 'manual'; tocar(ex); }
          else D.comensales.push(tocar({ id: id, evento: eid, cod: v, alergias: ordenAl(sel), origen: 'manual' }));
        }
        guardar(); cerrar(); render();
      };
      if (c) $('#cBorrar').onclick = function () {
        c.borrado = true; tocar(c);
        serviciosDe(eid).forEach(function (s) { var n = s.especiales.length; s.especiales = s.especiales.filter(function (es) { return es.comensal !== c.cod; }); if (n !== s.especiales.length) tocar(s); });
        guardar(); cerrar(); render(); toast('Comensal quitado');
      };
    }
    modal(c ? 'Comensal ' + c.cod : 'Nuevo comensal', cuerpo()); enlazar();
  }

  function selectorAl(sel, fn) {
    return '<div class="sel-al">' + todosAlergenos().map(function (a) {
      return '<button type="button" class="' + (sel.indexOf(a) >= 0 ? 'activo' : '') + '" onclick="' + fn + '(\'' + jsq(a) + '\', this)">' + AL.icono(a) + '<span>' + esc(AL.info(a).nombre) + '</span></button>';
    }).join('') + '</div>';
  }
  function togSel(lista, a, btn) {
    var i = lista.indexOf(a);
    if (i >= 0) lista.splice(i, 1); else lista.push(a);
    btn.classList.toggle('activo', i < 0);
  }
  function nuevoPropio(origen) {
    if (origen === 'com') A._com.guardaCod();
    var volver = origen === 'com' ? function () { A._com.repintar(); } : function () { A._ing.repintar(); };
    pedirTexto('Otra alergia o intolerancia', 'Nombre (por ejemplo, Kiwi)', '', function (nombre) {
      var id = 'p:' + cap(nombre);
      if (D.propios.indexOf(id) < 0) D.propios.push(id);
      guardar();
      if (origen === 'com') { if (A._com.sel.indexOf(id) < 0) A._com.sel.push(id); A._com.repintar(); }
      else { if (A._ing.sel.indexOf(id) < 0) A._ing.sel.push(id); A._ing.repintar(); }
    }, volver);
  }

  // =====================================================================
  // SERVICIO (asignar menú)
  // =====================================================================
  function vServicio(id) {
    var s = servicio(id);
    if (!s) { ir('/eventos'); return; }
    var e = evento(s.evento);
    if (!e) { ir('/eventos'); return; }
    titulo(cap(fechaCorta(s.fecha)) + ' · ' + turnoN(s.turno), '/evento/' + e.id);
    if (eventoBloqueado(e)) { vServicioCerrado(s, e); return; }
    var n = racionesGrupo(s);
    var mods = D.modalidades.slice();
    if (s.modalidad && mods.indexOf(s.modalidad) < 0) mods.push(s.modalidad);
    var html = '<div class="sub" style="margin-bottom:10px">' + esc(e.grupo) + ' · ' + e.personas + ' personas' + (eventoPasado(e) ? ' · <b>corrigiendo lo que se sirvió</b>' : '') + '</div>';
    if (s.fecha < e.entrada || s.fecha > e.salida) html += '<div class="avisos fuerte">⚠︎ Este servicio queda fuera de las fechas del evento (' + rango(e) + '). Revísalo o elimínalo.</div>';
    if (s.revisarEsp) html += '<div class="avisos"><b>⚠︎ Se cambió un plato:</b> revisa que las raciones especiales siguen siendo correctas.<br><button class="btn mini" style="margin-top:6px" onclick="A.espRevisadas(\'' + jsq(s.id) + '\')">Ya están revisadas</button></div>';
    html += '<div class="tarjeta"><h2>Modalidad del grupo</h2><div class="chips">' + mods.map(function (m) {
      return '<button class="chip' + (s.modalidad === m ? ' activo' : '') + '" onclick="A.modalidad(\'' + jsq(s.id) + '\',\'' + jsq(m) + '\')">' + esc(m) + '</button>';
    }).join('') + '<button class="chip" onclick="A.otraModalidad(\'' + jsq(s.id) + '\')">+ Otra</button></div></div>';

    var menus = vivos(D.menus);
    if (menus.length) {
      html += '<div class="tarjeta fina"><div class="sub" style="margin-bottom:6px">Atajo: usar un menú guardado</div><div class="chips">' +
        menus.map(function (m) { return '<button class="chip" onclick="A.aplicarMenu(\'' + jsq(s.id) + '\',\'' + jsq(m.id) + '\')">' + esc(m.nombre) + '</button>'; }).join('') + '</div></div>';
    }

    html += '<h3>Platos · ' + n + ' raciones</h3><div class="tarjeta fina">';
    CURSOS.forEach(function (c) {
      var lista = s.platos[c.id] || [];
      lista.forEach(function (pid) {
        var p = plato(pid);
        html += '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br>' + esc(p ? p.nombre : '¿?') + ' ' + (p ? iconosPlato(p, 'p') : '') +
          (p && p.estado !== 'aprobado' ? ' <span class="etiqueta pendiente">no aprobado</span>' : '') + '</span>' +
          '<button class="enlace" style="padding:4px 8px" onclick="A.ir(\'/elegir/' + jsq(s.id) + '/' + c.id + '~' + jsq(pid) + '\')">Cambiar</button>' +
          '<button class="quitar" aria-label="Quitar" onclick="A.quitarPlatoId(\'' + jsq(s.id) + '\',\'' + c.id + '\',\'' + jsq(pid) + '\')">' + SVG.x + '</button></div>';
      });
      html += '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br><button class="enlace" style="padding:2px 0" onclick="A.ir(\'/elegir/' + jsq(s.id) + '/' + c.id + '\')">+ Elegir ' + c.nombre.toLowerCase() + (lista.length ? ' (otro)' : '') + '</button></span></div>';
    });
    html += '</div>';

    var com = comensalesDe(e.id);
    html += '<h3>Alergias del grupo</h3><div class="tarjeta fina">';
    if (!com.length) html += '<p class="sub" style="margin:6px 0">Nadie con alergias en este grupo.</p>';
    com.forEach(function (c) {
      var choca = platosServicio(s).filter(function (x) { var p = plato(x.id); return p && alergenosPlato(p).some(function (a) { return c.alergias.indexOf(a) >= 0; }); });
      html += '<div class="fila"><span class="izq"><b>' + esc(c.cod) + '</b> · ' + esc(nombresAl(c.alergias)) +
        (choca.length ? '<br><span class="sub peq" style="color:var(--error)">No puede comer: ' + esc(choca.map(function (x) { return nombrePlato(x.id); }).join(', ')) + '</span>' : '') + '</span>' + iconosDe(c.alergias, 'p') + '</div>';
    });
    if (s.especiales.length) {
      html += '<div class="sub" style="margin-top:10px;font-weight:600">Raciones especiales en este servicio</div>';
      s.especiales.forEach(function (es, i) {
        var ps = (es.platos || []).map(function (pid) { var p = plato(pid); return p ? esc(p.nombre) + ' ' + iconosPlato(p, 'p') : '¿?'; });
        html += '<div class="fila especial"><span class="izq"><b>' + esc(es.comensal) + '</b> → ' + (ps.length ? ps.join(' · ') : '<i>sin plato</i>') +
          '<br><button class="enlace" style="padding:2px 0" onclick="A.ir(\'/elegir/' + jsq(s.id) + '/esp-' + encodeURIComponent(es.comensal) + '\')">+ Añadir plato</button>' +
          (ps.length ? ' <button class="enlace" style="padding:2px 0;margin-left:10px;color:var(--texto-2)" onclick="A.vaciarEsp(\'' + jsq(s.id) + '\',' + i + ')">Vaciar</button>' : '') + '</span>' +
          '<button class="quitar" aria-label="Quitar ración especial" onclick="A.quitarEsp(\'' + jsq(s.id) + '\',' + i + ')">' + SVG.x + '</button></div>';
      });
    }
    var libres = com.filter(function (c) { return !s.especiales.some(function (es) { return es.comensal === c.cod; }); });
    if (libres.length) html += '<button class="enlace" onclick="A.nuevaEsp(\'' + jsq(s.id) + '\')">+ Ración especial</button>';
    html += '<p class="sub peq" style="margin:6px 0 0">Si un comensal puede comer el menú del grupo, no hagas nada.</p></div>';

    html += '<div class="tarjeta fina"><div class="fila"><span class="izq">Menú del grupo</span><span class="der">' + n + '</span></div>' +
      '<div class="fila especial"><span class="izq">Raciones especiales</span><span class="der">' + s.especiales.length + '</span></div>' +
      '<div class="fila"><b class="izq">Total</b><b class="der">' + e.personas + '</b></div></div>';

    html += '<button class="btn ancho" onclick="A.listoServicio(\'' + jsq(s.id) + '\')">Listo</button>' +
      '<div class="fila-btns"><button class="btn sec" onclick="A.guardarMenu(\'' + jsq(s.id) + '\')">Guardar como menú</button>' +
      '<button class="btn peligro" onclick="A.borrarServicio(\'' + jsq(s.id) + '\')">Eliminar servicio</button></div>' +
      '<p class="sub peq" style="text-align:center">Los cambios se guardan solos.</p>';
    pintar(html);
  }

  function vServicioCerrado(s, e) {
    var v = vistaServicio(s);
    var html = '<div class="avisos gris">' + SVG.candado + ' Evento cerrado: así se sirvió. No se puede modificar.' + (s.foto ? '<br><span class="sub peq">Foto fija del ' + momento(s.foto.fecha) + '.</span>' : '') + '</div>';
    html += '<div class="sub" style="margin-bottom:10px">' + esc(e.grupo) + ' · ' + e.personas + ' personas' + (s.modalidad ? ' · ' + esc(s.modalidad) : '') + '</div>';
    html += '<div class="tarjeta fina">' + (v.filas.length ? v.filas.map(function (x) {
      var c = CURSOS.filter(function (cc) { return cc.id === x.curso; })[0];
      return '<div class="fila"><span class="izq"><span class="curso">' + c.nombre + '</span><br>' + esc(x.nombre) + ' ' + iconosDe(x.alergenos, 'p') + '</span><span class="der">' + v.raciones + '</span></div>';
    }).join('') : '<p class="sub">Sin menú.</p>') + '</div>';
    if (v.especiales.length) html += '<h3>Raciones especiales</h3><div class="tarjeta fina">' + v.especiales.map(function (es) {
      return '<div class="fila especial"><span class="izq"><b>' + esc(es.comensal) + '</b> → ' + es.platos.map(function (p) { return esc(p.nombre) + ' ' + iconosDe(p.alergenos, 'p'); }).join(' · ') + '</span><span class="der">1</span></div>';
    }).join('') + '</div>';
    pintar(html);
  }

  function nuevaEsp(sid) {
    var s = servicio(sid);
    var libres = comensalesDe(s.evento).filter(function (c) { return !s.especiales.some(function (es) { return es.comensal === c.cod; }); });
    modal('Ración especial', '<p class="sub">¿Para quién?</p>' + libres.map(function (c) {
      return '<button class="reserva" onclick="A.crearEsp(\'' + jsq(sid) + '\',\'' + jsq(c.cod) + '\')"><div class="info"><b>' + esc(c.cod) + '</b><div class="sub">' + esc(nombresAl(c.alergias)) + ' ' + iconosDe(c.alergias, 'p') + '</div></div></button>';
    }).join(''));
  }
  function crearEsp(sid, cod) {
    var s = servicio(sid);
    s.especiales.push({ comensal: cod, platos: [] }); tocar(s);
    guardar(); cerrar(); ir('/elegir/' + sid + '/esp-' + encodeURIComponent(cod));
  }

  // ---------- Elegir plato ----------
  var filtroElegir = { tipo: null, txt: '' };
  function vElegir(sid, destino) {
    var s = servicio(sid);
    if (!s) { ir('/eventos'); return; }
    var e = evento(s.evento);
    if (eventoBloqueado(e)) { ir('/servicio/' + sid); return; }
    var esEsp = destino.indexOf('esp-') === 0;
    var cod = esEsp ? decodeURIComponent(destino.slice(4)) : null;
    var curso = esEsp ? null : destino.split('~')[0];
    var reemplaza = esEsp ? null : destino.split('~')[1] || null;
    var com = esEsp ? comensalesDe(e.id).filter(function (c) { return c.cod === cod; })[0] : null;
    if (filtroElegir.clave !== sid + destino) filtroElegir = { clave: sid + destino, tipo: esEsp ? 'todos' : curso, txt: '' };
    var cursoN = (CURSOS.filter(function (c) { return c.id === curso; })[0] || {}).nombre || '';
    titulo(esEsp ? 'Plato para ' + cod : reemplaza ? 'Cambiar ' + cursoN.toLowerCase() : 'Elegir ' + cursoN.toLowerCase(), '/servicio/' + sid);
    var html = '<div class="sub" style="margin-bottom:8px">' + esc(e.grupo) + ' · ' + cap(fechaCorta(s.fecha)) + ' · ' + s.turno + '</div>';
    if (reemplaza) html += '<div class="tarjeta fina">Sustituye a <b>' + esc(nombrePlato(reemplaza)) + '</b></div>';
    if (com) html += '<div class="tarjeta fina"><b>' + esc(com.cod) + '</b> · ' + esc(nombresAl(com.alergias)) + ' ' + iconosDe(com.alergias, 'p') + '<div class="sub peq">Solo se muestran platos sin sus alérgenos. Puedes añadir varios.</div></div>';
    var alergiasGrupo = [];
    comensalesDe(e.id).forEach(function (c) { c.alergias.forEach(function (a) { if (alergiasGrupo.indexOf(a) < 0) alergiasGrupo.push(a); }); });
    html += '<input class="entrada" id="buscaEleg" placeholder="Buscar plato…" value="' + esc(filtroElegir.txt) + '" style="margin-bottom:10px">';
    html += '<div class="chips" style="margin-bottom:10px">' + TIPOS.concat([{ id: 'todos', nombre: 'Todos' }]).map(function (t) {
      return '<button class="chip' + (filtroElegir.tipo === t.id ? ' activo' : '') + '" onclick="A.tipoEleg(\'' + t.id + '\')">' + t.nombre + (t.id === 'todos' ? '' : 's') + '</button>';
    }).join('') + '</div><div id="listaEleg"></div>';
    html += '<button class="enlace" onclick="A.nuevoPlato()">+ Crear plato nuevo</button><p class="sub peq">Los platos nuevos deben aprobarse antes de poder elegirse.</p>';
    pintar(html);
    var yaEsp = esEsp ? (s.especiales.filter(function (x) { return x.comensal === cod; })[0] || { platos: [] }).platos : [];
    function lista() {
      var q = norm(filtroElegir.txt);
      var ps = vivos(D.platos).filter(function (p) {
        if (p.estado !== 'aprobado') return false;
        if (filtroElegir.tipo !== 'todos' && p.tipo !== filtroElegir.tipo) return false;
        if (q && norm(p.nombre).indexOf(q) < 0) return false;
        if (com && alergenosPlato(p).some(function (a) { return com.alergias.indexOf(a) >= 0; })) return false;
        return true;
      }).map(function (p) { return { p: p, u: ultimaVez(p.id, s.fecha, s.id) }; });
      ps.sort(function (a, b) { return a.p.nombre.localeCompare(b.p.nombre, 'es'); });
      var yaGrupo = platosServicio(s).map(function (x) { return x.id; });
      $('#listaEleg').innerHTML = ps.length ? '<div class="tarjeta fina">' + ps.map(function (x) {
        var ya = esEsp ? yaEsp.indexOf(x.p.id) >= 0 : yaGrupo.indexOf(x.p.id) >= 0;
        var reciente = x.u.dias !== null && x.u.dias <= 7;
        var als = alergenosPlato(x.p);
        var afecta = !esEsp && als.filter(function (a) { return alergiasGrupo.indexOf(a) >= 0; }).length;
        return '<div class="fila toca" onclick="A.elegido(\'' + jsq(sid) + '\',\'' + jsq(destino) + '\',\'' + jsq(x.p.id) + '\')"><span class="izq">' + esc(x.p.nombre) + ' ' + iconosDe(als, 'p') +
          '<br><span class="sub peq' + (reciente ? ' ambar' : '') + '">' + esc(x.u.txt) + (x.p.familia ? ' · ' + esc(familiaN(x.p.familia)) : '') + '</span>' +
          (afecta ? '<br><span class="sub peq" style="color:var(--error)">Afecta a alguien del grupo: necesitará ración especial</span>' : '') + '</span>' +
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
      tocar(s); guardar(); toast('Añadido para ' + cod); ir('/servicio/' + sid); return;
    }
    var curso = destino.split('~')[0], reemplaza = destino.split('~')[1];
    var l = s.platos[curso] = s.platos[curso] || [];
    if (reemplaza) {
      var k = l.indexOf(reemplaza);
      if (k >= 0) { if (l.indexOf(pid) >= 0 && pid !== reemplaza) l.splice(k, 1); else l[k] = pid; }
      else if (l.indexOf(pid) < 0) l.push(pid);
      if (pid !== reemplaza) marcarRevisionEsp(s);
    } else if (l.indexOf(pid) < 0) l.push(pid);
    tocar(s); guardar(); if (!reemplaza || !s.especiales.length) toast(reemplaza ? 'Plato cambiado' : 'Plato añadido');
    var volver = estado.volverEleg || '/servicio/' + sid; estado.volverEleg = null;
    ir(volver);
  }

  // =====================================================================
  // CARTEL PARA LA PUERTA (A4)
  // =====================================================================
  function cartelDe(eid, crear) {
    var id = idCartel(eid), k = porId(D.carteles, id);
    if (!k && crear) {
      var d = D.meta.cartelDefecto;
      k = tocar({ id: id, evento: eid, textos: {}, color: d.color, escala: d.escala, mostrarModalidad: d.mostrarModalidad, leyenda: d.leyenda });
      D.carteles.push(k);
    }
    return k;
  }
  var cartelEdicion = false;
  function vCartel(eid) {
    var e = evento(eid);
    if (!e) { ir('/eventos'); return; }
    titulo('Cartel · ' + e.grupo, '/evento/' + eid);
    document.body.classList.add('modo-cartel');
    var bloq = eventoBloqueado(e);
    if (bloq) cartelEdicion = false;
    var k = cartelDe(eid, false) || { textos: {}, color: D.meta.cartelDefecto.color, escala: D.meta.cartelDefecto.escala, mostrarModalidad: D.meta.cartelDefecto.mostrarModalidad, leyenda: D.meta.cartelDefecto.leyenda };
    // Avisos antes de imprimir
    var servs = serviciosDe(eid), av = [];
    var vacios = servs.filter(servicioVacio);
    if (vacios.length && !bloq) av.push(plural(vacios.length, 'servicio sin menú', 'servicios sin menú') + ': ' + vacios.map(function (s) { return fechaCorta(s.fecha) + ' ' + s.turno; }).join(', ') + '. No saldrán en el cartel.');
    var noAp = [];
    if (!bloq) servs.forEach(function (s) { platosServicio(s).forEach(function (x) { var p = plato(x.id); if (!p || p.borrado || p.estado !== 'aprobado') noAp.push(nombrePlato(x.id)); }); });
    if (noAp.length) av.push('Platos no aprobados (no salen en el cartel): ' + noAp.join(', ') + '.');
    var html = '<div class="no-imprimir barra-cartel">' +
      (av.length ? '<div class="avisos">' + av.map(function (t) { return '<div>⚠︎ ' + esc(t) + '</div>'; }).join('') + '</div>' : '') +
      '<div class="fila-btns" style="margin-top:0"><button class="btn" onclick="A.imprimir()">Imprimir / Guardar PDF</button>' +
      (bloq ? '' : '<button class="btn ' + (cartelEdicion ? 'ok' : 'sec') + '" onclick="A.personalizar()">' + (cartelEdicion ? 'Terminar de personalizar' : 'Personalizar') + '</button>') + '</div>';
    if (cartelEdicion) {
      html += '<div class="tarjeta fina panel-cartel">' +
        '<p class="sub peq" style="margin-top:0">Toca cualquier texto del cartel para cambiarlo. Si lo dejas vacío, vuelve al original. Los platos y sus alérgenos no se cambian aquí: el nombre del plato solo cambia en el cartel.</p>' +
        '<div class="dos"><label class="campo"><span>Color</span><input type="color" class="entrada" id="kColor" value="' + esc(k.color) + '"></label>' +
        '<label class="campo"><span>Tamaño de letra: <b id="kEscTxt">' + k.escala + '%</b></span><input type="range" min="80" max="125" step="5" id="kEsc" value="' + k.escala + '" style="width:100%"></label></div>' +
        '<label class="check"><input type="checkbox" id="kMod" ' + (k.mostrarModalidad ? 'checked' : '') + '> Mostrar la modalidad (Ligero, Con carne…)</label>' +
        '<label class="campo"><span>Leyenda de alérgenos</span><select class="entrada" id="kLey"><option value="todos"' + (k.leyenda === 'todos' ? ' selected' : '') + '>Completa (los 14)</option><option value="usados"' + (k.leyenda === 'usados' ? ' selected' : '') + '>Solo los que aparecen en el menú</option></select></label>' +
        '<label class="check"><input type="checkbox" id="kNotas" ' + (estado.verNotasVacias !== false ? 'checked' : '') + '> Ver los huecos para notas por servicio («Cena fría»…)</label>' +
        '<div class="fila-btns"><button class="btn borde" onclick="A.restaurarCartel(\'' + jsq(eid) + '\')">Volver todo al original</button>' +
        '<button class="btn borde" onclick="A.cartelPorDefecto(\'' + jsq(eid) + '\')">Guardar como formato por defecto</button></div></div>';
    }
    html += '<div id="kAviso" class="avisos" hidden></div></div>';
    html += '<div class="a4-marco" id="a4Marco"><div class="a4' + (cartelEdicion ? ' editando' : '') + (cartelEdicion && estado.verNotasVacias !== false ? ' ver-notas' : '') + '" id="a4" style="--k-color:' + esc(k.color) + ';--k-esc:' + (k.escala / 100) + '">' + htmlCartel(e, k) + '</div></div>';
    pintar(html);
    if (cartelEdicion) enlazarCartel(eid);
    ajustarCartel();
  }

  function htmlCartel(e, k) {
    var t = k.textos || {}, d = D.meta.cartelDefecto, edit = cartelEdicion;
    function txt(clave, original, clase, etiqueta) {
      var v = t[clave] != null && t[clave] !== '' ? t[clave] : original;
      etiqueta = etiqueta || 'div';
      return '<' + etiqueta + ' class="' + clase + (t[clave] ? ' cambiado' : '') + '"' + (edit ? ' contenteditable="true" data-k="' + esc(clave) + '" data-orig="' + esc(original) + '"' : '') + '>' + esc(v) + '</' + etiqueta + '>';
    }
    var usados = {}, propiosUsados = {};
    var cuerpo = '', diaAnt = '', abierto = false;
    serviciosDe(e.id).forEach(function (s) {
      var v = vistaServicio(s);
      var filas = v.filas.filter(function (x) { return v.cerrado || x.estado === 'aprobado'; });
      if (!filas.length) return;
      if (s.fecha !== diaAnt) {
        if (abierto) cuerpo += '</section>';
        cuerpo += '<section class="k-dia">' + txt('dia:' + s.fecha, cap(fechaLarga(s.fecha)), 'k-dia-t', 'h2');
        diaAnt = s.fecha; abierto = true;
      }
      cuerpo += '<div class="k-serv"><div class="k-serv-t">' + txt('serv:' + s.id, turnoN(s.turno), 'k-turno', 'span') +
        (k.mostrarModalidad && s.modalidad ? '<span class="k-mod">' + esc(s.modalidad) + '</span>' : '') + '</div>';
      var nota = t['nota:' + s.id] || '';
      if (nota || edit) cuerpo += '<div class="k-nota' + (nota ? '' : ' vacia') + '"' + (edit ? ' contenteditable="true" data-k="nota:' + esc(s.id) + '" data-orig="" data-ph="Nota para este servicio (opcional)"' : '') + '>' + esc(nota) + '</div>';
      filas.forEach(function (x) {
        var c = CURSOS.filter(function (cc) { return cc.id === x.curso; })[0];
        x.alergenos.forEach(function (a) { usados[a] = 1; if (/^p:/.test(a)) propiosUsados[a] = 1; });
        cuerpo += '<div class="k-plato"><span class="k-curso">' + c.corto + '</span>' + txt('plato:' + x.id, x.nombre, 'k-nombre', 'span') +
          '<span class="k-iconos">' + (x.alergenos.length ? x.alergenos.map(function (a) {
            return /^p:/.test(a) ? '<span class="k-propio">' + AL.icono(a) + '<small>' + esc(AL.info(a).nombre.toLowerCase()) + '</small></span>' : AL.icono(a);
          }).join('') : '<span class="k-ok"><span class="sin-al">✓</span><small>Sin alérgenos</small></span>') + '</span></div>';
      });
      cuerpo += '</div>';
    });
    if (abierto) cuerpo += '</section>';
    if (!cuerpo) cuerpo = '<div class="vacio">Todavía no hay menús asignados.</div>';
    var ley = k.leyenda === 'usados' ? ordenAl(Object.keys(usados).filter(function (a) { return !/^p:/.test(a); })) : window.ALERGENOS.map(function (a) { return a.id; });
    var props = Object.keys(propiosUsados);
    var leyenda = ley.map(function (a) { return '<span class="k-ley">' + AL.icono(a) + '<small>' + esc(AL.info(a).nombre) + '</small></span>'; }).join('') +
      (props.length ? '<span class="k-ley">' + AL.icono(props[0]) + '<small>Otros (' + esc(props.map(function (p) { return AL.info(p).nombre.toLowerCase(); }).join(', ')) + ')</small></span>' : '');
    var sub = e.grupo + ' · ' + (e.entrada === e.salida ? cap(fechaLarga(e.entrada)) : 'del ' + fechaD(e.entrada).getDate() + (e.entrada.slice(5, 7) !== e.salida.slice(5, 7) ? ' de ' + MESES[fechaD(e.entrada).getMonth()] : '') + ' al ' + fechaD(e.salida).getDate() + ' de ' + MESES[fechaD(e.salida).getMonth()]);
    return '<div class="a4-contenido" id="a4c">' +
      '<header class="k-cab"><img class="k-logo" src="icons/logo-casa-maria-madre.png" alt="Casa de Espiritualidad María Madre · Guadalajara">' +
      txt('titulo', 'Menú', 'k-titulo', 'h1') + txt('subtitulo', sub, 'k-sub', 'p') + '</header>' +
      '<div class="k-cuerpo">' + cuerpo + '</div>' +
      '<footer class="k-pie"><div class="k-ley-t">Alérgenos</div><div class="k-leyenda">' + leyenda + '</div>' +
      txt('aviso', d.aviso, 'k-aviso', 'p') +
      (t.pie || d.pie || edit ? '<p class="k-pie-txt' + (t.pie || d.pie ? '' : ' vacia') + '"' + (edit ? ' contenteditable="true" data-k="pie" data-orig="' + esc(d.pie) + '" data-ph="Texto libre al pie (opcional)"' : '') + '>' + esc(t.pie || d.pie) + '</p>' : '') +
      '</footer></div>';
  }

  function enlazarCartel(eid) {
    var k = cartelDe(eid, true);
    $$('#a4 [data-k]').forEach(function (el) {
      el.onkeydown = function (ev) { if (ev.key === 'Enter') { ev.preventDefault(); el.blur(); } };
      el.onblur = function () {
        var v = el.innerText.replace(/\s+/g, ' ').trim(), clave = el.dataset.k, orig = el.dataset.orig || '';
        var antes = k.textos[clave] || '';
        if (!v || v === orig) delete k.textos[clave]; else k.textos[clave] = v;
        if ((k.textos[clave] || '') !== antes) { tocar(k); guardar(); }
        if (!v && orig) el.textContent = orig;
        el.classList.toggle('cambiado', !!k.textos[clave]);
        el.classList.toggle('vacia', !v && !orig);
        ajustarCartel();
      };
    });
    $('#kColor').oninput = function () { k.color = this.value; $('#a4').style.setProperty('--k-color', k.color); };
    $('#kColor').onchange = function () { tocar(k); guardar(); };
    $('#kEsc').oninput = function () { k.escala = +this.value; $('#kEscTxt').textContent = k.escala + '%'; $('#a4').style.setProperty('--k-esc', k.escala / 100); ajustarCartel(); };
    $('#kEsc').onchange = function () { tocar(k); guardar(); };
    $('#kMod').onchange = function () { k.mostrarModalidad = this.checked; tocar(k); guardar(); render(); };
    $('#kLey').onchange = function () { k.leyenda = this.value; tocar(k); guardar(); render(); };
    $('#kNotas').onchange = function () { estado.verNotasVacias = this.checked; render(); };
  }

  /** Si no cabe en un A4, reduce la letra poco a poco (hasta el 72 %); si aun así no cabe, avisa: saldrá en dos hojas. */
  function ajustarCartel() {
    var a4 = $('#a4'), c = $('#a4c'), marco = $('#a4Marco');
    if (!a4 || !c) return;
    var auto = 1;
    a4.style.setProperty('--k-auto', 1);
    a4.classList.remove('dos-hojas');
    var alto = 1123;
    while (c.scrollHeight > alto && auto > 0.72) { auto -= 0.04; a4.style.setProperty('--k-auto', auto.toFixed(2)); }
    var aviso = $('#kAviso');
    if (c.scrollHeight > alto) {
      a4.classList.add('dos-hojas');
      if (aviso) { aviso.hidden = false; aviso.textContent = '⚠︎ No cabe en una hoja aunque se reduzca la letra: se imprimirá en dos hojas. Puedes bajar el tamaño de letra o ocultar la modalidad.'; }
    } else if (aviso) {
      aviso.hidden = auto > 0.99;
      aviso.textContent = auto < 0.99 ? 'La letra se ha reducido al ' + Math.round(auto * 100) + ' % para que quepa en un A4.' : '';
      aviso.className = 'avisos gris';
    }
    var w = marco.clientWidth || 794, esc2 = Math.min(1, w / 794);
    a4.style.transform = 'scale(' + esc2 + ')';
    marco.style.height = (a4.offsetHeight * esc2) + 'px';
  }
  window.addEventListener('resize', function () { if (document.body.classList.contains('modo-cartel')) ajustarCartel(); });

  // =====================================================================
  // PLATOS
  // =====================================================================
  function vPlatos() {
    titulo('Platos');
    var f = estado.filtroPlatos;
    var cont = function (st) { return vivos(D.platos).filter(function (p) { return p.estado === st; }).length; };
    var html = '<div class="fila-btns" style="margin:0 0 12px"><button class="btn" onclick="A.nuevoPlato()">+ Nuevo plato</button><button class="btn sec" onclick="A.ir(\'/ingrediente/nuevo\')">+ Nuevo ingrediente</button></div>';
    html += '<input class="entrada" id="buscaPl" placeholder="Buscar plato…" value="' + esc(estado.buscaPlatos) + '" style="margin-bottom:10px">';
    html += '<div class="chips" style="margin-bottom:10px">' + [['todos', 'Todos'], ['aprobado', 'Aprobados'], ['pendiente', 'Pendientes (' + cont('pendiente') + ')'], ['corregir', 'Corregir (' + cont('corregir') + ')']].map(function (x) {
      return '<button class="chip' + (f === x[0] ? ' activo' : '') + '" onclick="A.filtrarPlatos(\'' + x[0] + '\')">' + x[1] + '</button>';
    }).join('') + '</div>';
    html += '<div class="dos"><label class="campo"><span>Familia</span><select class="entrada" id="famPl"><option value="">(todas)</option>' +
      FAMILIAS.map(function (x) { return '<option value="' + x.id + '"' + (estado.famPlatos === x.id ? ' selected' : '') + '>' + x.nombre + '</option>'; }).join('') +
      '<option value="-"' + (estado.famPlatos === '-' ? ' selected' : '') + '>Sin familia</option></select></label>';
    html += '<label class="campo"><span>Solo platos sin…</span><select class="entrada" id="sinAl"><option value="">(cualquier alérgeno)</option>' +
      todosAlergenos().map(function (a) { return '<option value="' + esc(a) + '"' + (estado.sinAl === a ? ' selected' : '') + '>' + esc(AL.info(a).nombre) + '</option>'; }).join('') + '</select></label></div>';
    html += '<div id="listaPl"></div>';
    pintar(html);
    function lista() {
      var q = norm(estado.buscaPlatos);
      var ps = vivos(D.platos).filter(function (p) {
        return (f === 'todos' || p.estado === f) && (!q || norm(p.nombre).indexOf(q) >= 0) && (!estado.sinAl || alergenosPlato(p).indexOf(estado.sinAl) < 0) &&
          (!estado.famPlatos || (estado.famPlatos === '-' ? !p.familia : p.familia === estado.famPlatos));
      }).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
      var html2 = '';
      TIPOS.forEach(function (t) {
        var g = ps.filter(function (p) { return p.tipo === t.id; });
        if (!g.length) return;
        html2 += '<h3>' + t.nombre + 's</h3><div class="tarjeta fina">' + g.map(function (p) {
          var st = ESTADOS[p.estado] || ESTADOS.pendiente;
          return '<div class="fila toca" onclick="A.ir(\'/plato/' + jsq(p.id) + '\')"><span class="izq">' + esc(p.nombre) + '<br>' +
            (p.familia ? '<span class="sub peq">' + esc(familiaN(p.familia)) + '</span> ' : '<span class="sub peq ambar">sin familia</span> ') +
            (p.estado !== 'aprobado' ? '<span class="etiqueta ' + st.clase + '">' + st.nombre + '</span>' : '') + '</span>' + iconosPlato(p, 'p') + '</div>';
        }).join('') + '</div>';
      });
      $('#listaPl').innerHTML = html2 || '<div class="vacio">No hay platos con ese filtro.</div>';
    }
    lista();
    $('#buscaPl').oninput = function () { estado.buscaPlatos = this.value; lista(); };
    $('#sinAl').onchange = function () { estado.sinAl = this.value; lista(); };
    $('#famPl').onchange = function () { estado.famPlatos = this.value; lista(); };
  }

  function vPlato(id) {
    var p = vivo(D.platos, id);
    if (!p) { ir('/platos'); return; }
    titulo(p.nombre, '/platos');
    var st = ESTADOS[p.estado] || ESTADOS.pendiente;
    var als = alergenosPlato(p);
    var html = '<div class="tarjeta"><div class="servicio-cab"><span class="etiqueta ' + st.clase + '">' + st.nombre + '</span><span class="sub">' + tipoN(p.tipo) + ' · ' + esc(familiaN(p.familia)) + '</span></div>';
    if (p.estado === 'corregir' && p.comentario) html += '<div class="avisos" style="margin:10px 0 0;background:var(--error-suave);color:var(--error)"><b>Corrección pedida:</b> ' + esc(p.comentario) + '</div>';
    html += '<h3>Alérgenos (automáticos)</h3>' + (als.length ? '<div class="leyenda" style="font-size:14px;color:var(--texto)">' + als.map(function (a) { return '<span>' + AL.icono(a, 'g') + esc(AL.info(a).nombre) + '</span>'; }).join('') + '</div>' :
      '<div><span class="sin-al">✓</span> Sin alérgenos</div>') + '</div>';
    var revisar = p.ingredientes.map(function (x) { return ingrediente(x.ing); }).filter(function (i) { return i && i.revisar; });
    if (revisar.length) html += '<div class="avisos">⚠︎ Revisa la etiqueta de: ' + esc(revisar.map(function (i) { return i.nombre; }).join(', ')) + '. Los alérgenos de un producto comercial salen de su etiqueta.</div>';
    html += '<h3>Ingredientes · por persona</h3><div class="tarjeta fina">' + (p.ingredientes.length ? p.ingredientes.map(function (x) {
      var i = ingrediente(x.ing);
      return '<div class="fila"><span class="izq">' + esc(i ? i.nombre : '¿?') + ' ' + (i && i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</span><span class="der">' + (i ? cantPorPersona(x.cant, i.unidad) : '') + '</span></div>';
    }).join('') : '<p class="sub">Sin ingredientes.</p>') + '</div>';
    if (p.notas) html += '<div class="tarjeta fina"><b>Notas</b><div class="sub">' + esc(p.notas) + '</div></div>';
    html += '<div class="sub" style="margin-bottom:12px">' + esc(ultimaVez(p.id).txt) + ' · Margen de compra: ' + (p.margen != null ? p.margen : D.meta.margen) + ' %' + (p.margen != null ? ' (propio)' : ' (general)') + ' · Receta: próximamente</div>';
    if (p.estado !== 'aprobado') html += '<button class="btn ok ancho" onclick="A.aprobar(\'' + jsq(p.id) + '\')">✓ Aprobar</button>';
    html += '<div class="fila-btns">' + (p.estado !== 'corregir' ? '<button class="btn sec" onclick="A.pedirCorreccion(\'' + jsq(p.id) + '\')">Pedir corrección</button>' : '') +
      '<button class="btn sec" onclick="A.editarPlato(\'' + jsq(p.id) + '\')">Editar</button></div>' +
      '<div class="fila-btns"><button class="btn borde" onclick="A.duplicar(\'' + jsq(p.id) + '\')">Duplicar (para variante)</button>' +
      '<button class="btn peligro" onclick="A.borrarPlato(\'' + jsq(p.id) + '\')">Eliminar</button></div>';
    pintar(html);
  }

  var borradorPlato = null;
  function vPlatoForm(id) {
    var p = id === 'nuevo' ? null : vivo(D.platos, id);
    if (!borradorPlato || borradorPlato.id !== (p ? p.id : 'nuevo')) {
      borradorPlato = p ? JSON.parse(JSON.stringify(p)) : { id: 'nuevo', nombre: '', tipo: 'segundo', familia: '', notas: '', margen: null, ingredientes: [] };
    }
    var b = borradorPlato;
    titulo(p ? 'Editar plato' : 'Nuevo plato', p ? '/plato/' + p.id : '/platos');
    var opsIng = '<option value="">Elige ingrediente…</option>' + CATEGORIAS.map(function (cat) {
      var g = vivos(D.ingredientes).filter(function (i) { return (i.categoria || 'Otros') === cat; }).sort(function (x, y) { return x.nombre.localeCompare(y.nombre, 'es'); });
      return g.length ? '<optgroup label="' + cat + '">' + g.map(function (i) { return '<option value="' + esc(i.id) + '">' + esc(i.nombre) + ' (' + i.unidad + ')</option>'; }).join('') + '</optgroup>' : '';
    }).join('');
    var html = '<div class="tarjeta"><label class="campo"><span>Nombre del plato</span><input class="entrada" id="pNombre" value="' + esc(b.nombre) + '" placeholder="Merluza empanada"></label>' +
      '<div class="dos"><label class="campo"><span>Tipo (orden en que se sirve)</span><select class="entrada" id="pTipo">' + TIPOS.map(function (t) { return '<option value="' + t.id + '"' + (b.tipo === t.id ? ' selected' : '') + '>' + t.nombre + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Familia (ingrediente principal)</span><select class="entrada" id="pFam"><option value="">Elige…</option>' + FAMILIAS.map(function (f) { return '<option value="' + f.id + '"' + (b.familia === f.id ? ' selected' : '') + '>' + f.nombre + '</option>'; }).join('') + '</select></label></div></div>';
    html += '<h3>Ingredientes · cantidad para una persona</h3><div class="tarjeta fina">';
    b.ingredientes.forEach(function (x, k) {
      var i = ingrediente(x.ing);
      html += '<div class="fila"><span class="izq">' + esc(i ? i.nombre : '¿?') + ' ' + (i && i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</span>' +
        '<input class="entrada" type="number" step="any" min="0" inputmode="decimal" style="width:90px;min-height:38px;padding:6px 8px;text-align:right" value="' + x.cant + '" onchange="A.cantIng(' + k + ', this.value)"><span class="sub" style="width:30px">' + (i ? i.unidad : '') + '</span>' +
        '<button class="quitar" aria-label="Quitar" onclick="A.quitarIng(' + k + ')">' + SVG.x + '</button></div>';
    });
    html += '<div style="display:flex;gap:8px;margin-top:8px"><select class="entrada" id="pIngSel" style="flex:1">' + opsIng + '</select></div>' +
      '<button class="enlace" onclick="A.ingRapido()">¿No está? Crear ingrediente</button>' +
      '<p class="sub peq">Si usáis un producto comercial (merluza empanada congelada, preparado de paella…), ponedlo como un solo ingrediente con los alérgenos de su etiqueta.</p></div>';
    var als = alergenosPlato(b);
    html += '<div class="tarjeta fina"><b>Alérgenos del plato:</b> ' + (als.length ? iconosDe(als) + ' <span class="sub">' + esc(nombresAl(als)) + '</span>' : '<span class="sin-al">✓</span> ninguno') + '</div>';
    html += '<div class="tarjeta"><label class="campo"><span>Margen de compra propio (%) · vacío = el general (' + D.meta.margen + ' %)</span><input class="entrada" type="number" min="0" max="100" inputmode="numeric" id="pMargen" value="' + (b.margen != null ? b.margen : '') + '" placeholder="' + D.meta.margen + '"></label>' +
      '<label class="campo" style="margin:0"><span>Notas (opcional)</span><textarea class="entrada" id="pNotas" placeholder="Variante sin huevo: rebozar solo con harina y agua">' + esc(b.notas) + '</textarea></label></div>';
    html += '<p class="error-txt" id="pError" hidden></p><button class="btn ancho" onclick="A.guardarPlato()">Guardar</button>' +
      '<p class="sub peq" style="text-align:center">Al guardar, el plato queda pendiente de aprobar por el jefe de cocina.</p>';
    pintar(html);
    $('#pNombre').oninput = function () { b.nombre = this.value; };
    $('#pTipo').onchange = function () { b.tipo = this.value; };
    $('#pFam').onchange = function () { b.familia = this.value; };
    $('#pNotas').oninput = function () { b.notas = this.value; };
    $('#pMargen').oninput = function () { var v = this.value.trim(); b.margen = v === '' ? null : Math.max(0, Math.min(100, parseInt(v, 10) || 0)); };
    $('#pIngSel').onchange = function () {
      var v = this.value; if (!v) return;
      if (b.ingredientes.some(function (x) { return x.ing === v; })) { toast('Ese ingrediente ya está'); this.value = ''; return; }
      var i = ingrediente(v);
      b.ingredientes.push({ ing: v, cant: i.unidad === 'ud.' ? 1 : 100 });
      vPlatoForm(id);
      var ult = $$('#vista input[type=number]'); ult = ult[ult.length - 2]; if (ult) { ult.focus(); ult.select(); }
    };
  }
  function guardarPlato() {
    var b = borradorPlato;
    var err = !b.nombre.trim() ? 'Escribe el nombre del plato.' : !b.familia ? 'Elige la familia del plato.' : !b.ingredientes.length ? 'Añade al menos un ingrediente.' :
      b.ingredientes.some(function (x) { return !(x.cant > 0); }) ? 'Revisa las cantidades: deben ser mayores que 0.' : '';
    if (err) { var x = $('#pError'); x.textContent = err; x.hidden = false; return; }
    var p;
    if (b.id === 'nuevo') {
      p = tocar({ id: nuevoId('p'), nombre: b.nombre.trim(), tipo: b.tipo, familia: b.familia, estado: 'pendiente', comentario: '', notas: b.notas.trim(), margen: b.margen, ingredientes: b.ingredientes });
      D.platos.push(p); toast('Plato creado · pendiente de aprobar');
    } else {
      p = plato(b.id);
      var antes = p.estado;
      p.nombre = b.nombre.trim(); p.tipo = b.tipo; p.familia = b.familia; p.notas = b.notas.trim(); p.margen = b.margen; p.ingredientes = b.ingredientes; p.estado = 'pendiente'; p.comentario = '';
      tocar(p);
      toast(antes === 'aprobado' ? 'Guardado · vuelve a revisión' : 'Guardado · pendiente de aprobar');
    }
    borradorPlato = null; guardar(); ir('/plato/' + p.id);
  }
  function ingRapido() {
    modal('Nuevo ingrediente', '<label class="campo"><span>Nombre</span><input class="entrada" id="qNom"></label>' +
      '<label class="campo"><span>Unidad</span><select class="entrada" id="qUni">' + UNIDADES.map(function (u) { return '<option>' + u + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Categoría</span><select class="entrada" id="qCat">' + CATEGORIAS.map(function (c) { return '<option>' + c + '</option>'; }).join('') + '</select></label>' +
      '<p class="sub peq">Sus alérgenos se marcan después en Compras → Ingredientes. Quedará marcado «revisar etiqueta» hasta que lo hagas.</p><p class="error-txt" id="qErr" hidden></p><button class="btn ancho" id="qOk">Crear y añadir</button>');
    $('#qOk').onclick = function () {
      var n = $('#qNom').value.trim();
      if (!n) { var x = $('#qErr'); x.textContent = 'Escribe el nombre.'; x.hidden = false; return; }
      var i = tocar({ id: nuevoId('i'), nombre: n, unidad: $('#qUni').value, categoria: $('#qCat').value, alergenos: [], presentacion: '', cantPres: 0, congelado: false, seccion: '', marca: '', revEtiqueta: '', revisar: true });
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
      var p = plato(id); p.estado = 'corregir'; p.comentario = t; tocar(p); guardar(); cerrar(); render(); toast('Corrección pedida');
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
      q = norm(q);
      var h = '';
      CATEGORIAS.forEach(function (cat) {
        var g = vivos(D.ingredientes).filter(function (i) { return (i.categoria || 'Otros') === cat && (!q || norm(i.nombre).indexOf(q) >= 0); })
          .sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); });
        if (!g.length) return;
        h += '<h3>' + cat + '</h3><div class="tarjeta fina">' + g.map(function (i) {
          return '<div class="fila toca" onclick="A.ir(\'/ingrediente/' + jsq(i.id) + '\')"><span class="izq">' + esc(i.nombre) + ' <span class="sub">(' + i.unidad + (i.presentacion ? ' · ' + esc(i.presentacion) : '') + ')</span>' +
            (i.revisar ? '<br><span class="etiqueta pendiente">revisar etiqueta</span>' : '') + (i.congelado ? ' <span class="etiqueta borrador">congelado</span>' : '') + '</span>' + (i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') + '</div>';
        }).join('') + '</div>';
      });
      $('#listaIng').innerHTML = h || '<div class="vacio">No hay ingredientes con ese nombre.</div>';
    }
    lista('');
    $('#buscaIng').oninput = function () { lista(this.value); };
  }

  function vIngredienteForm(id) {
    var i = id === 'nuevo' ? null : vivo(D.ingredientes, id);
    if (id !== 'nuevo' && !i) { ir('/ingredientes'); return; }
    titulo(i ? i.nombre : 'Nuevo ingrediente', '/ingredientes');
    var campos = ['nombre', 'unidad', 'categoria', 'presentacion', 'cantPres', 'congelado', 'seccion', 'marca', 'revEtiqueta'];
    var b, sel;
    if (A._ing && A._ing.id === id) { b = A._ing.b; sel = A._ing.sel; }
    else {
      b = {}; campos.forEach(function (k) { b[k] = i ? i[k] : ''; });
      if (!i) { b.unidad = 'g'; b.categoria = 'Despensa'; b.cantPres = 0; b.congelado = false; }
      sel = i ? i.alergenos.slice() : [];
    }
    A._ing = { id: id, b: b, sel: sel, repintar: function () { vIngredienteForm(id); } };
    var usos = i ? usosIngrediente(i.id) : 0;
    var html = '';
    if (i && i.revisar) html += '<div class="avisos">⚠︎ Revisa los alérgenos en la etiqueta del producto y pulsa «Etiqueta revisada».<br><button class="btn mini ok" style="margin-top:6px" onclick="A.etiquetaRevisada(\'' + jsq(i.id) + '\')">Etiqueta revisada</button></div>';
    html += '<div class="tarjeta"><label class="campo"><span>Nombre</span><input class="entrada" id="iNom" value="' + esc(b.nombre) + '" placeholder="Merluza empanada congelada"></label>' +
      '<label class="campo"><span>Unidad de las recetas</span></label><div class="chips" style="margin-bottom:12px">' + UNIDADES.map(function (u) {
        return '<button class="chip' + (b.unidad === u ? ' activo' : '') + '" onclick="A.unidadIng(\'' + u + '\')">' + u + '</button>';
      }).join('') + '</div>' +
      '<label class="campo"><span>Categoría</span><select class="entrada" id="iCat">' + CATEGORIAS.map(function (c) { return '<option' + (b.categoria === c ? ' selected' : '') + '>' + c + '</option>'; }).join('') + '</select></label></div>';
    html += '<h3>Compra</h3><div class="tarjeta">' +
      '<div class="dos"><label class="campo"><span>Presentación</span><input class="entrada" id="iPres" value="' + esc(b.presentacion) + '" placeholder="lata de 3 kg"></label>' +
      '<label class="campo"><span>Cantidad por presentación (' + esc(b.unidad) + ')</span><input class="entrada" type="number" min="0" step="any" inputmode="decimal" id="iCantPres" value="' + (b.cantPres || '') + '" placeholder="3000"></label></div>' +
      '<div class="dos"><label class="campo"><span>Proveedor o sección</span><input class="entrada" id="iSec" list="secciones" value="' + esc(b.seccion) + '" placeholder="Congelados"></label>' +
      '<label class="campo"><span>Marca habitual</span><input class="entrada" id="iMarca" value="' + esc(b.marca) + '" placeholder="(opcional)"></label></div>' +
      '<datalist id="secciones">' + SECCIONES.map(function (s) { return '<option value="' + s + '">'; }).join('') + '</datalist>' +
      '<label class="check"><input type="checkbox" id="iCong" ' + (b.congelado ? 'checked' : '') + '> Congelado</label>' +
      (b.revEtiqueta ? '<p class="sub peq">Etiqueta revisada el ' + esc(b.revEtiqueta) + '.</p>' : '') + '</div>';
    html += '<h3>Toca los alérgenos que contiene</h3>' + selectorAl(sel, 'A.togAlIng') +
      '<button class="enlace" onclick="A.nuevoPropio(\'ing\')">+ Otro que no está en la lista (miel, girasol, kiwi…)</button>';
    if (usos) html += '<p class="sub peq">Se usa en ' + plural(usos, 'plato', 'platos') + '. Si cambias sus alérgenos, esos platos vuelven a revisión.</p>';
    html += '<p class="error-txt" id="iErr" hidden></p><div class="fila-btns">' + (i && !usos ? '<button class="btn peligro" onclick="A.borrarIng(\'' + jsq(i.id) + '\')">Eliminar</button>' : '') +
      '<button class="btn" onclick="A.guardarIng()">Guardar</button></div>';
    pintar(html);
    $('#iNom').oninput = function () { b.nombre = this.value; };
    $('#iCat').onchange = function () { b.categoria = this.value; };
    $('#iPres').oninput = function () { b.presentacion = this.value; };
    $('#iCantPres').oninput = function () { b.cantPres = parseFloat(String(this.value).replace(',', '.')) || 0; };
    $('#iSec').oninput = function () { b.seccion = this.value; };
    $('#iMarca').oninput = function () { b.marca = this.value; };
    $('#iCong').onchange = function () { b.congelado = this.checked; };
  }
  function guardarIng() {
    var s = A._ing, b = s.b;
    if (!b.nombre.trim()) { var x = $('#iErr'); x.textContent = 'Escribe el nombre.'; x.hidden = false; return; }
    var datos = { nombre: b.nombre.trim(), unidad: b.unidad, categoria: b.categoria, presentacion: (b.presentacion || '').trim(), cantPres: b.cantPres || 0,
      congelado: !!b.congelado, seccion: (b.seccion || '').trim(), marca: (b.marca || '').trim() };
    if (s.id === 'nuevo') {
      var n = tocar({ id: nuevoId('i'), alergenos: ordenAl(s.sel), revEtiqueta: '', revisar: false });
      for (var k in datos) n[k] = datos[k];
      D.ingredientes.push(n);
      toast('Ingrediente creado');
    } else {
      var i = ingrediente(s.id);
      var cambia = JSON.stringify(ordenAl(i.alergenos)) !== JSON.stringify(ordenAl(s.sel));
      for (var k2 in datos) i[k2] = datos[k2];
      i.alergenos = ordenAl(s.sel); tocar(i);
      if (cambia) {
        var nn = 0;
        vivos(D.platos).forEach(function (p) {
          if (p.estado === 'aprobado' && p.ingredientes.some(function (x) { return x.ing === i.id; })) { p.estado = 'pendiente'; tocar(p); nn++; }
        });
        recomendarCopia();
        toast(nn ? 'Guardado · ' + plural(nn, 'plato vuelve', 'platos vuelven') + ' a revisión' : 'Guardado');
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
    var prox = vivos(D.eventos).filter(function (e) { return eventoConMenu(e) && e.salida >= hoy; }).sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; });
    var html = '<h3>Pedido por evento</h3>' + (prox.length ? prox.map(function (e) {
      var d = fechaD(e.entrada), tot = calcularCompra(e.id), ids = Object.keys(tot);
      var rev = ids.filter(function (k) { return lineaCompra(e.id, k).despensa; }).length;
      var hechos = ids.filter(function (k) { return lineaCompra(e.id, k).hecho; }).length;
      return '<button class="reserva" onclick="A.ir(\'/compras/' + jsq(e.id) + '\')"><div class="fecha"><span class="d">' + d.getDate() + '</span><span class="m">' + MESES_C[d.getMonth()] + '</span></div>' +
        '<div class="info"><b>' + esc(e.grupo) + '</b><div class="sub">' + rango(e) + ' · ' + e.personas + ' personas</div><div class="sub">' +
        (ids.length ? ids.length + ' ingredientes · ' + rev + ' revisados en despensa · ' + hechos + ' comprados' : 'Sin menús todavía') + '</div></div></button>';
    }).join('') : '<div class="vacio">No hay eventos próximos.</div>');
    html += '<h3>Suministros</h3><div class="tarjeta fina"><div class="fila toca" onclick="A.ir(\'/ingredientes\')"><span class="izq"><b>Ingredientes</b><br><span class="sub">' + vivos(D.ingredientes).length + ' ingredientes con alérgenos, presentación y sección</span></span><span class="der">›</span></div>' +
      '<div class="fila toca" onclick="A.margenGeneral()"><span class="izq"><b>Margen de compra general</b><br><span class="sub">' + D.meta.margen + ' % sobre las raciones (cada plato puede tener el suyo)</span></span><span class="der">›</span></div>' +
      '<div class="fila"><span class="izq sub">Proveedores y precios: más adelante</span></div></div>';
    pintar(html);
  }

  var DESPENSA = [
    { id: 'hay', txt: '✔ Hay', clase: 'ok' },
    { id: 'poco', txt: '◐ Poco', clase: 'poco' },
    { id: 'comprar', txt: '✖ Comprar', clase: 'comprar' }
  ];
  function seccionDe(i) { return (i && (i.seccion || i.categoria)) || 'Otros'; }
  function vCompra(eid) {
    var e = evento(eid);
    if (!e) { ir('/compras'); return; }
    titulo('Compra · ' + e.grupo, '/compras');
    var bloq = eventoBloqueado(e);
    var tot = calcularCompra(eid);
    var ids = Object.keys(tot);
    var extras = vivos(D.extras).filter(function (x) { return x.evento === eid; });
    var rev = ids.filter(function (k) { return lineaCompra(eid, k).despensa; }).length;
    var html = '<div class="tarjeta fina"><b>' + esc(e.grupo) + '</b> · ' + rango(e) + ' · ' + e.personas + ' personas<div class="sub">' + serviciosDe(eid).length + ' servicios · margen ' + D.meta.margen + ' % · ' + rev + ' de ' + ids.length + ' revisados en despensa</div></div>';
    if (bloq) html += '<div class="avisos gris">' + SVG.candado + ' Evento cerrado: la compra solo se puede consultar.</div>';
    if (!ids.length && !extras.length) { pintar(html + '<div class="vacio">Asigna platos al evento para calcular la compra.</div>'); return; }
    html += '<div class="pasos"><div><b>1</b> Mira la despensa y marca cada línea: <span class="chip-m ok">✔ Hay</span> <span class="chip-m poco">◐ Poco</span> <span class="chip-m comprar">✖ Comprar</span></div>' +
      '<div><b>2</b> Ajusta la cantidad si hace falta y añade notas.</div><div><b>3</b> «Enviar pedido» manda solo lo marcado como Poco o Comprar.</div></div>';
    var porSec = {};
    ids.forEach(function (k) { var i = ingrediente(k); if (!i) return; (porSec[seccionDe(i)] = porSec[seccionDe(i)] || []).push(k); });
    Object.keys(porSec).sort(function (a, b) { return a.localeCompare(b, 'es'); }).forEach(function (sec) {
      var g = porSec[sec].sort(function (a, b) { return ingrediente(a).nombre.localeCompare(ingrediente(b).nombre, 'es'); });
      html += '<div class="cat-cab">' + esc(sec) + '</div><div class="tarjeta fina">' + g.map(function (k) {
        var i = ingrediente(k), r = lineaCompra(eid, k), t = tot[k];
        var pres = enPresentacion(t.total, i);
        var cambioMarca = r.marcaRecibida && i.marca && norm(r.marcaRecibida) !== norm(i.marca);
        return '<div class="compra2' + (r.hecho ? ' hecho' : '') + (r.despensa === 'hay' ? ' tengo' : '') + '">' +
          '<div class="c-cab"><label class="c-hecho"><input type="checkbox" aria-label="Comprado" ' + (r.hecho ? 'checked' : '') + (bloq ? ' disabled' : '') + ' onchange="A.compra(\'' + jsq(eid) + '\',\'' + jsq(k) + '\',\'hecho\',this.checked)"></label>' +
          '<div class="c-nom"><span class="nom">' + esc(i.nombre) + '</span> ' + (i.alergenos.length ? iconosDe(i.alergenos, 'p') : '') +
          '<div class="sub peq">Propuesto: <b>' + cantidad(t.total, i.unidad) + '</b>' + (pres ? ' → <b>' + esc(pres) + '</b>' : '') + (t.especial ? ' · incluye ración especial' : '') + (i.congelado ? ' · congelado' : '') + '</div></div></div>' +
          '<div class="c-desp">' + DESPENSA.map(function (d) {
            return '<button class="chip-m ' + d.clase + (r.despensa === d.id ? ' activo' : '') + '"' + (bloq ? ' disabled' : '') + ' onclick="A.compra(\'' + jsq(eid) + '\',\'' + jsq(k) + '\',\'despensa\',\'' + d.id + '\')">' + d.txt + '</button>';
          }).join('') + '</div>' +
          (r.despensa && r.despensa !== 'hay' ? '<div class="dos c-det"><input class="entrada" ' + (bloq ? 'disabled ' : '') + 'value="' + esc(r.ajuste) + '" placeholder="Cantidad: ' + esc(pres || cantidad(t.total, i.unidad)) + '" onchange="A.compra(\'' + jsq(eid) + '\',\'' + jsq(k) + '\',\'ajuste\',this.value)">' +
            '<input class="entrada" ' + (bloq ? 'disabled ' : '') + 'value="' + esc(r.nota) + '" placeholder="Nota (¿girasol para la freidora?)" onchange="A.compra(\'' + jsq(eid) + '\',\'' + jsq(k) + '\',\'nota\',this.value)"></div>' : '') +
          (r.hecho ? '<div class="c-det"><input class="entrada" ' + (bloq ? 'disabled ' : '') + 'value="' + esc(r.marcaRecibida) + '" placeholder="Marca recibida' + (i.marca ? ' (habitual: ' + esc(i.marca) + ')' : '') + '" onchange="A.marcaRecibida(\'' + jsq(eid) + '\',\'' + jsq(k) + '\',this.value)">' +
            (cambioMarca ? '<p class="error-txt">Cambió la marca: revisa los alérgenos de la etiqueta.</p>' : '') + '</div>' : '') +
          '</div>';
      }).join('') + '</div>';
    });
    html += '<div class="cat-cab">A elección de cocina y otros</div><div class="tarjeta fina">' + (extras.length ? extras.map(function (x) {
      return '<div class="compra2' + (x.hecho ? ' hecho' : '') + '"><div class="c-cab"><label class="c-hecho"><input type="checkbox" ' + (x.hecho ? 'checked' : '') + (bloq ? ' disabled' : '') + ' onchange="A.extraHecho(\'' + jsq(x.id) + '\',this.checked)"></label>' +
        '<div class="c-nom' + (bloq ? '' : ' toca" onclick="A.editarExtra(\'' + jsq(eid) + '\',\'' + jsq(x.id) + '\')') + '"><span class="nom">' + esc(x.texto) + '</span> <span class="etiqueta ' + (x.origen === 'eleccion' ? 'modalidad' : 'borrador') + '">' + (x.origen === 'eleccion' ? 'a elección' : 'fuera de menú') + '</span>' +
        '<div class="sub peq">' + esc(x.cantidad || '') + (x.seccion ? ' · ' + esc(x.seccion) : '') + (x.nota ? ' · ' + esc(x.nota) : '') + '</div></div></div></div>';
    }).join('') : '<p class="sub peq">Fruta variada, cosas para ensaladas, desayunos…</p>') +
      (bloq ? '' : '<button class="enlace" onclick="A.editarExtra(\'' + jsq(eid) + '\',\'\')">+ Añadir línea libre</button>') + '</div>';
    if (!bloq) html += '<div class="fila-btns"><button class="btn" onclick="A.compartir(\'' + jsq(eid) + '\')">Enviar pedido</button><button class="btn borde" onclick="A.reiniciarCompra(\'' + jsq(eid) + '\')">Empezar de nuevo</button></div>';
    pintar(html);
  }
  function editarExtra(eid, xid) {
    var x = xid ? porId(D.extras, xid) : null;
    modal(x ? 'Línea libre' : 'Nueva línea libre',
      '<label class="campo"><span>Qué</span><input class="entrada" id="xTxt" value="' + esc(x ? x.texto : '') + '" placeholder="Fruta variada"></label>' +
      '<div class="dos"><label class="campo"><span>Cantidad</span><input class="entrada" id="xCant" value="' + esc(x ? x.cantidad : '') + '" placeholder="para 42 × 3 servicios"></label>' +
      '<label class="campo"><span>Sección</span><input class="entrada" id="xSec" list="secciones2" value="' + esc(x ? x.seccion : '') + '"></label></div>' +
      '<datalist id="secciones2">' + SECCIONES.map(function (s) { return '<option value="' + s + '">'; }).join('') + '</datalist>' +
      '<label class="campo"><span>Tipo</span><select class="entrada" id="xOri"><option value="eleccion"' + (x && x.origen === 'eleccion' ? ' selected' : '') + '>A elección de cocina</option><option value="otros"' + (x && x.origen === 'otros' ? ' selected' : '') + '>Fuera de menú (desayunos, meriendas, despensa)</option></select></label>' +
      '<label class="campo"><span>Nota</span><input class="entrada" id="xNota" value="' + esc(x ? x.nota : '') + '"></label>' +
      '<p class="error-txt" id="xErr" hidden></p><div class="fila-btns">' + (x ? '<button class="btn peligro" id="xBorrar">Quitar</button>' : '') + '<button class="btn" id="xOk">Guardar</button></div>');
    $('#xOk').onclick = function () {
      var t = $('#xTxt').value.trim();
      if (!t) { var er = $('#xErr'); er.textContent = 'Escribe qué hay que comprar.'; er.hidden = false; return; }
      if (!x) { x = { id: nuevoId('x'), evento: eid, hecho: false }; D.extras.push(x); }
      x.texto = t; x.cantidad = $('#xCant').value.trim(); x.seccion = $('#xSec').value.trim(); x.origen = $('#xOri').value; x.nota = $('#xNota').value.trim();
      tocar(x); guardar(); cerrar(); render();
    };
    if (x) $('#xBorrar').onclick = function () { x.borrado = true; tocar(x); guardar(); cerrar(); render(); };
  }
  function textoCompra(eid) {
    var e = evento(eid), tot = calcularCompra(eid);
    var t = '🛒 PEDIDO · ' + e.grupo + '\n' + cap(fechaLarga(e.entrada)) + (e.salida !== e.entrada ? ' → ' + fechaLarga(e.salida) : '') + ' · ' + e.personas + ' personas\n';
    var porSec = {}, sinRevisar = 0;
    Object.keys(tot).forEach(function (k) {
      var i = ingrediente(k), r = lineaCompra(eid, k); if (!i) return;
      if (!r.despensa) sinRevisar++;
      if (r.despensa !== 'poco' && r.despensa !== 'comprar') return;
      var linea = '• ' + i.nombre + ': ' + (r.ajuste || enPresentacion(tot[k].total, i) || cantidad(tot[k].total, i.unidad)) + (r.despensa === 'poco' ? ' (queda poco)' : '') + (r.nota ? ' — ' + r.nota : '');
      (porSec[seccionDe(i)] = porSec[seccionDe(i)] || []).push(linea);
    });
    vivos(D.extras).filter(function (x) { return x.evento === eid && !x.hecho; }).forEach(function (x) {
      (porSec[x.seccion || 'Otros'] = porSec[x.seccion || 'Otros'] || []).push('• ' + x.texto + (x.cantidad ? ': ' + x.cantidad : '') + (x.nota ? ' — ' + x.nota : ''));
    });
    Object.keys(porSec).sort(function (a, b) { return a.localeCompare(b, 'es'); }).forEach(function (sec) {
      t += '\n' + sec.toUpperCase() + '\n' + porSec[sec].join('\n') + '\n';
    });
    if (!Object.keys(porSec).length) t += '\n(Nada marcado para comprar)\n';
    return { texto: t, sinRevisar: sinRevisar };
  }
  function compartir(eid) {
    var r = textoCompra(eid);
    function enviar() {
      if (navigator.share) {
        navigator.share({ title: 'Pedido', text: r.texto }).catch(function (e) { if (!e || e.name !== 'AbortError') copiarTexto(r.texto); });
        return;
      }
      copiarTexto(r.texto);
    }
    if (r.sinRevisar) confirmar(plural(r.sinRevisar, 'línea está', 'líneas están') + ' sin revisar en despensa y no saldrán en el pedido. ¿Enviar de todas formas?', 'Enviar', enviar);
    else enviar();
  }
  function copiarTexto(t) {
    try {
      navigator.clipboard.writeText(t).then(function () { toast('Pedido copiado: pégalo en WhatsApp o en un correo'); },
        function () { mostrarTexto(t); });
    } catch (e) { mostrarTexto(t); }
  }
  function mostrarTexto(t) { modal('Pedido', '<textarea class="entrada" style="min-height:300px" readonly>' + esc(t) + '</textarea><p class="sub peq">Selecciona y copia el texto.</p>'); }

  // =====================================================================
  // PANEL (lo pendiente + estadísticas), con el estilo del panel de la app de eventos
  // =====================================================================
  function kpi(t, v, sub) { return '<div class="kpi"><span class="kpi-t">' + esc(t) + '</span><span class="kpi-v">' + v + '</span>' + (sub ? '<span class="kpi-s">' + esc(sub) + '</span>' : '') + '</div>'; }
  function barras(datos, opc) {
    opc = opc || {};
    var max = Math.max.apply(null, datos.map(function (d) { return d.v; }).concat([1]));
    return '<div class="barras">' + datos.map(function (d) {
      return '<div class="barra-f"' + (d.acc ? ' onclick="' + d.acc + '" style="cursor:pointer"' : '') + '><span class="b-et">' + esc(d.t) + '</span><span class="b-pista"><span class="b-val" style="width:' + Math.max(2, Math.round(d.v / max * 100)) + '%' + (opc.color ? ';background:' + opc.color : '') + '"></span></span><span class="b-num">' + num(d.v, 0) + '</span></div>';
    }).join('') + '</div>';
  }
  function columnas(datos) {
    var max = Math.max.apply(null, datos.map(function (d) { return d.v; }).concat([1]));
    return '<div class="columnas">' + datos.map(function (d) {
      return '<div class="col"><span class="c-num">' + (d.v ? num(d.v, 0) : '') + '</span><span class="c-barra" style="height:' + Math.round(d.v / max * 100) + '%"></span><span class="c-et">' + esc(d.t) + '</span></div>';
    }).join('') + '</div>';
  }

  function periodoActual() {
    var hoy = hoyT(), a = estado.anio || +hoy.slice(0, 4), p = estado.periodo;
    if (p === 'mes') return { desde: hoy.slice(0, 8) + '01', hasta: fechaT(new Date(+hoy.slice(0, 4), +hoy.slice(5, 7), 0)), txt: cap(MESES[+hoy.slice(5, 7) - 1]) + ' ' + hoy.slice(0, 4) };
    if (p === 'trimestre') { var m = +hoy.slice(5, 7) - 1, q = Math.floor(m / 3); return { desde: hoy.slice(0, 4) + '-' + ('0' + (q * 3 + 1)).slice(-2) + '-01', hasta: fechaT(new Date(+hoy.slice(0, 4), q * 3 + 3, 0)), txt: (q + 1) + 'º trimestre ' + hoy.slice(0, 4) }; }
    if (p === 'todo') return { desde: '0000-01-01', hasta: '9999-12-31', txt: 'Todo' };
    return { desde: a + '-01-01', hasta: a + '-12-31', txt: 'Año ' + a };
  }

  function vPanel() {
    titulo('Panel');
    var hoy = hoyT();
    var av = listaAvisos();
    var html = '<div class="panel-cab"><b>Panel · Casa María Madre</b><span class="sub peq">Menús, alergias y compra. Se actualiza solo.</span></div>';

    // ---------- Lo pendiente ----------
    var prox14 = vivos(D.eventos).filter(function (e) { return eventoConMenu(e) && e.salida >= hoy && e.entrada <= sumaDias(hoy, 14); });
    var rac7 = 0;
    vivos(D.servicios).forEach(function (s) { var e = evento(s.evento); if (e && eventoConMenu(e) && s.fecha >= hoy && s.fecha <= sumaDias(hoy, 7)) rac7 += e.personas; });
    var sinEnviar = prox14.filter(function (e) {
      var tot = calcularCompra(e.id), ids = Object.keys(tot);
      return ids.length && ids.some(function (k) { return !lineaCompra(e.id, k).despensa; });
    }).length;
    html += '<div class="kpis">' + kpi('Eventos (14 días)', prox14.length) + kpi('Raciones (7 días)', num(rac7, 0)) + kpi('Avisos', av.length) + kpi('Compras sin revisar', sinEnviar) + '</div>';
    html += htmlAvisos(av);

    html += '<h3>Próximos días</h3>';
    var dias = {};
    vivos(D.servicios).forEach(function (s) {
      var e = evento(s.evento); if (!e || !eventoConMenu(e) || s.fecha < hoy || s.fecha > sumaDias(hoy, 14)) return;
      var d = dias[s.fecha] = dias[s.fecha] || { comida: 0, cena: 0, grupos: [], esp: 0 };
      d[s.turno] += e.personas; d.esp += s.especiales.length;
      if (d.grupos.indexOf(e.grupo) < 0) d.grupos.push(e.grupo);
    });
    var fechas = Object.keys(dias).sort();
    html += fechas.length ? '<div class="tarjeta fina"><table class="tabla"><thead><tr><th>Día</th><th>Grupos</th><th class="n">Comida</th><th class="n">Cena</th><th class="n">Esp.</th></tr></thead><tbody>' + fechas.map(function (f) {
      var d = dias[f];
      return '<tr onclick="A.verDia(\'' + f + '\')"><td>' + cap(fechaCorta(f)) + '</td><td>' + esc(d.grupos.join(', ')) + '</td><td class="n">' + (d.comida || '—') + '</td><td class="n">' + (d.cena || '—') + '</td><td class="n">' + (d.esp || '') + '</td></tr>';
    }).join('') + '</tbody></table><p class="sub peq" style="margin:6px 0 0">Raciones totales por servicio. «Esp.» = raciones especiales.</p></div>' : '<div class="vacio">No hay servicios en las dos próximas semanas.</div>';

    // Carteles de la semana
    var semana = vivos(D.eventos).filter(function (e) { return eventoConMenu(e) && e.salida >= hoy && e.entrada <= sumaDias(hoy, 7); });
    if (semana.length) html += '<h3>Carteles para la puerta (esta semana)</h3><div class="tarjeta fina">' + semana.map(function (e) {
      return '<div class="fila toca" onclick="A.ir(\'/cartel/' + jsq(e.id) + '\')"><span class="izq"><b>' + esc(e.grupo) + '</b><br><span class="sub">' + rango(e) + '</span></span><span class="der">Cartel ›</span></div>';
    }).join('') + '</div>';

    // ---------- Estadísticas ----------
    var per = periodoActual();
    var anios = {};
    vivos(D.eventos).forEach(function (e) { anios[e.entrada.slice(0, 4)] = 1; });
    anios[hoy.slice(0, 4)] = 1;
    html += '<h3>Estadísticas</h3><div class="tarjeta fina"><div class="chips">' + [['mes', 'Este mes'], ['trimestre', 'Trimestre'], ['anio', 'Año'], ['todo', 'Todo']].map(function (x) {
      return '<button class="chip' + (estado.periodo === x[0] ? ' activo' : '') + '" onclick="A.periodo(\'' + x[0] + '\')">' + x[1] + '</button>';
    }).join('') + (estado.periodo === 'anio' ? '<select class="entrada" style="width:auto;min-height:36px;padding:4px 8px" onchange="A.anio(this.value)">' + Object.keys(anios).sort().map(function (a) {
      return '<option' + (String(estado.anio || hoy.slice(0, 4)) === a ? ' selected' : '') + '>' + a + '</option>';
    }).join('') + '</select>' : '') + '</div><p class="sub peq" style="margin:6px 0 0">' + esc(per.txt) + ' · cuenta los servicios con menú de eventos no cancelados.</p></div>';

    var servs = vivos(D.servicios).filter(function (s) { var e = evento(s.evento); return e && eventoConMenu(e) && s.fecha >= per.desde && s.fecha <= per.hasta; });
    var evs = {}, personas = 0, raciones = 0, especiales = 0, usoPlato = {}, usoFam = {}, porMes = {};
    servs.forEach(function (s) {
      var e = evento(s.evento), v = vistaServicio(s);
      if (!evs[e.id]) { evs[e.id] = 1; personas += e.personas; }
      if (!v.filas.length) return;
      raciones += e.personas; especiales += v.especiales.length;
      porMes[s.fecha.slice(0, 7)] = (porMes[s.fecha.slice(0, 7)] || 0) + e.personas;
      v.filas.forEach(function (x) { usoPlato[x.id] = (usoPlato[x.id] || 0) + 1; if (x.curso !== 'postre' || x.familia) usoFam[x.familia || ''] = (usoFam[x.familia || ''] || 0) + 1; });
    });
    html += '<div class="kpis">' + kpi('Eventos', Object.keys(evs).length) + kpi('Personas', num(personas, 0)) + kpi('Servicios', servs.length) + kpi('Raciones', num(raciones, 0)) + '</div>';

    var meses = Object.keys(porMes).sort();
    if (meses.length) {
      html += '<div class="tarjeta"><h2 class="g-t">Raciones por mes</h2>' + columnas(meses.map(function (m) { return { t: MESES_C[+m.slice(5, 7) - 1] + (meses.length > 12 ? ' ' + m.slice(2, 4) : ''), v: porMes[m] }; })) + '</div>';
    }
    var top = Object.keys(usoPlato).map(function (pid) { return { t: nombrePlato(pid), v: usoPlato[pid], acc: "A.ir('/plato/" + jsq(pid) + "')" }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 8);
    if (top.length) html += '<div class="tarjeta"><h2 class="g-t">Platos más servidos</h2>' + barras(top) + '</div>';

    var fams = FAMILIAS.filter(function (f) { return !f.postre; }).map(function (f) { return { t: f.nombre, v: usoFam[f.id] || 0 }; });
    if (usoFam['']) fams.push({ t: 'Sin familia', v: usoFam[''] });
    if (servs.length) html += '<div class="tarjeta"><h2 class="g-t">Equilibrio por familias (primeros y segundos)</h2>' + barras(fams, { color: 'var(--malva)' }) + '</div>';

    var olvid = vivos(D.platos).filter(function (p) { return p.estado === 'aprobado'; }).map(function (p) { return { p: p, u: ultimaVez(p.id) }; })
      .filter(function (x) { return x.u.dias === null || x.u.dias > 60; }).sort(function (a, b) { return (b.u.dias === null ? 9999 : b.u.dias) - (a.u.dias === null ? 9999 : a.u.dias); }).slice(0, 8);
    if (olvid.length) html += '<div class="tarjeta fina"><h2 class="g-t">Platos olvidados (más de 2 meses sin servir)</h2>' + olvid.map(function (x) {
      return '<div class="fila toca" onclick="A.ir(\'/plato/' + jsq(x.p.id) + '\')"><span class="izq">' + esc(x.p.nombre) + '</span><span class="sub">' + esc(x.u.txt) + '</span></div>';
    }).join('') + '</div>';

    var alerg = {};
    vivos(D.comensales).forEach(function (c) { var e = evento(c.evento); if (!e || e.entrada < per.desde || e.entrada > per.hasta) return; c.alergias.forEach(function (a) { alerg[a] = (alerg[a] || 0) + 1; }); });
    var al = Object.keys(alerg).map(function (a) { return { t: AL.info(a).nombre, v: alerg[a] }; }).sort(function (a, b) { return b.v - a.v; });
    html += '<div class="tarjeta"><h2 class="g-t">Alergias en los grupos</h2>' + (al.length ? barras(al, { color: 'var(--ambar)' }) : '<p class="sub">Ninguna en este periodo.</p>') +
      '<p class="sub peq">Raciones especiales preparadas: <b>' + especiales + '</b></p></div>';

    // Compra propuesta frente a pedida
    var lineas = vivos(D.compras).filter(function (c) { var e = evento(c.evento); return e && e.entrada >= per.desde && e.entrada <= per.hasta; });
    var ajust = lineas.filter(function (c) { return c.ajuste; }), tengo = lineas.filter(function (c) { return c.despensa === 'hay'; });
    html += '<div class="tarjeta fina"><h2 class="g-t">Compra: propuesta frente a pedida</h2>' +
      '<div class="fila"><span class="izq">Líneas revisadas en despensa</span><span class="der">' + lineas.filter(function (c) { return c.despensa; }).length + '</span></div>' +
      '<div class="fila"><span class="izq">Ya había en despensa</span><span class="der">' + tengo.length + '</span></div>' +
      '<div class="fila"><span class="izq">Cantidad cambiada a mano</span><span class="der">' + ajust.length + '</span></div>' +
      (ajust.length ? '<p class="sub peq">Últimos ajustes: ' + esc(ajust.slice(-5).map(function (c) { var i = ingrediente(c.ing); return (i ? i.nombre : '¿?') + ' → ' + c.ajuste; }).join(' · ')) + '. Sirven para afinar las cantidades por persona.</p>' : '') + '</div>';

    // Fusiones
    var reg = D.meta.registro.slice(-3).reverse();
    html += '<div class="tarjeta fina"><h2 class="g-t">Fusiones de datos</h2>' + (reg.length ? reg.map(function (r) {
      return '<div class="fila"><span class="izq">' + esc(momento(r.fecha)) + '<br><span class="sub peq">' + esc(r.resumen) + '</span></span></div>';
    }).join('') + '<button class="enlace" onclick="A.ir(\'/registro\')">Ver el registro completo</button>' : '<p class="sub">Todavía no se ha fusionado nada.</p>') + '</div>';

    html += '<div class="kpis prox">' + kpi('Coste por ración', '—', 'Próximamente: faltan precios') + kpi('Valoraciones', '—', 'Fase 2: QR del comedor') + '</div>';
    pintar(html);
  }

  // =====================================================================
  // MÁS
  // =====================================================================
  function vMas() {
    titulo('Más');
    var pend = vivos(D.sugerencias).filter(function (s) { return !s.hecho; }).length;
    var d = dispositivo();
    var dc = D.meta.ultimaCopia ? momento(D.meta.ultimaCopia) : 'nunca';
    var respaldo = null; try { respaldo = localStorage.getItem(CLAVE_RESPALDO); } catch (e) { /* nada */ }
    var html = '<h3>Copia de seguridad</h3><div class="tarjeta fina">' +
      (D.meta.copiaRecomendada ? '<div class="avisos" style="margin:6px 0">Hay cambios importantes desde la última copia.</div>' : '') +
      filaAcc('A.copia()', 'Guardar copia de seguridad', 'Un archivo con TODO. Última: ' + dc) +
      filaAcc('A.elegirArchivo(\'restaurar\')', 'Restaurar desde copia', 'Deja la app como estaba en la copia (antes guarda lo actual)') +
      filaAcc('A.ir(\'/comparar\')', 'Comparar y fusionar con otra copia', 'Para juntar lo hecho en otro móvil u ordenador') +
      (respaldo ? filaAcc('A.recuperarRespaldo()', 'Deshacer la última restauración o fusión', 'Vuelve a como estaba justo antes') : '') +
      '</div><p class="sub peq">Guarda las copias en <b>APP_MENUS\\copias</b> del ordenador (o envíatelas por WhatsApp o correo desde el móvil).</p>';
    html += '<h3>Exportar para leer (Excel)</h3><div class="tarjeta fina">' +
      filaAcc('A.csv(\'platos\')', 'Platos e ingredientes (CSV)', 'Con alérgenos y familias') +
      filaAcc('A.csv(\'menus\')', 'Menús por evento (CSV)', 'Día, servicio, platos y raciones') +
      '<p class="sub peq" style="margin:6px 0">Solo para consultar: no sirven para restaurar.</p></div>';
    html += '<h3>App</h3><div class="tarjeta fina">' +
      fila('/sugerencias', 'Sugerencia o fallo', 'Anota lo que falla o falta' + (pend ? ' · ' + pend + ' pendientes' : '')) +
      fila('/ingredientes', 'Ingredientes', vivos(D.ingredientes).length + ' ingredientes') +
      fila('/menus', 'Menús guardados', vivos(D.menus).length + ' menús') +
      fila('/registro', 'Registro de fusiones', D.meta.registro.length + ' fusiones') +
      fila('/ayuda', 'Ayuda (manual breve)', 'Cómo se usa la app') +
      filaAcc('A.nombrarDispositivo()', 'Nombre de este dispositivo', (d.nombre || 'sin nombre') + ' · código ' + d.id) + '</div>';
    if (!CONFIG.API_URL) {
      html += '<h3>Modo demostración</h3><div class="tarjeta fina">' +
        fila('/gestor-demo', 'Eventos de prueba (simula la app de gestión)', 'Para probar cambios de fechas, personas o alergias') +
        '<div class="fila toca" onclick="A.restablecer()"><span class="izq"><b style="color:var(--error)">Restablecer datos de ejemplo</b><br><span class="sub">Borra lo que hayas cambiado en este dispositivo</span></span><span class="der">›</span></div></div>';
    }
    html += '<p class="sub peq" style="text-align:center">' + esc(CONFIG.NOMBRE_CASA) + ' · Menús ' + esc(CONFIG.VERSION) + '<br>Modo demostración: los datos se guardan solo en este dispositivo.</p>';
    html += '<input type="file" id="archivo" accept=".json,application/json" hidden>';
    pintar(html);
    function fila(r, t, s) { return '<div class="fila toca" onclick="A.ir(\'' + r + '\')"><span class="izq"><b>' + t + '</b><br><span class="sub">' + esc(s) + '</span></span><span class="der">›</span></div>'; }
    function filaAcc(acc, t, s) { return '<div class="fila toca" onclick="' + acc + '"><span class="izq"><b>' + t + '</b><br><span class="sub">' + esc(s) + '</span></span><span class="der">›</span></div>'; }
  }

  // ---------- Copia de seguridad ----------
  function paqueteCopia() {
    return { formato: 'mm-menus-copia', version: VERSION_DATOS, creado: ahora(), app: CONFIG.VERSION, dispositivo: dispositivo(), datos: D };
  }
  function descargarArchivo(nombre, contenido, tipo, compartirMovil) {
    var blob = new Blob([contenido], { type: tipo });
    try {
      if (compartirMovil && navigator.canShare && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        var f = new File([blob], nombre, { type: tipo });
        if (navigator.canShare({ files: [f] })) { navigator.share({ files: [f], title: nombre }).catch(function () {}); return true; }
      }
      var a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = nombre;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
      return true;
    } catch (e) { toast('No se ha podido guardar el archivo en este dispositivo'); return false; }
  }
  function nombreCopia(pref) {
    var d = dispositivo(), n = norm(d.nombre || d.id).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    var t = new Date();
    return (pref || 'menus-copia') + '-' + hoyT() + '-' + ('0' + t.getHours()).slice(-2) + ('0' + t.getMinutes()).slice(-2) + (n ? '-' + n : '') + '.json';
  }
  function copia() {
    D.meta.ultimaCopia = ahora(); D.meta.copiaRecomendada = false; guardar();
    if (descargarArchivo(nombreCopia(), JSON.stringify(paqueteCopia(), null, 1), 'application/json', true)) toast('Copia guardada');
    if (/^#\/(panel|mas)/.test(location.hash)) render();
  }
  function guardarRespaldo() {
    try { localStorage.setItem(CLAVE_RESPALDO, JSON.stringify(paqueteCopia())); return true; } catch (e) { return false; }
  }
  function leerArchivo(fn) {
    var inp = $('#archivo');
    if (!inp) { inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json'; inp.hidden = true; inp.id = 'archivo'; document.body.appendChild(inp); }
    inp.value = '';
    inp.onchange = function () {
      var f = inp.files && inp.files[0]; if (!f) return;
      var r = new FileReader();
      r.onload = function () {
        var datos;
        try { var j = JSON.parse(r.result); datos = { paquete: j, datos: migrar(JSON.parse(r.result)) }; }
        catch (e) { modal('No se puede leer', '<p>' + esc(f.name) + ' no es una copia válida de la app de menús.</p><p class="sub peq">' + esc(e.message) + '</p><button class="btn ancho" onclick="A.cerrar()">Entendido</button>'); return; }
        datos.nombre = f.name;
        fn(datos);
      };
      r.readAsText(f);
    };
    inp.click();
  }
  function resumenDatos(d) {
    return vivos(d.eventos).length + ' eventos · ' + vivos(d.platos).length + ' platos · ' + vivos(d.ingredientes).length + ' ingredientes · ' + vivos(d.servicios).filter(function (s) { return !servicioVacioDe(s); }).length + ' menús';
  }
  function servicioVacioDe(s) { return !CURSOS.some(function (c) { return (s.platos[c.id] || []).length; }); }
  function restaurar(x) {
    var p = x.paquete || {}, disp = p.dispositivo || (x.datos.meta && x.datos.meta.dispositivo) || {};
    modal('Restaurar copia', '<p><b>' + esc(x.nombre) + '</b></p><div class="tarjeta fina">' +
      '<div class="fila"><span class="izq">Fecha de la copia</span><span class="der">' + esc(p.creado ? momento(p.creado) : '¿?') + '</span></div>' +
      '<div class="fila"><span class="izq">Dispositivo</span><span class="der">' + esc(disp.nombre || disp.id || '¿?') + '</span></div>' +
      '<div class="fila"><span class="izq">Contiene</span><span class="der" style="white-space:normal">' + esc(resumenDatos(x.datos)) + '</span></div></div>' +
      '<p>Lo que hay ahora en este dispositivo se <b>sustituirá</b> por la copia. Antes se guarda lo actual para poder deshacerlo (Más → Deshacer).</p>' +
      '<p class="sub peq">Si lo que quieres es juntar lo de los dos sitios, usa «Comparar y fusionar».</p>' +
      '<div class="fila-btns"><button class="btn borde" onclick="A.cerrar()">Cancelar</button><button class="btn peligro" id="resOk">Restaurar</button></div>');
    $('#resOk').onclick = function () {
      guardarRespaldo();
      descargarArchivo(nombreCopia('menus-antes-de-restaurar'), JSON.stringify(paqueteCopia(), null, 1), 'application/json', false);
      var yo = dispositivo();
      D = x.datos; D.meta.dispositivo = yo;
      if (disp.id && disp.id !== yo.id) D.meta.dispositivosConocidos[disp.id] = disp.nombre || disp.id;
      revisarEventos(); guardar(); cerrar(); toast('Copia restaurada'); ir('/panel');
    };
  }
  function recuperarRespaldo() {
    var t = null; try { t = localStorage.getItem(CLAVE_RESPALDO); } catch (e) { /* nada */ }
    if (!t) { toast('No hay nada que deshacer'); return; }
    var p = JSON.parse(t);
    confirmar('Se volverá al estado guardado el ' + momento(p.creado) + ' (justo antes de la última restauración o fusión). Lo hecho después se perderá.', 'Deshacer', function () {
      var yo = dispositivo();
      D = migrar(p); D.meta.dispositivo = yo;
      try { localStorage.removeItem(CLAVE_RESPALDO); } catch (e) { /* nada */ }
      guardar(); toast('Hecho: vuelta al estado anterior'); ir('/panel');
    }, true);
  }

  // ---------- CSV ----------
  function csv(tipo) {
    function c(v) { v = String(v == null ? '' : v); return /[;"\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }
    var filas = [];
    if (tipo === 'platos') {
      filas.push(['Plato', 'Tipo', 'Familia', 'Estado', 'Alérgenos', 'Ingrediente', 'Cantidad por persona', 'Unidad', 'Alérgenos del ingrediente']);
      vivos(D.platos).sort(function (a, b) { return a.nombre.localeCompare(b.nombre, 'es'); }).forEach(function (p) {
        var al = nombresAl(alergenosPlato(p));
        if (!p.ingredientes.length) filas.push([p.nombre, tipoN(p.tipo), familiaN(p.familia), (ESTADOS[p.estado] || {}).nombre, al, '', '', '', '']);
        p.ingredientes.forEach(function (x) {
          var i = ingrediente(x.ing);
          filas.push([p.nombre, tipoN(p.tipo), familiaN(p.familia), (ESTADOS[p.estado] || {}).nombre, al, i ? i.nombre : '¿?', String(x.cant).replace('.', ','), i ? i.unidad : '', i ? nombresAl(i.alergenos) : '']);
        });
      });
    } else {
      filas.push(['Evento', 'Fecha', 'Servicio', 'Modalidad', 'Curso', 'Plato', 'Alérgenos', 'Raciones', 'Raciones especiales']);
      vivos(D.eventos).sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; }).forEach(function (e) {
        serviciosDe(e.id).forEach(function (s) {
          var v = vistaServicio(s);
          v.filas.forEach(function (x) { filas.push([e.grupo, s.fecha, turnoN(s.turno), s.modalidad, x.curso, x.nombre, nombresAl(x.alergenos), v.raciones, v.especiales.length]); });
        });
      });
    }
    var txt = '﻿' + filas.map(function (f) { return f.map(c).join(';'); }).join('\r\n');
    descargarArchivo('menus-' + tipo + '-' + hoyT() + '.csv', txt, 'text/csv;charset=utf-8', true);
  }

  // =====================================================================
  // COMPARAR Y FUSIONAR
  // =====================================================================
  var comp = null; // { nombre, B, paquete, dif, dups, eleccion:{}, dupEleccion:{} }
  var NOMBRES_COL = { ingredientes: 'Ingredientes', platos: 'Platos', menus: 'Menús guardados', eventos: 'Eventos de gestión', servicios: 'Menús de los eventos',
    comensales: 'Comensales con alergias', compras: 'Compra', extras: 'Compra: líneas libres', carteles: 'Carteles', sugerencias: 'Sugerencias' };
  var IGNORAR = { mod: 1, por: 1, foto: 1 };
  var TEXTOS = ['notas', 'texto', 'nota', 'comentario'];

  function etiquetaReg(col, o, datos) {
    if (!o) return '¿?';
    if (o.nombre) return o.nombre;
    if (o.grupo) return o.grupo;
    if (o.texto) return o.texto;
    var ev = porId(datos.eventos, o.evento) || porId(D.eventos, o.evento);
    var g = ev ? ev.grupo : '';
    if (col === 'servicios') return g + ' · ' + fechaCorta(o.fecha) + ' · ' + o.turno;
    if (col === 'comensales') return g + ' · comensal ' + o.cod;
    if (col === 'compras') { var i = porId(datos.ingredientes, o.ing) || ingrediente(o.ing); return g + ' · ' + (i ? i.nombre : o.ing); }
    if (col === 'carteles') return 'Cartel de ' + g;
    return o.id;
  }
  function sinMarcas(o) { var r = {}; Object.keys(o).sort().forEach(function (k) { if (!IGNORAR[k]) r[k] = o[k]; }); return r; }
  function camposDistintos(a, b) {
    var ks = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { if (!IGNORAR[k]) ks[k] = 1; });
    return Object.keys(ks).filter(function (k) { return JSON.stringify(a[k]) !== JSON.stringify(b[k]); });
  }
  function valorLegible(col, campo, v, datos) {
    if (v == null || v === '') return '(vacío)';
    if (campo === 'alergenos' || campo === 'alergias') return nombresAl(v) || '(ninguno)';
    if (campo === 'borrado') return v ? 'eliminado' : 'activo';
    if (campo === 'estado' && ESTADOS[v]) return ESTADOS[v].nombre;
    if (campo === 'familia') return familiaN(v);
    if (campo === 'ingredientes') return v.map(function (x) { var i = porId(datos.ingredientes, x.ing) || ingrediente(x.ing); return (i ? i.nombre : '¿?') + ' ' + x.cant; }).join(', ');
    if (campo === 'platos' && !Array.isArray(v)) return CURSOS.map(function (c) { return (v[c.id] || []).map(function (pid) { var p = porId(datos.platos, pid) || plato(pid); return p ? p.nombre : '¿?'; }).join(' + '); }).filter(Boolean).join(' · ') || '(sin platos)';
    if (campo === 'especiales') return v.length ? v.map(function (x) { return x.comensal + ': ' + (x.platos || []).map(function (pid) { var p = porId(datos.platos, pid) || plato(pid); return p ? p.nombre : '¿?'; }).join(', '); }).join(' · ') : '(ninguna)';
    if (typeof v === 'object') return JSON.stringify(v);
    if (typeof v === 'boolean') return v ? 'sí' : 'no';
    return String(v);
  }
  var CAMPO_N = { nombre: 'Nombre', alergenos: 'Alérgenos', alergias: 'Alergias', estado: 'Estado', familia: 'Familia', ingredientes: 'Ingredientes', platos: 'Platos',
    especiales: 'Raciones especiales', modalidad: 'Modalidad', notas: 'Notas', borrado: 'Situación', personas: 'Personas', entrada: 'Entrada', salida: 'Salida',
    observaciones: 'Observaciones', despensa: 'Despensa', ajuste: 'Cantidad pedida', hecho: 'Comprado', nota: 'Nota', textos: 'Textos', tipo: 'Tipo',
    presentacion: 'Presentación', revisarEsp: 'Revisar raciones especiales', visto: 'Cambio revisado', origen: 'Origen', gestorId: 'Código de gestión', cod: 'Código', unidad: 'Unidad', categoria: 'Categoría', congelado: 'Congelado', revEtiqueta: 'Etiqueta revisada', marcaRecibida: 'Marca recibida', color: 'Color', escala: 'Tamaño de letra', leyenda: 'Leyenda', mostrarModalidad: 'Mostrar modalidad', fecha: 'Fecha', turno: 'Servicio', cantPres: 'Cantidad por presentación', seccion: 'Sección', marca: 'Marca', revisar: 'Revisar etiqueta', comentario: 'Comentario', cantidad: 'Cantidad', texto: 'Texto', margen: 'Margen' };

  function esCritico(col, campos, a, b) {
    if (col === 'ingredientes' && campos.indexOf('alergenos') >= 0) return 'Cambian los alérgenos';
    if (col === 'platos' && campos.indexOf('estado') >= 0) return 'Cambia la aprobación';
    if (col === 'servicios' && campos.indexOf('especiales') >= 0) return 'Cambian las raciones especiales';
    if (col === 'comensales' && campos.indexOf('alergias') >= 0) return 'Cambian las alergias';
    if (col === 'servicios' || col === 'compras') {
      var e = evento(a.evento) || evento(b.evento);
      if (e && eventoBloqueado(e)) return 'Evento pasado';
    }
    return '';
  }

  function calcularDiferencias(A, B) {
    var dif = [];
    COLECCIONES.forEach(function (col) {
      var ma = {}, mb = {};
      (A[col] || []).forEach(function (o) { ma[o.id] = o; });
      (B[col] || []).forEach(function (o) { mb[o.id] = o; });
      var ids = {}; Object.keys(ma).concat(Object.keys(mb)).forEach(function (k) { ids[k] = 1; });
      Object.keys(ids).forEach(function (id) {
        var a = ma[id], b = mb[id];
        if (a && !b) { if (!a.borrado) dif.push({ col: col, id: id, tipo: 'soloEste', a: a }); return; }
        if (b && !a) { if (!b.borrado) dif.push({ col: col, id: id, tipo: 'soloCopia', b: b }); return; }
        if (JSON.stringify(sinMarcas(a)) === JSON.stringify(sinMarcas(b))) { dif.push({ col: col, id: id, tipo: 'igual' }); return; }
        if (a.borrado && b.borrado) { dif.push({ col: col, id: id, tipo: 'igual' }); return; }
        var campos = camposDistintos(a, b);
        var crit = esCritico(col, campos, a, b);
        var textos = campos.every(function (c) { return TEXTOS.indexOf(c) >= 0; });
        dif.push({ col: col, id: id, tipo: 'distinto', a: a, b: b, campos: campos, critico: crit, textos: textos,
          defecto: crit ? '' : ((a.mod || '') >= (b.mod || '') ? 'este' : 'copia') });
      });
    });
    return dif;
  }
  function parecidos(x, y) {
    var a = norm(x).replace(/\b(casera?s?|de la casa)\b/g, '').replace(/\s+/g, ' ').trim(), b = norm(y).replace(/\b(casera?s?|de la casa)\b/g, '').replace(/\s+/g, ' ').trim();
    if (a === b) return true;
    if (a.length > 6 && b.length > 6 && (a.indexOf(b) === 0 || b.indexOf(a) === 0)) return true;
    return a.length > 6 && distancia(a, b) <= 2;
  }
  function distancia(a, b) {
    var m = [], i, j;
    for (i = 0; i <= b.length; i++) m[i] = [i];
    for (j = 0; j <= a.length; j++) m[0][j] = j;
    for (i = 1; i <= b.length; i++) for (j = 1; j <= a.length; j++) m[i][j] = Math.min(m[i - 1][j - 1] + (b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1), m[i][j - 1] + 1, m[i - 1][j] + 1);
    return m[b.length][a.length];
  }
  function calcularDuplicados(A, B, dif) {
    var dups = [];
    ['ingredientes', 'platos', 'menus'].forEach(function (col) {
      var soloA = {}, soloB = {};
      dif.forEach(function (d) { if (d.col !== col) return; if (d.tipo === 'soloEste') soloA[d.id] = 1; if (d.tipo === 'soloCopia') soloB[d.id] = 1; });
      var la = vivos(A[col] || []), lb = vivos(B[col] || []);
      la.forEach(function (a) {
        lb.forEach(function (b) {
          if (a.id === b.id || !(soloA[a.id] || soloB[b.id])) return;
          if (lb.some(function (o) { return o.id === a.id && !o.borrado; }) && la.some(function (o) { return o.id === b.id && !o.borrado; })) return;
          if (parecidos(a.nombre, b.nombre)) dups.push({ col: col, a: a, b: b, clave: col + ':' + a.id + '|' + b.id });
        });
      });
    });
    return dups;
  }

  function vComparar() {
    titulo('Comparar y fusionar', '/mas');
    if (!comp) {
      pintar('<div class="tarjeta"><h2>Comparar con una copia</h2><p>Elige el archivo de copia del otro dispositivo (por ejemplo, <code>menus-copia-…-movil-2.json</code>).</p>' +
        '<p class="sub peq">Comparar no cambia nada: solo enseña qué hay en cada sitio. Después puedes fusionar.</p>' +
        '<button class="btn ancho" onclick="A.elegirArchivo(\'comparar\')">Elegir archivo de copia</button></div>' +
        '<div class="tarjeta fina leyenda-comp"><div>🟢 Solo en este dispositivo</div><div>🔵 Solo en la copia</div><div>🟠 En los dos, pero distinto</div><div>⚪ Iguales</div><div>🟣 Posibles duplicados</div></div>' +
        '<input type="file" id="archivo" accept=".json,application/json" hidden>');
      return;
    }
    var B = comp.B, disp = comp.paquete.dispositivo || (B.meta && B.meta.dispositivo) || {};
    if (disp.id && disp.id !== dispositivo().id && disp.nombre) D.meta.dispositivosConocidos[disp.id] = disp.nombre;
    var nombreB = disp.nombre || ('dispositivo ' + (disp.id || '¿?'));
    var html = '<div class="tarjeta fina"><b>Este dispositivo</b> (' + esc(dispositivo().nombre || dispositivo().id) + ') frente a <b>la copia</b> «' + esc(comp.nombre) + '»<div class="sub peq">Copia de ' + esc(nombreB) + (comp.paquete.creado ? ', ' + esc(momento(comp.paquete.creado)) : '') + '</div>' +
      '<button class="enlace" onclick="A.otraCopia()">Elegir otro archivo</button></div>';
    var cuenta = { soloEste: 0, soloCopia: 0, distinto: 0, igual: 0 };
    comp.dif.forEach(function (d) { cuenta[d.tipo]++; });
    html += '<div class="kpis">' + kpi('🟢 Solo aquí', cuenta.soloEste) + kpi('🔵 Solo en la copia', cuenta.soloCopia) + kpi('🟠 Distintos', cuenta.distinto) + kpi('🟣 Duplicados', comp.dups.length) + '</div>';
    html += '<p class="sub peq">⚪ ' + cuenta.igual + ' registros iguales (no se muestran). Lo nuevo de cada lado se suma. En lo distinto gana por defecto lo más reciente; los casos delicados hay que elegirlos a mano.</p>';
    var faltan = 0;
    COLECCIONES.forEach(function (col) {
      var ds = comp.dif.filter(function (d) { return d.col === col && d.tipo !== 'igual'; });
      var dps = comp.dups.filter(function (d) { return d.col === col; });
      if (!ds.length && !dps.length) return;
      html += '<h3>' + esc(NOMBRES_COL[col]) + '</h3><div class="tarjeta fina">';
      ds.sort(function (x, y) { return ['distinto', 'soloCopia', 'soloEste'].indexOf(x.tipo) - ['distinto', 'soloCopia', 'soloEste'].indexOf(y.tipo); }).forEach(function (d) {
        if (d.tipo === 'soloEste') { html += '<div class="dif"><span class="punto">🟢</span><span class="izq">' + esc(etiquetaReg(col, d.a, D)) + '<br><span class="sub peq">Solo aquí · se queda</span></span></div>'; return; }
        if (d.tipo === 'soloCopia') { html += '<div class="dif"><span class="punto">🔵</span><span class="izq">' + esc(etiquetaReg(col, d.b, B)) + '<br><span class="sub peq">Solo en la copia · se añade · ' + esc(momento(d.b.mod)) + ' por ' + esc(nombreDisp(d.b.por)) + '</span></span></div>'; return; }
        var el = comp.eleccion[col + ':' + d.id] || d.defecto;
        if (!el) faltan++;
        html += '<div class="dif distinto' + (d.critico ? ' critico' : '') + '"><span class="punto">🟠</span><div class="izq"><b>' + esc(etiquetaReg(col, d.a, D)) + '</b>' + (d.critico ? ' <span class="etiqueta corregir">' + esc(d.critico) + ': elige tú</span>' : '') +
          '<table class="tabla comp"><thead><tr><th></th><th>Aquí · ' + esc(momento(d.a.mod)) + '<br><span class="sub peq">' + esc(nombreDisp(d.a.por)) + '</span></th><th>Copia · ' + esc(momento(d.b.mod)) + '<br><span class="sub peq">' + esc(nombreDisp(d.b.por)) + '</span></th></tr></thead><tbody>' +
          d.campos.map(function (c) { return '<tr><td>' + esc(CAMPO_N[c] || c) + '</td><td>' + esc(valorLegible(col, c, d.a[c], D)) + '</td><td>' + esc(valorLegible(col, c, d.b[c], B)) + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<div class="chips elegir">' + [['este', 'Quedarme con este'], ['copia', 'Quedarme con la copia']].concat(d.textos ? [['ambos', 'Juntar los dos textos']] : []).map(function (o) {
            return '<button class="chip' + (el === o[0] ? ' activo' : '') + '" onclick="A.elegirDif(\'' + jsq(col + ':' + d.id) + '\',\'' + o[0] + '\')">' + o[1] + '</button>';
          }).join('') + '</div></div></div>';
      });
      dps.forEach(function (d) {
        var el = comp.dupEleccion[d.clave] || 'distintos';
        html += '<div class="dif dup"><span class="punto">🟣</span><div class="izq"><b>¿Son el mismo?</b> «' + esc(d.a.nombre) + '» (aquí) y «' + esc(d.b.nombre) + '» (copia)' +
          '<div class="chips elegir">' + [['este', 'Sí: dejar el de aquí'], ['copia', 'Sí: dejar el de la copia'], ['distintos', 'No, son distintos']].map(function (o) {
            return '<button class="chip' + (el === o[0] ? ' activo' : '') + '" onclick="A.elegirDup(\'' + jsq(d.clave) + '\',\'' + o[0] + '\')">' + o[1] + '</button>';
          }).join('') + '</div><p class="sub peq">Si son el mismo, los menús y la compra que usaban el otro pasan a usar el elegido.</p></div></div>';
      });
      html += '</div>';
    });
    if (!cuenta.soloCopia && !cuenta.distinto && !comp.dups.length) html += '<div class="vacio">La copia no trae nada nuevo ni distinto. No hace falta fusionar.</div>';
    else html += (faltan ? '<p class="error-txt">Faltan ' + plural(faltan, 'caso delicado', 'casos delicados') + ' por elegir (marcados en rojo).</p>' : '') +
      '<button class="btn ancho" ' + (faltan ? 'disabled' : '') + ' onclick="A.fusionar()">Fusionar…</button>';
    pintar(html);
  }

  function planFusion() {
    var p = { anadir: [], actualizar: [], juntar: [], unificar: [] };
    comp.dif.forEach(function (d) {
      if (d.tipo === 'soloCopia') p.anadir.push(d);
      if (d.tipo === 'distinto') {
        var el = comp.eleccion[d.col + ':' + d.id] || d.defecto;
        if (el === 'copia') p.actualizar.push(d);
        if (el === 'ambos') p.juntar.push(d);
      }
    });
    comp.dups.forEach(function (d) { var el = comp.dupEleccion[d.clave] || 'distintos'; if (el !== 'distintos') p.unificar.push({ d: d, el: el }); });
    return p;
  }
  function textoPlan(p) {
    var porCol = function (lista) { var c = {}; lista.forEach(function (d) { var k = (d.d || d).col; c[k] = (c[k] || 0) + 1; }); return Object.keys(c).map(function (k) { return c[k] + ' ' + NOMBRES_COL[k].toLowerCase(); }).join(', '); };
    var t = [];
    if (p.anadir.length) t.push('Se añadirán ' + p.anadir.length + ' (' + porCol(p.anadir) + ')');
    if (p.actualizar.length) t.push('se actualizarán ' + p.actualizar.length + ' con lo de la copia (' + porCol(p.actualizar) + ')');
    if (p.juntar.length) t.push('se juntarán ' + p.juntar.length + ' textos');
    if (p.unificar.length) t.push('se unificarán ' + p.unificar.length + ' duplicados');
    return t.length ? cap(t.join(', ')) + '.' : 'No hay nada que cambiar.';
  }
  function fusionar() {
    var p = planFusion();
    modal('Fusionar', '<p>' + esc(textoPlan(p)) + '</p><p class="sub peq">Lo que solo está aquí se queda. Antes de fusionar se guarda una copia de lo actual (se descarga y se puede deshacer en Más).</p>' +
      '<div class="fila-btns"><button class="btn borde" onclick="A.cerrar()">Cancelar</button><button class="btn" id="fusOk">Fusionar</button></div>');
    $('#fusOk').onclick = function () { aplicarFusion(p); };
  }
  function aplicarFusion(p) {
    guardarRespaldo();
    descargarArchivo(nombreCopia('menus-antes-de-fusionar'), JSON.stringify(paqueteCopia(), null, 1), 'application/json', false);
    var B = comp.B;
    p.anadir.forEach(function (d) { D[d.col].push(JSON.parse(JSON.stringify(d.b))); });
    p.actualizar.forEach(function (d) { var i = D[d.col].indexOf(porId(D[d.col], d.id)); D[d.col][i] = JSON.parse(JSON.stringify(d.b)); });
    p.juntar.forEach(function (d) {
      var o = porId(D[d.col], d.id);
      d.campos.forEach(function (c) { var a = d.a[c] || '', b = d.b[c] || ''; o[c] = a && b ? a + ' / ' + b : a || b; });
      tocar(o);
    });
    p.unificar.forEach(function (u) {
      var queda = u.el === 'este' ? u.d.a : u.d.b, va = u.el === 'este' ? u.d.b : u.d.a;
      var obj = porId(D[u.d.col], queda.id);
      if (!obj) { obj = JSON.parse(JSON.stringify(queda)); D[u.d.col].push(obj); }
      remapear(u.d.col, va.id, queda.id);
      var viejo = porId(D[u.d.col], va.id);
      if (viejo) { viejo.borrado = true; tocar(viejo); }
    });
    (B.modalidades || []).forEach(function (m) { if (D.modalidades.indexOf(m) < 0) D.modalidades.push(m); });
    (B.propios || []).forEach(function (m) { if (D.propios.indexOf(m) < 0) D.propios.push(m); });
    var dB = comp.paquete.dispositivo || (B.meta && B.meta.dispositivo);
    if (dB && dB.id) D.meta.dispositivosConocidos[dB.id] = dB.nombre || dB.id;
    Object.keys((B.meta && B.meta.dispositivosConocidos) || {}).forEach(function (k) { if (!D.meta.dispositivosConocidos[k]) D.meta.dispositivosConocidos[k] = B.meta.dispositivosConocidos[k]; });
    ((B.meta && B.meta.registro) || []).forEach(function (r) { if (!D.meta.registro.some(function (x) { return x.fecha === r.fecha && x.resumen === r.resumen; })) D.meta.registro.push(r); });
    D.meta.registro.sort(function (a, b) { return a.fecha < b.fecha ? -1 : 1; });
    D.meta.registro.push({ fecha: ahora(), dispositivo: dispositivo().id, nombre: dispositivo().nombre, con: dB ? (dB.nombre || dB.id) : comp.nombre, archivo: comp.nombre, resumen: textoPlan(p) });
    D.meta.copiaRecomendada = true;
    comp = null;
    revisarEventos(); guardar(); cerrar(); toast('Fusión hecha'); ir('/registro');
  }
  /** Cambia todas las referencias a un plato o ingrediente unificado. */
  function remapear(col, de, a) {
    if (col === 'ingredientes') {
      D.platos.forEach(function (p) { var c = false; p.ingredientes.forEach(function (x) { if (x.ing === de) { x.ing = a; c = true; } }); if (c) tocar(p); });
      D.compras.forEach(function (c) { if (c.ing === de) { c.ing = a; tocar(c); } });
    }
    if (col === 'platos') {
      function cambia(lista) { var c = false; for (var i = 0; i < lista.length; i++) if (lista[i] === de) { lista[i] = a; c = true; } return c; }
      D.servicios.forEach(function (s) {
        var c = false;
        CURSOS.forEach(function (cc) { if (cambia(s.platos[cc.id] || [])) c = true; });
        s.especiales.forEach(function (es) { if (cambia(es.platos || [])) c = true; });
        if (c) tocar(s);
      });
      D.menus.forEach(function (m) { var c = false; CURSOS.forEach(function (cc) { if (cambia(m.platos[cc.id] || [])) c = true; }); if (c) tocar(m); });
    }
  }
  function vRegistro() {
    titulo('Registro de fusiones', '/mas');
    var r = D.meta.registro.slice().reverse();
    pintar(r.length ? '<div class="tarjeta fina">' + r.map(function (x) {
      return '<div class="fila" style="display:block"><b>' + esc(momento(x.fecha)) + '</b> · en ' + esc(x.nombre || nombreDisp(x.dispositivo)) + ' con ' + esc(x.con || '¿?') +
        '<div class="sub">' + esc(x.resumen) + '</div>' + (x.archivo ? '<div class="sub peq">Archivo: ' + esc(x.archivo) + '</div>' : '') + '</div>';
    }).join('') + '</div>' : '<div class="vacio">Todavía no se ha fusionado nada.</div>');
  }

  // =====================================================================
  // EVENTOS DE PRUEBA (solo modo demostración: imita la app de gestión)
  // =====================================================================
  function vGestorDemo(id) {
    titulo('Eventos de prueba', '/mas');
    if (id) { formGestor(id); return; }
    var html = '<div class="avisos gris">Solo en modo demostración. Aquí se imita lo que llegará de la app de gestión, para probar cómo reacciona la app de menús. En la versión real, estos datos no se pueden tocar desde aquí.</div>';
    html += '<div class="tarjeta fina">' + vivos(D.eventos).sort(function (a, b) { return a.entrada < b.entrada ? -1 : 1; }).map(function (e) {
      return '<div class="fila toca" onclick="A.ir(\'/gestor-demo/' + jsq(e.id) + '\')"><span class="izq"><b>' + esc(e.grupo) + '</b> ' + etiquetasEvento(e) + '<br><span class="sub">' + rango(e) + ' · ' + e.personas + ' pers.</span></span><span class="der">›</span></div>';
    }).join('') + '</div><button class="btn ancho" onclick="A.ir(\'/gestor-demo/nuevo\')">+ Nuevo evento de prueba</button>';
    pintar(html);
  }
  function formGestor(id) {
    var e = id === 'nuevo' ? null : evento(id), hoy = hoyT();
    var v = e || { grupo: '', tipo: 'Alojamiento', entrada: sumaDias(hoy, 7), salida: sumaDias(hoy, 9), personas: 30, estado: 'Confirmada', observaciones: '' };
    pintar('<div class="avisos gris">Simulación de la app de gestión.</div><div class="tarjeta">' +
      '<label class="campo"><span>Grupo</span><input class="entrada" id="gGrupo" value="' + esc(v.grupo) + '"></label>' +
      '<div class="dos"><label class="campo"><span>Entrada</span><input class="entrada" type="date" id="gEnt" value="' + v.entrada + '"></label><label class="campo"><span>Salida</span><input class="entrada" type="date" id="gSal" value="' + v.salida + '"></label></div>' +
      '<div class="dos"><label class="campo"><span>Personas</span><input class="entrada" type="number" min="1" id="gPer" value="' + v.personas + '"></label>' +
      '<label class="campo"><span>Estado</span><select class="entrada" id="gEst">' + ['Provisional', 'Confirmada', 'Cancelada'].map(function (x) { return '<option' + (v.estado === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label></div>' +
      '<label class="campo"><span>Tipo</span><select class="entrada" id="gTipo">' + ['Alojamiento', 'Día / sala', 'Bloqueo'].map(function (x) { return '<option' + (v.tipo === x ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></label>' +
      '<label class="campo"><span>Observaciones (prueba la línea <code>ALERGIAS: huevo - miel, girasol</code>)</span><textarea class="entrada" id="gObs">' + esc(v.observaciones) + '</textarea></label>' +
      '<p class="error-txt" id="gErr" hidden></p></div><button class="btn ancho" id="gOk">Guardar (como si viniera de gestión)</button>');
    $('#gOk').onclick = function () {
      var g = $('#gGrupo').value.trim(), en = $('#gEnt').value, sa = $('#gSal').value, pe = parseInt($('#gPer').value, 10);
      var err = !g ? 'Escribe el grupo.' : (!en || !sa || sa < en) ? 'Revisa las fechas.' : !(pe > 0) ? 'Indica las personas.' : '';
      if (err) { var x = $('#gErr'); x.textContent = err; x.hidden = false; return; }
      if (!e) { e = { id: nuevoId('e'), gestorId: 'R-' + Math.floor(1000 + Math.random() * 9000), origen: 'gestor', borrado: false }; D.eventos.push(e); }
      var nuevo = !e.visto;
      e.grupo = g; e.entrada = en; e.salida = sa; e.personas = pe; e.estado = $('#gEst').value; e.tipo = $('#gTipo').value; e.observaciones = $('#gObs').value.trim();
      if (nuevo) e.visto = { entrada: en, salida: sa, personas: pe, estado: e.estado };
      e.mod = ahora(); e.por = 'gestor';
      revisarEventos(); guardar(); toast('Evento actualizado (simulación)'); ir('/evento/' + e.id);
    };
  }

  function vMenus() {
    titulo('Menús guardados', '/mas');
    var ms = vivos(D.menus);
    var html = ms.length ? ms.map(function (m) {
      var ps = [];
      CURSOS.forEach(function (c) { (m.platos[c.id] || []).forEach(function (pid) { var p = plato(pid); if (p) ps.push(p.nombre); }); });
      return '<div class="tarjeta fina"><div class="servicio-cab"><b>' + esc(m.nombre) + '</b>' + (m.modalidad ? '<span class="etiqueta modalidad">' + esc(m.modalidad) + '</span>' : '') + '</div>' +
        '<div class="sub">' + esc(ps.join(' · ')) + '</div><button class="enlace" style="color:var(--error)" onclick="A.borrarMenu(\'' + jsq(m.id) + '\')">Eliminar</button></div>';
    }).join('') : '<div class="vacio">Aún no hay menús guardados.</div>';
    html += '<p class="sub peq">Para guardar un menú: abre una comida o cena de un evento → «Guardar como menú».</p>';
    pintar(html);
  }

  function vSugerencias() {
    titulo('Sugerencia o fallo', '/mas');
    var html = '<div class="tarjeta"><label class="campo"><span>¿Qué falla o qué falta?</span><textarea class="entrada" id="sugTxt" placeholder="No encuentro dónde cambiar el número de personas"></textarea></label>' +
      '<p class="error-txt" id="sugErr" hidden></p><button class="btn ancho" onclick="A.enviarSug()">Anotar</button></div>';
    var ord = vivos(D.sugerencias).slice().reverse();
    html += '<h3>Anotadas</h3>' + (ord.length ? '<div class="tarjeta fina">' + ord.map(function (s) {
      return '<div class="fila"><label class="izq" style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" style="width:20px;height:20px;margin-top:2px" ' + (s.hecho ? 'checked' : '') + ' onchange="A.sugHecha(\'' + jsq(s.id) + '\',this.checked)">' +
        '<span' + (s.hecho ? ' style="text-decoration:line-through;color:var(--texto-2)"' : '') + '>' + esc(s.texto) + '<br><span class="sub peq">' + fechaCorta(s.fecha) + ' · ' + esc(nombreDisp(s.por)) + '</span></span></label></div>';
    }).join('') + '</div>' : '<div class="vacio">Nada anotado.</div>');
    pintar(html);
  }

  function vAyuda() {
    titulo('Ayuda', '/mas');
    var pasos = [
      ['Entrar', 'Abre la app en el móvil. La primera vez, «Añadir a pantalla de inicio». Ponle nombre al dispositivo en Más.'],
      ['Panel', 'Es el inicio: lo pendiente (avisos, próximos días, carteles de la semana) y las estadísticas.'],
      ['Eventos', 'Llegan de la app de gestión y no se cambian aquí. Si un dato está mal, avisa por teléfono. Los pasados quedan archivados (Ver eventos pasados).'],
      ['Alergias', 'Gestión las escribe en observaciones así: ALERGIAS: huevo - miel, girasol - soja. Cada guion con espacios separa una persona; las comas, las alergias de esa persona. Nunca nombres. La app crea A, B, C sola.'],
      ['Ingredientes', 'Compras → Ingredientes: nombre, unidad, presentación de compra (lata de 3 kg…), sección y alérgenos. Un producto comercial (merluza empanada congelada) es un solo ingrediente con los alérgenos de su etiqueta.'],
      ['Platos', 'Platos → + Nuevo plato: nombre, tipo, familia y sus ingredientes con la cantidad para una persona. Los alérgenos salen solos. Queda pendiente de aprobar.'],
      ['Aprobar', 'El jefe de cocina abre el plato (aviso en el Panel) → Aprobar o Pedir corrección. Solo los aprobados se pueden poner en un menú.'],
      ['Asignar el menú', 'Evento → Por días → toca la comida o cena → modalidad → + Elegir primero, segundo y postre. En «Lista» se cambia todo rápido; en «Por familias» se revisa el equilibrio.'],
      ['Raciones especiales', 'En el servicio mira las alergias de A, B, C. Si alguien no puede comer algo → + Ración especial → elige su plato. Si cambias un plato, la app te pedirá revisarlas.'],
      ['Cartel de la puerta', 'Evento → Cartel para la puerta → Personalizar (textos, notas, color, tamaño) → Imprimir / Guardar PDF.'],
      ['Compra', 'Compras → el evento → marca cada línea: Hay, Poco o Comprar → ajusta cantidades y notas → Enviar pedido (solo sale lo de Poco y Comprar). Al recibir, marca lo comprado y la marca si cambió.'],
      ['Copia de seguridad', 'Más → Guardar copia de seguridad, al menos cada semana. El Panel avisa si hace más de 7 días.'],
      ['Varios móviles', 'Más → Comparar y fusionar: elige la copia del otro móvil, revisa las diferencias y fusiona. Los casos delicados (alérgenos, aprobación, raciones especiales) se eligen a mano.'],
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
  function quitarDe(sid, curso, pid) {
    var s = servicio(sid), l = s.platos[curso] || [], k = l.indexOf(pid);
    if (k >= 0) l.splice(k, 1);
    marcarRevisionEsp(s); tocar(s); guardar();
  }
  window.A = {
    ir: ir, cerrar: cerrar,
    volverEleg: function (r) { estado.volverEleg = r; },
    vistaEv: function (v) { estado.vistaEv = v; render(); },
    vistaPlatosEv: function (v) { estado.vistaPlatosEv = v; render(); },
    modoDias: function (v) { estado.modoDias = v; render(); },
    mes: function (d) { var m = fechaD(estado.mesCal); m.setMonth(m.getMonth() + d); estado.mesCal = fechaT(m); render(); },
    diaSel: function (t) { estado.diaSel = t; render(); },
    verDia: function (t) { estado.vistaEv = 'cal'; estado.diaSel = t; estado.mesCal = t.slice(0, 7) + '-01'; ir('/eventos'); },
    filtrarPlatos: function (f) { estado.filtroPlatos = f; if (location.hash !== '#/platos') location.hash = '/platos'; else render(); },
    periodo: function (p) { estado.periodo = p; render(); },
    anio: function (a) { estado.anio = +a; render(); },
    vistoEvento: function (eid) { var e = evento(eid); e.visto = { entrada: e.entrada, salida: e.salida, personas: e.personas, estado: e.estado }; guardar(); render(); },
    nuevoServicio: nuevoServicio, editarComensal: editarComensal, tocarPlato: tocarPlato,
    togAlCom: function (a, btn) { togSel(A._com.sel, a, btn); },
    togAlIng: function (a, btn) { togSel(A._ing.sel, a, btn); },
    nuevoPropio: nuevoPropio,
    modalidad: function (sid, m) { var s = servicio(sid); s.modalidad = s.modalidad === m ? '' : m; tocar(s); guardar(); render(); },
    otraModalidad: function (sid) {
      pedirTexto('Nueva modalidad', 'Nombre (por ejemplo, Vegetariano)', '', function (m) {
        m = cap(m); if (D.modalidades.indexOf(m) < 0) D.modalidades.push(m);
        var s = servicio(sid); s.modalidad = m; tocar(s); guardar(); render();
      });
    },
    aplicarMenu: function (sid, mid) {
      var s = servicio(sid), m = porId(D.menus, mid);
      var fn = function () { s.platos = JSON.parse(JSON.stringify(m.platos)); if (m.modalidad) s.modalidad = m.modalidad; marcarRevisionEsp(s); tocar(s); guardar(); render(); toast('Menú aplicado'); };
      if (servicioVacio(s)) fn(); else confirmar('Se sustituirán los platos de este servicio por los del menú «' + m.nombre + '».', 'Sustituir', fn);
    },
    guardarMenu: function (sid) {
      var s = servicio(sid);
      if (servicioVacio(s)) { toast('Primero elige los platos'); return; }
      pedirTexto('Guardar como menú', 'Nombre del menú', (s.modalidad ? s.modalidad + ' ' : 'Menú ') + (vivos(D.menus).length + 1), function (n) {
        D.menus.push(tocar({ id: nuevoId('m'), nombre: n, modalidad: s.modalidad, platos: JSON.parse(JSON.stringify(s.platos)) })); guardar(); render(); toast('Menú guardado');
      });
    },
    borrarMenu: function (mid) { confirmar('Se eliminará este menú guardado (no afecta a los eventos).', 'Eliminar', function () { var m = porId(D.menus, mid); m.borrado = true; tocar(m); guardar(); render(); }, true); },
    quitarPlatoId: function (sid, curso, pid) { quitarDe(sid, curso, pid); render(); },
    listoServicio: function (sid) { var s = servicio(sid); if (!servicioVacio(s)) recomendarCopia(); guardar(); ir('/evento/' + s.evento); },
    espRevisadas: function (sid) { var s = servicio(sid); s.revisarEsp = false; tocar(s); guardar(); render(); },
    nuevaEsp: nuevaEsp, crearEsp: crearEsp,
    quitarEsp: function (sid, i) { var s = servicio(sid); s.especiales.splice(i, 1); tocar(s); guardar(); render(); toast('Ración especial quitada'); },
    vaciarEsp: function (sid, i) { var s = servicio(sid); s.especiales[i].platos = []; tocar(s); guardar(); render(); },
    borrarServicio: function (sid) {
      var s = servicio(sid);
      confirmar('Se eliminará la ' + s.turno + ' del ' + fechaCorta(s.fecha) + '.', 'Eliminar', function () {
        s.borrado = true; tocar(s); guardar(); ir('/evento/' + s.evento);
      }, true);
    },
    tipoEleg: function (t) { filtroElegir.tipo = t; render(); },
    elegido: elegido,
    aprobar: function (id) { var p = plato(id); p.estado = 'aprobado'; p.comentario = ''; tocar(p); recomendarCopia(); guardar(); render(); toast('Plato aprobado'); },
    pedirCorreccion: pedirCorreccion,
    editarPlato: function (id) { borradorPlato = null; ir('/plato-editar/' + id); },
    duplicar: function (id) {
      var p = plato(id), n = JSON.parse(JSON.stringify(p));
      n.id = nuevoId('p'); n.nombre = p.nombre + ' (variante)'; n.estado = 'pendiente'; n.comentario = ''; tocar(n);
      D.platos.push(n); guardar(); borradorPlato = null; ir('/plato-editar/' + n.id); toast('Copia creada: cambia el nombre y los ingredientes');
    },
    borrarPlato: function (id) {
      var u = usosPlato(id);
      if (u) { modal('No se puede eliminar', '<p>Este plato está en ' + plural(u, 'servicio', 'servicios') + '. Quítalo antes de los menús.</p><button class="btn ancho" onclick="A.cerrar()">Entendido</button>'); return; }
      confirmar('Se eliminará el plato «' + plato(id).nombre + '».', 'Eliminar', function () { var p = plato(id); p.borrado = true; tocar(p); guardar(); ir('/platos'); }, true);
    },
    cantIng: function (k, v) { borradorPlato.ingredientes[k].cant = parseFloat(String(v).replace(',', '.')) || 0; },
    quitarIng: function (k) { borradorPlato.ingredientes.splice(k, 1); render(); },
    ingRapido: ingRapido, guardarPlato: guardarPlato,
    unidadIng: function (u) { A._ing.b.unidad = u; vIngredienteForm(A._ing.id); },
    guardarIng: guardarIng,
    etiquetaRevisada: function (id) { var i = ingrediente(id); i.revisar = false; i.revEtiqueta = hoyT(); tocar(i); guardar(); A._ing = null; render(); toast('Etiqueta revisada'); },
    borrarIng: function (id) { confirmar('Se eliminará el ingrediente.', 'Eliminar', function () { var i = ingrediente(id); i.borrado = true; tocar(i); A._ing = null; guardar(); ir('/ingredientes'); }, true); },
    compra: function (eid, k, campo, v) {
      var c = lineaCompra(eid, k, true);
      if (campo === 'despensa') v = c.despensa === v ? '' : v;
      c[campo] = typeof v === 'string' ? v.trim() : v; tocar(c); guardar();
      if (campo === 'despensa' || campo === 'hecho') render();
    },
    marcaRecibida: function (eid, k, v) {
      var c = lineaCompra(eid, k, true), i = ingrediente(k);
      c.marcaRecibida = v.trim(); tocar(c);
      if (c.marcaRecibida && i.marca && norm(c.marcaRecibida) !== norm(i.marca)) { i.revisar = true; tocar(i); toast('Cambió la marca: «' + i.nombre + '» queda para revisar la etiqueta'); }
      guardar(); render();
    },
    editarExtra: editarExtra,
    extraHecho: function (id, v) { var x = porId(D.extras, id); x.hecho = v; tocar(x); guardar(); render(); },
    compartir: compartir,
    reiniciarCompra: function (eid) {
      confirmar('Se borrarán las marcas de despensa, ajustes, notas y comprados de este pedido.', 'Empezar de nuevo', function () {
        D.compras.forEach(function (c) { if (c.evento === eid && !c.borrado) { c.borrado = true; tocar(c); } });
        guardar(); render();
      });
    },
    margenGeneral: function () {
      pedirTexto('Margen de compra general', 'Porcentaje que se añade a las raciones (por ejemplo, 10)', String(D.meta.margen), function (v) {
        var n = parseInt(v, 10); if (!(n >= 0 && n <= 100)) { toast('Pon un número entre 0 y 100'); return; }
        D.meta.margen = n; guardar(); render();
      });
    },
    enviarSug: function () {
      var t = $('#sugTxt').value.trim();
      if (!t) { var x = $('#sugErr'); x.textContent = 'Escribe algo.'; x.hidden = false; return; }
      D.sugerencias.push(tocar({ id: nuevoId('g'), fecha: hoyT(), texto: t, hecho: false })); guardar(); render(); toast('Anotado. ¡Gracias!');
    },
    sugHecha: function (id, v) { var s = porId(D.sugerencias, id); s.hecho = v; tocar(s); guardar(); render(); },
    copia: copia, csv: csv, recuperarRespaldo: recuperarRespaldo,
    elegirArchivo: function (para) {
      leerArchivo(function (x) {
        if (para === 'restaurar') { restaurar(x); return; }
        var B = x.datos;
        comp = { nombre: x.nombre, B: B, paquete: x.paquete.formato === 'mm-menus-copia' ? x.paquete : {}, eleccion: {}, dupEleccion: {} };
        comp.dif = calcularDiferencias(D, B);
        comp.dups = calcularDuplicados(D, B, comp.dif);
        if (location.hash !== '#/comparar') ir('/comparar'); else render();
      });
    },
    otraCopia: function () { comp = null; render(); },
    elegirDif: function (k, v) { comp.eleccion[k] = v; var y = window.scrollY; render(); window.scrollTo(0, y); },
    elegirDup: function (k, v) { comp.dupEleccion[k] = v; var y = window.scrollY; render(); window.scrollTo(0, y); },
    fusionar: fusionar,
    nombrarDispositivo: function () {
      pedirTexto('Nombre de este dispositivo', 'Por ejemplo: Cocina – móvil 1, Ordenador despacho', dispositivo().nombre, function (n) {
        dispositivo().nombre = n.slice(0, 40); D.meta.dispositivo.preguntado = true; guardar(); render(); toast('Nombre guardado');
      });
    },
    restablecer: function () {
      confirmar('Se borrarán todos los cambios hechos en este dispositivo y se cargarán de nuevo los datos de ejemplo. Guarda antes una copia si quieres conservarlos.', 'Restablecer', function () {
        restablecer(); revisarEventos(); estado.mesCal = null; ir('/panel'); toast('Datos de ejemplo cargados');
      }, true);
    },
    personalizar: function () { cartelEdicion = !cartelEdicion; render(); },
    restaurarCartel: function (eid) {
      confirmar('Todos los textos del cartel vuelven al original (también color y tamaño).', 'Volver al original', function () {
        var k = cartelDe(eid, true), d = D.meta.cartelDefecto;
        k.textos = {}; k.color = d.color; k.escala = d.escala; k.mostrarModalidad = d.mostrarModalidad; k.leyenda = d.leyenda; tocar(k); guardar(); render();
      });
    },
    cartelPorDefecto: function (eid) {
      var k = cartelDe(eid, true), d = D.meta.cartelDefecto;
      d.color = k.color; d.escala = k.escala; d.mostrarModalidad = k.mostrarModalidad; d.leyenda = k.leyenda;
      if (k.textos.aviso) d.aviso = k.textos.aviso;
      if (k.textos.pie) d.pie = k.textos.pie;
      guardar(); toast('Guardado: los carteles nuevos saldrán con este aviso, pie, color y tamaño');
    },
    imprimir: function () {
      if (cartelEdicion) { cartelEdicion = false; render(); }
      setTimeout(function () { try { window.print(); } catch (e) { toast('Este visor no permite imprimir: abre la app en el navegador'); } }, 150);
    },
    nuevoPlato: function () { borradorPlato = null; ir('/plato-editar/nuevo'); }
  };

  // =====================================================================
  // ARRANQUE
  // =====================================================================
  function iniciar() {
    cargar();
    dispositivo();
    revisarEventos();
    $('#tituloCasa').textContent = CONFIG.NOMBRE_CASA + ' · ' + CONFIG.NOMBRE_APP;
    $('#aviso').hidden = !!CONFIG.API_URL;
    $('#aviso').textContent = 'Versión de prueba ' + CONFIG.VERSION + ' · los datos se guardan solo en este dispositivo. Guarda copias en Más.';
    $$('#menu button').forEach(function (b) {
      b.onclick = function () {
        if (b.dataset.ir === 'platos') borradorPlato = null;
        ir('/' + b.dataset.ir);
      };
    });
    window.addEventListener('hashchange', render);
    render();
    if (!D.meta.dispositivo.nombre && !D.meta.dispositivo.preguntado) {
      D.meta.dispositivo.preguntado = true; guardar();
      setTimeout(function () {
        if (!$('#modal').hidden) return;
        pedirTexto('¿Cómo llamamos a este dispositivo?', 'Sirve para saber de dónde viene cada cambio al fusionar (por ejemplo: Cocina – móvil 1)', '', function (n) {
          dispositivo().nombre = n.slice(0, 40); guardar(); render();
        });
      }, 400);
    }
    if ('serviceWorker' in navigator && location.protocol === 'https:') {
      navigator.serviceWorker.register('sw.js').catch(function () {});
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar); else iniciar();
})();
