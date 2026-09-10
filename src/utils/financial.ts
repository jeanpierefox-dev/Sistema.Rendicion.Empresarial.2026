import { CuadreResult, ExpenseItem, Rendicion, CompanySettings, CostCenter } from '../types';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function formatCurrency(amount: number): string {
  return `S/ ${Number(amount || 0).toLocaleString('es-PE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function calculateCuadre(
  montoAsignado: number,
  items: ExpenseItem[],
  tolerancia: number = 2.00
): CuadreResult {
  const totalRendido = Number(
    items.reduce((acc, item) => acc + (Number(item.montoTotal) || 0), 0).toFixed(2)
  );
  const saldoRestante = Number((montoAsignado - totalRendido).toFixed(2));

  let estadoTipo: 'exacto' | 'dentro_limite_2soles' | 'saldo_devolver' | 'sobregiro';
  let esCuadrado = false;
  let mensaje = '';

  if (saldoRestante === 0) {
    estadoTipo = 'exacto';
    esCuadrado = true;
    mensaje = 'Cuadre Exacto: S/ 0.00 de remanente (100% conciliado).';
  } else if (saldoRestante > 0 && saldoRestante <= tolerancia) {
    estadoTipo = 'dentro_limite_2soles';
    esCuadrado = true;
    mensaje = `Cuadre Conforme: Remanente de S/ ${saldoRestante.toFixed(2)} está dentro de la tolerancia máxima de S/ ${tolerancia.toFixed(2)}.`;
  } else if (saldoRestante > tolerancia) {
    estadoTipo = 'saldo_devolver';
    esCuadrado = false;
    mensaje = `Saldo por Devolver: El remanente de S/ ${saldoRestante.toFixed(2)} excede el límite máximo de S/ ${tolerancia.toFixed(2)}. Requiere depósito de reintegro a la empresa.`;
  } else {
    estadoTipo = 'sobregiro';
    esCuadrado = false;
    mensaje = `Sobregiro: Se ha excedido el monto asignado en S/ ${Math.abs(saldoRestante).toFixed(2)}. Requiere reembolso de la empresa al colaborador.`;
  }

  return {
    montoAsignado,
    totalRendido,
    saldoRestante,
    esCuadrado,
    estadoTipo,
    mensaje,
  };
}

// Export single Rendición to professional Excel Workbook without Subtotal and IGV
export function exportRendicionToExcel(
  rendicion: Rendicion,
  company: CompanySettings,
  costCenter?: CostCenter
) {
  const cuadre = calculateCuadre(rendicion.montoAsignado, rendicion.items, company.toleranciaCuadre);

  // Metadata headers
  const data: (string | number)[][] = [
    [company.razonSocial.toUpperCase()],
    [`RUC: ${company.ruc}`, `DIRECCIÓN: ${company.direccion}`],
    ['SISTEMA DE RENDICIÓN DE GASTOS Y FONDOS CORPORATIVOS'],
    [],
    ['DATOS GENERALES DE LA RENDICIÓN'],
    ['Código de Rendición:', rendicion.codigoRendicion, 'Estado Actual:', rendicion.estado.toUpperCase()],
    ['Título / Asunto:', rendicion.titulo, 'Fecha Rendición:', rendicion.fechaRendicion || rendicion.fechaCreacion],
    ['Responsable Rendición:', rendicion.responsableRendicion || rendicion.colaboradorNombre, 'Departamento:', rendicion.departamento],
    ['Destinatario de Fondos:', rendicion.nombreDestinatario || rendicion.colaboradorNombre, 'Referencia:', rendicion.referenciaRendicion || 'N/A'],
    ['Centro de Costos:', costCenter ? `${costCenter.code} - ${costCenter.name}` : rendicion.centroCostosId],
    [],
    ['DATOS BANCARIOS Y DESEMBOLSO'],
    ['Método de Desembolso:', rendicion.tipoDesembolso, 'Banco de Origen:', rendicion.banco],
    ['Cuenta de Origen (Empresa):', rendicion.cuentaOrigen || 'Cta. Principal', 'Cuenta de Destino:', rendicion.cuentaDestino || 'N/A'],
    ['N° Transferencia Bancaria:', rendicion.numeroTransferencia || 'N/A', 'N° de Cheque:', rendicion.numeroCheque || 'N/A'],
    ['Fecha de Desembolso:', rendicion.fechaDesembolso, 'Monto Desembolsado (S/):', rendicion.montoAsignado],
    [],
    ['DETALLE DE COMPROBANTES Y GASTOS REALIZADOS (SOLO MONTO TOTAL)'],
    [
      'Ítem',
      'Fecha Emisión',
      'Tipo de Documento',
      'N° Comprobante',
      'RUC Emisor',
      'Razón Social / Proveedor',
      'Detalle del Gasto',
      'Clasificación',
      'Monto Total (S/)',
    ],
  ];

  // Populate items (no subtotal, no igv)
  rendicion.items.forEach((it) => {
    data.push([
      it.itemNumber,
      it.fecha,
      it.tipoDocumento,
      it.numeroComprobante,
      it.ruc,
      it.razonSocial,
      it.detalle,
      it.clasificacionGasto,
      it.montoTotal,
    ]);
  });

  // Summary and Cuadre section
  data.push([]);
  data.push(['RESUMEN DE CUADRE FINANCIERO (TOLERANCIA MÁXIMA S/ 2.00)']);
  data.push(['Monto Asignado / Desembolsado (S/):', rendicion.montoAsignado]);
  data.push(['Total Gastos Rendidos (S/):', cuadre.totalRendido]);
  data.push(['Saldo Restante / Sobrante (S/):', cuadre.saldoRestante]);
  data.push(['Tolerancia Máxima Permitida:', `S/ ${company.toleranciaCuadre.toFixed(2)}`]);
  data.push(['ESTADO DE CUADRE:', cuadre.esCuadrado ? 'CONFORME / CUADRADO' : 'OBSERVADO / NO CUADRADO']);
  data.push(['Diagnóstico:', cuadre.mensaje]);
  data.push([]);
  data.push(['FIRMAS DIGITALES Y CONFORMIDAD']);
  data.push([
    rendicion.firmaResponsable ? '[FIRMADO DIGITALMENTE]' : '_______________________________',
    rendicion.firmaAprobador ? '[FIRMADO DIGITALMENTE]' : '_______________________________',
    '_______________________________',
  ]);
  data.push([
    `Responsable: ${rendicion.responsableRendicion || rendicion.colaboradorNombre} (${rendicion.fechaFirmaResponsable || 'Sin fecha'})`,
    `Aprobador Gerencia: ${rendicion.aprobadoPor || 'Pendiente'} (${rendicion.fechaFirmaAprobador || 'Sin fecha'})`,
    'Auditoría Contable / Tesorería',
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 8 },
    { wch: 14 },
    { wch: 22 },
    { wch: 18 },
    { wch: 15 },
    { wch: 34 },
    { wch: 40 },
    { wch: 26 },
    { wch: 18 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, rendicion.codigoRendicion);
  XLSX.writeFile(workbook, `Rendicion_${rendicion.codigoRendicion}.xlsx`);
}

// Export all rendiciones to summary Excel
export function exportAllRendicionesToExcel(
  rendiciones: Rendicion[],
  company: CompanySettings,
  costCenters: CostCenter[]
) {
  const rows: any[] = rendiciones.map((r) => {
    const cuadre = calculateCuadre(r.montoAsignado, r.items, company.toleranciaCuadre);
    const cc = costCenters.find((c) => c.id === r.centroCostosId);
    return {
      'Código Rendición': r.codigoRendicion,
      'Título / Asunto': r.titulo,
      'Fecha Rendición': r.fechaRendicion || r.fechaCreacion,
      'Responsable': r.responsableRendicion || r.colaboradorNombre,
      'Destinatario': r.nombreDestinatario || r.colaboradorNombre,
      'Cuenta Origen': r.cuentaOrigen || 'Empresa',
      'Cuenta Destino': r.cuentaDestino || 'N/A',
      'Departamento': r.departamento,
      'Centro de Costos': cc ? `${cc.code} ${cc.name}` : r.centroCostosId,
      'N° Transferencia': r.numeroTransferencia || 'N/A',
      'N° Cheque': r.numeroCheque || 'N/A',
      'Banco': r.banco,
      'Referencia': r.referenciaRendicion || '',
      'Monto Asignado (S/)': r.montoAsignado,
      'Total Rendido (S/)': cuadre.totalRendido,
      'Saldo Restante (S/)': cuadre.saldoRestante,
      'Cuadre Conforme (<= 2 soles)': cuadre.esCuadrado ? 'SÍ' : 'NO',
      'Cant. Comprobantes': r.items.length,
      'Firma Responsable': r.firmaResponsable ? 'SÍ' : 'NO',
      'Firma Aprobador': r.firmaAprobador ? 'SÍ' : 'NO',
      'Estado': r.estado.toUpperCase(),
      'Aprobado Por': r.aprobadoPor || 'Pendiente',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Resumen_Rendiciones');
  XLSX.writeFile(workbook, `Reporte_General_Rendiciones_${new Date().toISOString().split('T')[0]}.xlsx`);
}

// Export single Rendición to professional PDF with digital signatures, accounts, and no Subtotal/IGV
export function exportRendicionToPDF(
  rendicion: Rendicion,
  company: CompanySettings,
  costCenter?: CostCenter
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cuadre = calculateCuadre(rendicion.montoAsignado, rendicion.items, company.toleranciaCuadre);

  // Corporate Header Banner
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 26, 'F');

  // Company Brand text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(company.razonSocial, 14, 11);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`RUC: ${company.ruc}  |  ${company.direccion}`, 14, 17);
  doc.text(`Telf: ${company.telefono}  |  Sistema Contable: ${company.sistemaContableExport}`, 14, 22);

  // Subheader title & Code
  doc.setTextColor(30, 41, 59); // slate-800
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('PLANILLA OFICIAL DE RENDICIÓN DE GASTOS', 14, 33);

  // Badge of code
  doc.setFillColor(238, 242, 255);
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(150, 27, 46, 8, 1.5, 1.5, 'FD');
  doc.setFontSize(9);
  doc.setTextColor(67, 56, 202);
  doc.setFont('helvetica', 'bold');
  doc.text(rendicion.codigoRendicion, 154, 32.5);

  // Info Box 1: General Info & Responsables
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 37, 182, 38, 2, 2, 'FD');

  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('TÍTULO / ASUNTO:', 18, 43);
  doc.text('RESPONSABLE RENDICIÓN:', 18, 49);
  doc.text('DESTINATARIO DE FONDOS:', 18, 55);
  doc.text('CENTRO DE COSTOS / ÁREA:', 18, 61);
  doc.text('REFERENCIA / GLOSA:', 18, 67);

  doc.setTextColor(15, 23, 42); // slate-900
  doc.setFont('helvetica', 'bold');
  doc.text(rendicion.titulo.substring(0, 48), 58, 43);
  doc.text(rendicion.responsableRendicion || rendicion.colaboradorNombre, 58, 49);
  doc.text(rendicion.nombreDestinatario || rendicion.colaboradorNombre, 58, 55);
  doc.text(
    `${costCenter ? `${costCenter.code} - ${costCenter.name}` : rendicion.centroCostosId} (${rendicion.departamento})`,
    58,
    61
  );
  doc.setFont('helvetica', 'normal');
  doc.text((rendicion.referenciaRendicion || 'Sin referencia especial').substring(0, 60), 58, 67);

  // Right column of Info Box: Banking Details
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('FECHA RENDICIÓN:', 125, 43);
  doc.text('MÉTODO DESEMBOLSO:', 125, 49);
  doc.text('N° TRANSF / CHEQUE:', 125, 55);
  doc.text('CUENTA ORIGEN:', 125, 61);
  doc.text('MONTO DESEMBOLSADO:', 125, 67);

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.text(rendicion.fechaRendicion || rendicion.fechaCreacion, 160, 43);
  doc.text(rendicion.tipoDesembolso, 160, 49);
  doc.text(
    rendicion.tipoDesembolso === 'Cheque'
      ? (rendicion.numeroCheque || 'N/A')
      : (rendicion.numeroTransferencia || 'N/A'),
    160,
    55
  );
  doc.setFontSize(6.8);
  doc.text((rendicion.cuentaOrigen || 'Cta. Empresa').substring(0, 26), 160, 61);
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129); // green
  doc.text(formatCurrency(rendicion.montoAsignado), 160, 67);

  // Table of Expenses (No subtotal, No IGV - Just Monto Total)
  const tableData = rendicion.items.map((it) => [
    it.itemNumber.toString(),
    it.fecha,
    it.tipoDocumento,
    it.numeroComprobante,
    it.ruc,
    it.razonSocial.substring(0, 28),
    it.detalle.substring(0, 32),
    it.clasificacionGasto,
    formatCurrency(it.montoTotal),
  ]);

  autoTable(doc, {
    startY: 79,
    head: [[
      'N°',
      'Fecha',
      'Documento',
      'N° Comprobante',
      'RUC',
      'Razón Social / Proveedor',
      'Detalle del Gasto',
      'Clasificación',
      'Monto Total',
    ]],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      fontSize: 6.8,
      textColor: [51, 65, 85],
    },
    columnStyles: {
      0: { cellWidth: 7, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 24 },
      3: { cellWidth: 20 },
      4: { cellWidth: 18, halign: 'center' },
      5: { cellWidth: 34 },
      6: { cellWidth: 32 },
      7: { cellWidth: 21 },
      8: { cellWidth: 16, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 5;

  // Cuadre Box
  const isCuadrado = cuadre.esCuadrado;
  doc.setFillColor(isCuadrado ? 240 : 254, isCuadrado ? 253 : 242, isCuadrado ? 244 : 242);
  doc.setDrawColor(isCuadrado ? 187 : 254, isCuadrado ? 247 : 202, isCuadrado ? 208 : 202);
  doc.roundedRect(14, finalY, 182, 22, 2, 2, 'FD');

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(isCuadrado ? 21 : 185, isCuadrado ? 128 : 28, isCuadrado ? 61 : 28);
  doc.text(
    isCuadrado
      ? '✓ ESTADO DE CUADRE: CONFORME (Sobrante dentro de la tolerancia máxima de S/ 2.00)'
      : '⚠ ESTADO DE CUADRE: OBSERVADO / DESCUADRADO',
    18,
    finalY + 5.5
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Monto Asignado: ${formatCurrency(rendicion.montoAsignado)}`, 18, finalY + 11);
  doc.text(`Total Gastos Rendidos: ${formatCurrency(cuadre.totalRendido)}`, 18, finalY + 16);
  doc.setFont('helvetica', 'bold');
  doc.text(`Sobrante / Restante: ${formatCurrency(cuadre.saldoRestante)}`, 85, finalY + 11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tolerancia Máx: S/ ${company.toleranciaCuadre.toFixed(2)}`, 85, finalY + 16);
  doc.text(`Diagnóstico: ${cuadre.mensaje.substring(0, 52)}`, 130, finalY + 11);
  doc.text(`Cta Destino: ${(rendicion.cuentaDestino || 'N/A').substring(0, 24)}`, 130, finalY + 16);

  // Digital Signatures Section with canvas image rendering
  const sigY = finalY + 28;
  if (sigY < 255) {
    // Signature box 1: Responsable
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(20, sigY, 52, 28, 1, 1, 'S');
    if (rendicion.firmaResponsable) {
      try {
        doc.addImage(rendicion.firmaResponsable, 'PNG', 24, sigY + 2, 44, 16);
      } catch (e) {
        doc.setFontSize(7);
        doc.text('[Firma Digital Registrada]', 24, sigY + 10);
      }
    }
    doc.line(24, sigY + 20, 68, sigY + 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('RESPONSABLE RENDICIÓN', 23, sigY + 23);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text((rendicion.responsableRendicion || rendicion.colaboradorNombre).substring(0, 25), 23, sigY + 26);

    // Signature box 2: Aprobador (Admin / Gerente)
    doc.roundedRect(80, sigY, 52, 28, 1, 1, 'S');
    if (rendicion.firmaAprobador) {
      try {
        doc.addImage(rendicion.firmaAprobador, 'PNG', 84, sigY + 2, 44, 16);
      } catch (e) {
        doc.setFontSize(7);
        doc.text('[Firma Digital Aprobada]', 84, sigY + 10);
      }
    }
    doc.line(84, sigY + 20, 128, sigY + 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('GERENCIA / ADMINISTRACIÓN', 82, sigY + 23);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text((rendicion.aprobadoPor || 'Pendiente de Aprobación').substring(0, 25), 82, sigY + 26);

    // Signature box 3: Contabilidad
    doc.roundedRect(140, sigY, 52, 28, 1, 1, 'S');
    doc.line(144, sigY + 20, 188, sigY + 20);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('AUDITORÍA CONTABLE / TESORERÍA', 142, sigY + 23);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text('Revisión Fiscal y Liquidación SUNAT', 142, sigY + 26);
  }

  doc.save(`Planilla_Rendicion_${rendicion.codigoRendicion}.pdf`);
}

// Generate Accounting System Import File (CSV / TXT format without subtotal/igv)
export function exportAccountingFile(rendicion: Rendicion, format: string = 'CONCAR') {
  let content = '';

  if (format === 'CONCAR') {
    // CONCAR format
    content = 'SUBDIARIO,COMPROBANTE,FECHA,CUENTA,RUC_ANEXO,MONEDA,DEBE_HABER,IMPORTE_TOTAL,TIPO_DOC,NUM_DOC,GLOSA\r\n';
    rendicion.items.forEach((it, idx) => {
      const cuentaGasto = it.tipoDocumento === 'Factura Electrónica' ? '631101' : '631102';
      const numCorrelativo = String(idx + 1).padStart(4, '0');
      content += `05,${numCorrelativo},${it.fecha},${cuentaGasto},${it.ruc},MN,D,${it.montoTotal},${it.tipoDocumento.substring(0, 2).toUpperCase()},${it.numeroComprobante},"${it.detalle}"\r\n`;
    });
    content += `05,9999,${rendicion.fechaRendicion || rendicion.fechaCreacion},141301,${(rendicion.responsableRendicion || rendicion.colaboradorNombre).substring(0, 11)},MN,H,${rendicion.montoAsignado},TR,${rendicion.numeroTransferencia || rendicion.numeroCheque},"Liquidacion Rendicion ${rendicion.codigoRendicion}"\r\n`;
  } else {
    // Standard CSV export
    content = 'CodigoRendicion,NumeroTransferencia,NumeroCheque,CuentaOrigen,CuentaDestino,Destinatario,Responsable,FechaRendicion,Item,Fecha,TipoDocumento,NumeroComprobante,RUC,RazonSocial,Detalle,Clasificacion,MontoTotal\r\n';
    rendicion.items.forEach((it) => {
      content += `"${rendicion.codigoRendicion}","${rendicion.numeroTransferencia || ''}","${rendicion.numeroCheque || ''}","${rendicion.cuentaOrigen || ''}","${rendicion.cuentaDestino || ''}","${rendicion.nombreDestinatario || ''}","${rendicion.responsableRendicion || ''}","${rendicion.fechaRendicion || ''}",${it.itemNumber},"${it.fecha}","${it.tipoDocumento}","${it.numeroComprobante}","${it.ruc}","${it.razonSocial}","${it.detalle}","${it.clasificacionGasto}",${it.montoTotal}\r\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `CONTA_${format}_${rendicion.codigoRendicion}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
