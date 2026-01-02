
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  LogOut, 
  Church, 
  Menu, 
  X,
  User as UserIcon,
  ShieldCheck,
  Sun,
  Moon,
  LayoutGrid,
  BarChartHorizontal,
  Users as UsersIcon,
  FileText
} from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark' || 
           (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });
  
  const user = getCurrentUser();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/cards', label: 'Resumo', icon: <LayoutGrid size={20} /> },
    { path: '/transacoes', label: 'Lançamentos', icon: <ReceiptText size={20} /> },
    { path: '/analise', label: 'Análise', icon: <BarChartHorizontal size={20} /> },
    { path: '/relatorios', label: 'Relatórios', icon: <FileText size={20} /> },
  ];

  if (isAdmin) {
    navItems.push({ path: '/usuarios', label: 'Usuários', icon: <UsersIcon size={20} /> });
  }

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <style>{`
        @media print {
          aside, nav, .print\\:hidden, button, header, .mobile-header { 
            display: none !important; 
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body, #root, .min-h-screen {
            height: auto !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          main { 
            padding: 0 !important; 
            margin: 0 !important; 
            width: 100% !important; 
            background: white !important; 
            overflow: visible !important;
            display: block !important;
            position: static !important;
          }
        }
      `}</style>

      {/* Mobile Header */}
      <div className="md:hidden bg-blue-900 dark:bg-slate-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md print:hidden mobile-header">
        <div className="flex items-center gap-2">
          <Church className="text-yellow-400" />
          <span className="font-bold">3IPI Natal</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-yellow-400"><Sun size={20} /></button>
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
            {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-blue-900 dark:bg-slate-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0 print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="hidden md:flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-400 rounded-lg">
                <Church className="text-blue-900" size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight">3IPI Natal</h1>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 text-yellow-400">
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${location.pathname === item.path 
                    ? 'bg-yellow-400 text-blue-900 font-bold shadow-lg shadow-yellow-400/20 scale-105' 
                    : 'hover:bg-blue-800 dark:hover:bg-slate-800 text-blue-100'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="mt-8 px-4 py-3 bg-blue-800/50 rounded-xl flex items-center gap-3">
             <div className="p-2 bg-yellow-400 text-blue-900 rounded-full"><UserIcon size={14} /></div>
             <div className="overflow-hidden">
               <p className="text-[10px] text-blue-300 font-black uppercase truncate">{user?.name || 'Usuário'}</p>
             </div>
          </div>

          <button onClick={handleLogout} className="mt-4 flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors font-bold uppercase text-[10px]">
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setIsSidebarOpen(false)} />}
    </div>
  );
};

export default Layout;
