import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4 text-lg">
        Oops! The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <Link href="/dashboard" className="mt-6 text-blue-500 hover:underline">
        Go back to the Dashboard
      </Link>
    </div>
  )
} 