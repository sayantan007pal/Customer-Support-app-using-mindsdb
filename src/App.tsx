import { useState } from 'react';
import { Chat } from './components/Chat';
import './App.css';

function App() {
  const [userId] = useState(() => `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Customer Support Chatbot
              </h1>
              <span className="ml-3 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                Powered by MindsDB
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                User ID: <span className="font-mono text-xs">{userId.slice(-8)}</span>
              </div>
              
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-600">Online</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-[calc(100vh-200px)]">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                AI Assistant Features
              </h2>
              
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-blue-600 text-sm">🧠</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Smart Responses</h3>
                    <p className="text-sm text-gray-600">
                      AI-powered responses using MindsDB Knowledge Bases
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 text-sm">📚</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Knowledge Base</h3>
                    <p className="text-sm text-gray-600">
                      Semantic search through support documentation
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <span className="text-yellow-600 text-sm">⚡</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Real-time</h3>
                    <p className="text-sm text-gray-600">
                      Instant responses with confidence scoring
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <span className="text-purple-600 text-sm">🎯</span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Smart Escalation</h3>
                    <p className="text-sm text-gray-600">
                      Automatic escalation for complex queries
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t">
                <h3 className="font-medium text-gray-900 mb-2">Categories</h3>
                <div className="flex flex-wrap gap-2">
                  {['Technical', 'Billing', 'Shipping', 'Returns', 'General'].map(category => (
                    <span 
                      key={category}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded"
                    >
                      {category}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border h-full">
              <Chat userId={userId} className="h-full" />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="text-center text-sm text-gray-600">
            <p>
              Built with ❤️ using MindsDB Knowledge Bases, React, TypeScript, and Tailwind CSS
            </p>
            <p className="mt-1">
              Following Test-Driven Development principles for reliable AI customer support
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
