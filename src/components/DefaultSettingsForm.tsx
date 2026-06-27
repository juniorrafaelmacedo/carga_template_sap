import { Sliders, Settings } from 'lucide-react';
import { DefaultSettings, TransactionType } from '../types';

interface DefaultSettingsFormProps {
  settings: DefaultSettings;
  onSettingsChange: (field: keyof DefaultSettings, val: any) => void;
  type: TransactionType;
}

export default function DefaultSettingsForm({
  settings,
  onSettingsChange,
  type
}: DefaultSettingsFormProps) {
  return (
    <div id="default-settings-section" className="bg-white p-8 border-2 border-[#141414] shadow-[4px_4px_0px_#141414]">
      <h2 className="text-xl font-serif font-bold text-[#141414] mb-4 flex items-center gap-3">
        <span className="font-serif italic text-2xl pr-3 border-r-2 border-[#141414] text-[#141414]">03</span>
        Passo 3: Valores Técnicos Padrão do SAP B1
      </h2>
      
      <p className="text-xs text-[#141414]/70 mb-6 leading-relaxed font-serif">
        Estes valores serão inseridos no arquivo gerado caso a coluna correspondente não seja mapeada na planilha ou se encontre em branco para determinado registro.
      </p>

      <div className="grid grid-cols-1 gap-4">
        {/* DocType */}
        <div id="setting-doctype-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Tipo do Documento (DocType)
          </label>
          <input
            id="input-setting-doctype"
            type="text"
            value={settings.docType}
            onChange={(e) => onSettingsChange('docType', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="dDocument_Service"
          />
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">dDocument_Service é o padrão para saldos</span>
        </div>

        {/* Series */}
        <div id="setting-series-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Série do Documento (Series)
          </label>
          <input
            id="input-setting-series"
            type="text"
            value={settings.series}
            onChange={(e) => onSettingsChange('series', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="4"
          />
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">Código numérico da série de saldo inicial</span>
        </div>

        {/* SequenceCode */}
        <div id="setting-seqcode-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            SequenceCode / SeqCode
          </label>
          <input
            id="input-setting-seqcode"
            type="text"
            value={settings.sequenceCode}
            onChange={(e) => onSettingsChange('sequenceCode', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="-1"
          />
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">Código de sequenciamento (-1 = manual)</span>
        </div>

        {/* Filial Padrão */}
        <div id="setting-bplid-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Filial Padrão (BPLId)
          </label>
          <input
            id="input-setting-bplid"
            type="text"
            value={settings.bplId}
            onChange={(e) => onSettingsChange('bplId', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="1"
          />
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">ID numérico da filial no SAP</span>
        </div>

        {/* HandWritten */}
        <div id="setting-handwritten-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Escrito à Mão (HandWritten)
          </label>
          <select
            id="select-setting-handwritten"
            value={settings.handWritten}
            onChange={(e) => onSettingsChange('handWritten', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-white text-[#141414]"
          >
            <option value="Y">Y - Sim (Recomendado para saldo)</option>
            <option value="N">N - Não</option>
          </select>
        </div>

        {/* Printed */}
        <div id="setting-printed-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Impresso (Printed)
          </label>
          <select
            id="select-setting-printed"
            value={settings.printed}
            onChange={(e) => onSettingsChange('printed', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-white text-[#141414]"
          >
            <option value="Y">Y - Sim (Padrão SAP)</option>
            <option value="N">N - Não</option>
          </select>
        </div>

        {/* Payment Terms Code */}
        <div id="setting-groupnum-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Cond. Pagamento Padrão
          </label>
          <input
            id="input-setting-groupnum"
            type="text"
            value={settings.paymentGroupCode}
            onChange={(e) => onSettingsChange('paymentGroupCode', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="-1"
          />
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">Código do SAP (-1 = Do PN cadastrado)</span>
        </div>

        {/* Vendedor / Comprador */}
        <div id="setting-slpcode-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            {type === 'RECEBER' ? 'Cód. Vendedor Padrão' : 'Cód. Comprador Padrão'}
          </label>
          <input
            id="input-setting-slpcode"
            type="text"
            value={settings.salesPersonCode}
            onChange={(e) => onSettingsChange('salesPersonCode', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
            placeholder="Ex: -1"
          />
        </div>

        {/* Observações padrão */}
        <div id="setting-comments-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Observação (Comments)
          </label>
          <input
            id="input-setting-comments"
            type="text"
            value={settings.comments}
            onChange={(e) => onSettingsChange('comments', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414]"
            placeholder={type === 'RECEBER' ? 'SALDO INICIAL CR' : 'SALDO INICIAL CP'}
          />
        </div>

        {/* Formato de Data (Modelo Americano vs Outros) */}
        <div id="setting-dateformat-container">
          <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
            Formato de Data de Saída (SAP DTW)
          </label>
          <select
            id="select-setting-dateformat"
            value={settings.dateFormat || 'YYYY-MM-DD'}
            onChange={(e) => onSettingsChange('dateFormat', e.target.value)}
            className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-white text-[#141414] font-mono"
          >
            <option value="YYYY-MM-DD">YYYY-MM-DD (Americano c/ traços)</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY (Americano c/ barras)</option>
            <option value="YYYYMMDD">YYYYMMDD (Universal SAP sem barras)</option>
          </select>
          <span className="text-[10px] text-[#141414]/60 font-serif italic mt-1 block">
            Datas brasileiras (DD/MM/AAAA) serão convertidas automaticamente para o formato selecionado.
          </span>
        </div>

        {/* Contrato Bancário Padrão (RECEBER Apenas) */}
        {type === 'RECEBER' && (
          <div id="setting-contractbank-container">
            <label className="block text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/80 mb-1">
              Contrato Bancário (*ContractBank)
            </label>
            <input
              id="input-setting-contractbank"
              type="text"
              value={settings.contractBank}
              onChange={(e) => onSettingsChange('contractBank', e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[#141414] rounded-none focus:outline-hidden focus:ring-0 bg-[#F5F5F0]/20 text-[#141414] font-mono"
              placeholder="Ex: 1"
            />
          </div>
        )}
      </div>
    </div>
  );
}
