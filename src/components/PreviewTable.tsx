import { useState } from 'react';
import { Table, Search, AlertCircle, AlertTriangle, Eye, EyeOff, Info, Check, Filter } from 'lucide-react';
import { MappedRow, TransactionType } from '../types';

interface PreviewTableProps {
  rows: MappedRow[];
  type: TransactionType;
  selectedRowId: number | null;
  onSelectRow: (id: number | null) => void;
}

type FilterStatus = 'ALL' | 'ERROR' | 'WARNING' | 'VALID';

function displayDate(dateStr: string): string {
  if (!dateStr) return '-';
  
  // If YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  }
  
  // If MM/DD/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) {
    const [m, d, y] = dateStr.split('/');
    return `${d}/${m}/${y}`;
  }
  
  // If YYYYMMDD
  if (/^\d{8}$/.test(dateStr)) {
    return `${dateStr.substring(6,8)}/${dateStr.substring(4,6)}/${dateStr.substring(0,4)}`;
  }
  
  return dateStr;
}

export default function PreviewTable({
  rows,
  type,
  selectedRowId,
  onSelectRow
}: PreviewTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('ALL');

  // Filter rows based on search and status tabs
  const filteredRows = rows.filter((row) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchSearch =
      row.cardCode.toLowerCase().includes(searchLower) ||
      row.sequenceSerial.toLowerCase().includes(searchLower) ||
      row.numAtCard.toLowerCase().includes(searchLower);

    if (!matchSearch) return false;

    // Status filter
    const hasError = row.errors.some((e) => e.severity === 'error');
    const hasWarning = row.errors.some((e) => e.severity === 'warning');

    if (filterStatus === 'ERROR') return hasError;
    if (filterStatus === 'WARNING') return hasWarning && !hasError;
    if (filterStatus === 'VALID') return !hasError && !hasWarning;

    return true;
  });

  const getRowStatusClass = (row: MappedRow) => {
    const hasError = row.errors.some((e) => e.severity === 'error');
    const hasWarning = row.errors.some((e) => e.severity === 'warning');
    
    if (selectedRowId === row.id) {
      return 'bg-indigo-50 border-l-4 border-indigo-600';
    }
    if (hasError) {
      return 'bg-rose-50/20 hover:bg-rose-50/30 border-l-4 border-rose-500';
    }
    if (hasWarning) {
      return 'bg-amber-50/20 hover:bg-amber-50/30 border-l-4 border-amber-500';
    }
    return 'hover:bg-slate-50/50';
  };

  const selectedRow = rows.find((r) => r.id === selectedRowId);

  return (
    <div id="preview-table-section" className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_#141414] overflow-hidden">
      <div className="p-8 border-b-2 border-[#141414]">
        <h2 className="text-xl font-serif font-bold text-[#141414] mb-2 flex items-center gap-3">
          <Table size={18} className="text-[#141414]" />
          Visualização dos Dados de Carga (SAP B1 Layout)
        </h2>
        <p className="text-xs text-[#141414]/70 font-serif italic">
          Inspecione os dados prontos para exportação. Clique em qualquer linha para auditar os mapeamentos e visualizar a comparação detalhada.
        </p>
      </div>

      {/* Control Bar (Search + Tabs) */}
      <div className="p-4 bg-[#F5F5F0] border-b border-[#141414] flex flex-col md:flex-row gap-4 justify-between items-center">
        {/* Filter Tabs */}
        <div className="flex bg-white border border-[#141414] p-1 w-full md:w-auto">
          <button
            id="tab-filter-all"
            onClick={() => setFilterStatus('ALL')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              filterStatus === 'ALL'
                ? 'bg-[#141414] text-[#F5F5F0]'
                : 'text-[#141414] hover:bg-[#141414]/5'
            }`}
          >
            Todos ({rows.length})
          </button>
          <button
            id="tab-filter-error"
            onClick={() => setFilterStatus('ERROR')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'ERROR'
                ? 'bg-red-600 text-white'
                : 'text-red-700 hover:bg-red-50'
            }`}
          >
            Com Erro ({rows.filter(r => r.errors.some(e => e.severity === 'error')).length})
          </button>
          <button
            id="tab-filter-warning"
            onClick={() => setFilterStatus('WARNING')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'WARNING'
                ? 'bg-amber-600 text-white'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            Avisos ({rows.filter(r => r.errors.some(e => e.severity === 'warning') && !r.errors.some(e => e.severity === 'error')).length})
          </button>
          <button
            id="tab-filter-valid"
            onClick={() => setFilterStatus('VALID')}
            className={`flex-1 md:flex-none px-4 py-2 text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              filterStatus === 'VALID'
                ? 'bg-emerald-700 text-white'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Válidos ({rows.filter(r => !r.errors.length).length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <input
            id="input-preview-search"
            type="text"
            placeholder="Buscar por CardCode ou NF..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-[#141414] focus:outline-hidden font-mono text-[#141414]"
          />
          <Search size={14} className="absolute left-3 top-3 text-[#141414]/50" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-[#141414] min-h-[400px]">
        {/* Left/Middle: Scrollable Grid */}
        <div className="lg:col-span-2 overflow-x-auto overflow-y-auto max-h-[500px]">
          {filteredRows.length > 0 ? (
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F5F5F0] text-[#141414] sticky top-0 font-mono border-b border-[#141414] z-10">
                <tr>
                  <th className="py-3 px-4 w-12 text-center border-r border-[#141414]/10 font-bold">Seq</th>
                  <th className="py-3 px-3 font-bold">CardCode</th>
                  <th className="py-3 px-3 font-bold">NF Serial</th>
                  <th className="py-3 px-3 font-bold text-center">Parcela</th>
                  <th className="py-3 px-3 font-bold">Vencimento</th>
                  <th className="py-3 px-3 text-right font-bold">Valor</th>
                  <th className="py-3 px-3 font-bold">Ref (NumAtCard)</th>
                  <th className="py-3 px-4 w-16 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10">
                {filteredRows.map((row) => {
                  const hasError = row.errors.some((e) => e.severity === 'error');
                  const hasWarning = row.errors.some((e) => e.severity === 'warning');

                  const getRowClass = () => {
                    if (selectedRowId === row.id) return 'bg-[#F5F5F0] border-l-4 border-[#141414] font-semibold';
                    if (hasError) return 'bg-red-50/40 hover:bg-red-50/60 border-l-4 border-red-500';
                    if (hasWarning) return 'bg-amber-50/40 hover:bg-amber-50/60 border-l-4 border-amber-500';
                    return 'hover:bg-[#F5F5F0]/20';
                  };

                  return (
                    <tr
                      id={`preview-row-${row.id}`}
                      key={row.id}
                      onClick={() => onSelectRow(row.id === selectedRowId ? null : row.id)}
                      className={`cursor-pointer transition-colors ${getRowClass()}`}
                    >
                      <td className="py-3 px-4 font-mono text-[#141414]/50 text-center border-r border-[#141414]/10">
                        {row.docNum}
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-[#141414]">
                        {row.cardCode || <span className="text-red-500 italic font-serif">Ausente</span>}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#141414]">
                        {row.sequenceSerial || <span className="text-red-500 italic font-serif">Ausente</span>}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-[#141414] text-[#F5F5F0] font-mono font-bold px-1.5 py-0.5">
                          {row.seriesString}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#141414]/80">
                        {row.docDueDate ? (
                          displayDate(row.docDueDate)
                        ) : (
                          <span className="text-red-500 italic font-serif">Ausente</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#141414] font-mono">
                        {row.docTotal > 0 ? (
                          `R$ ${row.docTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                        ) : (
                          <span className="text-red-600 italic font-serif">Inválido</span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-[#141414]/60">
                        {row.numAtCard}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {hasError ? (
                            <span className="w-5 h-5 bg-red-100 text-red-800 border border-red-600 flex items-center justify-center" title="Possui erros de validação">
                              !
                            </span>
                          ) : hasWarning ? (
                            <span className="w-5 h-5 bg-amber-100 text-amber-800 border border-amber-600 flex items-center justify-center" title="Possui advertências">
                              w
                            </span>
                          ) : (
                            <span className="w-5 h-5 bg-emerald-100 text-emerald-800 border border-emerald-600 flex items-center justify-center" title="Válido para SAP">
                              ✓
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="p-12 text-center text-[#141414]/40 font-serif italic">
              Nenhum registro correspondente ao filtro aplicado.
            </div>
          )}
        </div>

        {/* Right Pane: Selected Record Details & Comparison */}
        <div id="preview-detail-pane" className="bg-[#F5F5F0]/30 p-6 overflow-y-auto max-h-[500px]">
          {selectedRow ? (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-[#141414]/10 pb-4">
                <h3 className="text-sm font-serif font-bold text-[#141414] uppercase tracking-wider">
                  Dossiê do Registro #{selectedRow.docNum}
                </h3>
                <button
                  id="btn-close-details"
                  onClick={() => onSelectRow(null)}
                  className="text-[10px] font-mono uppercase tracking-wider border border-[#141414] bg-white text-[#141414] px-2.5 py-1 hover:bg-[#141414] hover:text-[#F5F5F0] transition-colors cursor-pointer"
                >
                  Fechar [X]
                </button>
              </div>

              {/* Status Section */}
              {selectedRow.errors.length > 0 && (
                <div className="bg-white p-4 border border-[#141414] space-y-2">
                  <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-red-600">
                    Irregularidades Encontradas
                  </h4>
                  <div className="space-y-2">
                    {selectedRow.errors.map((err, i) => (
                      <div key={i} className="flex gap-2 text-xs leading-relaxed font-serif">
                        <span className="text-red-600 font-bold shrink-0">•</span>
                        <span className="text-[#141414]">
                          <strong className="font-mono text-[11px] font-bold text-[#141414] bg-[#F5F5F0] px-1">{err.field}:</strong> {err.message}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SAP DTW Generation Structure */}
              <div className="bg-white p-5 border border-[#141414] space-y-4">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#141414]">
                  Campos Estruturados (Layout DTW SAP)
                </h4>
                <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">DocNum</span>
                    <span className="font-bold text-[#141414]">{selectedRow.docNum}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">CardCode</span>
                    <span className="font-bold text-[#141414]">{selectedRow.cardCode || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">SequenceSerial</span>
                    <span className="font-bold text-[#141414]">{selectedRow.sequenceSerial || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">SeriesString</span>
                    <span className="font-bold text-[#141414]">{selectedRow.seriesString || '-'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">TaxDate</span>
                    <span className="font-bold text-[#141414]">
                      {selectedRow.taxDate ? displayDate(selectedRow.taxDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">DocDueDate</span>
                    <span className="font-bold text-[#141414]">
                      {selectedRow.docDueDate ? displayDate(selectedRow.docDueDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">DocDate</span>
                    <span className="font-bold text-[#141414]">
                      {selectedRow.docDate ? displayDate(selectedRow.docDate) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">DocTotal</span>
                    <span className="font-bold text-[#141414]">
                      R$ {selectedRow.docTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">NumAtCard (NF Referência)</span>
                    <span className="font-bold text-[#141414]">{selectedRow.numAtCard || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">Comments</span>
                    <span className="font-serif font-bold text-[#141414]">{selectedRow.comments || '-'}</span>
                  </div>
                  
                  {type === 'RECEBER' ? (
                    <>
                      <div>
                        <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">*OurNumber</span>
                        <span className="font-bold text-[#141414]">{selectedRow.ourNumber || <em className="text-[#141414]/40 font-serif font-normal">Vazio</em>}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">*ContractBank</span>
                        <span className="font-bold text-[#141414]">{selectedRow.contractBank || <em className="text-[#141414]/40 font-serif font-normal">Vazio</em>}</span>
                      </div>
                    </>
                  ) : (
                    <div className="col-span-2">
                      <span className="text-[9px] text-[#141414]/50 block uppercase tracking-wider">PCH6.U_LinhaDigitavel</span>
                      <span className="font-bold text-[#141414] truncate block" title={selectedRow.linhaDigitavel}>
                        {selectedRow.linhaDigitavel || <em className="text-[#141414]/40 font-serif font-normal">Vazio</em>}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Original Spreadsheet Source Values */}
              <div className="bg-white p-5 border border-[#141414] space-y-2">
                <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#141414]/60">
                  Colunas Originais da Planilha Importada
                </h4>
                <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                  {Object.entries(selectedRow.originalRow).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center text-xs py-1 border-b border-[#141414]/10 last:border-0 font-mono">
                      <span className="text-[#141414]/60 truncate max-w-[130px]" title={key}>{key}</span>
                      <span className="text-[#141414] text-right truncate max-w-[150px] font-bold" title={String(val)}>
                        {val === '' ? <em className="text-[#141414]/30 font-serif font-normal">Vazio</em> : String(val)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 text-[#141414]/40 space-y-4 font-serif">
              <div className="w-12 h-12 bg-white border border-[#141414] text-[#141414] flex items-center justify-center">
                ?
              </div>
              <div>
                <p className="text-sm font-bold text-[#141414]">Inspecionar Detalhes</p>
                <p className="text-xs text-[#141414]/60 mt-1 max-w-[200px] leading-relaxed italic">
                  Selecione uma linha da tabela de carga para conferir sua auditoria fiscal e valores correspondentes.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
