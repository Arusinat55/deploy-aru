import React from 'react';
import { ChevronDown } from 'lucide-react';
import { useChatStore, AVAILABLE_MODELS } from '../../store/chatStore';

const MODEL_DISPLAY_NAMES: Record<string, { name: string; description: string }> = {
  'gpt-4.1': { name: 'GPT-4.1', description: 'Latest and most capable' },
  'gpt-4.1-mini': { name: 'GPT-4.1 Mini', description: 'Faster, cost-effective' },
  'gpt-4.1-nano': { name: 'GPT-4.1 Nano', description: 'Ultra-fast responses' },
  'gpt-4o': { name: 'GPT-4o', description: 'Optimized for conversations' },
  'gpt-4o-mini': { name: 'GPT-4o Mini', description: 'Balanced performance' },
  'gpt-3.5-turbo': { name: 'GPT-3.5 Turbo', description: 'Fast and reliable' }
};

export const ModelSelector: React.FC = () => {
  const { selectedModel, setSelectedModel } = useChatStore();

  const currentModel = MODEL_DISPLAY_NAMES[selectedModel] || MODEL_DISPLAY_NAMES['gpt-4o'];

  return (
    <div className="relative">
      <select
        value={selectedModel}
        onChange={(e) => setSelectedModel(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-lg px-3 py-1.5 pr-8 text-sm text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent min-w-[140px]"
      >
        {AVAILABLE_MODELS.map((model) => (
          <option key={model} value={model}>
            {MODEL_DISPLAY_NAMES[model]?.name || model}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  );
};