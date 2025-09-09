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
      irradiacionAnual: {},
    }
  }

  //recopilar datos de iinterfaz y guardarlos en this.data
  recopilarDatosdeIrradiacionAnual() {
   this.data.irradiacionAnual = {
      enero: Number.parseFloat(document.getElementById("irradiacionEnero")?.value) || 0,
      febrero: Number.parseFloat(document.getElementById("irradiacionFebrero")?.value) || 0,
      marzo: Number.parseFloat(document.getElementById("irradiacionMarzo")?.value) || 0,
      abril: Number.parseFloat(document.getElementById("irradiacionAbril")?.value) || 0,
      mayo: Number.parseFloat(document.getElementById("irradiacionMayo")?.value) || 0,
      junio: Number.parseFloat(document.getElementById("irradiacionJunio")?.value) || 0,
      julio: Number.parseFloat(document.getElementById("irradiacionJulio")?.value) || 0,
      agosto: Number.parseFloat(document.getElementById("irradiacionAgosto")?.value) || 0,
      septiembre: Number.parseFloat(document.getElementById("irradiacionSeptiembre")?.value) || 0,
      octubre: Number.parseFloat(document.getElementById("irradiacionOctubre")?.value) || 0,
      noviembre: Number.parseFloat(document.getElementById("irradiacionNoviembre")?.value) || 0,
      diciembre: Number.parseFloat(document.getElementById("irradiacionDiciembre")?.value) || 0,
   }
    return this.data.irradiacionAnual
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

    for (let i = 1; i < numPeriodos+1; i++) {
      const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0
      const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0
      const tarifa = Number.parseFloat(document.getElementById(`tarifa${i}`)?.value) || 0

      consumos.push(consumo)
      importes.push(importe)
      tarifas.push(tarifa)
    }
    console.log(consumos)
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
  // recopilarDatosCotizacion() {
  //   const costos = {
  //     panel: Number.parseFloat(document.getElementById("panel")?.value) || 0,
  //     inversor: Number.parseFloat(document.getElementById("inversor")?.value) || 0,
  //     mantenimiento: Number.parseFloat(document.getElementById("monitoreo")?.value) || 0,
  //     estructura: Number.parseFloat(document.getElementById("estructura")?.value) || 0,
  //     materiales: Number.parseFloat(document.getElementById("materiales")?.value) || 0,
  //     instalacion: Number.parseFloat(document.getElementById("instalacion")?.value) || 0,
  //     carpeta: Number.parseFloat(document.getElementById("carpeta")?.value) || 0,
  //     flete: Number.parseFloat(document.getElementById("flete")?.value) || 0,
  //     interconexion: Number.parseFloat(document.getElementById("interconexion")?.value) || 0,
  //     uve: Number.parseFloat(document.getElementById("uve")?.value) || 0,
  //     uie: Number.parseFloat(document.getElementById("uie")?.value) || 0,
  //     medidor: Number.parseFloat(document.getElementById("medidor")?.value) || 0,
  //     profit: Number.parseFloat(document.getElementById("profit")?.value) || 0,
  //   }

  //   const subtotal = Object.values(costos).reduce((a, b, i) => {
  //     // No sumar profit al subtotal
  //     return i === Object.keys(costos).length - 1 ? a : a + b
  //   }, 0)

  //   const iva = subtotal * 0.16
  //   const total = subtotal + iva

  //   // Calcular ROI
  //   const ahorroAnual = this.data.consumo.importeTotal || 0
  //   const roiSinIva = ahorroAnual > 0 ? subtotal / ahorroAnual : 0
  //   const roiConIva = ahorroAnual > 0 ? total / ahorroAnual : 0
  
  //   this.data.cotizacion = {
  //     ...costos,
  //     subtotal,
  //     iva,
  //     total,
  //     roiSinIva,
  //     roiConIva,
  //   }
  //  console.log(this.data.cotizacion)
  //   return this.data.cotizacion
  // }

  // Recopilar datos de cotización (con multiplicadores por número de paneles y microinversor)
// Recopilar datos de cotización (idéntico a la lógica del IIFE)
// Recopilar datos de cotización (subtotal1, profit, subtotal2, IVA y total)
recopilarDatosCotizacion() {
  const IVA_RATE = 0.16;

  // Helpers
  const $ = (id) => document.getElementById(id);
  const toNumber = (v) => {
    if (v === null || v === undefined) return 0;
    const s = String(v).replace(/[,$\s]/g, '').replace(',', '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  // Número de módulos
  const getNumeroDeModulos = () => {
    if (this.data?.resultados && Number(this.data.resultados.numeroModulos) > 0) {
      return Number(this.data.resultados.numeroModulos);
    }
    const el = $('numeroModulos');
    if (!el) return 1;
    const txt = el.textContent?.trim() || el.value?.trim() || '0';
    const num = toNumber(txt);
    return num > 0 ? num : 1;
  };

  // Costos unitarios UI
  const costosUnit = {
    panel:        toNumber($('panel')?.value),
    inversor:     toNumber($('inversor')?.value),
    materiales:   toNumber($('materiales')?.value),
    estructura:   toNumber($('estructura')?.value),
    instalacion:  toNumber($('instalacion')?.value),
    carpeta:      toNumber($('carpeta')?.value),
    flete:        toNumber($('flete')?.value),
    interconexion:toNumber($('interconexion')?.value),
    uve:          toNumber($('uve')?.value),
    uie:          toNumber($('uie')?.value),
    medidor:      toNumber($('medidor')?.value),
    mantenimiento:toNumber($('monitoreo')?.value),
    profitRaw:    toNumber($('profit')?.value),
  };

  const numeroModulos = getNumeroDeModulos();
  const inversorOmicro = (this.data?.resultados?.selectInversor ?? '').toString();
  const esMicroinversor = inversorOmicro === 'Microinversor';

  // IDs que se multiplican por módulo
  const idsSiemprePorModulo = new Set(['panel', 'materiales', 'estructura', 'instalacion']);

  // Orden de partidas (como en tu tabla)
  const IDS_COSTOS = [
    ['panel', 'Panel'],
    ['inversor', 'Inversor'],
    ['materiales', 'Materiales'],
    ['estructura', 'Estructura'],
    ['instalacion', 'Instalación'],
    ['carpeta', 'Carpeta (Pog)'],
    ['flete', 'Flete'],
    ['interconexion', 'Interconexión'],
    ['uve', 'UVIE'],
    ['uie', 'UIE'],
    ['medidor', 'Medidor'],
    ['monitoreo', 'Monitoreo'],
  ];

  // === SUBTOTAL 1: suma de todas las partidas (con multiplicadores) ===
  let subtotal1 = 0;
  const partidasTotales = {};

  IDS_COSTOS.forEach(([id]) => {
    let val = costosUnit[id] || 0;
    const debeMultiplicarse =
      idsSiemprePorModulo.has(id) || (id === 'inversor' && esMicroinversor);

    if (debeMultiplicarse) val *= numeroModulos;

    partidasTotales[id] = val;
    subtotal1 += val;
  });

  // === PROFIT (igual que tu lógica): <=1 proporción, >1 porcentaje ===
  const p = costosUnit.profitRaw;
  const profitMonto = p ? (p <= 1 ? subtotal1 * p : subtotal1 * (p / 100)) : 0;
  const profitEtiqueta = p
    ? (p <= 1 ? (p * 100).toFixed(2) + '%' : p.toFixed(2) + '%')
    : '—';

  // === SUBTOTAL 2, IVA y TOTAL ===
  const subtotal2 = subtotal1 + profitMonto;
  const iva = subtotal2 * IVA_RATE;
  const total = subtotal2 + iva;

  // ROI (mismo denominador que tu IIFE: consumoAnualDeEnergia; fallback a importeTotal)
  let consumoAnualBase = 0;
  try {
    const dataLS = localStorage.getItem('resultadosSistemaSolar');
    if (dataLS) {
      const res = JSON.parse(dataLS);
      consumoAnualBase = toNumber(res?.consumoAnualDeEnergia);
    }
  } catch (_) {}
  if (!consumoAnualBase) consumoAnualBase = toNumber(this.data?.consumo?.importeTotal);

    const roiSinIva = consumoAnualBase > 0 ? subtotal2 / consumoAnualBase : 0; // base sin IVA
    const roiConIva = total / consumoAnualBase ;     // con IVA

  // Guardar
  this.data.cotizacion = {
    // unitarios
    ...costosUnit,

    // multiplicadores
    numeroModulosUsado: numeroModulos,
    esMicroinversor,

    // partidas totales (ya multiplicadas donde corresponde)
    panelTotal: partidasTotales.panel,
    inversorTotal: partidasTotales.inversor,
    materialesTotal: partidasTotales.materiales,
    estructuraTotal: partidasTotales.estructura,
    instalacionTotal: partidasTotales.instalacion,

    // TOTALES CLAVE
    subtotal1,            // ⟵ suma de partidas
    profitMonto,          // ⟵ monto del profit
    profitEtiqueta,       // ⟵ % mostrado
    subtotal2,            // ⟵ subtotal1 + profit
    iva,                  // ⟵ IVA sobre subtotal2
    total,                // ⟵ subtotal2 + IVA

    // Alias para compatibilidad con tu código existente
    subtotal: subtotal1,  // "Subtotal 1"
    base: subtotal2,      // "Subtotal 2"
    IVA_RATE,

    // ROI
    roiSinIva,
    roiConIva: roiConIva,
  };

  console.log(this.data.cotizacion);
  return this.data.cotizacion;
}


  // Calcular resultados del sistema
  calcularSistema() {
    const consumoData = this.data.consumo
    const proyectoData = this.data.proyecto

    /*if (!consumoData.consumoTotal || !proyectoData.potenciaPanel) {
      throw new Error("Faltan datos necesarios para el cálculo")
    }*/

    // Obtener HSP del estado
    const estado = proyectoData.estadoProyecto
    const hspPromedio = window.hspData?.[estado] || 5.5

    // Cálculos básicos
    const consumoAnual = consumoData.tipoPeriodo === "mensual" ? consumoData.consumoTotal : consumoData.consumoTotal 

    const consumoMensual = consumoAnual / 12
    const consumoDiario = consumoAnual / 365

    const importeTotalAnual =
      consumoData.tipoPeriodo === "mensual" ? consumoData.importeTotal : consumoData.importeTotal 

    const importePromedio = importeTotalAnual / (consumoData.tipoPeriodo === "mensual" ? 12 : 6)
    const tarifaPromedio = consumoAnual > 0 ? importeTotalAnual / consumoAnual : 0

    // Cálculos del sistema
    const potenciaNecesaria = consumoDiario / (hspPromedio * 0.76)
    const numeroModulos = Math.ceil((consumoDiario * 1000) / (hspPromedio * proyectoData.potenciaPanel * 0.76))
    const potenciaInstalada = (proyectoData.potenciaPanel * numeroModulos) / 1000
    const generacionAnual = numeroModulos * (proyectoData.potenciaPanel / 1000) * hspPromedio * 365
    const kwintsladaConEficiancia2 = proyectoData.potenciaPanel * numeroModulos * 0.76 / 1000;
    // Cálculos ambientales
    const ahorroCO2 = (generacionAnual * 439.963) / 1000000
    const arboles = ahorroCO2 * 155
    const porcentajeAhorro = (generacionAnual / consumoAnual) * 100
    const consumoAnulaDeEnegia = consumoAnual * tarifaPromedio;
     let total = document.getElementById("totalDisplay").innerText; 
     let total2 = parseFloat(total.replace(/[^0-9.]/g, ""));
    console.log(total2);
    function diasEnMes(mes, anio) {
      // mes: 0 = enero, 11 = diciembre
      return new Date(anio, mes + 1, 0).getDate();
    }

     const anioActual = new Date().getFullYear();

    let produccion = [];
    const irradiacion = JSON.parse(localStorage.getItem("irradiacionAnualInputs"))

      const mesesOrdenados = [
      "enero",
      "febrero",
      "marzo",
      "abril",
      "mayo",
      "junio",
      "julio",
      "agosto",
      "septiembre",
      "octubre",
      "noviembre",
      "diciembre",
    ];

    // 2) Convierte el objeto en un arreglo en orden
    const irradiacionMensualArray = mesesOrdenados.map(m => Number(irradiacion[m] || 0));
    console.log(irradiacion);
    console.log(irradiacionMensualArray);
    
     for (let i = 0; i < 12; i++) {
      const dias = diasEnMes(i, anioActual);
      produccion[i] =
        irradiacionMensualArray[i] *
        kwintsladaConEficiancia2  *
        dias;
    }
    console.log(produccion);
    
    let promedioProduccion = produccion.reduce((a, b) => a + b, 0) / 12;
    console.log(promedioProduccion);
    let diferencia = consumoMensual - promedioProduccion;
    const porcentajeGeneracion = (1-(diferencia / consumoMensual))*100; ;

  const roi = (total2 / consumoAnulaDeEnegia).toFixed(1);
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
      kwintsladaConEficiancia2 : kwintsladaConEficiancia2,
      consumoAnulaDeEnegia: consumoAnulaDeEnegia,
  roi: roi,
      porcentajeGeneracion: porcentajeGeneracion,
      diferencia: diferencia,
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
    this.recopilarDatosdeIrradiacionAnual()

    // 2. Calcular resultados del sistema
    this.calcularSistema()

    // 3. Guardar en localStorage en orden específico
    localStorage.setItem("datosCliente", JSON.stringify(this.data.cliente))
    localStorage.setItem("datosEjecutivo", JSON.stringify(this.data.ejecutivo))
    localStorage.setItem("datosProyecto", JSON.stringify(this.data.proyecto))
    localStorage.setItem("datosConsumo", JSON.stringify(this.data.consumo))
    console.log(this.data.consumo)
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
    localStorage.setItem("irradiacionAnual", JSON.stringify(this.data.irradiacionAnual))

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
      this.data.irradiacionAnual = JSON.parse(localStorage.getItem("irradiacionAnual") || "{}")

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
      irradiacionAnual: {},
    }

    console.log("Todos los datos eliminados del localStorage")
  }
}


// Crear instancia global
window.dataManager = new DataManager()
