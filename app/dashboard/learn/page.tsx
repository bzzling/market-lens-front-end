'use client';

import { useState } from 'react';
import NewsArticles from '@/components/ui/learn/news-articles';
import AIChat from '@/components/ui/learn/ai-chat';

export default function LearnPage() {
  const [activeTab, setActiveTab] = useState<'ai' | 'news'>('news');

  return (
    <div className="max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-8">Market Insights</h1>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('news')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'news'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          Market News
        </button>
        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2 rounded-md transition-colors ${
            activeTab === 'ai'
              ? 'bg-white text-black'
              : 'text-gray-400 hover:bg-zinc-800 hover:text-white'
          }`}
        >
          AI Assistant
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'news' ? <NewsArticles /> : <AIChat />}
      </div>
    </div>
  );
}