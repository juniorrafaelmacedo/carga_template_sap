import { ColumnMapping, DefaultSettings, MappedRow, RawRow, TransactionType, ValidationError, BusinessPartner } from '../types';
import * as XLSX from 'xlsx';

// Keywords to automatically map columns from uploaded sheet
export const MAPPING_KEYWORDS: { [K in keyof ColumnMapping]: string[] } = {
  docNum: ['docnum', 'seq', 'numero_doc', 'doc_num'],
  cardCode: ['cardcode', 'cod cliente', 'cod_cliente', 'cliente', 'fornecedor', 'cod fornecedor', 'cod_fornecedor', 'parceiro', 'partner', 'código', 'cod.', 'id', 'customer', 'vendor'],
  docType: ['doctype', 'doc_type', 'tipo'],
  series: ['series', 'serie', 'série'],
  sequenceCode: ['sequencecode', 'seqcode', 'sequence_code'],
  handWritten: ['handwritten', 'handwrtten'],
  printed: ['printed'],
  sequenceSerial: ['sequenceserial', 'serial', 'nf', 'nota', 'nota fiscal', 'documento', 'numero', 'número', 'doc', 'nº', 'num', 'invoice', 'factura'],
  seriesString: ['seriesstring', 'seriesstr', 'parcela', 'prestacao', 'prestação', 'parc', 'letra', 'installment', 'cuota'],
  taxDate: ['taxdate', 'data emissao', 'data emissão', 'dt emissao', 'dt_emissão', 'dt emissão', 'data doc', 'data documento', 'dt documento', 'emissão', 'emissao', 'document_date', 'date'],
  docDueDate: ['data de pagto', 'data pagto', 'dt pagto', 'pagto', 'data_pagto', 'dt_pagto', 'pagamento', 'data pagamento', 'docduedate', 'duedate', 'vencimento', 'data vencimento', 'dt vencimento', 'dt_vencimento', 'data_vencimento', 'venc', 'prazo', 'due_date'],
  docDate: ['docdate', 'data lancamento', 'data lançamento', 'dt lancamento', 'dt_lançamento', 'dt lançamento', 'lançamento', 'lancamento', 'postdate', 'posting_date', 'data_base', 'database'],
  numAtCard: ['numatcard', 'referencia', 'referência', 'ref', 'ref.'],
  comments: ['comments', 'observação', 'observacao', 'obs', 'obs.', 'comentarios', 'comentários', 'histórico', 'historico', 'narrative'],
  docTotal: ['doctotal', 'total', 'valor', 'valor parcela', 'valor_parcela', 'saldo', 'total parcela', 'valor original', 'valor aberto', 'valor líquido', 'liquido', 'net_total', 'amount', 'open_amount', 'saldodevedor'],
  salesPersonCode: ['salespersoncode', 'slpcode', 'vendedor', 'comprador', 'cod vendedor', 'cod comprador', 'vendedor_id', 'comprador_id', 'agent'],
  paymentGroupCode: ['paymentgroupcode', 'groupnum', 'condicao', 'condição', 'cond pagto', 'cond_pagto', 'condição pagamento', 'forma pagamento', 'terms'],
  bplId: ['bplid', 'bpl_id', 'filial', 'empresa', 'estabelecimento', 'coligada', 'branch', 'branch_id', 'id filial'],
  ourNumber: ['ournumber', 'nossonumero', 'nosso numero', 'nosso número', 'nosso_numero', 'nossonum'],
  contractBank: ['contractbank', 'contratobanco', 'contrato bancario', 'contrato_bancario', 'id_contrato', 'banco'],
  linhaDigitavel: ['linhadigitavel', 'linha digitável', 'linha_digitavel', 'linha digitavel', 'codigo de barras', 'código de barras', 'barras', 'digitavel', 'u_linhadigitavel', 'pch6.u_linhadigitavel'],
  partnerCnpj: ['partnercnpj', 'partner_cnpj', 'cnpj_parceiro', 'cpf_parceiro', 'cnpj parceiro', 'cpf parceiro', 'cnpj/cpf', 'cnpj_cpf', 'cnpj / cpf', 'cpf_cnpj', 'cnpj cpf', 'doc_parceiro', 'documento parceiro', 'cnpj', 'cpf', 'cgc', 'cnpj_beneficiario', 'cnpj_favorecido', 'cnpj do cliente', 'cnpj do fornecedor', 'cnpj favorecido', 'cnpj do favorecido', 'cnpj beneficiario', 'inscricao federal', 'inscricao_federal', 'doc favorecido', 'doc_favorecido', 'cnpj_devedor', 'cnpj_credor', 'cnpj devedor', 'cnpj credor', 'cpf devedor', 'cpf credor', 'cpf_devedor', 'cpf_credor']
};

/**
 * Normalizes strings to make keyword comparison robust
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9]/g, ''); // remove non-alphanumeric
}

/**
 * Automap columns based on headers list
 */
export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: Partial<ColumnMapping> = {};
  
  const normalizedHeaders = headers.map(h => ({
    original: h,
    normalized: normalizeString(h)
  }));

  Object.keys(MAPPING_KEYWORDS).forEach((key) => {
    const fieldKey = key as keyof ColumnMapping;
    const keywords = MAPPING_KEYWORDS[fieldKey] || [];
    
    // Find best match
    let bestMatch = '';
    let highestScore = 0;

    normalizedHeaders.forEach((header) => {
      keywords.forEach((keyword) => {
        const normKeyword = normalizeString(keyword);
        
        // Exact match of normalized names
        if (header.normalized === normKeyword) {
          bestMatch = header.original;
          highestScore = 100;
        } 
        // Header contains keyword or keyword contains header (only if length > 3 to avoid false positives)
        else if (highestScore < 100 && normKeyword.length > 3) {
          if (header.normalized.includes(normKeyword) && normKeyword.length > highestScore) {
            bestMatch = header.original;
            highestScore = normKeyword.length;
          } else if (normKeyword.includes(header.normalized) && header.normalized.length > highestScore && header.normalized.length > 3) {
            bestMatch = header.original;
            highestScore = header.normalized.length;
          }
        }
      });
    });

    mapping[fieldKey] = bestMatch;
  });

  return mapping as ColumnMapping;
}

/**
 * Converts excel date numbers or string dates to YYYYMMDD SAP standard
 */
export function parseToSAPDate(val: any): { dateStr: string; error?: string } {
  if (val === null || val === undefined || val === '') {
    return { dateStr: '', error: 'Data vazia' };
  }

  // If it's already a JS Date
  if (val instanceof Date && !isNaN(val.getTime())) {
    return { dateStr: formatDateToYYYYMMDD(val) };
  }

  // If it's a number (Excel date)
  if (typeof val === 'number') {
    try {
      const date = excelDateToJSDate(val);
      if (!isNaN(date.getTime())) {
        return { dateStr: formatDateToYYYYMMDD(date) };
      }
    } catch (e) {
      // Fall through
    }
  }

  const strVal = String(val).trim();
  if (!strVal) {
    return { dateStr: '', error: 'Data vazia' };
  }

  // Format: YYYYMMDD (8 digits)
  if (/^\d{8}$/.test(strVal)) {
    const year = parseInt(strVal.substring(0, 4), 10);
    const month = parseInt(strVal.substring(4, 6), 10);
    const day = parseInt(strVal.substring(6, 8), 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year > 1900 && year < 2100) {
      return { dateStr: strVal };
    }
  }

  // Match DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const matchDmy = strVal.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{4})$/);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const month = parseInt(matchDmy[2], 10);
    const year = parseInt(matchDmy[3], 10);
    return buildSAPDate(year, month, day);
  }

  // Match YYYY-MM-DD or YYYY/MM/DD
  const matchYmd = strVal.match(/^(\d{4})[/\-. ](\d{1,2})[/\-. ](\d{1,2})$/);
  if (matchYmd) {
    const year = parseInt(matchYmd[1], 10);
    const month = parseInt(matchYmd[2], 10);
    const day = parseInt(matchYmd[3], 10);
    return buildSAPDate(year, month, day);
  }

  // Match DD/MM/YY or DD-MM-YY
  const matchDmyShort = strVal.match(/^(\d{1,2})[/\-. ](\d{1,2})[/\-. ](\d{2})$/);
  if (matchDmyShort) {
    const day = parseInt(matchDmyShort[1], 10);
    const month = parseInt(matchDmyShort[2], 10);
    const yy = parseInt(matchDmyShort[3], 10);
    const year = yy < 50 ? 2000 + yy : 1900 + yy;
    return buildSAPDate(year, month, day);
  }

  // Try parsing with native Date constructor (avoiding invalid ranges)
  const parsedTime = Date.parse(strVal);
  if (!isNaN(parsedTime)) {
    const date = new Date(parsedTime);
    if (date.getFullYear() > 1900 && date.getFullYear() < 2100) {
      return { dateStr: formatDateToYYYYMMDD(date) };
    }
  }

  return { dateStr: '', error: `Formato inválido: "${strVal}"` };
}

function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

export function reformatSAPDate(dateStr: string, targetFormat: 'YYYYMMDD' | 'YYYY-MM-DD' | 'MM/DD/YYYY'): string {
  if (!dateStr || dateStr.length !== 8) return dateStr;
  const year = dateStr.substring(0, 4);
  const month = dateStr.substring(4, 6);
  const day = dateStr.substring(6, 8);
  
  if (targetFormat === 'YYYY-MM-DD') {
    return `${year}-${month}-${day}`;
  }
  if (targetFormat === 'MM/DD/YYYY') {
    return `${month}/${day}/${year}`;
  }
  return dateStr; // 'YYYYMMDD'
}

function excelDateToJSDate(serial: number): Date {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  
  const fractional_day = serial - Math.floor(serial) + 0.0000001;
  const total_seconds = Math.floor(86400 * fractional_day);
  
  const seconds = total_seconds % 60;
  const minutes = Math.floor(total_seconds / 60) % 60;
  const hours = Math.floor(total_seconds / 3600);
  
  return new Date(date_info.getUTCFullYear(), date_info.getUTCMonth(), date_info.getUTCDate(), hours, minutes, seconds);
}

function buildSAPDate(year: number, month: number, day: number): { dateStr: string; error?: string } {
  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return { dateStr: '', error: 'Valores numéricos de data inválidos' };
  }
  if (month < 1 || month > 12) {
    return { dateStr: '', error: `Mês inválido: ${month}` };
  }
  if (day < 1 || day > 31) {
    return { dateStr: '', error: `Dia inválido: ${day}` };
  }
  
  const mStr = String(month).padStart(2, '0');
  const dStr = String(day).padStart(2, '0');
  return { dateStr: `${year}${mStr}${dStr}` };
}

/**
 * Parses float values safely from various localized formats (e.g. "1.500,00" or "$1,500.00" or 1250)
 */
export function parseToSAPNumber(val: any): { numVal: number; error?: string } {
  if (val === null || val === undefined || val === '') {
    return { numVal: 0, error: 'Valor vazio' };
  }
  if (typeof val === 'number') {
    if (isNaN(val)) return { numVal: 0, error: 'Número inválido (NaN)' };
    return { numVal: val };
  }

  let strVal = String(val).trim();
  // Remove currency symbols, spaces, percent signs, and non-breaking spaces
  strVal = strVal.replace(/[R$€$£\s%\u00A0\u202F\u2007\u200B]/g, '');

  if (!strVal) {
    return { numVal: 0, error: 'Valor numérico vazio após limpeza' };
  }

  const dotCount = (strVal.match(/\./g) || []).length;
  const commaCount = (strVal.match(/,/g) || []).length;

  if (dotCount > 0 && commaCount > 0) {
    const lastDotIndex = strVal.lastIndexOf('.');
    const lastCommaIndex = strVal.lastIndexOf(',');
    if (lastCommaIndex > lastDotIndex) {
      // Brazilian style: dot is thousands, comma is decimal (e.g. 1.094,92)
      strVal = strVal.replace(/\./g, '').replace(/,/g, '.');
    } else {
      // US style: comma is thousands, dot is decimal (e.g. 1,094.92)
      strVal = strVal.replace(/,/g, '');
    }
  } else if (commaCount > 0 && dotCount === 0) {
    // Only commas
    const parts = strVal.split(',');
    const lastPart = parts[parts.length - 1];
    if (parts.length === 2 && (lastPart.length === 1 || lastPart.length === 2)) {
      // e.g. "1094,92" or "1094,9" -> treat as decimal comma
      strVal = strVal.replace(/,/g, '.');
    } else {
      // e.g. "1,094,000" -> treat as thousands commas
      strVal = strVal.replace(/,/g, '');
    }
  } else if (dotCount > 0 && commaCount === 0) {
    // Only dots
    const parts = strVal.split('.');
    const lastPart = parts[parts.length - 1];
    if (parts.length === 2 && lastPart.length === 3) {
      // e.g. "1.094" -> treat as thousands dot in Brazil
      strVal = strVal.replace(/\./g, '');
    } else if (dotCount > 1) {
      // e.g. "1.094.000" -> treat as thousands dots
      strVal = strVal.replace(/\./g, '');
    }
    // If it's like "1094.92" or "1.09", we do nothing, keep it as standard decimal dot
  }

  const numVal = parseFloat(strVal);
  if (isNaN(numVal)) {
    return { numVal: 0, error: `Número inválido: "${val}"` };
  }

  return { numVal };
}

/**
 * Parses raw Business Partner CSV data (semicolon delimited)
 */
export function parseBusinessPartnersCSV(csvText: string): BusinessPartner[] {
  const lines = csvText.split('\n');
  const partners: BusinessPartner[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(';');
    if (parts.length >= 3) {
      const cardCode = parts[0].trim().replace(/^\uFEFF/, ''); // Remove UTF-8 BOM
      const cardName = parts[1].trim();
      const cnpjCpf = parts[2].trim();
      
      // Skip header row
      if (cardCode.toLowerCase().includes('codigo') || cardCode.toLowerCase().includes('código') || cardCode.toLowerCase().includes('código do pn')) {
        continue;
      }
      
      partners.push({
        cardCode,
        cardName,
        cnpjCpf,
        normalizedCnpjCpf: cnpjCpf.replace(/\D/g, '')
      });
    }
  }
  return partners;
}

/**
 * Robust helper to find a business partner by CNPJ or CPF, with zero-padding fallback
 */
export function findPartnerByCnpjCpf(cnpjCpf: string, partners: BusinessPartner[]): BusinessPartner | undefined {
  const norm = cnpjCpf.replace(/\D/g, '');
  if (!norm) return undefined;
  
  // 1. Try exact normalized digits match
  let found = partners.find(p => p.normalizedCnpjCpf === norm);
  if (found) return found;
  
  // 2. Try comparison with standardized leading zeroes on both sides
  const normPadded14 = norm.padStart(14, '0');
  const normPadded11 = norm.padStart(11, '0');

  found = partners.find(p => {
    const dbNorm = p.normalizedCnpjCpf;
    if (!dbNorm) return false;
    
    // For CNPJ matching (lengths greater than 11 or containing typical CNPJ length)
    if (norm.length > 11 || dbNorm.length > 11) {
      return dbNorm.padStart(14, '0') === normPadded14;
    }
    
    // For CPF matching (lengths 11 or less)
    return dbNorm.padStart(11, '0') === normPadded11;
  });
  
  return found;
}

/**
 * Maps raw data into SAP structured rows and runs complete validation checks
 */
export function convertRows(
  rawRows: RawRow[],
  mapping: ColumnMapping,
  defaults: DefaultSettings,
  type: TransactionType,
  partnersList: BusinessPartner[] = []
): MappedRow[] {
  return rawRows.map((raw, idx) => {
    const errors: ValidationError[] = [];
    const rowNum = idx + 1; // 1-based index of row

    // 1. CardCode (Client / Vendor)
    let cardCode = '';
    const cardCodeCol = mapping.cardCode;
    if (cardCodeCol && raw[cardCodeCol] !== undefined) {
      cardCode = String(raw[cardCodeCol]).trim();
    }

    // Try to resolve CardCode via explicit CNPJ mapping if defined
    let resolvedCnpj = false;
    const partnerCnpjCol = mapping.partnerCnpj;
    if (partnerCnpjCol && raw[partnerCnpjCol] !== undefined) {
      const cnpjVal = String(raw[partnerCnpjCol]).trim();
      if (cnpjVal) {
        const matched = findPartnerByCnpjCpf(cnpjVal, partnersList);
        if (matched) {
          cardCode = matched.cardCode;
          resolvedCnpj = true;
          errors.push({
            row: rowNum,
            field: 'CardCode',
            value: cardCode,
            message: `[Sucesso] CNPJ/CPF "${cnpjVal}" cruzado com sucesso. Código resolvido: "${matched.cardCode}" (${matched.cardName})`,
            severity: 'warning'
          });
        } else {
          errors.push({
            row: rowNum,
            field: 'CardCode',
            value: cardCode,
            message: `[Aviso] O CNPJ/CPF "${cnpjVal}" não foi encontrado na base de parceiros cadastrada. Certifique-se de cadastrá-lo no SAP B1.`,
            severity: 'error'
          });
        }
      }
    }

    // If CardCode was not resolved yet, but cardCode contains a CNPJ value (numeric-like structure)
    if (!resolvedCnpj && cardCode) {
      const normalizedCardCode = cardCode.replace(/\D/g, '');
      // If it looks like a CNPJ/CPF (between 11 and 14 digits or contains separators)
      if (normalizedCardCode.length >= 9 && normalizedCardCode.length <= 14) {
        const matched = findPartnerByCnpjCpf(cardCode, partnersList);
        if (matched) {
          cardCode = matched.cardCode;
          resolvedCnpj = true;
          errors.push({
            row: rowNum,
            field: 'CardCode',
            value: cardCode,
            message: `[Sucesso] CNPJ/CPF "${raw[cardCodeCol]}" auto-detectado no campo de Código e cruzado com sucesso. Código resolvido: "${matched.cardCode}" (${matched.cardName})`,
            severity: 'warning'
          });
        } else if (cardCode.includes('.') || cardCode.includes('/') || cardCode.includes('-')) {
          // If they explicitly typed a CNPJ with formatting, we flag it as not found
          errors.push({
            row: rowNum,
            field: 'CardCode',
            value: cardCode,
            message: `[Aviso] O CNPJ/CPF "${cardCode}" fornecido como Código de Parceiro não foi encontrado no banco de dados.`,
            severity: 'error'
          });
        }
      }
    }

    if (!cardCode) {
      errors.push({
        row: rowNum,
        field: 'CardCode',
        value: cardCode,
        message: 'Código de Parceiro de Negócio (CardCode) é obrigatório.',
        severity: 'error'
      });
    } else if (!resolvedCnpj) {
      // Validation check for CardCode start letter only if not already auto-resolved from CNPJ (to prevent duplicate messages)
      if (type === 'PAGAR' && !cardCode.toUpperCase().startsWith('F')) {
        errors.push({
          row: rowNum,
          field: 'CardCode',
          value: cardCode,
          message: `Código do fornecedor geralmente começa com 'F' no SAP B1. Encontrado: "${cardCode}"`,
          severity: 'warning'
        });
      } else if (type === 'RECEBER' && !cardCode.toUpperCase().startsWith('C')) {
        errors.push({
          row: rowNum,
          field: 'CardCode',
          value: cardCode,
          message: `Código do cliente geralmente começa com 'C' no SAP B1. Encontrado: "${cardCode}"`,
          severity: 'warning'
        });
      }
    }

    // 2. SequenceSerial (NF Number)
    let sequenceSerial = '';
    const seqSerialCol = mapping.sequenceSerial;
    if (seqSerialCol && raw[seqSerialCol] !== undefined) {
      sequenceSerial = String(raw[seqSerialCol]).trim();
    }
    if (!sequenceSerial) {
      sequenceSerial = '1';
      errors.push({
        row: rowNum,
        field: 'SequenceSerial (NF)',
        value: '',
        message: 'Número de Nota Fiscal (SequenceSerial) ausente. Definido como "1".',
        severity: 'warning'
      });
    }

    // 3. SeriesString (Parcela)
    let seriesString = '';
    const seriesStringCol = mapping.seriesString;
    if (seriesStringCol && raw[seriesStringCol] !== undefined) {
      seriesString = String(raw[seriesStringCol]).trim();
    }
    if (!seriesString) {
      seriesString = 'A'; // Default to first installment
      errors.push({
        row: rowNum,
        field: 'SeriesString (Parcela)',
        value: '',
        message: 'Parcela não informada. Definida como "A".',
        severity: 'warning'
      });
    }

    // 4. Dates
    // TaxDate (Document Date)
    let taxDate = '';
    const taxDateCol = mapping.taxDate;
    if (taxDateCol && raw[taxDateCol] !== undefined) {
      const parsed = parseToSAPDate(raw[taxDateCol]);
      if (parsed.error) {
        errors.push({
          row: rowNum,
          field: 'TaxDate (Data Documento)',
          value: raw[taxDateCol],
          message: `Erro data documento: ${parsed.error}`,
          severity: 'error'
        });
      } else {
        taxDate = reformatSAPDate(parsed.dateStr, defaults.dateFormat || 'YYYY-MM-DD');
      }
    } else {
      // Fallback to today or docDate
      errors.push({
        row: rowNum,
        field: 'TaxDate (Data Documento)',
        value: '',
        message: 'Mapeamento de Data do Documento ausente.',
        severity: 'error'
      });
    }

    // DocDueDate (Due Date) - Always prefer 'DATA DE PAGTO' (or equivalent) if present in the spreadsheet
    let docDueDate = '';
    let docDueDateCol = mapping.docDueDate;

    // Search raw keys to see if there is any column representing 'DATA DE PAGTO'
    const pagtoKey = Object.keys(raw).find(k => {
      const norm = normalizeString(k);
      return norm === 'datapagto' || norm === 'dtpagto' || norm === 'datapagamento' || norm === 'dtpagamento' || norm === 'pagto';
    });

    if (pagtoKey) {
      docDueDateCol = pagtoKey;
    }

    if (docDueDateCol && raw[docDueDateCol] !== undefined) {
      const parsed = parseToSAPDate(raw[docDueDateCol]);
      if (parsed.error) {
        errors.push({
          row: rowNum,
          field: 'DocDueDate (Data Vencimento)',
          value: raw[docDueDateCol],
          message: `Erro data vencimento: ${parsed.error}`,
          severity: 'error'
        });
      } else {
        docDueDate = reformatSAPDate(parsed.dateStr, defaults.dateFormat || 'YYYY-MM-DD');
      }
    } else {
      errors.push({
        row: rowNum,
        field: 'DocDueDate (Data Vencimento)',
        value: '',
        message: 'Mapeamento de Data de Vencimento ausente.',
        severity: 'error'
      });
    }

    // DocDate (Posting Date) - Hardcoded to '20260701' as requested for import load, reformatted to the target format
    const docDate = reformatSAPDate('20260701', defaults.dateFormat || 'YYYY-MM-DD');

    // 5. DocTotal (Value of the installment)
    let docTotal = 0;
    const docTotalCol = mapping.docTotal;
    if (docTotalCol && raw[docTotalCol] !== undefined) {
      const parsed = parseToSAPNumber(raw[docTotalCol]);
      if (parsed.error) {
        errors.push({
          row: rowNum,
          field: 'DocTotal (Valor Parcela)',
          value: raw[docTotalCol],
          message: `Erro no valor: ${parsed.error}`,
          severity: 'error'
        });
      } else {
        docTotal = parsed.numVal;
        if (docTotal <= 0) {
          errors.push({
            row: rowNum,
            field: 'DocTotal (Valor Parcela)',
            value: docTotal,
            message: 'O valor da parcela deve ser maior que zero.',
            severity: 'warning'
          });
        }
      }
    } else {
      errors.push({
        row: rowNum,
        field: 'DocTotal (Valor Parcela)',
        value: '',
        message: 'Mapeamento de Valor da Parcela ausente.',
        severity: 'error'
      });
    }

    // 6. NumAtCard (Reference / Reference NF + Parcela)
    let numAtCard = '';
    const numAtCardCol = mapping.numAtCard;
    if (numAtCardCol && raw[numAtCardCol] !== undefined) {
      numAtCard = String(raw[numAtCardCol]).trim();
    }
    // Auto build formula: NF + "/" + Parcela if empty
    if (!numAtCard && sequenceSerial && seriesString) {
      numAtCard = `${sequenceSerial}/${seriesString}`;
    }

    // 7. Comments / Observação
    let comments = defaults.comments || (type === 'RECEBER' ? 'SALDO INICIAL CR' : 'SALDO INICIAL CP');
    const commentsCol = mapping.comments;
    if (commentsCol && raw[commentsCol] !== undefined) {
      const userComment = String(raw[commentsCol]).trim();
      if (userComment) {
        comments = userComment;
      }
    }

    // 8. SalesPersonCode / SlpCode
    let salesPersonCode = defaults.salesPersonCode || '';
    const salesPersonCol = mapping.salesPersonCode;
    if (salesPersonCol && raw[salesPersonCol] !== undefined) {
      salesPersonCode = String(raw[salesPersonCol]).trim();
    }

    // 9. PaymentGroupCode / GroupNum
    let paymentGroupCode = defaults.paymentGroupCode || '-1';
    const paymentGroupCol = mapping.paymentGroupCode;
    if (paymentGroupCol && raw[paymentGroupCol] !== undefined) {
      paymentGroupCode = String(raw[paymentGroupCol]).trim();
    }

    // 10. BPL_ID / Filial
    let bplId = defaults.bplId || '1';
    const bplIdCol = mapping.bplId;
    if (bplIdCol && raw[bplIdCol] !== undefined) {
      const rawBpl = String(raw[bplIdCol]).trim();
      const upperRawBpl = rawBpl.toUpperCase();
      if (upperRawBpl.startsWith('DIAS+')) {
        bplId = '4';
      } else if (upperRawBpl.startsWith('DIAS')) {
        bplId = '3';
      } else if (upperRawBpl.startsWith('MM')) {
        bplId = '1';
      } else if (upperRawBpl.startsWith('MD')) {
        bplId = '2';
      } else if (upperRawBpl.startsWith('CERTA')) {
        bplId = '5';
      } else {
        bplId = rawBpl;
      }
    }

    // 11. Transaction type specific columns
    let ourNumber = '';
    let contractBank = defaults.contractBank || '';
    let linhaDigitavel = '';

    if (type === 'RECEBER') {
      const ourNumberCol = mapping.ourNumber;
      if (ourNumberCol && raw[ourNumberCol] !== undefined) {
        ourNumber = String(raw[ourNumberCol]).trim();
      }
      
      const contractBankCol = mapping.contractBank;
      if (contractBankCol && raw[contractBankCol] !== undefined) {
        contractBank = String(raw[contractBankCol]).trim();
      }
    } else {
      const linhaDigitavelCol = mapping.linhaDigitavel;
      if (linhaDigitavelCol && raw[linhaDigitavelCol] !== undefined) {
        linhaDigitavel = String(raw[linhaDigitavelCol]).trim();
      }
    }

    return {
      id: rowNum,
      docNum: rowNum, // Set sequential DocNum (1, 2, 3...)
      cardCode,
      docType: defaults.docType || 'dDocument_Service',
      series: defaults.series || '4',
      sequenceCode: defaults.sequenceCode || '-1',
      handWritten: defaults.handWritten || 'Y',
      printed: defaults.printed || 'Y',
      sequenceSerial,
      seriesString,
      taxDate,
      docDueDate,
      docDate,
      numAtCard,
      comments,
      docTotal,
      salesPersonCode,
      paymentGroupCode,
      bplId,
      
      // Conditionally assign specifics
      ...(type === 'RECEBER' ? { ourNumber, contractBank } : { linhaDigitavel }),
      
      originalRow: raw,
      errors
    };
  });
}

/**
 * Builds CSV content for DTW based on mapped rows and templates
 */
export function generateSAPCSV(mappedRows: MappedRow[], type: TransactionType): string {
  const delimiter = ';';
  const csvLines: string[] = [];

  if (type === 'RECEBER') {
    // Row 1: Technical Field Names (SAP standard import)
    // DocNum;CardCode;DocType;Series;SequenceCode;HandWritten;Printed;SequenceSerial;SeriesString;TaxDate;DocDueDate;DocDate;NumAtCard;Comments;DocTotal;SalesPersonCode;PaymentGroupCode;BPL_IDAssignedToInvoice;;
    const row1 = [
      'DocNum', 'CardCode', 'DocType', 'Series', 'SequenceCode', 'HandWritten', 'Printed', 
      'SequenceSerial', 'SeriesString', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SalesPersonCode', 'PaymentGroupCode', 'BPL_IDAssignedToInvoice', '', ''
    ].join(delimiter);
    csvLines.push(row1);

    // Row 2: Alternate / Short Tech names (for DTW mapping convenience)
    // DocNum;CardCode;DocType;Series;SeqCode;Handwrtten;Printed;Serial;SeriesStr;TaxDate;DocDueDate;DocDate;NumAtCard;Comments;DocTotal;SlpCode;GroupNum;BPLId;*OurNumber;*ContractBank
    const row2 = [
      'DocNum', 'CardCode', 'DocType', 'Series', 'SeqCode', 'Handwrtten', 'Printed', 
      'Serial', 'SeriesStr', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SlpCode', 'GroupNum', 'BPLId', '*OurNumber', '*ContractBank'
    ].join(delimiter);
    csvLines.push(row2);

    // Row 3: User Descriptions (Portuguese)
    // NUMERO DOCUMENTO SEQ;COD CLIENTE;TIPO DO DOCUMENTO;SERIE DO DOCUMENTO;SeqCode;;IMPRESSO;NF;PARCELA;DT DOCUMENTO;DT VENCIMENTO;DT LANÇAMENTO;NF + PARCELA;OBSERVAÇÃO;TOTAL DA PARCELA;COD VENDEDOR / COMPRADOR;COND PADRÃO;FILIAL;Nosso Número + dígito verificador;ID do Contrato Bancário criado no IntegrationBank
    const row3 = [
      'NUMERO DOCUMENTO SEQ', 'COD CLIENTE', 'TIPO DO DOCUMENTO', 'SERIE DO DOCUMENTO', 'SeqCode', '', 'IMPRESSO', 
      'NF', 'PARCELA', 'DT DOCUMENTO', 'DT VENCIMENTO', 'DT LANÇAMENTO', 'NF + PARCELA', 
      'OBSERVAÇÃO', 'TOTAL DA PARCELA', 'COD VENDEDOR / COMPRADOR', 'COND PADRÃO', 'FILIAL', 
      'Nosso Número + dígito verificador', 'ID do Contrato Bancário criado no IntegrationBank'
    ].join(delimiter);
    csvLines.push(row3);

    // Data rows
    mappedRows.forEach((row) => {
      const dataLine = [
        row.docNum,
        row.cardCode,
        row.docType,
        row.series,
        row.sequenceCode,
        row.handWritten,
        row.printed,
        row.sequenceSerial,
        row.seriesString,
        row.taxDate,
        row.docDueDate,
        row.docDate,
        row.numAtCard,
        row.comments,
        row.docTotal.toFixed(2), // Always 2 decimals
        row.salesPersonCode,
        row.paymentGroupCode,
        row.bplId,
        row.ourNumber || '',
        row.contractBank || ''
      ].join(delimiter);
      csvLines.push(dataLine);
    });

  } else {
    // Row 1: Technical Field Names
    // DocNum;CardCode;DocType;Series;SequenceCode;HandWritten;Printed;SequenceSerial;SeriesString;TaxDate;DocDueDate;DocDate;NumAtCard;Comments;DocTotal;SalesPersonCode;PaymentGroupCode;BPL_IDAssignedToInvoice;PCH6.U_LinhaDigitavel
    const row1 = [
      'DocNum', 'CardCode', 'DocType', 'Series', 'SequenceCode', 'HandWritten', 'Printed', 
      'SequenceSerial', 'SeriesString', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SalesPersonCode', 'PaymentGroupCode', 'BPL_IDAssignedToInvoice', 'PCH6.U_LinhaDigitavel'
    ].join(delimiter);
    csvLines.push(row1);

    // Row 2: Alternate Tech names
    // DocNum;CardCode;DocType;Series;SeqCode;Handwrtten;Printed;Serial;SeriesStr;TaxDate;DocDueDate;DocDate;NumAtCard;Comments;DocTotal;SlpCode;GroupNum;BPLId;PCH6.U_LinhaDigitavel
    const row2 = [
      'DocNum', 'CardCode', 'DocType', 'Series', 'SeqCode', 'Handwrtten', 'Printed', 
      'Serial', 'SeriesStr', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SlpCode', 'GroupNum', 'BPLId', 'PCH6.U_LinhaDigitavel'
    ].join(delimiter);
    csvLines.push(row2);

    // Row 3: User Descriptions (Portuguese)
    // NUMERO DOCUMENTO SEQ;COD CLIENTE;TIPO DO DOCUMENTO;SERIE DO DOCUMENTO;SeqCode;;IMPRESSO;NF;PARCELA;DT DOCUMENTO;DT VENCIMENTO;DT LANÇAMENTO;NF + PARCELA;OBSERVAÇÃO;TOTAL DA PARCELA;COD VENDEDOR / COMPRADOR;COND PADRÃO;FILIAL;Linha digitável do Boleto
    const row3 = [
      'NUMERO DOCUMENTO SEQ', 'COD CLIENTE', 'TIPO DO DOCUMENTO', 'SERIE DO DOCUMENTO', 'SeqCode', '', 'IMPRESSO', 
      'NF', 'PARCELA', 'DT DOCUMENTO', 'DT VENCIMENTO', 'DT LANÇAMENTO', 'NF + PARCELA', 
      'OBSERVAÇÃO', 'TOTAL DA PARCELA', 'COD VENDEDOR / COMPRADOR', 'COND PADRÃO', 'FILIAL', 
      'Linha digitável do Boleto'
    ].join(delimiter);
    csvLines.push(row3);

    // Data rows
    mappedRows.forEach((row) => {
      const dataLine = [
        row.docNum,
        row.cardCode,
        row.docType,
        row.series,
        row.sequenceCode,
        row.handWritten,
        row.printed,
        row.sequenceSerial,
        row.seriesString,
        row.taxDate,
        row.docDueDate,
        row.docDate,
        row.numAtCard,
        row.comments,
        row.docTotal.toFixed(2),
        row.salesPersonCode,
        row.paymentGroupCode,
        row.bplId,
        row.linhaDigitavel || ''
      ].join(delimiter);
      csvLines.push(dataLine);
    });
  }

  // SAP B1 DTW files require a trailing empty semicolon line pattern for padding sometimes, but a simple CRLF is standard.
  // We can join with Windows CRLF (\r\n) since standard SAP loaders usually run on Windows servers
  return csvLines.join('\r\n');
}

/**
 * Generates an Excel sheet matching the exact 3-row header DTW structure and downloads it
 */
export function exportToExcel(mappedRows: MappedRow[], type: TransactionType): void {
  const dataRows: any[][] = [];

  if (type === 'RECEBER') {
    // Row 1: Technical Field Names
    dataRows.push([
      'DocNum', 'CardCode', 'DocType', 'Series', 'SequenceCode', 'HandWritten', 'Printed', 
      'SequenceSerial', 'SeriesString', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SalesPersonCode', 'PaymentGroupCode', 'BPL_IDAssignedToInvoice', 'OurNum', 'ContractBank'
    ]);
    // Row 2: Alternate Tech Names
    dataRows.push([
      'DocNum', 'CardCode', 'DocType', 'Series', 'SeqCode', 'Handwrtten', 'Printed', 
      'Serial', 'SeriesStr', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SlpCode', 'GroupNum', 'BPLId', 'OurNum', 'ContractBank'
    ]);
    // Row 3: User Descriptions (Portuguese)
    dataRows.push([
      'NUMERO DOCUMENTO SEQ', 'COD CLIENTE', 'TIPO DO DOCUMENTO', 'SERIE DO DOCUMENTO', 'SeqCode', '', 'IMPRESSO', 
      'NF', 'PARCELA', 'DT DOCUMENTO', 'DT VENCIMENTO', 'DT LANÇAMENTO', 'NF + PARCELA', 
      'OBSERVAÇÃO', 'TOTAL DA PARCELA', 'COD VENDEDOR / COMPRADOR', 'COND PADRÃO', 'FILIAL', 
      'Nosso Número + dígito verificador', 'ID do Contrato Bancário criado no IntegrationBank'
    ]);

    mappedRows.forEach(row => {
      dataRows.push([
        row.docNum,
        row.cardCode,
        row.docType,
        row.series,
        row.sequenceCode,
        row.handWritten,
        row.printed,
        row.sequenceSerial,
        row.seriesString,
        row.taxDate,
        row.docDueDate,
        row.docDate,
        row.numAtCard,
        row.comments,
        row.docTotal.toFixed(2),
        row.salesPersonCode,
        row.paymentGroupCode,
        row.bplId,
        row.ourNumber || '',
        row.contractBank || ''
      ]);
    });
  } else {
    // Row 1: Technical Field Names
    dataRows.push([
      'DocNum', 'CardCode', 'DocType', 'Series', 'SequenceCode', 'HandWritten', 'Printed', 
      'SequenceSerial', 'SeriesString', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SalesPersonCode', 'PaymentGroupCode', 'BPL_IDAssignedToInvoice', 'PCH6.U_LinhaDigitavel'
    ]);
    // Row 2: Alternate Tech Names
    dataRows.push([
      'DocNum', 'CardCode', 'DocType', 'Series', 'SeqCode', 'Handwrtten', 'Printed', 
      'Serial', 'SeriesStr', 'TaxDate', 'DocDueDate', 'DocDate', 'NumAtCard', 
      'Comments', 'DocTotal', 'SlpCode', 'GroupNum', 'BPLId', 'PCH6.U_LinhaDigitavel'
    ]);
    // Row 3: User Descriptions (Portuguese)
    dataRows.push([
      'NUMERO DOCUMENTO SEQ', 'COD CLIENTE', 'TIPO DO DOCUMENTO', 'SERIE DO DOCUMENTO', 'SeqCode', '', 'IMPRESSO', 
      'NF', 'PARCELA', 'DT DOCUMENTO', 'DT VENCIMENTO', 'DT LANÇAMENTO', 'NF + PARCELA', 
      'OBSERVAÇÃO', 'TOTAL DA PARCELA', 'COD VENDEDOR / COMPRADOR', 'COND PADRÃO', 'FILIAL', 
      'Linha digitável do Boleto'
    ]);

    mappedRows.forEach(row => {
      dataRows.push([
        row.docNum,
        row.cardCode,
        row.docType,
        row.series,
        row.sequenceCode,
        row.handWritten,
        row.printed,
        row.sequenceSerial,
        row.seriesString,
        row.taxDate,
        row.docDueDate,
        row.docDate,
        row.numAtCard,
        row.comments,
        row.docTotal.toFixed(2),
        row.salesPersonCode,
        row.paymentGroupCode,
        row.bplId,
        row.linhaDigitavel || ''
      ]);
    });
  }

  // Create workbook & worksheet
  const ws = XLSX.utils.aoa_to_sheet(dataRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'SAP DTW Import');

  // Generate buffer and trigger robust download
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const safeFileName = `carga_saldo_sap_${type.toLowerCase()}_${new Date().toISOString().substring(0, 10)}.xlsx`;
  link.setAttribute('download', safeFileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Creates sample datasets to load on one click
 */
export function getSampleData(type: TransactionType): RawRow[] {
  if (type === 'RECEBER') {
    return [
      {
        'Código Cliente': 'C00000011',
        'Nota Fiscal': '9516',
        'Parcela': 'A',
        'Data Emissão': '01/06/2026',
        'Data Vencimento': '01/07/2026',
        'Data Lançamento': '01/06/2026',
        'Valor Duplicata': '1918.43',
        'Filial': '2',
        'Nosso Número': '123456789-0',
        'ID Banco': '1'
      },
      {
        'Código Cliente': 'C00000011',
        'Nota Fiscal': '9517',
        'Parcela': 'A',
        'Data Emissão': '2026-06-01',
        'Data Vencimento': '2026-07-01',
        'Data Lançamento': '2026-06-01',
        'Valor Duplicata': '146,34',
        'Filial': '2',
        'Nosso Número': '123456789-1',
        'ID Banco': '1'
      },
      {
        'Código Cliente': 'C00000001',
        'Nota Fiscal': '17065',
        'Parcela': 'A',
        'Data Emissão': '44561', // Excel Serial date representation
        'Data Vencimento': '44591',
        'Data Lançamento': '44561',
        'Valor Duplicata': '33403.08',
        'Filial': '1',
        'Nosso Número': '',
        'ID Banco': ''
      },
      {
        // Example of a bad code warning/error to demonstrate the validation engine
        'Código Cliente': 'F0000012', // Warning: starting with F in AR
        'Nota Fiscal': '9999',
        'Parcela': 'A',
        'Data Emissão': '01/06/2026',
        'Data Vencimento': '01/07/2026',
        'Data Lançamento': '', // Trigger warning/info auto-fallback
        'Valor Duplicata': '500,00',
        'Filial': '1'
      }
    ];
  } else {
    return [
      {
        'Fornecedor': 'F000002',
        'Nota Fiscal': '58335',
        'Parcela': 'A',
        'Data Documento': '30/08/2021',
        'Vencimento': '27/09/2021',
        'Data Lançamento': '31/12/2021',
        'Valor Aberto': '1312,25',
        'Filial': '1',
        'Código Comprador': '60',
        'Linha Digitável': '34191.79001 01043.513184 91020.150008 7 87560000131225'
      },
      {
        'Fornecedor': 'F000002',
        'Nota Fiscal': '58335',
        'Parcela': 'B',
        'Data Documento': '30/08/2021',
        'Vencimento': '04/10/2021',
        'Data Lançamento': '31/12/2021',
        'Valor Aberto': '1312.25',
        'Filial': '1',
        'Código Comprador': '60',
        'Linha Digitável': '34191.79001 01043.513184 91020.150008 7 87560000131225'
      },
      {
        'Fornecedor': 'F000002',
        'Nota Fiscal': '58335',
        'Parcela': 'C',
        'Data Documento': '20210830', // Already in standard format
        'Vencimento': '20211011',
        'Data Lançamento': '20211231',
        'Valor Aberto': '1312,25',
        'Filial': '1',
        'Código Comprador': '60',
        'Linha Digitável': ''
      },
      {
        'Fornecedor': 'C0000032', // Warning: starting with C in AP
        'Nota Fiscal': '7788',
        'Parcela': '1',
        'Data Documento': 'invalid-date', // Error: invalid date triggers validation highlight
        'Vencimento': '15/07/2026',
        'Data Lançamento': '15/06/2026',
        'Valor Aberto': '2500.00',
        'Filial': '1',
        'Código Comprador': '',
        'Linha Digitável': ''
      }
    ];
  }
}
