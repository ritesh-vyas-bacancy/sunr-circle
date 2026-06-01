'use client'

export default function ComplaintsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-red-700 mb-3">Complaints Page Error</h2>
        <p className="text-sm font-mono font-bold text-red-800">
          {error?.message ?? 'Unknown error'}
        </p>
        {error?.digest && <p className="text-xs text-red-600 mt-1">Digest: {error.digest}</p>}
        <button onClick={reset} className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm">
          Try Again
        </button>
      </div>
    </div>
  )
}
