class DataManager {
  constructor() {
    this.data = {
      cliente: {},
      ejecutivo: {},
      proyecto: {},
      consumo: {},
      sistema: {},
      cotizacion: {},
      resultados: {},
    }
  }

  // Recopilar datos del cliente
  recopilarDatosCliente() {
    this.data.cliente = {
      nombreCliente: document.getElementById("nombreCliente")?.value || "",
      direccionCliente: document.getElementById("direccionCliente")?.value || "",
      estadoCliente: document.getElementById("estadoCliente")?.value || "",
      municipioCliente: document.getElementById("municipioCliente")?.value || "",
      telefonoCliente: document.getElementById("telefonoCliente")?.value || "",
      correoCliente: document.getElementById("correoCliente")?.value || "",
    }
    return this.data.cliente
  }

  // Recopilar datos del ejecutivo
  recopilarDatosEjecutivo() {
    this.data.ejecutivo = {
      nombreEjecutivo: document.getElementById("nombreEjecutivo")?.value || "",
      correoEjecutivo: document.getElementById("correoEjecutivo")?.value || "",
      folioCotizacion: document.getElementById("folioCotizacion")?.value || "",
    }
    return this.data.ejecutivo
  }

  // Recopilar datos del proyecto
  recopilarDatosProyecto() {
    this.data.proyecto = {
      tipoProyecto: document.getElementById("tipoProyecto")?.value || "",
      tipoTarifa: document.getElementById("tipoTarifa")?.value || "",
      estadoProyecto: document.getElementById("estadoProyecto")?.value || "",
      municipioProyecto: document.getElementById("municipioProyecto")?.value || "",
      regionTarifariaCFE: document.getElementById("regionTarifariaCFE")?.value || "",
      potenciaPanel: Number.parseFloat(document.getElementById("potenciaPanel")?.value) || 0,
      marcaPanel: document.getElementById("marcaPanel")?.value || "",
      modeloPanel: document.getElementById("modeloPanel")?.value || "",
      inversorPanel: document.getElementById("inversorPanel")?.value || "",
      areaAprox: Number.parseFloat(document.getElementById("areaAprox")?.value) || 0,
    }
    return this.data.proyecto
  }

  // Recopilar datos de consumo
  recopilarDatosConsumo() {
    const tipoPeriodo = document.getElementById("tipoPeriodo")?.value || "bimestral"
    const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

    const consumos = []
    const importes = []
    const tarifas = []

    for (let i = 0; i < numPeriodos; i++) {
      const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0
      const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0
      const tarifa = Number.parseFloat(document.getElementById(`tarifa${i}`)?.value) || 0

      consumos.push(consumo)
      importes.push(importe)
      tarifas.push(tarifa)
    }

    this.data.consumo = {
      tipoPeriodo,
      consumos,
      importes,
      tarifas,
      consumoTotal: consumos.reduce((a, b) => a + b, 0),
      importeTotal: importes.reduce((a, b) => a + b, 0),
    }

    return this.data.consumo
  }

  // Recopilar datos de cotización
  recopilarDatosCotizacion() {
    const costos = {
      panel: Number.parseFloat(document.getElementById("panel")?.value) || 0,
      inversor: Number.parseFloat(document.getElementById("inversor")?.value) || 0,
      mantenimiento: Number.parseFloat(document.getElementById("mantenimiento")?.value) || 0,
      estructura: Number.parseFloat(document.getElementById("estructura")?.value) || 0,
      materiales: Number.parseFloat(document.getElementById("materiales")?.value) || 0,
      instalacion: Number.parseFloat(document.getElementById("instalacion")?.value) || 0,
      carpeta: Number.parseFloat(document.getElementById("carpeta")?.value) || 0,
      flete: Number.parseFloat(document.getElementById("flete")?.value) || 0,
      interconexion: Number.parseFloat(document.getElementById("interconexion")?.value) || 0,
      uve: Number.parseFloat(document.getElementById("uve")?.value) || 0,
      uie: Number.parseFloat(document.getElementById("uie")?.value) || 0,
      medidor: Number.parseFloat(document.getElementById("medidor")?.value) || 0,
      profit: Number.parseFloat(document.getElementById("profit")?.value) || 0,
    }

    const subtotal = Object.values(costos).reduce((a, b, i) => {
      // No sumar profit al subtotal
      return i === Object.keys(costos).length - 1 ? a : a + b
    }, 0)

    const iva = subtotal * 0.16
    const total = subtotal + iva

    // Calcular ROI
    const ahorroAnual = this.data.consumo.importeTotal || 0
    const roiSinIva = ahorroAnual > 0 ? subtotal / ahorroAnual : 0
    const roiConIva = ahorroAnual > 0 ? total / ahorroAnual : 0

    this.data.cotizacion = {
      ...costos,
      subtotal,
      iva,
      total,
      roiSinIva,
      roiConIva,
    }

    return this.data.cotizacion
  }

  // Calcular resultados del sistema
  calcularSistema() {
    const consumoData = this.data.consumo
    const proyectoData = this.data.proyecto

    if (!consumoData.consumoTotal || !proyectoData.potenciaPanel) {
      throw new Error("Faltan datos necesarios para el cálculo")
    }

    // Obtener HSP del estado
    const estado = proyectoData.estadoProyecto
    const hspPromedio = window.hspData?.[estado] || 5.5

    // Cálculos básicos
    const consumoAnual = consumoData.tipoPeriodo === "mensual" ? consumoData.consumoTotal : consumoData.consumoTotal * 2

    const consumoMensual = consumoAnual / 12
    const consumoDiario = consumoAnual / 365

    const importeTotalAnual =
      consumoData.tipoPeriodo === "mensual" ? consumoData.importeTotal : consumoData.importeTotal * 2

    const importePromedio = importeTotalAnual / (consumoData.tipoPeriodo === "mensual" ? 12 : 6)
    const tarifaPromedio = consumoAnual > 0 ? importeTotalAnual / consumoAnual : 0

    // Cálculos del sistema
    const potenciaNecesaria = consumoDiario / (hspPromedio * 0.76)
    const numeroModulos = Math.ceil((consumoDiario * 1000) / (hspPromedio * proyectoData.potenciaPanel * 0.76))
    const potenciaInstalada = (proyectoData.potenciaPanel * numeroModulos) / 1000
    const generacionAnual = numeroModulos * (proyectoData.potenciaPanel / 1000) * hspPromedio * 365

    // Cálculos ambientales
    const ahorroCO2 = (generacionAnual * 439.963) / 1000000
    const arboles = ahorroCO2 * 155
    const porcentajeAhorro = (generacionAnual / consumoAnual) * 100

    this.data.resultados = {
      consumoAnual,
      consumoMensual,
      consumoDiario,
      importeTotalAnual,
      importePromedio,
      tarifaPromedio,
      hspPromedio,
      potenciaNecesaria,
      numeroModulos,
      potenciaInstalada,
      generacionAnual,
      ahorroCO2,
      arboles,
      porcentajeAhorro,
      generacionAnualAprox: generacionAnual,
      kwintsladaConEficiancia: potenciaInstalada * 0.76,
    }

    return this.data.resultados
  }

  // Guardar todos los datos en localStorage en el orden correcto
  guardarEnLocalStorage() {
    // 1. Recopilar todos los datos
    this.recopilarDatosCliente()
    this.recopilarDatosEjecutivo()
    this.recopilarDatosProyecto()
    this.recopilarDatosConsumo()
    this.recopilarDatosCotizacion()

    // 2. Calcular resultados del sistema
    this.calcularSistema()

    // 3. Guardar en localStorage en orden específico
    localStorage.setItem("datosCliente", JSON.stringify(this.data.cliente))
    localStorage.setItem("datosEjecutivo", JSON.stringify(this.data.ejecutivo))
    localStorage.setItem("datosProyecto", JSON.stringify(this.data.proyecto))
    localStorage.setItem("datosConsumo", JSON.stringify(this.data.consumo))
    localStorage.setItem("cotizacionPU", JSON.stringify(this.data.cotizacion))
    localStorage.setItem(
      "resultadosSistemaSolar",
      JSON.stringify({
        ...this.data.resultados,
        tipoPeriodo: this.data.consumo.tipoPeriodo,
        consumos: this.data.consumo.consumos,
        importes: this.data.consumo.importes,
        tarifas: this.data.consumo.tarifas,
        estado: this.data.proyecto.estadoProyecto,
        potenciaPanel: this.data.proyecto.potenciaPanel,
        selectInversor: this.data.proyecto.inversorPanel,
        areaAprox: this.data.proyecto.areaAprox,
      }),
    )

    console.log("Todos los datos guardados correctamente en localStorage")
    return this.data
  }

  // Cargar datos desde localStorage
  cargarDesdeLocalStorage() {
    try {
      this.data.cliente = JSON.parse(localStorage.getItem("datosCliente") || "{}")
      this.data.ejecutivo = JSON.parse(localStorage.getItem("datosEjecutivo") || "{}")
      this.data.proyecto = JSON.parse(localStorage.getItem("datosProyecto") || "{}")
      this.data.consumo = JSON.parse(localStorage.getItem("datosConsumo") || "{}")
      this.data.cotizacion = JSON.parse(localStorage.getItem("cotizacionPU") || "{}")
      this.data.resultados = JSON.parse(localStorage.getItem("resultadosSistemaSolar") || "{}")

      return this.data
    } catch (error) {
      console.error("Error cargando datos desde localStorage:", error)
      return null
    }
  }

  // Limpiar todos los datos
  limpiarDatos() {
    localStorage.removeItem("datosCliente")
    localStorage.removeItem("datosEjecutivo")
    localStorage.removeItem("datosProyecto")
    localStorage.removeItem("datosConsumo")
    localStorage.removeItem("cotizacionPU")
    localStorage.removeItem("resultadosSistemaSolar")
    localStorage.removeItem("irradiacionAnual")
    localStorage.removeItem("produccionMensual")

    this.data = {
      cliente: {},
      ejecutivo: {},
      proyecto: {},
      consumo: {},
      sistema: {},
      cotizacion: {},
      resultados: {},
    }

    console.log("Todos los datos eliminados del localStorage")
  }
}

// Crear instancia global
window.dataManager = new DataManager()
