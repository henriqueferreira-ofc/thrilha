
import { actionTypes, Toast, ToasterToast, ToastFunction } from "./types";
import { dispatch } from "./store";
import { genId } from "./toast-manager";

export const toast = (({ ...props }: Toast) => {
  const id = genId();

  const update = (props: ToasterToast) =>
    dispatch({
      type: actionTypes.UPDATE_TOAST,
      toast: { ...props, id },
    });
    
  const dismiss = () => dispatch({ type: actionTypes.DISMISS_TOAST, toastId: id });

  dispatch({
    type: actionTypes.ADD_TOAST,
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (open) => {
        if (!open) dismiss();
      },
    },
  });

  return {
    id: id,
    dismiss,
    update,
  };
}) as ToastFunction;

// Helper methods for common toast types
toast.error = (message: string) => {
  return toast({
    variant: "destructive",
    title: "Erro",
    description: message,
  });
};

toast.success = (message: string) => {
  return toast({
    title: "Sucesso",
    description: message,
  });
};

toast.info = (message: string) => {
  return toast({
    title: "Informação",
    description: message,
  });
};

toast.warning = (message: string) => {
  return toast({
    variant: "destructive", 
    title: "Aviso",
    description: message,
  });
};
