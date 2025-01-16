'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/auth-forms/card';

type NewsArticle = {
  title: string;
  source_id: string;
  link: string;
  pubDate: string;
  description: string;
  image_url: string | null;
};

type NewsResponse = {
  status: string;
  totalResults: number;
  results: NewsArticle[];
};

export default function NewsArticles() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch('/api/cached-news');
        if (!response.ok) throw new Error('Failed to fetch news');
        const data: NewsResponse = await response.json();
        
        if (data.status === 'success' && Array.isArray(data.results)) {
          const articlesWithImages = data.results.filter(article => article.image_url);
          setArticles(articlesWithImages);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        setError('Failed to load news articles');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return (
      <Card className="h-[400px] lg:h-[calc(100vh-20rem)] p-6">
        <div className="h-full flex flex-col">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="h-4 bg-zinc-800 rounded w-1/4"></div>
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-8 w-12 bg-zinc-800 rounded"></div>
              ))}
            </div>
          </div>
          <div className="flex-1 bg-zinc-800 rounded animate-pulse" />
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-800 p-4 text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {articles.map((article, i) => (
        <Card key={i} className="overflow-hidden hover:bg-zinc-900/50 transition-colors">
          <a href={article.link} target="_blank" rel="noopener noreferrer">
            <div className="relative h-48 w-full">
              <img
                src={article.image_url!}
                alt={article.title}
                className="object-cover w-full h-full"
              />
            </div>
            <div className="p-6">
              <h3 className="font-bold mb-2 line-clamp-2">{article.title}</h3>
              <p className="text-sm text-gray-400 mb-2">
                {article.source_id} • {new Date(article.pubDate).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-300 line-clamp-3">{article.description}</p>
            </div>
          </a>
        </Card>
      ))}
    </div>
  );
} 