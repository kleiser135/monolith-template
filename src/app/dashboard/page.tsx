export default function DashboardPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold">Dashboard (Protected)</h1>
      <p className="mt-4">This page should only be visible to logged-in users.</p>
    </main>
  );
} 