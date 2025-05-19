
import { useAuthSignUp } from './use-auth-sign-up';
import { useAuthSignIn } from './use-auth-sign-in';
import { useAuthSignOut } from './use-auth-sign-out';
import { useAuthPasswordReset } from './use-auth-password-reset';
import { useState } from 'react';

export function useAuthService() {
  const signUpHook = useAuthSignUp();
  const signInHook = useAuthSignIn();
  const signOutHook = useAuthSignOut();
  const passwordResetHook = useAuthPasswordReset();
  
  const isLoading = signUpHook.isLoading || 
                    signInHook.isLoading || 
                    signOutHook.isLoading || 
                    passwordResetHook.isLoading;
  
  const lastError = signUpHook.lastError || 
                    signInHook.lastError || 
                    signOutHook.lastError || 
                    passwordResetHook.lastError;

  return {
    signUp: signUpHook.signUp,
    signIn: signInHook.signIn,
    signOut: signOutHook.signOut,
    resetPassword: passwordResetHook.resetPassword,
    forceLogout: signOutHook.forceLogout,
    isLoading,
    lastError
  };
}

export * from './use-auth-sign-up';
export * from './use-auth-sign-in';
export * from './use-auth-sign-out';
export * from './use-auth-password-reset';
