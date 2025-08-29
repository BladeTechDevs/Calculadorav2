  // Hacer scroll al inicio del formulario para evitar que el header lo cubra en mobile
  const formulario = document.querySelector("form");
  if (formulario) {
    formulario.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  // Ocultar el botón de cotización móvil en mobile antes de mostrarlo
  const btnCotMobile = document.getElementById("btnCotizarMobile");
  if (btnCotMobile) {
    btnCotMobile.classList.remove("show");
    btnCotMobile.disabled = true;
    btnCotMobile.setAttribute("hidden", "true");
  }
// Asegura que calcularSistemaSolar esté disponible globalmente
window.calcularSistemaSolar = calcularSistemaSolar;
document
  .getElementById("estadoProyecto")
  .addEventListener("change", actualizarHSP);

// Variables globales
let hspData = {};
let csvData = [];
const meses = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
];
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
];
// Formateo internacional en inputs de Cotización P.U.
const cotizacionInputs = [
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
  "total",
];

function formatNumberIntl(value) {
  if (value === "" || isNaN(value)) return "";
  const num = parseFloat(value.replace(/,/g, ""));
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

cotizacionInputs.forEach((id) => {
  const input = document.getElementById(id);
  if (input) {
    // Solo limpiar y formatear al perder el foco
    input.addEventListener("blur", function (e) {
      if (input.value !== "") {
        let raw = input.value.replace(/,/g, "");
        if (!isNaN(raw) && /^\d+(\.\d+)?$/.test(raw)) {
          input.value = formatNumberIntl(raw);
        } else {
          input.value = input.value;
        }
      }
    });
  }
});

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
};

function actualizarTarifasPorProyecto() {
  const tipoProyecto = document.getElementById("tipoProyecto").value;
  const tarifaSelect = document.getElementById("tipoTarifa");
  tarifaSelect.innerHTML = '<option value="">Selecciona una tarifa</option>';
  if (tarifasPorProyecto[tipoProyecto]) {
    tarifasPorProyecto[tipoProyecto].forEach((t) => {
      const option = document.createElement("option");
      option.value = t.value;
      option.textContent = t.text;
      tarifaSelect.appendChild(option);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tipoProyectoSelect = document.getElementById("tipoProyecto");
  if (tipoProyectoSelect) {
    tipoProyectoSelect.addEventListener("change", actualizarTarifasPorProyecto);
    actualizarTarifasPorProyecto(); // Inicializa al cargar
  }
});

// Generar tabla de consumo dinámica
function generarTablaConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value;
  const tablaBody = document.getElementById("tablaConsumoBody");
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const bimestres = ["Bim 1", "Bim 2", "Bim 3", "Bim 4", "Bim 5", "Bim 6"];
  tablaBody.innerHTML = "";
  const totalTarifa = 0;
  const totalConsumo = 0;
  const totalImporte = 0;
  const count = 0;
  const periodos = tipoPeriodo === "mensual" ? meses : bimestres;

  for (let i = 0; i < periodos.length; i++) {
    tablaBody.innerHTML += `
            <tr>
                <td style='padding:6px;'>${periodos[i]}</td>
                <td style='padding:6px;'><input type='number' id='tarifa${i}' style='width:80px;'></td>
                <td style='padding:6px;'><input type='number' id='consumo${i}' style='width:80px;'></td>
                <td style='padding:6px;'><input type='number' id='importe${i}' style='width:80px;'></td>
            </tr>`;
  }

  // Actualizar totales al cambiar inputs
  tablaBody.querySelectorAll("input").forEach((input) => {
    input.addEventListener("input", actualizarTotalesConsumo);
  });
  actualizarTotalesConsumo();
}

function actualizarTotalesConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value;
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6;

  let totalConsumo = 0;
  let totalImporte = 0;
  let totalTarifas = 0;
  let contadorTarifas = 0;

  for (let i = 0; i < numPeriodos; i++) {
    const consumo =
      Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0;
    const importe =
      Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0;
    const tarifa =
      Number.parseFloat(document.getElementById(`tarifa${i}`)?.value) || 0;

    totalConsumo += consumo;
    totalImporte += importe;

    if (tarifa > 0) {
      totalTarifas += tarifa;
      contadorTarifas++;
    }
  }

  const tarifaPromedio =
    contadorTarifas > 0 ? totalTarifas / contadorTarifas : 0;

  // Update display elements
  // document.getElementById("totalConsumoDisplay").textContent = `${totalConsumo.toFixed(0)} kWh`
  // document.getElementById("totalImporteDisplay").textContent = `$${totalImporte.toFixed(2)}`
  // document.getElementById("tarifaPromedioDisplay").textContent = `$${tarifaPromedio.toFixed(3)}`

  // Update summary fields
  // const consumoMensual = tipoPeriodo === "mensual" ? totalConsumo / 12 : totalConsumo / 6
  // document.getElementById("kwhMesResumen").value = `${consumoMensual.toFixed(0)} kWh`
  // document.getElementById("tarifaPromResumen").value = `$${tarifaPromedio.toFixed(3)}`
}

// Function to load and parse CSV data
async function loadCSVData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hsp_Hoja1-kr8ml1Lz0SvIbQmWD96PSGcSC2lQAt.csv"
    );
    const csvText = await response.text();
    console.log(csvText);
    // Parse CSV
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");

    csvData = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",");
        const rowData = {};

        headers.forEach((header, index) => {
          rowData[header.trim()] = values[index] ? values[index].trim() : "";
        });

        if (rowData.Estado) {
          csvData.push(rowData);
          // Store average HSP value for quick access
          hspData[rowData.Estado] = Number.parseFloat(rowData.Promedio) || 0;
        }
      }
    }
    console.log("CSV data loaded successfully:", csvData);

    inicializarEstados();
  } catch (error) {
    console.error("Error loading CSV data:", error);
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
    };
    inicializarEstados();
  }
}

function inicializarEstados() {
  const estadoSelect = document.getElementById("estadoProyecto");
  estadoSelect.innerHTML = '<option value="">Seleccionar estado</option>';

  Object.keys(hspData)
    .sort()
    .forEach((estado) => {
      const option = document.createElement("option");
      option.value = estado;
      option.textContent = estado;
      estadoSelect.appendChild(option);
    });
}

function actualizarHSP() {
  const estadoSeleccionado = document.getElementById("estadoProyecto").value;

  if (estadoSeleccionado && hspData[estadoSeleccionado]) {
    // Store HSP value for calculations
    window.hspValue = hspData[estadoSeleccionado];
    console.log("[v0] HSP for state:", window.hspValue);

    // Guardar en localStorage
    localStorage.setItem("estadoProyecto", estadoSeleccionado);
    localStorage.setItem("hspValue", window.hspValue);

    // Find detailed data for the selected state
    const estadoData = csvData.find((row) => row.Estado === estadoSeleccionado);
    console.log("[v0] Estado seleccionado:", estadoSeleccionado);

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
      });

      if (typeof mostrarDatosIrradiacion === "function") {
        mostrarDatosIrradiacion(estadoData);
      }
      console.log("[v0] Estado data:", estadoData);
    }
  }
}

function mostrarDatosIrradiacion(estadoData) {
  if (!estadoData) return;

  // 1) Asegurar contenedor (oculto)
  let irradiacionDiv = document.getElementById("irradiacionData");
  if (!irradiacionDiv) {
    irradiacionDiv = document.createElement("div");
    irradiacionDiv.id = "irradiacionData";
    irradiacionDiv.className = "form-section";
    // Mantenerlo invisible
    irradiacionDiv.style.display = "none";

    // Insertar después de la sección que contiene #estadoProyecto
    const proyectoSection = document
      .querySelector("#estadoProyecto")
      ?.closest(".form-section");
    if (proyectoSection && proyectoSection.parentNode) {
      proyectoSection.parentNode.insertBefore(
        irradiacionDiv,
        proyectoSection.nextSibling
      );
    } else {
      // fallback: colgarlo del body si no encontramos la sección
      document.body.appendChild(irradiacionDiv);
    }
  }

  // 2) Mapeo de meses: keys del CSV -> ids esperados por recopilarDatosdeIrradiacionAnual()
  const mapa = [
    ["Enero", "irradiacionEnero"],
    ["Febrero", "irradiacionFebrero"],
    ["Marzo", "irradiacionMarzo"],
    ["Abril", "irradiacionAbril"],
    ["Mayo", "irradiacionMayo"],
    ["Junio", "irradiacionJunio"],
    ["Julio", "irradiacionJulio"],
    ["Agosto", "irradiacionAgosto"],
    ["Septiembre", "irradiacionSeptiembre"],
    ["Octubre", "irradiacionOctubre"],
    ["Noviembre", "irradiacionNoviembre"],
    ["Diciembre", "irradiacionDiciembre"],
  ];

  // 3) Crear/actualizar inputs hidden con los valores numéricos
  const toNum = (v) => {
    const n = Number.parseFloat(String(v).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };

  // Construir objeto para localStorage
  const irrObj = {};

  mapa.forEach(([keyMes, idInput]) => {
    const val = toNum(estadoData[keyMes]);

    // si no existe el input, créalo; si existe, solo actualiza value
    let input = document.getElementById(idInput);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.id = idInput;
      input.name = idInput;
      irradiacionDiv.appendChild(input);
    }
    input.value = val;

    // llenar objeto para persistir
    const nombreProp = idInput.replace("irradiacion", "").toLowerCase(); // ej. 'Enero' -> 'enero'
    irrObj[nombreProp] = val;
  });

  // 4) (Opcional) también guardamos mínima, máxima y promedio como hidden (no los lees en recopilar*, pero pueden servir)
  const extras = [
    ["Minima", "irradiacionMinima"],
    ["Maxima", "irradiacionMaxima"],
    ["Promedio", "irradiacionPromedio"],
  ];
  extras.forEach(([key, id]) => {
    const val = toNum(estadoData[key]);
    let input = document.getElementById(id);
    if (!input) {
      input = document.createElement("input");
      input.type = "hidden";
      input.id = id;
      input.name = id;
      irradiacionDiv.appendChild(input);
    }
    input.value = val;
  });

  // 5) Persistir en localStorage (útil para otros módulos)
  try {
    localStorage.setItem("irradiacionAnualInputs", JSON.stringify(irrObj));
  } catch (e) {
    console.warn("No se pudo persistir irradiacionAnualInputs:", e);
  }

  console.log("[HSP] Inputs ocultos de irradiación actualizados:", irrObj);
}

function generarInputsConsumo() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value;
  const container = document.getElementById("consumoInputsGrid");

  // Tus valores fijos de prueba
  const consumosDemo = [690, 631, 422, 970, 1011, 752];
  const importesDemo = [1695, 1685, 489, 2798, 2998, 2269];

  // Según tipoPeriodo decides si usar 12 o 6 periodos
  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6;
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
      : [
          "Bimestre 1",
          "Bimestre 2",
          "Bimestre 3",
          "Bimestre 4",
          "Bimestre 5",
          "Bimestre 6",
        ];

  container.innerHTML = "";

  for (let i = 0; i < numPeriodos; i++) {
    // Si hay datos en el arreglo, los usamos; si no, dejamos vacío
    const consumoDemo = consumosDemo[i] ?? "";
    const importeDemo = importesDemo[i] ?? "";

    const periodoCard = document.createElement("div");
    periodoCard.style.cssText = `
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 0.75rem;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;

    periodoCard.innerHTML = `
      <div style="font-weight: 600; color: #1e40af; margin-bottom: 0.5rem; text-align: center; font-size: 0.85rem;">
        ${periodos[i]}
      </div>
      <div style="display: flex; flex-direction: column; gap: 0.4rem;">
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Consumo (kWh)</label>
          <input type="number" id="consumo${i}" placeholder="0" value="${consumoDemo}"
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="window.calcularTarifaAutomatica(${i})">
        </div>
        <div>
          <label style="display: block; font-size: 0.7rem; color: #64748b; margin-bottom: 0.2rem;">Importe ($)</label>
          <input type="number" id="importe${i}" placeholder="0" value="${importeDemo}"
                 style="width: 100%; padding: 0.4rem; border: 1px solid #cbd5e1; border-radius: 4px; font-size: 0.8rem;"
                 oninput="window.actualizarTotalesConsumo()">
        </div>
      </div>
    `;

    container.appendChild(periodoCard);
  }

  // Inicializar totales
  window.actualizarTotalesConsumo();
}

function calcularTarifaAutomatica(index) {
  const consumo =
    Number.parseFloat(document.getElementById(`consumo${index}`)?.value) || 0;
  const importe =
    Number.parseFloat(document.getElementById(`importe${index}`)?.value) || 0;
  const tarifaInput = document.getElementById(`tarifa${index}`);
  if (!tarifaInput) {
    window.actualizarTotalesConsumo?.();
    return;
  } // ← si no existe, sal con gracia
  tarifaInput.value =
    consumo > 0 && importe > 0 ? (importe / consumo).toFixed(3) : "";
  window.actualizarTotalesConsumo?.();
}

function generarInputsPago() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value;
  const container =
    document.getElementById("pagoInputs") || document.getElementById("pagoRow");
  if (!container) return; // ← evita crashear si no existe
  const numCampos = tipoPeriodo === "mensual" ? 12 : 6;

  container.innerHTML = "";
  for (let i = 0; i < numCampos; i++) {
    const pagoInput = document.createElement("input");
    pagoInput.type = "number";
    pagoInput.className = "consumo-input";
    pagoInput.placeholder =
      tipoPeriodo === "mensual" ? `${meses[i]} ($)` : `Bim ${i + 1} ($)`;
    pagoInput.id = `pago${i}`;
    pagoInput.step = "0.01";
    container.appendChild(pagoInput);
  }
}

function showToast(message, type = "info") {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;

  // Colores según tipo
  if (type === "error") toast.style.background = "#dc2626"; // rojo
  if (type === "success") toast.style.background = "#16a34a"; // verde
  if (type === "warning") toast.style.background = "#67AA47"; // amarillo

  container.appendChild(toast);

  // Quitar después de animación
  setTimeout(() => {
    toast.remove();
  }, 4000); // 4 segundos
}

const consumos = [];
const importes = [];
const kwintsladaConEficiancia = 0;
const generacionAnualAprox = 0;
function calcularSistemaSolar() {
  // Desactivar el botón
  document.getElementById("btnCalcular").disabled = true;
  /*
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
    // Correo
    if (!correo) {
      showToast("Falta llenar el correo del ejecutivo.", "warning")
      return false
    }
    // Folio
    if (!folio) {
      showToast("Falta llenar el folio de cotización.", "warning")
      return false
    }

    return true
  }

  if (!validarEjecutivo()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarProyecto() {
    // Antes de validar, poner 0 en los inputs de Cotización P.U. si están vacíos (excepto profit)
    const cotizacionIds = [
      "panel", "inversor", "mantenimiento", "estructura", "materiales",
      "instalacion", "carpeta", "flete", "interconexion", "uve", "uie", "medidor", "total"
    ];
    cotizacionIds.forEach(id => {
      const input = document.getElementById(id);
      if (input && (input.value === null || input.value === "")) {
        input.value = 0;
      }
    });
    // ...existing code...
    const tipo = document.getElementById("tipoProyecto")?.value
    const tarifa = document.getElementById("tipoTarifa")?.value
    const estado = document.getElementById("estadoProyecto")?.value
    const municipio = document.getElementById("municipioProyecto")?.value.trim()
    const potencia = document.getElementById("potenciaPanel")?.value
    const profit = document.getElementById("profit")?.value

    if (!tipo) {
      showToast("Selecciona el tipo de proyecto.", "warning")
      return false
    }
    if (!tarifa) {
      showToast("Selecciona el tipo de tarifa.", "warning")
      return false
    }
    if (!estado) {
      showToast("Selecciona el estado del proyecto.", "warning")
      return false
    }
    if (!municipio) {
      showToast("Falta llenar el municipio del proyecto.", "warning")
      return false
    }
    if (!potencia || Number.parseFloat(potencia) <= 0) {
      showToast("Ingresa la potencia del panel.", "warning")
      return false
    }
    const areaAprox = document.getElementById("areaAprox")?.value
    if (!areaAprox || Number.parseFloat(areaAprox) <= 0) {
      showToast("Ingresa el área aproximada.", "warning")
      return false
    }
    if (!profit || Number.parseFloat(profit) <= 0) {
      showToast("Ingresa el profit (%).", "warning")
      return false
    }

    return true
  }

  if (!validarProyecto()) {
    document.getElementById("btnCalcular").disabled = false
    return
  }

  function validarConsumo() {
    const tipoPeriodo = document.getElementById("tipoPeriodo")?.value || "bimestral"
    const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6

    let tieneConsumos = false
    let tieneImportes = false

    for (let i = 0; i < numPeriodos; i++) {
      const consumo = Number.parseFloat(document.getElementById(`consumo${i}`)?.value) || 0
      const importe = Number.parseFloat(document.getElementById(`importe${i}`)?.value) || 0

      if (consumo > 0) tieneConsumos = true
      if (importe > 0) tieneImportes = true
    }

    if (!tieneConsumos) {
      showToast("Ingresa al menos un valor de consumo.", "warning")
      return false
    }
    if (!tieneImportes) {
      showToast("Ingresa al menos un valor de importe.", "warning")
      return false
    }

    return true
  }

  if (!validarConsumo()) {
    document.getElementById("btnCalcular").disabled = false
    return
  } 
  */
  try {
    const datos = window.dataManager.guardarEnLocalStorage();
    const resultados = datos.resultados;

    // Mostrar resultados en la interfaz
    document.getElementById("resultsPlaceholder").style.display = "none";
    document.getElementById("resultsContent").style.display = "block";

    document.getElementById(
      "consumoAnual"
    ).textContent = `${resultados.consumoAnual.toFixed(0)} kWh`;
    document.getElementById(
      "consumoMensual"
    ).textContent = `${resultados.consumoMensual.toFixed(0)} kWh`;
    document.getElementById(
      "consumoDiario"
    ).textContent = `${resultados.consumoDiario.toFixed(1)} kWh`;
    document.getElementById(
      "importeTotal"
    ).textContent = `$${resultados.importeTotalAnual.toFixed(2)}`;
    document.getElementById(
      "importePromedio"
    ).textContent = `$${resultados.importePromedio.toFixed(2)}`;
    document.getElementById(
      "tarifaPromedio"
    ).textContent = `$${resultados.tarifaPromedio.toFixed(3)}`;
    document.getElementById(
      "potenciaNecesaria"
    ).textContent = `${resultados.potenciaNecesaria.toFixed(2)} kW`;
    document.getElementById(
      "numeroModulos"
    ).textContent = `${resultados.numeroModulos}`;
    document.getElementById(
      "potenciaInstalada"
    ).textContent = `${resultados.potenciaInstalada.toFixed(2)} kW`;
    document.getElementById(
      "hsp"
    ).textContent = `${resultados.hspPromedio.toFixed(2)} h`;
    document.getElementById(
      "ahorroCO2"
    ).textContent = `${resultados.ahorroCO2.toFixed(3)} t`;
    document.getElementById(
      "arboles"
    ).textContent = `${resultados.arboles.toFixed(0)} árboles`;
    document.getElementById(
      "porcentajeAhorro"
    ).textContent = `${resultados.porcentajeAhorro.toFixed(1)}%`;
    document.getElementById(
      "generacionAnual"
    ).textContent = `${resultados.generacionAnual.toFixed(2)} KWh`;
    document.getElementById(
      "porcentajeGeneracion"
    ).textContent = `${resultados.porcentajeGeneracion.toFixed(2)}%`;
    document.getElementById(
      "roi"
    ).textContent = `${datos.resultados.roi} años`;

    // Llenar tabla detallada y crear gráficas
    window.llenarTablaDetallada(
      datos.consumo.consumos,
      datos.consumo.importes,
      datos.consumo.tarifas,
      datos.consumo.tipoPeriodo
    );
    console.log("Datos para tabla detallada:", datos);
    window.crearGraficaIrradiacion(datos.proyecto.estadoProyecto);

    let kwintsladaConEficianciaa =
      datos.resultados.kwintsladaConEficiancia2 || 0;

    //generar grafiaca de impacto
    //si datos.consumo.consumos tiene 6 valores intercalale 0 entre cada valor para que tenga 12 valores
    let consumosMensuales = datos.consumo.consumos || [];
    if (consumosMensuales.length === 6) {
      const nuevoArreglo = [];
      for (let i = 0; i < consumosMensuales.length; i++) {
        nuevoArreglo.push(consumosMensuales[i]); // valor bimestral
        nuevoArreglo.push(0); // mes vacío
      }
      consumosMensuales = nuevoArreglo;
    }
    let produccion = [];
    // Utilidad: cuántos días tiene un mes
    function diasEnMes(mes, anio) {
      // mes: 0 = enero, 11 = diciembre
      return new Date(anio, mes + 1, 0).getDate();
    }

    // En tu cálculo de produccionMensual:
    // 1) Define el orden de los meses en español (en minúsculas porque tu objeto viene así)
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
    const irradiacionMensualArray = mesesOrdenados.map(
      (m) => datos.irradiacionAnual[m] || 0
    );
    console.log("irradiacionMensualArray", irradiacionMensualArray);
    const anioActual = new Date().getFullYear();
    for (let i = 0; i < 12; i++) {
      const dias = diasEnMes(i, anioActual);
      produccion[i] =
        irradiacionMensualArray[i] *
        kwintsladaConEficianciaa  *
        dias;
    }
   promedioProduccion = produccion.reduce((a, b) => a + b, 0) / 12;
    
   
   localStorage.setItem("promedioProduccion", promedioProduccion);
    console.log("mensuales", datos.consumo.consumos, produccion);
    window.setupImpactoResponsive(mesesDisplay, consumosMensuales, produccion);
    // Mostrar botón de cotización móvil
    const btnCot = document.getElementById("btnCotizarMobile");
    if (btnCot) {
      btnCot.classList.add("show");
      btnCot.disabled = false;
      btnCot.removeAttribute("hidden");
      btnCot.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    showToast("Cálculo completado exitosamente.", "success");
  } catch (error) {
    console.error("Error en el cálculo:", error);
    showToast("Error en el cálculo: " + error.message, "error");
    document.getElementById("btnCalcular").disabled = false;
  }
}

function nuevoCalculo() {
  // Usar DataManager para limpiar datos
  window.dataManager.limpiarDatos();

  // Reactivar botón calcular
  const btnCalc = document.getElementById("btnCalcular");
  if (btnCalc) btnCalc.disabled = false;

  // Ocultar el botón de cotización móvil en mobile
  const btnCot = document.getElementById("btnCotizarMobile");
  if (btnCot) {
    btnCot.classList.remove("show");
    btnCot.disabled = true;
    btnCot.setAttribute("hidden", "true");
  }

  // Limpiar resultados en pantalla
  const results = document.getElementById("resultsContent");
  const placeholder = document.getElementById("resultsPlaceholder");
  if (results) results.style.display = "none";
  if (placeholder) placeholder.style.display = "flex";

  // Limpiar todos los inputs
  document.querySelectorAll("input").forEach((i) => {
    i.value = "";
  });
  // Limpiar todos los selects
  document.querySelectorAll("select").forEach((s) => {
    s.selectedIndex = 0;
  });

  console.log("Nuevo cálculo iniciado - datos limpiados");
}

function llenarTablaDetallada(consumos, importes, tarifas, tipoPeriodo) {
  const tbody = document.getElementById("detalleTableBody");
  tbody.innerHTML = "";

  const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6;

  for (let i = 0; i < numPeriodos; i++) {
    const row = document.createElement("div");
    row.className = "table-row";

    const periodo = tipoPeriodo === "mensual" ? meses[i] : `Bimestre ${i + 1}`;
    const consumo = consumos[i] || 0;
    const importe = importes[i] || 0;
    const tarifa = tarifas[i] || 0;

    row.innerHTML = `
            <div class="table-cell">${periodo}</div>
            <div class="table-cell">${consumo.toFixed(0)} kWh</div>
            <div class="table-cell">$${importe.toFixed(2)}</div>
            <div class="table-cell">$${tarifa.toFixed(3)}</div>
        `;

    tbody.appendChild(row);
  }
  // Implementación de llenarTablaDetallada
  console.log(
    "llenarTablaDetallada llamada con:",
    consumos,
    importes,
    tarifas,
    tipoPeriodo
  );
}

function crearGraficaIrradiacion(estadoProyecto) {
  try {
    console.log("crearGraficaIrradiacion llamada con:", estadoProyecto);
    if (!estadoProyecto) return;

    // 1) Buscar fila del estado en csvData
    const estadoData = csvData.find((row) => row.Estado === estadoProyecto);
    if (!estadoData) {
      console.log("[v0] No data found for state:", estadoProyecto);
      return;
    }

    // 2) Extraer meses en orden
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
    ];
    const mesesDisplay = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    const irradiacionData = mesesCSV.map((m) => {
      const v = Number.parseFloat(estadoData[m]);
      return Number.isFinite(v) ? v : 0;
    });

    // 3) Promedio (usa columna si existe; si no, calcula)
    let promedio = Number.parseFloat(estadoData.Promedio);
    if (!Number.isFinite(promedio)) {
      const nums = irradiacionData.filter((v) => Number.isFinite(v));
      promedio = nums.length
        ? nums.reduce((a, b) => a + b, 0) / nums.length
        : 0;
    }

    // ➕ Extender datos y etiquetas para incluir la barra de Promedio al final
    const etiquetasX = [...mesesDisplay, "Prom"];
    const dataConProm = [...irradiacionData, promedio];

    // 4) Guardar en localStorage
    localStorage.setItem(
      "irradiacionAnual",
      JSON.stringify({
        estado: estadoProyecto,
        irradiacion: irradiacionData,
        promedio,
      })
    );

    // 5) Dibujar en canvas
    const canvas = document.getElementById("irradiacionChart");
    if (!canvas) {
      console.warn("[HSP] No existe canvas #irradiacionChart en el DOM");
      return;
    }
    const ctx = canvas.getContext("2d");

    // Limpiar
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dimensiones y padding
    const padding = 60;
    const W = canvas.width;
    const H = canvas.height;
    const chartW = W - padding * 2;
    const chartH = H - padding * 2;

    // Escala Y (considera también el promedio)
    const maxVal = Math.max(...dataConProm, 0);
    const niceMax = (function niceCeil(x) {
      if (x <= 0) return 1;
      const exp = Math.floor(Math.log10(x));
      const base = Math.pow(10, exp);
      const m = x / base;
      let nice;
      if (m <= 1) nice = 1;
      else if (m <= 2) nice = 2;
      else if (m <= 5) nice = 5;
      else nice = 10;
      return nice * base;
    })(maxVal);
    const yMax = niceMax || 1;

    // Ejes
    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, H - padding);
    ctx.lineTo(W - padding, H - padding);
    ctx.stroke();

    // Grid y ticks Y
    ctx.strokeStyle = "#e0e0e0";
    ctx.lineWidth = 1;
    ctx.fillStyle = "#666";
    ctx.font = "12px Arial";
    const ticks = 5;
    for (let i = 0; i <= ticks; i++) {
      const y = padding + (chartH * i) / ticks;
      const val = yMax - (yMax * i) / ticks;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(W - padding, y);
      ctx.stroke();
      ctx.fillText(val.toFixed(1), Math.max(10, padding * 0.35), y + 4);
    }

    // Etiquetas X (12 meses + Prom)
    ctx.fillStyle = "#666";
    ctx.textAlign = "center";
    const N = dataConProm.length; // 13
    for (let i = 0; i < N; i++) {
      const x = padding + (chartW * (i + 0.5)) / N;
      ctx.fillText(etiquetasX[i], x, H - padding + 16);
    }

    // Barras (última = promedio, con estilo distinto)
    const groupW = chartW / Math.max(1, N);
    const barW = Math.min(32, groupW * 0.7);

    for (let i = 0; i < N; i++) {
      const val = dataConProm[i];
      const barH = (val / yMax) * chartH;
      const x = padding + groupW * i + (groupW - barW) / 2;
      const y = H - padding - barH;

      const isProm = i === N - 1;

      if (isProm) {
        // Promedio en azul/índigo
        const gradProm = ctx.createLinearGradient(0, y, 0, y + barH);
        gradProm.addColorStop(0, "#4f46e5");
        gradProm.addColorStop(1, "#1d4ed8");
        ctx.fillStyle = gradProm;
        ctx.strokeStyle = "#1d4ed8";
      } else {
        const grad = ctx.createLinearGradient(0, y, 0, y + barH);
        grad.addColorStop(0, "#73b248");
        grad.addColorStop(1, "#106e3a");
        ctx.fillStyle = grad;
        ctx.strokeStyle = "#106e3a";
      }

      ctx.lineWidth = 1;
      ctx.fillRect(x, y, barW, barH);
      ctx.strokeRect(x, y, barW, barH);

      // valor arriba de cada barra (si hay espacio)
      if (chartH > 140) {
        ctx.fillStyle = "#333";
        ctx.font = "11px Arial";
        ctx.fillText(val.toFixed(1), x + barW / 2, y - 6);
      }
    }

    // Línea de promedio (referencia)
    const yProm = H - padding - (promedio / yMax) * chartH;
    ctx.save();
    ctx.strokeStyle = "rgba(29,78,216,0.9)"; // azul
    ctx.setLineDash([6, 6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padding, yProm);
    ctx.lineTo(W - padding, yProm);
    ctx.stroke();
    ctx.restore();

    // Títulos
    ctx.fillStyle = "#333";
    ctx.textAlign = "center";
    ctx.font = "bold 16px Arial";
    ctx.fillText(`Irradiación Solar - ${estadoProyecto}`, W / 2, 22);
    ctx.font = "12px Arial";
    ctx.fillText("(kWh/m²/día)", W / 2, 40);
    ctx.fillText(
      `Promedio anual: ${promedio.toFixed(2)} kWh/m²/día`,
      W / 2,
      H - 6
    );

    console.log(
      "[HSP] Datos mensuales:",
      irradiacionData,
      "Promedio:",
      promedio
    );

    if (typeof window.mostrarDatosIrradiacion === "function") {
      window.mostrarDatosIrradiacion(estadoData);
    }
  } catch (err) {
    console.error("Error en crearGraficaIrradiacion:", err);
  }
}

function crearGraficaIrradiacion2(estado) {
  const canvas = document.getElementById("irradiacionChart");
  const ctx = canvas.getContext("2d");

  // Find state data in CSV
  const estadoData = csvData.find((row) => row.Estado === estado);
  if (!estadoData) {
    console.log("[v0] No data found for state:", estado);
    return;
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
  ];
  const mesesDisplay = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];

  // Extract monthly irradiation data (kWh/m²/día)
  const irradiacionData = [];
  mesesCSV.forEach((mes) => {
    const valor = Number.parseFloat(estadoData[mes]) || 0;
    irradiacionData.push(valor);
  });

  // Guardar en localStorage
  localStorage.setItem(
    "irradiacionAnual",
    JSON.stringify({ irradiacion: irradiacionData })
  );

  // === Promedio (usa columna Promedio si existe; si no, lo calculamos) ===
  const promedioCalc = (() => {
    const p = Number.parseFloat(estadoData.Promedio);
    if (Number.isFinite(p)) return p;
    const nums = irradiacionData.filter((v) => Number.isFinite(v));
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  })();

  // Extender etiquetas y datos con el “Promedio” al final
  const etiquetasX = [...mesesDisplay, "Prom"];
  const dataConProm = [...irradiacionData, promedioCalc];

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Chart dimensions
  const padding = 60;
  const chartWidth = canvas.width - 2 * padding;
  const chartHeight = canvas.height - 2 * padding;

  // Escalado (considera también el promedio)
  const maxValue = Math.max(...dataConProm);
  const valueRange = maxValue > 0 ? maxValue : 1;

  // Draw axes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, canvas.height - padding);
  ctx.lineTo(canvas.width - padding, canvas.height - padding);
  ctx.stroke();

  // Grid y labels Y
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#666";
  ctx.font = "12px Arial";

  for (let i = 0; i <= 5; i++) {
    const y = padding + (chartHeight * i) / 5;
    const value = maxValue - (valueRange * i) / 5;

    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(canvas.width - padding, y);
    ctx.stroke();

    ctx.fillText(value.toFixed(1), 10, y + 4);
  }

  // Labels X (12 meses + Prom)
  const N = dataConProm.length; // 13
  for (let i = 0; i < N; i++) {
    const x = padding + (chartWidth * (i + 0.5)) / N;
    ctx.fillText(etiquetasX[i], x - 15, canvas.height - 20);
  }

  // Barras
  const barWidth = (chartWidth / N) * 0.8; // 80%
  const barSpacing = (chartWidth / N) * 0.2; // 20%

  for (let i = 0; i < N; i++) {
    const x = padding + (chartWidth * i) / N + barSpacing / 2;
    const hVal = dataConProm[i];
    const barHeight = (hVal / valueRange) * chartHeight;
    const y = canvas.height - padding - barHeight;

    // Promedio con estilo distinto
    const isProm = i === N - 1;

    if (isProm) {
      // color distinto para la barra de Promedio
      const gradProm = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradProm.addColorStop(0, "#4f46e5"); // indigo-600
      gradProm.addColorStop(1, "#1d4ed8"); // blue-700
      ctx.fillStyle = gradProm;
    } else {
      const gradient = ctx.createLinearGradient(0, y, 0, y + barHeight);
      gradient.addColorStop(0, "#73b248");
      gradient.addColorStop(1, "#106e3a");
      ctx.fillStyle = gradient;
    }

    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.strokeStyle = isProm ? "#1d4ed8" : "#106e3a";
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, barWidth, barHeight);

    // Valor encima de la barra
    ctx.fillStyle = "#333";
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    ctx.fillText(hVal.toFixed(1), x + barWidth / 2, y - 5);
  }

  // Línea horizontal de promedio (referencia)
  const yProm =
    canvas.height - padding - (promedioCalc / valueRange) * chartHeight;
  ctx.save();
  ctx.strokeStyle = "rgba(79,70,229,0.9)"; // indigo
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 6]);
  ctx.beginPath();
  ctx.moveTo(padding, yProm);
  ctx.lineTo(canvas.width - padding, yProm);
  ctx.stroke();
  ctx.restore();

  // Título
  ctx.fillStyle = "#333";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(`Irradiación Solar - ${estado}`, canvas.width / 2, 20);
  ctx.fillText("(kWh/m²/día)", canvas.width / 2, 40);

  // Pie con promedio
  ctx.font = "11px Arial";
  ctx.fillText(
    `Promedio anual: ${promedioCalc.toFixed(2)} kWh/m²/día`,
    canvas.width / 2,
    canvas.height - 2
  );

  console.log("[v0] Monthly data for", estado, ":", irradiacionData);
  console.log("[v0] Average:", promedioCalc);
  console.log("[v0] Solar irradiation bar chart created successfully");
}
document.addEventListener("DOMContentLoaded", () => {
  loadCSVData();
});

async function loadCSVData() {
  try {
    const response = await fetch(
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/hsp_Hoja1-kr8ml1Lz0SvIbQmWD96PSGcSC2lQAt.csv"
    );
    const csvText = await response.text();
    console.log(csvText);
    // Parse CSV
    const lines = csvText.split("\n");
    const headers = lines[0].split(",");

    csvData = [];

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(",");
        const rowData = {};

        headers.forEach((header, index) => {
          rowData[header.trim()] = values[index] ? values[index].trim() : "";
        });

        if (rowData.Estado) {
          csvData.push(rowData);
          // Store average HSP value for quick access
          hspData[rowData.Estado] = Number.parseFloat(rowData.Promedio) || 0;
        }
      }
    }
    console.log("CSV data loaded successfully:", csvData);

    inicializarEstados();
  } catch (error) {
    console.error("Error loading CSV data:", error);
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
    };
    inicializarEstados();
  }
}
// Etiquetas (12 meses)
const mesesDisplay = [
  "Ene",
  "Feb",
  "Mar",
  "Abr",
  "May",
  "Jun",
  "Jul",
  "Ago",
  "Sep",
  "Oct",
  "Nov",
  "Dic",
  "Promedio",
];

function setupImpactoResponsive(labels, consumoArr, produccionArr) {
  const canvas = document.getElementById("impactoChart");
  if (!canvas) return;

  // --- utilidades: promedio robusto (ignora null/undefined/NaN) ---
  const avg = (arr) => {
    const nums = (arr || [])
      .map((v) => Number(v))
      .filter((v) => Number.isFinite(v));
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  };

  // --- clonar y extender con "Promedio" ---
  const consumoAvg = avg(consumoArr);
  const produccionAvg = avg(produccionArr);

  const labelsExt = [...labels, "Promedio"];
  const consumoExt = [...consumoArr, consumoAvg];
  const produccionExt = [...produccionArr, produccionAvg];

  const redraw = () => {
    // 1) Ajuste a contenedor + DPR
    const parent = canvas.parentElement || canvas;
    const cssWidth = canvas.style.width
      ? parseInt(getComputedStyle(canvas).width)
      : parent.clientWidth || 600;

    const cssHeight = canvas.style.height
      ? parseInt(getComputedStyle(canvas).height)
      : 320;

    const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // 2) Calcula tamaños relativos
    const W = cssWidth;
    const H = cssHeight;

    const base = Math.max(12, Math.min(16, Math.floor(W / 60)));
    const pad = Math.max(40, Math.min(100, Math.floor(W * 0.08)));

    // 3) Decide si rotar labels en X (usar largo extendido)
    const L = Math.min(
      labelsExt.length,
      consumoExt.length,
      produccionExt.length
    );
    const rotateX = (W < 480 && L > 6) || (W < 360 && L > 4);

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
    });
  };

  canvas.__impactoRedraw = redraw;
  // Primera pintura
  redraw();

  // Redibujar al resize del contenedor / ventana
  if ("ResizeObserver" in window) {
    const ro = new ResizeObserver(redraw);
    ro.observe(canvas.parentElement || canvas);
  } else {
    window.addEventListener("resize", redraw);
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
  } = opts;

  // Sanitizado
  const L = Math.min(labels.length, consumoArr.length, produccionArr.length);
  const lab = labels.slice(0, L);
  const consumo = consumoArr.slice(0, L).map((v) => Number(v) || 0);
  const prod = produccionArr.slice(0, L).map((v) => Number(v) || 0);

  // Dimensiones (en CSS px, ya transformados con DPR)
  const cs = getComputedStyle(canvas);
  const W = Math.max(
    50,
    Math.floor(parseFloat(cs.width) || canvas.width || 600)
  );
  const H = Math.max(
    50,
    Math.floor(parseFloat(cs.height) || canvas.height || 320)
  );

  const padding = paddingPx;

  const chartWidth = Math.max(50, W - 2 * padding);
  const chartHeight = Math.max(50, H - 2 * padding);

  // Limpiar
  ctx.clearRect(0, 0, W, H);

  // Fuente principal
  const font = (w) => `${w}px Arial`;
  ctx.textBaseline = "middle";

  // Escala Y
  const maxData = Math.max(...consumo, ...prod, 0);
  const niceMax = niceCeil(maxData); // escalar a “bonito” (e.g. múltiplos)
  const maxValue = niceMax > 0 ? niceMax : 1;
  const ticks = 5;

  // Ejes
  ctx.strokeStyle = "#333";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(padding, padding);
  ctx.lineTo(padding, H - padding);
  ctx.lineTo(W - padding, H - padding);
  ctx.stroke();

  // Grid + etiquetas Y
  ctx.strokeStyle = "#e0e0e0";
  ctx.lineWidth = 1;
  ctx.fillStyle = "#666";
  ctx.font = font(Math.max(10, baseFontPx - 2));
  for (let i = 0; i <= ticks; i++) {
    const y = padding + (chartHeight * i) / ticks;
    const value = maxValue - (maxValue * i) / ticks;
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(W - padding, y);
    ctx.stroke();
    ctx.fillText(value.toFixed(0), Math.max(10, padding * 0.35), y);
  }

  // Labels X
  ctx.fillStyle = "#666";
  ctx.textAlign = "center";
  ctx.font = font(Math.max(10, baseFontPx - 2));
  const xAxisY = H - padding + (rotateXLabels ? 10 : 18);

  for (let i = 0; i < L; i++) {
    const xCenter = padding + (chartWidth * (i + 0.5)) / L;
    if (rotateXLabels) {
      ctx.save();
      ctx.translate(xCenter, xAxisY);
      ctx.rotate(-Math.PI / 4); // -45°
      ctx.fillText(lab[i], 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(lab[i], xCenter, H - padding + 14);
    }
  }

  // Barras (dos por grupo)
  const groupWidth = chartWidth / Math.max(1, L);
  const barWidth = Math.max(6, Math.min(24, groupWidth * 0.35)); // límites para pantallas chicas
  const gapBars = Math.min(8, groupWidth * 0.08);

  for (let i = 0; i < L; i++) {
    const xGroupStart = padding + groupWidth * i;
    const xConsumo = xGroupStart + (groupWidth - (2 * barWidth + gapBars)) / 2;
    const xProducc = xConsumo + barWidth + gapBars;

    const hC = (consumo[i] / maxValue) * chartHeight;
    const hP = (prod[i] / maxValue) * chartHeight;

    const yC = H - padding - hC;
    const yP = H - padding - hP;

    // Consumo
    const gradC = ctx.createLinearGradient(0, yC, 0, yC + hC);
    gradC.addColorStop(0, "#7a8aa0");
    gradC.addColorStop(1, "#3a4a60");
    ctx.fillStyle = gradC;
    ctx.fillRect(xConsumo, yC, barWidth, hC);
    ctx.strokeStyle = "#2f3a48";
    ctx.lineWidth = 1;
    ctx.strokeRect(xConsumo, yC, barWidth, hC);

    // Producción
    const gradP = ctx.createLinearGradient(0, yP, 0, yP + hP);
    gradP.addColorStop(0, "#73b248");
    gradP.addColorStop(1, "#106e3a");
    ctx.fillStyle = gradP;
    ctx.fillRect(xProducc, yP, barWidth, hP);
    ctx.strokeStyle = "#106e3a";
    ctx.strokeRect(xProducc, yP, barWidth, hP);

    // Valores encima (ocultarlos si hay muy poco espacio)
    if (chartHeight > 140) {
      ctx.fillStyle = "#333";
      ctx.font = font(Math.max(9, baseFontPx - 4));
      ctx.textAlign = "center";
      ctx.fillText(
        String(Math.round(consumo[i])),
        xConsumo + barWidth / 2,
        Math.max(yC - 8, padding - 8)
      );
      ctx.fillText(
        String(Math.round(prod[i])),
        xProducc + barWidth / 2,
        Math.max(yP - 8, padding - 8)
      );
    }
  }

  // Títulos
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.font = `bold ${Math.max(14, baseFontPx)}px Arial`;
  ctx.fillText(
    "Impacto de la Generación en el Consumo",
    W / 2,
    Math.max(24, padding * 0.45)
  );
  ctx.font = `${Math.max(12, baseFontPx - 2)}px Arial`;
  ctx.fillText("(kWh por mes)", W / 2, Math.max(44, padding * 0.65));

  // Leyenda compacta
  const legendTop = padding * 0.6;
  const legendLeft = Math.min(W - padding - 160, W / 2 + 120);
  const drawLegendBox = (x, y, w, h, c1, c2, stroke) => {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = stroke;
    ctx.strokeRect(x, y, w, h);
  };

  ctx.font = `${Math.max(11, baseFontPx - 1)}px Arial`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#333";
  drawLegendBox(legendLeft + 40, legendTop, 15, 12, "#7a8aa0", "#3a4a60", "#2f3a48");
  ctx.fillText("Consumo", legendLeft + 60, legendTop + 10);
  drawLegendBox(
    legendLeft + 145,
    legendTop,
    15,
    12,
    "#73b248",
    "#106e3a",
    "#106e3a"
  );
  ctx.fillText("Producción", legendLeft + 165, legendTop + 10);
}

function niceCeil(x) {
  if (x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const base = Math.pow(10, exp);
  const m = x / base;
  let nice;
  if (m <= 1) nice = 1;
  else if (m <= 2) nice = 2;
  else if (m <= 5) nice = 5;
  else nice = 10;
  return nice * base;
}

// Render inicial de inputs (bimestral por defecto) y persistencia de la elección
document.addEventListener("DOMContentLoaded", () => {
  const select = document.getElementById("tipoPeriodo");
  if (!select) return;

  // Leer último valor guardado o usar 'bimestral' por defecto
  const saved = localStorage.getItem("tipoPeriodo") || "bimestral";
  select.value = saved;

  // Pintar inputs de inicio
  generarInputsConsumo();

  // Guardar y regenerar al cambiar
  select.addEventListener("change", () => {
    localStorage.setItem("tipoPeriodo", select.value);
    generarInputsConsumo();
  });
});

// Borra todo el localStorage cada vez que se recarga la página
window.addEventListener("load", () => {
  localStorage.clear();
  console.log("LocalStorage limpiado al recargar la página");
});


