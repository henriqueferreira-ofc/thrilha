
import { TOAST_REMOVE_DELAY, actionTypes } from "./types";
import { dispatch } from "./store";

// For generating unique IDs
let count = 0;

export function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

// Map to track active toast timeouts
export const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const addToRemoveQueue = (toastId: string) => {
  if (toastTimeouts.has(toastId)) {
    return;
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId);
    dispatch({
      type: actionTypes.REMOVE_TOAST,
      toastId: toastId,
    });
  }, TOAST_REMOVE_DELAY);

  toastTimeouts.set(toastId, timeout);
};
