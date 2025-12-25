
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
  Users as UsersIcon
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
    { path: '/cards', label: 'Resumo em Cards', icon: <LayoutGrid size={20} /> },
    { path: '/analise', label: 'Análise de Valores', icon: <BarChartHorizontal size={20} /> },
    { path: '/transacoes', label: 'Lançamentos', icon: <ReceiptText size={20} /> },
  ];

  // Adiciona Gestão de Usuários apenas para admins
  if (isAdmin) {
    navItems.push({ path: '/usuarios', label: 'Usuários', icon: <UsersIcon size={20} /> });
  }

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      {/* Estilos para Impressão */}
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
          .max-w-6xl { 
            max-width: 100% !important; 
            width: 100% !important;
          }
          .bg-white, .dark\\:bg-slate-900 { 
            background: white !important; 
            border: 1px solid #eee !important; 
            box-shadow: none !important;
            page-break-inside: avoid;
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
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 bg-blue-800 dark:bg-slate-800 rounded-lg text-yellow-400"
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>
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
            
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 hover:bg-blue-800 dark:hover:bg-slate-800 rounded-xl transition-colors text-yellow-400"
              title={isDarkMode ? "Mudar para Modo Claro" : "Mudar para Modo Escuro"}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>
          </div>

          <div className="mb-8 px-4 py-3 bg-blue-800/50 dark:bg-slate-800/50 rounded-xl border border-blue-700/50 dark:border-slate-700/50 flex items-center gap-3">
             <div className={`p-2 rounded-full ${isAdmin ? 'bg-yellow-400 text-blue-900' : 'bg-blue-600 text-white'}`}>
               {isAdmin ? <ShieldCheck size={16} /> : <UserIcon size={16} />}
             </div>
             <div className="overflow-hidden">
               <p className="text-[10px] text-blue-300 dark:text-slate-400 font-black uppercase truncate tracking-widest">
                 {isAdmin ? 'ADMINISTRADOR' : 'TESOUREIRO'}
               </p>
               <p className="text-sm font-bold truncate">{user?.name || 'Usuário'}</p>
             </div>
          </div>

          <nav className="flex-1 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                  ${location.pathname === item.path 
                    ? 'bg-yellow-400 text-blue-900 font-bold shadow-lg shadow-yellow-400/20' 
                    : 'hover:bg-blue-800 dark:hover:bg-slate-800 text-blue-100'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors font-bold uppercase tracking-widest text-[10px]"
          >
            <LogOut size={20} />
            Encerrar Sessão
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto main-content-area">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden print:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
