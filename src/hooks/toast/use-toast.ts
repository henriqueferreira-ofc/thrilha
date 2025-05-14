
import * as React from "react";
import { State } from "./types";
import { listeners, memoryState } from "./store";
import { toast } from "./toast";
import { dispatch, actionTypes } from "./store";

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    dismiss: (toastId?: string) => dispatch({ 
      type: actionTypes.DISMISS_TOAST, 
      toastId 
    }),
  };
}

// Export the toast function directly
export { toast } from './toast';
