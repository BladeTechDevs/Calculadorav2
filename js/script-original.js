document.getElementById("estadoProyecto").addEventListener("change", actualizarHSP)

// Variables globales
let hspData = {}
let csvData = []
const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
const mesesCompletos = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
]

// Tarifas por tipo de proyecto
const tarifasPorProyecto = {
  residencial: [
    { value: "1A", text: "Tarifa 1A" },
    { value: "1B", text: "Tarifa 1B" },
    { value: "1C", text: "Tarifa 1C" },
    { value: "1D", text: "Tarifa 1D" },
    { value: "1E", text: "Tarifa 1E" },
    { value: "1F", text: "Tarifa 1F" },
    { value: "dac", text: "Tarifa DAC (Doméstica de Alto Consumo)" },
  ],
  comercial: [
    { value: "pdbt", text: "PDBT – Pequeña Demanda en Baja Tensión" },
    { value: "gdbt", text: "GDBT – Gran Demanda en Baja Tensión" },
    { value: "apbt", text: "APBT – Alumbrado Público en Baja Tensión" },
    { value: "rabt", text: "RABT – Riego Agrícola en Baja Tensión" },
  ],
  industrial: [
    { value: "gdmth", text: "GDMTH – Gran Demanda en Media Tensión Horaria" },
    { value: "gdmto", text: "GDMTO – Gran Demanda en Media Tensión Ordinaria" },
    { value: "ramt", text: "RAMT – Riego Agrícola en Media Tensión" },
    { value: "dist", text: "DIST – Demanda Industrial en Subtransmisión" },
    { value: "dit", text: "DIT – Demanda Industrial en Transmisión" },
  ],
}

function actualizarTarifasPorProyecto() {
  const tipoProyecto = document.getElementById("tipoProyecto").value
  const tarifaSelect = document.getElementById("tipoTarifa")
  tarifaSelect.innerHTML = '<option value="">Selecciona una tarifa</option>'
  if (tarifasPorProyecto[tipoProyecto]) {
    tarifasPorProyecto[tipoProyecto].forEach((t) => {
      const option = document.createElement("option")
      option.value = t.value
      option.textContent = t.text
      tarifaSelect.appendChild(option)
    })
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tipoProyectoSelect = document.getElementById("tipoProyecto")
  if (tipoProyectoSelect) {
    tipoProyectoSelect.addEventListener("change", actualizarTarifasPorProyecto)
    actualizarTarifasPorProyecto() // Inicializa al cargar
  }
})

// Generar tabla de consumo dinámica
function generarTablaConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const tablaBody = document.getElementById("tablaConsumoBody")
  const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
  const bimestres = ["Bim 1", "Bim 2", "Bim 3", "Bim 4", "Bim 5", "Bim 6"]
  tablaBody.innerHTML = ""
  const totalTarifa = 0,
    totalConsumo = 0,
    totalImporte = 0,
    count = 0
  const periodos = tipoPeriodo === "mensual" ? meses : bimestres

  for (let i = 0; i < periodos.length; i++) {
    tablaBody.innerHTML += `
            <tr>
                <td style='padding:6px;'>${periodos[i]}</td>
                <td style='padding:6px;'><input type='number' id='tarifa${i}' style='width:80px;'></td>
                <td style='padding:6px;'><input type='number' id='consumo${i}' style='width:80px;'></td>
                <td style='padding:6px;'><input type='number' id='importe${i}' style='width:80px;'></td>
            </tr>`
  }

  // Actualizar totales al cambiar inputs
  tablaBody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", actualizarTotalesConsumo)
  })
  actualizarTotalesConsumo()
}

function actualizarTotalesConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

  let totalConsumo = 0
  let totalImporte = 0
  let totalTarifas = 0
  let contadorTarifas = 0

  for (let i = 0; i < numPeriodos; i++) {
    const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0
    const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0
    const tarifa = Number.parseFloat(document.getElementById(`tarifa${i}`)?.value) || 0

    totalConsumo += consumo
    totalImporte += importe

    if (tarifa > 0) {
      totalTarifas += tarifa
      contadorTarifas++
    }
  }

  const tarifaPromedio = contadorTarifas > 0 ? totalTarifas / contadorTarifas : 0

  // Update display elements
  document.getElementById("totalConsumoDisplay").textContent = `${totalConsumo.toFixed(0)} kWh`
  document.getElementById("totalImporteDisplay").textContent = `$${totalImporte.toFixed(2)}`
  document.getElementById("tarifaPromedioDisplay").textContent = `$${tarifaPromedio.toFixed(3)}`

  // Update summary fields
  const consumoMensual = tipoPeriodo === "mensual" ? totalConsumo / 12 : totalConsumo / 6
  document.getElementById("kwhMesResumen").value = `${consumoMensual.toFixed(0)} kWh`
  document.getElementById("tarifaPromResumen").value = `$${tarifaPromedio.toFixed(3)}`
}

// Function to load and parse CSV data
async function loadCSVData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hsp_Hoja1-kr8ml1Lz0SvIbQmWD96PSGcSC2lQAt.csv",
    )
    const csvText = await response.text()
    console.log(csvText)
    // Parse CSV
    const lines = csvText.split("\n")
    const headers = lines[0].split(",")

    csvData = []

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",")
        const rowData = {}

        headers.forEach((header, index) => {
          rowData[header.trim()] = values[index] ? values[index].trim() : ""
        })

        if (rowData.Estado) {
          csvData.push(rowData)
          // Store average HSP value for quick access
          hspData[rowData.Estado] = Number.parseFloat(rowData.Promedio) || 0
        }
      }
    }
    console.log("CSV data loaded successfully:", csvData)

    inicializarEstados()
  } catch (error) {
    console.error("Error loading CSV data:", error)
    // Fallback to hardcoded data if CSV fails
    hspData = {
      Aguascalientes: 5.91,
      "Baja California": 5.07,
      "Baja California Sur": 5.59,
      Campeche: 5.85,
      Coahuila: 5.16,
      Colima: 5.61,
      Chiapas: 5.15,
      Chihuahua: 5.33,
      "Ciudad de México": 5.46,
      Durango: 5.73,
      Guanajuato: 5.79,
      Guerrero: 5.68,
      Hidalgo: 5.16,
      Jalisco: 5.81,
      "Estado de México": 5.46,
      Michoacán: 5.58,
      Morelos: 5.94,
      Nayarit: 5.88,
      "Nuevo León": 4.94,
      Oaxaca: 5.26,
      Puebla: 5.4,
      Querétaro: 5.86,
      "Quintana Roo": 5.69,
      "San Luis Potosí": 5.49,
      Sinaloa: 5.98,
      Sonora: 5.73,
      Tabasco: 4.94,
      Tamaulipas: 4.87,
      Tlaxcala: 5.4,
      Veracruz: 4.6,
      Yucatán: 5.3,
      Zacatecas: 5.76,
    }
    inicializarEstados()
  }
}

function inicializarEstados() {
  const estadoSelect = document.getElementById("estadoProyecto")
  estadoSelect.innerHTML = '<option value="">Seleccionar estado</option>'

  Object.keys(hspData)
    .sort()
    .forEach((estado) => {
      const option = document.createElement("option")
      option.value = estado
      option.textContent = estado
      estadoSelect.appendChild(option)
    })
}

function actualizarHSP() {
  const estadoSeleccionado = document.getElementById("estadoProyecto").value

  if (estadoSeleccionado && hspData[estadoSeleccionado]) {
    // Store HSP value for calculations
    window.hspValue = hspData[estadoSeleccionado]
    console.log("[v0] HSP for state:", window.hspValue)
    // Find detailed data for the selected state
    const estadoData = csvData.find((row) => row.Estado === estadoSeleccionado)
    console.log("[v0] Estado seleccionado:", estadoSeleccionado)
    if (estadoData) {
      // Display irradiation data in console for now (you can modify this to show in UI)
      console.log(`Datos de irradiación para ${estadoSeleccionado}:`, {
        Enero: estadoData.Enero,
        Febrero: estadoData.Febrero,
        Marzo: estadoData.Marzo,
        Abril: estadoData.Abril,
        Mayo: estadoData.Mayo,
        Junio: estadoData.Junio,
        Julio: estadoData.Julio,
        Agosto: estadoData.Agosto,
        Septiembre: estadoData.Septiembre,
        Octubre: estadoData.Octubre,
        Noviembre: estadoData.Noviembre,
        Diciembre: estadoData.Diciembre,
        Mínima: estadoData.Minima,
        Máxima: estadoData.Maxima,
        Promedio: estadoData.Promedio,
      })

      if (typeof mostrarDatosIrradiacion === "function") {
        mostrarDatosIrradiacion(estadoData)
      }
      console.log("[v0] Estado data:", estadoData)
    }
  }
}

// function mostrarDatosIrradiacion(estadoData) {
//   // Create or update irradiation data display
//   let irradiacionDiv = document.getElementById("irradiacionData")

//   if (!irradiacionDiv) {
//     irradiacionDiv = document.createElement("div")
//     irradiacionDiv.id = "irradiacionData"
//     irradiacionDiv.className = "form-section"

//     // Insert after the Datos del Proyecto section
//     const proyectoSection = document.querySelector("#estadoProyecto").closest(".form-section")
//     proyectoSection.parentNode.insertBefore(irradiacionDiv, proyectoSection.nextSibling)
//   }

//   irradiacionDiv.innerHTML = `
//         <div class="section-title">
//             <i class="fas fa-sun"></i>
//             <span>Datos de Irradiación Solar - ${estadoData.Estado}</span>
//         </div>
//         <div class="irradiation-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; margin-bottom: 1rem;">
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Enero</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Enero} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Febrero</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Febrero} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Marzo</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Marzo} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Abril</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Abril} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Mayo</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Mayo} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Junio</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Junio} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Julio</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Julio} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Agosto</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Agosto} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Septiembre</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Septiembre} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Octubre</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Octubre} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Noviembre</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Noviembre} kWh/m²</div>
//             </div>
//             <div class="irradiation-item">
//                 <label style="font-size: 0.75rem; color: #4a5568;">Diciembre</label>
//                 <div style="font-weight: 600; color: #1a202c;">${estadoData.Diciembre} kWh/m²</div>
//             </div>
//         </div>
//         <div class="form-row">
//             <div class="form-group">
//                 <label>Irradiación Mínima</label>
//                 <input type="text" value="${estadoData.Minima} kWh/m²" readonly style="background: #f7fafc;">
//             </div>
//             <div class="form-group">
//                 <label>Irradiación Máxima</label>
//                 <input type="text" value="${estadoData.Maxima} kWh/m²" readonly style="background: #f7fafc;">
//             </div>
//         </div>
//         <div class="form-group">
//             <label>Irradiación Promedio Anual</label>
//             <input type="text" value="${estadoData.Promedio} kWh/m²" readonly style="background: #e6fffa; font-weight: 600;">
//         </div>
//     `
// }
/**
 * 

function generarInputsConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const container = document.getElementById("consumoInputsGrid")
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6
  const periodos =
    tipoPeriodo === "mensual"
      ? [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ]
      : ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4", "Bimestre 5", "Bimestre 6"]

  container.innerHTML = ""

  for (let i = 0; i < numPeriodos; i++) {
    const periodoCard = document.createElement("div")
    periodoCard.style.cssText = `
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `

    periodoCard.innerHTML = `
      <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.5rem; text-align: center; font-size: 0.85rem;">
        ${periodos[i]}
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Consumo (kWh)</label>
          <input type="number" id="consumo${i}" placeholder="0" 
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="calcularTarifaAutomatica(${i})">
        </div>
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Importe ($)</label>
          <input type="number" id="importe${i}" placeholder="0" 
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="actualizarTotales()">
        </div>
      </div>
    `

    container.appendChild(periodoCard)
  }

  // Initialize totals
  actualizarTotales()
}
 */

function generarInputsConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const container = document.getElementById("consumoInputsGrid")

  // Tus valores fijos de prueba
  const consumosDemo = [690, 631, 422, 970, 1011, 752]
  const importesDemo = [1695, 1685, 489, 2798, 2998, 2269]

  // Según tipoPeriodo decides si usar 12 o 6 periodos
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6
  const periodos =
    tipoPeriodo === "mensual"
      ? [
          "Enero",
          "Febrero",
          "Marzo",
          "Abril",
          "Mayo",
          "Junio",
          "Julio",
          "Agosto",
          "Septiembre",
          "Octubre",
          "Noviembre",
          "Diciembre",
        ]
      : ["Bimestre 1", "Bimestre 2", "Bimestre 3", "Bimestre 4", "Bimestre 5", "Bimestre 6"]

  container.innerHTML = ""

  for (let i = 0; i < numPeriodos; i++) {
    // Si hay datos en el arreglo, los usamos; si no, dejamos vacío
    const consumoDemo = consumosDemo[i] ?? ""
    const importeDemo = importesDemo[i] ?? ""

    const periodoCard = document.createElement("div")
    periodoCard.style.cssText = `
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `

    periodoCard.innerHTML = `
      <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.5rem; text-align: center; font-size: 0.85rem;">
        ${periodos[i]}
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Consumo (kWh)</label>
          <input type="number" id="consumo${i}" placeholder="0" value="${consumoDemo}"
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="calcularTarifaAutomatica(${i})">
        </div>
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Importe ($)</label>
          <input type="number" id="importe${i}" placeholder="0" value="${importeDemo}"
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="actualizarTotales()">
        </div>
      </div>
    `

    container.appendChild(periodoCard)
  }

  // Inicializar totales
  actualizarTotales()
}

function calcularTarifaAutomatica(index) {
  const consumo = Number.parseFloat(document.getElementById(`consumo${index}`)?.value) || 0
  const importe = Number.parseFloat(document.getElementById(`importe${index}`)?.value) || 0
  const tarifaInput = document.getElementById(`tarifa${index}`)
  if (!tarifaInput) {
    actualizarTotalesConsumo?.()
    return
  } // ← si no existe, sal con gracia
  tarifaInput.value = consumo > 0 && importe > 0 ? (importe / consumo).toFixed(3) : ""
  actualizarTotalesConsumo?.()
}

function generarInputsPago() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const container = document.getElementById("pagoInputs") || document.getElementById("pagoRow")
  if (!container) return // ← evita crashear si no existe
  const numCampos = tipoPeriodo === "mensual" ? 12 : 6

  container.innerHTML = ""
  for (let i = 0; i < numCampos; i++) {
    const pagoInput = document.createElement("input")
    pagoInput.type = "number"
    pagoInput.className = "consumo-input"
    pagoInput.placeholder = tipoPeriodo === "mensual" ? `${meses[i]} ($)` : `Bim ${i + 1} ($)`
    pagoInput.id = `pago${i}`
    pagoInput.step = "0.01"
    container.appendChild(pagoInput)
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container")
  if (!container) return

  const toast = document.createElement("div")
  toast.className = "toast"
  toast.textContent = message

  // Colores según tipo
  if (type === "error") toast.style.background = "#dc2626" // rojo
  if (type === "success") toast.style.background = "#16a34a" // verde
  if (type === "warning") toast.style.background = "#67AA47" // amarillo

  container.appendChild(toast)

  // Quitar después de animación
  setTimeout(() => {
    toast.remove()
  }, 4000) // 4 segundos
}

const consumos = []
const importes = []
let kwintsladaConEficiancia = 0
let generacionAnualAprox = 0
function calcularSistemaSolar() {
  // Desactivar el botón
  document.getElementById("btnCalcular").disabled = true

  function validarCliente() {
    const nombre = document.getElementById("nombreCliente")?.value.trim()
    const direccion = document.getElementById("direccionCliente")?.value.trim()
    const estado = document.getElementById("estadoCliente")?.value
    const municipio = document.getElementById("municipioCliente")?.value.trim()
    const telefono = document.getElementById("telefonoCliente")?.value.trim()
    const correo = document.getElementById("correoCliente")?.value.trim()

    // Nombre
    if (!nombre) {
      showToast("Falta llenar el nombre del cliente.", "warning")
      return false
    }
    // Dirección
    if (!direccion) {
      showToast("Falta llenar la dirección del cliente.", "warning")
      return false
    }
    // Estado
    if (!estado) {
      showToast("Selecciona un estado para el cliente.", "warning")
      return false
    }
    // Municipio
    if (!municipio) {
      showToast("Falta llenar el municipio del cliente.", "warning")
      return false
    }
    // Teléfono (10 dígitos)
    const soloNumeros = telefono.replace(/\D/g, "")
    if (!soloNumeros || soloNumeros.length !== 10) {
      showToast("El teléfono debe tener 10 dígitos.", "warning")
      return false
    }
    // Correo (formato válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!correo || !emailRegex.test(correo)) {
      showToast("El correo electrónico no es válido.", "warning")
      return false
    }

    return true // ✅ todos los campos son válidos
  }

  if (!validarCliente()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarEjecutivo() {
    const nombre = document.getElementById("nombreEjecutivo")?.value.trim()
    const correo = document.getElementById("correoEjecutivo")?.value.trim()
    const folio = document.getElementById("folioCotizacion")?.value.trim()

    // Nombre
    if (!nombre) {
      showToast("Falta llenar el nombre del ejecutivo.", "warning")
      return false
    }

    // Correo (formato válido)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
    if (!correo || !emailRegex.test(correo)) {
      showToast("El correo del ejecutivo no es válido.", "warning")
      return false
    }

    // Folio
    if (!folio) {
      showToast("Falta ingresar el folio de la cotización.", "warning")
      return false
    }

    return true // ✅ todos los campos son válidos
  }

  if (!validarEjecutivo()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarProyecto() {
    const tipoProyecto = document.getElementById("tipoProyecto")?.value
    const tipoTarifa = document.getElementById("tipoTarifa")?.value
    const notaProyecto = document.getElementById("notaProyecto")?.value.trim()
    const estadoProyecto = document.getElementById("estadoProyecto")?.value
    const municipioProyecto = document.getElementById("municipioProyecto")?.value.trim()
    const requerimientosProyecto = document.getElementById("requerimientosProyecto")?.value.trim()
    const tipoPeriodo = document.getElementById("tipoPeriodo")?.value

    // Tipo de Proyecto
    if (!tipoProyecto) {
      showToast("Selecciona el tipo de proyecto.", "warning")
      return false
    }

    // Tipo de Tarifa
    if (!tipoTarifa) {
      showToast("Selecciona el tipo de tarifa.", "warning")
      return false
    }

    // Nota (puede ser opcional, si la quieres obligatoria descomenta)
    // if (!notaProyecto) {
    //   showToast("Falta agregar una nota del proyecto.", "warning");
    //   return false;
    // }

    // Estado
    if (!estadoProyecto) {
      showToast("Selecciona el estado del proyecto.", "warning")
      return false
    }

    // Municipio / Ciudad
    if (!municipioProyecto) {
      showToast("Falta llenar el municipio o ciudad del proyecto.", "warning")
      return false
    }

    // Requerimientos (puede ser opcional, si lo quieres obligatorio descomenta)
    // if (!requerimientosProyecto) {
    //   showToast("Falta llenar los requerimientos del proyecto.", "warning");
    //   return false;
    // }

    // Período de Facturación
    if (!tipoPeriodo) {
      showToast("Selecciona el período de facturación.", "warning")
      return false
    }

    return true // ✅ todos los campos válidos
  }

  if (!validarProyecto()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarDisenio() {
    const potenciaPanel = document.getElementById("potenciaPanel")?.value.trim()
    const marcaPanel = document.getElementById("marcaPanel")?.value.trim()
    const modeloPanel = document.getElementById("modeloPanel")?.value.trim()
    const inversorPanel = document.getElementById("inversorPanel")?.value
    const potenciaInversor = document.getElementById("potenciaInversor")?.value.trim()
    const instalacionElectrica = document.getElementById("instalacionElectrica")?.value
    const numHilos = document.getElementById("numHilos")?.value
    const voltajeOperacion = document.getElementById("voltajeOperacion")?.value
    const areaAprox = document.getElementById("areaAprox")?.value.trim()

    // Potencia panel
    if (!potenciaPanel || Number(potenciaPanel) <= 0) {
      showToast("Indica la potencia del panel.", "warning")
      return false
    }

    // Marca panel
    if (!marcaPanel) {
      showToast("Falta llenar la marca del panel.", "warning")
      return false
    }

    // Modelo panel
    if (!modeloPanel) {
      showToast("Falta llenar el modelo del panel.", "warning")
      return false
    }

    // Tipo de inversor
    if (!inversorPanel) {
      showToast("Selecciona el tipo de inversor.", "warning")
      return false
    }

    // Potencia del inversor
    if (!potenciaInversor || Number(potenciaInversor) <= 0) {
      showToast("Indica la potencia del inversor.", "warning")
      return false
    }

    // Instalación eléctrica
    if (!instalacionElectrica) {
      showToast("Selecciona el tipo de instalación eléctrica.", "warning")
      return false
    }

    // Número de hilos
    if (!numHilos) {
      showToast("Selecciona el número de hilos.", "warning")
      return false
    }

    // Voltaje de operación
    if (!voltajeOperacion) {
      showToast("Selecciona el voltaje de operación.", "warning")
      return false
    }

    // Área aproximada
    if (!areaAprox || Number(areaAprox) <= 0) {
      showToast("Indica el área aproximada disponible.", "warning")
      return false
    }

    return true // ✅ todo correcto
  }

  if (!validarDisenio()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarCotizacionPU() {
    // Campos que SÍ validamos (sin incluir profit)
    const campos = [
      "panel",
      "inversor",
      "mantenimiento",
      "estructura",
      "materiales",
      "instalacion",
      "carpeta",
      "flete",
      "interconexion",
      "uve",
      "uie",
      "medidor",
    ]

    for (const id of campos) {
      const input = document.getElementById(id)
      if (input) {
        if (input.value.trim() === "") {
          input.value = 0 // Coloca 0
          showToast(`El campo "${id}" estaba vacío, se colocó 0.`, "warning")
        }
      }
    }

    return true // ✅ continúa siempre porque ya corrige
  }

  if (!validarCotizacionPU()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  const selectInversor = document.getElementById("inversorPanel")

  selectInversor.addEventListener("change", () => {
    const valor = selectInversor.value

    if (valor === "Microinversor") {
      console.log("Seleccionaste un Microinversor")
    } else if (valor === "Central") {
      console.log("Seleccionaste un Inversor Central")
    } else {
      console.log("No has seleccionado nada")
    }
  })

  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

  const consumos = []
  const importes = []

  // Collect consumption and payment data (SIN CAMBIOS)
  for (let i = 1; i <= numPeriodos; i++) {
    const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value || 0)
    const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value || 0)
    consumos.push(consumo)
    importes.push(importe)
  }

  // === Cálculos ===
  const consumoTotal = consumos.reduce((sum, val) => sum + val, 0)
  const consumoAnual = consumoTotal
  const consumoMensual = consumoAnual / 12
  const consumoDiario = consumoAnual / 365

  let importeTotal = 0
  for (let i = 0; i < importes.length; i++) {
    importeTotal += importes[i]
  }
  const importeTotalAnual = importeTotal
  const importePromedio = importeTotalAnual / 12

  const tarifas = []
  let sumaTarifas = 0
  for (let i = 0; i < numPeriodos; i++) {
    if (consumos[i] > 0) {
      const tarifa = importes[i] / consumos[i]
      tarifas.push(tarifa)
      sumaTarifas += tarifa
    } else {
      tarifas.push(0)
    }
  }
  const tarifaPromedio = sumaTarifas / tarifas.filter((t) => t > 0).length

  const estado = document.getElementById("estadoProyecto").value

  // ====== VALIDACIÓN MÍNIMA (NO CAMBIA LÓGICA) ======
  // Asegura que hspPromedio exista y sea número antes de usarlo
  let hspPromedio = Number(window.hspValue)
  if (!Number.isFinite(hspPromedio)) {
    const fallback = Number(hspData?.[estado])
    if (Number.isFinite(fallback)) hspPromedio = fallback
  }
  if (!Number.isFinite(hspPromedio) || hspPromedio <= 0) {
    showToast("Selecciona el estado para cargar HSP antes de calcular.", "warning")
    document.getElementById("btnCalcular").disabled = false
    return
  }

  // Asegura que potenciaPanel sea número válido
  const potenciaPanel = Number.parseFloat(document.getElementById("potenciaPanel")?.value)
  if (!Number.isFinite(potenciaPanel) || potenciaPanel <= 0) {
    alert("Indica una potencia de panel válida antes de calcular.")
    document.getElementById("btnCalcular").disabled = false
    return
  }
  //comentario test
  // ====== FIN VALIDACIÓN ======
  const produccionMensual = JSON.parse(localStorage.getItem("produccionMensual")) || 0
  console.log(produccionMensual)
  const cotizacionPU = JSON.parse(localStorage.getItem("cotizacionPU")) || 0
  const potenciaNecesaria = consumoDiario / (hspPromedio * 0.76)
  const numeroModulos = Math.ceil((consumoDiario * 1000) / (hspPromedio * potenciaPanel * 0.76))
  const generacionAnual = numeroModulos * (potenciaPanel / 1000) * hspPromedio * 365
  const potenciaInstalada = (potenciaPanel * numeroModulos) / 1000
  let suma = 0
  for (let i = 0; i < produccionMensual.length; i++) {
    suma += produccionMensual[i]
  }
  const ahorroCO2 = (suma * 439.963) / 1000000
  const arboles = ahorroCO2 * 155
  const porcentajeAhorro = ((generacionAnual / consumoAnual) * 100).toFixed(1)
  kwintsladaConEficiancia = (potenciaPanel * numeroModulos * 0.76) / 1000

  let promediodeproduccion = 0
  for (let i = 0; i < produccionMensual.length; i++) {
    promediodeproduccion += produccionMensual[i]
  }
  promediodeproduccion /= produccionMensual.length

  console.log(promediodeproduccion)
  generacionAnualAprox = ((numeroModulos * potenciaPanel) / 1000) * hspPromedio * 365
  const diferencia = consumoMensual - promediodeproduccion
  console.log(diferencia, consumoMensual)
  const porcentaje = (1 - diferencia / consumoMensual) * 100
  console.log(porcentaje)
  // === Mostrar en la interfaz ===
  document.getElementById("resultsPlaceholder").style.display = "none"
  document.getElementById("resultsContent").style.display = "block"

  document.getElementById("consumoAnual").textContent = `${consumoAnual.toFixed(0)} kWh`
  document.getElementById("consumoMensual").textContent = `${consumoMensual.toFixed(0)} kWh`
  document.getElementById("consumoDiario").textContent = `${consumoDiario.toFixed(1)} kWh`
  document.getElementById("importeTotal").textContent = `$${importeTotalAnual.toFixed(2)}`
  document.getElementById("importePromedio").textContent = `$${importePromedio.toFixed(2)}`
  document.getElementById("tarifaPromedio").textContent = `$${tarifaPromedio.toFixed(3)}`
  document.getElementById("potenciaNecesaria").textContent = `${potenciaNecesaria.toFixed(2)} kW`
  document.getElementById("numeroModulos").textContent = `${numeroModulos}`
  document.getElementById("potenciaInstalada").textContent = `${potenciaInstalada.toFixed(2)} kW`
  document.getElementById("hsp").textContent = `${hspPromedio.toFixed(2)} h`
  document.getElementById("ahorroCO2").textContent = `${ahorroCO2.toFixed(3)} t`
  document.getElementById("arboles").textContent = `${arboles.toFixed(0)} árboles`
  document.getElementById("porcentajeAhorro").textContent = `${porcentajeAhorro}%`
  //finales
  document.getElementById("generacionAnual").textContent = `${generacionAnual.toFixed(2)} KWh`
  document.getElementById("porcentajeGeneracion").textContent = `${porcentaje.toFixed(2)}%`
  // document.getElementById("roi").textContent = `${cotizacionPU.roiConiva.toFixed(1)} años`;

  llenarTablaDetallada(consumos, importes, tarifas, tipoPeriodo)
  crearGraficaIrradiacion(estado)
  const areaAprox = document.getElementById("areaAprox").value

  const consumoAnualDeEnergia = consumoAnual * tarifaPromedio

  // Mostrar/Habilitar el botón "Generar Cotización" en móvil
  // Mostrar/Habilitar el botón "Generar Cotización" en móvil
  const btnCot = document.getElementById("btnCotizarMobile")
  if (btnCot) {
    btnCot.classList.add("show") // ← clave para que tu CSS lo muestre
    btnCot.disabled = false
    btnCot.removeAttribute("hidden") // por si acaso

    // opcional: baja el scroll hasta el botón para que el usuario lo vea
    btnCot.scrollIntoView({ behavior: "smooth", block: "center" })
  }

  // === Guardar en localStorage ===
  const resultados = {
    tipoPeriodo,
    consumos,
    importes,
    consumoTotal,
    consumoAnual,
    consumoMensual,
    consumoDiario,
    importeTotalAnual,
    importePromedio,
    tarifas,
    tarifaPromedio,
    estado,
    hspPromedio,
    potenciaPanel,
    potenciaNecesaria,
    numeroModulos,
    generacionAnual,
    potenciaInstalada,
    ahorroCO2,
    porcentajeAhorro,
    selectInversor: selectInversor.value,
    kwintsladaConEficiancia: kwintsladaConEficiancia,
    generacionAnualAprox: generacionAnualAprox,
    areaAprox: areaAprox,
    consumoAnualDeEnergia: consumoAnualDeEnergia,
  }

  localStorage.setItem("resultadosSistemaSolar", JSON.stringify(resultados))
  console.log("Guardado en localStorage:", resultados)
}

function llenarTablaDetallada(consumos, importes, tarifas, tipoPeriodo) {
  const tbody = document.getElementById("detalleTableBody")
  tbody.innerHTML = ""

  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

  for (let i = 0; i < numPeriodos; i++) {
    const row = document.createElement("div")
    row.className = "table-row"

    const periodo = tipoPeriodo === "mensual" ? meses[i] : `Bimestre ${i + 1}`
    const consumo = consumos[i] || 0
    const importe = importes[i] || 0
    const tarifa = tarifas[i] || 0

    row.innerHTML = `
            <div class="table-cell">${periodo}</div>
            <div class="table-cell">${consumo.toFixed(0)} kWh</div>
            <div class="table-cell">$${importe.toFixed(2)}</div>
            <div class="table-cell">$${tarifa.toFixed(3)}</div>
        `

    tbody.appendChild(row)
  }
}

function crearGraficaIrradiacion(estado) {
  const canvas = document.getElementById("irradiacionChart")
  const ctx = canvas.getContext("2d")

  // Find state data in CSV
  const estadoData = csvData.find((row) => row.Estado === estado)
  if (!estadoData) {
    console.log("[v0] No data found for state:", estado)
    return
  }

  const mesesCSV = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ]
  const mesesDisplay = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]

  // Extract monthly irradiation data (kWh/m²/día)
  const irradiacionData = []
  mesesCSV.forEach((mes) => {
    const valor = Number.parseFloat(estadoData[mes]) || 0
    irradiacionData.push(valor)
  })

  // Guardar en localStorage
  localStorage.setItem("irradiacionAnual", JSON.stringify({ irradiacion: irradiacionData }))

  // === Promedio (usa columna Promedio si existe; si no, lo calculamos) ===
  const promedioCalc = (() => {
    const p = Number.parseFloat(estadoData.Promedio)
    if (Number.isFinite(p)) return p
    const nums = irradiacionData.filter((v) => Number.isFinite(v))
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  })()

  // Extender etiquetas y datos con el “Promedio” al final
  const etiquetasX = [...mesesDisplay, "Prom"]
  const dataConProm = [...irradiacionData, promedioCalc]

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Chart dimensions
  const padding = 60
  const chartWidth = canvas.width - 2 * padding
  const chartHeight = canvas.height - 2 * padding

  // Escalado (considera también el promedio)
  const maxValue = Math.max(...dataConProm)
  const valueRange = maxValue > 0 ? maxValue : 1

  // Draw axes
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, canvas.height - padding)
  ctx.lineTo(canvas.width - padding, canvas.height - padding)
  ctx.stroke()

  // Grid y labels Y
  ctx.strokeStyle = "#e0e0e0"
  ctx.lineWidth = 1
  ctx.fillStyle = "#666"
  ctx.font = "12px Arial"

  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight * i) / 5
    const value = maxValue - (valueRange * i) / 5

    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(canvas.width - padding, y)
    ctx.stroke()

    ctx.fillText(value.toFixed(1), 10, y + 4)
  }

  // Labels X (12 meses + Prom)
  const N = dataConProm.length // 13
  for (let i = 0; i < N; i++) {
    const x = padding + (chartWidth * (i + 0.5)) / N
    ctx.fillText(etiquetasX[i], x - 15, canvas.height - 20)
  }

  // Barras
  const barWidth = (chartWidth / N) * 0.8 // 80%
  const barSpacing = (chartWidth / N) * 0.2 // 20%

  for (let i = 0; i < N; i++) {
    const x = padding + (chartWidth * i) / N + barSpacing / 2
    const hVal = dataConProm[i]
    const barHeight = (hVal / valueRange) * chartHeight
    const y = canvas.height - padding - barHeight

    // Promedio con estilo distinto
    const isProm = i === N - 1

    if (isProm) {
      // color distinto para la barra de Promedio
      const gradProm = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradProm.addColorStop(0, "#4f46e5") // indigo-600
      gradProm.addColorStop(1, "#1d4ed8") // blue-700
      ctx.fillStyle = gradProm
    } else {
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight)
      gradient.addColorStop(0, "#73b248")
      gradient.addColorStop(1, "#106e3a")
      ctx.fillStyle = gradient
    }

    ctx.fillRect(x, y, barWidth, barHeight)

    ctx.strokeStyle = isProm ? "#1d4ed8" : "#106e3a"
    ctx.lineWidth = 1
    ctx.strokeRect(x, y, barWidth, barHeight)

    // Valor encima de la barra
    ctx.fillStyle = "#333"
    ctx.font = "10px Arial"
    ctx.textAlign = "center"
    ctx.fillText(hVal.toFixed(1), x + barWidth / 2, y - 5)
  }

  // Línea horizontal de promedio (referencia)
  const yProm = canvas.height - padding - (promedioCalc / valueRange) * chartHeight
  ctx.save()
  ctx.strokeStyle = "rgba(79,70,229,0.9)" // indigo
  ctx.lineWidth = 1.5
  ctx.setLineDash([6, 6])
  ctx.beginPath()
  ctx.moveTo(padding, yProm)
  ctx.lineTo(canvas.width - padding, yProm)
  ctx.stroke()
  ctx.restore()

  // Título
  ctx.fillStyle = "#333"
  ctx.font = "bold 16px Arial"
  ctx.textAlign = "center"
  ctx.fillText(`Irradiación Solar - ${estado}`, canvas.width / 2, 20)
  ctx.fillText("(kWh/m²/día)", canvas.width / 2, 40)

  // Pie con promedio
  ctx.font = "11px Arial"
  ctx.fillText(`Promedio anual: ${promedioCalc.toFixed(2)} kWh/m²/día`, canvas.width / 2, canvas.height - 2)

  console.log("[v0] Monthly data for", estado, ":", irradiacionData)
  console.log("[v0] Average:", promedioCalc)
  console.log("[v0] Solar irradiation bar chart created successfully")
}

// Etiquetas (12 meses)
const mesesDisplay = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic", "Promedio"]
const datosLocalStorage = JSON.parse(localStorage.getItem("resultadosSistemaSolar"))
const datosLocalStorage2 = JSON.parse(localStorage.getItem("irradiacionAnual") || "{}")
// Consumos (12 valores). Si trabajas bimestral, duplica o interpola.
// const consumosMensuales = consumos;
let consumosMensuales = datosLocalStorage ? datosLocalStorage.consumos : []
// Si el arreglo tiene 6 valores, intercalar 0 entre cada valor para formar 12
if (consumosMensuales.length === 6) {
  const nuevoArreglo = []
  for (let i = 0; i < consumosMensuales.length; i++) {
    nuevoArreglo.push(consumosMensuales[i]) // valor original
    nuevoArreglo.push(0) // intercalado
  }
  consumosMensuales = nuevoArreglo
}
console.log("Consumos mensuales:", consumosMensuales)
// Lee de LS con fallback seguro
const irradiacionMensualRaw =
  datosLocalStorage2 && Array.isArray(datosLocalStorage2.irradiacion) ? datosLocalStorage2.irradiacion : []

console.log("Irradiación mensual raw:", irradiacionMensualRaw)

const kwinsEfRaw =
  datosLocalStorage && typeof datosLocalStorage.kwintsladaConEficiancia !== "undefined"
    ? datosLocalStorage.kwintsladaConEficiancia
    : 0
console.log("kwinsEfRaw:", kwinsEfRaw)
const produccionMensual = []

for (let i = 0; i < 12; i++) {
  produccionMensual[i] = irradiacionMensualRaw[i] * kwinsEfRaw * 31
}
localStorage.setItem("produccionMensual", JSON.stringify(produccionMensual))
console.log("irradiacionMensual:", irradiacionMensualRaw)
console.log("kwinsEf:", kwinsEfRaw)
console.log("produccionMensual:", produccionMensual)

// Llamada:
// Llama una vez después de que existan los elementos
setupImpactoResponsive(mesesDisplay, consumosMensuales, produccionMensual)

function setupImpactoResponsive(labels, consumoArr, produccionArr) {
  const canvas = document.getElementById("impactoChart")
  if (!canvas) return

  // --- utilidades: promedio robusto (ignora null/undefined/NaN) ---
  const avg = (arr) => {
    const nums = (arr || []).map((v) => Number(v)).filter((v) => Number.isFinite(v))
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
  }

  // --- clonar y extender con "Promedio" ---
  const consumoAvg = avg(consumoArr)
  const produccionAvg = avg(produccionArr)

  const labelsExt = [...labels, "Promedio"]
  const consumoExt = [...consumoArr, consumoAvg]
  const produccionExt = [...produccionArr, produccionAvg]

  const redraw = () => {
    // 1) Ajuste a contenedor + DPR
    const parent = canvas.parentElement || canvas
    const cssWidth = canvas.style.width ? Number.parseInt(getComputedStyle(canvas).width) : parent.clientWidth || 600

    const cssHeight = canvas.style.height ? Number.parseInt(getComputedStyle(canvas).height) : 320

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2))
    canvas.width = Math.floor(cssWidth * dpr)
    canvas.height = Math.floor(cssHeight * dpr)

    const ctx = canvas.getContext("2d")
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    // 2) Calcula tamaños relativos
    const W = cssWidth
    const H = cssHeight

    const base = Math.max(12, Math.min(16, Math.floor(W / 60)))
    const pad = Math.max(40, Math.min(100, Math.floor(W * 0.08)))

    // 3) Decide si rotar labels en X (usar largo extendido)
    const L = Math.min(labelsExt.length, consumoExt.length, produccionExt.length)
    const rotateX = (W < 480 && L > 6) || (W < 360 && L > 4)

    // 4) Dibuja con los arreglos extendidos (incluyen “Promedio” al final)
    crearGraficaImpactoResponsive({
      canvas,
      ctx,
      labels: labelsExt,
      consumoArr: consumoExt,
      produccionArr: produccionExt,
      baseFontPx: base,
      paddingPx: pad,
      rotateXLabels: rotateX,
    })
  }

  canvas.__impactoRedraw = redraw
  // Primera pintura
  redraw()

  // Redibujar al resize del contenedor / ventana
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(redraw)
    ro.observe(canvas.parentElement || canvas)
  } else {
    window.addEventListener("resize", redraw)
  }
}

function crearGraficaImpactoResponsive(opts) {
  const {
    canvas,
    ctx,
    labels,
    consumoArr,
    produccionArr,
    baseFontPx = 14,
    paddingPx = 80,
    rotateXLabels = false,
  } = opts

  // Sanitizado
  const L = Math.min(labels.length, consumoArr.length, produccionArr.length)
  const lab = labels.slice(0, L)
  const consumo = consumoArr.slice(0, L).map((v) => Number(v) || 0)
  const prod = produccionArr.slice(0, L).map((v) => Number(v) || 0)

  // Dimensiones (en CSS px, ya transformados con DPR)
  const cs = getComputedStyle(canvas)
  const W = Math.max(50, Math.floor(Number.parseFloat(cs.width) || canvas.width || 600))
  const H = Math.max(50, Math.floor(Number.parseFloat(cs.height) || canvas.height || 320))

  const padding = paddingPx

  const chartWidth = Math.max(50, W - 2 * padding)
  const chartHeight = Math.max(50, H - 2 * padding)

  // Limpiar
  ctx.clearRect(0, 0, W, H)

  // Fuente principal
  const font = (w) => `${w}px Arial`
  ctx.textBaseline = "middle"

  // Escala Y
  const maxData = Math.max(...consumo, ...prod, 0)
  const niceMax = niceCeil(maxData) // escalar a “bonito” (e.g. múltiplos)
  const maxValue = niceMax > 0 ? niceMax : 1
  const ticks = 5

  // Ejes
  ctx.strokeStyle = "#333"
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(padding, padding)
  ctx.lineTo(padding, H - padding)
  ctx.lineTo(W - padding, H - padding)
  ctx.stroke()

  // Grid + etiquetas Y
  ctx.strokeStyle = "#e0e0e0"
  ctx.lineWidth = 1
  ctx.fillStyle = "#666"
  ctx.font = font(Math.max(10, baseFontPx - 2))
  for (let i = 0; i <= ticks; i++) {
    const y = padding + (chartHeight * i) / ticks
    const value = maxValue - (maxValue * i) / ticks
    ctx.beginPath()
    ctx.moveTo(padding, y)
    ctx.lineTo(W - padding, y)
    ctx.stroke()
    ctx.fillText(value.toFixed(0), Math.max(10, padding * 0.35), y)
  }

  // Labels X
  ctx.fillStyle = "#666"
  ctx.textAlign = "center"
  ctx.font = font(Math.max(10, baseFontPx - 2))
  const xAxisY = H - padding + (rotateXLabels ? 10 : 18)

  for (let i = 0; i < L; i++) {
    const xCenter = padding + (chartWidth * (i + 0.5)) / L
    if (rotateXLabels) {
      ctx.save()
      ctx.translate(xCenter, xAxisY)
      ctx.rotate(-Math.PI / 4) // -45°
      ctx.fillText(lab[i], 0, 0)
      ctx.restore()
    } else {
      ctx.fillText(lab[i], xCenter, H - padding + 14)
    }
  }

  // Barras (dos por grupo)
  const groupWidth = chartWidth / Math.max(1, L)
  const barWidth = Math.max(6, Math.min(24, groupWidth * 0.35)) // límites para pantallas chicas
  const gapBars = Math.min(8, groupWidth * 0.08)

  for (let i = 0; i < L; i++) {
    const xGroupStart = padding + groupWidth * i
    const xConsumo = xGroupStart + (groupWidth - (2 * barWidth + gapBars)) / 2
    const xProducc = xConsumo + barWidth + gapBars

    const hC = (consumo[i] / maxValue) * chartHeight
    const hP = (prod[i] / maxValue) * chartHeight

    const yC = H - padding - hC
    const yP = H - padding - hP

    // Consumo
    const gradC = ctx.createLinearGradient(0, yC, 0, yC + hC)
    gradC.addColorStop(0, "#7a8aa0")
    gradC.addColorStop(1, "#3a4a60")
    ctx.fillStyle = gradC
    ctx.fillRect(xConsumo, yC, barWidth, hC)
    ctx.strokeStyle = "#2f3a48"
    ctx.lineWidth = 1
    ctx.strokeRect(xConsumo, yC, barWidth, hC)

    // Producción
    const gradP = ctx.createLinearGradient(0, yP, 0, yP + hP)
    gradP.addColorStop(0, "#73b248")
    gradP.addColorStop(1, "#106e3a")
    ctx.fillStyle = gradP
    ctx.fillRect(xProducc, yP, barWidth, hP)
    ctx.strokeStyle = "#106e3a"
    ctx.strokeRect(xProducc, yP, barWidth, hP)

    // Valores encima (ocultarlos si hay muy poco espacio)
    if (chartHeight > 140) {
      ctx.fillStyle = "#333"
      ctx.font = font(Math.max(9, baseFontPx - 4))
      ctx.textAlign = "center"
      ctx.fillText(String(Math.round(consumo[i])), xConsumo + barWidth / 2, Math.max(yC - 8, padding - 8))
      ctx.fillText(String(Math.round(prod[i])), xProducc + barWidth / 2, Math.max(yP - 8, padding - 8))
    }
  }

  // Títulos
  ctx.fillStyle = "#333"
  ctx.textAlign = "center"
  ctx.font = `bold ${Math.max(14, baseFontPx)}px Arial`
  ctx.fillText("Impacto de la Generación en el Consumo", W / 2, Math.max(24, padding * 0.45))
  ctx.font = `${Math.max(12, baseFontPx - 2)}px Arial`
  ctx.fillText("(kWh por mes)", W / 2, Math.max(44, padding * 0.65))

  // Leyenda compacta
  const legendTop = padding * 0.6
  const legendLeft = Math.min(W - padding - 160, W / 2 + 120)
  const drawLegendBox = (x, y, w, h, c1, c2, stroke) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h)
    g.addColorStop(0, c1)
    g.addColorStop(1, c2)
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = stroke
    ctx.strokeRect(x, y, w, h)
  }

  ctx.font = `${Math.max(11, baseFontPx - 1)}px Arial`
  ctx.textAlign = "left"
  ctx.fillStyle = "#333"
  drawLegendBox(legendLeft, legendTop, 16, 12, "#7a8aa0", "#3a4a60", "#2f3a48")
  ctx.fillText("Consumo", legendLeft + 22, legendTop + 10)
  drawLegendBox(legendLeft + 90, legendTop, 16, 12, "#73b248", "#106e3a", "#106e3a")
  ctx.fillText("Producción", legendLeft + 112, legendTop + 10)
}

// Redondeo “bonito” para el máximo del eje Y
function niceCeil(x) {
  if (x <= 0) return 1
  const exp = Math.floor(Math.log10(x))
  const base = Math.pow(10, exp)
  const m = x / base
  let nice
  if (m <= 1) nice = 1
  else if (m <= 2) nice = 2
  else if (m <= 5) nice = 5
  else nice = 10
  return nice * base
}

// function exportResultsToPdf() {
//   const nombreCliente = document.getElementById("nombreCliente")?.value || "Cliente no especificado"
//   const nombreEjecutivo = document.getElementById("nombreEjecutivo")?.value || "Ejecutivo no especificado"

//   const element = document.getElementById("resultsContent")
//   const clone = element.cloneNode(true)

//   const header = document.createElement("div")
//   header.style.cssText = `
//         padding: 30px;
//         background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
//         color: white;
//         margin-bottom: 30px;
//         border-radius: 12px;
//         page-break-inside: avoid;
//     `
//   header.innerHTML = `
//         <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
//             <div style="display: flex; align-items: center; gap: 15px;">
//                 <i class="fas fa-solar-panel" style="font-size: 2.5rem; color: #10b981;"></i>
//                 <div>
//                     <h1 style="margin: 0; font-size: 2rem; font-weight: 800;">Hexa Solar Power Solutions</h1>
//                     <p style="margin: 5px 0 0 0; opacity: 0.9;">Energía Solar Inteligente</p>
//                 </div>
//             </div>
//             <div style="text-align: right; font-size: 0.9rem;">
//                 <div>Reporte Generado</div>
//                 <div>${new Date().toLocaleDateString()}</div>
//             </div>
//         </div>
//         <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 20px;">
//             <h2 style="margin: 0 0 15px 0;">Análisis de Sistema Solar Fotovoltaico</h2>
//             <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
//                 <div><strong>Cliente:</strong> ${nombreCliente}</div>
//                 <div><strong>Ejecutivo:</strong> ${nombreEjecutivo}</div>
//             </div>
//         </div>
//     `

//   clone.insertBefore(header, clone.firstChild)

//   const opt = {
//     margin: [15, 15, 15, 15],
//     filename: `Hexa_Solar_${nombreCliente.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
//     image: { type: "jpeg", quality: 0.95 },
//     html2canvas: { scale: 1.5, backgroundColor: "#ffffff" },
//     jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
//   }

//   document.getElementById("loading").style.display = "flex"

//   setTimeout(() => {
//     window
//       .html2pdf()
//       .set(opt)
//       .from(clone)
//       .save()
//       .then(() => {
//         document.getElementById("loading").style.display = "none"
//       })
//       .catch((err) => {
//         console.error("Error al generar PDF:", err)
//         document.getElementById("loading").style.display = "none"
//         alert("Error al generar el PDF. Por favor intente nuevamente.")
//       })
//   }, 800)
// }

function exportQuotationToPdf() {
  console.log("[v0] Generating professional SFVI quotation")

  // Get all form data
  const nombreCliente = document.getElementById("nombreCliente")?.value || ""
  const direccionCliente = document.getElementById("direccionCliente")?.value || ""
  const estadoCliente = document.getElementById("estadoCliente")?.value || ""
  const municipioCliente = document.getElementById("municipioCliente")?.value || ""

  const nombreEjecutivo = document.getElementById("nombreEjecutivo")?.value || ""
  const correoEjecutivo = document.getElementById("correoEjecutivo")?.value || ""

  const tipoProyecto = document.getElementById("tipoProyecto")?.value || ""
  const tipoTarifa = document.getElementById("tipoTarifa")?.value || ""
  const estadoProyecto = document.getElementById("estadoProyecto")?.value || ""
  const municipioProyecto = document.getElementById("municipioProyecto")?.value || ""
  const zonaCFE = document.getElementById("zonaCFE")?.value || ""
  const notaProyecto = document.getElementById("notaProyecto")?.value || ""
  const requerimientosProyecto = document.getElementById("requerimientosProyecto")?.value || ""

  // Get calculated values
  const consumoAnual = document.getElementById("consumoAnual")?.textContent || "0 kWh"
  const consumoDiario = document.getElementById("consumoDiario")?.textContent || "0 kWh"
  const potenciaNecesaria = document.getElementById("potenciaNecesaria")?.textContent || "0 kW"
  const numeroModulos = document.getElementById("numeroModulos")?.textContent || "0"
  const potenciaInstalada = document.getElementById("potenciaInstalada")?.textContent || "0 kW"
  const generacionAnual = document.getElementById("generacionAnual")?.textContent || "0 kWh"
  const hsp = document.getElementById("hsp")?.textContent || "0 h"
  const ahorroCO2 = document.getElementById("ahorroCO2")?.textContent || "0 t"
  const tarifaPromedio = document.getElementById("tarifaPromedio")?.textContent || "$0"
  const importeTotal = document.getElementById("importeTotal")?.textContent || "$0"

  const potenciaPanel = document.getElementById("potenciaPanel")?.value || "565"
  const areaAproximada = document.getElementById("areaAprox")?.value || "40"

  // Create quotation document
  const quotationContent = document.createElement("div")
  quotationContent.style.cssText = `
        font-family: 'Arial', sans-serif;
        background: white;
        color: #333;
        line-height: 1.4;
        font-size: 12px;
    `

  quotationContent.innerHTML = `
        <!-- Page 1: Main Quotation -->
        <div style="page-break-after: always; padding: 20px;">
            <!-- Header with company branding -->
            <div style="border-bottom: 3px solid #73b248; padding-bottom: 15px; margin-bottom: 20px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h1 style="margin: 0; color: #1d3246; font-size: 24px; font-weight: bold;">HexaSolar</h1>
                        <h2 style="margin: 5px 0 0 0; color: #73b248; font-size: 16px; font-weight: normal;">PowerSolutions</h2>
                        <p style="margin: 5px 0 0 0; color: #666; font-size: 11px;">Cancún | Playa del Carmen | Tulum</p>
                    </div>
                    <div style="text-align: right; color: #666; font-size: 11px;">
                        <div style="margin-bottom: 3px;"><strong>Tel:</strong> 984 231 2287</div>
                        <div style="margin-bottom: 3px;"><strong>Web:</strong> https://hexasolar.com.mx</div>
                        <div><strong>Fecha:</strong> ${new Date().toLocaleDateString("es-MX")}</div>
                    </div>
                </div>
            </div>
            
            <!-- Title -->
            <div style="text-align: center; margin-bottom: 25px;">
                <h1 style="margin: 0; color: #1d3246; font-size: 20px; font-weight: bold; text-transform: uppercase;">
                    COTIZACIÓN DE INSTALACIÓN SFVI
                </h1>
                <p style="margin: 5px 0 0 0; color: #73b248; font-size: 14px;">(Sistema Fotovoltaico Interconectado)</p>
            </div>
            
            <!-- Client and Executive Data -->
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <!-- Client Data -->
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; border-bottom: 1px solid #73b248; padding-bottom: 5px;">
                        <i class="fas fa-user" style="color: #73b248; margin-right: 8px;"></i>DATOS DEL CLIENTE
                    </h3>
                    <div style="margin-bottom: 8px;"><strong>Nombre:</strong> ${nombreCliente}</div>
                    <div style="margin-bottom: 8px;"><strong>Dirección:</strong> ${direccionCliente}</div>
                    <div style="margin-bottom: 8px;"><strong>Estado:</strong> ${estadoCliente}</div>
                    <div><strong>Municipio:</strong> ${municipioCliente}</div>
                </div>
                
                <!-- Executive Data -->
                <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px;">
                    <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; border-bottom: 1px solid #73b248; padding-bottom: 5px;">
                        <i class="fas fa-user-tie" style="color: #73b248; margin-right: 8px;"></i>EJECUTIVO DE VENTAS
                    </h3>
                    <div style="margin-bottom: 8px;"><strong>Nombre:</strong> ${nombreEjecutivo}</div>
                    <div style="margin-bottom: 8px;"><strong>Correo:</strong> ${correoEjecutivo}</div>
                    <div style="margin-bottom: 8px;"><strong>Teléfono:</strong> 984 231 2287</div>
                    <div><strong>Empresa:</strong> HexaSolar PowerSolutions</div>
                </div>
            </div>
            
            <!-- Project Data -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; border-bottom: 1px solid #73b248; padding-bottom: 5px;">
                    <i class="fas fa-project-diagram" style="color: #73b248; margin-right: 8px;"></i>DATOS DEL PROYECTO
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div><strong>Tipo:</strong> ${tipoProyecto}</div>
                    <div><strong>Tarifa:</strong> ${tipoTarifa}</div>
                    <div><strong>Estado:</strong> ${estadoProyecto}</div>
                    <div><strong>Municipio:</strong> ${municipioProyecto}</div>
                    <div><strong>Zona CFE:</strong> ${zonaCFE}</div>
                    <div><strong>HSP:</strong> ${hsp}</div>
                </div>
                ${notaProyecto ? `<div style="margin-top: 10px;"><strong>Nota:</strong> ${notaProyecto}</div>` : ""}
                ${
                  requerimientosProyecto
                    ? `<div style="margin-top: 8px;"><strong>Requerimientos:</strong> ${requerimientosProyecto}</div>`
                    : ""
                }
            </div>
            
            <!-- Energy Consumption Analysis -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; border-bottom: 1px solid #73b248; padding-bottom: 5px;">
                    <i class="fas fa-chart-line" style="color: #73b248; margin-right: 8px;"></i>ANÁLISIS DE CONSUMO ENERGÉTICO
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px;">
                    <div><strong>Consumo Anual:</strong> ${consumoAnual}</div>
                    <div><strong>Consumo Diario:</strong> ${consumoDiario}</div>
                    <div><strong>Gasto Anual:</strong> ${importeTotal}</div>
                    <div><strong>Tarifa Promedio:</strong> ${tarifaPromedio}</div>
                    <div><strong>HSP Promedio:</strong> ${hsp}</div>
                    <div><strong>Ahorro CO₂:</strong> ${ahorroCO2}/año</div>
                </div>
            </div>
            
            <!-- Solar System Specifications -->
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; border-bottom: 1px solid #73b248; padding-bottom: 5px;">
                    <i class="fas fa-solar-panel" style="color: #73b248; margin-right: 8px;"></i>ESPECIFICACIONES DEL SISTEMA SOLAR
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                    <div>
                        <div style="margin-bottom: 8px;"><strong>Potencia Necesaria:</strong> ${potenciaNecesaria}</div>
                        <div style="margin-bottom: 8px;"><strong>Número de Módulos:</strong> ${numeroModulos} paneles</div>
                        <div style="margin-bottom: 8px;"><strong>Potencia Instalada:</strong> ${potenciaInstalada}</div>
                        <div><strong>Generación Anual:</strong> ${generacionAnual}</div>
                    </div>
                    <div>
                        <div style="margin-bottom: 8px;"><strong>Potencia por Panel:</strong> ${potenciaPanel}W</div>
                        <div style="margin-bottom: 8px;"><strong>Área Requerida:</strong> ${areaAproximada} m²</div>
                        <div style="margin-bottom: 8px;"><strong>Horas Solares Pico:</strong> ${hsp}</div>
                        <div><strong>Ubicación:</strong> ${estadoProyecto}</div>
                    </div>
                </div>
            </div>
            
            <!-- Benefits Summary -->
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #73b248; border-radius: 8px; padding: 15px; margin-bottom: 20px;">
                <h3 style="margin: 0 0 10px 0; color: #1d3246; font-size: 14px; text-align: center;">
                    <i class="fas fa-leaf" style="color: #73b248; margin-right: 8px;"></i>BENEFICIOS DEL SISTEMA
                </h3>
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 15px; text-align: center;">
                    <div>
                        <div style="font-size: 18px; font-weight: bold; color: #73b248;">${generacionAnual}</div>
                        <div style="font-size: 10px; color: #666;">Generación Anual</div>
                    </div>
                    <div>
                        <div style="font-size: 18px; font-weight: bold; color: #73b248;">${ahorroCO2}</div>
                        <div style="font-size: 10px; color: #666;">Reducción CO₂/año</div>
                    </div>
                    <div>
                        <div style="font-size: 18px; font-weight: bold; color: #73b248;">25+ años</div>
                        <div style="font-size: 10px; color: #666;">Vida útil del sistema</div>
                    </div>
                </div>
            </div>
            
            <!-- Footer -->
            <div style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #666; font-size: 10px;">
                <p style="margin: 0;">Esta cotización es válida por 30 días. Los precios pueden variar según las condiciones del sitio y disponibilidad de materiales.</p>
                <p style="margin: 5px 0 0 0;"><strong>HexaSolar PowerSolutions</strong> - Energía Solar Inteligente - www.hexasolar.com.mx</p>
            </div>
        </div>
        
        <!-- Page 2: Terms and Conditions -->
        <div style="padding: 20px;">
            <!-- Header -->
            <div style="border-bottom: 2px solid #73b248; padding-bottom: 10px; margin-bottom: 20px;">
                <h2 style="margin: 0; color: #1d3246; font-size: 18px; text-align: center;">TÉRMINOS Y CONDICIONES</h2>
                <p style="margin: 5px 0 0 0; text-align: center; color: #666; font-size: 11px;">Sistema Fotovoltaico Interconectado - HexaSolar PowerSolutions</p>
            </div>
            
            <div style="font-size: 11px; line-height: 1.5;">
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">1. ALCANCE DEL PROYECTO</h3>
                <p>• El sistema incluye módulos fotovoltaicos, inversor(es), estructura de montaje, cableado DC y AC, sistema de monitoreo y protecciones eléctricas.</p>
                <p>• La instalación incluye interconexión con CFE según normativa vigente.</p>
                <p>• Se proporcionará capacitación básica sobre el funcionamiento del sistema.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">2. GARANTÍAS</h3>
                <p>• Módulos fotovoltaicos: 25 años de garantía de potencia y 12 años de garantía de producto.</p>
                <p>• Inversor: 10-25 años según fabricante.</p>
                <p>• Estructura de montaje: 10 años contra defectos de fabricación.</p>
                <p>• Instalación: 2 años de garantía en mano de obra.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">3. CONDICIONES DE PAGO</h3>
                <p>• 50% de anticipo al firmar el contrato.</p>
                <p>• 30% al iniciar la instalación.</p>
                <p>• 20% restante contra entrega y puesta en marcha del sistema.</p>
                <p>• Opciones de financiamiento disponibles previa evaluación crediticia.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">4. TIEMPO DE ENTREGA</h3>
                <p>• El tiempo estimado de instalación es de 3-5 días hábiles una vez iniciados los trabajos.</p>
                <p>• El proceso completo desde la firma del contrato hasta la interconexión con CFE puede tomar de 4-8 semanas.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">5. RESPONSABILIDADES DEL CLIENTE</h3>
                <p>• Proporcionar acceso seguro al área de instalación.</p>
                <p>• Contar con la infraestructura eléctrica adecuada y en buen estado.</p>
                <p>• Realizar los trámites ante CFE para la interconexión (con nuestro apoyo).</p>
                <p>• Mantener el área de instalación libre de obstáculos.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">6. EXCLUSIONES</h3>
                <p>• Trabajos de reforzamiento estructural no contemplados en la cotización.</p>
                <p>• Modificaciones al sistema eléctrico existente no incluidas.</p>
                <p>• Permisos municipales adicionales que pudieran requerirse.</p>
                <p>• Daños por fenómenos naturales extraordinarios.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">7. MANTENIMIENTO</h3>
                <p>• Se recomienda limpieza de módulos cada 6 meses.</p>
                <p>• Inspección anual del sistema recomendada.</p>
                <p>• Servicios de mantenimiento disponibles bajo contrato separado.</p>
                
                <h3 style="color: #1d3246; font-size: 13px; margin: 15px 0 8px 0;">8. VALIDEZ DE LA COTIZACIÓN</h3>
                <p>• Esta cotización tiene validez de 30 días calendario.</p>
                <p>• Los precios están sujetos a cambios por variaciones en el tipo de cambio y disponibilidad de materiales.</p>
                
                <div style="margin-top: 30px; padding: 15px; background: #f8f9fa; border-radius: 8px; text-align: center;">
                    <p style="margin: 0; font-weight: bold; color: #1d3246;">¿Tienes dudas? Contáctanos</p>
                    <p style="margin: 5px 0 0 0; color: #666;">
                        Tel: 984 231 2287 | Email: info@hexasolar.com.mx | Web: www.hexasolar.com.mx
                    </p>
                    <p style="margin: 5px 0 0 0; color: #666; font-size: 10px;">
                        Cancún | Playa del Carmen | Tulum - Riviera Maya, Quintana Roo
                    </p>
                </div>
            </div>
        </div>
    `

  // Generate PDF
  const opt = {
    margin: [10, 10, 10, 10],
    filename: `Cotizacion_SFVI_${nombreCliente.replace(/ /g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      allowTaint: true,
    },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait",
      compress: true,
    },
  }

  document.getElementById("loading").style.display = "flex"
  document.querySelector(".loading-text").textContent = "Generando Cotización"
  document.querySelector(".loading-subtext").textContent = "Creando documento profesional..."

  setTimeout(() => {
    window
      .html2pdf()
      .set(opt)
      .from(quotationContent)
      .save()
      .then(() => {
        document.getElementById("loading").style.display = "none"
        console.log("[v0] Professional quotation generated successfully")
      })
      .catch((err) => {
        console.error("Error generating quotation PDF:", err)
        document.getElementById("loading").style.display = "none"
        alert("Error al generar la cotización. Por favor intente nuevamente.")
      })
  }, 1000)
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", () => {
  loadCSVData() // Load CSV data and initialize states
  generarInputsConsumo() // Initialize new consumption inputs
  generarInputsPago()

  // Update payment inputs when periods change
  document.getElementById("tipoPeriodo").addEventListener("change", () => {
    generarInputsConsumo()
    generarInputsPago()
  })

  const tipoProyectoSelect = document.getElementById("tipoProyecto")
  const tipoTarifaSelect = document.getElementById("tipoTarifa")

  function actualizarTarifas() {
    const tipo = tipoProyectoSelect.value
    tipoTarifaSelect.innerHTML = '<option value="">Selecciona una tarifa</option>'
    if (tarifasPorProyecto[tipo]) {
      tarifasPorProyecto[tipo].forEach((t) => {
        const option = document.createElement("option")
        option.value = t.value // <- string/id
        option.textContent = t.text // <- texto visible
        tipoTarifaSelect.appendChild(option)
      })
    }
  }

  tipoProyectoSelect.addEventListener("change", actualizarTarifas)
  actualizarTarifas()
})

function actualizarTotales() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

  let totalConsumo = 0
  let totalImporte = 0

  for (let i = 0; i < numPeriodos; i++) {
    const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0
    const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0

    totalConsumo += consumo
    totalImporte += importe
  }

  const consumoMensual = tipoPeriodo === "mensual" ? totalConsumo / 12 : totalConsumo / 6
  const tarifaPromedio = totalConsumo > 0 ? totalImporte / totalConsumo : 0

  document.getElementById("consumoAnual").textContent = `${totalConsumo.toFixed(0)} kWh`
  document.getElementById("consumoMensual").textContent = `${consumoMensual.toFixed(0)} kWh`
  document.getElementById("tarifaPromedio").textContent = `$${tarifaPromedio.toFixed(3)}`
  document.getElementById("importeTotal").textContent = `$${totalImporte.toFixed(2)}`
}
