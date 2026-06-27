import { AlertCircle, AlertTriangle, CheckCircle2, ChevronRight, Ban } from 'lucide-react';
import { ValidationError } from '../types';

interface ValidationSummaryProps {
  errors: ValidationError[];
  totalRows: number;
  onSelectRow?: (rowNum: number) => void;
}

export default function ValidationSummary({
  errors,
  totalRows,
  onSelectRow
}: ValidationSummaryProps) {
  const criticalErrors = errors.filter((e) => e.severity === 'error');
  const warnings = errors.filter((e) => e.severity === 'warning');

  const hasIssues = errors.length > 0;
  const isReady = criticalErrors.length === 0;

  return (
    <div id="validation-summary-section" className="bg-white p-8 border-2 border-[#141414] shadow-[4px_4px_0px_#141414]">
      <h2 className="text-xl font-serif font-bold text-[#141414] mb-6 flex items-center gap-3">
        <span className="font-serif italic text-2xl pr-3 border-r-2 border-[#141414] text-[#141414]">04</span>
        Passo 4: Validação Integrada de Regras SAP
      </h2>

      {/* Overview Indicator Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div id="valid-card-status" className={`p-5 border-2 border-[#141414] flex items-start gap-4 shadow-[2px_2px_0px_#141414] ${
          criticalErrors.length > 0
            ? 'bg-red-50 text-red-900'
            : warnings.length > 0
            ? 'bg-amber-50 text-amber-950'
            : 'bg-emerald-50 text-emerald-950'
        }`}>
          <div className="mt-0.5 shrink-0">
            {criticalErrors.length > 0 ? (
              <Ban className="text-red-700" size={20} />
            ) : warnings.length > 0 ? (
              <AlertTriangle className="text-amber-700" size={20} />
            ) : (
              <CheckCircle2 className="text-emerald-700" size={20} />
            )}
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">
              Status Geral do Lote
            </span>
            <p className="text-sm font-serif font-bold uppercase tracking-tight">
              {criticalErrors.length > 0
                ? 'Lote Bloqueado'
                : warnings.length > 0
                ? 'Lote Liberado (Com Alertas)'
                : 'Lote 100% Válido'}
            </p>
            <p className="text-xs mt-2 leading-relaxed font-serif italic">
              {criticalErrors.length > 0
                ? `Existem ${criticalErrors.length} erros críticos que causarão rejeição no SAP B1.`
                : warnings.length > 0
                ? `Disponível para exportação, porém revise as ${warnings.length} advertências mapeadas.`
                : 'Nenhuma inconformidade técnica detectada. Pronto para carga.'}
            </p>
          </div>
        </div>

        {/* Critical Errors Counter */}
        <div id="valid-card-errors" className="p-5 border border-[#141414] bg-[#F5F5F0]/20 flex items-start gap-4">
          <div className="w-8 h-8 bg-red-100 text-red-800 border border-red-600 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">
              Erros Impeditivos
            </span>
            <p className="text-3xl font-mono font-bold text-[#141414]">
              {criticalErrors.length}
            </p>
            <p className="text-[10px] text-[#141414]/60 mt-1 font-serif italic leading-normal">
              Campos obrigatórios em branco ou formatos de data inválidos
            </p>
          </div>
        </div>

        {/* Warnings Counter */}
        <div id="valid-card-warnings" className="p-5 border border-[#141414] bg-[#F5F5F0]/20 flex items-start gap-4">
          <div className="w-8 h-8 bg-amber-100 text-amber-800 border border-amber-600 flex items-center justify-center shrink-0">
            <AlertTriangle size={16} />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">
              Avisos Preventivos
            </span>
            <p className="text-3xl font-mono font-bold text-[#141414]">
              {warnings.length}
            </p>
            <p className="text-[10px] text-[#141414]/60 mt-1 font-serif italic leading-normal">
              CardCodes fora do padrão ou observações ausentes autocompletadas
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Alerts List */}
      {hasIssues ? (
        <div className="border border-[#141414] overflow-hidden max-h-[300px] overflow-y-auto">
          <div className="bg-[#F5F5F0] px-4 py-3 border-b border-[#141414] flex items-center justify-between">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
              Log de Auditoria Técnica
            </span>
            <span className="text-[10px] font-serif italic text-[#141414]/70">
              Clique em uma ocorrência para inspecionar
            </span>
          </div>
          <div className="divide-y divide-[#141414]/10">
            {errors.map((err, index) => (
              <div
                id={`validation-item-${index}`}
                key={index}
                onClick={() => onSelectRow && onSelectRow(err.row)}
                className={`p-4 text-xs flex items-start justify-between hover:bg-[#F5F5F0]/30 cursor-pointer transition-colors ${
                  err.severity === 'error' ? 'bg-red-50/10' : 'bg-amber-50/10'
                }`}
              >
                <div className="flex items-start gap-3 max-w-[90%]">
                  <div className="mt-0.5 shrink-0">
                    {err.severity === 'error' ? (
                      <AlertCircle className="text-red-600" size={14} />
                    ) : (
                      <AlertTriangle className="text-amber-600" size={14} />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-[#141414]">
                        Linha {err.row}
                      </span>
                      <span className="text-[10px] text-[#141414]/60 font-mono">
                        • Campo: <code className="font-mono bg-[#141414]/10 px-1 py-0.5 rounded-none text-[#141414]">{err.field}</code>
                      </span>
                    </div>
                    <p className="text-[#141414]/80 mt-1 font-serif">
                      {err.message}
                    </p>
                    {err.value !== undefined && err.value !== '' && (
                      <p className="text-[10px] text-[#141414]/50 mt-1 font-mono italic">
                        Leitura original: "{String(err.value)}"
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center text-[#141414]/40 mt-1">
                  <ChevronRight size={14} />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border-2 border-dashed border-[#141414]/30 bg-[#F5F5F0]/10">
          <p className="text-sm font-serif font-bold text-[#141414]">
            Estrutura perfeitamente em conformidade!
          </p>
          <p className="text-xs text-[#141414]/60 mt-2 font-serif italic leading-relaxed">
            As colunas de sua planilha estão perfeitamente alinhadas com as diretrizes do manual de importação do SAP B1.
          </p>
        </div>
      )}
    </div>
  );
}
