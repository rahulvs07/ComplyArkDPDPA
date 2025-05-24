import { useState, createContext, useContext, ReactNode } from "react";
import { type ToastProps, type ToastActionElement } from "@/components/ui/toast";

type ToastType = ToastProps & {
  id: string;
  title?: string;
  description?: string;
  action?: ToastActionElement;
};

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 5000;

type ToastContextType = {
  toasts: ToastType[];
  toast: (props: Omit<ToastType, "id">) => void;
  dismiss: (toastId: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastType[]>([]);

  const toast = ({ ...props }: Omit<ToastType, "id">) => {
    const id = crypto.randomUUID();
    const newToast = { id, ...props };
    
    setToasts((prevToasts) => {
      const updatedToasts = [...prevToasts, newToast].slice(-TOAST_LIMIT);
      return updatedToasts;
    });

    setTimeout(() => {
      dismiss(id);
    }, TOAST_REMOVE_DELAY);

    return id;
  };

  const dismiss = (toastId: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== toastId));
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  
  return context;
}