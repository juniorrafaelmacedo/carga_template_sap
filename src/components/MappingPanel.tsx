import { AlertCircle, HelpCircle, Check, Info } from 'lucide-react';
import { ColumnMapping, TransactionType } from '../types';

interface MappingPanelProps {
  headers: string[];
  mapping: ColumnMapping;
  onMappingChange: (field: keyof ColumnMapping, val: string) => void;
  type: TransactionType;
}

interface FieldDefinition {
  key: keyof ColumnMapping;
  label: string;
  sapField: string;
  required: boolean;
  desc: string;
  placeholder?: string;
}

export default function MappingPanel({
  headers,
  mapping,
  onMappingChange,
  type
}: MappingPanelProps) {

  const coreFields: FieldDefinition[] = [
    {
      key: 'cardCode',
      label: type === 'RECEBER' ? 'Código do Cliente (CardCode)' : 'Código do Fornecedor (CardCode)',
      sapField: 'CardCode',
      required: true,
      desc: 'Código do Parceiro de Negócios no SAP B1 (Ex: C00001 ou F00002).'
    },
    {
      key: 'partnerCnpj',
      label: 'CNPJ/CPF do Parceiro (Cruzamento)',
      sapField: 'CNPJ/CPF Lookup',
      required: false,
      desc: 'Opcional. Coluna de CNPJ/CPF para buscar e cruzar com o CardCode correspondente.'
    },
    {
      key: 'sequenceSerial',
      label: 'Número da Nota Fiscal (NF)',
      sapField: 'Serial (SequenceSerial)',
      required: true,
      desc: 'Número identificador da Nota Fiscal (Ex: 9516).'
    },
    {
      key: 'seriesString',
      label: 'Parcela / Letra (SeriesString)',
      sapField: 'SeriesStr (SeriesString)',
      required: true,
      desc: 'Letra ou número identificador da parcela (Ex: A, B, C).'
    }
  ];

  const dateFields: FieldDefinition[] = [
    {
      key: 'taxDate',
      label: 'Data do Documento (TaxDate)',
      sapField: 'TaxDate',
      required: true,
      desc: 'Data de emissão da Nota Fiscal (Sera formatada como YYYYMMDD).'
    },
    {
      key: 'docDueDate',
      label: 'Data de Vencimento (DocDueDate)',
      sapField: 'DocDueDate',
      required: true,
      desc: 'Data de vencimento da parcela (Será formatada como YYYYMMDD).'
    },
    {
      key: 'docDate',
      label: 'Data de Lançamento (DocDate)',
      sapField: 'DocDate',
      required: false,
      desc: 'Data de lançamento contábil. Fixada automaticamente como 20260701 para a carga.'
    }
  ];

  const valueFields: FieldDefinition[] = [
    {
      key: 'docTotal',
      label: 'Valor da Parcela (DocTotal)',
      sapField: 'DocTotal',
      required: true,
      desc: 'Valor residual ou valor da duplicata. Suporta formatos com vírgula ou ponto.'
    },
    {
      key: 'comments',
      label: 'Observações / Comentários',
      sapField: 'Comments',
      required: false,
      desc: 'Descrição ou comentários para o documento de saldo. Se vazio, usará o valor padrão.'
    },
    {
      key: 'numAtCard',
      label: 'Referência (NumAtCard)',
      sapField: 'NumAtCard',
      required: false,
      desc: 'Número de referência. Se vazio, gerará automaticamente no formato "Nota/Parcela".'
    }
  ];

  const advancedFields: FieldDefinition[] = [
    {
      key: 'bplId',
      label: 'Filial (BPL_ID)',
      sapField: 'BPLId',
      required: false,
      desc: 'Código numérico identificador da filial no SAP B1 (Ex: 1, 2).'
    },
    {
      key: 'paymentGroupCode',
      label: 'Condição de Pagamento (PaymentGroupCode)',
      sapField: 'GroupNum',
      required: false,
      desc: 'Código identificador da condição de pagamento (Padrão: -1).'
    },
    {
      key: 'salesPersonCode',
      label: type === 'RECEBER' ? 'Código do Vendedor (SalesPersonCode)' : 'Código do Comprador (SalesPersonCode)',
      sapField: 'SlpCode',
      required: false,
      desc: 'Código do Vendedor / Comprador (Ex: 60).'
    }
  ];

  const specificFields: FieldDefinition[] = type === 'RECEBER'
    ? [
        {
          key: 'ourNumber',
          label: 'Nosso Número (*OurNumber)',
          sapField: '*OurNumber',
          required: false,
          desc: 'Nosso Número com dígito verificador para emissão de boletos bancários.'
        },
        {
          key: 'contractBank',
          label: 'ID Contrato Bancário (*ContractBank)',
          sapField: '*ContractBank',
          required: false,
          desc: 'Código do Contrato Bancário configurado no IntegrationBank.'
        }
      ]
    : [
        {
          key: 'linhaDigitavel',
          label: 'Linha Digitável do Boleto',
          sapField: 'PCH6.U_LinhaDigitavel',
          required: false,
          desc: 'Linha digitável do boleto para contas a pagar (U_LinhaDigitavel).'
        }
      ];

  const renderField = (field: FieldDefinition) => {
    const selectedValue = mapping[field.key] || '';
    const isAutoMapped = selectedValue !== '' && headers.includes(selectedValue);

    return (
      <div id={`field-mapping-container-${field.key}`} key={field.key} className="p-5 border border-[#141414] bg-white flex flex-col justify-between hover:bg-[#F5F5F0]/10 transition-colors">
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-serif font-bold text-[#141414] flex items-center gap-1">
              {field.label}
              {field.required && <span className="text-red-600 font-bold">*</span>}
            </label>
            <span className="text-[9px] font-mono uppercase text-[#141414]/70 bg-[#F5F5F0] border border-[#141414]/30 px-1.5 py-0.5">
              SAP: {field.sapField}
            </span>
          </div>
          
          <p className="text-[11px] text-[#141414]/70 mb-4 leading-relaxed font-serif italic">
            {field.desc}
          </p>
        </div>

        <div className="relative mt-2">
          <select
            id={`select-mapping-${field.key}`}
            value={selectedValue}
            onChange={(e) => onMappingChange(field.key, e.target.value)}
            className={`w-full py-2.5 pl-3 pr-10 text-xs rounded-none border-2 border-[#141414] bg-white font-mono focus:outline-hidden focus:ring-0 appearance-none cursor-pointer ${
              field.required && !selectedValue
                ? 'bg-red-50 text-red-700'
                : isAutoMapped
                ? 'text-[#141414] bg-[#F5F5F0]/50'
                : 'text-[#141414]'
            }`}
          >
            <option value="">
              {field.required ? '-- SELECIONAR (OBRIGATÓRIO) --' : '-- VALOR PADRÃO SAP --'}
            </option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          
          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {isAutoMapped ? (
              <span className="text-[8px] font-mono bg-[#141414] text-[#F5F5F0] font-bold px-1.5 py-0.5 uppercase tracking-wider mr-2">
                Auto
              </span>
            ) : field.required && !selectedValue ? (
              <AlertCircle size={14} className="text-red-500 mr-2" />
            ) : selectedValue ? (
              <Check size={14} className="text-emerald-700 mr-2" />
            ) : null}
            <svg className="h-4 w-4 text-[#141414]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="mapping-panel-section" className="bg-white p-8 border-2 border-[#141414] shadow-[4px_4px_0px_#141414]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-xl font-serif font-bold text-[#141414] flex items-center gap-3">
          <span className="font-serif italic text-2xl pr-3 border-r-2 border-[#141414] text-[#141414]">02</span>
          Passo 2: Mapeamento de Colunas da Planilha
        </h2>
        
        <div className="flex items-center gap-1.5 text-xs text-[#141414] bg-[#F5F5F0] border border-[#141414] px-3 py-1.5 font-mono uppercase tracking-wider">
          <Info size={14} />
          <span>Mapeamento inteligente ativo!</span>
        </div>
      </div>

      <div className="space-y-8">
        {/* Section 1: Core Fields */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 border-b-2 border-[#141414] pb-1.5 flex items-center gap-2">
            <span className="font-serif italic text-sm">I.</span> Dados Técnicos do Documento e Parceiro
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {coreFields.map(renderField)}
          </div>
        </div>

        {/* Section 2: Dates */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 border-b-2 border-[#141414] pb-1.5 flex items-center gap-2">
            <span className="font-serif italic text-sm">II.</span> Datas e Prazos Financeiros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {dateFields.map(renderField)}
          </div>
        </div>

        {/* Section 3: Values */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 border-b-2 border-[#141414] pb-1.5 flex items-center gap-2">
            <span className="font-serif italic text-sm">III.</span> Valores da Parcela e Observações
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {valueFields.map(renderField)}
          </div>
        </div>

        {/* Section 4: SAP Advanced */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 border-b-2 border-[#141414] pb-1.5 flex items-center gap-2">
            <span className="font-serif italic text-sm">IV.</span> Campos Estruturais e Organizacionais do SAP
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {advancedFields.map(renderField)}
          </div>
        </div>

        {/* Section 5: Specific Fields */}
        <div>
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] mb-4 border-b-2 border-[#141414] pb-1.5 flex items-center gap-2">
            <span className="font-serif italic text-sm">V.</span> Campos Auxiliares Contas a {type === 'RECEBER' ? 'Receber' : 'Pagar'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {specificFields.map(renderField)}
          </div>
        </div>
      </div>
    </div>
  );
}
