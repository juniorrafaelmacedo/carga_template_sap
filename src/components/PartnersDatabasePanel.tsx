import React, { useState, useRef } from 'react';
import { Database, UploadCloud, RotateCcw, Check, AlertCircle, Info } from 'lucide-react';
import { BusinessPartner } from '../types';
import { parseBusinessPartnersCSV } from '../utils/converter';
import * as XLSX from 'xlsx';

interface PartnersDatabasePanelProps {
  partnersCount: number;
  currentSource: string;
  onPartnersLoaded: (partners: BusinessPartner[], sourceName: string) => void;
  onRestoreDefault: () => void;
}

export default function PartnersDatabasePanel({
  partnersCount,
  currentSource,
  onPartnersLoaded,
  onRestoreDefault
}: PartnersDatabasePanelProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const processFile = (file: File) => {
    setErrorMessage(null);
    const fileName = file.name;
    const extension = fileName.split('.').pop()?.toLowerCase();

    if (extension === 'csv' || extension === 'txt') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Split first line to analyze delimiter
          const lines = text.split('\n');
          if (lines.length === 0) {
            throw new Error('Arquivo de parceiros vazio.');
          }
          
          const parsed = parseBusinessPartnersCSV(text);
          if (parsed.length === 0) {
            throw new Error('Não foi possível extrair nenhum parceiro válido. Verifique se o arquivo segue o formato: "Código do PN;Nome do PN;CNPJ/CPF".');
          }
          onPartnersLoaded(parsed, fileName);
        } catch (err: any) {
          setErrorMessage(err.message || 'Erro ao processar arquivo CSV.');
        }
      };
      reader.readAsText(file, 'UTF-8');
    } else if (extension === 'xlsx' || extension === 'xls') {
      // Support uploading Excel sheet of partners as well
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const jsonData = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

          if (jsonData.length <= 1) {
            throw new Error('Planilha de parceiros vazia ou sem cabeçalhos.');
          }

          // Guess column indices based on header values
          const headers = jsonData[0].map((h: any) => String(h).toLowerCase().trim());
          let codeIdx = headers.findIndex((h: string) => h.includes('codigo') || h.includes('cardcode') || h.includes('código') || h.includes('pn'));
          let nameIdx = headers.findIndex((h: string) => h.includes('nome') || h.includes('cardname') || h.includes('razao') || h.includes('razão'));
          let cnpjIdx = headers.findIndex((h: string) => h.includes('cnpj') || h.includes('cpf') || h.includes('documento') || h.includes('cadastro'));

          // Fallbacks if mapping couldn't be auto guessed
          if (codeIdx === -1) codeIdx = 0;
          if (nameIdx === -1) nameIdx = 1;
          if (cnpjIdx === -1) cnpjIdx = 2;

          const parsed: BusinessPartner[] = [];
          for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (!row || row.length === 0) continue;

            const code = String(row[codeIdx] || '').trim();
            const name = String(row[nameIdx] || '').trim();
            const cnpjVal = String(row[cnpjIdx] || '').trim();

            if (code && cnpjVal) {
              parsed.push({
                cardCode: code,
                cardName: name || 'Parceiro sem Nome',
                cnpjCpf: cnpjVal,
                normalizedCnpjCpf: cnpjVal.replace(/\D/g, '')
              });
            }
          }

          if (parsed.length === 0) {
            throw new Error('Nenhum parceiro válido com CNPJ e Código cadastrados foi encontrado.');
          }

          onPartnersLoaded(parsed, fileName);
        } catch (err: any) {
          setErrorMessage(err.message || 'Erro ao ler arquivo Excel de parceiros.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setErrorMessage('Formato de arquivo não suportado. Utilize .csv, .txt, .xlsx ou .xls.');
    }
  };

  const triggerSelectFile = () => {
    fileInputRef.current?.click();
  };

  return (
    <div id="partners-db-panel" className="bg-white border-2 border-[#141414] p-6 shadow-[4px_4px_0px_#141414]">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b-2 border-[#141414] pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#141414] text-[#F5F5F0] flex items-center justify-center border border-[#141414]">
            <Database size={16} />
          </div>
          <div>
            <h3 className="text-xs font-mono font-bold uppercase text-[#141414] tracking-wider">
              Banco de Parceiros de Negócios (CNPJ/CPF)
            </h3>
            <p className="text-[11px] text-[#141414]/70 font-serif italic">
              Cruzamento automático de CNPJ para localizar Códigos de PN no SAP
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          {currentSource !== 'Base Padrão SAP B1 (Pré-carregada)' && (
            <button
              id="btn-restore-default-partners"
              onClick={onRestoreDefault}
              className="text-[10px] font-mono uppercase bg-[#F5F5F0] hover:bg-[#141414] hover:text-[#F5F5F0] text-[#141414] border border-[#141414] px-2.5 py-1.5 transition-all flex items-center gap-1.5 cursor-pointer w-full sm:w-auto justify-center"
              title="Restaurar base pré-carregada padrão de 2.000+ registros"
            >
              <RotateCcw size={12} />
              <span>Restaurar Base Padrão</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        {/* Statistics & Status Section */}
        <div className="md:col-span-1 bg-[#F5F5F0]/50 p-4 border border-[#141414] h-full flex flex-col justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">Status da Base</span>
            <div className="flex items-center gap-1.5 text-emerald-800 font-mono text-xs font-bold uppercase mb-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
              Ativa e Sincronizada
            </div>
          </div>
          <div className="mt-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">Registros Ativos</span>
            <span className="text-2xl font-mono font-bold text-[#141414] tracking-tight">
              {partnersCount.toLocaleString()} <span className="text-xs font-serif font-normal text-[#141414]/70">Parceiros</span>
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#141414]/20">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#141414]/60 block mb-1">Fonte Atual</span>
            <span className="text-[10px] font-mono font-bold text-[#141414]/90 block truncate" title={currentSource}>
              {currentSource}
            </span>
          </div>
        </div>

        {/* Upload Zone */}
        <div className="md:col-span-2 h-full">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".csv,.txt,.xlsx,.xls"
            className="hidden"
          />
          <div
            id="partners-drop-zone"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={triggerSelectFile}
            className={`border-2 border-dashed h-full min-h-[140px] flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-[#141414] bg-[#F5F5F0]/60'
                : 'border-[#141414]/30 hover:border-[#141414] hover:bg-[#F5F5F0]/20'
            }`}
          >
            <UploadCloud size={24} className="text-[#141414]/70 mb-2" />
            <p className="text-xs font-mono font-bold text-[#141414] uppercase tracking-wider">
              Atualizar Base de Parceiros
            </p>
            <p className="text-[11px] text-[#141414]/60 font-serif italic mt-1">
              Arraste ou clique para enviar novo CSV (Código;Nome;CNPJ) ou planilha Excel
            </p>
            <p className="text-[9px] text-[#141414]/40 font-mono uppercase mt-2">
              Formatos aceitos: CSV, TXT, XLSX
            </p>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-mono flex items-start gap-2.5">
          <AlertCircle size={14} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Erro de Importação:</span> {errorMessage}
          </div>
        </div>
      )}
    </div>
  );
}
