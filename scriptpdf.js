async function exportToBasePdf() {
  const PDFLib = window.PDFLib
  const { PDFDocument, StandardFonts, rgb } = PDFLib

  // === 0) UI de carga ===
  const loading = document.getElementById("loading")
  const loadingText = document.querySelector(".loading-text")
  const loadingSub = document.querySelector(".loading-subtext")
  if (loading) {
    loading.style.display = "flex"
    if (loadingText) loadingText.textContent = "Generando PDF"
    if (loadingSub) loadingSub.textContent = "Escribiendo en Base.pdf..."
  }

  try {
    // === 1) Recolección de datos ===
    const calcularSistemaSolar = window.calcularSistemaSolar
    try { calcularSistemaSolar && calcularSistemaSolar() } catch (e) {}

    const getVal = (id, fb = "") => (document.getElementById(id)?.value ?? fb).toString().trim()
    const getTxt = (id, fb = "") => (document.getElementById(id)?.textContent ?? fb).toString().trim()
    const toNum = (v) => {
      if (typeof v === "number") return v
      if (!v) return 0
      const s = String(v).replace(/[^\d.-]/g, "")
      const n = parseFloat(s)
      return isNaN(n) ? 0 : n
    }
    const fmtMXN = (n) =>
      new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(toNum(n))

    const datos = {
      // Cliente
      nombreCliente: getVal("nombreCliente"),
      direccionCliente: getVal("direccionCliente"),
      estadoCliente: getVal("estadoCliente"),
      municipioCliente: getVal("municipioCliente"),
      telefonoCliente: getVal("telefonoCliente"),
      correoCliente: getVal("correoCliente"),
      // Ejecutivo
      nombreEjecutivo: getVal("nombreEjecutivo"),
      correoEjecutivo: getVal("correoEjecutivo"),
      whatsappEjecutivo: "7774457253",
      // Proyecto
      tipoProyecto: getVal("tipoProyecto"),
      tipoTarifa: getVal("tipoTarifa"),
      estadoProyecto: getVal("estadoProyecto"),
      municipioProyecto: getVal("municipioProyecto"),
      zonaCFE: getVal("zonaCFE"),
      // Métricas (cards)
      consumoAnual: getTxt("consumoAnual", "0 kWh"),
      consumoMensual: getTxt("consumoMensual", "0 kWh"),
      consumoDiario: getTxt("consumoDiario", "0 kWh"),
      importeTotal: getTxt("importeTotal", "$0"),
      importePromedio: getTxt("importePromedio", "$0"),
      tarifaPromedio: getTxt("tarifaPromedio", "$0"),
      potenciaNecesaria: getTxt("potenciaNecesaria", "0 kW"),
      numeroModulosCard: getTxt("numeroModulos", "0"),
      generacionAnual: getTxt("generacionAnual", "0 kWh"),
      potenciaInstalada: getTxt("potenciaInstalada", "0 kW"),
      hsp: getTxt("hsp", "0 h"),
      ahorroCO2: getTxt("ahorroCO2", "0 t"),
      porcentajeAhorro: getTxt("porcentajeAhorro", "0%"),
      tempMin: getTxt("tempMin", "-"),
      tempMax: getTxt("tempMax", "-"),
      arboles: getTxt("arboles", "0"),
      potenciaPanel: getVal("potenciaPanel", "—"),
      areaAprox: getVal("areaAprox", "—"),
      // Form fields para la tabla de cotización
      numModulosInput: getVal("numModulos", ""), // input del formulario
      subtotalForm: toNum(getVal("subtotal", "0")),
      ivaForm: toNum(getVal("iva", "0")),
      totalForm: toNum(getVal("total", "0")),
    }

    // Fallback por si los campos de subtotal/iva/total no están llenos todavía
    const _subtotal = datos.subtotalForm
    const _iva = datos.ivaForm || _subtotal * 0.16
    const _total = datos.totalForm || (_subtotal + _iva)

    // Detalle por periodo (no se renderiza tabla, se mantiene solo por si lo usas)
    const tipoPeriodo = document.getElementById("tipoPeriodo")?.value || "mensual"
    const numPeriodos = tipoPeriodo === "mensual" ? 12 : 6
    const etiquetas = tipoPeriodo === "mensual"
      ? ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"]
      : ["Bim 1","Bim 2","Bim 3","Bim 4","Bim 5","Bim 6"]
    const filasDetalle = []
    for (let i = 0; i < numPeriodos; i++) {
      const c = Number.parseFloat(document.getElementById(`consumo${i}`)?.value || "0")
      const m = Number.parseFloat(document.getElementById(`importe${i}`)?.value || "0")
      const t = c > 0 ? m / c : 0
      filasDetalle.push([etiquetas[i], `${c.toFixed(0)} kWh`, `$${m.toFixed(2)}`, `$${t.toFixed(3)}`])
    }

    // === 2) Cargar Base.pdf ===
    const baseBytes = await obtenerBasePdfBytes()
    const pdfDoc = await PDFDocument.load(baseBytes)

    // Tipografías
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // === 3) Layout y paleta ===
    const mm = v => v * 2.834645669
    const firstTop = mm(58)
    const nextTop  = mm(20)
    const bottom   = mm(20)
    const left     = mm(20)
    const right    = mm(20)

    let pageIndex = 0
    let page = pdfDoc.getPage(pageIndex)
    let { width: PW, height: PH } = page.getSize()
    let contentWidth = PW - left - right
    let y = PH - firstTop

    // Colores
    const ink    = rgb(0.12, 0.12, 0.12)
    const mute   = rgb(0.45, 0.45, 0.45)
    const prime  = rgb(0x1E/255, 0x92/255, 0x4B/255) // #1E924B
    const primeD = rgb(0x15/255, 0x72/255, 0x3A/255)
    const primeL = rgb(0.93, 0.98, 0.95)
    const grayL  = rgb(0.96, 0.96, 0.96)
    const white  = rgb(1, 1, 1)
    const headerSoft = rgb(0xED/255, 0xFA/255, 0xF2/255)
    const headerDark = rgb(0, 0, 0)

    // >>> Tonos verdes usados en la tabla de cotización
    const greenD = primeD                  // borde / textos oscuros
    const greenL = rgb(0.92, 0.98, 0.93)   // encabezado verde clarito

    // Escalas
    const fsBase  = 8
    const fsSmall = 7
    const fsTitle = 11
    const fsKPI   = 13
    const lh      = 12

    const ensure = h => { if (y - h < bottom) newPage() }

    const newPage = () => {
      drawFooter()
      pageIndex++
      if (pageIndex < pdfDoc.getPageCount()) page = pdfDoc.getPage(pageIndex)
      else page = pdfDoc.addPage([PW, PH])
      const size = page.getSize()
      PW = size.width; PH = size.height
      contentWidth = PW - left - right
      y = PH - nextTop
    }

    const drawFooter = () => {
      const text = `Página ${pageIndex + 1}`
      page.drawText(text, {
        x: PW - right - font.widthOfTextAtSize(text, fsSmall),
        y: bottom - 9,
        size: fsSmall,
        font,
        color: mute
      })
    }

    const widthOf = (t, size = fsBase, f = font) => f.widthOfTextAtSize(String(t), size)
    const wrapText = (text, maxW, size = fsBase, f = font) => {
      const words = (text || "").toString().split(/\s+/)
      const lines = []
      let line = ""
      for (const w of words) {
        const tryLine = line ? line + " " + w : w
        if (widthOf(tryLine, size, f) <= maxW) line = tryLine
        else { if (line) lines.push(line); line = w }
      }
      if (line) lines.push(line)
      return lines.length ? lines : [""]
    }

    // Chip de sección
    const section = (txt) => {
      const padY = 2, padX = 8
      const w = widthOf(txt, fsTitle, fontBold) + padX * 2
      const h = fsTitle + padY * 1.2
      ensure(h + 8)
      page.drawRectangle({ x: left, y: y - h, width: w, height: h, color: primeD, borderRadius: 6 })
      page.drawText(txt, { x: left + padX, y: y - h + padY, size: fsTitle, font: fontBold, color: white })
      page.drawLine({ start: { x: left, y: y - h - 5 }, end: { x: left + contentWidth, y: y - h - 5 }, thickness: 0.5, color: primeL })
      y -= h + 9
    }
    //este seolo se usa para el primer titulo "COTIZACIÓN PRELIMINAR"
    const section2 = (txt) => {
      const padY = 2, padX = 360
      const w = widthOf(txt, fsTitle, fontBold) + padX * 2
      const h = fsTitle + padY * 1.2
      ensure(h + 8)
      //no se usa el rectángulo por que va en negro
      // page.drawRectangle({ x: left, y: y - h, width: w, height: h, color: primeD, borderRadius: 6 })
      page.drawText(txt, { x: left + padX, y: y - h + padY, size: fsTitle, font: fontBold, color: headerDark })
      page.drawLine({ start: { x: left, y: y - h - 5 }, end: { x: left + contentWidth, y: y - h - 5 }, thickness: 0.5, color: primeL })
      y -= h + 9
    }

    // ========= PANEL Cliente + Ejecutivo con ICONOS SVG =========
    const iconCache = {}
    async function loadSvgAsPngBytes(src, wPx, hPx) {
      let url = src
      try { await fetch(url, { method: "HEAD" }) } catch { if (src.endsWith(".sgv")) url = src.replace(/\.sgv$/i, ".svg") }
      const svgText = await (await fetch(url, { cache: "no-store" })).text()
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = svgUrl })
      const canvas = document.createElement("canvas")
      canvas.width = wPx; canvas.height = hPx
      const ctx = canvas.getContext("2d")
      ctx.drawImage(img, 0, 0, wPx, hPx)
      const dataUrl = canvas.toDataURL("image/png")
      URL.revokeObjectURL(svgUrl)
      const b64 = dataUrl.split(",")[1]
      const raw = atob(b64)
      const bytes = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i)
      return bytes
    }
    async function getIconEmbedded(name, sizeMM = 5.5) {
      if (!iconCache[name]) {
        const px = Math.round(sizeMM * 4) * 2
        const bytes = await loadSvgAsPngBytes(`img/${name}`, px, px)
        iconCache[name] = await pdfDoc.embedPng(bytes)
      }
      return iconCache[name]
    }

    async function drawInfoPanelWithIcons() {
      const padX = 16, padY = 14
      const titleH = 18
      const radius = 10
      const midGap = mm(10)
      const colW = (contentWidth - padX * 2 - midGap) / 2
      const rowGap = 16
      const rowLH = 24
      const iconMM = 3.8
      const iconPad = 5
      const labelColor = rgb(0.18,0.18,0.18)

      const leftRows = [
        { icon: "nombreCliente.svg", label: "Cliente",   value: datos.nombreCliente || "—" },
        { icon: "direccion.svg",     label: "Ubicación", value: `${datos.direccionCliente || "—"}, ${datos.municipioCliente || "—"}, ${datos.estadoCliente || "—"}` },
        { icon: "telefono.svg",      label: "Teléfono",  value: datos.telefonoCliente || "—" },
        { icon: "correo.svg",        label: "Correo",    value: datos.correoCliente || "—" },
      ]
      const rightRows = [
        { icon: "nombreEjecutivo.svg", label: "Ejecutivo", value: datos.nombreEjecutivo || "—" },
        { icon: "correo.svg",          label: "Correo",    value: datos.correoEjecutivo || "—" },
        { icon: "whatsapp.svg",        label: "Contacto",    value: datos.whatsappEjecutivo || "—" },
      ]

      const measureRowsHeight = rows => {
        let total = 0
        rows.forEach(r => {
          const iconW = mm(iconMM) + iconPad
          const lbl = r.label + ": "
          const lblW = widthOf(lbl, fsBase, fontBold)
          const textW = colW - iconW - lblW
          const lines = wrapText(String(r.value || "—"), textW, fsBase, font)
          total += Math.max(1, lines.length) * rowLH + rowGap
        })
        return total - rowGap
      }

      const bodyH = Math.max(measureRowsHeight(leftRows), measureRowsHeight(rightRows))
      const H = padY + titleH - 95 + bodyH + padY
      ensure(H + 6)

      // contenedor
      page.drawRectangle({ x: left, y: y - H, width: contentWidth, height: H, color: white, borderColor: prime, borderWidth: 1, borderRadius: radius })
      // encabezado
      page.drawRectangle({ x: left, y: y - titleH, width: contentWidth, height: titleH, color: headerSoft, borderRadius: radius })
      const title = "Información del cliente"
      page.drawText(title, { x: left + 8, y: y - 14, size: fsBase, font: fontBold, color: primeD })

      // separador
      page.drawLine({
        start: { x: left + padX + colW + midGap / 2, y: y - titleH - 6 },
        end:   { x: left + padX + colW + midGap / 2, y: y - H + padY },
        thickness: 0.5, color: primeL
      })

      const drawColumn = async (rows, baseX) => {
        let yy = y - titleH - 16
        for (const r of rows) {
          const icon = await getIconEmbedded(r.icon, iconMM)
          const iconW = mm(iconMM), iconH = mm(iconMM)

          page.drawImage(icon, { x: baseX, y: yy - iconH + 7, width: iconW, height: iconH })

          const lbl = r.label + ": "
          const lblW = widthOf(lbl, fsBase, fontBold)
          const textStartX = baseX + iconW + iconPad + lblW
          const textW = colW - (iconW + iconPad + lblW)
          page.drawText(lbl, { x: baseX + iconW + iconPad, y: yy - 1, size: fsBase, font: fontBold, color: labelColor })

          const lines = wrapText(String(r.value || "—"), textW, fsBase, font)
          page.drawText(lines[0] || "", { x: textStartX, y: yy - 1, size: fsBase, font, color: ink })
          for (let i = 1; i < lines.length; i++) {
            yy -= rowLH
            page.drawText(lines[i], { x: textStartX, y: yy - 1, size: fsBase, font, color: ink })
          }
          yy -= rowGap
        }
      }

      await drawColumn(leftRows, left + padX)
      await drawColumn(rightRows, left + padX + colW + midGap)

      y -= H + 6
    }

    // 2 columnas genéricas
    // 2-3 columnas genéricas (ahora dinámico)
const drawCols = (pairs, colsOverride = 2) => {
  const gap = mm(5)
  const cols = Math.min(colsOverride, pairs.length)
  const colW = (contentWidth - gap * (cols - 1)) / cols

  // Altura dinámica (basada en el valor más alto)
  const heights = pairs.map(([label, value]) => {
    const lines = wrapText(String(value ?? "—"), colW - 14, fsBase, font)
    return 24 + lh * lines.length
  })
  const H = Math.max(...heights)
  ensure(H + 6)

  const drawCard = (x, label, value) => {
    const yTop = y
    page.drawRectangle({
      x, y: yTop - H, width: colW, height: H,
      color: white, borderColor: prime, borderWidth: 0.35, borderRadius: 8
    })
    page.drawRectangle({
      x, y: yTop - 18, width: colW, height: 18,
      color: primeL, borderRadius: 8
    })
    page.drawText(label, {
      x: x + 8, y: yTop - 14, size: fsBase, font: fontBold, color: primeD
    })
    let yy = yTop - 28
    wrapText(String(value ?? "—"), colW - 14, fsBase, font).forEach(line => {
      page.drawText(line, { x: x + 8, y: yy, size: fsBase, font, color: ink })
      yy -= lh
    })
  }

  pairs.slice(0, cols).forEach(([label, value], idx) => {
    const x = left + idx * (colW + gap)
    drawCard(x, label, value)
  })

  y -= H + 6
}


    // ========= kpiRow =========
    const kpiRow = (items, colsOverride) => {
      const gap = mm(5)
      const cols = Math.max(1, colsOverride || items.length)
      const colW = (contentWidth - gap * (cols - 1)) / cols
      const H = 44
      ensure(H + 6)
      items.slice(0, cols).forEach(([label, value], idx) => {
        const x = left + idx * (colW + gap)
        page.drawRectangle({ x, y: y - H, width: colW, height: H, color: white, borderColor: primeD, borderWidth: 0.5, borderRadius: 10 })
        const v = String(value ?? "—")
        const vWidth = widthOf(v, fsKPI, fontBold)
        page.drawText(v, { x: x + (colW - vWidth) / 2, y: y - 22, size: fsKPI, font: fontBold, color: ink })
        const lWidth = widthOf(label, fsSmall, font)
        page.drawText(label, { x: x + (colW - lWidth) / 2, y: y - 36, size: fsSmall, font, color: mute })
      })
      y -= H + 6
    }

    const field = (label, value) => {
      const maxW = contentWidth
      const lines = wrapText(String(value ?? "—"), maxW, fsBase, font)
      const H = lh * (1 + lines.length) + 2
      ensure(H)
      page.drawText(label, { x: left, y, size: fsBase, font: fontBold, color: mute })
      y -= lh
      lines.forEach(line => { page.drawText(line, { x: left, y, size: fsBase, font, color: ink }); y -= lh })
      y -= 1
    }

    // Gráfica centrada (1)
    const drawCanvasImageIfAny = async (canvasId, widthMM, heightMM) => {
      const canvas = document.getElementById(canvasId)
      if (!canvas) return
      try {
        try { shiftAverageLabelDown(canvas) } catch (_) {}
        const dataUrl = canvas.toDataURL("image/png")
        const pngBytes = dataURLToUint8Array(dataUrl)
        const png = await pdfDoc.embedPng(pngBytes)
        const w = mm(widthMM), h = mm(heightMM)
        ensure(h + 6)
        const xCentered = left + (contentWidth - w) / 2
        page.drawImage(png, { x: xCentered, y: y - h, width: w, height: h })
        y -= h + 6
        y -= 20
      } catch (e) { console.warn("No se pudo insertar la gráfica:", e) }
    }

    // Gráfica centrada (2)
    const drawCanvasImageIfAny2 = async (canvasId, widthMM, heightMM) => {
      const canvas = document.getElementById(canvasId)
      if (!canvas) return
      try {
        const dataUrl = canvas.toDataURL("image/png")
        const pngBytes = dataURLToUint8Array(dataUrl)
        const png = await pdfDoc.embedPng(pngBytes)
        const w = mm(widthMM), h = mm(heightMM)
        ensure(h + 6)
        const xCentered = left + (contentWidth - w) / 2
        page.drawImage(png, { x: xCentered, y: y - h, width: w, height: h })
        y -= h + 6
        y -= 20
      } catch (e) { console.warn("No se pudo insertar la gráfica:", e) }
    }

    // === Términos y condiciones ===
    function drawTerms() {
      const items = [
        "La actual cotización es PRELIMINAR, previa a un levantamiento técnico a detalle (precio sujeto a cambio).",
        "El suministro de equipos es proporcionado por el contratista con entrega en sitio (estructura, inversor, módulos).",
        "Facturación: 70% de anticipo de trabajos y 30% antes de concluir operaciones.",
        "En caso de cancelación de servicio ya pagado, existe penalización del 35%.",
        "No incluye: modificaciones en sitio, impermeabilización, evaluación de estructura, reubicación de instalaciones previas, gestiones adicionales con CFE, aumentos de carga, modificación de tarifa, transformador y adecuación de instalación eléctrica.",
        "Incluye: módulos fotovoltaicos, microinversores, estructura, material eléctrico del sistema hasta 16 m al punto de interconexión, tuberías, cableado, protecciones, gabinetes y conectores, sistema de monitoreo, gestión con CFE (tarifa doméstica), carpeta de proyecto, mano de obra e instalación, arreglo FV, ingeniería básica y a detalle.",
        "Precios sujetos a cambios sin previo aviso por posibles incrementos de aranceles (hasta 25%).",
        "La presente considera estructura simple de aluminio, sin refuerzos ni seguros por siniestros o eventualidades naturales (p. ej., huracanes).",
        "Para generar la orden se requiere el 70% del pago de la cotización.",
        "Adicionales pueden incluir seguros especializados y materiales de alta gama con resistencia a huracanes y vandalismo."
      ]
      const fsTiny = 7, lhTiny = 10, pad = 8
      const titleH = 16
      const folioText = `Folio: SFVI-19325`

      ensure(titleH + 8)

      // Folio naranja
      const folioW = widthOf(folioText, fsBase, fontBold) + 20
      page.drawRectangle({ x: left, y: y - titleH, width: folioW, height: titleH, color: rgb(1, 0.7, 0) })
      page.drawText(folioText, { x: left + 6, y: y - 12, size: fsBase, font: fontBold, color: rgb(0,0,0) })

      // Título oscuro
      const title = "TÉRMINOS Y CONDICIONES"
      const titleX = left + folioW + 4
      const titleW = contentWidth - folioW - 4
      page.drawRectangle({ x: titleX, y: y - titleH, width: titleW, height: titleH, color: primeD })
      const tw = widthOf(title, fsBase, fontBold)
      page.drawText(title, { x: titleX + (titleW - tw) / 2, y: y - 12, size: fsBase, font: fontBold, color: white })

      y -= titleH + 4

      // Cuerpo
      const maxW = contentWidth - pad * 2
      let totalLines = 0
      const wrapped = items.map((t, i) => {
        const prefix = `${i + 1}. `
        const lines = wrapText(prefix + t, maxW, fsTiny, font)
        totalLines += lines.length
        return lines
      })
      const boxH = pad + totalLines * lhTiny + pad
      ensure(boxH)
      page.drawRectangle({
        x: left, y: y - boxH, width: contentWidth, height: boxH,
        color: rgb(0.94, 0.98, 0.96), borderColor: prime, borderWidth: 0.4, borderRadius: 6
      })
      let yy = y - pad - fsTiny
      wrapped.forEach(lines => {
        lines.forEach(line => {
          page.drawText(line, { x: left + pad, y: yy, size: fsTiny, font, color: ink })
          yy -= lhTiny
        })
      })
      y -= boxH
    }

    // === Tabla Cotización (estilo verde clarito) ===
    // === Tabla Cotización (estilo igual a tus tablas) ===
function drawCotizacionMantenimiento() {
  // Helpers (usa datos y totales del formulario/calculados)
  const numModulos = (typeof datos !== "undefined")
    ? (datos.numModulosInput || datos.numeroModulosCard || "—")
    : "—";
  const potenciaPanel = (typeof datos !== "undefined")
    ? (datos.potenciaPanel || "—")
    : "—";

  // Subtotal/IVA/Total desde los campos (o del cálculo fallback)
  const subtotalPU = (typeof _subtotal !== "undefined") ? _subtotal : 0;
  const ivaPU      = (typeof _iva      !== "undefined") ? _iva      : subtotalPU * 0.16;
  const totalPU    = (typeof _total    !== "undefined") ? _total    : subtotalPU + ivaPU;

  const fmt = n => `$${(Number(n) || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2, maximumFractionDigits: 2
  })}`;

  // Alturas básicas
  const titleH   = 20;
  const headH    = 20;
  const rowH     = 22;
  const gapBelow = 14;

  // --- Título estilo barra completa (verde oscuro + texto blanco)
  const title = "COTIZACIÓN DE MANTENIMIENTO";
  ensure(titleH + headH + rowH + 36);
  page.drawRectangle({
    x: left, y: y - titleH, width: contentWidth, height: titleH, color: primeD
  });
  const tw = widthOf(title, fsBase, fontBold);
  page.drawText(title, {
    x: left + (contentWidth - tw) / 2,
    y: y - 14, size: fsBase, font: fontBold, color: white
  });
  y -= titleH + 6;

  // --- Medidas de la tabla
  const W = contentWidth;
  const col = {
    partida: Math.round(W * 0.10),
    desc:    Math.round(W * 0.48),
    cant:    Math.round(W * 0.12),
    pu:      Math.round(W * 0.15),
    imp:     Math.round(W * 0.15),
  };
  const X = {
    partida: left,
    desc:    left + col.partida,
    cant:    left + col.partida + col.desc,
    pu:      left + col.partida + col.desc + col.cant,
    imp:     left + col.partida + col.desc + col.cant + col.pu,
    end:     left + W
  };

  // --- Encabezado (verde clarito en la banda, bordes verde oscuro)
  page.drawRectangle({ x: left, y: y - headH, width: W, height: headH, color: primeL, borderColor: primeD, borderWidth: 0.8 });
  const thY = y - 14;
  page.drawText("Partida",     { x: X.partida + 6, y: thY, size: fsBase, font: fontBold, color: primeD });
  page.drawText("Descripción", { x: X.desc    + 6, y: thY, size: fsBase, font: fontBold, color: primeD });
  page.drawText("Cantidad",    { x: X.cant    + 6, y: thY, size: fsBase, font: fontBold, color: primeD });
  page.drawText("P.U.",        { x: X.pu      + 6, y: thY, size: fsBase, font: fontBold, color: primeD });
  page.drawText("Importe",     { x: X.imp     + 6, y: thY, size: fsBase, font: fontBold, color: primeD });

  // Bordes verticales del header
  page.drawLine({ start:{x:X.partida, y:y-headH}, end:{x:X.partida, y:y-headH-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.desc,    y:y-headH}, end:{x:X.desc,    y:y-headH-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.cant,    y:y-headH}, end:{x:X.cant,    y:y-headH-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.pu,      y:y-headH}, end:{x:X.pu,      y:y-headH-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.imp,     y:y-headH}, end:{x:X.imp,     y:y-headH-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.end,     y:y-headH}, end:{x:X.end,     y:y-headH-rowH}, thickness:0.8, color: primeD });

  y -= headH;

  // --- Fila única (cuerpo blanco con bordes verde oscuro)
  page.drawRectangle({ x: left, y: y - rowH, width: W, height: rowH, color: white, borderColor: primeD, borderWidth: 0.8 });
  page.drawLine({ start:{x:X.partida, y:y}, end:{x:X.partida, y:y-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.desc,    y:y}, end:{x:X.desc,    y:y-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.cant,    y:y}, end:{x:X.cant,    y:y-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.pu,      y:y}, end:{x:X.pu,      y:y-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.imp,     y:y}, end:{x:X.imp,     y:y-rowH}, thickness:0.8, color: primeD });
  page.drawLine({ start:{x:X.end,     y:y}, end:{x:X.end,     y:y-rowH}, thickness:0.8, color: primeD });

  const desc = `Instalación ${numModulos || "—"} MFV de ${potenciaPanel || "—"} W`;
  const yy = y - 14;
  page.drawText("1",   { x: X.partida + 6, y: yy, size: fsBase, font, color: ink });
  page.drawText(desc,  { x: X.desc    + 6, y: yy, size: fsBase, font, color: ink });
  page.drawText("1",   { x: X.cant    + 6, y: yy, size: fsBase, font, color: ink });

  const puTxt  = fmt(subtotalPU);
  const impTxt = fmt(subtotalPU);
  page.drawText(puTxt,  { x: X.pu  + col.pu  - 6 - widthOf(puTxt,  fsBase, font), y: yy, size: fsBase, font, color: ink });
  page.drawText(impTxt, { x: X.imp + col.imp - 6 - widthOf(impTxt, fsBase, font), y: yy, size: fsBase, font, color: ink });

  y -= rowH + gapBelow;

  // --- Notas a la izquierda + Totales a la derecha (separados)
  const gapX   = mm(6);
  const leftW  = Math.round(W * 0.58);
  const rightW = W - leftW - gapX;

  // Notas (ligero tono verdoso + borde)
  const notesH = 44;
  page.drawRectangle({ x: left, y: y - notesH, width: leftW, height: notesH, color: rgb(0.97, 1, 0.97), borderColor: primeD, borderWidth: 0.6 });
  page.drawText("*Cotización válida por 7 días naturales.", { x: left + 8, y: y - 14, size: fsBase, font, color: ink });
  page.drawText("*Fecha de inicio de trabajos por definir con cliente.", { x: left + 8, y: y - 28, size: fsBase, font, color: ink });

  // Totales (cuadro con 3 filas; label verde claro, valor blanco; bordes verdes)
  const rightX = left + leftW + gapX;
  const rowTH  = 20;
  const totalBoxH = rowTH * 3;

  // contorno general
  page.drawRectangle({ x: rightX, y: y - totalBoxH, width: rightW, height: totalBoxH, color: white, borderColor: primeD, borderWidth: 0.8 });

  const labels = ["Sub Total", "IVA", "Total"];
  const values = [fmt(subtotalPU), fmt(ivaPU), fmt(totalPU)];

  for (let i = 0; i < 3; i++) {
  const yRowTop = y - i * rowTH;

  // celda label (verde clarito)
  const labelW = Math.round(rightW * 0.55);
  page.drawRectangle({
    x: rightX, y: yRowTop - rowTH, width: labelW, height: rowTH,
    color: primeL, borderColor: primeD, borderWidth: 0.8
  });
  page.drawText(labels[i], {
    x: rightX + 8, y: yRowTop - 14,
    size: fsBase, font: fontBold, color: primeD
  });

  // celda valor (blanco o amarillo si es TOTAL)
  const vx = rightX + labelW;
  page.drawRectangle({
    x: vx, y: yRowTop - rowTH, width: rightW - labelW, height: rowTH,
    color: (i === 2 ? rgb(1, 0.7, 0) : white), // <-- amarillo clarito en TOTAL
    borderColor: primeD, borderWidth: 0.8
  });

  const txt = values[i];
  page.drawText(txt, {
    x: rightX + rightW - 8 - widthOf(txt, fsBase, fontBold),
    y: yRowTop - 14, size: fsBase, font: fontBold, color: ink
  });
}


  y -= Math.max(notesH, totalBoxH) + 10;
}


    const dataURLToUint8Array = (dataURL) => {
      const base64 = dataURL.split(",")[1]
      const raw = atob(base64)
      const arr = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
      return arr
    }

    // === 4) Composición ===
    section2("COTIZACIÓN PRELIMINAR")

    // Panel (cliente y ejecutivo)
    await drawInfoPanelWithIcons()

    drawCotizacionMantenimiento(_subtotal, _iva, _total, datos.numModulosInput, datos.potenciaPanel)

    section("DATOS DEL PROYECTO")
    drawCols([["Tipo de proyecto", datos.tipoProyecto || "—"], ["Tarifa", datos.tipoTarifa || "—"]])
    drawCols([["Ubicación", `${datos.municipioProyecto || "—"}, ${datos.estadoProyecto || "—"}`], ["Zona CFE", datos.zonaCFE || "—"]])

    // KPIs
    kpiRow([
      ["Consumo anual", datos.consumoAnual],
      ["Gasto anual", datos.importeTotal],
      ["Tarifa promedio", datos.tarifaPromedio],
      ["% Ahorro estimado", datos.porcentajeAhorro]
    ], 4)

    section("DISEÑO DEL SISTEMA")
    kpiRow([
      ["Potencia necesaria", datos.potenciaNecesaria],
      ["Potencia instalada", datos.potenciaInstalada],
      ["N.º de módulos", datos.numeroModulosCard]
    ], 3)

    drawCols([["Potencia por panel", `${datos.potenciaPanel} W`], ["Generación anual", datos.generacionAnual], ["Área requerida", `${datos.areaAprox} m²`]])

    newPage()
    section("ANÁLISIS DETALLADO POR PERÍODO")
    await drawCanvasImageIfAny2("impactoChart", 150, 65)

    // Nueva: tabla de cotización (usa los campos del formulario o fallback)

    // Términos
    drawTerms()
    drawFooter()

    // === 5) Guardar y descargar ===
    const pdfBytes = await pdfDoc.save()
    const blob = new Blob([pdfBytes], { type: "application/pdf" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `HexaSolar_Cotizacion_${(datos.nombreCliente || "Cliente").replace(/\s+/g, "_")}.pdf`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  } catch (err) {
    console.error("Error generando PDF base:", err)
    alert("No se pudo generar el PDF. Revisa que 'Base.pdf' exista y vuelve a intentar.")
  } finally {
    if (loading) loading.style.display = "none"
  }
}

// ==== Cache de Base.pdf + fallback sin CORS ====
let basePdfBytes = null
async function obtenerBasePdfBytes() {
  if (basePdfBytes) return basePdfBytes
  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      const resp = await fetch("Base.pdf", { cache: "no-store" })
      if (!resp.ok) throw new Error("HTTP " + resp.status)
      basePdfBytes = await resp.arrayBuffer()
      return basePdfBytes
    } catch (_) {}
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/pdf"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error("No se seleccionó archivo"))
      const reader = new FileReader()
      reader.onload = () => { basePdfBytes = reader.result; resolve(basePdfBytes) }
      reader.onerror = () => reject(reader.error)
      reader.readAsArrayBuffer(file)
    }
    input.click()
  })
}

/** Baja el texto "Promedio anual" y agrega padding inferior en Chart.js */
function shiftAverageLabelDown(canvas) {
  const Chart = window.Chart
  if (!Chart || !Chart.getChart) return
  const chart = Chart.getChart(canvas)
  if (!chart) return

  const pad = chart.options.layout?.padding
  if (typeof pad === "number") {
    chart.options.layout.padding = { top: pad, right: pad, bottom: Math.max(28, pad), left: pad }
  } else {
    chart.options.layout = chart.options.layout || {}
    chart.options.layout.padding = Object.assign({}, pad, { bottom: Math.max(28, (pad && pad.bottom) || 0) })
  }

  const data = chart.data?.datasets?.[0]?.data || []
  const avg = data.length ? data.reduce((a, b) => a + (Number(b) || 0), 0) / data.length : null
  const text = avg != null ? `Promedio anual: ${avg.toFixed(3)} kWh/m²/día` : ""

  const plugin = {
    id: "avgLabelPDF",
    afterDatasetsDraw(c) {
      if (!text) return
      const { ctx, chartArea } = c
      if (!chartArea) return
      ctx.save()
      ctx.font = "12px Helvetica"
      ctx.fillStyle = "rgba(0,0,0,0.75)"
      ctx.textAlign = "center"
      ctx.fillText(text, (chartArea.left + chartArea.right) / 2, chartArea.bottom + 16)
      ctx.restore()
    }
  }
  const has = (chart.config.plugins || []).some(p => p.id === "avgLabelPDF")
  if (!has) chart.config.plugins = [...(chart.config.plugins || []), plugin]
  chart.update()
}
