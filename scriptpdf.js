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
      // Proyecto
      tipoProyecto: getVal("tipoProyecto"),
      tipoTarifa: getVal("tipoTarifa"),
      estadoProyecto: getVal("estadoProyecto"),
      municipioProyecto: getVal("municipioProyecto"),
      zonaCFE: getVal("zonaCFE"),
      // Métricas
      consumoAnual: getTxt("consumoAnual", "0 kWh"),
      consumoMensual: getTxt("consumoMensual", "0 kWh"),
      consumoDiario: getTxt("consumoDiario", "0 kWh"),
      importeTotal: getTxt("importeTotal", "$0"),
      importePromedio: getTxt("importePromedio", "$0"),
      tarifaPromedio: getTxt("tarifaPromedio", "$0"),
      potenciaNecesaria: getTxt("potenciaNecesaria", "0 kW"),
      numeroModulos: getTxt("numeroModulos", "0"),
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
    }

    // Detalle por periodo
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

    // Colores – marca #1E924B
    const ink    = rgb(0.12, 0.12, 0.12)
    const mute   = rgb(0.45, 0.45, 0.45)
    const prime  = rgb(0x1E/255, 0x92/255, 0x4B/255) // #1E924B
    const primeD = rgb(0x15/255, 0x72/255, 0x3A/255) // más oscuro
    const primeL = rgb(0.93, 0.98, 0.95)             // tinte claro
    const grayL  = rgb(0.96, 0.96, 0.96)
    const white  = rgb(1, 1, 1)
    const headerSoft = rgb(0xED/255, 0xFA/255, 0xF2/255) // #EDFAF2

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

    // ========= PANEL Cliente + Ejecutivo con ICONOS SVG (espaciado mejorado) =========
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
      // Espaciados más amplios para evitar amontonamiento
      const padX = 16, padY = 14
      const titleH = 18
      const radius = 10
      const midGap = mm(10)
      const colW = (contentWidth - padX * 2 - midGap) / 2
      const rowGap = 16                  // ↑ antes 6
      const rowLH = 24                  // ↑ antes 12
      const iconMM = 3.8                // ↑ antes 4.5
      const iconPad = 5                 // ↑ antes 3
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
      // encabezado #EDFAF2
      page.drawRectangle({ x: left, y: y - titleH, width: contentWidth, height: titleH, color: headerSoft, borderRadius: radius })
      const title = "Información del cliente y ejecutivo"
      page.drawText(title, { x: left + 8, y: y - 14, size: fsBase, font: fontBold, color: primeD })

      // separador vertical
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

          // icono
          page.drawImage(icon, { x: baseX, y: yy - iconH + 7, width: iconW, height: iconH })

          // label
          const lbl = r.label + ": "
          const lblW = widthOf(lbl, fsBase, fontBold)
          const textStartX = baseX + iconW + iconPad + lblW
          const textW = colW - (iconW + iconPad + lblW)
          page.drawText(lbl, { x: baseX + iconW + iconPad, y: yy - 1, size: fsBase, font: fontBold, color: labelColor })

          // valor (con interlínea más alta)
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

    // 2 columnas genéricas (para otras secciones)
    const draw2Cols = (pairs) => {
      const gap = mm(5)
      const colW = (contentWidth - gap) / 2
      const heights = pairs.map(([label, value]) => {
        const lines = wrapText(String(value ?? "—"), colW - 14, fsBase, font)
        return 24 + lh * lines.length
      })
      const H = Math.max(...heights)
      ensure(H + 6)

      const drawCard = (x, label, value) => {
        const yTop = y
        page.drawRectangle({ x, y: yTop - H, width: colW, height: H, color: white, borderColor: prime, borderWidth: 0.35, borderRadius: 8 })
        page.drawRectangle({ x, y: yTop - 18, width: colW, height: 18, color: primeL, borderRadius: 8 })
        page.drawText(label, { x: x + 8, y: yTop - 14, size: fsBase, font: fontBold, color: primeD })
        let yy = yTop - 28
        wrapText(String(value ?? "—"), colW - 14, fsBase, font).forEach(line => {
          page.drawText(line, { x: x + 8, y: yy, size: fsBase, font, color: ink })
          yy -= lh
        })
      }

      const [a, b] = pairs
      if (a) drawCard(left, a[0], a[1])
      if (b) drawCard(left + colW + gap, b[0], b[1])
      y -= H + 6
    }

    const kpiRow = (items) => {
      const gap = mm(5)
      const cols = 3
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

    const drawTable = (headers, rows) => {
      const rowH = 18
      const pcts = [20, 25, 25, 30]
      const colW = pcts.map(p => (contentWidth * p) / 100)
      const drawHeader = () => {
        ensure(rowH + 3)
        page.drawRectangle({ x: left, y: y - rowH, width: contentWidth, height: rowH, color: primeD, borderRadius: 5 })
        let x = left
        headers.forEach((h, i) => { page.drawText(String(h), { x: x + 6, y: y - 12, size: fsBase, font: fontBold, color: white }); x += colW[i] })
        y -= rowH + 3
      }
      drawHeader()
      rows.forEach((r, idx) => {
        ensure(rowH + 2)
        const isAlt = idx % 2 === 1
        page.drawRectangle({ x: left, y: y - rowH, width: contentWidth, height: rowH,
          color: isAlt ? grayL : white, borderColor: prime, borderWidth: 0.25, borderRadius: 4 })
        let x = left
        r.forEach((cell, i) => {
          const txt = String(cell ?? "")
          const isNum = /^[\s\$]?[0-9]/.test(txt)
          const pad = 6
          if (isNum) {
            const tw = widthOf(txt, fsBase, font)
            page.drawText(txt, { x: x + colW[i] - tw - pad, y: y - 12, size: fsBase, font, color: ink })
          } else {
            page.drawText(txt, { x: x + pad, y: y - 12, size: fsBase, font, color: ink })
          }
          x += colW[i]
        })
        y -= rowH + 2
        if (y - rowH < bottom) { newPage(); drawHeader() }
      })
      y -= 1
    }

    // Gráfica centrada + “Promedio anual” más abajo
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


    const drawCanvasImageIfAny2= async (canvasId, widthMM, heightMM) => {
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
        y -= 20 // aire visual antes de la tabla
      } catch (e) { console.warn("No se pudo insertar la gráfica:", e) }
    }

    // === NUEVO: Términos y Condiciones (compacto)

    // Términos y condiciones

    const drawTerms = () => {
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
      const title = "TÉRMINOS Y CONDICIONES"
      const titleH = 16
      ensure(titleH + 8)
      page.drawRectangle({ x: left, y: y - titleH, width: contentWidth, height: titleH, color: primeD, borderRadius: 4 })
      const tw = widthOf(title, fsBase, fontBold)
      page.drawText(title, { x: left + (contentWidth - tw) / 2, y: y - 12, size: fsBase, font: fontBold, color: white })
      y -= titleH + 4

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
      wrapped.forEach(lines => { lines.forEach(line => { page.drawText(line, { x: left + pad, y: yy, size: fsTiny, font, color: ink }); yy -= lhTiny }) })
      y -= boxH
    }

    const dataURLToUint8Array = (dataURL) => {
      const base64 = dataURL.split(",")[1]
      const raw = atob(base64)
      const arr = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
      return arr
    }

    // === 4) Composición ===
    section("COTIZACIÓN / ANÁLISIS SFVI")

    // Panel con espaciado corregido
    await drawInfoPanelWithIcons()

    section("DATOS DEL PROYECTO")
    draw2Cols([["Tipo de proyecto", datos.tipoProyecto || "—"], ["Tarifa", datos.tipoTarifa || "—"]])
    draw2Cols([["Ubicación", `${datos.municipioProyecto || "—"}, ${datos.estadoProyecto || "—"}`], ["Zona CFE", datos.zonaCFE || "—"]])

    section("MÉTRICAS CLAVE")
    kpiRow([["Consumo anual", datos.consumoAnual], ["Consumo mensual", datos.consumoMensual], ["Consumo diario", datos.consumoDiario]])
    kpiRow([["Gasto anual", datos.importeTotal], ["Tarifa promedio", datos.tarifaPromedio], ["% Ahorro estimado", datos.porcentajeAhorro]])
    draw2Cols([["HSP promedio", datos.hsp], ["Ahorro CO2", `${datos.ahorroCO2}/año`]])

    section("DISEÑO DEL SISTEMA")
    kpiRow([["Potencia necesaria", datos.potenciaNecesaria], ["Potencia instalada", datos.potenciaInstalada], ["N.º de módulos", datos.numeroModulos]])
    draw2Cols([["Potencia por panel", `${datos.potenciaPanel} W`], ["Generación anual", datos.generacionAnual]])
    draw2Cols([["Área requerida", `${datos.areaAprox} m²`], ["Rango térmico", `${datos.tempMin} — ${datos.tempMax}`]])


    // Gráfica (opcional, centrada)
    //pinta grafica de irradiacion
    // await drawCanvasImageIfAny("irradiacionChart", 150, 65)
    await drawCanvasImageIfAny2("impactoChart", 150, 65)

    // await drawCanvasImageIfAny("irradiacionChart", 150, 65)


    section("ANÁLISIS DETALLADO POR PERÍODO")
    drawTable(["Período", "Consumo (kWh)", "Importe ($)", "Tarifa ($/kWh)"], filasDetalle)

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
