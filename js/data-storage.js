// Variables globales para almacenar todos los datos
window.solarCalculatorData = {
  // Datos del cliente
  cliente: {
    nombre: "",
    direccion: "",
    estado: "",
    municipio: "",
    telefono: "",
    correo: "",
  },

  // Datos del ejecutivo
  ejecutivo: {
    nombre: "",
    correo: "",
    folio: "",
  },

  // Datos del proyecto
  proyecto: {
    tipo: "",
    tarifa: "",
    nota: "",
    estado: "",
    municipio: "",
    regionTarifariaCFE: "",
    requerimientos: "",
  },

  // Datos de consumo
  consumo: {
    tipoPeriodo: "bimestral",
    consumos: [],
    importes: [],
    tarifas: [],
    consumoTotal: 0,
    consumoAnual: 0,
    consumoMensual: 0,
    consumoDiario: 0,
    importeTotalAnual: 0,
    importePromedio: 0,
    tarifaPromedio: 0,
  },

  // Especificaciones del panel
  panel: {
    potencia: 0,
    marca: "",
    modelo: "",
    inversor: "",
    potenciaInversor: 0,
    instalacionElectrica: "",
    numHilos: "",
    voltajeOperacion: "",
    areaAprox: 0,
  },

  // Cotización P.U.
  cotizacion: {
    panel: 0,
    inversor: 0,
    mantenimiento: 0,
    estructura: 0,
    materiales: 0,
    instalacion: 0,
    carpeta: 0,
    flete: 0,
    interconexion: 0,
    uve: 0,
    uie: 0,
    medidor: 0,
    profit: 0,
    subtotal: 0,
    iva: 0,
    total: 0,
    roiConiva: 0,
  },

  // Resultados del sistema solar
  resultados: {
    hspPromedio: 0,
    potenciaNecesaria: 0,
    numeroModulos: 0,
    generacionAnual: 0,
    potenciaInstalada: 0,
    ahorroCO2: 0,
    arboles: 0,
    porcentajeAhorro: 0,
    kwintsladaConEficiancia: 0,
    generacionAnualAprox: 0,
    consumoAnualDeEnergia: 0,
    produccionMensual: [],
  },

  // Datos de irradiación
  irradiacion: {
    anual: [],
    hspData: {},
  },
}

// Funciones para manejar los datos
window.dataManager = {
  // Guardar datos del cliente
  saveClientData: () => {
    const data = window.solarCalculatorData.cliente
    data.nombre = document.getElementById("nombreCliente")?.value || ""
    data.direccion = document.getElementById("direccionCliente")?.value || ""
    data.estado = document.getElementById("estadoCliente")?.value || ""
    data.municipio = document.getElementById("municipioCliente")?.value || ""
    data.telefono = document.getElementById("telefonoCliente")?.value || ""
    data.correo = document.getElementById("correoCliente")?.value || ""
  },

  // Guardar datos del ejecutivo
  saveExecutiveData: () => {
    const data = window.solarCalculatorData.ejecutivo
    data.nombre = document.getElementById("nombreEjecutivo")?.value || ""
    data.correo = document.getElementById("correoEjecutivo")?.value || ""
    data.folio = document.getElementById("folioCotizacion")?.value || ""
  },

  // Guardar datos del proyecto
  saveProjectData: () => {
    const data = window.solarCalculatorData.proyecto
    data.tipo = document.getElementById("tipoProyecto")?.value || ""
    data.tarifa = document.getElementById("tipoTarifa")?.value || ""
    data.nota = document.getElementById("notaProyecto")?.value || ""
    data.estado = document.getElementById("estadoProyecto")?.value || ""
    data.municipio = document.getElementById("municipioProyecto")?.value || ""
    data.regionTarifariaCFE = document.getElementById("regionTarifariaCFE")?.value || ""
    data.requerimientos = document.getElementById("requerimientosProyecto")?.value || ""
  },

  // Guardar especificaciones del panel
  savePanelData: () => {
    const data = window.solarCalculatorData.panel
    data.potencia = Number(document.getElementById("potenciaPanel")?.value) || 0
    data.marca = document.getElementById("marcaPanel")?.value || ""
    data.modelo = document.getElementById("modeloPanel")?.value || ""
    data.inversor = document.getElementById("inversorPanel")?.value || ""
    data.potenciaInversor = Number(document.getElementById("potenciaInversor")?.value) || 0
    data.instalacionElectrica = document.getElementById("instalacionElectrica")?.value || ""
    data.numHilos = document.getElementById("numHilos")?.value || ""
    data.voltajeOperacion = document.getElementById("voltajeOperacion")?.value || ""
    data.areaAprox = Number(document.getElementById("areaAprox")?.value) || 0
  },

  // Guardar cotización P.U.
  saveCotizacionData: () => {
    const data = window.solarCalculatorData.cotizacion
    data.panel = Number(document.getElementById("panel")?.value) || 0
    data.inversor = Number(document.getElementById("inversor")?.value) || 0
    data.mantenimiento = Number(document.getElementById("mantenimiento")?.value) || 0
    data.estructura = Number(document.getElementById("estructura")?.value) || 0
    data.materiales = Number(document.getElementById("materiales")?.value) || 0
    data.instalacion = Number(document.getElementById("instalacion")?.value) || 0
    data.carpeta = Number(document.getElementById("carpeta")?.value) || 0
    data.flete = Number(document.getElementById("flete")?.value) || 0
    data.interconexion = Number(document.getElementById("interconexion")?.value) || 0
    data.uve = Number(document.getElementById("uve")?.value) || 0
    data.uie = Number(document.getElementById("uie")?.value) || 0
    data.medidor = Number(document.getElementById("medidor")?.value) || 0
    data.profit = Number(document.getElementById("profit")?.value) || 0
  },

  // Calcular totales de cotización
  calculateCotizacionTotals: function () {
    this.saveCotizacionData()
    const data = window.solarCalculatorData.cotizacion
    const resultados = window.solarCalculatorData.resultados

    // Calcular subtotal
    data.subtotal =
      data.panel +
      data.inversor +
      data.mantenimiento +
      data.estructura +
      data.materiales +
      data.instalacion +
      data.carpeta +
      data.flete +
      data.interconexion +
      data.uve +
      data.uie +
      data.medidor

    // Aplicar profit si existe
    if (data.profit > 0) {
      data.subtotal = data.subtotal * (1 + data.profit / 100)
    }

    // Calcular IVA y total
    data.iva = data.subtotal * 0.16
    data.total = data.subtotal + data.iva

    // Calcular ROI
    const consumoData = window.solarCalculatorData.consumo
    if (consumoData.importeTotalAnual > 0) {
      data.roiConiva = data.total / consumoData.importeTotalAnual
    }

    return data
  },

  // Guardar todos los datos
  saveAllData: function () {
    this.saveClientData()
    this.saveExecutiveData()
    this.saveProjectData()
    this.savePanelData()
    this.calculateCotizacionTotals()
  },

  // Obtener todos los datos
  getAllData: function () {
    this.saveAllData()
    return window.solarCalculatorData
  },
}
