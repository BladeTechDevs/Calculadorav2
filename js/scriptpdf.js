// ✅ Usa Acephimere en todo el PDF (OTF con fontkit)
async function exportToBasePdf() {
  const PDFLib = window.PDFLib;
  const { PDFDocument, rgb } = PDFLib;

  // === 0) UI de carga ===
  const loading = document.getElementById("loading");
  const loadingText = document.querySelector(".loading-text");
  const loadingSub = document.querySelector(".loading-subtext");
  if (loading) {
    loading.style.display = "flex";
    if (loadingText) loadingText.textContent = "Generando PDF";
    if (loadingSub) loadingSub.textContent = "Escribiendo en Base.pdf...";
  }

  try {
    // === 1) Recolección de datos ===
    const $ = (id) => document.getElementById(id);
    const getVal = (id, fb = "") => ($(id)?.value ?? fb).toString().trim();
    const getTxt = (id, fb = "") =>
      ($(id)?.textContent ?? fb).toString().trim();
    const toNum = (v) => {
      if (typeof v === "number") return v;
      if (!v) return 0;
      const s = String(v).replace(/[^\d.-]/g, "");
      const n = Number.parseFloat(s);
      return isNaN(n) ? 0 : n;
    };
    const fmtMXN = (n) =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 2,
      }).format(toNum(n));

    // Formateadores para PDF
    const fmtNum = (n, min = 0, max = 2) =>
      Number(toNum(n)).toLocaleString("es-MX", {
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      });
    const fmtPorc = (n, min = 2, max = 2) =>
      `${Number(toNum(n)).toLocaleString("es-MX", {
        minimumFractionDigits: min,
        maximumFractionDigits: max,
      })}%`;
    const fmtKwh = (n, min = 0, max = 2) => `${fmtNum(n, min, max)} kWh`;
    const fmtKwhDia = (n, min = 1, max = 1) => `${fmtNum(n, min, max)} kWh`;
    const fmtKW = (n, min = 2, max = 2) => `${fmtNum(n, min, max)} kW`;
    const fmtH = (n, min = 2, max = 2) => `${fmtNum(n, min, max)} h`;
    const fmtT = (n, min = 3, max = 3) => `${fmtNum(n, min, max)} t`;
    const fmtArboles = (n) => `${fmtNum(n, 0, 0)} árboles`;
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
      roi: (() => {
        // Busca el valor numérico real del ROI en localStorage si existe
        let roiNum = 0;
        try {
          const resultados = JSON.parse(
            localStorage.getItem("resultadosSistemaSolar") || "{}"
          );
          roiNum =
            Number(resultados?.resultados?.roi) || Number(resultados?.roi) || 0;
        } catch {}
        if (!roiNum) roiNum = Number(toNum(getVal("roi", "0"))) || 0;
        return `${Math.floor(roiNum).toLocaleString("es-MX")} años`;
      })(),
      // Métricas (cards)
      consumoAnual: fmtKwh(getTxt("consumoAnual").replace(/[^\d.,-]/g, "")),
      consumoMensual: fmtKwh(getTxt("consumoMensual").replace(/[^\d.,-]/g, "")),
      consumoDiario: fmtKwhDia(
        getTxt("consumoDiario").replace(/[^\d.,-]/g, "")
      ),
      importeTotal: fmtMXN(getTxt("importeTotal").replace(/[^\d.,-]/g, "")),
      importePromedio: fmtMXN(
        getTxt("importePromedio").replace(/[^\d.,-]/g, "")
      ),
      tarifaPromedio: `$${fmtNum(
        getTxt("tarifaPromedio").replace(/[^\d.,-]/g, ""),
        3,
        3
      )}`,
      potenciaNecesaria: fmtKW(
        getTxt("potenciaNecesaria").replace(/[^\d.,-]/g, "")
      ),
      numeroModulosCard: fmtNum(
        getTxt("numeroModulos").replace(/[^\d.,-]/g, ""),
        0,
        0
      ),
      generacionAnual: fmtKwh(
        getTxt("generacionAnual").replace(/[^\d.,-]/g, ""),
        2,
        2
      ),
      potenciaInstalada: fmtKW(
        getTxt("potenciaInstalada").replace(/[^\d.,-]/g, "")
      ),
      hsp: fmtH(getTxt("hsp").replace(/[^\d.,-]/g, "")),
      ahorroCO2: fmtT(getTxt("ahorroCO2").replace(/[^\d.,-]/g, "")),
      porcentajeAhorro: fmtPorc(
        getTxt("porcentajeAhorro").replace(/[^\d.,-]/g, "")
      ),
      tempMin: getTxt("tempMin", "-"),
      tempMax: getTxt("tempMax", "-"),
      arboles: fmtArboles(getTxt("arboles").replace(/[^\d.,-]/g, "")),
      potenciaPanel: getVal("potenciaPanel", "—"),
      areaAprox: getVal("areaAprox", "—"),
      notaProyecto: getVal("notaProyecto", "—"),
      requerimientosProyecto: getVal("requerimientosProyecto", "—"),
      inversorPanel: getVal("inversorPanel", "—"),
      folio: getVal("folioCotizacion", "—"),
      // Cotización
      numModulosInput: getVal("numeroModulos"),
      subtotalForm: toNum(getVal("subtotal", "0")),
      ivaForm: toNum(getVal("iva", "0")),
      totalForm: toNum(getVal("totalDisplay", "0")),
      subtotalDisplay: getVal("subtotalDisplay", "0"),
      ivaDisplay: getVal("ivaDisplay", "0"),
      totalDisplay: getVal("totalDisplay", "0"),
    };

    const datas = JSON.parse(localStorage.getItem("cotizacionPU2") || "{}");
    const datas2 = JSON.parse(localStorage.getItem("cotizacionPU") || "{}");
    const resultadoSistemaSolar = JSON.parse(
      localStorage.getItem("resultadosSistemaSolar") || "{}"
    );

    // Fallback por si subtotal/iva/total aún no se llenan
    const _subtotal = (datas.subtotal || 0) + (datas.profit || 0);
    const _iva = datas.iva ?? _subtotal * 0.16;
    const _total = datas.total ?? _subtotal + _iva;

    // === 2) Cargar Base.pdf ===
    const baseBytes = await obtenerBasePdfBytes();
    const pdfDoc = await PDFDocument.load(baseBytes);

    // === Tipografías Acephimere (.otf) con fontkit ===
    if (typeof fontkit === "undefined") {
      throw new Error(
        'fontkit no está cargado. Agrega <script src="https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.js"></script> después de pdf-lib.'
      );
    }
    pdfDoc.registerFontkit(fontkit);

    const loadOTF = async (path) => {
      const bytes = await fetch(path, { cache: "no-store" }).then((r) => {
        if (!r.ok) throw new Error("No se pudo cargar " + path);
        return r.arrayBuffer();
      });
      return pdfDoc.embedFont(new Uint8Array(bytes), { subset: true });
    };

    // 👇 Fuentes
    const font = await loadOTF("Acephimere/Acephimere.otf");
    const fontBold = await loadOTF("Acephimere/Acephimere Bold.otf");

    // === 3) Layout y paleta ===
    const mm = (v) => v * 2.834645669;
    const firstTop = mm(48);
    const nextTop = mm(25);
    const bottom = mm(18);
    const left = mm(12);
    const right = mm(12);

    let pageIndex = 0;
    let page = pdfDoc.getPage(pageIndex);
    let { width: PW, height: PH } = page.getSize();
    let contentWidth = PW - left - right;
    let y = PH - firstTop;

    // Colores
    const ink = rgb(0.12, 0.12, 0.12);
    const mute = rgb(0.45, 0.45, 0.45);
    const prime = rgb(0x1e / 255, 0x92 / 255, 0x4b / 255); // #1E924B
    const primeD = rgb(0x15 / 255, 0x72 / 255, 0x3a / 255);
    const primeL = rgb(0.93, 0.98, 0.95);
    const white = rgb(1, 1, 1);

    // Escalas
    const fsBase = 8;
    const fsSmall = 7;
    const fsKPI = 13;
    const fsTitle = 11;
    const lh = 12;

    const ensure = (h) => {
      if (y - h < bottom) newPage();
    };
    const newPage = () => {
      pageIndex++;
      if (pageIndex < pdfDoc.getPageCount()) page = pdfDoc.getPage(pageIndex);
      else page = pdfDoc.addPage([PW, PH]);
      const size = page.getSize();
      PW = size.width;
      PH = size.height;
      contentWidth = PW - left - right;
      y = PH - nextTop;
    };
    const drawFooter = () => {
      const text = `Página ${pageIndex + 1}`;
      page.drawText(text, {
        x: PW - right - font.widthOfTextAtSize(text, fsSmall),
        y: bottom - 9,
        size: fsSmall,
        font,
        color: mute,
      });
    };

    const widthOf = (t, size = fsBase, f = font) =>
      f.widthOfTextAtSize(String(t), size);
    const wrapText = (text, maxW, size = fsBase, f = font) => {
      const words = (text || "").toString().split(/\s+/);
      const lines = [];
      let line = "";
      for (const w of words) {
        const tryLine = line ? line + " " + w : w;
        if (widthOf(tryLine, size, f) <= maxW) line = tryLine;
        else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
      return lines.length ? lines : [""];
    };

    // ========= PANEL Información de los involucrados =========
    const iconCache = {};
    async function loadSvgAsPngBytes(src, wPx, hPx) {
      const svgText = await (await fetch(src, { cache: "no-store" })).text();
      const svgBlob = new Blob([svgText], { type: "image/svg+xml" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const img = new Image();
      await new Promise((res, rej) => {
        img.onload = res;
        img.onerror = rej;
        img.src = svgUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = wPx;
      canvas.height = hPx;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, wPx, hPx);
      URL.revokeObjectURL(svgUrl);
      const b64 = canvas.toDataURL("image/png").split(",")[1];
      const raw = atob(b64);
      const bytes = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
      return bytes;
    }
    async function getIconEmbedded(name, sizeMM = 5.0) {
      if (!iconCache[name]) {
        const px = Math.round(sizeMM * 4) * 2;
        const bytes = await loadSvgAsPngBytes(`img/${name}`, px, px);
        iconCache[name] = await pdfDoc.embedPng(bytes);
      }
      return iconCache[name];
    }

    async function drawInfoPanelWithIcons() {
      const padX = 14,
        padY = 12,
        titleH = 18,
        radius = 10,
        midGap = mm(6);
      const gridW = contentWidth - padX * 2 - midGap;
      const sepOffset = mm(8);
      const tempColW_L = gridW * 0.68;
      const sepX = left + padX + tempColW_L + midGap / 2 - sepOffset;
      const colW_L = sepX - (left + padX);
      const colW_R = gridW - colW_L;

      const rowLH_first = 11,
        rowLH_wrap = 10,
        gapSingle = 5,
        gapMulti = 4;

      const iconMM = 3.6,
        iconPad = 5,
        iconYOffset = 4;
      const labelColor = rgb(0.18, 0.18, 0.18);

      const leftRows = [
        {
          icon: "nombreCliente.svg",
          label: "Cliente",
          value: datos.nombreCliente || "—",
        },
        {
          icon: "direccion.svg",
          label: "Ubicación",
          value: `${datos.direccionCliente || "—"}`,
        },
        {
          icon: "telefono.svg",
          label: "Teléfono",
          value: datos.telefonoCliente || "—",
        },
        {
          icon: "correo.svg",
          label: "Correo",
          value: datos.correoCliente || "—",
        },
      ];
      const rightRows = [
        {
          icon: "nombreEjecutivo.svg",
          label: "Ejecutivo",
          value: datos.nombreEjecutivo || "—",
        },
        {
          icon: "correo.svg",
          label: "Correo",
          value: datos.correoEjecutivo || "—",
        },
        {
          icon: "whatsapp.svg",
          label: "Contacto",
          value: datos.whatsappEjecutivo || "—",
        },
      ];

      const measureRowsHeight = (rows, colW) => {
        let total = 0;
        rows.forEach((r) => {
          const iconW = mm(iconMM) + iconPad;
          const lbl = r.label + ": ";
          const lblW = widthOf(lbl, fsBase, fontBold);
          const textW = colW - iconW - lblW;
          const lines = wrapText(String(r.value || "—"), textW, fsBase, font);
          const cellH =
            rowLH_first + (Math.max(1, lines.length) - 1) * rowLH_wrap;
          const gap = lines.length > 1 ? gapMulti : gapSingle;
          total += cellH + gap;
        });
        if (rows.length) {
          const last = rows[rows.length - 1];
          const iconW = mm(iconMM) + iconPad;
          const lblW = widthOf(last.label + ": ", fsBase, fontBold);
          const textW = colW - iconW - lblW;
          const lns = wrapText(String(last.value || "—"), textW, fsBase, font);
          total -= lns.length > 1 ? gapMulti : gapSingle;
        }
        return total;
      };

      const bodyH = Math.max(
        measureRowsHeight(leftRows, colW_L),
        measureRowsHeight(rightRows, colW_R)
      );
      const H = padY + titleH + bodyH + padY / 3;
      ensure(H + 6);

      // contenedor
      page.drawRectangle({
        x: left,
        y: y - H,
        width: contentWidth,
        height: H,
        color: white,
        borderColor: primeD,
        borderWidth: 1,
        borderRadius: radius,
      });

      // encabezado
      page.drawRectangle({
        x: left,
        y: y - titleH,
        width: contentWidth,
        height: titleH,
        color: primeD,
        borderRadius: radius,
      });
      page.drawText("Información de los involucrados", {
        x: left + 8,
        y: y - 14,
        size: fsBase,
        font: fontBold,
        color: white,
      });

      // separador vertical
      page.drawLine({
        start: { x: sepX, y: y - titleH - 2 },
        end: { x: sepX, y: y - H + padY + 2 },
        thickness: 0.5,
        color: primeL,
      });

      const drawColumn = async (rows, baseX, colWUse) => {
        let yy = y - titleH - 14;
        for (const r of rows) {
          const icon = await getIconEmbedded(r.icon, iconMM);
          const iconW = mm(iconMM),
            iconH = mm(iconMM);

          const lbl = r.label + ": ";
          const lblW = widthOf(lbl, fsBase, fontBold);
          const textStartX = baseX + iconW + iconPad + lblW;
          const textW = colWUse - (iconW + iconPad + lblW);
          const lines = wrapText(String(r.value || "—"), textW, fsBase, font);

          const rowTop = yy;
          page.drawImage(icon, {
            x: baseX,
            y: rowTop - iconH + (rowLH_first - fsBase) / 2 + 1 + iconYOffset,
            width: iconW,
            height: iconH,
          });
          page.drawText(lbl, {
            x: baseX + iconW + iconPad,
            y: rowTop - 1,
            size: fsBase,
            font: fontBold,
            color: labelColor,
          });
          page.drawText(lines[0] || "", {
            x: textStartX,
            y: rowTop - 1,
            size: fsBase,
            font,
            color: ink,
          });

          let innerY = rowTop - rowLH_first;
          for (let i = 1; i < lines.length; i++) {
            page.drawText(lines[i], {
              x: textStartX,
              y: innerY - 1,
              size: fsBase,
              font,
              color: ink,
            });
            innerY -= rowLH_wrap;
          }
          const gap = lines.length > 1 ? gapMulti : gapSingle;
          yy = innerY - gap;
        }
      };

      await drawColumn(leftRows, left + padX - mm(2), colW_L);
      await drawColumn(
        rightRows,
        left + padX + colW_L + midGap - mm(3),
        colW_R
      );

      y -= H + 6;
    }

    // 2-3 columnas compactas (helper)
    const drawCols = (pairs, colsOverride = 2) => {
      const gap = mm(5);
      const cols = Math.min(colsOverride, pairs.length);
      const colW = (contentWidth - gap * (cols - 1)) / cols;

      const headerH = 14,
        bodyPad = 6,
        lhCompact = 10,
        radius = 6;
      const heights = pairs.map(([label, value]) => {
        const lines = wrapText(
          String(value ?? "—"),
          colW - bodyPad * 2,
          fsBase,
          font
        );
        return headerH + bodyPad * 2 + lhCompact * lines.length;
      });
      const H = Math.max(...heights);
      ensure(H + 4);

      const drawCard = (x, label, value) => {
        const yTop = y;
        page.drawRectangle({
          x,
          y: yTop - H,
          width: colW,
          height: H,
          color: white,
          borderColor: prime,
          borderWidth: 0.35,
          borderRadius: radius,
        });
        page.drawRectangle({
          x,
          y: yTop - headerH,
          width: colW,
          height: headerH,
          color: primeL,
          borderRadius: radius,
        });

        page.drawText(label, {
          x: x + bodyPad,
          y: yTop - headerH + (headerH - fsBase) / 2,
          size: fsBase,
          font: fontBold,
          color: primeD,
        });

        const lines = wrapText(
          String(value ?? "—"),
          colW - bodyPad * 2,
          fsBase,
          font
        );
        const textH = lhCompact * lines.length;
        const availableH = H - headerH;
        const valuePadTop = 6.5;
        let yy = yTop - headerH - (availableH - textH) / 2 - valuePadTop;

        lines.forEach((line) => {
          page.drawText(line, {
            x: x + bodyPad,
            y: yy,
            size: fsBase,
            font,
            color: ink,
          });
          yy -= lhCompact;
        });
      };

      pairs.slice(0, cols).forEach(([label, value], idx) => {
        const x = left + idx * (colW + gap);
        drawCard(x, label, value);
      });

      y -= H + 4;
    };

    // === Gráficas (canvas → PNG) ===
    const delay = (ms) => new Promise((r) => setTimeout(r, ms));
    async function withTempCanvasSize(canvas, wPx, hPx, fn) {
      const prevW = canvas.style.width,
        prevH = canvas.style.height;
      canvas.style.width = wPx + "px";
      canvas.style.height = hPx + "px";
      await new Promise((r) =>
        requestAnimationFrame(() => requestAnimationFrame(r))
      );
      if (typeof canvas.__impactoRedraw === "function") {
        canvas.__impactoRedraw();
        await delay(30);
      }
      const out = await fn();
      canvas.style.width = prevW;
      canvas.style.height = prevH;
      if (typeof canvas.__impactoRedraw === "function")
        canvas.__impactoRedraw();
      return out;
    }
    const drawCanvasImageIfAny2 = async (
      canvasId,
      widthMM,
      heightMM,
      dpi = 300
    ) => {
      const src = document.getElementById(canvasId);
      if (!src) return;
      const pxPerMM = dpi / 25.4;
      const outW = Math.max(1, Math.round(widthMM * pxPerMM));
      const outH = Math.max(1, Math.round(heightMM * pxPerMM));
      const Chart = window.Chart;
      let dataUrl;

      if (Chart && Chart.getChart) {
        const srcChart = Chart.getChart(src);
        if (srcChart) {
          const off = document.createElement("canvas");
          off.width = outW;
          off.height = outH;
          const cfg = JSON.parse(JSON.stringify(srcChart.config));
          cfg.options = cfg.options || {};
          cfg.options.animation = false;
          cfg.options.responsive = false;
          cfg.options.maintainAspectRatio = false;
          cfg.options.devicePixelRatio = Math.max(2, Math.ceil(dpi / 96));
          const tmpChart = new Chart(off.getContext("2d"), cfg);
          tmpChart.resize(outW, outH);
          tmpChart.update();
          dataUrl = off.toDataURL("image/png");
          tmpChart.destroy();
        }
      }
      if (!dataUrl && canvasId === "impactoChart") {
        dataUrl = await withTempCanvasSize(src, 1100, 360, async () =>
          src.toDataURL("image/png", 1)
        );
      }
      if (!dataUrl) {
        dataUrl = await withTempCanvasSize(src, 1200, 360, async () => {
          if (typeof src.__impactoRedraw === "function") src.__impactoRedraw();
          await delay(20);
          return src.toDataURL("image/png", 1);
        });
      }

      const b64 = dataUrl.split(",")[1];
      const raw = atob(b64);
      const arr = new Uint8Array(raw.length);
      for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);

      const png = await pdfDoc.embedPng(arr);
      const w = mm(widthMM),
        h = mm(heightMM);
      ensure(h + 6);
      const xCentered = left + (contentWidth - w) / 2;
      page.drawImage(png, { x: xCentered, y: y - h, width: w, height: h });
      y -= h + 10;
    };

    // === Términos y condiciones ===
    function drawTerms() {
      const items = [
        "La actual cotización es PRELIMINAR, previa a un levantamiento técnico a detalle (precio sujeto a cambio).",
        "El suministro de equipos es proporcionado por el contratista con entrega en sitio (estructura, inversor, módulos).",
        "Facturación: 70% de anticipo de trabajos y 30% antes de concluir operaciones.",
        "En caso de cancelación de servicio ya pagado, existe penalización del 35%.",
        "No incluye: modificaciones en sitio, impermeabilización, evaluación de estructura, reubicación de instalaciones previas, gestiones adicionales con CFE, aumentos de carga, modificación de tarifa, transformador y adecuación de instalación eléctrica.",
        "Incluye: módulos fotovoltaicos, microinversores, estructura, material eléctrico del sistema hasta 16 m al punto de interconexión, tuberías, cableado, protecciones, gabinetes y conectores, sistema de monitoreo, gestión con CFE, carpeta de proyecto, mano de obra e instalación, arreglo FV, ingeniería básica y a detalle.",
        // "Precios sujetos a cambios sin previo aviso por posibles incrementos de aranceles (hasta 25%).",
        // "La presente considera estructura simple de aluminio, sin refuerzos ni seguros por siniestros o eventualidades naturales (p. ej., huracanes).",
        // "Para generar la orden se requiere el 70% del pago de la cotización.",
        "Considerar adicionales como seguro especializado para el sistema, equipos y materiales de categoría premium y/o sujeciones extra para resistencia en temporada de huracanes.",
      ];
      const fsTiny = 7,
        lhTiny = 10,
        pad = 8;
      const maxW = contentWidth - pad * 2;
      const titleH = 16;
      const folioText = `Folio: SFVI-${datos.folio || "—"}`;
      ensure(titleH + 8);

      const folioW = widthOf(folioText, fsBase, fontBold) + 20;
      page.drawRectangle({
        x: left,
        y: y - titleH,
        width: folioW,
        height: titleH,
        color: rgb(1, 0.7, 0),
      });
      page.drawText(folioText, {
        x: left + 6,
        y: y - 12,
        size: fsBase,
        font: fontBold,
        color: rgb(0, 0, 0),
      });

      const title = "TÉRMINOS Y CONDICIONES";
      const titleX = left + folioW + 4;
      const titleW = contentWidth - folioW - 4;
      page.drawRectangle({
        x: titleX,
        y: y - titleH,
        width: titleW,
        height: titleH,
        color: primeD,
      });
      const tw = widthOf(title, fsBase, fontBold);
      page.drawText(title, {
        x: titleX + (titleW - tw) / 2,
        y: y - 12,
        size: fsBase,
        font: fontBold,
        color: white,
      });

      y -= titleH + 4;

      let totalLines = 0;
      const wrapped = items.map((t, i) => {
        const prefix = `${i + 1}. `;
        const lines = wrapText(prefix + t, maxW, fsTiny, font);
        totalLines += lines.length;
        return lines;
      });
      const boxH = pad + totalLines * lhTiny + pad;
      ensure(boxH);
      page.drawRectangle({
        x: left,
        y: y - boxH,
        width: contentWidth,
        height: boxH,
        color: rgb(0.94, 0.98, 0.96),
        borderColor: prime,
        borderWidth: 0.4,
        borderRadius: 6,
      });

      // 🔧 yy se declara ANTES de usarse
      let yy = y - pad - fsTiny;

      wrapped.forEach((lines) => {
        lines.forEach((line) => {
          page.drawText(line, {
            x: left + pad,
            y: yy,
            size: fsTiny,
            font,
            color: ink,
          });
          yy -= lhTiny;
        });
      });
      y -= boxH;

      // --- Notas y Requerimientos ---
      const nota = datos.notaProyecto || "—";
      const requerimientos = datos.requerimientosProyecto || "—";

      const notaLabel = "Notas:";
      const notaLabelW = widthOf(notaLabel, fsTiny, fontBold);
      const notaLines = wrapText(nota, maxW - notaLabelW - 6, fsTiny, font);
      yy = y - pad - fsTiny;
      page.drawText(notaLabel, {
        x: left + pad,
        y: yy,
        size: fsTiny,
        font: fontBold,
        color: ink,
      });
      let notaX = left + pad + notaLabelW + 6;
      let notaY = yy;
      notaLines.forEach((line) => {
        page.drawText(line, {
          x: notaX,
          y: notaY,
          size: fsTiny,
          font: font,
          color: ink,
        });
        notaX = left + pad;
        notaY -= lhTiny - 2;
      });
      yy = notaY - 4;

      const reqLabel = "Requerimientos:";
      const reqLabelW = widthOf(reqLabel, fsTiny, fontBold);
      const reqLines = wrapText(
        requerimientos,
        maxW - reqLabelW - 6,
        fsTiny,
        font
      );
      page.drawText(reqLabel, {
        x: left + pad,
        y: yy,
        size: fsTiny,
        font: fontBold,
        color: ink,
      });
      let reqX = left + pad + reqLabelW + 6;
      let reqY = yy;
      reqLines.forEach((line) => {
        page.drawText(line, {
          x: reqX,
          y: reqY,
          size: fsTiny,
          font: font,
          color: ink,
        });
        reqX = left + pad;
        reqY -= lhTiny - 2;
      });
      y = reqY - pad;
    }

    // === Tabla Cotización (centrada) ===
    function drawCotizacionMantenimiento() {
      const fmt = (n) =>
        `$${(Number(n) || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`;
      const centerX = (x0, wCol, txt, size = fsBase, fnt = font) =>
        x0 + (wCol - widthOf(txt, size, fnt)) / 2;

      const numModulos = datos.numeroModulosCard || "—";
      const potenciaPanel = datos.potenciaPanel || "—";

      const subtotalPU = _subtotal;
      const ivaPU = _iva;
      const totalPU = _total;

      const headH = 20,
        rowH = 22,
        gapBelow = 12;
      const W = contentWidth;
      const col = {
        partida: Math.round(W * 0.1),
        desc: Math.round(W * 0.48),
        cant: Math.round(W * 0.12),
        pu: Math.round(W * 0.15),
        imp: Math.round(W * 0.15),
      };
      const X = {
        partida: left,
        desc: left + col.partida,
        cant: left + col.partida + col.desc,
        pu: left + col.partida + col.desc + col.cant,
        imp: left + col.partida + col.desc + col.cant + col.pu,
        end: left + W,
      };

      // Header
      page.drawRectangle({
        x: left,
        y: y - headH,
        width: W,
        height: headH,
        color: primeD,
        borderColor: primeD,
        borderWidth: 1.2,
      });
      const thY = y - 14;
      page.drawText("Partida", {
        x: centerX(X.partida, col.partida, "Partida", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: white,
      });
      page.drawText("Descripción", {
        x: centerX(X.desc, col.desc, "Descripción", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: white,
      });
      page.drawText("Cantidad", {
        x: centerX(X.cant, col.cant, "Cantidad", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: white,
      });
      page.drawText("P.U.", {
        x: centerX(X.pu, col.pu, "P.U.", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: white,
      });
      page.drawText("Importe", {
        x: centerX(X.imp, col.imp, "Importe", fsBase, fontBold),
        y: thY,
        size: fsBase,
        font: fontBold,
        color: white,
      });

      ["partida", "desc", "cant", "pu", "imp", "end"].forEach((k) => {
        page.drawLine({
          start: { x: X[k], y: y - headH },
          end: { x: X[k], y: y - headH - rowH },
          thickness: 1.2,
          color: primeD,
        });
      });
      y -= headH;

      // Row
      page.drawRectangle({
        x: left,
        y: y - rowH,
        width: W,
        height: rowH,
        color: white,
        borderColor: primeD,
        borderWidth: 0.8,
      });
      ["partida", "desc", "cant", "pu", "imp", "end"].forEach((k) => {
        page.drawLine({
          start: { x: X[k], y },
          end: { x: X[k], y: y - rowH },
          thickness: 0.8,
          color: primeD,
        });
      });

      const desc = `Instalación ${numModulos || "—"} MFV de ${
        potenciaPanel || "—"
      } W`;
      const yy = y - 14;
      page.drawText("1", {
        x: centerX(X.partida, col.partida, "1", fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      });
      page.drawText(desc, {
        x: centerX(X.desc, col.desc, desc, fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      });
      page.drawText("1", {
        x: centerX(X.cant, col.cant, "1", fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      });
      const puTxt = fmt(subtotalPU);
      const impTxt = fmt(subtotalPU);
      page.drawText(puTxt, {
        x: centerX(X.pu, col.pu, puTxt, fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      });
      page.drawText(impTxt, {
        x: centerX(X.imp, col.imp, impTxt, fsBase, font),
        y: yy,
        size: fsBase,
        font,
        color: ink,
      });

      y -= rowH + gapBelow;

      // Totales (derecha)
      const gapX = mm(6);
      const leftW = Math.round(W * 0.58);
      const rightW = W - leftW - gapX;

      const rightX = left + leftW + gapX;
      const rowTH = 20;
      const totalBoxH = rowTH * 3;

      page.drawRectangle({
        x: rightX,
        y: y - totalBoxH,
        width: rightW,
        height: totalBoxH,
        color: white,
        borderColor: primeD,
        borderWidth: 0.8,
      });

      const labels = ["Subtotal", "IVA", "Total"];
      const values = [
        `$${(Number(_subtotal) || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `$${(Number(_iva) || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
        `$${(Number(_total) || 0).toLocaleString("es-MX", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })}`,
      ];
      const centerText = (x0, w, text, size, fnt) =>
        x0 + (w - widthOf(text, size, fnt)) / 2;

      for (let i = 0; i < 3; i++) {
        const yRowTop = y - i * rowTH;
        const labelW = Math.round(rightW * 0.55);
        const isTotal = i === 2;

        let labelColor, labelTextColor, valueColor, valueTextColor;
        if (isTotal) {
          labelColor = rgb(0.933, 0.961, 0.153);
          labelTextColor = ink;
          valueColor = rgb(0.933, 0.961, 0.153);
          valueTextColor = ink;
        } else {
          labelColor = white;
          labelTextColor = ink;
          valueColor = white;
          valueTextColor = ink;
        }
        page.drawRectangle({
          x: rightX,
          y: yRowTop - rowTH,
          width: labelW,
          height: rowTH,
          color: labelColor,
          borderColor: primeD,
          borderWidth: 0.8,
        });
        const lfSize = isTotal ? fsBase + 3 : fsBase;
        page.drawText(labels[i], {
          x: centerText(rightX, labelW, labels[i], lfSize, fontBold),
          y: yRowTop - 14,
          size: lfSize,
          font: fontBold,
          color: labelTextColor,
        });

        const vx = rightX + labelW;
        page.drawRectangle({
          x: vx,
          y: yRowTop - rowTH,
          width: rightW - labelW,
          height: rowTH,
          color: valueColor,
          borderColor: primeD,
          borderWidth: 0.8,
        });
        const vSize = isTotal ? fsBase + 1 : fsBase;
        const txt = values[i];
        page.drawText(txt, {
          x: centerText(
            vx,
            rightW - labelW,
            txt,
            vSize,
            isTotal ? fontBold : font
          ),
          y: yRowTop - 14,
          size: vSize,
          font: isTotal ? fontBold : font,
          color: valueTextColor,
        });
      }

      y -= Math.max(30, totalBoxH) + 10;
    }
    
    // --- Tarjetas "Tu sistema solar" ---
    async function drawSistemaSolarSection() {
      const items = [
        {
          img: "panel.png",
          value: datos.numeroModulosCard
        ? Number(datos.numeroModulosCard).toLocaleString("es-MX", { maximumFractionDigits: 0 })
        : "—",
          title: "Paneles Solares",
        },
        {
          img: "potencia.png",
          value: datos.potenciaInstalada,
          title: "Potencia Total Instalada",
        },
        {
          img: "porcentaje.png",
          value: datos.porcentajeAhorro
        ? parseInt(datos.porcentajeAhorro, 10) + "%"
        : "—%",
          title: "de Ahorro",
        },
        {
          img: "area.png",
          value: datos.areaAprox
        ? parseInt(datos.areaAprox, 10) + " m2"
        : "— m2",
          title: "Área Requerida",
        },
      ];

      const cols = items.length;
      const gap = mm(6);
      const colW = (contentWidth - gap * (cols - 1)) / cols;
      const imgMM = 13;
      const valueSize = fsKPI;
      const titleSize = fsSmall + 1;
      const blockH = mm(imgMM) + 32;
      ensure(blockH + 8);
      const startX = left;

      for (let i = 0; i < cols; i++) {
        const x = startX + i * (colW + gap);
        const iconW = mm(imgMM),
          iconH = mm(imgMM);
        const cardTopY = y,
          cardCenterX = x + colW / 2;

        try {
          const imgBytes = await fetch(`img/${items[i].img}`).then((r) =>
            r.arrayBuffer()
          );
          const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes));
          page.drawImage(imgEmbed, {
            x: cardCenterX - iconW / 2,
            y: cardTopY - iconH,
            width: iconW,
            height: iconH,
          });
        } catch {}
        const v = String(items[i].value ?? "—");
        const vWidth = widthOf(v, valueSize, fontBold);
        page.drawText(v, {
          x: cardCenterX - vWidth / 2,
          y: cardTopY - iconH - 16,
          size: valueSize,
          font: fontBold,
          color: ink,
        });
        const tWidth = widthOf(items[i].title, titleSize, fontBold);
        page.drawText(items[i].title, {
          x: cardCenterX - tWidth / 2,
          y: cardTopY - iconH - 10 - valueSize - 8,
          size: titleSize,
          font: fontBold,
          color: ink,
        });
      }
      y -= blockH;
    }

    // === NUEVA SECCIÓN INVERSIÓN: 4 cards iguales (más compactas) y línea central ===
    async function drawInvestSplitKPIs() {
      async function embedAny(path, sizeMM) {
        if (path.toLowerCase().endsWith(".svg")) {
          const px = Math.round(sizeMM * 4) * 2;
          const bytes = await loadSvgAsPngBytes(`img/${path}`, px, px);
          return pdfDoc.embedPng(bytes);
        } else {
          const bytes = await fetch(`img/${path}`).then((r) => r.arrayBuffer());
          return pdfDoc.embedPng(new Uint8Array(bytes));
        }
      }

      // Estilos compactos
      const imgMM = 13; // mismo tamaño de icono
      const valueSize = fsKPI; // mismo tamaño de valor
      const titleSize = fsSmall + 1; // mismo tamaño de título

      // Más compactas (menos altas y menos anchas) y títulos más cercanos
      const pad = 6;
      const iconToValue = 16;
      const valueToTitle = 6;

      // Grid con 4 columnas iguales, pero limitamos el ancho de cada card
      const gap = mm(15);
      const colW = (contentWidth - gap * 3) / 4;
      const cardW = Math.min(colW, mm(38));
      const gridW = cardW * 4 + gap * 3;
      const startX = left + (contentWidth - gridW) / 2;

      // Línea central más gruesa
      const dividerX = left + contentWidth / 2;
      const barW = mm(1.8);

      const cardH =
        pad +
        mm(imgMM) +
        iconToValue +
        valueSize +
        valueToTitle +
        titleSize +
        pad;
      ensure(cardH + 8);

      // Valores
      const subtotalStr = fmtMXN(_subtotal);
      const roiNum = parseFloat(
        window.resultadoSistemaSolar?.roi ?? resultadoSistemaSolar?.roi
      );
      const roiVal = Number.isFinite(roiNum)
        ? `${Math.floor(roiNum).toLocaleString("es-MX")} años`
        : "—";
      const arbolesNum = (String(datos.arboles ?? "0").match(/[\d,.]+/) || [
        "0",
      ])[0];
      const co2Num = Number(
        (String(datos.ahorroCO2 ?? "0").match(/[\d,.]+/) || ["0"])[0]
      ).toFixed(2);

      const items = [
        { img: "cochi.png", value: subtotalStr, title: "Inversión (+ IVA)" },
        { img: "retorno.svg", value: roiVal, title: "ROI" },
        {
          img: "arbol.png",
          value: `${arbolesNum} árboles`,
          title: "Árboles equivalentes",
        },
        { img: "co2.png", value: `${co2Num} t`, title: "Ahorro CO2" },
      ];

      // Línea central (cae justo entre la 2ª y 3ª card)
      // page.drawRectangle({
      //   x: dividerX - barW / 2,
      //   y: y - cardH + 4,
      //   width: barW,
      //   height: cardH - 8,
      //   color: primeL,
      // });

      // Render de 4 cards
      for (let i = 0; i < 4; i++) {
        const x = startX + i * (cardW + gap);
        const yTop = y;
        const cx = x + cardW / 2;

        // // card con borde y barra superior
        // page.drawRectangle({
        //   x: x + 1, y: yTop - cardH - 1, width: cardW, height: cardH,
        //   color: primeD, opacity: 0.05, borderOpacity: 0, borderRadius: 10,
        // });
        // page.drawRectangle({
        //   x, y: yTop - cardH, width: cardW, height: cardH,
        //   color: white, borderColor: primeD, borderWidth: 0.8, borderRadius: 10,
        // });
        // page.drawRectangle({
        //   x, y: yTop - 3, width: cardW, height: 3,
        //   color: primeL, borderRadius: 10,
        // });

        // icono
        try {
          const icon = await embedAny(items[i].img, imgMM);
          const iw = mm(imgMM),
            ih = mm(imgMM);
          page.drawImage(icon, {
            x: cx - iw / 2,
            y: yTop - pad - ih,
            width: iw,
            height: ih,
          });
        } catch {}

        // valor
        const v = String(items[i].value ?? "—");
        const vW = fontBold.widthOfTextAtSize(v, valueSize);
        page.drawText(v, {
          x: cx - vW / 2,
          y: yTop - pad - mm(imgMM) - iconToValue,
          size: valueSize,
          font: fontBold,
          color: ink,
        });

        // título más cercano al valor
        const tW = fontBold.widthOfTextAtSize(items[i].title, titleSize);
        page.drawText(items[i].title, {
          x: cx - tW / 2,
          y: yTop - pad - mm(imgMM) - iconToValue - valueSize - valueToTitle,
          size: titleSize,
          font: fontBold,
          color: ink,
        });
      }

      y -= cardH + mm(10);
    }

    // === 4) Composición ===
    const folioFontSize = Math.max(10, fsTitle - 4);
    const sectionTopTitle = (
      txt,
      useBold = false,
      size = fsTitle,
      extraY = 0
    ) => {
      const h = size + 2;
      const padY = 2;
      ensure(h + 6);
      page.drawText(txt, {
        x:
          left +
          contentWidth -
          widthOf(txt, size, useBold ? fontBold : font) -
          mm(5),
        y: y - h + padY + extraY,
        size,
        font: useBold ? fontBold : font,
      });
      y -= h + 4;
    };
    const section = (txt) => {
      const padY = 2;
      const sectionSize = fsTitle + 2;
      const h = sectionSize + padY * 1.2;
      ensure(h + 8);
      page.drawText(txt, {
        x: left,
        y: y - h + padY,
        size: sectionSize,
        font: fontBold,
        color: primeD,
      });
      y -= h + 8;
    };

    sectionTopTitle(
      `COTIZACIÓN PRELIMINAR  -  SFVI-${datos.folio || "—"}`,
      true,
      folioFontSize,
      mm(6)
    );
    y -= mm(2);

    await drawInfoPanelWithIcons();

    y -= mm(5);
    const capitalizeFirst = (s) =>
      s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : "—";
    section("DATOS DEL PROYECTO");
    y -= mm(4);

    const datosProyecto = [
      [
        "Ubicación:",
        `${datos.municipioProyecto || "—"}, ${datos.estadoProyecto || "—"}`,
      ],
      ["Clasificación:", capitalizeFirst(datos.tipoProyecto)],
      ["Tarifa:", datos.tipoTarifa || "—"],
      ["Región CFE:", capitalizeFirst(datos.regionTarifariaCFE)],
    ];

    const datosX = left;
    const datosY = y;
    const rowLH_first = 15.5;
    const gapSingle = mm(1.8);
    let tempY = datosY;
    datosProyecto.forEach(([label, value]) => {
      const labelW = widthOf(label, fsBase, fontBold);
      const displayValue = label.trim().toLowerCase().startsWith("tarifa")
        ? String(value).toUpperCase()
        : value;
      page.drawText(label, {
        x: datosX,
        y: tempY,
        size: fsBase,
        font: fontBold,
        color: ink,
      });
      page.drawText(displayValue, {
        x: datosX + labelW + gapSingle,
        y: tempY,
        size: fsBase,
        font,
        color: ink,
      });
      tempY -= rowLH_first;
    });

    // KPI “Datos del proyecto”
    const datosKPI = [
      {
        label: "Consumo Anual",
        value: datos.consumoAnual,
        img: "consumoAnual.png",
      },
      {
        label: "Gasto Anual",
        value:
          typeof datos.importeTotal === "string"
            ? datos.importeTotal
            : fmtMXN(datos.importeTotal),
        img: "gastoAnual.png",
      },
      {
        label: "Tarifa Promedio",
        value: datos.tarifaPromedio,
        img: "tarifaPromedio.png",
      },
    ];

    let kpiW = mm(22),
      kpiGap = mm(45);
    const imgMM_KPI = 13,
      kpiValueSize = fsKPI,
      kpiTitleSize = fsSmall + 1;

    const kpiXStart = left + mm(85);
    const areaWidth = mm(105);
    let totalKPIWidth = datosKPI.length * kpiW + (datosKPI.length - 1) * kpiGap;
    if (totalKPIWidth > areaWidth) {
      const minGap = mm(6);
      if (datosKPI.length > 1) {
        const over = totalKPIWidth - areaWidth;
        const reducible = Math.max(0, kpiGap - minGap);
        const reducePerGap = Math.min(reducible, over / (datosKPI.length - 1));
        kpiGap -= reducePerGap;
      }
      totalKPIWidth = datosKPI.length * kpiW + (datosKPI.length - 1) * kpiGap;
      if (totalKPIWidth > areaWidth) {
        const scale = areaWidth / totalKPIWidth;
        kpiW *= scale;
        totalKPIWidth = datosKPI.length * kpiW + (datosKPI.length - 1) * kpiGap;
      }
    }
    const offsetX = kpiXStart + (areaWidth - totalKPIWidth) / 2;

    const lastDatoBaselineY = datosY - rowLH_first * (datosProyecto.length - 1);
    const blockBottomFromTop = mm(imgMM_KPI) + (10 + kpiValueSize + 8);
    let kpiYStart = lastDatoBaselineY + blockBottomFromTop;
    const blockH_KPI = blockBottomFromTop;
    ensure(blockH_KPI + 8);

    for (let i = 0; i < datosKPI.length; i++) {
      const kpi = datosKPI[i];
      const baseX = offsetX + i * (kpiW + kpiGap);
      const cardTopY = kpiYStart;
      const centerX = baseX + kpiW / 2;

      try {
        const imgBytes = await fetch(`img/${kpi.img}`).then((r) =>
          r.arrayBuffer()
        );
        const imgEmbed = await pdfDoc.embedPng(new Uint8Array(imgBytes));
        const iconW = mm(imgMM_KPI),
          iconH = mm(imgMM_KPI);
        page.drawImage(imgEmbed, {
          x: centerX - iconW / 2,
          y: cardTopY - iconH,
          width: iconW,
          height: iconH,
        });
      } catch {}

      const v = String(kpi.value ?? "—");
      const vW = widthOf(v, kpiValueSize, fontBold);
      page.drawText(v, {
        x: centerX - vW / 2,
        y: cardTopY - mm(imgMM_KPI) - 16,
        size: kpiValueSize,
        font: fontBold,
        color: ink,
      });

      const tW = widthOf(kpi.label, kpiTitleSize, fontBold);
      page.drawText(kpi.label, {
        x: centerX - tW / 2,
        y: cardTopY - mm(imgMM_KPI) - 10 - kpiValueSize - 8,
        size: kpiTitleSize,
        font: fontBold,
        color: ink,
      });
    }

    const kpiBottomY = kpiYStart - blockBottomFromTop;
    y = Math.min(tempY, kpiBottomY - mm(13));

    y += mm(4);
    section("TU SISTEMA SOLAR");
    y -= mm(3);
    await drawSistemaSolarSection();
    let espacioPanelY = y;
    y = espacioPanelY - mm(3);

    await drawCanvasImageIfAny2("impactoChart", 180, 85);

    // ===== Página 2 =====
    newPage();
    // súbela ~9 mm
    y += mm(9);
    section("INVERSIÓN");
    y -= mm(1);

    await drawInvestSplitKPIs();

    // Tabla de cotización
    section("COTIZACIÓN");
    drawCotizacionMantenimiento();

    // Términos
    drawTerms();

    // === 5) Guardar y descargar ===
    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `HexaSolar_Cotizacion_${(
      datos.nombreCliente || "Cliente"
    ).replace(/\s+/g, "_")}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error generando PDF base:", err);
    alert(
      "No se pudo generar el PDF. Revisa que 'Base.pdf' exista y que fontkit esté cargado."
    );
  } finally {
    if (loading) loading.style.display = "none";
  }
}

// ==== Cache de Base.pdf + fallback sin CORS ====
let basePdfBytes = null;
async function obtenerBasePdfBytes() {
  if (basePdfBytes) return basePdfBytes;
  if (location.protocol === "http:" || location.protocol === "https:") {
    try {
      const resp = await fetch("Base.pdf", { cache: "no-store" });
      if (!resp.ok) throw new Error("HTTP " + resp.status);
      basePdfBytes = await resp.arrayBuffer();
      return basePdfBytes;
    } catch (_) {}
  }
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No se seleccionó archivo"));
      const reader = new FileReader();
      reader.onload = () => {
        basePdfBytes = reader.result;
        resolve(basePdfBytes);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsArrayBuffer(file);
    };
    input.click();
  });
}

/** Etiqueta "Promedio anual" para Chart.js (solo canvas) */
function shiftAverageLabelDown(canvas) {
  const Chart = window.Chart;
  if (!Chart || !Chart.getChart) return;
  const chart = Chart.getChart(canvas);
  if (!chart) return;

  const pad = chart.options.layout?.padding;
  if (typeof pad === "number") {
    chart.options.layout.padding = {
      top: pad,
      right: pad,
      bottom: Math.max(28, pad),
      left: pad,
    };
  } else {
    chart.options.layout = chart.options.layout || {};
    chart.options.layout.padding = Object.assign({}, pad, {
      bottom: Math.max(28, (pad && pad.bottom) || 0),
    });
  }

  const data = chart.data?.datasets?.[0]?.data || [];
  const avg = data.length
    ? data.reduce((a, b) => a + (Number(b) || 0), 0) / data.length
    : null;
  const text =
    avg != null ? `Promedio anual: ${avg.toFixed(3)} kWh/m²/día` : "";

  const plugin = {
    id: "avgLabelPDF",
    afterDatasetsDraw(c) {
      if (!text) return;
      const { ctx, chartArea } = c;
      if (!chartArea) return;
      ctx.save();
      ctx.font = "12px Helvetica";
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.textAlign = "center";
      ctx.fillText(
        text,
        (chartArea.left + chartArea.right) / 2,
        chartArea.bottom + 16
      );
      ctx.restore();
    },
  };
  const has = (chart.config.plugins || []).some((p) => p.id === "avgLabelPDF");
  if (!has) chart.config.plugins = [...(chart.config.plugins || []), plugin];
  chart.update();
}
