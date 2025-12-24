
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  LogOut, 
  Church, 
  Menu, 
  X,
  User as UserIcon
} from 'lucide-react';
import { getCurrentUser, setCurrentUser } from '../services/storage';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
  const user = getCurrentUser();

  const navItems = [
    { path: '/', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/transacoes', label: 'Lançamentos', icon: <ReceiptText size={20} /> },
  ];

  const handleLogout = () => {
    setCurrentUser(null);
    navigate('/login');
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden bg-blue-800 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <Church className="text-yellow-400" />
          <span className="font-bold">3IPI Natal</span>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-blue-900 text-white transform transition-transform duration-300 ease-in-out
        md:relative md:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="hidden md:flex items-center gap-3 mb-10">
            <div className="p-2 bg-yellow-400 rounded-lg">
              <Church className="text-blue-900" size={24} />
            </div>
            <h1 className="text-xl font-bold tracking-tight">3IPI Natal</h1>
          </div>

          <div className="mb-8 px-4 py-3 bg-blue-800/50 rounded-xl border border-blue-700/50 flex items-center gap-3">
             <div className="p-2 bg-blue-700 rounded-full">
               <UserIcon size={16} className="text-yellow-400" />
             </div>
             <div className="overflow-hidden">
               <p className="text-xs text-blue-300 font-bold uppercase truncate">Tesoureiro(a)</p>
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
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${location.pathname === item.path 
                    ? 'bg-yellow-400 text-blue-900 font-bold shadow-lg shadow-yellow-400/20' 
                    : 'hover:bg-blue-800 text-blue-100'}
                `}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </nav>

          <button 
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 text-red-300 hover:bg-red-900/30 rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default Layout;
