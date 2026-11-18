/*
 * Datos de ejemplo para el MODO DEMOSTRACIÓN.
 * Se cargan la primera vez (o al pulsar "Restablecer datos de ejemplo" en Más).
 */
window.DATOS_DEMO = function () {
  var ing = function (id, nombre, unidad, categoria, alergenos) {
    return { id: id, nombre: nombre, unidad: unidad, categoria: categoria, alergenos: alergenos || [] };
  };
  var pl = function (id, nombre, tipo, estado, ings, extra) {
    var p = { id: id, nombre: nombre, tipo: tipo, estado: estado, comentario: '', notas: '',
      ingredientes: ings.map(function (x) { return { ing: x[0], cant: x[1] }; }) };
    for (var k in (extra || {})) p[k] = extra[k];
    return p;
  };
  return {
    version: 1,
    modalidades: ['Con carne', 'Ligero', 'Pescado', 'Domingo'],
    propios: ['p:Miel', 'p:Girasol'],
    ingredientes: [
      ing('i1', 'Merluza (filete)', 'g', 'Pescados', ['pescado']),
      ing('i2', 'Harina de trigo', 'g', 'Despensa', ['gluten']),
      ing('i3', 'Huevo', 'ud.', 'Huevos y lácteos', ['huevo']),
      ing('i4', 'Aceite de girasol', 'ml', 'Aceites y condimentos', ['p:Girasol']),
      ing('i5', 'Aceite de oliva', 'ml', 'Aceites y condimentos'),
      ing('i6', 'Sal', 'g', 'Aceites y condimentos'),
      ing('i7', 'Judías verdes', 'g', 'Verduras y frutas'),
      ing('i8', 'Tomate frito (bote)', 'g', 'Despensa'),
      ing('i9', 'Patata', 'g', 'Verduras y frutas'),
      ing('i10', 'Cebolla', 'g', 'Verduras y frutas'),
      ing('i11', 'Ajo', 'ud.', 'Verduras y frutas'),
      ing('i12', 'Pasta (macarrón)', 'g', 'Despensa', ['gluten']),
      ing('i13', 'Carne picada mixta', 'g', 'Carnes'),
      ing('i14', 'Tomate triturado', 'g', 'Despensa'),
      ing('i15', 'Caldo de pollo', 'ml', 'Despensa', ['apio']),
      ing('i16', 'Fideos', 'g', 'Despensa', ['gluten']),
      ing('i17', 'Jamón serrano (taquitos)', 'g', 'Carnes'),
      ing('i18', 'Lomo de cerdo', 'g', 'Carnes'),
      ing('i19', 'Pimiento', 'g', 'Verduras y frutas'),
      ing('i20', 'Calabacín', 'g', 'Verduras y frutas'),
      ing('i21', 'Arroz bomba', 'g', 'Despensa'),
      ing('i22', 'Pollo troceado', 'g', 'Carnes'),
      ing('i23', 'Gambas', 'g', 'Pescados', ['crustaceos']),
      ing('i24', 'Calamar', 'g', 'Pescados', ['moluscos']),
      ing('i25', 'Lechuga', 'g', 'Verduras y frutas'),
      ing('i26', 'Tomate', 'g', 'Verduras y frutas'),
      ing('i27', 'Atún en conserva', 'g', 'Pescados', ['pescado']),
      ing('i28', 'Fruta del tiempo', 'g', 'Verduras y frutas'),
      ing('i29', 'Leche entera', 'ml', 'Huevos y lácteos', ['lacteos']),
      ing('i30', 'Azúcar', 'g', 'Despensa'),
      ing('i31', 'Pan rallado', 'g', 'Despensa', ['gluten']),
      ing('i32', 'Vino blanco', 'ml', 'Despensa', ['sulfitos']),
      ing('i33', 'Miel', 'g', 'Despensa', ['p:Miel'])
    ],
    platos: [
      pl('p1', 'Judías verdes con tomate', 'primero', 'aprobado', [['i7', 200], ['i8', 40], ['i10', 20], ['i5', 10], ['i6', 2]]),
      pl('p2', 'Merluza rebozada', 'segundo', 'aprobado', [['i1', 150], ['i2', 20], ['i3', 0.3], ['i4', 20], ['i6', 2]]),
      pl('p3', 'Pasta boloñesa', 'primero', 'aprobado', [['i12', 90], ['i13', 70], ['i14', 60], ['i10', 20], ['i5', 10], ['i6', 2]]),
      pl('p4', 'Huevos con patatas', 'segundo', 'aprobado', [['i3', 2], ['i9', 200], ['i4', 25], ['i6', 2]]),
      pl('p5', 'Sopa de picadillo', 'primero', 'aprobado', [['i15', 300], ['i16', 25], ['i17', 15], ['i3', 0.3]]),
      pl('p6', 'Lomo con verduras', 'segundo', 'aprobado', [['i18', 150], ['i19', 40], ['i20', 50], ['i10', 30], ['i5', 10], ['i6', 2]]),
      pl('p7', 'Paella mixta', 'segundo', 'aprobado', [['i21', 90], ['i22', 80], ['i23', 40], ['i24', 40], ['i19', 20], ['i14', 30], ['i5', 15], ['i6', 3]]),
      pl('p8', 'Ensalada mixta', 'primero', 'aprobado', [['i25', 60], ['i26', 80], ['i10', 15], ['i27', 30], ['i5', 10], ['i6', 1]]),
      pl('p9', 'Fruta del tiempo', 'postre', 'aprobado', [['i28', 200]]),
      pl('p10', 'Merluza a la plancha', 'segundo', 'aprobado', [['i1', 150], ['i5', 10], ['i6', 2]]),
      pl('p11', 'Lomo a la plancha con patatas', 'segundo', 'aprobado', [['i18', 150], ['i9', 150], ['i5', 20], ['i6', 2]]),
      pl('p12', 'Pollo asado con patatas', 'segundo', 'aprobado', [['i22', 250], ['i9', 150], ['i32', 20], ['i5', 15], ['i6', 2]]),
      pl('p13', 'Albóndigas en salsa', 'segundo', 'pendiente', [['i13', 130], ['i3', 0.2], ['i31', 15], ['i2', 10], ['i10', 30], ['i32', 15], ['i5', 10]]),
      pl('p14', 'Natillas caseras', 'postre', 'pendiente', [['i29', 150], ['i3', 0.5], ['i30', 20]]),
      pl('p15', 'Crema de calabacín', 'primero', 'corregir', [['i20', 200], ['i9', 50], ['i10', 30], ['i5', 10]],
        { comentario: 'Si se le añade quesito o nata, falta como ingrediente (lácteos).' })
    ],
    estancias: [
      { id: 'e0', grupo: 'Cursillo Cáritas', entrada: '2026-11-13', salida: '2026-11-15', personas: 28, obs: '', comensales: [] },
      { id: 'e1', grupo: 'Emaús', entrada: '2026-11-20', salida: '2026-11-22', personas: 42, obs: 'Retiro de fin de semana.',
        comensales: [
          { cod: 'A', alergias: ['huevo'] },
          { cod: 'B', alergias: ['p:Miel', 'p:Girasol'] },
          { cod: 'C', alergias: ['soja'] }
        ] },
      { id: 'e2', grupo: 'Confirmación San Pedro', entrada: '2026-11-27', salida: '2026-11-29', personas: 35, obs: '', comensales: [] }
    ],
    servicios: [
      { id: 's01', estancia: 'e0', fecha: '2026-11-13', turno: 'cena', modalidad: 'Ligero', platos: { primero: ['p8'], segundo: ['p10'], postre: ['p9'] }, especiales: [] },
      { id: 's02', estancia: 'e0', fecha: '2026-11-14', turno: 'comida', modalidad: 'Con carne', platos: { primero: ['p1'], segundo: ['p12'], postre: ['p9'] }, especiales: [] },
      { id: 's03', estancia: 'e0', fecha: '2026-11-14', turno: 'cena', modalidad: 'Ligero', platos: { primero: ['p5'], segundo: ['p4'], postre: ['p9'] }, especiales: [] },
      { id: 's04', estancia: 'e0', fecha: '2026-11-15', turno: 'comida', modalidad: 'Domingo', platos: { primero: ['p8'], segundo: ['p7'], postre: ['p9'] }, especiales: [] },
      { id: 's11', estancia: 'e1', fecha: '2026-11-20', turno: 'cena', modalidad: 'Ligero', platos: { primero: ['p1'], segundo: ['p2'], postre: ['p9'] },
        especiales: [{ comensal: 'A', platos: ['p1', 'p10', 'p9'] }] },
      { id: 's12', estancia: 'e1', fecha: '2026-11-21', turno: 'comida', modalidad: 'Con carne', platos: { primero: ['p3'], segundo: ['p4'], postre: ['p9'] },
        especiales: [{ comensal: 'A', platos: ['p3', 'p11', 'p9'] }] },
      { id: 's13', estancia: 'e1', fecha: '2026-11-21', turno: 'cena', modalidad: 'Ligero', platos: { primero: ['p5'], segundo: ['p6'], postre: ['p9'] },
        especiales: [{ comensal: 'A', platos: [] }] },
      { id: 's14', estancia: 'e1', fecha: '2026-11-22', turno: 'comida', modalidad: 'Domingo', platos: { primero: ['p8'], segundo: ['p7'], postre: ['p9'] }, especiales: [] },
      { id: 's21', estancia: 'e2', fecha: '2026-11-27', turno: 'cena', modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [] },
      { id: 's22', estancia: 'e2', fecha: '2026-11-28', turno: 'comida', modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [] },
      { id: 's23', estancia: 'e2', fecha: '2026-11-28', turno: 'cena', modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [] },
      { id: 's24', estancia: 'e2', fecha: '2026-11-29', turno: 'comida', modalidad: '', platos: { primero: [], segundo: [], postre: [] }, especiales: [] }
    ],
    menus: [
      { id: 'm1', nombre: 'Comida con carne 1', modalidad: 'Con carne', platos: { primero: ['p3'], segundo: ['p4'], postre: ['p9'] } },
      { id: 'm2', nombre: 'Comida de domingo', modalidad: 'Domingo', platos: { primero: ['p8'], segundo: ['p7'], postre: ['p9'] } }
    ],
    compras: {},
    sugerencias: [
      { id: 'g1', fecha: '2026-11-18', texto: 'Ejemplo: añadir la unidad "docena" para los huevos.', hecho: false }
    ]
  };
};
