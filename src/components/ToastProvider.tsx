"use client";

import { type ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

type ToastInput = {
  status?: "info" | "success" | "error";
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
};

export function ToastProvider({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Toaster theme="light" position="bottom-right" richColors closeButton />
    </>
  );
}

export function useToast() {
  return {
    toast(input: ToastInput) {
      const options = {
        description: input.description,
        action: input.action,
      };

      if (input.status === "success") {
        sonnerToast.success(input.title, options);
        return;
      }

      if (input.status === "error") {
        sonnerToast.error(input.title, options);
        return;
      }

      sonnerToast(input.title, options);
    },
  };
}
