"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog/alert-dialog";
import { Button } from "@/components/ui/button/button";
import { deleteAccount } from "@/lib/actions";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Trash2, AlertTriangle, Loader2 } from "lucide-react";

export function DeleteAccountDialog() {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteAccount();
      if (result.success) {
        toast.success(result.message);
        router.push('/'); // Redirect to homepage after deletion
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="w-full sm:w-auto">
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Account
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <AlertDialogTitle className="text-red-900 dark:text-red-100">
                Delete Account Permanently?
              </AlertDialogTitle>
            </div>
          </div>
          <AlertDialogDescription className="text-left space-y-4">
            <p className="text-red-700 dark:text-red-300 font-medium">
              This action cannot be undone. This will permanently delete your account and remove your data from our servers.
            </p>
            
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900 dark:text-red-100 mb-2">What will be deleted:</p>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• Your profile and account information</li>
                <li>• All personal data and preferences</li>
                <li>• Any saved content or settings</li>
                <li>• Access to all connected services</li>
              </ul>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 mb-1">Before you continue:</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">
                Make sure you've downloaded any important data you want to keep. This action is irreversible.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-3">
          <AlertDialogCancel className="flex-1">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleDelete} 
            disabled={isPending}
            className="flex-1 bg-red-600 hover:bg-red-700 focus:ring-red-500"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Forever
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
} 