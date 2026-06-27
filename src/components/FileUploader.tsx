import React, { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, FileDown, CheckCircle, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RawRow, TransactionType } from '../types';
import { getSampleData } from '../utils/converter';

interface FileUploaderProps {
  onDataLoaded: (fileName: string, headers: string[], rows: RawRow[]) => void;
  type: TransactionType;
  setType: (type: TransactionType) => void;
  currentFileName: string | null;
  rowCount: number;
}

export default function FileUploader({
  onDataLoaded,
  type,
  setType,
  currentFileName,
  rowCount
}: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const isCsv = file.name.toLowerCase().endsWith('.csv');
        const workbook = XLSX.read(data, { 
          type: 'array', 
          cellDates: true,
          ...(isCsv ? { raw: true } : {})
        });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        
        // Parse options: defval keeps empty cells as empty string instead of omitting them
        const jsonData = XLSX.utils.sheet_to_json<RawRow>(worksheet, { defval: '' });
        
        if (jsonData.length === 0) {
          alert('A planilha está vazia.');
          return;
        }

        // Extract headers from keys of the first row or collect all unique keys from all rows
        const headersSet = new Set<string>();
        jsonData.forEach(row => {
          Object.keys(row).forEach(key => headersSet.add(key));
        });
        const headers = Array.from(headersSet);

        onDataLoaded(file.name, headers, jsonData);
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Erro ao processar o arquivo. Certifique-se de que é uma planilha Excel (.xlsx, .xls) ou CSV válida.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const loadSample = () => {
    const sample = getSampleData(type);
    const headers = Object.keys(sample[0]);
    onDataLoaded(`exemplo_contas_a_${type.toLowerCase()}.xlsx`, headers, sample);
  };

  return (
    <div id="file-uploader-section" className="bg-white p-8 border-2 border-[#141414] shadow-[4px_4px_0px_#141414] transition-all">
      <h2 className="text-xl font-serif font-bold text-[#141414] mb-6 flex items-center gap-3">
        <span className="font-serif italic text-2xl pr-3 border-r-2 border-[#141414] text-[#141414]">01</span>
        Passo 1: Selecione o Fluxo e Envie o Arquivo
      </h2>

      {/* Type Selector */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          id="btn-select-pagar"
          onClick={() => {
            setType('PAGAR');
          }}
          className={`flex-1 py-3 px-4 font-mono uppercase tracking-wider text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
            type === 'PAGAR'
              ? 'bg-[#141414] border-[#141414] text-[#F5F5F0] shadow-[2px_2px_0px_rgba(20,20,20,0.15)]'
              : 'bg-white border-[#141414] text-[#141414] hover:bg-[#141414]/5'
          }`}
        >
          <FileDown size={14} />
          Contas a Pagar (AP)
        </button>
        <button
          id="btn-select-receber"
          onClick={() => {
            setType('RECEBER');
          }}
          className={`flex-1 py-3 px-4 font-mono uppercase tracking-wider text-xs font-bold transition-all flex items-center justify-center gap-2 border-2 cursor-pointer ${
            type === 'RECEBER'
              ? 'bg-[#141414] border-[#141414] text-[#F5F5F0] shadow-[2px_2px_0px_rgba(20,20,20,0.15)]'
              : 'bg-white border-[#141414] text-[#141414] hover:bg-[#141414]/5'
          }`}
        >
          <Upload size={14} />
          Contas a Receber (AR)
        </button>
      </div>

      {/* Upload Zone */}
      <div
        id="drag-drop-zone"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-[#141414] bg-[#F5F5F0] scale-[0.99]'
            : currentFileName
            ? 'border-emerald-600 bg-emerald-50/20'
            : 'border-[#141414]/30 hover:border-[#141414] hover:bg-[#F5F5F0]/30'
        }`}
      >
        <input
          id="file-input-hidden"
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".xlsx,.xls,.csv"
          className="hidden"
        />
        
        {currentFileName ? (
          <div className="flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-800 border border-emerald-600 flex items-center justify-center mb-3">
              <CheckCircle size={20} />
            </div>
            <p className="font-serif font-bold text-[#141414] text-sm break-all max-w-md">
              {currentFileName}
            </p>
            <p className="text-xs text-emerald-700 font-mono mt-1">
              {rowCount} registros lidos com sucesso
            </p>
            <span className="mt-4 text-xs text-[#141414]/60 font-mono flex items-center gap-1.5 hover:underline">
              <RefreshCw size={11} /> Substituir arquivo
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4">
            <div className="w-12 h-12 bg-[#F5F5F0] border border-[#141414]/30 text-[#141414] flex items-center justify-center mb-4">
              <FileSpreadsheet size={20} />
            </div>
            <p className="font-serif font-bold text-[#141414] text-sm">
              Arraste seu arquivo Excel (.xlsx, .xls) ou CSV aqui
            </p>
            <p className="text-xs text-[#141414]/50 mt-1 font-serif italic">
              Ou clique para navegar pelo seu dispositivo
            </p>
          </div>
        )}
      </div>

      {/* Load Sample Data Quick Option */}
      <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t border-[#141414]/10 pt-4 gap-2">
        <span className="text-xs text-[#141414]/60 font-serif">
          Não possui arquivos de teste para validar?
        </span>
        <button
          id="btn-load-sample"
          onClick={loadSample}
          className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414] hover:bg-[#141414] hover:text-[#F5F5F0] px-3 py-1.5 border border-[#141414] transition-all cursor-pointer"
        >
          Carregar Exemplo ({type === 'PAGAR' ? 'A Pagar' : 'A Receber'})
        </button>
      </div>
    </div>
  );
}
