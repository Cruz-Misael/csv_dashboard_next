'use client';
import { useEffect, useState, useMemo, useCallback } from 'react';
import Papa from 'papaparse';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
  LabelList
} from 'recharts';
import Image from 'next/image';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';


const CurrencyDollarIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CubeIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const TagIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const ArrowUpIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

const ArrowDownIcon = (props: any) => (
  <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const MetricCard = ({ 
  title, 
  value, 
  icon, 
  trend, 
  percentage 
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down';
  percentage?: string;
}) => (
  <div className="bg-white p-5 rounded-xl shadow-lg border border-gray-100">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-[#3c3c50] mt-1">{value}</p>
      </div>
      <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
    </div>
    
    {trend && percentage && (
      <div className={`mt-3 flex items-center text-sm ${
        trend === 'up' ? 'text-green-600' : 'text-red-600'
      }`}>
        {trend === 'up' ? (
          <ArrowUpIcon className="h-4 w-4 mr-1" />
        ) : (
          <ArrowDownIcon className="h-4 w-4 mr-1" />
        )}
        <span>{percentage} em relação ao mês anterior</span>
      </div>
    )}
  </div>
);


export default function DashboardPage() {
  const [csvData, setCsvData] = useState<any[]>([]);
  const [selectedColumn, setSelectedColumn] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [modalImage, setModalImage] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.data.length === 0) {
          alert('CSV vazio ou inválido');
          return;
        }
        setCsvData(results.data);
        const numericCols = Object.keys(results.data[0] || {}).filter((key) =>
          results.data.every((row: any) => !isNaN(parseFloat(row[key])) && row[key] !== '')
        );
        setSelectedColumn(numericCols[0] || '');
      },
    });
  };

  const [estoqueFiltro, setEstoqueFiltro] = useState('');

  const csvColumns = useMemo(() => {
    if (csvData.length === 0) return { categorical: [], numeric: [], image: '', variante: '', estoque: '' };
    const keys = Object.keys(csvData[0]);
    const categorical = keys.filter((key) =>
      csvData.some((row: any) => isNaN(parseFloat(row[key])) || row[key] === '')
    );
    const numeric = keys.filter((key) =>
      csvData.every((row: any) => !isNaN(parseFloat(row[key])) && row[key] !== '')
    );
    const image = keys.find((key) =>
      csvData.some((row: any) => typeof row[key] === 'string' && row[key].match(/\.(jpg|jpeg|png|gif)$/i))
    ) || '';
    const variante = keys.find((key) => key.toLowerCase().includes('variante')) || categorical[0] || '';
    const estoque = keys.find((key) => key.toLowerCase().includes('estoque') || key.toLowerCase().includes('stock')) || numeric[0] || '';
    return { categorical, numeric, image, variante, estoque };
  }, [csvData]);

  const chartData = useMemo(() => {
    if (!selectedColumn || csvData.length === 0) return [];
    return csvData.map((row) => ({
      label: row[csvColumns.variante] || 'Sem Variante',
      value: parseFloat(row[selectedColumn]) || 0,
    }));
  }, [csvData, selectedColumn, csvColumns]);

  const total = useMemo(() => chartData.reduce((sum, item) => sum + item.value, 0), [chartData]);
  const media = useMemo(() => chartData.length ? total / chartData.length : 0, [total, chartData]);
  const financial = useMemo(() => {
    if (!csvData.length) return 0;
  
    return csvData.reduce((sum, row) => {
      // Encontra a coluna "Valor Total" (case insensitive)
      const valorTotalKey = Object.keys(row).find(
        key => key.toLowerCase().includes("valor total")
      );
  
      // Se não encontrar a coluna, retorna 0
      if (!valorTotalKey) return sum;
  
      // Extrai o valor numérico (remove "R$", pontos e substitui vírgula por ponto)
      const valorTotalStr = row[valorTotalKey] || "0";
      const valorNumerico = parseFloat(
        valorTotalStr
          .replace(/[^\d,-]/g, "")  // Remove tudo exceto números, vírgula e hífen
          .replace(/\./g, "")       // Remove separadores de milhar (pontos)
          .replace(",", ".")        // Converte vírgula decimal em ponto
      ) || 0;
  
      return sum + valorNumerico;
    }, 0);
  }, [csvData]);  const totalProdutos = chartData.length;

  const filteredData = useMemo(() => {
    let data = csvData;
  
    // Filtro por busca (searchTerm)
    if (searchTerm) {
      const searchColumn = csvColumns.categorical[0] || Object.keys(csvData[0])[0];
      data = data.filter((row) =>
        String(row[searchColumn]).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
  
    // Filtro por estoque
    if (estoqueFiltro && csvColumns.estoque) {
      const trimmedInput = estoqueFiltro.trim();
      // Extrai o operador (>=, <=, >, <, =) e o valor
      const operatorMatch = trimmedInput.match(/^(>=|<=|>|<|=)/);
      const operator = operatorMatch ? operatorMatch[0] : '';
      const value = parseFloat(trimmedInput.replace(/^(>=|<=|>|<|=)/, '').trim());
  
      if (!isNaN(value)) {
        data = data.filter((row) => {
          const rowValue = parseFloat(row[csvColumns.estoque]) || 0;
          switch (operator) {
            case '>':  return rowValue > value;
            case '<':  return rowValue < value;
            case '>=': return rowValue >= value;
            case '<=': return rowValue <= value;
            case '=':  return rowValue === value;
            default:   return true; // Se não houver operador válido, ignora o filtro
          }
        });
      }
    }
  
    return data;
  }, [csvData, searchTerm, estoqueFiltro, csvColumns]);

  const toggleModal = useCallback((imageUrl: string | null) => setModalImage(imageUrl), []);

  const alturaPorItem = 60; // cada barra com ~50px

  const chartHeight = chartData.length * alturaPorItem;

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(filteredData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "DadosXLSXS");
  
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
    saveAs(data, 'dados.xlsx');
  }; 

  const [chartWidth, setChartWidth] = useState(500); 

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setChartWidth(window.innerWidth - 750);
    }
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-200">
      <aside className="fixed top-0 left-0 h-screen w-64 bg-[#3c3c50] text-white p-6 flex flex-col overflow-y-auto scroll-smooth">
        <div className="mb-8">
          <Image
            src="/assets/logo.png"
            alt="logo"
            width={320}
            height={128}
            className="mx-auto h-28 w-64 object-cover object-center rounded-lg"
          />
        </div>

        <nav className="space-y-2">
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-orange-300 transition-all duration-200 group"
          >
            <span className="w-2 h-2 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span>Estoque</span>
          </a>
          
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-orange-300 transition-all duration-200 group"
          >
            <span className="w-2 h-2 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span>Valores</span>
          </a>
          
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-white hover:bg-white/10 hover:text-orange-300 transition-all duration-200 group"
          >
            <span className="w-2 h-2 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span>Integrações</span>
          </a>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/20 space-y-1">
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-orange-300 transition-all duration-200 group"
          >
            <span className="w-1.5 h-1.5 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span>Configurações</span>
          </a>
          
          <a 
            href="#" 
            className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/80 hover:bg-white/5 hover:text-orange-300 transition-all duration-200 group"
            >
            <span className="w-1.5 h-1.5 bg-orange-300 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></span>
            <span>Diretório</span>
          </a>
        </div>
      </aside>

      {/*Header e Conteúdo Principal*/}
      <div className="flex-1 p-2 space-y-2 ml-64 bg-gray-100">
        <div className="flex justify-between items-center bg-white p-2 rounded-[8px] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#3c3c50]/10 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-800">Controle Estoque</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative group">
              <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" id="csv-upload" />
              <label 
                htmlFor="csv-upload" 
                className="flex items-center gap-2 cursor-pointer text-sm px-4 py-2 bg-[#3c3c50] text-white rounded-lg transition-all duration-150 hover:bg-[#57576d] active:scale-95"
                >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload CSV
              </label>
            </div>

            <div className="relative">
              <input 
                type="text" 
                placeholder="Buscar..." 
                className="pl-10 pr-4 py-2 w-160 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#3c3c50]/50 focus:border-[#3c3c50] transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <div className="relative group">
              <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                <div className="h-8 w-8 rounded-full bg-[#3c3c50] flex items-center justify-center text-white font-medium">SM</div>
                <span>SM Semijoias</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Meu Perfil</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Configurações</a>
                <a href="#" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Sair</a>
              </div>
            </div>
          </div>
        </div>

        {/* Graphic Section */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2">
          <div className="lg:col-span-3 bg-white p-3 rounded-[8px] shadow-lg border border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[#3c3c50]">Análise de Estoque</h3>
                <p className="text-sm text-gray-500">Distribuição por produto</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-blue-50 px-3 py-1 rounded-full">
                  <p className="text-sm text-blue-600 font-medium">
                    <span className="font-bold">{media.toFixed(0)}</span> unidades (média)
                  </p>
                </div>
                <select 
                  className="text-sm border border-gray-200 rounded-lg px-3 py-1 focus:ring-2 focus:ring-[#3c3c50]/50"
                  onChange={(e) => setSelectedColumn(e.target.value)}
                  value={selectedColumn}
                >
                  {csvColumns.numeric.map((column) => (
                    <option key={column} value={column}>{column}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="h-[500px] overflow-y-auto scroll-smooth">
              <BarChart
                width={chartWidth}
                height={chartHeight}
                data={chartData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  type="number" 
                  tick={{ fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <YAxis 
                  dataKey="label" 
                  type="category" 
                  width={150}
                  tick={{ fill: '#3c3c50', fontSize: 12 }}
                  axisLine={{ stroke: '#e5e7eb' }}
                />
                <Tooltip 
                  contentStyle={{
                    background: '#ffffff',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar 
                  dataKey="value" 
                  fill="#2563eb"
                  radius={5}
                  animationDuration={1500}
                  barSize={40}
                >
                  <LabelList dataKey={"value"}
                    position="right"
                    fill='#3c3c50'
                    fontSize={12}
                    formatter={(value: number) => `${value.toFixed(0)} unidades`}
                    style={{ fontWeight: 'bold' }}
                  />
                </Bar>
              </BarChart>
            </div>
          </div>

          {/* Financial Card */}
          <div className="grid grid-cols-1 md:grid-cols-1 gap-1 ">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-5 rounded-[8px] border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">Financeiro</span>
                  </div>
                  <h3 className="text-sm font-medium text-blue-800">Valor Total</h3>
                  <p className="text-2xl font-bold text-blue-900 mt-1"> {financial.toLocaleString("pt-BR", {style: "currency", currency: "BRL",})}</p>
                </div>
                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                  +5.2%
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-blue-200/50">
                <p className="text-xs text-blue-600">Em relação ao mês anterior</p>
              </div>
            </div>

            {/* Inventory Card */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-5 rounded-[8px] border border-green-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"></path>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">Estoque</span>
                  </div>
                  <h3 className="text-sm font-medium text-green-800">Total Estoque</h3>
                  <p className="text-2xl font-bold text-green-900 mt-1">{total.toFixed(0)} Itens</p>
                </div>
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                  </svg>
                  Estável
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-green-200/50">
                <p className="text-xs text-green-600">Capacidade máxima: 15.000 itens</p>
              </div>
            </div>

            {/* Products Card */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-5 rounded-[8px] border border-purple-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                      </svg>
                    </div>
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">Produtos</span>
                  </div>
                  <h3 className="text-sm font-medium text-purple-800">Total Produtos</h3>
                  <p className="text-2xl font-bold text-purple-900 mt-1">{totalProdutos} Itens</p>
                </div>
                <span className="text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded-full flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                  2.1%
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-purple-200/50">
                <p className="text-xs text-purple-600">{Math.floor((totalProdutos / 500) * 100)}% da meta mensal</p>
              </div>
            </div>
          </div>
        </div>

        {/* CSV Data Table */}
        {csvData.length > 0 && (
          <div className="bg-white rounded-[8px] shadow-lg border border-gray-100 overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="font-semibold text-[#3c3c50]">Dados do CSV</h3>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Estoque:</label>
                <input 
                  type="text" 
                  value={estoqueFiltro}
                  onChange={(e) => setEstoqueFiltro(e.target.value)}
                  placeholder="> 10"
                  className="border border-gray-200 rounded px-2 py-1 text-sm w-24"
                />
              </div>
              <button 
                onClick={exportToExcel}
                className="flex items-center gap-2 cursor-pointer text-sm px-4 py-2 bg-green-500 text-white rounded-lg transition-all duration-150 hover:bg-green-600 active:scale-95"
                >
                Exportar Excel
              </button>
              <span className="text-sm text-gray-500">{filteredData.length} itens</span>
            </div>
            
            <div className="overflow-y-auto max-h-[600px]">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 sticky top-0 z-10 bg-white shadow-sm">
                  <TableRow>
                    {Object.keys(csvData[0]).map((header, index) => (
                      <TableHead key={index} className="text-gray-600 font-medium">
                        {header}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.map((row, rowIndex) => (
                    <TableRow key={rowIndex} className="hover:bg-gray-50 transition-colors">
                      {Object.entries(row).map(([key, value], colIndex) => (
                        <TableCell key={colIndex} className="py-3">
                          {key === csvColumns.image ? (
                            <img 
                              src={String(value)} 
                              alt="Produto" 
                              className="w-12 h-12 object-cover rounded-md cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setModalImage(String(value))}
                            />
                          ) : (
                            <span className="text-gray-700">{String(value)}</span>
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {modalImage && (
          <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setModalImage(null)}>
            <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
              <img 
                src={modalImage} 
                alt="Visualização" 
                className="w-full h-auto object-contain"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
