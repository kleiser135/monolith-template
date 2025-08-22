export default function TestPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="container mx-auto max-w-4xl">
        <h1 className="text-4xl font-bold text-white mb-8">Tailwind Color Test</h1>
        
        {/* Test basic colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 p-4 rounded-lg">
            <p className="text-white font-semibold">Slate 800</p>
            <p className="text-slate-400 text-sm">bg-slate-800</p>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <p className="text-white font-semibold">Purple 600</p>
            <p className="text-purple-200 text-sm">bg-purple-600</p>
          </div>
          <div className="bg-blue-500 p-4 rounded-lg">
            <p className="text-white font-semibold">Blue 500</p>
            <p className="text-blue-200 text-sm">bg-blue-500</p>
          </div>
          <div className="bg-green-500 p-4 rounded-lg">
            <p className="text-white font-semibold">Green 500</p>
            <p className="text-green-200 text-sm">bg-green-500</p>
          </div>
        </div>
        
        {/* Test gradients */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Gradient Test</h2>
          <div className="bg-gradient-to-r from-purple-500 to-blue-500 p-6 rounded-lg">
            <p className="text-white text-lg font-semibold">Purple to Blue Gradient</p>
            <p className="text-purple-100">bg-gradient-to-r from-purple-500 to-blue-500</p>
          </div>
        </div>
        
        {/* Test buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Button Test</h2>
          <div className="flex gap-4">
            <button className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
              Blue Button
            </button>
            <button className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors">
              Purple Button
            </button>
            <button className="px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
              Green Button
            </button>
          </div>
        </div>
        
        {/* Test text colors */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Text Color Test</h2>
          <div className="space-y-2">
            <p className="text-slate-300">Slate 300 text</p>
            <p className="text-purple-400">Purple 400 text</p>
            <p className="text-blue-400">Blue 400 text</p>
            <p className="text-green-400">Green 400 text</p>
          </div>
        </div>
        
        <div className="mt-8">
          <a href="/" className="text-blue-400 hover:text-blue-300 underline">
            ← Back to HomePage
          </a>
        </div>
      </div>
    </div>
  );
}
