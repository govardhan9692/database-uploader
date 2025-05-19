
import { NavLink } from 'react-router-dom';
import { LogOut, Grid2X2Icon, ImageIcon, VideoIcon, FolderIcon, User, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSidebar } from '@/hooks/use-sidebar';

interface DashboardSidebarProps {
  onLogout: () => Promise<void>;
  userName?: string;
  userEmail?: string;
}

const DashboardSidebar = ({ onLogout, userName, userEmail }: DashboardSidebarProps) => {
  const { collapsed, setCollapsed } = useSidebar();
  
  return (
    <aside className={`bg-slate-900 text-white h-screen flex flex-col transition-all duration-300 ${collapsed ? 'w-[80px]' : 'w-[250px]'}`}>
      {/* User profile section */}
      <div className="flex flex-col items-center p-4 border-b border-slate-700">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-3">
          <User size={32} className="text-slate-400" />
        </div>
        
        {!collapsed && (
          <>
            <h3 className="font-medium text-sm">{userName || 'User'}</h3>
            <p className="text-xs text-slate-400 truncate max-w-full">{userEmail || ''}</p>
          </>
        )}
        
        <Button 
          variant="ghost" 
          size="sm"
          className="mt-2 text-slate-300 hover:text-white hover:bg-slate-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </Button>
      </div>

      {/* Navigation section */}
      <nav className="flex-1 py-4">
        <ul className="space-y-2 px-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `
                flex items-center p-2 rounded-md
                ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${collapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <Home size={20} />
              {!collapsed && <span className="ml-3">Dashboard</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/?tab=all"
              className={({ isActive }) => `
                flex items-center p-2 rounded-md
                ${isActive || location.pathname === '/' && !location.search ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${collapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <Grid2X2Icon size={20} />
              {!collapsed && <span className="ml-3">All Media</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/?tab=images"
              className={({ isActive }) => `
                flex items-center p-2 rounded-md
                ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${collapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <ImageIcon size={20} />
              {!collapsed && <span className="ml-3">Images</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/?tab=videos"
              className={({ isActive }) => `
                flex items-center p-2 rounded-md
                ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${collapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <VideoIcon size={20} />
              {!collapsed && <span className="ml-3">Videos</span>}
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/?tab=collections"
              className={({ isActive }) => `
                flex items-center p-2 rounded-md
                ${isActive ? 'bg-primary text-white' : 'text-slate-300 hover:bg-slate-800'}
                ${collapsed ? 'justify-center' : 'px-4'}
              `}
            >
              <FolderIcon size={20} />
              {!collapsed && <span className="ml-3">Collections</span>}
            </NavLink>
          </li>
        </ul>
      </nav>

      {/* Logout button */}
      <div className="p-4 border-t border-slate-700">
        <Button 
          onClick={onLogout} 
          variant="ghost" 
          size="sm"
          className="w-full text-slate-300 hover:text-white hover:bg-slate-800 flex items-center justify-center"
        >
          <LogOut size={18} />
          {!collapsed && <span className="ml-2">Log Out</span>}
        </Button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
