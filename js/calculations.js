window.solarCalculations = {
  // Calcular datos de consumo
  calculateConsumptionData: () => {
    const tipoPeriodo = document.getElementById("tipoPeriodo").value
    const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6
    const consumoData = window.solarCalculatorData.consumo

    consumoData.tipoPeriodo = tipoPeriodo
    consumoData.consumos = []
    consumoData.importes = []
    consumoData.tarifas = []

    // Recopilar datos de consumo e importes
    for (let i = 1; i <= numPeriodos; i++) {
      const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value || 0)
      const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value || 0)
      consumoData.consumos.push(consumo)
      consumoData.importes.push(importe)
    }

    // Calcular totales
    consumoData.consumoTotal = consumoData.consumos.reduce((sum, val) => sum + val, 0)
    consumoData.consumoAnual = consumoData.consumoTotal
    consumoData.consumoMensual = consumoData.consumoAnual / 12
    consumoData.consumoDiario = consumoData.consumoAnual / 365

    // Calcular importes
    consumoData.importeTotalAnual = consumoData.importes.reduce((sum, val) => sum + val, 0)
    consumoData.importePromedio = consumoData.importeTotalAnual / 12

    // Calcular tarifas
    let sumaTarifas = 0
    let tarifasValidas = 0

    for (let i = 0; i < numPeriodos; i++) {
      if (consumoData.consumos[i] > 0) {
        const tarifa = consumoData.importes[i] / consumoData.consumos[i]
        consumoData.tarifas.push(tarifa)
        sumaTarifas += tarifa
        tarifasValidas++
      } else {
        consumoData.tarifas.push(0)
      }
    }

    consumoData.tarifaPromedio = tarifasValidas > 0 ? sumaTarifas / tarifasValidas : 0

    return consumoData
  },

  // Calcular sistema solar
  calculateSolarSystem: function () {
    const consumoData = this.calculateConsumptionData()
    const panelData = window.solarCalculatorData.panel
    const resultados = window.solarCalculatorData.resultados

    // Obtener HSP
    const estado = document.getElementById("estadoProyecto").value
    let hspPromedio = Number(window.hspValue)
    if (!Number.isFinite(hspPromedio)) {
      const fallback = Number(window.solarCalculatorData.irradiacion.hspData?.[estado])
      if (Number.isFinite(fallback)) hspPromedio = fallback
    }

    if (!Number.isFinite(hspPromedio) || hspPromedio <= 0) {
      throw new Error("Selecciona el estado para cargar HSP antes de calcular.")
    }

    resultados.hspPromedio = hspPromedio

    // Calcular potencia necesaria y módulos
    resultados.potenciaNecesaria = consumoData.consumoDiario / (hspPromedio * 0.76)
    resultados.numeroModulos = Math.ceil((consumoData.consumoDiario * 1000) / (hspPromedio * panelData.potencia * 0.76))

    // Calcular generación y potencia instalada
    resultados.generacionAnual = resultados.numeroModulos * (panelData.potencia / 1000) * hspPromedio * 365
    resultados.potenciaInstalada = (panelData.potencia * resultados.numeroModulos) / 1000
    resultados.kwintsladaConEficiancia = (panelData.potencia * resultados.numeroModulos * 0.76) / 1000
    resultados.generacionAnualAprox = ((resultados.numeroModulos * panelData.potencia) / 1000) * hspPromedio * 365

    // Calcular producción mensual
    const irradiacionMensual = window.solarCalculatorData.irradiacion.anual || []
    resultados.produccionMensual = []

    for (let i = 0; i < 12; i++) {
      resultados.produccionMensual[i] = (irradiacionMensual[i] || 0) * resultados.kwintsladaConEficiancia * 31
    }

    // Calcular impacto ambiental
    const suma = resultados.produccionMensual.reduce((acc, val) => acc + val, 0)
    resultados.ahorroCO2 = (suma * 439.963) / 1000000
    resultados.arboles = resultados.ahorroCO2 * 155
    resultados.porcentajeAhorro = (resultados.generacionAnual / consumoData.consumoAnual) * 100

    // Calcular consumo anual de energía
    resultados.consumoAnualDeEnergia = consumoData.consumoAnual * consumoData.tarifaPromedio

    return resultados
  },

  // Actualizar interfaz con resultados
  updateInterface: (resultados, consumoData) => {
    // Mostrar resultados
    document.getElementById("resultsPlaceholder").style.display = "none"
    document.getElementById("resultsContent").style.display = "block"

    // Actualizar métricas de consumo
    document.getElementById("consumoAnual").textContent = `${consumoData.consumoAnual.toFixed(0)} kWh`
    document.getElementById("consumoMensual").textContent = `${consumoData.consumoMensual.toFixed(0)} kWh`
    document.getElementById("consumoDiario").textContent = `${consumoData.consumoDiario.toFixed(1)} kWh`
    document.getElementById("importeTotal").textContent = `$${consumoData.importeTotalAnual.toFixed(2)}`
    document.getElementById("importePromedio").textContent = `$${consumoData.importePromedio.toFixed(2)}`
    document.getElementById("tarifaPromedio").textContent = `$${consumoData.tarifaPromedio.toFixed(3)}`

    // Actualizar métricas del sistema
    document.getElementById("potenciaNecesaria").textContent = `${resultados.potenciaNecesaria.toFixed(2)} kW`
    document.getElementById("numeroModulos").textContent = `${resultados.numeroModulos}`
    document.getElementById("potenciaInstalada").textContent = `${resultados.potenciaInstalada.toFixed(2)} kW`
    document.getElementById("hsp").textContent = `${resultados.hspPromedio.toFixed(2)} h`
    document.getElementById("ahorroCO2").textContent = `${resultados.ahorroCO2.toFixed(3)} t`
    document.getElementById("arboles").textContent = `${resultados.arboles.toFixed(0)} árboles`
    document.getElementById("porcentajeAhorro").textContent = `${resultados.porcentajeAhorro.toFixed(1)}%`
    document.getElementById("generacionAnual").textContent = `${resultados.generacionAnual.toFixed(2)} KWh`

    // Calcular porcentaje de generación
    let promediodeproduccion = 0
    for (let i = 0; i < resultados.produccionMensual.length; i++) {
      promediodeproduccion += resultados.produccionMensual[i]
    }
    promediodeproduccion /= resultados.produccionMensual.length

    const diferencia = consumoData.consumoMensual - promediodeproduccion
    const porcentaje = (1 - diferencia / consumoData.consumoMensual) * 100
    document.getElementById("porcentajeGeneracion").textContent = `${porcentaje.toFixed(2)}%`

    // Mostrar botón móvil
    const btnCot = document.getElementById("btnCotizarMobile")
    if (btnCot) {
      btnCot.classList.add("show")
      btnCot.disabled = false
      btnCot.removeAttribute("hidden")
      btnCot.scrollIntoView({ behavior: "smooth", block: "center" })
    }
  },
}
