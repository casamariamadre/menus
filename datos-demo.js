/*
 * Datos de ejemplo para el MODO DEMOSTRACIÓN (formato 2).
 * Se cargan la primera vez o al pulsar «Restablecer datos de ejemplo» en Más.
 *
 * Los identificadores de ejemplo son FIJOS (empiezan por «d-»): así, dos dispositivos que
 * parten de los mismos datos de ejemplo no generan duplicados al fusionar.
 * Lo que se cree después lleva un código único por dispositivo.
 *
 * Los EVENTOS imitan lo que llegará de la app de gestión de eventos (solo lectura).
 */
window.DATOS_DEMO = function () {
  var T0 = '2026-11-18T20:00:00.000Z', POR = 'ejemplo';
  function r(o) { o.mod = T0; o.por = POR; o.borrado = false; return o; }
  var ing = function (id, nombre, unidad, categoria, alergenos, extra) {
    var o = { id: 'd-' + id, nombre: nombre, unidad: unidad, categoria: categoria, alergenos: alergenos || [],
      presentacion: '', cantPres: 0, congelado: false, seccion: '', marca: '', revEtiqueta: '', revisar: false };
    for (var k in (extra || {})) o[k] = extra[k];
    return r(o);
  };
  var pl = function (id, nombre, tipo, familia, estado, ings, extra) {
    var p = { id: 'd-' + id, nombre: nombre, tipo: tipo, familia: familia, estado: estado, comentario: '', notas: '', margen: null,
      ingredientes: ings.map(function (x) { return { ing: 'd-' + x[0], cant: x[1] }; }) };
    for (var k in (extra || {})) p[k] = extra[k];
    return r(p);
  };
  var ev = function (id, gid, grupo, tipo, entrada, salida, personas, estado, obs) {
    var e = { id: 'd-' + id, gestorId: gid, grupo: grupo, tipo: tipo, entrada: entrada, salida: salida, personas: personas,
      estado: estado, observaciones: obs, origen: 'gestor' };
    e.visto = { entrada: entrada, salida: salida, personas: personas, estado: estado };
    return r(e);
  };
  var sv = function (eid, fecha, turno, modalidad, pri, seg, pos, esp) {
    return r({ id: 's-d-' + eid + '-' + fecha + '-' + turno, evento: 'd-' + eid, fecha: fecha, turno: turno, modalidad: modalidad,
      platos: { primero: pri ? ['d-' + pri] : [], segundo: seg ? ['d-' + seg] : [], postre: pos ? ['d-' + pos] : [] },
      especiales: (esp || []).map(function (x) { return { comensal: x[0], platos: x[1].map(function (p) { return 'd-' + p; }) }; }),
      revisarEsp: false, foto: null });
  };
  return {
    formato: 'mm-menus', version: 2,
    meta: { dispositivo: null, ultimaCopia: '', copiaRecomendada: false, margen: 10, registro: [],
      cartelDefecto: { aviso: 'Si tiene alguna alergia o intolerancia, avise al personal de cocina.', pie: '', color: '#85200C', escala: 100, mostrarModalidad: true, leyenda: 'todos' } },
    modalidades: ['Con carne', 'Ligero', 'Pescado', 'Domingo'],
    propios: ['p:Miel', 'p:Girasol'],
    ingredientes: [
      ing('i1', 'Merluza empanada congelada', 'ud.', 'Pescados', ['gluten', 'huevo', 'pescado', 'p:Girasol'],
        { presentacion: 'caja de 40 raciones', cantPres: 40, congelado: true, seccion: 'Congelados', revisar: true }),
      ing('i2', 'Harina de trigo', 'g', 'Despensa', ['gluten'], { presentacion: 'paquete de 1 kg', cantPres: 1000 }),
      ing('i3', 'Huevo', 'ud.', 'Huevos y lácteos', ['huevo'], { presentacion: 'bandeja de 30', cantPres: 30 }),
      ing('i4', 'Aceite de girasol', 'ml', 'Aceites y condimentos', ['p:Girasol'], { presentacion: 'garrafa de 5 l', cantPres: 5000 }),
      ing('i5', 'Aceite de oliva', 'ml', 'Aceites y condimentos', [], { presentacion: 'garrafa de 5 l', cantPres: 5000 }),
      ing('i6', 'Sal', 'g', 'Aceites y condimentos'),
      ing('i7', 'Judías verdes (lata)', 'g', 'Verduras y frutas', [], { presentacion: 'lata de 3 kg', cantPres: 3000, seccion: 'Despensa' }),
      ing('i8', 'Tomate frito (bote)', 'g', 'Despensa'),
      ing('i9', 'Patatas fritas congeladas', 'g', 'Verduras y frutas', ['p:Girasol'],
        { presentacion: 'bolsa de 2,5 kg', cantPres: 2500, congelado: true, seccion: 'Congelados', revisar: true }),
      ing('i10', 'Cebolla', 'g', 'Verduras y frutas'),
      ing('i11', 'Ajo', 'ud.', 'Verduras y frutas'),
      ing('i12', 'Macarrones', 'g', 'Despensa', ['gluten'], { presentacion: 'paquete de 1 kg', cantPres: 1000 }),
      ing('i13', 'Carne picada mixta', 'g', 'Carnes', [], { seccion: 'Carnicería' }),
      ing('i14', 'Tomate triturado', 'g', 'Despensa'),
      ing('i15', 'Caldo de pollo', 'ml', 'Despensa', ['apio'], { presentacion: 'brick de 1 l', cantPres: 1000 }),
      ing('i16', 'Fideos', 'g', 'Despensa', ['gluten']),
      ing('i17', 'Jamón serrano (taquitos)', 'g', 'Carnes', [], { presentacion: 'bolsa de 300 g', cantPres: 300 }),
      ing('i18', 'Lomo de cerdo', 'g', 'Carnes', [], { seccion: 'Carnicería' }),
      ing('i19', 'Pimiento rojo', 'g', 'Verduras y frutas'),
      ing('i20', 'Calabacín', 'g', 'Verduras y frutas'),
      ing('i21', 'Arroz (Brillante Sabroz)', 'g', 'Despensa', [], { presentacion: 'paquete de 1 kg', cantPres: 1000, marca: 'Brillante Sabroz' }),
      ing('i22', 'Pollo troceado', 'g', 'Carnes', [], { seccion: 'Carnicería' }),
      ing('i23', 'Preparado de paella congelado', 'g', 'Pescados', ['crustaceos', 'moluscos'],
        { presentacion: 'bolsa de 1 kg', cantPres: 1000, congelado: true, seccion: 'Congelados', revisar: true }),
      ing('i25', 'Lechuga', 'ud.', 'Verduras y frutas'),
      ing('i26', 'Tomate', 'g', 'Verduras y frutas'),
      ing('i27', 'Atún en conserva', 'g', 'Pescados', ['pescado']),
      ing('i28', 'Fruta del tiempo', 'g', 'Verduras y frutas'),
      ing('i29', 'Leche entera', 'ml', 'Huevos y lácteos', ['lacteos'], { presentacion: 'brick de 1 l', cantPres: 1000 }),
      ing('i30', 'Azúcar', 'g', 'Despensa'),
      ing('i31', 'Pan rallado', 'g', 'Despensa', ['gluten']),
      ing('i32', 'Vino blanco', 'ml', 'Despensa', ['sulfitos']),
      ing('i33', 'Miel', 'g', 'Despensa', ['p:Miel']),
      ing('i34', 'Lomo adobado', 'g', 'Carnes', [], { seccion: 'Carnicería', revisar: true }),
      ing('i35', 'Pechuga de pollo', 'g', 'Carnes', [], { seccion: 'Carnicería' }),
      ing('i36', 'Yogur natural', 'ud.', 'Huevos y lácteos', ['lacteos'], { presentacion: 'pack de 8', cantPres: 8 }),
      ing('i37', 'Flan de huevo', 'ud.', 'Huevos y lácteos', ['huevo', 'lacteos'], { presentacion: 'pack de 4', cantPres: 4 }),
      ing('i38', 'Arroz con leche', 'ud.', 'Huevos y lácteos', ['lacteos'], { presentacion: 'pack de 4', cantPres: 4 })
    ],
    platos: [
      pl('p1', 'Judías verdes con tomate', 'primero', 'verduras', 'aprobado', [['i7', 200], ['i8', 40], ['i10', 20], ['i5', 10], ['i6', 2]]),
      pl('p2', 'Merluza empanada', 'segundo', 'pescado', 'aprobado', [['i1', 1]], { margen: 20, notas: 'Producto congelado: freír en aceite de girasol.' }),
      pl('p3', 'Macarrones a la boloñesa', 'primero', 'pasta', 'aprobado', [['i12', 90], ['i13', 70], ['i14', 60], ['i10', 20], ['i5', 10], ['i6', 2]]),
      pl('p4', 'Huevos con patatas fritas', 'segundo', 'huevos', 'aprobado', [['i3', 2], ['i9', 200], ['i4', 25], ['i6', 2]]),
      pl('p5', 'Sopa de picadillo', 'primero', 'sopas', 'aprobado', [['i15', 300], ['i16', 25], ['i17', 15], ['i3', 0.3]]),
      pl('p6', 'Lomo con verduras', 'segundo', 'carne', 'aprobado', [['i18', 150], ['i19', 40], ['i20', 50], ['i10', 30], ['i5', 10], ['i6', 2]]),
      pl('p7', 'Paella mixta', 'segundo', 'arroz', 'aprobado', [['i21', 90], ['i22', 80], ['i23', 80], ['i19', 20], ['i14', 30], ['i5', 15], ['i6', 3]]),
      pl('p8', 'Ensalada mixta', 'primero', 'verduras', 'aprobado', [['i25', 0.15], ['i26', 80], ['i10', 15], ['i27', 30], ['i5', 10], ['i6', 1]]),
      pl('p9', 'Fruta del tiempo', 'postre', 'fruta', 'aprobado', [['i28', 200]]),
      pl('p11', 'Lomo adobado a la plancha', 'segundo', 'carne', 'aprobado', [['i34', 150], ['i5', 10]], { notas: 'Revisar la etiqueta del adobo (soja, mostaza, leche).' }),
      pl('p12', 'Pollo asado con patatas', 'segundo', 'carne', 'aprobado', [['i22', 250], ['i9', 150], ['i32', 20], ['i5', 15], ['i6', 2]]),
      pl('p13', 'Albóndigas en salsa', 'segundo', 'carne', 'pendiente', [['i13', 130], ['i3', 0.2], ['i31', 15], ['i2', 10], ['i10', 30], ['i32', 15], ['i5', 10]]),
      pl('p14', 'Natillas caseras', 'postre', 'lacteo', 'pendiente', [['i29', 150], ['i3', 0.5], ['i30', 20]]),
      pl('p15', 'Crema de calabacín', 'primero', 'sopas', 'corregir', [['i20', 200], ['i9', 50], ['i10', 30], ['i5', 10]],
        { comentario: 'Si se le añade quesito o nata, falta como ingrediente (lácteos).' }),
      pl('p16', 'Pechuga de pollo a la plancha', 'segundo', 'carne', 'aprobado', [['i35', 160], ['i5', 10], ['i6', 2]]),
      pl('p17', 'Yogur', 'postre', 'lacteo', 'aprobado', [['i36', 1]]),
      pl('p18', 'Flan', 'postre', 'lacteo', 'aprobado', [['i37', 1]]),
      pl('p19', 'Arroz con leche', 'postre', 'dulce', 'aprobado', [['i38', 1]])
    ],
    eventos: [
      ev('e9', 'R-0931', 'Ejercicios espirituales', 'Alojamiento', '2026-10-23', '2026-10-25', 30, 'Confirmada', ''),
      ev('e0', 'R-1013', 'Cursillo Cáritas', 'Alojamiento', '2026-11-13', '2026-11-15', 28, 'Confirmada', ''),
      ev('e1', 'R-1020', 'Emaús', 'Alojamiento', '2026-11-20', '2026-11-22', 42, 'Confirmada', 'Retiro de fin de semana. ALERGIAS: huevo - miel, girasol - soja'),
      ev('e3', 'R-1025', 'Lectura creyente', 'Día / sala', '2026-11-25', '2026-11-25', 15, 'Confirmada', 'Comida a las 14:00. Uno de ellos es celíaco.'),
      ev('e2', 'R-1027', 'Confirmación San Pedro', 'Alojamiento', '2026-11-27', '2026-11-29', 35, 'Provisional', 'Llegan hacia las 19:00.')
    ],
    comensales: [],
    servicios: [
      sv('e9', '2026-10-23', 'cena', 'Ligero', 'p5', 'p4', 'p9'),
      sv('e9', '2026-10-24', 'comida', 'Con carne', 'p1', 'p12', 'p17'),
      sv('e9', '2026-10-24', 'cena', 'Ligero', 'p8', 'p2', 'p9'),
      sv('e9', '2026-10-25', 'comida', 'Domingo', 'p3', 'p7', 'p19'),
      sv('e0', '2026-11-13', 'cena', 'Ligero', 'p8', 'p2', 'p9'),
      sv('e0', '2026-11-14', 'comida', 'Con carne', 'p1', 'p12', 'p9'),
      sv('e0', '2026-11-14', 'cena', 'Ligero', 'p5', 'p4', 'p9'),
      sv('e0', '2026-11-15', 'comida', 'Domingo', 'p8', 'p7', 'p18'),
      sv('e1', '2026-11-20', 'cena', 'Ligero', 'p1', 'p2', 'p9', [['A', ['p1', 'p11', 'p9']], ['B', ['p1', 'p16', 'p9']]]),
      sv('e1', '2026-11-21', 'comida', 'Con carne', 'p3', 'p4', 'p17', [['A', ['p3', 'p11', 'p17']], ['B', ['p3', 'p16', 'p17']]]),
      sv('e1', '2026-11-21', 'cena', 'Ligero', 'p5', 'p6', 'p9', [['A', []]]),
      sv('e1', '2026-11-22', 'comida', 'Domingo', 'p8', 'p7', 'p19')
    ],
    menus: [
      r({ id: 'd-m1', nombre: 'Comida con carne 1', modalidad: 'Con carne', platos: { primero: ['d-p3'], segundo: ['d-p4'], postre: ['d-p9'] } }),
      r({ id: 'd-m2', nombre: 'Comida de domingo', modalidad: 'Domingo', platos: { primero: ['d-p8'], segundo: ['d-p7'], postre: ['d-p19'] } })
    ],
    compras: [],
    extras: [
      r({ id: 'd-x1', evento: 'd-e1', texto: 'Aceitunas, atún y lo que haga falta para las ensaladas', cantidad: 'a elección de cocina', origen: 'eleccion', seccion: 'Despensa', hecho: false, nota: '' }),
      r({ id: 'd-x2', evento: 'd-e1', texto: 'Jamón york', cantidad: '300 g', origen: 'otros', seccion: 'Charcutería', hecho: false, nota: '¿Desayunos?' })
    ],
    carteles: [],
    sugerencias: [
      r({ id: 'd-g1', fecha: '2026-11-18', texto: 'Ejemplo: añadir la unidad "docena" para los huevos.', hecho: false })
    ]
  };
};
