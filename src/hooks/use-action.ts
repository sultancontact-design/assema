// ===================================================================
//  /home/z/my-project/src/hooks/use-action.ts
//  Hook موحّد لكل الأزرار التفاعلية
//  - يدير حالة loading / error / success
//  - يدعم optimistic updates + rollback
//  - يعمل مع toast (sonner) تلقائياً
// ===================================================================

'use client';

import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";

type ActionFn<T extends any[], R> = (...args: T) => Promise<R>;

interface UseActionOptions<T extends any[], R> {
  onSuccess?: (result: R) => void;
  onError?: (error: Error) => void;
  optimistic?: () => void;
  rollback?: () => void;
  successMessage?: string;
  errorMessage?: string;
}

export function useAction<T extends any[], R>(
  action: ActionFn<T, R>,
  options?: UseActionOptions<T, R>
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const actionRef = useRef(action);
  actionRef.current = action;

  const execute = useCallback(
    async (...args: T): Promise<R | undefined> => {
      if (loading) return undefined;

      setLoading(true);
      setError(null);
      options?.optimistic?.();

      try {
        const result = await actionRef.current(...args);
        options?.onSuccess?.(result);
        if (options?.successMessage) {
          toast.success(options.successMessage);
        }
        return result;
      } catch (e) {
        const err = e instanceof Error ? e : new Error("Unknown error");
        setError(err);
        options?.rollback?.();
        options?.onError?.(err);
        const msg = options?.errorMessage ?? err.message;
        toast.error(msg);
        return undefined;
      } finally {
        setLoading(false);
      }
    },
    [loading, options]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, reset };
}
