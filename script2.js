// Variables globales
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

// Funciones globales (fuera del DOMContentLoaded para que sean accesibles desde HTML)
function updateConsumoFields() {
  const tipoPeriodo = document.getElementById("tipoPeriodo").value;
  const container = document.getElementById("consumoInputs");
  const numCampos = tipoPeriodo === "mensual" ? 12 : 6;

  container.innerHTML = "";

  for (let i = 0; i < numCampos; i++) {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "consumo-input";
    input.placeholder =
      tipoPeriodo === "mensual" ? meses[i] : `Bimestre ${i + 1}`;
    input.id = `consumo${i}`;

    // Valores por defecto para el ejemplo
    if (tipoPeriodo === "bimestral") {
      const valoresDefault = [690, 631, 422, 970, 1011, 752];
      input.value = valoresDefault[i] || "";
    }

    container.appendChild(input);
  }
}

async function calcularSistema() {
  // Mostrar loading
  document.getElementById("loading").style.display = "flex";

  try {
    // Obtener datos del formulario
    const tipoPeriodo = document.getElementById("tipoPeriodo").value;
    const latitud = Number.parseFloat(document.getElementById("latitud").value);
    const longitud = Number.parseFloat(
      document.getElementById("longitud").value
    );
    const eficiencia = Number.parseFloat(
      document.getElementById("eficiencia").value
    );
    const potenciaPanel = Number.parseInt(
      document.getElementById("potenciaPanel").value
    );
    const anchoPanel = Number.parseFloat(
      document.getElementById("anchoPanel").value
    );
    const altoPanel = Number.parseFloat(
      document.getElementById("altoPanel").value
    );
    const pesoPanel = Number.parseFloat(
      document.getElementById("pesoPanel").value
    );
    const porcentajeAhorro = Number.parseFloat(
      document.getElementById("porcentajeAhorro").value
    );
    const limitacionEspacio =
      document.getElementById("limitacionEspacio").checked;
    const areaDisponible =
      Number.parseFloat(document.getElementById("areaDisponible").value) || 0;
    const pesoEstructura = Number.parseFloat(
      document.getElementById("pesoEstructura").value
    );

    // Obtener consumo actual
    const numCampos = tipoPeriodo === "mensual" ? 12 : 6;
    const consumoActual = [];
    for (let i = 0; i < numCampos; i++) {
      const valor =
        Number.parseFloat(document.getElementById(`consumo${i}`).value) || 0;
      consumoActual.push(valor);
    }

    // Validaciones básicas
    if (consumoActual.every((v) => v === 0)) {
      alert("Por favor ingrese los valores de consumo");
      return;
    }

    // Obtener datos de irradiación de NASA
    const irradiacionMensual = await obtenerDatosNASA(latitud, longitud);

    // Cálculos principales
    const esBimestral = tipoPeriodo === "bimestral";

    // 1. Consumo anual
    const consumoAnual = consumoActual.reduce((sum, val) => sum + val, 0);
    const consumoDiario = consumoAnual / 365;
    const promedioConsumo = consumoAnual / (esBimestral ? 6 : 12);
    const consumoMensual = esBimestral ? promedioConsumo / 2 : promedioConsumo;

    // 2. HSP (Horas Solares Pico)
    const valoresIrradiacion = Object.values(irradiacionMensual)
      .filter((v) => typeof v === "number")
      .slice(0, -1);
    const hsp =
      valoresIrradiacion.reduce((sum, val) => sum + val, 0) /
      valoresIrradiacion.length;

    // 3. Potencia Fotovoltaica
    const PFV = consumoDiario / (hsp * eficiencia);

    // 4. Cálculo de módulos
    const anchoPanelM = anchoPanel / 100; // cm a m
    const altoPanelM = altoPanel / 100; // cm a m
    const areaPanelM2 = anchoPanelM * altoPanelM;

    let numeroModulos = 0;

    if (limitacionEspacio && areaDisponible > 0) {
      // Con limitación de espacio
      numeroModulos = Math.floor((areaDisponible * 0.85) / areaPanelM2);
    } else {
      // Sin limitación de espacio
      numeroModulos = Math.ceil(
        (consumoDiario * (porcentajeAhorro / 100) * 1000) /
          (hsp * potenciaPanel * 0.75)
      );
    }

    // 5. Cálculos derivados
    const potenciaInstalada = (potenciaPanel * numeroModulos) / 1000; // kW
    const areaRequerida = Math.ceil(areaPanelM2 * numeroModulos); // Factor de separación 1.15
    const kwInstaladoConEficiencia =
      (potenciaPanel * numeroModulos * eficiencia) / 1000;

    // 6. Peso
    const pesoTotalPaneles = numeroModulos * pesoPanel;
    const pesoTotalEstructura = pesoEstructura * numeroModulos;
    const pesoTotal = pesoTotalPaneles + pesoTotalEstructura;
    const pesoPorM2 = pesoTotal / areaRequerida;

    // 7. Producción mensual
    const diasPorMes = [];
    for (let i = 1; i <= 12; i++) {
      diasPorMes.push(obtenerDiasDelMes(i));
    }

    const produccionMensual = valoresIrradiacion.map((irradiacion, index) => {
      return irradiacion * kwInstaladoConEficiencia * diasPorMes[index];
    });

    const produccionAnual = produccionMensual.reduce(
      (sum, val) => sum + (isNaN(val) ? 0 : val),
      0
    );
    const promedioProduccionMensual = produccionAnual / 12;

    // 8. Consumo mensual expandido (para bimestral)
    let consumoMensualExpandido = [];
    if (esBimestral) {
      for (let i = 0; i < 6; i++) {
        consumoMensualExpandido.push(consumoActual[i]);
        consumoMensualExpandido.push(0);
      }
    } else {
      consumoMensualExpandido = [...consumoActual];
    }

    // 9. Balance energético (Producción - Consumo)
    const balanceEnergetico = produccionMensual.map((produccion, index) => {
      return produccion - consumoMensualExpandido[index];
    });

    // 10. Impacto ambiental (corregido)
    const ahorroCO2 = (produccionAnual * 439.963) / 1000000; // toneladas
    const arbolesPlantados = ahorroCO2 * 155;

    // 11. Cálculo de inversores
    const numeroInversores =
      limitacionEspacio && areaDisponible > 0
        ? Math.ceil(potenciaInstalada / 1) // 1kW por inversor central
        : Math.ceil(potenciaInstalada / 1);

    // Mostrar resultados con todos los valores
    mostrarResultados({
      tipoPeriodo: esBimestral ? "Bimestral" : "Mensual",
      consumoAnual,
      consumoDiario,
      consumoMensual,
      promedioConsumo,
      hsp,
      PFV,
      numeroModulos,
      potenciaInstalada,
      areaRequerida,
      pesoTotalPaneles,
      pesoTotalEstructura,
      pesoTotal,
      pesoPorM2,
      produccionAnual,
      promedioProduccionMensual,
      ahorroCO2,
      arbolesPlantados,
      numeroInversores,
      irradiacionMensual,
      produccionMensual,
      consumoMensualExpandido,
      balanceEnergetico,
    });
  } catch (error) {
    console.error("Error en el cálculo:", error);
    alert("Error en el cálculo. Por favor verifique los datos ingresados.");
  } finally {
    // Ocultar loading
    document.getElementById("loading").style.display = "none";
  }
}

// Inicialización
document.addEventListener("DOMContentLoaded", () => {
  updateConsumoFields();

  // Event listener para limitación de espacio
  document
    .getElementById("limitacionEspacio")
    .addEventListener("change", function () {
      const areaGroup = document.getElementById("areaGroup");
      areaGroup.style.display = this.checked ? "block" : "none";
    });

  // Event listener para el botón de exportar PDF
//   document.getElementById("exportPdfButton").addEventListener("click", exportResultsToPdf);
});

async function obtenerDatosNASA(latitud, longitud) {
  const url = `https://power.larc.nasa.gov/api/temporal/climatology/point?parameters=ALLSKY_SFC_SW_DWN&community=RE&latitude=${latitud}&longitude=${longitud}&format=JSON`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data.properties.parameter.ALLSKY_SFC_SW_DWN;
  } catch (error) {
    console.error("Error al obtener datos de NASA:", error);
    // Datos de respaldo para Ciudad de México
    return {
      JAN: 4.6039,
      FEB: 5.4578,
      MAR: 6.3456,
      APR: 6.774,
      MAY: 6.6502,
      JUN: 6.1733,
      JUL: 6.0362,
      AUG: 6.0024,
      SEP: 5.1854,
      OCT: 5.0666,
      NOV: 4.6538,
      DEC: 4.5002,
    };
  }
}

function obtenerDiasDelMes(mes, anio = 2025) {
  return new Date(anio, mes, 0).getDate();
}

function mostrarResultados(resultados) {
  // Mostrar sección de resultados
  document.getElementById("resultsSection").style.display = "block";

  // Obtener nombres para mostrar
  const nombreCliente =
    document.getElementById("nombreCliente").value || "Cliente no especificado";
  const nombreEjecutivo =
    document.getElementById("nombreEjecutivo").value ||
    "Ejecutivo no especificado";

    // Crear elemento para mostrar la información (opcional)
    const infoHeader = document.createElement('div');
    infoHeader.className = 'info-header';
    infoHeader.innerHTML = `
        <h3>Información del Proyecto</h3>
        <p><strong>Cliente:</strong> ${nombreCliente}</p>
        <p><strong>Ejecutivo:</strong> ${nombreEjecutivo}</p>
        <p><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</p>
    `;
    
    // Insertar al inicio de la sección de resultados
    const resultsCard = document.querySelector(".results-card");
    resultsCard.insertBefore(infoHeader, resultsCard.firstChild);

  // Actualizar TODOS los valores calculados
  document.getElementById(
    "consumoAnual"
  ).textContent = `${resultados.consumoAnual.toFixed(0)} kWh`;
  document.getElementById(
    "consumoDiario"
  ).textContent = `${resultados.consumoDiario.toFixed(2)} kWh`;
  document.getElementById(
    "consumoMensual"
  ).textContent = `${resultados.consumoMensual.toFixed(0)} kWh`;
  document.getElementById(
    "promedioConsumo"
  ).textContent = `${resultados.promedioConsumo.toFixed(0)} kWh`;
  document.getElementById("hsp").textContent = `${resultados.hsp.toFixed(
    2
  )} horas`;
  document.getElementById(
    "potenciaFotovoltaica"
  ).textContent = `${resultados.PFV.toFixed(2)} kW`;
  document.getElementById(
    "numeroModulos"
  ).textContent = `${resultados.numeroModulos} módulos`;
  document.getElementById(
    "potenciaInstalada"
  ).textContent = `${resultados.potenciaInstalada.toFixed(2)} kW`;
  document.getElementById(
    "areaRequerida"
  ).textContent = `${resultados.areaRequerida} m²`;
  document.getElementById(
    "generacionAnual"
  ).textContent = `${resultados.produccionAnual.toFixed(0)} kWh`;

  // Pesos del sistema
  document.getElementById(
    "pesoTotalPaneles"
  ).textContent = `${resultados.pesoTotalPaneles.toFixed(0)} kg`;
  document.getElementById(
    "pesoPorM2"
  ).textContent = `${resultados.pesoPorM2.toFixed(1)} kg/m²`;
  document.getElementById(
    "pesoEstructura"
  ).textContent = `${resultados.pesoTotalEstructura.toFixed(0)} kg`;
  document.getElementById(
    "pesoTotalSistema"
  ).textContent = `${resultados.pesoTotal.toFixed(0)} kg`;

  // Inversores
  document.getElementById("numeroInversores").textContent = `${Math.ceil(
    resultados.numeroInversores
  )} inversores`;

  // Impacto ambiental
  document.getElementById(
    "ahorroCO2"
  ).textContent = `${resultados.ahorroCO2.toFixed(3)} toneladas/año`;
  document.getElementById("arbolesPlantados").textContent = `${Math.round(
    resultados.arbolesPlantados
  )} árboles`;
  document.getElementById(
    "promedioProduccion"
  ).textContent = `${resultados.promedioProduccionMensual.toFixed(0)} kWh/mes`;

  // Crear gráficos
//   crearGraficoIrradiacion(resultados.irradiacionMensual);
//   crearGraficoProduccion(resultados.balanceEnergetico); // Ahora solo necesita el balance

  // Llenar tabla de detalle
  llenarTablaDetalle(resultados);

  // Scroll a resultados
  document
    .getElementById("resultsSection")
    .scrollIntoView({ behavior: "smooth" });
}

// function crearGraficoIrradiacion(irradiacionMensual) {
//   const container = document.getElementById("irradiacionChart");

//   // Convertir el objeto a array de valores
//   const valoresIrradiacion = Object.values(irradiacionMensual).filter(
//     (v) => typeof v === "number"
//   );
//   const maxIrradiacion = Math.max(...valoresIrradiacion);
//   const minIrradiacion = Math.min(...valoresIrradiacion);
//   const promedioIrradiacion =
//     valoresIrradiacion.reduce((sum, val) => sum + val, 0) /
//     valoresIrradiacion.length;

//   container.innerHTML = `
//     <div class="chart-title">Irradiación Solar Mensual (kWh/m²/día)</div>
//     <div class="chart-container" id="irradiacionBars">
//       <div class="chart-y-axis">
//         <span>${maxIrradiacion.toFixed(1)}</span>
//         <span>${(maxIrradiacion * 0.75).toFixed(1)}</span>
//         <span>${(maxIrradiacion * 0.5).toFixed(1)}</span>
//         <span>${(maxIrradiacion * 0.25).toFixed(1)}</span>
//         <span>0</span>
//       </div>
//     </div>
//     <div class="chart-legend">
//       <div class="legend-item">
//         <div class="legend-color irradiation-bar"></div>
//         <span>Irradiación Solar</span>
//       </div>
//     </div>
//     <div class="chart-info">
//       <div class="info-item">
//         <h4>Máxima</h4>
//         <p>${maxIrradiacion.toFixed(2)} kWh/m²/día</p>
//       </div>
//       <div class="info-item">
//         <h4>Mínima</h4>
//         <p>${minIrradiacion.toFixed(2)} kWh/m²/día</p>
//       </div>
//       <div class="info-item">
//         <h4>Promedio</h4>
//         <p>${promedioIrradiacion.toFixed(2)} kWh/m²/día</p>
//       </div>
//     </div>
//   `;

//   const chartBars = document.getElementById("irradiacionBars");

//   for (let i = 0; i < 12; i++) {
//     const altura = (valoresIrradiacion[i] / maxIrradiacion) * 400;

//     const barContainer = document.createElement("div");
//     barContainer.className = "chart-bar";

//     barContainer.innerHTML = `
//       <div class="bar-group">
//         <div class="bar irradiation-bar" style="height: ${altura}px">
//           <div class="bar-tooltip" style="opacity: 1">Irradiación: ${valoresIrradiacion[i].toFixed(
//             2
//           )} kWh/m²/día</div>
//         </div>
//       </div>
//       <div class="bar-label">${meses[i]}</div>
//       <div class="bar-value-label" style="opacity: 1">${valoresIrradiacion[i].toFixed(1)}</div>
//     `;

//     chartBars.appendChild(barContainer);
//   }
// }

// function crearGraficoProduccion(balanceEnergetico) {
//   const container = document.getElementById("produccionChart");

//   // Encontrar el valor máximo absoluto para escalar las barras de balance
//   const maxAbsBalance = Math.max(...balanceEnergetico.map(Math.abs));

//   // Calcular totales
//   const balanceAnual = balanceEnergetico.reduce((sum, val) => sum + val, 0);

//   container.innerHTML = `
//     <div class="chart-title">Balance Energético Mensual (Producción - Consumo)</div>
//     <div class="chart-container" id="balanceBars">
//       <div class="chart-y-axis">
//         <span>${Math.round(maxAbsBalance)}</span>
//         <span>${Math.round(maxAbsBalance * 0.75)}</span>
//         <span>${Math.round(maxAbsBalance * 0.5)}</span>
//         <span>${Math.round(maxAbsBalance * 0.25)}</span>
//         <span>0</span>
//       </div>
//     </div>
//     <div class="chart-legend">
//       <div class="legend-item">
//         <div class="legend-color legend-positive-balance"></div>
//         <span>Balance Positivo</span>
//       </div>
//       <div class="legend-item">
//         <div class="legend-color legend-negative-balance"></div>
//         <span>Balance Negativo</span>
//       </div>
//     </div>
//     <div class="chart-info">
//       <div class="info-item">
//         <h4>Balance Anual</h4>
//         <p class="${balanceAnual >= 0 ? "positive" : "negative"}">${
//     balanceAnual >= 0 ? "+" : ""
//   }${Math.round(balanceAnual)} kWh</p>
//       </div>
//     </div>
//   `;

//   const chartBars = document.getElementById("balanceBars");

//   for (let i = 0; i < 12; i++) {
//     const balance = balanceEnergetico[i];
//     const altura = (Math.abs(balance) / maxAbsBalance) * 400;

//     const barContainer = document.createElement("div");
//     barContainer.className = "chart-bar";

//     const barClass =
//       balance >= 0 ? "bar-positive-balance" : "bar-negative-balance";
//     const tooltipText = `${balance.toFixed(0)}`;
//     const valueLabelText = `${balance.toFixed(0)}`;

//     barContainer.innerHTML = `
//       <div class="bar-group">
//         <div class="bar ${barClass}" style="height: ${altura}px">
//           <div class="bar-tooltip" style="opacity: 1">${tooltipText}</div>
//         </div>
//       </div>
//       <div class="bar-label">${meses[i]}</div>
//       <div class="bar-value-label" style="opacity: 1">${valueLabelText}</div>
//     `;

//     chartBars.appendChild(barContainer);
//   }
// }

function llenarTablaDetalle(resultados) {
  const tbody = document.getElementById("detalleTableBody");
  tbody.innerHTML = "";

  const irradiacionArray = Object.values(resultados.irradiacionMensual).filter(
    (v) => typeof v === "number"
  );

  for (let i = 0; i < 12; i++) {
    const row = tbody.insertRow();

    row.insertCell(0).textContent = mesesCompletos[i];
    row.insertCell(1).textContent = irradiacionArray[i]?.toFixed(2) || "-";
    row.insertCell(2).textContent =
      resultados.produccionMensual[i]?.toFixed(0) || "-";
    row.insertCell(3).textContent =
      resultados.consumoMensualExpandido[i]?.toFixed(0) || "0";

    const balance = resultados.balanceEnergetico[i];
    const balanceCell = row.insertCell(4);
    balanceCell.textContent = balance?.toFixed(0) || "-";
    balanceCell.className = balance > 0 ? "positive" : "negative";
  }
}

function exportResultsToPdf() {
    // Obtener nombres para el PDF
    const nombreCliente = document.getElementById("nombreCliente")?.value || "Cliente no especificado";
    const nombreEjecutivo = document.getElementById("nombreEjecutivo")?.value || "Ejecutivo no especificado";
    
    // Crear un elemento clonado para el PDF
    const element = document.getElementById("resultsSection");
    const clone = element.cloneNode(true);
    
    // Agregar encabezado al clon
    const header = document.createElement('div');
    header.style.padding = '20px';
    header.style.backgroundColor = '#f8f9fa';
    header.style.borderBottom = '1px solid #ddd';
    header.style.marginBottom = '20px';
    header.innerHTML = `
        <h2 style="color: #4caf50; margin: 0 0 10px 0;">Resultados del Sistema Solar Fotovoltaico</h2>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
            <div><strong>Cliente:</strong> ${nombreCliente}</div>
            <div><strong>Ejecutivo:</strong> ${nombreEjecutivo}</div>
            <div><strong>Fecha:</strong> ${new Date().toLocaleDateString()}</div>
            <div><strong>Hora:</strong> ${new Date().toLocaleTimeString()}</div>
        </div>
    `;
    
    clone.insertBefore(header, clone.firstChild);
    
    // Configuración para html2pdf
    const opt = {
        margin: 10,
        filename: `Resultados_Solar_${nombreCliente.replace(/ /g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
            scale: 2,
            scrollY: 0,
            logging: true,
            useCORS: true
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Mostrar mensaje mientras se genera
    const loading = document.getElementById("loading");
    loading.style.display = "flex";
    loading.querySelector("p").textContent = "Generando PDF...";
    
    // Generar PDF después de un breve retraso para asegurar la renderización
    setTimeout(() => {
        html2pdf()
            .set(opt)
            .from(clone)
            .save()
            .then(() => {
                loading.style.display = "none";
            })
            .catch(err => {
                console.error("Error al generar PDF:", err);
                loading.style.display = "none";
                alert("Error al generar el PDF. Por favor intente nuevamente.");
            });
    }, 500);
}