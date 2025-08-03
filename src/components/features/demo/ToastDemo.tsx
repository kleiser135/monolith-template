"use client";

import { Button } from "@/components/ui/button/button";
import { 
  showInfo, 
  showWarning, 
  showLoading, 
  showPromise, 
  showAction, 
  showSuccess, 
  showError,
  dismissAll 
} from "@/lib/toast-helpers";

export function ToastDemo() {
  // Simulate an async operation for promise toast
  const simulateAsyncOperation = () => {
    return new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.3) {
          resolve("Operation completed successfully!");
        } else {
          reject(new Error("Operation failed"));
        }
      }, 2000);
    });
  };

  // Simulate a long operation for loading toast
  const handleLoadingDemo = () => {
    const _toastId = showLoading("Processing your request...");
    
    setTimeout(() => {
      showSuccess("Request processed successfully!");
      // The loading toast will be automatically dismissed when a new toast appears
    }, 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6">Toast Notifications Demo</h2>
      <p className="text-gray-600 mb-8">
        Try out all the different types of toast notifications available in our app.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Success/Error (already in use) */}
        <div className="space-y-2">
          <h3 className="font-semibold text-green-600">Success & Error</h3>
          <Button 
            onClick={() => showSuccess("Operation successful!")}
            variant="outline"
            className="w-full"
          >
            Success Toast
          </Button>
          <Button 
            onClick={() => showError("Something went wrong!")}
            variant="outline"
            className="w-full"
          >
            Error Toast
          </Button>
        </div>

        {/* New Info/Warning */}
        <div className="space-y-2">
          <h3 className="font-semibold text-blue-600">Info & Warning</h3>
          <Button 
            onClick={() => showInfo("Here's some helpful information")}
            variant="outline"
            className="w-full"
          >
            Info Toast
          </Button>
          <Button 
            onClick={() => showWarning("This requires your attention")}
            variant="outline"
            className="w-full"
          >
            Warning Toast
          </Button>
        </div>

        {/* Loading States */}
        <div className="space-y-2">
          <h3 className="font-semibold text-purple-600">Loading States</h3>
          <Button 
            onClick={handleLoadingDemo}
            variant="outline"
            className="w-full"
          >
            Loading Toast
          </Button>
          <Button 
            onClick={() => {
              showPromise(simulateAsyncOperation(), {
                loading: "Processing...",
                success: "Done!",
                error: "Failed to process"
              });
            }}
            variant="outline"
            className="w-full"
          >
            Promise Toast
          </Button>
        </div>

        {/* Interactive */}
        <div className="space-y-2">
          <h3 className="font-semibold text-orange-600">Interactive</h3>
          <Button 
            onClick={() => {
              showAction(
                "Email sent successfully",
                {
                  label: "Undo",
                  onClick: () => showInfo("Email sending undone!")
                }
              );
            }}
            variant="outline"
            className="w-full"
          >
            Action Toast
          </Button>
          <Button 
            onClick={dismissAll}
            variant="destructive"
            className="w-full"
          >
            Dismiss All
          </Button>
        </div>
      </div>

      {/* Usage Examples */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold mb-2">Usage Examples</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <div><code>showSuccess(&quot;Login successful!&quot;)</code> - ✅ Already used in forms</div>
          <div><code>showError(&quot;Invalid credentials&quot;)</code> - ❌ Already used in forms</div>
          <div><code>showInfo(&quot;Profile updated&quot;)</code> - ℹ️ New: Helpful information</div>
          <div><code>showWarning(&quot;Session expires soon&quot;)</code> - ⚠️ New: Important warnings</div>
          <div><code>showLoading(&quot;Saving changes...&quot;)</code> - ⏳ New: Ongoing operations</div>
          <div><code>showPromise(promise, messages)</code> - 🔄 New: Auto loading→success/error</div>
        </div>
      </div>
    </div>
  );
} 