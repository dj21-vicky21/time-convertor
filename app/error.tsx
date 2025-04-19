'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-sm border border-gray-200 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Something went wrong</h2>
        
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 text-left">
          <p className="text-sm text-red-700">
            {error.message || "An unexpected error occurred."}
          </p>
          {error.digest && (
            <p className="text-xs text-gray-500 mt-1">
              Error ID: {error.digest}
            </p>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          Please try again or contact support if the problem persists.
        </p>
        
        <div className="flex justify-center gap-4">
          <Button
            onClick={() => window.location.href = '/'}
            variant="outline"
          >
            Go Home
          </Button>
          
          <Button
            onClick={() => reset()}
            variant="default"
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );
}
