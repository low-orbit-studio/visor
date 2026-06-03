'use client';

import * as React from 'react';
import { GoogleLogo } from '@phosphor-icons/react';
import {
  LoginForm,
  type OAuthProvider,
} from '../../../../blocks/login-form/login-form';

interface LoginFormOAuthDemoProps {
  /** `default` shows OAuth + credentials; `oauth-only` hides the credentials. */
  variant?: 'default' | 'oauth-only';
}

const PROVIDERS: OAuthProvider[] = [
  {
    id: 'google',
    label: 'Continue with Google',
    icon: <GoogleLogo size={18} weight="bold" />,
  },
];

export function LoginFormOAuthDemo({
  variant = 'default',
}: LoginFormOAuthDemoProps) {
  const handleOAuthSignIn = React.useCallback((id: string) => {
    // Demo only — the actual auth call lives in the consumer (e.g.
    // supabase.auth.signInWithOAuth). The block stays auth-agnostic.
    // eslint-disable-next-line no-console
    console.log('login-form → sign in with', id);
  }, []);

  return (
    <LoginForm
      oauthProviders={PROVIDERS}
      onOAuthSignIn={handleOAuthSignIn}
      hideCredentials={variant === 'oauth-only'}
    />
  );
}
