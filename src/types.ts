export type TransactionType = 'PAGAR' | 'RECEBER';

export interface ColumnMapping {
  docNum: string; // usually auto-generated
  cardCode: string;
  docType: string; // usually default
  series: string; // usually default
  sequenceCode: string; // usually default
  handWritten: string; // usually default
  printed: string; // usually default
  sequenceSerial: string; // NF
  seriesString: string; // Parcela
  taxDate: string; // Document Date
  docDueDate: string; // Due Date
  docDate: string; // Posting Date
  numAtCard: string; // NF + Parcela (auto or mapped)
  comments: string; // Observations
  docTotal: string; // Value
  salesPersonCode: string; // SalesPerson / Buyer Code
  paymentGroupCode: string; // Payment Terms Code
  bplId: string; // Branch ID (Filial)
  
  // Specific fields
  ourNumber?: string; // AR only
  contractBank?: string; // AR only
  linhaDigitavel?: string; // AP only
  partnerCnpj?: string; // Optional CNPJ field for automatic partner code lookup
}

export interface BusinessPartner {
  cardCode: string;
  cardName: string;
  cnpjCpf: string;
  normalizedCnpjCpf: string;
}

export interface DefaultSettings {
  docType: string;
  series: string;
  sequenceCode: string;
  handWritten: 'Y' | 'N';
  printed: 'Y' | 'N';
  paymentGroupCode: string;
  bplId: string;
  comments: string;
  salesPersonCode: string;
  contractBank: string;
  dateFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'MM/DD/YYYY';
}

export interface RawRow {
  [key: string]: any;
}

export interface ValidationError {
  row: number;
  field: string;
  value: any;
  message: string;
  severity: 'error' | 'warning';
}

export interface MappedRow {
  id: number; // Row index 1-based
  docNum: number;
  cardCode: string;
  docType: string;
  series: string;
  sequenceCode: string;
  handWritten: string;
  printed: string;
  sequenceSerial: string;
  seriesString: string;
  taxDate: string; // YYYYMMDD
  docDueDate: string; // YYYYMMDD
  docDate: string; // YYYYMMDD
  numAtCard: string;
  comments: string;
  docTotal: number;
  salesPersonCode: string;
  paymentGroupCode: string;
  bplId: string;
  
  // Specific
  ourNumber?: string;
  contractBank?: string;
  linhaDigitavel?: string;
  
  // Verification details
  originalRow: RawRow;
  errors: ValidationError[];
}
