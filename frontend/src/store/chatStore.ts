import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../config/supabase';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  tools_used?: string[];
  attachments?: Array<{
    id: string;
    filename: string;
    original_name: string;
    mime_type: string;
    file_size: number;
  }>;
}

interface Chat {
  id: string;
  title: string;
  project_id?: string | null;
  updated_at: string;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  created_at: string;
  chats?: Chat[];
}

interface ChatState {
  messages: Message[];
  chats: Chat[];
  projects: Project[];
  currentChatId: string | null;
  isLoading: boolean;
  selectedModel: string;
  enabledTools: string[];
  sidebarOpen: boolean;
  refreshTrigger: number;
  
  // Actions
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setChats: (chats: Chat[]) => void;
  setProjects: (projects: Project[]) => void;
  setCurrentChatId: (chatId: string | null) => void;
  setLoading: (loading: boolean) => void;
  setSelectedModel: (model: string) => void;
  setEnabledTools: (tools: string[]) => void;
  setSidebarOpen: (open: boolean) => void;
  clearMessages: () => void;
  refreshChats: () => void;
  
  // Project actions
  createProject: (name: string) => Promise<Project>;
  updateProject: (id: string, name: string) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  moveChatToProject: (chatId: string, projectId: string | null) => Promise<void>;
  loadProjects: () => Promise<void>;
  loadChats: () => Promise<void>;
}

const AVAILABLE_MODELS = [
  'gpt-4.1',
  'gpt-4.1-mini', 
  'gpt-4.1-nano',
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-3.5-turbo'
];

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      messages: [],
      chats: [],
      projects: [],
      currentChatId: null,
      isLoading: false,
      selectedModel: 'gpt-4o',
      enabledTools: [],
      sidebarOpen: true,
      refreshTrigger: 0,
      
      setMessages: (messages) => set({ messages }),
      addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
      setChats: (chats) => set({ chats }),
      setProjects: (projects) => set({ projects }),
      setCurrentChatId: (currentChatId) => set({ currentChatId }),
      setLoading: (isLoading) => set({ isLoading }),
      setSelectedModel: (selectedModel) => set({ selectedModel }),
      setEnabledTools: (enabledTools) => set({ enabledTools }),
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      clearMessages: () => set({ messages: [], currentChatId: null }),
      refreshChats: () => set((state) => ({ refreshTrigger: state.refreshTrigger + 1 })),
      
      createProject: async (name: string) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) throw new Error('Not authenticated');
          
          const { data, error } = await supabase
            .from('projects')
            .insert([{ name, user_id: user.id }])
            .select()
            .single();
          
          if (error) throw error;
          
          const newProject = data as Project;
          set((state) => ({ projects: [...state.projects, newProject] }));
          return newProject;
        } catch (error) {
          console.error('Error creating project:', error);
          throw error;
        }
      },
      
      updateProject: async (id: string, name: string) => {
        try {
          const { error } = await supabase
            .from('projects')
            .update({ name })
            .eq('id', id);
          
          if (error) throw error;
          
          set((state) => ({
            projects: state.projects.map(p => p.id === id ? { ...p, name } : p)
          }));
        } catch (error) {
          console.error('Error updating project:', error);
          throw error;
        }
      },
      
      deleteProject: async (id: string) => {
        try {
          // First, move all chats in this project to no project
          await supabase
            .from('chats')
            .update({ project_id: null })
            .eq('project_id', id);
          
          // Then delete the project
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
          
          if (error) throw error;
          
          set((state) => ({
            projects: state.projects.filter(p => p.id !== id),
            chats: state.chats.map(c => c.project_id === id ? { ...c, project_id: null } : c)
          }));
        } catch (error) {
          console.error('Error deleting project:', error);
          throw error;
        }
      },
      
      moveChatToProject: async (chatId: string, projectId: string | null) => {
        try {
          const { error } = await supabase
            .from('chats')
            .update({ project_id: projectId })
            .eq('id', chatId);
          
          if (error) throw error;
          
          set((state) => ({
            chats: state.chats.map(c => c.id === chatId ? { ...c, project_id: projectId } : c)
          }));
        } catch (error) {
          console.error('Error moving chat to project:', error);
          throw error;
        }
      },
      
      loadProjects: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
          
          if (error) throw error;
          
          set({ projects: data || [] });
        } catch (error) {
          console.error('Error loading projects:', error);
        }
      },
      
      loadChats: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;
          
          const { data, error } = await supabase
            .from('chats')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });
          
          if (error) throw error;
          
          set({ chats: data || [] });
        } catch (error) {
          console.error('Error loading chats:', error);
        }
      }
    }),
    {
      name: 'chat-storage',
      partialize: (state) => ({
        selectedModel: state.selectedModel,
        enabledTools: state.enabledTools,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);

export { AVAILABLE_MODELS };