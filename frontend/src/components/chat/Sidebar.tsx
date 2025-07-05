import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { 
  MessageSquare, 
  Plus, 
  Settings, 
  FolderOpen,
  User,
  LogOut,
  Trash2,
  Menu,
  X,
  Edit2,
  Check,
  Folder,
  MoreVertical
} from 'lucide-react';
import { Button } from '../ui/Button';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

interface Chat {
  id: string;
  title: string;
  project_id?: string | null;
  updated_at: string;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
}

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { chatId } = useParams();
  const { user, signOut } = useAuthStore();
  const { 
    clearMessages, 
    refreshTrigger, 
    sidebarOpen, 
    setSidebarOpen,
    chats,
    projects,
    loadChats,
    loadProjects,
    createProject,
    deleteProject,
    moveChatToProject
  } = useChatStore();
  
  const [loading, setLoading] = useState(true);
  const [editingProject, setEditingProject] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState('');
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, refreshTrigger]);

  const loadData = async () => {
    try {
      setLoading(true);
      await Promise.all([loadChats(), loadProjects()]);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      clearMessages();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleNewChat = () => {
    clearMessages();
    setSidebarOpen(false); // Close sidebar on mobile after action
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    
    try {
      await createProject(newProjectName.trim());
      setNewProjectName('');
      setShowNewProjectForm(false);
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm('Are you sure you want to delete this project? Chats will be moved to "No Project".')) {
      try {
        await deleteProject(projectId);
      } catch (error) {
        console.error('Failed to delete project:', error);
      }
    }
  };

  const formatChatTitle = (title: string) => {
    return title.length > 25 ? title.substring(0, 25) + '...' : title;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  const groupedChats = React.useMemo(() => {
    const grouped: Record<string, Chat[]> = {
      'no-project': []
    };
    
    // Initialize project groups
    projects.forEach(project => {
      grouped[project.id] = [];
    });
    
    // Group chats
    chats.forEach(chat => {
      const key = chat.project_id || 'no-project';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(chat);
    });
    
    return grouped;
  }, [chats, projects]);

  const menuItems = [
    { icon: Settings, label: 'MCP Configuration', path: '/config' }
  ];

  const SidebarContent = () => (
    <div className="w-full bg-gray-50 border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-gray-900 rounded-lg flex items-center justify-center mr-3">
              <div className="w-4 h-4 bg-white rounded-sm"></div>
            </div>
            <span className="text-lg font-semibold text-gray-900">mcp/chat-bot</span>
          </div>
          <Button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            variant="ghost"
            size="sm"
            icon={X}
          />
        </div>
        
        <Button
          onClick={handleNewChat}
          className="w-full"
          icon={Plus}
          variant="outline"
        >
          New Chat
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 p-4 overflow-y-auto">
        <nav className="space-y-2 mb-6">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`
                flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                ${location.pathname === item.path
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-700 hover:bg-gray-100'
                }
              `}
            >
              <item.icon className="w-4 h-4 mr-3" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Projects Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Projects
            </h3>
            <Button
              onClick={() => setShowNewProjectForm(true)}
              variant="ghost"
              size="sm"
              icon={Plus}
              className="h-6 w-6 p-0"
            />
          </div>
          
          {showNewProjectForm && (
            <div className="mb-3 p-2 bg-gray-100 rounded-lg">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Project name"
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateProject();
                  if (e.key === 'Escape') {
                    setShowNewProjectForm(false);
                    setNewProjectName('');
                  }
                }}
                autoFocus
              />
              <div className="flex justify-end space-x-1 mt-2">
                <Button
                  onClick={() => {
                    setShowNewProjectForm(false);
                    setNewProjectName('');
                  }}
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateProject}
                  size="sm"
                  className="h-6 px-2 text-xs"
                  disabled={!newProjectName.trim()}
                >
                  Create
                </Button>
              </div>
            </div>
          )}

          {/* Project Groups */}
          {projects.map((project) => (
            <div key={project.id} className="mb-4">
              <div className="flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg group">
                <div className="flex items-center">
                  <Folder className="w-4 h-4 mr-2" />
                  <span className="truncate">{project.name}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteProject(project.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                  title="Delete project"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              
              {groupedChats[project.id]?.map((chat) => (
                <div
                  key={chat.id}
                  className={`ml-6 group relative flex items-center px-3 py-2 rounded-lg transition-colors ${
                    chatId === chat.id 
                      ? 'bg-gray-200 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Link
                    to={`/chat/${chat.id}`}
                    className="flex-1 min-w-0 block"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="text-sm truncate">
                      {formatChatTitle(chat.title)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(chat.updated_at)}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ))}

          {/* Unorganized Chats */}
          {groupedChats['no-project']?.length > 0 && (
            <div>
              <div className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 mb-2">
                <FolderOpen className="w-4 h-4 mr-2" />
                <span>Unorganized</span>
              </div>
              
              {groupedChats['no-project'].map((chat) => (
                <div
                  key={chat.id}
                  className={`ml-6 group relative flex items-center px-3 py-2 rounded-lg transition-colors ${
                    chatId === chat.id 
                      ? 'bg-gray-200 text-gray-900' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Link
                    to={`/chat/${chat.id}`}
                    className="flex-1 min-w-0 block"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <div className="text-sm truncate">
                      {formatChatTitle(chat.title)}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatDate(chat.updated_at)}
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400"></div>
          </div>
        )}
      </div>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0">
            {user?.user_metadata?.avatar_url ? (
              <img
                src={user.user_metadata.avatar_url}
                alt={user.user_metadata?.full_name || user.email}
                className="w-8 h-8 rounded-full mr-3"
              />
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.email}
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            icon={LogOut}
            className="ml-2"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        onClick={() => setSidebarOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50"
        variant="outline"
        size="sm"
        icon={Menu}
      />

      {/* Desktop Sidebar */}
      <div className={`hidden lg:block w-64 ${sidebarOpen ? 'block' : 'hidden'}`}>
        <SidebarContent />
      </div>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="relative w-64 max-w-xs">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  );
};