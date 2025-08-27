import { useState, useEffect } from 'react';
import { PlayerConfig, PersonalityType } from '../types';

interface PlayerInfo {
  id: number;
  name: string;
  personality: PersonalityType;
  strategy: string;
  isRunning: boolean;
  port?: number;
}

export default function Home() {
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPlayerConfig, setNewPlayerConfig] = useState<PlayerConfig>({
    name: '',
    ai: {
      apiKey: '',
      model: 'openai/gpt-4o-mini',
      maxTokens: 1000,
      temperature: 0.7
    },
    game: {
      personality: 'aggressive',
      strategy: 'balanced',
      speechStyle: 'casual',
      aggressiveness: 5,
      deceptionLevel: 5,
      cooperationLevel: 5
    },
    logging: {
      enabled: true,
      level: 'info'
    }
  });

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      const response = await fetch('/api/players');
      const data = await response.json();
      setPlayers(data);
    } catch (error) {
      console.error('Error fetching players:', error);
    } finally {
      setLoading(false);
    }
  };

  const createPlayer = async () => {
    try {
      const response = await fetch('/api/players', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPlayerConfig)
      });
      
      if (response.ok) {
        await fetchPlayers();
        setShowCreateForm(false);
        setNewPlayerConfig({
          name: '',
          ai: {
            apiKey: '',
            model: 'openai/gpt-4o-mini',
            maxTokens: 1000,
            temperature: 0.7
          },
          game: {
            personality: 'aggressive',
            strategy: 'balanced',
            speechStyle: 'casual',
            aggressiveness: 5,
            deceptionLevel: 5,
            cooperationLevel: 5
          },
          logging: {
            enabled: true,
            level: 'info'
          }
        });
      }
    } catch (error) {
      console.error('Error creating player:', error);
    }
  };

  const deletePlayer = async (id: number) => {
    try {
      const response = await fetch(`/api/players/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        await fetchPlayers();
      }
    } catch (error) {
      console.error('Error deleting player:', error);
    }
  };

  const startPlayer = async (id: number) => {
    try {
      const response = await fetch(`/api/players/${id}/start`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchPlayers();
      }
    } catch (error) {
      console.error('Error starting player:', error);
    }
  };

  const stopPlayer = async (id: number) => {
    try {
      const response = await fetch(`/api/players/${id}/stop`, {
        method: 'POST'
      });
      
      if (response.ok) {
        await fetchPlayers();
      }
    } catch (error) {
      console.error('Error stopping player:', error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">AI狼人杀玩家管理系统</h1>
          <p className="text-gray-600">管理AI玩家配置，一键启动和停止玩家服务</p>
        </div>

        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">玩家列表</h2>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            新增玩家
          </button>
        </div>

        {showCreateForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">创建新玩家</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">玩家名称</label>
                <input
                  type="text"
                  value={newPlayerConfig.name}
                  onChange={(e) => setNewPlayerConfig({...newPlayerConfig, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API密钥</label>
                <input
                  type="password"
                  value={newPlayerConfig.ai.apiKey}
                  onChange={(e) => setNewPlayerConfig({
                    ...newPlayerConfig, 
                    ai: {...newPlayerConfig.ai, apiKey: e.target.value}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">性格类型</label>
                <select
                  value={newPlayerConfig.game.personality}
                  onChange={(e) => setNewPlayerConfig({
                    ...newPlayerConfig, 
                    game: {...newPlayerConfig.game, personality: e.target.value as PersonalityType}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aggressive">激进</option>
                  <option value="conservative">保守</option>
                  <option value="cunning">狡猾</option>
                  <option value="witty">诙谐</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">策略</label>
                <select
                  value={newPlayerConfig.game.strategy}
                  onChange={(e) => setNewPlayerConfig({
                    ...newPlayerConfig, 
                    game: {...newPlayerConfig.game, strategy: e.target.value as 'aggressive' | 'conservative' | 'balanced'}
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="aggressive">激进</option>
                  <option value="conservative">保守</option>
                  <option value="balanced">平衡</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2">
              <button
                onClick={createPlayer}
                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                创建
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {players.map((player) => (
            <div key={player.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-gray-800">{player.name}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  player.isRunning ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {player.isRunning ? '运行中' : '已停止'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium">ID:</span> {player.id}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">性格:</span> {player.personality}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">策略:</span> {player.strategy}
                </p>
                {player.port && (
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">端口:</span> {player.port}
                  </p>
                )}
              </div>
              
              <div className="flex gap-2">
                {player.isRunning ? (
                  <button
                    onClick={() => stopPlayer(player.id)}
                    className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    停止
                  </button>
                ) : (
                  <button
                    onClick={() => startPlayer(player.id)}
                    className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm transition-colors"
                  >
                    启动
                  </button>
                )}
                <button
                  onClick={() => deletePlayer(player.id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm transition-colors"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}