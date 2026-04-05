'use client';

import { OrchestratorProvider } from '@/store/orchestrator-context';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';
import CategoryTabs from '@/components/orchestrate/CategoryTabs';
import MessagingInterface from '@/components/messaging/MessagingInterface';

export default function Home() {
  return (
    <OrchestratorProvider>
      <div className="flex flex-col h-screen bg-gray-50">
        <Header />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            <div className="max-w-4xl mx-auto px-8 py-12">
              {/* Hero / Branding */}
              <div className="text-center mb-12">
                <h1 className="text-7xl font-serif text-gray-900 mb-4 tracking-tight" style={{ fontFamily: 'Georgia, "Times New Roman", serif' }}>
                  <span className="bg-gradient-to-r from-blue-900 via-blue-700 to-blue-500 bg-clip-text text-transparent">
                    Orchestrator
                  </span>
                </h1>
                <p className="text-xs tracking-[0.35em] text-gray-500 font-medium uppercase">
                  Empowering with AI, not replacing.
                </p>
              </div>

              {/* Category Tabs */}
              <div className="flex justify-center mb-8">
                <CategoryTabs />
              </div>

              {/* Messaging Interface */}
              <MessagingInterface />
            </div>
          </main>
        </div>
      </div>
    </OrchestratorProvider>
  );
}
