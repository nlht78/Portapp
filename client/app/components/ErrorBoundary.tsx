import React from 'react';
import { isRouteErrorResponse, useRouteError, useNavigate } from '@remix-run/react';

export function TokenErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  if (isRouteErrorResponse(error)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            {error.status === 404 ? (
              <>
                <div className="text-6xl mb-4">🔍</div>
                <h2 className="text-xl font-semibold mb-2 text-gray-800">
                  Token Not Found
                </h2>
                <p className="text-gray-600 mb-6">
                  The token you're looking for doesn't exist or has been removed from our database.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => navigate('/token')}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                  >
                    Browse Tokens
                  </button>
                  <button
                    onClick={() => window.history.back()}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Go Back
                  </button>
                </div>
              </>
            ) : error.status === 408 ? (
              <>
                <div className="text-6xl mb-4">⏱️</div>
                <h2 className="text-xl font-semibold mb-2 text-orange-800">
                  Request Timeout
                </h2>
                <p className="text-gray-600 mb-6">
                  {error.data || 'The request is taking longer than expected. This might be due to high API traffic.'}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => navigate('/token')}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Browse Other Tokens
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="text-6xl mb-4">❌</div>
                <h2 className="text-xl font-semibold mb-2 text-red-800">
                  Something Went Wrong
                </h2>
                <p className="text-gray-600 mb-6">
                  {error.data || `Error ${error.status}: ${error.statusText}`}
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => window.location.reload()}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    Reload Page
                  </button>
                  <button
                    onClick={() => navigate('/token')}
                    className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
                  >
                    Go Home
                  </button>
                </div>
              </>
            )}
            
            {/* Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">Debug Info</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(error, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle unexpected errors
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-xl font-semibold mb-2 text-red-800">
            Unexpected Error
          </h2>
          <p className="text-gray-600 mb-6">
            An unexpected error occurred while loading this token. Please try again.
          </p>
          <div className="flex space-x-3">
            <button
              onClick={() => window.location.reload()}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
            >
              Reload Page
            </button>
            <button
              onClick={() => navigate('/token')}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
            >
              Go Home
            </button>
          </div>
          
          {/* Debug info in development */}
          {process.env.NODE_ENV === 'development' && (
            <details className="mt-6 text-left">
              <summary className="cursor-pointer text-sm text-gray-500">Debug Info</summary>
              <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                {error instanceof Error ? error.stack : String(error)}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
