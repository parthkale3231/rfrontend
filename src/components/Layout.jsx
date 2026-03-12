import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Tractor, ShoppingCart, Archive, PieChart, LogOut, Wallet, Menu, X } from 'lucide-react';

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    navigate('/login');
  };

  // Close mobile menu on route change
  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [navigate]);

  const navLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/farmers', icon: Tractor, label: 'Farmers' },
    { to: '/customers', icon: Users, label: 'Customers' },
    { to: '/sales', icon: ShoppingCart, label: 'Sales' },
    { to: '/stock', icon: Archive, label: 'Stock' },
    { to: '/pocket', icon: Wallet, label: 'Daily Pocket' },
    { to: '/reports', icon: PieChart, label: 'Reports' },
  ];

  return (
    <div className="flex min-h-screen font-sans bg-gray-50 text-gray-900">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-[#0B1120] text-gray-300 flex flex-col transition-all duration-300 border-r border-gray-800 hidden lg:flex shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Archive className="h-6 w-6 text-primary-500" />
            <span className="text-xl font-bold text-white tracking-wide">Rice<span className="text-primary-500">Mill</span></span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive 
                      ? 'bg-primary-600/10 text-primary-400' 
                      : 'hover:bg-gray-800 hover:text-white'
                  }`
                }
              >
                <Icon className="h-5 w-5 opacity-90" />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div 
        className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      >
        <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
        <aside className={`absolute top-0 left-0 bottom-0 w-72 bg-[#0B1120] transform transition-transform duration-300 ease-out flex flex-col ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-16 flex items-center justify-between px-6 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Archive className="h-6 w-6 text-primary-500" />
              <span className="text-xl font-bold text-white tracking-wide">Rice<span className="text-primary-500">Mill</span></span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-gray-400 hover:text-white">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-colors ${
                      isActive 
                        ? 'bg-primary-600/10 text-primary-400' 
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 border-t border-gray-800">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-base font-medium text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
          <div className="flex items-center gap-3">
             <button 
               onClick={() => setIsMobileMenuOpen(true)}
               className="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <Menu className="h-6 w-6" />
             </button>
             <div className="lg:hidden flex items-center gap-2">
               <Archive className="h-6 w-6 text-primary-600" />
               <span className="text-xl font-bold text-gray-900">Rice<span className="text-primary-600">Mill</span></span>
             </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 py-1.5 px-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border border-primary-200">
                A
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-bold text-gray-900 leading-none">Admin User</p>
                <p className="text-[10px] text-gray-500 mt-1">Mill Manager</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in-up">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
