export type UserRole = 'admin' | 'gerente' | 'rendidor' | 'contador';

export interface User {
  id: string;
  username: string;
  password?: string;
  name: string;
  email: string;
  role: UserRole;
  roleLabel: string;
  department: string;
  dni?: string;
  cargo?: string;
  cuentaBancaria?: string;
  avatar: string;
}

export type TipoDocumento =
  | 'Factura Electrónica'
  | 'Boleta Electrónica'
  | 'Recibo por Honorarios'
  | 'Recibo Simple'
  | 'Ticket'
  | 'Voucher / Transacción'
  | 'Declaración Jurada'
  | 'Otros';

export type ClasificacionGasto =
  | 'Alimentación / Viáticos'
  | 'Transporte y Pasajes'
  | 'Combustible y Peajes'
  | 'Alojamiento / Hospedaje'
  | 'Materiales y Suministros'
  | 'Servicios de Terceros'
  | 'Gastos de Representación'
  | 'Gastos Menores / Remanente'
  | 'Otros Gastos';

export interface CostCenter {
  id: string;
  code: string;
  name: string;
  department: string;
  budgetLimit: number; // Límite de gasto
  spentAmount: number; // Monto ejecutado
}

export interface ExpenseItem {
  id: string;
  itemNumber: number;
  fecha: string;
  tipoDocumento: TipoDocumento;
  numeroComprobante: string;
  ruc: string;
  razonSocial: string;
  detalle: string;
  clasificacionGasto: ClasificacionGasto;
  centroCostosId: string;
  montoTotal: number; // Solo monto total sin subtotal ni igv
  comprobanteUrl?: string;
  ocrVerificado?: boolean;
}

export type EstadoRendicion =
  | 'borrador'
  | 'pendiente_aprobacion'
  | 'aprobada'
  | 'observada'
  | 'liquidada';

export interface HistorialAprobacion {
  id: string;
  nivel: string;
  usuarioNombre: string;
  usuarioRol: string;
  fecha: string;
  accion: 'creada' | 'enviada' | 'aprobada' | 'observada' | 'liquidada';
  comentario?: string;
}

export interface BankAccount {
  id: string;
  banco: string;
  tipoCuenta: string; // 'Corriente' | 'Ahorros'
  numeroCuenta: string;
  cci?: string;
  titular: string;
}

export interface DestinatarioAccount {
  id: string;
  nombreDestinatario: string;
  dniRuc?: string;
  banco: string;
  tipoCuenta: string; // 'Ahorros' | 'Corriente' | 'CCI'
  numeroCuenta: string;
  cci?: string;
  alias?: string;
}

export interface Rendicion {
  id: string;
  codigoRendicion: string;
  titulo: string;
  fechaCreacion: string;
  fechaDesembolso: string;
  fechaRendicion: string; // Fecha del día de la rendición
  colaboradorId: string;
  colaboradorNombre: string;
  responsableRendicion: string; // Responsable formal de la rendición
  nombreDestinatario: string; // Nombre completo del destinatario
  cuentaOrigen: string; // Cuenta de origen de la empresa
  cuentaDestino: string; // Cuenta de destino del colaborador
  departamento: string;
  centroCostosId: string;
  tipoDesembolso: 'Transferencia Bancaria' | 'Cheque';
  numeroTransferencia?: string;
  numeroCheque?: string;
  banco: string;
  referenciaRendicion: string; // Referencia de la rendición
  montoAsignado: number;
  items: ExpenseItem[];
  estado: EstadoRendicion;
  historialAprobacion: HistorialAprobacion[];
  observaciones?: string;
  aprobadoPor?: string;
  fechaAprobacion?: string;
  firmaResponsable?: string; // Data URL firma digital del responsable
  fechaFirmaResponsable?: string;
  firmaAprobador?: string; // Data URL firma digital del Administrador / Gerente
  fechaFirmaAprobador?: string;
}

export interface CuadreResult {
  montoAsignado: number;
  totalRendido: number;
  saldoRestante: number; // montoAsignado - totalRendido (sobrante)
  esCuadrado: boolean;   // true si saldoRestante >= 0 && saldoRestante <= 2.00
  estadoTipo: 'exacto' | 'dentro_limite_2soles' | 'saldo_devolver' | 'sobregiro';
  mensaje: string;
}

export interface CompanySettings {
  razonSocial: string;
  ruc: string;
  direccion: string;
  telefono: string;
  toleranciaCuadre: number; // 2 soles
  logoUrl: string;
  sistemaContableExport: 'CONCAR' | 'SIIGO' | 'SAP' | 'SUNAT_PLE';
  cuentasOrigenDisponibles?: BankAccount[];
}

export interface AppNotification {
  id: string;
  timestamp: string;
  titulo: string;
  mensaje: string;
  tipo: 'aprobacion' | 'observacion' | 'alerta_limite' | 'cuadre' | 'rendicion_nueva';
  leido: boolean;
  rendicionId?: string;
  usuarioDestino?: string;
}
