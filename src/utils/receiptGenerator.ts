import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { formatters } from '@/utils/formatters'
import { Pago } from '@/models/pago'
import { TIPO_PAGO_LABELS } from '@/constants/pagos'

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
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('COMPROBANTE DE PAGO', pageWidth / 2, 20, { align: 'center' })
  
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('ASOCIACIÓN DE JUDO', pageWidth / 2, 26, { align: 'center' })
  
  if (clubNombre) {
    doc.setFontSize(9)
    doc.text(`Club: ${clubNombre}`, pageWidth / 2, 31, { align: 'center' })
  }

  // --- Línea divisoria ---
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, 35, pageWidth - margin, 35)

  // --- Información del Comprobante ---
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text('Fecha y Hora:', margin, 42)
  doc.setFont('helvetica', 'normal')
  doc.text(formatters.formatDateTime(today, true), margin + 22, 42)

  doc.setFont('helvetica', 'bold')
  doc.text('Generado por:', margin, 47)
  doc.setFont('helvetica', 'normal')
  doc.text(usuarioGenerador || 'Sistema', margin + 22, 47)

  // --- Datos del Judoka ---
  doc.setFillColor(245, 245, 245)
  doc.rect(margin, 52, pageWidth - (margin * 2), 12, 'F')
  
  doc.setFont('helvetica', 'bold')
  doc.text('Judoka:', margin + 5, 60)
  doc.setFont('helvetica', 'normal')
  doc.text(judokaNombre, margin + 20, 60)

  // --- Detalle de Pagos ---
  doc.setFont('helvetica', 'bold')
  doc.text('Detalle de Pagos:', margin, 72)

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
    startY: 75,
    margin: { left: margin, right: margin },
    head: [['Concepto', 'Tipo', 'Base/Desc.', 'Subtotal']],
    body: tableBody,
    theme: 'striped',
    headStyles: { fillColor: [66, 139, 202], textColor: 255 },
    styles: { fontSize: 8, cellPadding: 2 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    }
  })

  let currentY = (doc as any).lastAutoTable.finalY + 10
  const totalPagado = listaPagos.reduce((sum, p) => sum + p.monto_final, 0)

  // --- Total ---
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL PAGADO:', pageWidth - margin - 50, currentY)
  doc.text(`Bs. ${totalPagado.toFixed(2)}`, pageWidth - margin, currentY, { align: 'right' })

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
