// Sección INVERSIÓN encapsulada en función async
const fsTitle = 11
const fsKPI = 13
const widthOf = (t, size = fsBase, f = font) => f.widthOfTextAtSize(String(t), size)
// Chip de sección (verde)
const section = (txt) => {
  const padY = 2,
    padX = 8
  const w = widthOf(txt, fsTitle, font) + padX * 2
  const h = fsTitle + padY * 1.2
  ensure(h + 8)
  page.drawRectangle({ x: left, y: y - h, width: w, height: h, color: primeD, borderRadius: 6 })
  page.drawText(txt, { x: left + padX, y: y - h + padY, size: fsTitle, font: font, color: white })
  // Línea verde tenue eliminada
  y -= h + 8
}

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
    // const calcularSistemaSolar = window.calcularSistemaSolar
    // try {
    //   calcularSistemaSolar && calcularSistemaSolar()
    // } catch (e) {}

    const $ = (id) => document.getElementById(id)
    const getVal = (id, fb = "") => ($(id)?.value ?? fb).toString().trim()
    const getTxt = (id, fb = "") => ($(id)?.textContent ?? fb).toString().trim()
    const toNum = (v) => {
      if (typeof v === "number") return v
      if (!v) return 0
      const s = String(v).replace(/[^\d.-]/g, "")
      const n = Number.parseFloat(s)
      return isNaN(n) ? 0 : n
    }
    const fmtMXN = (n) =>
      new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 2 }).format(toNum(n))

    const datos = {
      // Cliente
      nombreCliente: getVal("nombreCliente"),
      direccionCliente: getVal("direccionCliente"),
      telefonoCliente: getVal("telefonoCliente"),
      correoCliente: getVal("correoCliente"),
      // Ejecutivo
      nombreEjecutivo: getVal("nombreEjecutivo"),
      correoEjecutivo: getVal("correoEjecutivo"),
      whatsappEjecutivo: "+52 56 4794 2143",
      // Proyecto
      tipoProyecto: getVal("tipoProyecto"),
      tipoTarifa: getVal("tipoTarifa"),
      estadoProyecto: getVal("estadoProyecto"),
      municipioProyecto: getVal("municipioProyecto"),
      regionTarifariaCFE: getVal("regionTarifariaCFE"),
      roi: getVal("roi", "—"),
      // Métricas (cards)
      consumoAnual: getTxt("consumoAnual", "0 kWh"),
      consumoMensual: getTxt("consumoMensual", "0 kWh"),
      consumoDiario: getTxt("consumoDiario", "0 kWh"),
      importeTotal: getTxt("importeTotal", "$0"),
      importePromedio: getTxt("importePromedio", "$0"),
      tarifaPromedio: getTxt("tarifaPromedio", "$0"),
      potenciaNecesaria: getTxt("potenciaNecesaria", "0 kW"),
      numeroModulosCard: getTxt("numeroModulos"),
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
      inversorPanel: getVal("inversorPanel", "—"), // "Central" | "Microinversor"
      folio: getVal("folioCotizacion", "—"),
      // Form fields para la tabla de cotización
      numModulosInput: getVal("numeroModulos"),
      subtotalForm: toNum(getVal("subtotal", "0")),
      ivaForm: toNum(getVal("iva", "0")),
      totalForm: toNum(getVal("total", "0")),
      subtotalDisplay: getVal("subtotalDisplay", "0"),
      ivaDisplay: getVal("ivaDisplay", "0"),
      totalDisplay: getVal("totalDisplay", "0"),
    }

    const datas = JSON.parse(localStorage.getItem("cotizacionPU"))
    const resultadoSistemaSolar = JSON.parse(localStorage.getItem("resultadosSistemaSolar"))

    console.log(datas)
    // Fallback por si los campos de subtotal/iva/total no están llenos todavía
    const _subtotal = datas.subtotal + datas.profit || 0
    const _iva = datas.iva || _subtotal * 0.16
    const _total = datas.total || _subtotal + _iva

    // === 2) Cargar Base.pdf ===
    const baseBytes = await obtenerBasePdfBytes()
    const pdfDoc = await PDFDocument.load(baseBytes)

    // Tipografías
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold) // <<<< MOVIDO AQUÍ (antes de usar `section`)

    // === 3) Layout y paleta ===
    const mm = (v) => v * 2.834645669
    const firstTop = mm(48) // margen superior un poco menor para subir el título
    const nextTop = mm(25)
    const bottom = mm(18)
    const left = mm(20)
    const right = mm(20)

    let pageIndex = 0
    let page = pdfDoc.getPage(pageIndex)
    let { width: PW, height: PH } = page.getSize()
    let contentWidth = PW - left - right
    let y = PH - firstTop

    // Colores
    const ink = rgb(0.12, 0.12, 0.12)
    const mute = rgb(0.45, 0.45, 0.45)
    const prime = rgb(0x1e / 255, 0x92 / 255, 0x4b / 255) // #1E924B
    const primeD = rgb(0x15 / 255, 0x72 / 255, 0x3a / 255)
    const primeL = rgb(0.93, 0.98, 0.95)
    const white = rgb(1, 1, 1)
    const headerSoft = rgb(0xed / 255, 0xfa / 255, 0xf2 / 255)

    // Escalas
    const fsBase = 8
    const fsSmall = 7
    const fsKPI = 13
    const lh = 12

    const ensure = (h) => {
      if (y - h < bottom) newPage()
    }

    const newPage = () => {
      drawFooter()
      pageIndex++
      if (pageIndex < pdfDoc.getPageCount()) page = pdfDoc.getPage(pageIndex)
      else page = pdfDoc.addPage([PW, PH])
      const size = page.getSize()
      PW = size.width
      PH = size.height
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
        color: mute,
      })
    }

    const fsTitle = 11
    const widthOf = (t, size = fsBase, f = font) => f.widthOfTextAtSize(String(t), size)
    const wrapText = (text, maxW, size = fsBase, f = font) => {
      const words = (text || "").toString().split(/\s+/)
      const lines = []
      let line = ""
      for (const w of words) {
        const tryLine = line ? line + " " + w : w
        if (widthOf(tryLine, size, f) <= maxW) line = tryLine
        else {
          if (line) lines.push(line)
          line = w
        }
      }
      if (line) lines.push(line)
      return lines.length ? lines : [""]
    }

    // Chip de sección (verde) — usa fontBold ya inicializada
    const section = (txt) => {
      const padY = 2,
        padX = 8
      const w = widthOf(txt, fsTitle, fontBold)
      const boxW = w + padX * 2
      const h = fsTitle + padY * 1.2
      ensure(h + 8)
      page.drawRectangle({ x: left, y: y - h, width: boxW, height: h, color: primeD, borderRadius: 6 })
      page.drawText(txt, { x: left + padX, y: y - h + padY, size: fsTitle, font: fontBold, color: white })
      y -= h + 8
    }

    // Título superior negro, más arriba y compacto
    const sectionTopTitle = (txt, useBold = false, size = fsTitle, extraY = 0) => {
  const h = size + 2;
  const padY = 2;
  ensure(h + 6);
  page.drawText(txt, {
    x: left + contentWidth - widthOf(txt, size, useBold ? fontBold : font),
    y: y - h + padY + extraY,
    size: size,
    font: useBold ? fontBold : font,
  });
  y -= h + 4;
}

    // ========= PANEL Información de los involucrados (3/4 – 1/4) =========
    const iconCache = {}
    async function loadSvgAsPngBytes(src, wPx, hPx) {
      const svgText = await (await fetch(src, { cache: "no-store" })).text()
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" })
      const svgUrl = URL.createObjectURL(svgBlob)
      const img = new Image()
      await new Promise((res, rej) => {
        img.onload = res
        img.onerror = rej
        img.src = svgUrl
      })
      const canvas = document.createElement("canvas")
      canvas.width = wPx
      canvas.height = hPx
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
    async function getIconEmbedded(name, sizeMM = 5.0) {
      if (!iconCache[name]) {
        const px = Math.round(sizeMM * 4) * 2
        const bytes = await loadSvgAsPngBytes(`img/${name}`, px, px)
        iconCache[name] = await pdfDoc.embedPng(bytes)
      }
      return iconCache[name]
    }

    async function drawInfoPanelWithIcons() {
      const padX = 14,
        padY = 12
      const titleH = 18
      const radius = 10
      const midGap = mm(6)

      // 3/4 – 1/4
      const gridW = contentWidth - padX * 2 - midGap
      const colW_L = gridW * 0.68
      const colW_R = gridW - colW_L

      const rowGap = 14
      const rowLH = 22
      const iconMM = 3.6
      const iconPad = 5
      const labelColor = rgb(0.18, 0.18, 0.18)

      const leftRows = [
        { icon: "nombreCliente.svg", label: "Cliente", value: datos.nombreCliente || "—" },
        {
          icon: "direccion.svg",
          label: "Ubicación",
          value: `${datos.direccionCliente || "—"}`,
        },
        { icon: "telefono.svg", label: "Teléfono", value: datos.telefonoCliente || "—" },
        { icon: "correo.svg", label: "Correo", value: datos.correoCliente || "—" },
      ]
      const rightRows = [
        { icon: "nombreEjecutivo.svg", label: "Ejecutivo", value: datos.nombreEjecutivo || "—" },
        { icon: "correo.svg", label: "Correo", value: datos.correoEjecutivo || "—" },
        { icon: "whatsapp.svg", label: "Contacto", value: datos.whatsappEjecutivo || "—" },
      ]

      const measureRowsHeight = (rows, colW) => {
        let total = 0
        rows.forEach((r) => {
          const iconW = mm(iconMM) + iconPad
          const lbl = r.label + ": "
          const lblW = widthOf(lbl, fsBase, fontBold)
          const textW = colW - iconW - lblW
          const lines = wrapText(String(r.value || "—"), textW, fsBase, font)
          total += Math.max(1, lines.length) * rowLH + rowGap
        })
        return total - rowGap
      }

      const bodyH = Math.max(measureRowsHeight(leftRows, colW_L), measureRowsHeight(rightRows, colW_R))
      const H = padY + titleH - 90 + bodyH + padY
      ensure(H + 6)

      // contenedor
      page.drawRectangle({
        x: left,
        y: y - H,
        width: contentWidth,
        height: H,
        color: white,
        borderColor: primeD, // contorno verde oscuro
        borderWidth: 1,
        borderRadius: radius,
      })
      // encabezado
      page.drawRectangle({
        x: left,
        y: y - titleH,
        width: contentWidth,
        height: titleH,
        color: primeD, // header verde oscuro
        borderRadius: radius,
      })
      const title = "Información de los involucrados"
  page.drawText(title, { x: left + 8, y: y - 14, size: fsBase, font: fontBold, color: white })

      // separador vertical en 3/4
      const sepX = left + padX + colW_L + midGap / 2
      page.drawLine({
        start: { x: sepX, y: y - titleH - 6 },
        end: { x: sepX, y: y - H + padY },
        thickness: 0.5,
        color: primeL,
      })

      const drawColumn = async (rows, baseX, colWUse) => {
        let yy = y - titleH - 14
        for (const r of rows) {
          const icon = await getIconEmbedded(r.icon, iconMM)
          const iconW = mm(iconMM),
            iconH = mm(iconMM)
          page.drawImage(icon, { x: baseX, y: yy - iconH + 7, width: iconW, height: iconH })
          const lbl = r.label + ": "
          const lblW = widthOf(lbl, fsBase, fontBold)
          const textStartX = baseX + iconW + iconPad + lblW
          const textW = colWUse - (iconW + iconPad + lblW)
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

      await drawColumn(leftRows, left + padX, colW_L)
      await drawColumn(rightRows, left + padX + colW_L + midGap, colW_R)
      y -= H + 6
    }

    // 2-3 columnas compactas (ancho igual)
    // 2-3 columnas compactas (ancho igual) — valor centrado vertical y alineado a la izquierda
    const drawCols = (pairs, colsOverride = 2) => {
      const gap = mm(5)
      const cols = Math.min(colsOverride, pairs.length)
      const colW = (contentWidth - gap * (cols - 1)) / cols

      const headerH = 14,
        bodyPad = 6,
        lhCompact = 10,
        radius = 6

      const heights = pairs.map(([label, value]) => {
        const lines = wrapText(String(value ?? "—"), colW - bodyPad * 2, fsBase, font)
        return headerH + bodyPad * 2 + lhCompact * lines.length
      })
      const H = Math.max(...heights)
      ensure(H + 4)

      const drawCard = (x, label, value) => {
        const yTop = y

        // contenedor + header
        page.drawRectangle({
          x,
          y: yTop - H,
          width: colW,
          height: H,
          color: white,
          borderColor: prime,
          borderWidth: 0.35,
          borderRadius: radius,
        })
        page.drawRectangle({ x, y: yTop - headerH, width: colW, height: headerH, color: primeL, borderRadius: radius })

        // etiqueta en header
        page.drawText(label, {
          x: x + bodyPad,
          y: yTop - headerH + (headerH - fsBase) / 2,
          size: fsBase,
          font: fontBold,
          color: primeD,
        })

        // valor en medio vertical
        const lines = wrapText(String(value ?? "—"), colW - bodyPad * 2, fsBase, font)
        const textH = lhCompact * lines.length
        const availableH = H - headerH
        const valuePadTop = 6.5
        let yy = yTop - headerH - (availableH - textH) / 2 - valuePadTop

        lines.forEach((line) => {
          page.drawText(line, {
            x: x + bodyPad, // pegado a la izquierda
            y: yy,
            size: fsBase,
            font,
            color: ink,
          })
          yy -= lhCompact
        })
      }

      pairs.slice(0, cols).forEach(([label, value], idx) => {
        const x = left + idx * (colW + gap)
        drawCard(x, label, value)
      })

      y -= H + 4
    }

    // Columnas compactas con pesos (p. ej. 3/4 – 1/4)
    // Columnas compactas con pesos — valor centrado vertical y alineado a la izquierda
    const drawColsWeighted = (pairs, weights) => {
      const gap = mm(5)
      const totalW = weights.reduce((a, b) => a + b, 0)
      const cols = Math.min(pairs.length, weights.length)
      const widths = weights.slice(0, cols).map((w) => (contentWidth - gap * (cols - 1)) * (w / totalW))

      const headerH = 14,
        bodyPad = 6,
        lhCompact = 10,
        radius = 6

      const heights = pairs.slice(0, cols).map(([label, value], i) => {
        const colW = widths[i]
        const lines = wrapText(String(value ?? "—"), colW - bodyPad * 2, fsBase, font)
        return headerH + bodyPad * 2 + lhCompact * lines.length
      })
      const H = Math.max(...heights)
      ensure(H + 4)

      let x = left
      pairs.slice(0, cols).forEach(([label, value], i) => {
        const colW = widths[i]
        const yTop = y

        // contenedor + header
        page.drawRectangle({
          x,
          y: yTop - H,
          width: colW,
          height: H,
          color: white,
          borderColor: prime,
          borderWidth: 0.35,
          borderRadius: radius,
        })
        page.drawRectangle({ x, y: yTop - headerH, width: colW, height: headerH, color: primeL, borderRadius: radius })

        // etiqueta
        page.drawText(label, {
          x: x + bodyPad,
          y: yTop - headerH + (headerH - fsBase) / 2,
          size: fsBase,
          font: fontBold,
          color: primeD,
        })

        // valor centrado vertical
        const lines = wrapText(String(value ?? "—"), colW - bodyPad * 2, fsBase, font)
        const textH = lhCompact * lines.length
        const availableH = H - headerH
        const valuePadTop = 6.5 // <- NUEVO
        let yy = yTop - headerH - (availableH - textH) / 2 - valuePadTop

        lines.forEach((line) => {
          page.drawText(line, {
            x: x + bodyPad, // pegado a la izquierda
            y: yy,
            size: fsBase,
            font,
            color: ink,
          })
          yy -= lhCompact
        })

        x += colW + gap
      })

      y -= H + 4
    }

    // ========= kpiRow (compacto) =========
    const kpiRow = (items, colsOverride) => {
      const gap = mm(5)
      const cols = Math.max(1, colsOverride || items.length)
      const colW = (contentWidth - gap * (cols - 1)) / cols
      const H = 40
      ensure(H + 6)
      items.slice(0, cols).forEach(([label, value], idx) => {
        const x = left + idx * (colW + gap)
        page.drawRectangle({
          x,
          y: y - H,
          width: colW,
          height: H,
          color: white,
          borderColor: primeD,
          borderWidth: 0.5,
          borderRadius: 10,
        })
        const v = String(value ?? "—")
        const vWidth = widthOf(v, fsKPI, fontBold)
        page.drawText(v, { x: x + (colW - vWidth) / 2, y: y - 20, size: fsKPI, font: fontBold, color: ink })
        const lWidth = widthOf(label, fsSmall, font)
        page.drawText(label, { x: x + (colW - lWidth) / 2, y: y - 34, size: fsSmall, font, color: mute })
      })
      y -= H + 4
    }

    const field = (label, value) => {
      const maxW = contentWidth
      const lines = wrapText(String(value ?? "—"), maxW, fsBase, font)
      const H = lh * (1 + lines.length) + 2
      ensure(H)
      page.drawText(label, { x: left, y, size: fsBase, font: fontBold, color: mute })
      y -= lh
      lines.forEach((line) => {
        page.drawText(line, { x: left, y, size: fsBase, font, color: ink })
        y -= lh
      })
      y -= 1
    }

    // Gráfica centrada
    const dataURLToUint8Array = (dataURL) => {
      const base64 = dataURL.split(",")[1]
      const raw = atob(base64)
      const arr = new Uint8Array(raw.length)
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
      return arr
    }

    // Ensancha temporalmente la gráfica "impactoChart", fuerza un redibujo y devuelve un PNG nítido
    async function capturarImpactoGrande() {
      const c = document.getElementById("impactoChart")
      if (!c) return null

      // 1) agrandar por CSS y disparar el redibujo (tu ResizeObserver/redraw lo hará)
      document.body.classList.add("pdf-export")
      window.dispatchEvent(new Event("resize"))

      // 2) espera un tick para que se repinte
      await new Promise((r) => setTimeout(r, 160))

      // 3) capturar imagen grande directamente del canvas ya redibujado
      let dataURL = null
      try {
        dataURL = c.toDataURL("image/png", 1)
      } catch { }

      // 4) restaurar layout
      document.body.classList.remove("pdf-export")
      window.dispatchEvent(new Event("resize"))
      await new Promise((r) => setTimeout(r, 60))

      return dataURL
    }

    const delay = (ms) => new Promise((r) => setTimeout(r, ms))

    async function withTempCanvasSize(canvas, wPx, hPx, fn) {
      const prevW = canvas.style.width
      const prevH = canvas.style.height

      canvas.style.width = wPx + "px"
      canvas.style.height = hPx + "px"

      // 2 frames para que layout + redraw se asienten
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

      if (typeof canvas.__impactoRedraw === "function") {
        canvas.__impactoRedraw()
        await delay(30)
      }

      const out = await fn()

      canvas.style.width = prevW
      canvas.style.height = prevH

      if (typeof canvas.__impactoRedraw === "function") {
        canvas.__impactoRedraw()
      }
      return out
    }

    // Renderiza la Chart.js en un canvas off-screen a 300 DPI y la inserta nítida en el PDF
    // Renderiza la gráfica a tamaño físico en mm y la inserta nítida en el PDF
    const drawCanvasImageIfAny2 = async (canvasId, widthMM, heightMM, dpi = 300) => {
      const src = document.getElementById(canvasId)
      if (!src) return

      const pxPerMM = dpi / 25.4
      const outW = Math.max(1, Math.round(widthMM * pxPerMM))
      const outH = Math.max(1, Math.round(heightMM * pxPerMM))

      const Chart = window.Chart
      let dataUrl

      // ---- Rama Chart.js (tal cual la tenías) ----
      if (Chart && Chart.getChart) {
        const srcChart = Chart.getChart(src)
        if (srcChart) {
          const off = document.createElement("canvas")
          off.width = outW
          off.height = outH
          const cfg = JSON.parse(JSON.stringify(srcChart.config))
          cfg.options = cfg.options || {}
          cfg.options.animation = false
          cfg.options.responsive = false
          cfg.options.maintainAspectRatio = false
          cfg.options.devicePixelRatio = Math.max(2, Math.ceil(dpi / 96))
          const tmpChart = new Chart(off.getContext("2d"), cfg)
          tmpChart.resize(outW, outH)
          tmpChart.update()
          dataUrl = off.toDataURL("image/png")
          tmpChart.destroy()
        }
      }

      // ---- NUEVO: rama canvas “manual” (tu gráfica responsive propia) ----
      // ---- rama canvas “manual” (tu gráfica responsive) ----
      if (!dataUrl && canvasId === "impactoChart") {
        // redibuja GRANDE (p.ej. 1100×360) y captura
        dataUrl = await withTempCanvasSize(src, 1100, 360, async () => {
          // importante: captura después del redibujo
          return src.toDataURL("image/png", 1)
        })
      }

      // ---- Fallback: escalar el canvas actual (por si algo falla) ----
      if (!dataUrl) {
        dataUrl = await withTempCanvasSize(src, 1200, 360, async () => {
          if (typeof src.__impactoRedraw === "function") src.__impactoRedraw()
          await delay(20)
          return src.toDataURL("image/png", 1)
        })
      }

      // Insertar en PDF
      const pngBytes = (function dataURLToUint8Array(d) {
        const b64 = d.split(",")[1]
        const raw = atob(b64)
        const arr = new Uint8Array(raw.length)
        for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i)
        return arr
      })(dataUrl)

      const png = await pdfDoc.embedPng(pngBytes)
      const w = mm(widthMM),
        h = mm(heightMM)
      ensure(h + 6)
      const xCentered = left + (contentWidth - w) / 2
      page.drawImage(png, { x: xCentered, y: y - h, width: w, height: h })
      y -= h + 10
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
        "Adicionales pueden incluir seguros especializados y materiales de alta gama con resistencia a huracanes y vandalismo.",
      ]
      const fsTiny = 7,
        lhTiny = 10,
        pad = 8
      const titleH = 16
      const folioText = `Folio: SFVI-${datos.folio || "—"}`
      ensure(titleH + 8)

      // Folio naranja
      const folioW = widthOf(folioText, fsBase, fontBold) + 20
      page.drawRectangle({ x: left, y: y - titleH, width: folioW, height: titleH, color: rgb(1, 0.7, 0) })
      page.drawText(folioText, { x: left + 6, y: y - 12, size: fsBase, font: fontBold, color: rgb(0, 0, 0) })

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
        x: left,
        y: y - boxH,
        width: contentWidth,
        height: boxH,
        color: rgb(0.94, 0.98, 0.96),
        borderColor: prime,
        borderWidth: 0.4,
        borderRadius: 6,
      })
      let yy = y - pad - fsTiny
      wrapped.forEach((lines) => {
        lines.forEach((line) => {
          page.drawText(line, { x: left + pad, y: yy, size: fsTiny, font, color: ink })
          yy -= lhTiny
        })
      })
      y -= boxH
    }

    // === Tabla Cotización (centrada) ===
    function drawCotizacionMantenimiento() {
      const toNumber = (v) => {
        if (v == null) return 0
        const s = String(v).replace(/[^\d.-]/g, "")
        const n = Number.parseFloat(s)
        return isNaN(n) ? 0 : n
      }
      const fmt = (n) =>
        `$${(Number(n) || 0).toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      const centerX = (x0, wCol, txt, size = fsBase, fnt = font) => x0 + (wCol - widthOf(txt, size, fnt)) / 2

      const numModulos = datos.numeroModulosCard || "—"
      const potenciaPanel = datos.potenciaPanel || "—"

      // const totalForm = toNumber(document.getElementById("total")?.value)
      const totalForm = datas.subtotal + datas.profit || 0
      const subtotalPU = totalForm
      const ivaPU = datas.iva || datas.subtotal * 0.16
      const totalPU = datas.total || subtotalPU + ivaPU

      const headH = 20,
        rowH = 22,
        gapBelow = 12
      const W = contentWidth
      const col = {
        partida: Math.round(W * 0.1),
        desc: Math.round(W * 0.48),
        cant: Math.round(W * 0.12),
        pu: Math.round(W * 0.15),
        imp: Math.round(W * 0.15),
      }
      const X = {
        partida: left,
        desc: left + col.partida,
        cant: left + col.partida + col.desc,
        pu: left + col.partida + col.desc + col.cant,
        imp: left + col.partida + col.desc + col.cant + col.pu,
        end: left + W,
      }

      // Header
      page.drawRectangle({
        x: left,
        y: y - headH,
        width: W,
        height: headH,
        color: primeL,
        borderColor: primeD,
        borderWidth: 0.8,
      })
      const thY = y - 14
      page.drawText("Partida", {
        x: centerX(X.partida, col.partida, "Partida", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: primeD,
      })
      page.drawText("Descripción", {
        x: centerX(X.desc, col.desc, "Descripción", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: primeD,
      })
      page.drawText("Cantidad", {
        x: centerX(X.cant, col.cant, "Cantidad", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: primeD,
      })
      page.drawText("P.U.", {
        x: centerX(X.pu, col.pu, "P.U.", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: primeD,
      })
      page.drawText("Importe", {
        x: centerX(X.imp, col.imp, "Importe", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: primeD,
      })

      // Líneas
      page.drawLine({
        start: { x: X.partida, y: y - headH },
        end: { x: X.partida, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({
        start: { x: X.desc, y: y - headH },
        end: { x: X.desc, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({
        start: { x: X.cant, y: y - headH },
        end: { x: X.cant, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({
        start: { x: X.pu, y: y - headH },
        end: { x: X.pu, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({
        start: { x: X.imp, y: y - headH },
        end: { x: X.imp, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({
        start: { x: X.end, y: y - headH },
        end: { x: X.end, y: y - headH - rowH },
        thickness: 0.8,
        color: primeD,
      })

      y -= headH

      // Fila
      page.drawRectangle({
        x: left,
        y: y - rowH,
        width: W,
        height: rowH,
        color: white,
        borderColor: primeD,
        borderWidth: 0.8,
      })
      page.drawLine({
        start: { x: X.partida, y: y },
        end: { x: X.partida, y: y - rowH },
        thickness: 0.8,
        color: primeD,
      })
      page.drawLine({ start: { x: X.desc, y: y }, end: { x: X.desc, y: y - rowH }, thickness: 0.8, color: primeD })
      page.drawLine({ start: { x: X.cant, y: y }, end: { x: X.cant, y: y - rowH }, thickness: 0.8, color: primeD })
      page.drawLine({ start: { x: X.pu, y: y }, end: { x: X.pu, y: y - rowH }, thickness: 0.8, color: primeD })
      page.drawLine({ start: { x: X.imp, y: y }, end: { x: X.imp, y: y - rowH }, thickness: 0.8, color: primeD })
      page.drawLine({ start: { x: X.end, y: y }, end: { x: X.end, y: y - rowH }, thickness: 0.8, color: primeD })

      const desc = `Instalación ${numModulos || "—"} MFV de ${potenciaPanel || "—"} W`
      const yy = y - 14
      page.drawText("1", {
        x: centerX(X.partida, col.partida, "1", fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      })
      page.drawText(desc, { x: centerX(X.desc, col.desc, desc, fsBase, font), y: yy, size: fsBase, font, color: ink })
      page.drawText("1", { x: centerX(X.cant, col.cant, "1", fsBase, font), y: yy, size: fsBase, font, color: ink })

      const puTxt = fmt(subtotalPU)
      const impTxt = fmt(subtotalPU)
      page.drawText(puTxt, { x: centerX(X.pu, col.pu, puTxt, fsBase, font), y: yy, size: fsBase, font, color: ink })
      page.drawText(impTxt, { x: centerX(X.imp, col.imp, impTxt, fsBase, font), y: yy, size: fsBase, font, color: ink })

      y -= rowH + gapBelow

      // Notas + Totales
      const gapX = mm(6)
      const leftW = Math.round(W * 0.58)
      const rightW = W - leftW - gapX

      const notesH = 30
      page.drawRectangle({
        x: left,
        y: y - notesH,
        width: leftW,
        height: notesH,
        color: rgb(0.97, 1, 0.97),
        borderColor: primeD,
        borderWidth: 0.6,
      })
      page.drawText("*Cotización válida por 7 días naturales.", {
        x: left + 8,
        y: y - 12,
        size: fsBase,
        font,
        color: ink,
      })
      page.drawText("*Fecha de inicio de trabajos por definir con cliente.", {
        x: left + 8,
        y: y - 24,
        size: fsBase,
        font,
        color: ink,
      })

      const rightX = left + leftW + gapX
      const rowTH = 20
      const totalBoxH = rowTH * 3

      page.drawRectangle({
        x: rightX,
        y: y - totalBoxH,
        width: rightW,
        height: totalBoxH,
        color: white,
        borderColor: primeD,
        borderWidth: 0.8,
      })

      const labels = ["Subtotal", "IVA", "Total"]
      const values = [fmt(subtotalPU), fmt(ivaPU), fmt(totalPU)]

      const centerText = (x0, w, text, size, fnt) => x0 + (w - widthOf(text, size, fnt)) / 2

      for (let i = 0; i < 3; i++) {
        const yRowTop = y - i * rowTH
        const labelW = Math.round(rightW * 0.55)
        const isTotal = i === 2

        // Label
        page.drawRectangle({
          x: rightX,
          y: yRowTop - rowTH,
          width: labelW,
          height: rowTH,
          color: isTotal ? rgb(0.933, 0.961, 0.153) : primeL, // #EEF527 para Total
          borderColor: primeD,
          borderWidth: 0.8,
        })
        const lfSize = isTotal ? fsBase + 3 : fsBase
        page.drawText(labels[i], {
          x: centerText(rightX, labelW, labels[i], lfSize, fontBold),
          y: yRowTop - 14,
          size: lfSize,
          font: fontBold,
          color: isTotal ? ink : primeD,
        })

        // Valor
        const vx = rightX + labelW
        page.drawRectangle({
          x: vx,
          y: yRowTop - rowTH,
          width: rightW - labelW,
          height: rowTH,
          color: isTotal ? rgb(0.933, 0.961, 0.153) : white, // #EEF527 para Total
          borderColor: primeD,
          borderWidth: 0.8,
        })
        const vSize = isTotal ? fsBase + 1 : fsBase
        const txt = values[i]
        page.drawText(txt, {
          x: centerText(vx, rightW - labelW, txt, vSize, isTotal ? fontBold : font),
          y: yRowTop - 14,
          size: vSize,
          font: isTotal ? fontBold : font,
          color: ink,
        })
      }

      y -= Math.max(notesH, totalBoxH) + 10
    }

    // --- Función para dibujar la sección "Tu sistema solar" ---
    async function drawSistemaSolarSection() {
      // Configuración visual
      const items = [
        {
          img: "panel.png",
          value: datos.numeroModulosCard || "—",
          title: "Paneles Solares",
        },
        {
          img: "potencia.png",
          value: datos.potenciaInstalada || "—",
          title: "Potencia Total Inst.",
        },
        {
          img: "porcentaje.png",
          value: datos.porcentajeAhorro || "—",
          title: "% de Ahorro",
        },
        {
          img: "area.png",
          value: (datos.areaAprox ? datos.areaAprox + " m2" : "— m2"),
          title: "Área Requerida",
        },
      ];

      const cols = items.length;
      const gap = mm(6);
      const colW = (contentWidth - gap * (cols - 1)) / cols;
      const imgMM = 13; // tamaño imagen
      const valueSize = fsKPI;
      const titleSize = fsSmall + 1; // Un poco más grande para los títulos grises
      const cardH = mm(imgMM) + 32;
      ensure(cardH + 8);

      // Altura de cada bloque
      const blockH = mm(imgMM) + 18;
      ensure(blockH + 8);
      // Calcular el ancho total del bloque
      const totalW = cols * colW + (cols - 1) * gap;
      // Centrado visual: considerar el margen izquierdo y derecho
      const startX = (PW - totalW) / 2;
      const offset = mm(5); // Ajusta este valor si lo quieres más al centro
      const finalStartX = startX + offset;
      for (let i = 0; i < cols; i++) {
        const x = finalStartX + i * (colW + gap);
        // Imagen PNG
        let iconW = mm(imgMM), iconH = mm(imgMM);
        try {
          const imgBytes = await fetch(`img/${items[i].img}`).then(r => r.arrayBuffer());
          const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes));
          page.drawImage(imgEmbed, {
            x: x,
            y: y - iconH,
            width: iconW,
            height: iconH,
          });
        } catch (e) { }
        // Valor a la derecha de la imagen
        const v = String(items[i].value ?? "—");
        page.drawText(v, {
          x: x + iconW + 6,
          y: y - 8,
          size: valueSize,
          font: fontBold,
          color: ink,
        });
        // Título abajo, centrado respecto al bloque
        const tWidth = widthOf(items[i].title, titleSize, font);
        page.drawText(items[i].title, {
          x: x + (colW - tWidth) / 2,
          y: y - iconH - 12,
          size: titleSize,
          font,
          color: mute,
        });
      }
      y -= blockH + 8;
    }

    // === 4) Composición ===
    // Título top: COTIZACIÓN PRELIMINAR – FOLIO {folio}
    const folioFontSize = Math.max(10, fsTitle - 4);
    // Espacio mínimo entre ambos títulos
    sectionTopTitle(`COTIZACIÓN PRELIMINAR`, true, fsTitle, mm(1));
    sectionTopTitle(`FOLIO:  SFVI-${datos.folio || "—"}`, true, folioFontSize, 0);
    y -= mm(2);
    // Panel (involucrados)
    await drawInfoPanelWithIcons()

    // Espacio extra entre panel de involucrados y DATOS DEL PROYECTO
    y -= mm(5) // Puedes ajustar el valor si quieres más o menos espacio
    // DATOS DEL PROYECTO (formato boceto)
    // Helper para capitalizar
    function capitalizeFirst(str) {
      return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : "—";
    }
    section("DATOS DEL PROYECTO")
    y -= mm(4) // Espacio extra entre el título y los datos del proyecto
    // Datos del proyecto a la izquierda
    const datosProyecto = [
      ["Ubicación:", `${datos.municipioProyecto || "—"}, ${datos.estadoProyecto || "—"}`],
      ["Clasificación:", capitalizeFirst(datos.tipoProyecto)],
      ["Tarifa:", datos.tipoTarifa || "—"],
      ["Región CFE:", capitalizeFirst(datos.regionTarifariaCFE)],
    ];
    // KPIs a la derecha
    const datosKPI = [
      { label: "Consumo Anual", value: datos.consumoAnual, img: "consumoAnual.png" },
      { label: "Gasto Anual", value: "$" + (typeof datos.importeTotal === "string" ? datos.importeTotal.replace(/[^\d.]/g, "") : datos.importeTotal), img: "gastoAnual.png" },
      { label: "Tarifa Prom", value: datos.tarifaPromedio, img: "tarifaPromedio.png" },
    ];

    // Layout horizontal: datos del proyecto a la izquierda, KPIs a la derecha
    const datosX = left;
    const datosY = y;
    const kpiX = left + mm(80); // Ajusta el valor para mover los KPIs a la derecha
    const kpiY = y;
    // Dibuja datos del proyecto
    let tempY = datosY;
    datosProyecto.forEach(([label, value]) => {
      const labelW = widthOf(label, fsBase, fontBold);
      const gap = mm(1.2); // Junta más el título y la respuesta
      page.drawText(label, { x: datosX, y: tempY, size: fsBase, font: fontBold, color: ink });
      page.drawText(value, { x: datosX + labelW + gap, y: tempY, size: fsBase, font, color: ink });
      tempY -= lh;
    });

    // Dibuja KPIs con imagen
    let kpiW = mm(22), kpiGap = mm(4), kpiImgH = mm(12);
    // Mueve los KPIs más a la derecha y alinea verticalmente con los datos
    const kpiXStart = left + mm(100); // Más a la derecha
    // Altura alineada con la primera línea de datos de la izquierda
    let kpiYStart = datosY;
    for (let i = 0; i < datosKPI.length; i++) {
      const kpi = datosKPI[i];
      const baseX = kpiXStart + i * (kpiW + kpiGap);
      // Imagen en medio
      let imgY = kpiYStart - mm(2) - kpiImgH / 2;
      let imgX = baseX + kpiW / 2 - mm(6);
      try {
        const imgBytes = await fetch(`img/${kpi.img}`).then(r => r.arrayBuffer());
        const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes));
        page.drawImage(imgEmbed, { x: imgX, y: imgY, width: mm(12), height: kpiImgH });
      } catch { }
      // Valor arriba, centrado respecto a la imagen (más grande)
      const kpiValueSize = 11; // Un poco más chicos
      page.drawText(kpi.value, { x: baseX + kpiW / 2 - widthOf(kpi.value, kpiValueSize, fontBold) / 2, y: imgY + kpiImgH + mm(2), size: kpiValueSize, font: fontBold, color: ink });
      // Nombre abajo, centrado respecto a la imagen
      const kpiTitleSize = fsSmall + 1; // Igual que los títulos grises de 'Tu sistema solar'
      page.drawText(kpi.label, { x: baseX + kpiW / 2 - widthOf(kpi.label, kpiTitleSize, font) / 2, y: imgY - mm(6), size: kpiTitleSize, font, color: mute });
    }
    // Ajusta y para el siguiente bloque
    y = Math.min(tempY, kpiYStart - lh * datosProyecto.length - mm(8));

    // Reducir aún más el espacio entre KPIs y 'TU SISTEMA SOLAR'
    y += mm(4); // Sube el título para que quede más cerca de los KPIs
    section("TU SISTEMA SOLAR")
    y -= mm(3); // Sube el título para que quede más cerca de los KPIs
    await drawSistemaSolarSection()
    let espacioPanelY = y;
    y = espacioPanelY - mm(3); // menos espacio antes de la gráfica

    // Gráfica justo después de 'TU SISTEMA SOLAR'
    await drawCanvasImageIfAny2("impactoChart", 180, 85)

    newPage()
    section("INVERSIÓN")
    y -= mm(16)

    // Configuración general
    const invCircleR = mm(12)
    const blockW = mm(54)   // ancho de cada bloque
    const blockH = mm(40)   // alto de bloque
    const gap = mm(10)      // separación entre bloques
    const totalWidth = blockW * 3 + gap * 2
    const startX = left + (contentWidth - totalWidth) / 2
    const centerY = y - blockH / 2

    // Utilidad: evita NaN en los textos
    // Extrae solo el número del texto, muestra '0' si no hay valor
    const extractNumber = (txt, fallback = "0") => {
      if (!txt || txt === "-" || txt === "—") return fallback;
      const match = String(txt).match(/[\d,.]+/);
      return match ? match[0] : fallback;
    }

    // ================= ROI (bloque 1) =================
    let x = startX
    const roiCenterX = x + blockW / 2
    const roiCenterY = centerY + blockH / 2

    page.drawEllipse({
      x: roiCenterX, // centro correcto
      y: roiCenterY, // centro correcto
      xScale: invCircleR,
      yScale: invCircleR,
      color: rgb(0.93, 0.98, 0.95),
      borderColor: rgb(0.15, 0.72, 0.3),
      borderWidth: 1.2,
    })

    const invValue = typeof _total === "number" ? fmtMXN(_total) : String(_total)
    const invValueSize = 9 // tamaño reducido para valores grandes
    const invValueW = widthOf(invValue, invValueSize, fontBold)
    page.drawText(invValue, {
      x: roiCenterX - invValueW / 2,
      y: roiCenterY - invValueSize / 2,
      size: invValueSize,
      font: fontBold,
      color: primeD,
    })

    // ROI texto a la derecha del círculo
    const roiTextX = roiCenterX + invCircleR + mm(4)
    page.drawText("ROI", {
      x: roiTextX,
      y: roiCenterY + fsBase + 2,
      size: fsBase,
      font: fontBold,
      color: ink,
    })
    page.drawText(`${datos.roi || "—"} años`, {
      x: roiTextX,
      y: roiCenterY - fsBase,
      size: fsBase,
      font,
      color: ink,
    })

    // ================= ÁRBOLES (bloque 2) =================
    x += blockW + gap
    const iconSize = mm(14)
    const iconHalf = iconSize / 2
    const iconY_arbol = centerY + blockH / 2 - iconHalf
    const iconX_arbol = x + blockW / 2 - iconHalf

    try {
      const imgBytes = await fetch('img/arbol.png').then(r => r.arrayBuffer())
      const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes))
      page.drawImage(imgEmbed, { x: iconX_arbol, y: iconY_arbol, width: iconSize, height: iconSize })
    } catch { }

    const kpiValueSize = 11; // mismo tamaño que Consumo Anual
    const arbolesValue = extractNumber(datos.arboles, "0");
    const tituloArbol = `${arbolesValue} árboles`;
    page.drawText(tituloArbol, {
      x: x + (blockW - widthOf(tituloArbol, kpiValueSize, fontBold)) / 2,
      y: iconY_arbol + iconSize + mm(2),
      size: kpiValueSize,
      font: fontBold,
      color: ink,
    })
    page.drawText("Árboles equiv.", {
      x: x + (blockW - widthOf("Árboles equiv.", fsSmall + 1, font)) / 2,
      y: iconY_arbol - mm(6), // debajo del ícono
      size: fsSmall + 1,
      font,
      color: mute,
    })

    // ================= CO2 (bloque 3) =================
    x += blockW + gap
    const iconY_co2 = centerY + blockH / 2 - iconHalf
    const iconX_co2 = x + blockW / 2 - iconHalf

    try {
      const imgBytes = await fetch('img/co2.png').then(r => r.arrayBuffer())
      const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes))
      page.drawImage(imgEmbed, { x: iconX_co2, y: iconY_co2, width: iconSize, height: iconSize })
    } catch { }

    const co2Value = extractNumber(datos.ahorroCO2, "0");
    const tituloCO2 = `${co2Value} t`;
    page.drawText(tituloCO2, {
      x: x + (blockW - widthOf(tituloCO2, kpiValueSize, fontBold)) / 2,
      y: iconY_co2 + iconSize + mm(2),
      size: kpiValueSize,
      font: fontBold,
      color: ink,
    })
    page.drawText("Ahorro CO2", {
      x: x + (blockW - widthOf("Ahorro CO2", fsSmall + 1, font)) / 2,
      y: iconY_co2 - mm(6), // debajo del ícono
      size: fsSmall + 1,
      font,
      color: mute,
    })

    // ================= mover cursor =================
    y = centerY - blockH / 2 + mm(18)

    // Tabla de cotización
    section("COTIZACIÓN")
    drawCotizacionMantenimiento()

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
    } catch (_) { }
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "application/pdf"
    input.onchange = () => {
      const file = input.files?.[0]
      if (!file) return reject(new Error("No se seleccionó archivo"))
      const reader = new FileReader()
      reader.onload = () => {
        basePdfBytes = reader.result
        resolve(basePdfBytes)
      }
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
    },
  }
  const has = (chart.config.plugins || []).some((p) => p.id === "avgLabelPDF")
  if (!has) chart.config.plugins = [...(chart.config.plugins || []), plugin]
  chart.update()
}
