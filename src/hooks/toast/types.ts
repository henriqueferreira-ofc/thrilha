
import * as React from "react";
import { ToastActionElement, ToastProps } from "@/components/ui/toast";

export type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: ToastActionElement;
};

export interface State {
  toasts: ToasterToast[];
}

export const TOAST_LIMIT = 5;
export const TOAST_REMOVE_DELAY = 1000000;

export const actionTypes = {
  ADD_TOAST: "ADD_TOAST",
  UPDATE_TOAST: "UPDATE_TOAST",
  DISMISS_TOAST: "DISMISS_TOAST",
  REMOVE_TOAST: "REMOVE_TOAST",
} as const;

export type ActionType = typeof actionTypes;

export type Action =
  | {
      type: ActionType["ADD_TOAST"];
      toast: ToasterToast;
    }
  | {
      type: ActionType["UPDATE_TOAST"];
      toast: Partial<ToasterToast>;
    }
  | {
      type: ActionType["DISMISS_TOAST"];
      toastId?: ToasterToast["id"];
    }
  | {
      type: ActionType["REMOVE_TOAST"];
      toastId?: ToasterToast["id"];
    };

export type Toast = Omit<ToasterToast, "id">;

export interface ToastFunction {
  (props: Toast): { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
  error: (message: string) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
  success: (message: string) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
  info: (message: string) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
  warning: (message: string) => { id: string; dismiss: () => void; update: (props: ToasterToast) => void };
}
