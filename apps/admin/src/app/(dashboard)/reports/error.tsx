'use client'

export default function ReportsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="p-6 max-w-3xl">
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-lg font-bold text-red-700 mb-3">
          Reports Page Error (Debug Info)
        </h2>
        <div className="space-y-2 text-sm font-mono">
          <p className="font-bold text-red-800">
            Message: {error?.message ?? 'Unknown error'}
          </p>
          {error?.digest && (
            <p className="text-red-600">Digest: {error.digest}</p>
          )}
          <details className="mt-3">
            <summary className="cursor-pointer text-red-600 font-semibold">
              Stack Trace
            </summary>
            <pre className="mt-2 text-xs bg-red-100 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
              {error?.stack ?? 'No stack available'}
            </pre>
          </details>
        </div>
        <button
          onClick={reset}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded text-sm"
        >
          Try Again
        </button>
      </div>
    </div>
  )
}
