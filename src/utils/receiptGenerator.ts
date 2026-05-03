import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { Pago } from '@/models/pago'
import { TIPO_PAGO_LABELS } from '@/constants/pagos'
import { numeroALiteral } from '@/utils/numberToLiteral'

export const generatePagoReceipt = (pagos: Pago | Pago[], judokaNombre: string, clubNombre: string, usuarioGenerador: string) => {
  const listaPagos = Array.isArray(pagos) ? pagos : [pagos]
  if (listaPagos.length === 0) return

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5' // Formato A5 para comprobantes
  })

  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 10
  const today = new Date().toISOString()

  // --- Encabezado ---
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('ASOCIACIÓN DE JUDO', pageWidth / 2, 25, { align: 'center' })
  
  if (clubNombre) {
    doc.setFontSize(8)
    doc.text(`Club: ${clubNombre}`, pageWidth / 2, 29, { align: 'center' })
  }

  // --- Línea divisoria ---
  doc.setDrawColor(150, 150, 150)
  doc.line(margin, 33, pageWidth - margin, 33)

  // --- Información del Comprobante ---
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  const infoX = margin
  doc.text('Fecha y Hora:', infoX, 39)
  doc.setFont('helvetica', 'normal')
  doc.text(formatters.formatDateTime(today, true), infoX + 18, 39)

  doc.setFont('helvetica', 'bold')
  doc.text('Generado por:', infoX, 43)
  doc.setFont('helvetica', 'normal')
  doc.text(usuarioGenerador || 'Sistema', infoX + 18, 43)

  // --- Datos del Judoka ---
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, 48, pageWidth - (margin * 2), 10, 'F')
  
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('JUDOKA:', margin + 4, 54.5)
  doc.setFont('helvetica', 'normal')
  doc.text(judokaNombre.toUpperCase(), margin + 20, 54.5)

  // --- Detalle de Pagos ---
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DETALLE DE PAGOS', margin, 65)

  const tableBody = listaPagos.map(pago => {
    let detalleMonto = `Bs. ${pago.monto_base.toFixed(2)}`
    if (pago.tiene_descuento) {
      const descMonto = pago.tipo_descuento === 'porcentaje'
        ? (pago.monto_base * (pago.descuento_porcentaje || 0) / 100)
        : (pago.descuento_monto || 0)
      detalleMonto += `\n(- Bs. ${descMonto.toFixed(2)})`
    }

    return [
      pago.concepto,
      TIPO_PAGO_LABELS[pago.tipo_pago as keyof typeof TIPO_PAGO_LABELS] || pago.tipo_pago,
      detalleMonto,
      `Bs. ${pago.monto_final.toFixed(2)}`
    ]
  })

  autoTable(doc, {
    startY: 68,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Tipo', 'Base/Desc.', 'Subtotal']],
    body: tableBody,
    theme: 'plain',
    headStyles: { 
      fillColor: [230, 230, 230], 
      textColor: 50, 
      fontStyle: 'bold',
      lineColor: [200, 200, 200],
      lineWidth: 0.1
    },
    styles: { 
      fontSize: 7, 
      cellPadding: 2, 
      font: 'helvetica',
      textColor: 50
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 20 },
      2: { halign: 'right', cellWidth: 22 },
      3: { halign: 'right', fontStyle: 'bold', cellWidth: 22 }
    }
  })

  let currentY = (doc as any).lastAutoTable.finalY + 8
  const totalPagado = listaPagos.reduce((sum, p) => sum + p.monto_final, 0)

  // --- Total ---
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  const totalLabel = 'TOTAL PAGADO:'
  const totalMonto = `Bs. ${totalPagado.toFixed(2)}`
  
  // Aumentamos el margen derecho para que el número no choque con el texto
  doc.text(totalLabel, pageWidth - margin - 55, currentY)
  doc.text(totalMonto, pageWidth - margin, currentY, { align: 'right' })

  // --- Total Literal ---
  currentY += 5
  doc.setFontSize(7)
  doc.setFont('helvetica', 'italic')
  doc.text(`SON: ${numeroALiteral(totalPagado)}`, pageWidth - margin, currentY, { align: 'right' })

  // --- Notas/Observaciones ---
  const observaciones = listaPagos.map(p => p.observaciones_pago).filter(Boolean).join('; ')
  if (observaciones) {
    currentY += 10
    doc.setFontSize(8)
    doc.setFont('helvetica', 'italic')
    doc.text('Observaciones:', margin, currentY)
    doc.setFont('helvetica', 'normal')
    const splitObs = doc.splitTextToSize(observaciones, pageWidth - (margin * 2))
    doc.text(splitObs, margin, currentY + 4)
  }

  // --- Pie de página ---
  doc.setFontSize(7)
  doc.setFont('helvetica', 'normal')
  doc.text('Este es un comprobante digital generado automáticamente por la Asociación de Judo.', pageWidth / 2, doc.internal.pageSize.getHeight() - 12, { align: 'center' })
  doc.text('Gracias por su pago.', pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' })

  // Guardar el PDF
  const fileName = listaPagos.length === 1 
    ? `Comprobante_${listaPagos[0].id.substring(0, 8)}_${judokaNombre.replace(/\s+/g, '_')}.pdf`
    : `Comprobante_Multiple_${judokaNombre.replace(/\s+/g, '_')}.pdf`
    
  doc.save(fileName)
}
