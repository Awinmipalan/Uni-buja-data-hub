import { useState, useEffect, useRef } from 'react';
import { Download, Mail, UploadCloud, FileText, Database, LayoutDashboard, Briefcase, AlertTriangle, FileSpreadsheet, ArrowUpDown, ArrowDown, ArrowUp, GraduationCap, TrendingUp, Wallet, CreditCard, ClipboardList, X, Plus } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Papa from 'papaparse';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const COLORS = ['#1A3A5C', '#F0C060', '#10B981', '#E67E22', '#C0392B', '#94A3B8'];
const FINANCE_COLORS = ['#10B981', '#F59E0B', '#EF4444'];

// Minimal mock data and state for the Analytics Hub.
export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [time, setTime] = useState(new Date().toLocaleTimeString());
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { count: number, name: string }>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);
  const [cgpaFilter, setCgpaFilter] = useState('all');
  const [passRateFilter, setPassRateFilter] = useState('all');
  
  const [pendingCgpaFilter, setPendingCgpaFilter] = useState('all');
  const [pendingPassRateFilter, setPendingPassRateFilter] = useState('all');
  const [showFilterConfirm, setShowFilterConfirm] = useState(false);
  
  const [taskModalFaculty, setTaskModalFaculty] = useState<any>(null);
  const [assignedTasks, setAssignedTasks] = useState<Record<string, string[]>>({});
  const [customTaskInput, setCustomTaskInput] = useState('');

  // API Data States
  const [facultyData, setFacultyData] = useState<any[]>([]);
  const [admissionRatesData, setAdmissionRatesData] = useState<any[]>([]);
  const [jambScoresData, setJambScoresData] = useState<any[]>([]);
  const [stateOfOriginData, setStateOfOriginData] = useState<any[]>([]);
  const [revenueByFacultyData, setRevenueByFacultyData] = useState<any[]>([]);
  const [paymentStatusData, setPaymentStatusData] = useState<any[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [revenueTrend, setRevenueTrend] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          facultyRes,
          admissionRes,
          jambRes,
          stateRes,
          revenueFacultyRes,
          paymentRes,
          transactionsRes,
          revenueTrendRes
        ] = await Promise.all([
          fetch('/api/dashboard/faculty-insights'),
          fetch('/api/dashboard/admission-rates'),
          fetch('/api/dashboard/jamb-scores'),
          fetch('/api/dashboard/state-origin'),
          fetch('/api/dashboard/finance/revenue-by-faculty'),
          fetch('/api/dashboard/finance/payment-status'),
          fetch('/api/dashboard/finance/recent-transactions'),
          fetch('/api/dashboard/finance/revenue-trend')
        ]);

        setFacultyData(await facultyRes.json());
        setAdmissionRatesData(await admissionRes.json());
        setJambScoresData(await jambRes.json());
        setStateOfOriginData(await stateRes.json());
        setRevenueByFacultyData(await revenueFacultyRes.json());
        setPaymentStatusData(await paymentRes.json());
        setRecentTransactions(await transactionsRes.json());
        setRevenueTrend(await revenueTrendRes.json());
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignTask = (faculty: any) => {
    setTaskModalFaculty(faculty);
    setCustomTaskInput('');
  };

  const submitTask = async (task: string) => {
    if (!task) return;
    
    try {
      await fetch(`/api/dashboard/faculty/${taskModalFaculty.id}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ task }),
      });
      
      setAssignedTasks(prev => ({
        ...prev,
        [taskModalFaculty.id]: [...(prev[taskModalFaculty.id] || []), task]
      }));
      setCustomTaskInput('');
    } catch (err) {
      console.error('Failed to assign task', err);
    }
  };

  const closeTaskModal = () => {
    setTaskModalFaculty(null);
    setCustomTaskInput('');
  };

  const handleFilterChange = (type: 'cgpa' | 'passRate', value: string) => {
    if (type === 'cgpa' && value === cgpaFilter) return;
    if (type === 'passRate' && value === passRateFilter) return;
    
    if (type === 'cgpa') {
      setPendingCgpaFilter(value);
      setPendingPassRateFilter(passRateFilter);
    } else {
      setPendingCgpaFilter(cgpaFilter);
      setPendingPassRateFilter(value);
    }
    setShowFilterConfirm(true);
  };

  const confirmFilters = () => {
    setCgpaFilter(pendingCgpaFilter);
    setPassRateFilter(pendingPassRateFilter);
    setShowFilterConfirm(false);
  };

  const cancelFilters = () => {
    setPendingCgpaFilter(cgpaFilter);
    setPendingPassRateFilter(passRateFilter);
    setShowFilterConfirm(false);
  };

  const sortedFacultyData = [...facultyData]
    .filter((faculty) => {
      if (cgpaFilter === 'high' && faculty.avgCgpa < 3.0) return false;
      if (cgpaFilter === 'medium' && (faculty.avgCgpa < 2.5 || faculty.avgCgpa >= 3.0)) return false;
      if (cgpaFilter === 'low' && faculty.avgCgpa >= 2.5) return false;
      
      if (passRateFilter === 'high' && faculty.passRate < 80) return false;
      if (passRateFilter === 'medium' && (faculty.passRate < 60 || faculty.passRate >= 80)) return false;
      if (passRateFilter === 'low' && faculty.passRate >= 60) return false;

      return true;
    })
    .sort((a: any, b: any) => {
    if (!sortConfig) return 0;
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const exportToCsv = (filename: string, rows: any[]) => {
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportAdmissions = () => exportToCsv('Admissions_Report.csv', admissionRatesData);
  const handleExportFaculty = () => exportToCsv('Faculty_Insights.csv', sortedFacultyData);
  const handleExportFinance = () => exportToCsv('Financial_Report.csv', revenueByFacultyData);

  const downloadReport = () => {
    // Generate a temporary print view or just instruct user
    alert("Automation Success: Document prepared. Please proceed to save as PDF in the print dialog.");
    window.print();
  };

  const handleEmailDeans = async () => {
    try {
      const res = await fetch('/api/dashboard/communication/email-deans', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert("Failed to email deans.");
    }
  };

  const handleSendReminders = async () => {
    try {
      const res = await fetch('/api/dashboard/finance/send-reminders', { method: 'POST' });
      const data = await res.json();
      alert(data.message);
    } catch (e) {
      alert("Failed to send reminders.");
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          // Identify file type based on name or headers (simplified by name here)
          let fileType = 'Unknown Data';
          if (file.name.toLowerCase().includes('student')) fileType = 'Students Record';
          else if (file.name.toLowerCase().includes('performance') || file.name.toLowerCase().includes('academic')) fileType = 'Academic Performance';
          else if (file.name.toLowerCase().includes('fee') || file.name.toLowerCase().includes('payment')) fileType = 'Fee Payments';
          else if (file.name.toLowerCase().includes('staff')) fileType = 'Academic Staff';
          else if (file.name.toLowerCase().includes('admission')) fileType = 'Admissions';

          setUploadedFiles(prev => ({
            ...prev,
            [fileType]: { count: results.data.length, name: file.name }
          }));
        }
      });
    });
  };

  const NavItem = ({ id, label, icon: Icon }: { id: string; label: string; icon: any }) => (
    <div 
      onClick={() => setActiveTab(id)} 
      className={cn(
        "px-4 py-3 mb-0 md:mb-2 rounded-xl cursor-pointer transition-all duration-300 text-sm font-medium flex items-center gap-3 whitespace-nowrap shrink-0",
        activeTab === id 
          ? "bg-[#F0C060] text-[#1A3A5C] font-bold opacity-100" 
          : "text-white opacity-70 hover:bg-white/10 hover:opacity-100"
      )}
    >
      <Icon size={18} />
      {label}
    </div>
  );

  if (isLoading) {
    return (
      <div className="bg-[#f0f2f5] min-h-screen flex flex-col items-center justify-center font-sans">
        <div className="w-12 h-12 border-4 border-[#1A3A5C]/20 border-t-[#1A3A5C] rounded-full animate-spin mb-4"></div>
        <div className="text-[#1A3A5C] font-semibold">Loading UniAbuja Analytics Hub...</div>
      </div>
    );
  }

  return (
    <div className="bg-[#f0f2f5] p-2 sm:p-5 font-sans min-h-screen flex items-center justify-center">
      {/* FILTER CONFIRMATION MODAL */}
      {showFilterConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center animate-[fadeIn_0.2s]">
          <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-sm w-full mx-4 animate-[cardIn_0.3s_ease-out]">
            <div className="flex items-center gap-3 mb-4 text-[#1A3A5C]">
              <AlertTriangle size={24} className="text-[#F0C060]" />
              <h3 className="font-bold text-lg m-0">Apply Filters?</h3>
            </div>
            <p className="text-slate-600 text-sm mb-6">
              Are you sure you want to apply these filters to the Faculty Insights data?
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={cancelFilters}
                className="px-4 py-2 text-slate-500 hover:bg-slate-100 rounded-lg text-sm font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={confirmFilters}
                className="px-4 py-2 bg-[#1A3A5C] text-white rounded-lg text-sm font-semibold hover:bg-[#1A3A5C]/90 transition-colors cursor-pointer"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TASK ASSIGNMENT MODAL */}
      {taskModalFaculty && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center animate-[fadeIn_0.2s] p-4">
          <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full animate-[cardIn_0.3s_ease-out] flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 text-[#1A3A5C]">
                <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-lg m-0 leading-tight">Assign Task</h3>
                  <p className="text-xs text-slate-500 font-medium m-0">{taskModalFaculty.name}</p>
                </div>
              </div>
              <button onClick={closeTaskModal} className="text-slate-400 hover:text-slate-600 cursor-pointer bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 mb-4">
              <div className="mb-5">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Suggested based on metric</div>
                <div className="flex flex-col gap-2">
                  {taskModalFaculty.avgCgpa < 2.5 || taskModalFaculty.passRate < 60 ? (
                    <>
                      <button onClick={() => submitTask('Schedule Immediate Academic Review')} className="w-full text-left px-4 py-3 rounded-xl border border-red-100 bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-between group">
                        Schedule Immediate Academic Review
                        <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <button onClick={() => submitTask('Issue Query to HOD')} className="w-full text-left px-4 py-3 rounded-xl border border-orange-100 bg-orange-50 hover:bg-orange-100 text-orange-700 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-between group">
                        Issue Query to HOD
                        <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </>
                  ) : taskModalFaculty.compliance === 'Optimal' ? (
                     <>
                      <button onClick={() => submitTask('Send Commendation Letter')} className="w-full text-left px-4 py-3 rounded-xl border border-emerald-100 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-between group">
                        Send Commendation Letter
                        <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => submitTask('Request Curriculum Update Plan')} className="w-full text-left px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-between group">
                        Request Curriculum Update Plan
                        <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                      <button onClick={() => submitTask('Schedule Staffing Review')} className="w-full text-left px-4 py-3 rounded-xl border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-sm transition-colors cursor-pointer flex items-center justify-between group">
                        Schedule Staffing Review
                        <Plus size={16} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="mb-2">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Custom Task</div>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={customTaskInput}
                    onChange={(e) => setCustomTaskInput(e.target.value)}
                    placeholder="E.g. Follow up on equipment..."
                    className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm outline-none focus:border-[#1A3A5C] focus:ring-1 focus:ring-[#1A3A5C] transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitTask(customTaskInput);
                    }}
                  />
                  <button 
                    onClick={() => submitTask(customTaskInput)}
                    disabled={!customTaskInput.trim()}
                    className="bg-[#1A3A5C] text-white px-4 py-2 rounded-xl font-semibold cursor-pointer hover:bg-[#1A3A5C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Add
                  </button>
                </div>
              </div>
              
              {assignedTasks[taskModalFaculty.id]?.length > 0 && (
                <div className="mt-5 pt-5 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">Assigned Tasks ({assignedTasks[taskModalFaculty.id].length})</div>
                  <ul className="m-0 p-0 list-none flex flex-col gap-2">
                    {assignedTasks[taskModalFaculty.id].map((task, idx) => (
                      <li key={idx} className="bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-sm text-slate-700 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#1A3A5C] mt-2 shrink-0" />
                        <span className="leading-snug">{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 mt-auto hidden sm:block">
              <button 
                onClick={closeTaskModal}
                className="w-full py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}


      <div className="w-full max-w-7xl bg-white/90 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden border border-white/30 flex flex-col md:flex-row min-h-[85vh] animate-[slideUp_0.8s_ease-out]">
        
        {/* SIDEBAR */}
        <div className="w-full md:w-72 bg-[#1A3A5C] p-4 md:p-8 flex flex-col text-white shrink-0">
          <div className="flex items-center mb-4 md:mb-10 px-2">
            <div className="w-10 h-10 bg-[#F0C060] rounded-xl mr-3 flex items-center justify-center font-black text-[#1A3A5C] tracking-tighter text-lg shrink-0">UA</div>
            <div className="flex flex-col">
              <span className="font-extrabold text-base tracking-tight leading-tight">Analytics Hub</span>
              <span className="text-[10px] text-[#F0C060] font-semibold tracking-wider">DATA ENGINE v2.0</span>
            </div>
          </div>
          
          <nav className="flex flex-row md:flex-col overflow-x-auto md:overflow-visible gap-2 md:gap-0 pb-2 md:pb-0 scrollbar-hide md:flex-1">
            <NavItem id="ingestion" label="Data Ingestion" icon={Database} />
            <div className="hidden md:block my-4 border-t border-white/10"></div>
            <NavItem id="overview" label="Executive Dashboard" icon={LayoutDashboard} />
            <NavItem id="admissions" label="Admission Analytics" icon={GraduationCap} />
            <NavItem id="faculty" label="Faculty Insights" icon={Briefcase} />
            <NavItem id="risk" label="Risk Monitor" icon={AlertTriangle} />
            <NavItem id="finance" label="Bursary & IGR" icon={FileSpreadsheet} />
          </nav>

          <div className="hidden md:block bg-white/5 p-4 rounded-2xl text-xs mt-auto">
            <div className="flex items-center mb-1">
              <div className="w-2 h-2 bg-[#10B981] rounded-full mr-2 animate-[pulse-ring_2s_infinite]"></div>
              <span className="opacity-80">Automation Active</span>
            </div>
            <div className="opacity-50 mt-1">System ready for import</div>
          </div>
        </div>

        {/* MAIN CONTENT AREA */}
        <div className="flex-1 flex flex-col bg-white min-w-0">
          
          {/* HEADER */}
          <div className="px-5 md:px-10 py-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
            <h2 className="m-0 text-xl md:text-2xl text-slate-800 font-bold flex flex-wrap items-center gap-3">
              {activeTab === 'ingestion' && 'Data Ingestion & Cleaning Engine'}
              {activeTab === 'overview' && 'Executive Dashboard'}
              {activeTab === 'admissions' && 'Admission Analytics'}
              {activeTab === 'faculty' && 'Faculty Performance Audit'}
              {activeTab === 'risk' && 'At-Risk Intervention Register'}
              {activeTab === 'finance' && 'Financial IGR Analytics'}
              {activeTab === 'ingestion' && (
                <span className="bg-slate-100 text-slate-500 text-xs px-2 py-1 rounded-md font-semibold border border-slate-200">AWAITING CSVs</span>
              )}
            </h2>
            <div className="flex items-center gap-3 md:gap-5 self-end sm:self-auto">
              <div className="text-right">
                <div className="text-sm font-semibold text-slate-500">{time}</div>
                <div className="text-xs text-slate-400 font-medium">2024/2025 Session</div>
              </div>
              <div className="w-10 h-10 bg-slate-100 rounded-full flex shrink-0 items-center justify-center text-lg border border-slate-200 shadow-sm">
                👤
              </div>
            </div>
          </div>

          {/* SCROLLABLE CONTENT */}
          <div className="p-5 md:p-10 overflow-y-auto flex-1 bg-slate-50/50">
            
            {/* DATA INGESTION SECTION */}
            {activeTab === 'ingestion' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out] max-w-4xl mx-auto">
                <div className="text-center mb-10">
                  <h3 className="text-2xl font-extrabold text-[#1A3A5C] mb-3">Welcome to UniAbuja Analytics Hub 🎓</h3>
                  <p className="text-slate-500 max-w-2xl mx-auto">
                    To get started, please upload or paste your university data. The automation engine will automatically clean the data, remove duplicates, standardize names, and flag anomalies before rendering the live dashboard.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#1A3A5C]/20 rounded-3xl p-10 flex flex-col items-center justify-center bg-white cursor-pointer hover:border-[#1A3A5C]/50 hover:bg-slate-50 transition-all group"
                  >
                    <div className="w-16 h-16 bg-[#EBF2FA] rounded-2xl flex items-center justify-center text-[#1A3A5C] mb-4 group-hover:scale-110 transition-transform">
                      <UploadCloud size={32} />
                    </div>
                    <h4 className="text-slate-800 font-bold text-lg mb-2">Upload CSV Files</h4>
                    <p className="text-slate-500 text-center text-sm mb-4">Drag and drop your files here, or click to browse.</p>
                    <input 
                      type="file" 
                      multiple 
                      accept=".csv" 
                      className="hidden" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                    />
                    <button className="bg-[#1A3A5C] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#1A3A5C]/90 shadow-md">
                      Browse Files
                    </button>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                    <h4 className="text-slate-800 font-bold flex items-center gap-2 mb-4">
                      <FileText size={18} className="text-[#1A3A5C]" /> 
                      Supported Datasets
                    </h4>
                    <ul className="space-y-3 text-sm text-slate-600">
                      <li className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${uploadedFiles['Students Record'] ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">uniabuja_students.csv</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${uploadedFiles['Academic Performance'] ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">uniabuja_academic_performance.csv</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${uploadedFiles['Fee Payments'] ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">uniabuja_fee_payments.csv</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${uploadedFiles['Academic Staff'] ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">uniabuja_staff.csv</span>
                      </li>
                      <li className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${uploadedFiles['Admissions'] ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs text-slate-500">uniabuja_admissions.csv (optional)</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Upload Status */}
                {Object.keys(uploadedFiles).length > 0 && (
                  <div className="bg-white border border-emerald-200 rounded-2xl p-6 shadow-sm animate-[slideUp_0.4s_ease-out]">
                    <h4 className="text-emerald-800 font-bold mb-4 flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                      Data Ingestion Summary
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {Object.entries(uploadedFiles).map(([type, data]) => (
                        <div key={type} className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                          <div className="text-xs text-emerald-600 font-bold uppercase tracking-wider mb-1">{type}</div>
                          <div className="text-2xl font-extrabold text-[#1A3A5C]">{data.count.toLocaleString()} <span className="text-sm font-medium text-slate-500">rows auto-cleaned</span></div>
                          <div className="text-xs text-slate-400 mt-2 truncate" title={data.name}>{data.name}</div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <button 
                        onClick={() => setActiveTab('overview')} 
                        className="bg-[#1A3A5C] text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-[#1A3A5C]/90 shadow-lg"
                      >
                        Run Analytics Engine & Render Dashboard <LayoutDashboard size={18} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* OVERVIEW SECTION */}
            {activeTab === 'overview' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out]">
                {/* 1. TOP KPIs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
                  {/* Admissions KPI */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-[#1A3A5C]/30 animate-[cardIn_0.4s_backwards]" style={{animationDelay: '0.1s'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">Admission Rate</div>
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><GraduationCap size={16}/></div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-[#1A3A5C]">25.3%</div>
                      <div className="text-xs font-semibold text-slate-400 mt-1">1,850 admitted / 7,300 applied</div>
                    </div>
                  </div>

                  {/* Population KPI */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-emerald-500/30 animate-[cardIn_0.4s_backwards]" style={{animationDelay: '0.2s'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">Student Population</div>
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center"><Briefcase size={16}/></div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-[#1A3A5C]">4,660</div>
                      <div className="text-xs font-semibold text-emerald-500 mt-1">↑ 4.2% Growth (YoY)</div>
                    </div>
                  </div>

                  {/* Academics KPI */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-purple-500/30 animate-[cardIn_0.4s_backwards]" style={{animationDelay: '0.3s'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">Institutional CGPA</div>
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><LayoutDashboard size={16}/></div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-[#1A3A5C]">2.84</div>
                      <div className="text-xs font-semibold text-slate-400 mt-1">74% average pass rate</div>
                    </div>
                  </div>

                  {/* Finance KPI */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between transition-all hover:shadow-md hover:border-orange-500/30 animate-[cardIn_0.4s_backwards]" style={{animationDelay: '0.4s'}}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-xs text-slate-500 uppercase font-bold tracking-wide">YTD Revenue</div>
                      <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center"><Wallet size={16}/></div>
                    </div>
                    <div>
                      <div className="text-3xl font-extrabold text-[#1A3A5C]">₦138.5M</div>
                      <div className="text-xs font-semibold text-emerald-500 mt-1">81.5% Collection Efficiency</div>
                    </div>
                  </div>
                </div>

                {/* 2. MIDDLE ROW - CHARTS */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {/* Academic Performance Chart (Col 2) */}
                  <div className="col-span-1 lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="m-0 text-base text-slate-800 font-bold">Faculty Academic Performance (Avg CGPA)</h3>
                      <button onClick={() => setActiveTab('faculty')} className="text-xs font-semibold text-[#1A3A5C] hover:underline cursor-pointer">View Details</button>
                    </div>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facultyData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} interval={0} tickFormatter={(val) => val.replace('Faculty of ', '').replace('iences', '')} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748B' }} domain={[0, 4]} />
                          <RechartsTooltip cursor={{ fill: '#F1F5F9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Bar dataKey="avgCgpa" name="Avg CGPA" fill="#1A3A5C" radius={[4, 4, 0, 0]} barSize={40}>
                            {
                              facultyData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.avgCgpa < 2.5 ? '#EF4444' : entry.avgCgpa > 3.0 ? '#10B981' : '#1A3A5C'} />
                              ))
                            }
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Financial Status Summary */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="m-0 text-base text-slate-800 font-bold">Fee Collection</h3>
                      <button onClick={() => setActiveTab('finance')} className="text-xs font-semibold text-[#1A3A5C] hover:underline cursor-pointer">Go to Bursary</button>
                    </div>
                    <div className="flex-1 min-h-[200px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={FINANCE_COLORS[index % FINANCE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${value}%`} />
                          <Legend iconType="circle" layout="vertical" verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* 3. BOTTOM ROW - ALERTS & INTERVENTIONS */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk Alert */}
                  <div className="bg-red-50 rounded-3xl p-6 border border-red-100 flex items-center justify-between shadow-sm flex-col sm:flex-row gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center shrink-0">
                        <AlertTriangle size={24} className="sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h4 className="text-red-800 font-bold text-base sm:text-lg m-0">Critical Action Required</h4>
                        <p className="text-red-600 text-xs sm:text-sm m-0 mt-1">42 students flagged for academic probation (CGPA &lt; 1.0)</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('risk')} className="w-full sm:w-auto bg-red-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-red-700 transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer">
                      View Register
                    </button>
                  </div>

                  {/* Quick Actions / System Status */}
                  <div className="bg-[#1A3A5C] rounded-3xl p-6 border border-[#2B5A8C] text-white flex items-center justify-between shadow-sm flex-col sm:flex-row gap-4 sm:gap-0">
                    <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-white/10 text-[#F0C060] rounded-full flex items-center justify-center shrink-0">
                        <Database size={24} className="sm:w-7 sm:h-7" />
                      </div>
                      <div>
                        <h4 className="font-bold text-base sm:text-lg m-0 flex items-center gap-2">Data Engine <span className="bg-emerald-500 w-2 h-2 rounded-full inline-block"></span></h4>
                        <p className="text-white/70 text-xs sm:text-sm m-0 mt-1">Last synced with registry 2 hours ago</p>
                      </div>
                    </div>
                    <button onClick={() => setActiveTab('ingestion')} className="w-full sm:w-auto bg-white/10 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-white/20 transition whitespace-nowrap shrink-0 border border-white/20 cursor-pointer">
                      Import Data
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* RISK SECTION (Document Export Mockup) */}
            {activeTab === 'risk' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="m-0 text-lg text-[#1A3A5C] font-bold">Document Export Module</h2>
                    <p className="m-0 mt-1 text-xs text-slate-500">Target: Deans of Faculty | Condition: Risk Level = CRITICAL</p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onClick={downloadReport} className="flex-1 md:flex-none justify-center bg-[#1A3A5C] text-white border-none px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-[#1A3A5C]/90">
                      <Download size={16} /> Download Batch (PDF)
                    </button>
                    <button onClick={handleEmailDeans} className="flex-1 md:flex-none justify-center bg-white text-[#1A3A5C] border border-[#1A3A5C] px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-50">
                      <Mail size={16} /> Email to Deans
                    </button>
                  </div>
                </div>

                <div className="bg-white p-6 md:p-12 rounded-lg shadow-[0_5px_15px_rgba(0,0,0,0.05)] border border-slate-200 relative animate-[cardIn_0.6s_ease-out] overflow-x-auto">
                  <div className="text-center border-b-2 border-[#1A3A5C] pb-5 mb-8 min-w-[500px]">
                    <div className="text-xl font-extrabold text-[#1A3A5C] uppercase tracking-wide">University of Abuja</div>
                    <div className="text-xs font-bold text-[#F0C060] tracking-widest mt-1">OFFICE OF THE DATA ANALYST</div>
                    <div className="text-[10px] text-slate-500 mt-1">P.M.B. 117, Abuja, Nigeria</div>
                  </div>

                  <div className="text-sm text-slate-800 leading-relaxed">
                    <div className="mb-6 min-w-[500px]">
                      <strong className="text-base">INTERNAL MEMORANDUM</strong><br />
                      <div className="grid grid-cols-[100px_1fr] mt-3 gap-y-1 gap-x-2">
                        <span className="font-semibold">FROM:</span> <span>Office of the Institutional Data Analyst</span>
                        <span className="font-semibold">TO:</span> <span>The Dean, Faculty of Agriculture / Science / Engineering</span>
                        <span className="font-semibold">DATE:</span> <span>{new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="font-semibold">SUBJECT:</span> <span className="font-extrabold underline">URGENT: ACADEMIC PROBATION & INTERVENTION MANDATE</span>
                      </div>
                    </div>

                    <p className="mb-4">Dear Sir/Ma,</p>
                    <p className="mb-6">
                      The <strong>UniAbuja Automation Engine</strong> has concluded the performance audit for the current semester. Per NUC Academic Standards and University of Abuja Senate regulations, the following students in your Faculty have been flagged for <strong>CRITICAL ACADEMIC RISK</strong>:
                    </p>

                    <table className="w-full border-collapse my-6 text-xs text-left min-w-[500px]">
                      <thead>
                        <tr className="bg-slate-50 border-y border-[#1A3A5C]">
                          <th className="p-3">Matric Number</th>
                          <th className="p-3">Full Name</th>
                          <th className="p-3 text-center">Current CGPA</th>
                          <th className="p-3 text-center">Spillovers</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">UA/19/AGR/0193</td>
                          <td className="p-3">Salisu Chukwuemeka</td>
                          <td className="p-3 text-center text-red-500 font-extrabold">0.58</td>
                          <td className="p-3 text-center">9 Units</td>
                        </tr>
                        <tr className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-bold text-slate-700">UA/23/SCI/0065</td>
                          <td className="p-3">Nkemdirim Suleiman</td>
                          <td className="p-3 text-center text-red-500 font-extrabold">0.81</td>
                          <td className="p-3 text-center">6 Units</td>
                        </tr>
                      </tbody>
                    </table>

                    <p className="mb-2"><strong>REQUIRED ACTION:</strong></p>
                    <ol className="list-decimal pl-5 space-y-1 mb-10">
                      <li>Immediate placement of the above-listed students on <strong>Academic Probation</strong>.</li>
                      <li>Compulsory referral to the Faculty Student Counselling Unit within 7 working days.</li>
                      <li>Restriction of course registration for the subsequent semester until a remediation plan is signed by the HOD.</li>
                    </ol>

                    <div className="mt-10">
                      <div className="w-40 border-t border-[#1A3A5C] mb-2"></div>
                      <strong>Director, Institutional Analytics</strong><br />
                      University of Abuja
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ADMISSIONS SECTION */}
            {activeTab === 'admissions' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="m-0 text-lg text-[#1A3A5C] font-bold">Admission Analytics</h2>
                    <p className="m-0 mt-1 text-xs text-slate-500">Applicant demographics, admission rates, and JAMB score distributions.</p>
                  </div>
                  <button onClick={handleExportAdmissions} className="bg-white justify-center w-full md:w-auto text-[#1A3A5C] border border-[#1A3A5C] px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-50">
                    <Download size={16} /> Export Report
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex justify-between items-center text-sm">
                      Admission Rates by Faculty
                      <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded text-xs font-medium">Session: 2024/2025</span>
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={admissionRatesData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="applied" stackId="a" fill="#CBD5E1" name="Total Applied" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="admitted" stackId="a" fill="#1A3A5C" name="Admitted" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 flex justify-between items-center text-sm">
                      Average JAMB Scores
                      <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-xs font-medium border border-emerald-200">National Benchmark Avg</span>
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={jambScoresData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <YAxis axisLine={false} tickLine={false} domain={['dataMin - 10', 'auto']} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="Admitted" fill="#F0C060" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="Rejected" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">State of Origin Demographics</h3>
                    <p className="text-xs text-slate-500 mb-6">Distribution of enrolled students for the current year.</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={stateOfOriginData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {stateOfOriginData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: '12px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="bg-[#1A3A5C] p-8 rounded-3xl col-span-1 lg:col-span-2 text-white flex flex-col justify-center shadow-md">
                    <h3 className="font-bold text-xl mb-4 flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/10 rounded-full flex shrink-0 items-center justify-center">
                        <GraduationCap size={20} className="text-[#F0C060]" />
                      </div>
                      Admissions Executive Summary
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div>
                        <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Total Applicants</div>
                        <div className="text-3xl font-extrabold text-white">7,300</div>
                        <div className="mt-2 text-emerald-400 text-xs font-semibold">+12% vs last year</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Total Admitted</div>
                        <div className="text-3xl font-extrabold text-[#F0C060]">1,850</div>
                        <div className="mt-2 text-white/50 text-xs font-medium">25.3% Acceptance Rate</div>
                      </div>
                      <div>
                        <div className="text-white/60 text-xs font-bold uppercase tracking-wider mb-2">Avg. JAMB (Admitted)</div>
                        <div className="text-3xl font-extrabold text-white">241</div>
                        <div className="mt-2 text-white/50 text-xs font-medium">Top decile: &gt; 280</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* FACULTY SECTION */}
            {activeTab === 'faculty' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="m-0 text-lg text-[#1A3A5C] font-bold">Faculty Audit Engine</h2>
                    <p className="m-0 mt-1 text-xs text-slate-500">Cross-departmental performance metrics and NUC compliance.</p>
                  </div>
                  <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                    <select 
                      value={cgpaFilter}
                      onChange={(e) => handleFilterChange('cgpa', e.target.value)}
                      className="bg-white border text-[#1A3A5C] font-medium border-slate-300 text-sm rounded-lg focus:ring-[#1A3A5C] focus:border-[#1A3A5C] block w-full p-2 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <option value="all">All CGPA</option>
                      <option value="high">&ge; 3.0</option>
                      <option value="medium">2.5 - 2.99</option>
                      <option value="low">&lt; 2.5</option>
                    </select>

                    <select 
                      value={passRateFilter}
                      onChange={(e) => handleFilterChange('passRate', e.target.value)}
                      className="bg-white border text-[#1A3A5C] font-medium border-slate-300 text-sm rounded-lg focus:ring-[#1A3A5C] focus:border-[#1A3A5C] block w-full p-2 outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                    >
                      <option value="all">All Pass Rates</option>
                      <option value="high">&ge; 80%</option>
                      <option value="medium">60% - 79%</option>
                      <option value="low">&lt; 60%</option>
                    </select>

                    <button onClick={handleExportFaculty} className="bg-white justify-center w-full md:w-auto text-[#1A3A5C] border border-[#1A3A5C] px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-50 shrink-0">
                      <Download size={16} /> Export CSV
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[700px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 text-xs uppercase tracking-wider">
                      <tr>
                        <th className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('name')}>
                          <div className="flex items-center gap-2">
                            Faculty
                            {sortConfig?.key === 'name' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('studentId')}>
                          <div className="flex items-center gap-2">
                            Student ID
                            {sortConfig?.key === 'studentId' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('students')}>
                          <div className="flex items-center gap-2">
                            Enrolled Students
                            {sortConfig?.key === 'students' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('avgCgpa')}>
                          <div className="flex items-center gap-2">
                            Avg. CGPA
                            {sortConfig?.key === 'avgCgpa' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 font-semibold cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('passRate')}>
                          <div className="flex items-center gap-2">
                            Pass Rate
                            {sortConfig?.key === 'passRate' ? (sortConfig.direction === 'asc' ? <ArrowUp size={14}/> : <ArrowDown size={14}/>) : <ArrowUpDown size={14} className="opacity-30" />}
                          </div>
                        </th>
                        <th className="p-4 font-semibold">Staff Ratio</th>
                        <th className="p-4 font-semibold text-center">NUC Compliance</th>
                        <th className="p-4 font-semibold text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sortedFacultyData.map((faculty) => (
                        <tr key={faculty.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-[#1A3A5C]">{faculty.name}</td>
                          <td className="p-4 font-mono text-slate-500 text-xs font-semibold">{faculty.studentId}</td>
                          <td className="p-4 text-slate-600 font-medium">{faculty.students.toLocaleString()}</td>
                          <td className="p-4">
                            <span className={cn(
                              "font-bold px-2.5 py-1 rounded-md text-xs",
                              faculty.avgCgpa >= 3.0 ? "bg-emerald-100 text-emerald-700" :
                              faculty.avgCgpa >= 2.5 ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                            )}>
                              {faculty.avgCgpa.toFixed(2)}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-700">{faculty.passRate}%</span>
                              <div className="w-16 h-1.5 bg-slate-200 rounded-full overflow-hidden ml-3">
                                <div 
                                  className={cn("h-full rounded-full", faculty.passRate >= 70 ? "bg-emerald-500" : faculty.passRate >= 60 ? "bg-[#F0C060]" : "bg-red-500")}
                                  style={{ width: `${faculty.passRate}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-500 text-xs">{faculty.staffRatio}</td>
                          <td className="p-4 text-center text-xs font-semibold">
                            <span className={cn(
                              "px-2 py-1 rounded-full",
                              faculty.compliance === 'Optimal' ? "bg-emerald-50 text-emerald-600 border border-emerald-200" :
                              faculty.compliance === 'Acceptable' ? "bg-blue-50 text-blue-600 border border-blue-200" :
                              faculty.compliance === 'Warning' ? "bg-orange-50 text-orange-600 border border-orange-200" : 
                              "bg-red-50 text-red-600 border border-red-200"
                            )}>
                              {faculty.compliance}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button 
                              onClick={() => handleAssignTask(faculty)}
                              className="text-xs font-semibold text-[#1A3A5C] bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Assign Task
                            </button>
                            {assignedTasks[faculty.id] && assignedTasks[faculty.id].length > 0 && (
                              <div className="text-[10px] text-slate-400 mt-1">{assignedTasks[faculty.id].length} task(s)</div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* FINANCE SECTION */}
            {activeTab === 'finance' && (
              <div className="animate-[fadeIn_0.5s_ease-in-out]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h2 className="m-0 text-lg text-[#1A3A5C] font-bold shadow-sm-white">Bursary & IGR Analytics</h2>
                    <p className="m-0 mt-1 text-xs text-slate-500">Real-time revenue tracking, fee collection, and outstanding payments.</p>
                  </div>
                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button onClick={handleExportFinance} className="flex-1 md:flex-none justify-center bg-[#1A3A5C] text-white border-none px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-[#1A3A5C]/90 shadow-sm transition-colors">
                      <Download size={16} /> Export Financial Report
                    </button>
                    <button onClick={handleSendReminders} className="flex-1 md:flex-none justify-center bg-white text-[#1A3A5C] border border-slate-300 px-4 py-2 rounded-lg font-semibold cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-50 transition-colors">
                      <Mail size={16} /> Send Reminders
                    </button>
                  </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                        <Wallet size={20} />
                      </div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Total Revenue</div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#1A3A5C] mb-1">₦138.5M</div>
                    <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                      <TrendingUp size={12} /> +15.3% this semester
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                        <AlertTriangle size={20} />
                      </div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Outstanding Fees</div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#1A3A5C] mb-1">₦31.4M</div>
                    <div className="text-xs text-orange-600 font-semibold">
                      1,245 students owing
                    </div>
                  </div>

                  <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                        <CreditCard size={20} />
                      </div>
                      <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">Avg. Transactions</div>
                    </div>
                    <div className="text-3xl font-extrabold text-[#1A3A5C] mb-1">8,421</div>
                    <div className="text-xs text-slate-400 font-semibold">
                      Processed via Remita this month
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-[#1A3A5C] to-[#2B5A8C] p-5 rounded-2xl border border-blue-800 shadow-sm text-white">
                    <div className="text-xs text-blue-200 font-bold uppercase tracking-wide mb-2">Collection Efficiency</div>
                    <div className="text-4xl font-extrabold text-[#F0C060] mb-2">81.5%</div>
                    <div className="w-full h-1.5 bg-blue-900 rounded-full overflow-hidden">
                      <div className="h-full bg-[#F0C060] rounded-full" style={{ width: '81.5%' }}></div>
                    </div>
                    <div className="text-[10px] text-blue-200 mt-2 text-right">Target: 95%</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Revenue by Faculty */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2">
                    <h3 className="font-bold text-slate-800 mb-6 text-sm flex items-center justify-between">
                      Revenue Collection by Faculty
                      <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded">Values in Millions (₦)</span>
                    </h3>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueByFacultyData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} tickFormatter={(value) => `₦${value}M`} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                          <Bar dataKey="collected" name="Collected" stackId="a" fill="#10B981" radius={[0, 0, 4, 4]} />
                          <Bar dataKey="outstanding" name="Outstanding" stackId="a" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-2 text-sm">Overall Payment Status</h3>
                    <p className="text-xs text-slate-500 mb-6">Distribution of student fee compliance.</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={paymentStatusData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                          >
                            {paymentStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={FINANCE_COLORS[index % FINANCE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} formatter={(value) => `${value}%`} />
                          <Legend iconType="circle" layout="horizontal" verticalAlign="bottom" wrapperStyle={{ fontSize: '12px', marginTop: '10px' }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Transactions List */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm col-span-1 lg:col-span-2 overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="font-bold text-slate-800 text-sm">Recent Remita Transactions</h3>
                      <button className="text-xs text-[#1A3A5C] font-semibold hover:underline">View All</button>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left whitespace-nowrap">
                        <thead className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                          <tr>
                            <th className="px-6 py-3 font-semibold">Transaction ID</th>
                            <th className="px-6 py-3 font-semibold">Student</th>
                            <th className="px-6 py-3 font-semibold">Type</th>
                            <th className="px-6 py-3 font-semibold">Amount</th>
                            <th className="px-6 py-3 font-semibold">Date</th>
                            <th className="px-6 py-3 font-semibold">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {recentTransactions.map((trx) => (
                            <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-3 font-mono text-xs text-slate-600">{trx.id}</td>
                              <td className="px-6 py-3 font-medium text-[#1A3A5C]">{trx.student}</td>
                              <td className="px-6 py-3 text-slate-600">{trx.type}</td>
                              <td className="px-6 py-3 font-semibold text-slate-800">₦{trx.amount.toLocaleString()}</td>
                              <td className="px-6 py-3 text-slate-500 text-xs">{trx.date}</td>
                              <td className="px-6 py-3">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-md text-xs font-semibold",
                                  trx.status === 'Success' ? "bg-emerald-100 text-emerald-700" :
                                  trx.status === 'Pending' ? "bg-orange-100 text-orange-700" :
                                  "bg-red-100 text-red-700"
                                )}>
                                  {trx.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Trend sparkline */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                    <h3 className="font-bold text-slate-800 mb-6 text-sm">Monthly Revenue Trend</h3>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueTrend}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748B' }} />
                          <RechartsTooltip cursor={{ stroke: '#E2E8F0' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Line type="monotone" dataKey="revenue" stroke="#1A3A5C" strokeWidth={3} dot={{ fill: '#1A3A5C', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: '#F0C060', stroke: '#1A3A5C', strokeWidth: 2 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                      <div className="text-xs text-slate-500">Projected Next Month</div>
                      <div className="text-xl font-bold text-[#10B981]">₦320.5M</div>
                    </div>
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
