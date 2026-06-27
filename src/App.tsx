import { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, 
  Settings, 
  HelpCircle, 
  FileDown, 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  RefreshCw,
  FolderOpen,
  Info,
  DollarSign,
  Briefcase
} from 'lucide-react';
import { ColumnMapping, DefaultSettings, MappedRow, RawRow, TransactionType, BusinessPartner } from './types';
import { autoMapColumns, convertRows, generateSAPCSV, parseBusinessPartnersCSV, exportToExcel } from './utils/converter';
import { PRELOADED_PARTNERS_CSV } from './data/partners_db';

// Import our custom sub-components
import FileUploader from './components/FileUploader';
import MappingPanel from './components/MappingPanel';
import DefaultSettingsForm from './components/DefaultSettingsForm';
import ValidationSummary from './components/ValidationSummary';
import PreviewTable from './components/PreviewTable';
import PartnersDatabasePanel from './components/PartnersDatabasePanel';

const INITIAL_SETTINGS_PAGAR: DefaultSettings = {
  docType: 'dDocument_Service',
  series: '4',
  sequenceCode: '-1',
  handWritten: 'Y',
  printed: 'Y',
  paymentGroupCode: '-1',
  bplId: '1',
  comments: 'SALDO INICIAL CP',
  salesPersonCode: '',
  contractBank: '',
  dateFormat: 'YYYY-MM-DD'
};

const INITIAL_SETTINGS_RECEBER: DefaultSettings = {
  docType: 'dDocument_Service',
  series: '4',
  sequenceCode: '-1',
  handWritten: 'Y',
  printed: 'Y',
  paymentGroupCode: '-1',
  bplId: '1',
  comments: 'SALDO INICIAL CR',
  salesPersonCode: '',
  contractBank: '',
  dateFormat: 'YYYY-MM-DD'
};

export default function App() {
  const [type, setType] = useState<TransactionType>('PAGAR'); // First Accounts Payable as requested
  const [fileName, setFileName] = useState<string | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<RawRow[]>([]);
  const [mapping, setMapping] = useState<ColumnMapping>({
    docNum: '', cardCode: '', docType: '', series: '', sequenceCode: '',
    handWritten: '', printed: '', sequenceSerial: '', seriesString: '',
    taxDate: '', docDueDate: '', docDate: '', numAtCard: '', comments: '',
    docTotal: '', salesPersonCode: '', paymentGroupCode: '', bplId: '',
    ourNumber: '', contractBank: '', linhaDigitavel: '', partnerCnpj: ''
  });
  const [settings, setSettings] = useState<DefaultSettings>(INITIAL_SETTINGS_PAGAR);
  const [mappedRows, setMappedRows] = useState<MappedRow[]>([]);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);

  // Business Partner Database State
  const [partners, setPartners] = useState<BusinessPartner[]>(() => 
    parseBusinessPartnersCSV(PRELOADED_PARTNERS_CSV)
  );
  const [partnerFileName, setPartnerFileName] = useState<string>('Base Padrão SAP B1 (Pré-carregada)');
  
  // Update default settings when type changes
  useEffect(() => {
    if (type === 'PAGAR') {
      setSettings(INITIAL_SETTINGS_PAGAR);
    } else {
      setSettings(INITIAL_SETTINGS_RECEBER);
    }
    // If there is data, reset mapping and auto-map again based on new type context
    if (headers.length > 0) {
      const autoMapped = autoMapColumns(headers);
      setMapping(autoMapped);
    }
  }, [type]);

  // Recalculate converted rows and run validation checks reactively
  useEffect(() => {
    if (rows.length > 0) {
      const converted = convertRows(rows, mapping, settings, type, partners);
      setMappedRows(converted);
    } else {
      setMappedRows([]);
    }
  }, [rows, mapping, settings, type, partners]);

  const handleDataLoaded = (loadedFileName: string, loadedHeaders: string[], loadedRows: RawRow[]) => {
    setFileName(loadedFileName);
    setHeaders(loadedHeaders);
    setRows(loadedRows);
    setSelectedRowId(null);

    // Run smart auto-mapping of headers
    const autoMapped = autoMapColumns(loadedHeaders);
    setMapping(autoMapped);
  };

  const handleMappingChange = (field: keyof ColumnMapping, selectedHeader: string) => {
    setMapping(prev => ({
      ...prev,
      [field]: selectedHeader
    }));
  };

  const handleSettingChange = (field: keyof DefaultSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleReset = () => {
    setFileName(null);
    setHeaders([]);
    setRows([]);
    setMappedRows([]);
    setSelectedRowId(null);
    setMapping({
      docNum: '', cardCode: '', docType: '', series: '', sequenceCode: '',
      handWritten: '', printed: '', sequenceSerial: '', seriesString: '',
      taxDate: '', docDueDate: '', docDate: '', numAtCard: '', comments: '',
      docTotal: '', salesPersonCode: '', paymentGroupCode: '', bplId: '',
      ourNumber: '', contractBank: '', linhaDigitavel: '', partnerCnpj: ''
    });
  };

  const handleDownload = () => {
    if (mappedRows.length === 0) return;

    try {
      const csvContent = generateSAPCSV(mappedRows, type);
      
      // Force UTF-8 BOM so Excel opens Portuguese accents (like observações) properly
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      
      const safeFileName = `carga_saldo_sap_${type.toLowerCase()}_${new Date().toISOString().substring(0, 10)}.csv`;
      link.setAttribute('href', url);
      link.setAttribute('download', safeFileName);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error generating CSV:', error);
    }
  };

  const handleDownloadExcel = () => {
    if (mappedRows.length === 0) return;

    try {
      exportToExcel(mappedRows, type);
    } catch (error) {
      console.error('Error generating Excel:', error);
    }
  };

  // Metrics for Dashboard
  const totalValue = mappedRows.reduce((sum, row) => sum + row.docTotal, 0);
  const criticalCount = mappedRows.flatMap(r => r.errors).filter(e => e.severity === 'error').length;
  const warningCount = mappedRows.flatMap(r => r.errors).filter(e => e.severity === 'warning').length;
  const uniquePartners = new Set(mappedRows.map(r => r.cardCode).filter(Boolean)).size;

  return (
    <div id="app-root-container" className="min-h-screen bg-[#F5F5F0] text-[#141414] font-sans pb-16 antialiased selection:bg-[#141414] selection:text-[#F5F5F0]">
      {/* Editorial Header */}
      <header id="app-main-header" className="bg-[#F5F5F0] border-b-2 border-[#141414] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 bg-[#141414] text-[#F5F5F0] flex items-center justify-center font-serif text-xl font-bold border border-[#141414]">
              SAP
            </div>
            <div>
              <h1 className="text-lg font-serif font-bold tracking-tight text-[#141414] flex items-center gap-2">
                Conversor de Saldos SAP B1
                <span className="font-sans font-normal text-xs uppercase tracking-widest px-2 py-0.5 bg-[#141414] text-[#F5F5F0] ml-2">DTW</span>
              </h1>
              <p className="text-[10px] text-[#141414]/70 font-mono tracking-wider">
                LAYOUT GENERATOR • ACCOUNTS PAYABLE & RECEIVABLE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-[10px] border border-[#141414] text-[#141414] font-mono uppercase px-2 py-1 bg-white/50">
              v1.2.0 • Editorial Edition
            </span>
            {fileName && (
              <button
                id="btn-reset-workspace"
                onClick={handleReset}
                className="text-xs bg-transparent border border-[#141414] hover:bg-[#141414] hover:text-[#F5F5F0] text-[#141414] px-4 py-2 transition-all cursor-pointer font-mono uppercase tracking-wider flex items-center gap-2"
              >
                <RefreshCw size={12} /> Limpar Espaço
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Editorial Intro Banner */}
        <div id="intro-banner-card" className="bg-white border-2 border-[#141414] text-[#141414] p-8 shadow-[6px_6px_0px_#141414] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#141414]/5 rounded-bl-full pointer-events-none" />
          
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase font-mono tracking-widest bg-[#141414] text-[#F5F5F0] px-2 py-0.5">
                  Regras Fiscais SAP
                </span>
                <span className="text-xs text-[#141414]/40">•</span>
                <span className="text-xs text-[#141414] font-mono uppercase tracking-wider">DTW Import Utility</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-[#141414] leading-tight">
                Preparação de Saldos Iniciais <span className="font-serif italic font-normal">Contas a Pagar & Receber</span>
              </h2>
              <p className="text-xs sm:text-sm text-[#141414]/80 leading-relaxed font-serif">
                Carregue suas listas de títulos vencidos ou em aberto. O assistente formata datas como <code className="font-mono bg-[#141414]/10 px-1 py-0.5 rounded text-[#141414] text-xs">YYYYMMDD</code>, ajusta números decimais de padrão brasileiro e cria a estrutura exata do DTW com as cabeçalhas técnicas.
              </p>
            </div>

            <div className="bg-[#F5F5F0] border border-[#141414] p-4 w-full md:w-auto shrink-0 space-y-2.5 shadow-[2px_2px_0px_#141414]">
              <p className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">Layouts Suportados:</p>
              <ul className="text-xs text-[#141414]/90 space-y-1 font-mono">
                <li className="flex items-center gap-2">
                  <span className="text-xs font-bold">✓</span> Contas a Pagar (Layout OPCH/PCH6)
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-xs font-bold">✓</span> Contas a Receber (Layout OINV/INV6)
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Business Partner Cross-Referencing Database */}
        <PartnersDatabasePanel
          partnersCount={partners.length}
          currentSource={partnerFileName}
          onPartnersLoaded={(newPartners, sourceName) => {
            setPartners(newPartners);
            setPartnerFileName(sourceName);
          }}
          onRestoreDefault={() => {
            setPartners(parseBusinessPartnersCSV(PRELOADED_PARTNERS_CSV));
            setPartnerFileName('Base Padrão SAP B1 (Pré-carregada)');
          }}
        />

        {/* Column Grid for Step 1 (Left) and Step 3 Override Settings (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <FileUploader
              onDataLoaded={handleDataLoaded}
              type={type}
              setType={setType}
              currentFileName={fileName}
              rowCount={rows.length}
            />
          </div>
          <div>
            <DefaultSettingsForm
              settings={settings}
              onSettingsChange={handleSettingChange}
              type={type}
            />
          </div>
        </div>

        {/* Dashboard and Data View Panel if Data Loaded */}
        {rows.length > 0 ? (
          <div className="space-y-8">
            {/* Live Metrics Grid */}
            <div id="metrics-dashboard-grid" className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-white p-5 border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F5F0] border border-[#141414] text-[#141414] flex items-center justify-center font-serif font-bold italic text-lg">
                  #
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#141414]/50 uppercase tracking-widest block">Registros</span>
                  <span className="text-xl font-mono font-bold text-[#141414]">{mappedRows.length}</span>
                </div>
              </div>

              <div className="bg-white p-5 border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F5F0] border border-[#141414] text-[#141414] flex items-center justify-center font-serif font-bold italic text-lg">
                  $
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#141414]/50 uppercase tracking-widest block">Soma de Carga</span>
                  <span className="text-lg font-mono font-bold text-[#141414]">
                    R$ {totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F5F0] border border-[#141414] text-[#141414] flex items-center justify-center font-serif font-bold italic text-lg">
                  PN
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#141414]/50 uppercase tracking-widest block">PAs Únicos</span>
                  <span className="text-xl font-mono font-bold text-[#141414]">{uniquePartners}</span>
                </div>
              </div>

              <div className="bg-white p-5 border-2 border-[#141414] shadow-[4px_4px_0px_#141414] flex items-center gap-4">
                <div className="w-10 h-10 bg-[#F5F5F0] border border-[#141414] text-[#141414] flex items-center justify-center font-serif font-bold italic text-lg">
                  !
                </div>
                <div>
                  <span className="text-[9px] font-mono font-bold text-[#141414]/50 uppercase tracking-widest block">Inconsistências</span>
                  <span className={`text-lg font-mono font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-[#141414]'}`}>
                    {criticalCount} <span className="text-[11px] text-[#141414]/60 font-normal">({warningCount} w)</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Step 2 Column Mapping Panel */}
            <MappingPanel
              headers={headers}
              mapping={mapping}
              onMappingChange={handleMappingChange}
              type={type}
            />

            {/* Validation & Consistency Summary */}
            <ValidationSummary
              errors={mappedRows.flatMap(r => r.errors)}
              totalRows={mappedRows.length}
              onSelectRow={(rowNum) => {
                // Focus row in the preview grid
                setSelectedRowId(rowNum);
                const elem = document.getElementById(`preview-row-${rowNum}`);
                if (elem) {
                  elem.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
              }}
            />

            {/* Interactive Preview & Download Grid */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-[#141414] p-6 text-[#F5F5F0] border-2 border-[#141414] shadow-[4px_4px_0px_rgba(20,20,20,0.15)]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#F5F5F0] text-[#141414] font-serif italic text-xl font-bold flex items-center justify-center border border-[#141414]">
                    S
                  </div>
                  <div>
                    <h3 className="text-sm font-serif font-bold text-[#F5F5F0] uppercase tracking-wider">Pronto para gerar a carga?</h3>
                    <p className="text-xs text-[#F5F5F0]/70 font-serif italic">Baixe o arquivo estruturado conforme os padrões técnicos do Data Transfer Workbench (DTW).</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                  <button
                    id="btn-download-sap-csv"
                    onClick={handleDownload}
                    disabled={mappedRows.length === 0}
                    className="bg-[#333333] hover:bg-[#444444] disabled:bg-slate-700 text-[#F5F5F0] font-mono uppercase tracking-widest text-[11px] font-bold py-3.5 px-6 border border-[#444444] transition-all cursor-pointer"
                  >
                    Baixar CSV
                  </button>
                  <button
                    id="btn-download-sap-xlsx"
                    onClick={handleDownloadExcel}
                    disabled={mappedRows.length === 0}
                    className="bg-[#F5F5F0] hover:bg-white disabled:bg-slate-700 text-[#141414] font-mono uppercase tracking-widest text-[11px] font-bold py-3.5 px-6 border border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_rgba(255,255,255,0.2)] hover:translate-y-[-1px]"
                  >
                    Baixar Excel (XLSX)
                  </button>
                </div>
              </div>

              <PreviewTable
                rows={mappedRows}
                type={type}
                selectedRowId={selectedRowId}
                onSelectRow={setSelectedRowId}
              />
            </div>
          </div>
        ) : (
          /* Empty State - Please load spreadsheet */
          <div id="empty-workspace-state" className="bg-white border-2 border-[#141414] p-16 text-center flex flex-col items-center justify-center max-w-lg mx-auto shadow-[6px_6px_0px_#141414]">
            <div className="w-16 h-16 bg-[#F5F5F0] border border-[#141414] text-[#141414] flex items-center justify-center mb-6 font-serif italic text-2xl font-bold">
              0
            </div>
            <h3 className="text-lg font-serif font-bold text-[#141414]">Espaço de Trabalho Aguardando</h3>
            <p className="text-xs text-[#141414]/60 mt-2 leading-relaxed font-serif">
              Por favor, faça o upload de sua planilha Excel do Contas a Pagar ou Contas a Receber acima, ou use a opção de exemplo para explorar os recursos da aplicação.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
