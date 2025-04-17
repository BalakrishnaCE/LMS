import React, { ReactNode } from 'react';
import { FrappeProvider, TokenParams } from 'frappe-react-sdk';

interface NovelLMSFrappeProviderProps {
  children: ReactNode;
}

/**
 * Custom FrappeProvider for Novel LMS
 * Normally would connect to an actual Frappe backend, but for development 
 * we're using mocked services in the hooks directly.
 */
export function NovelLMSFrappeProvider({ children }: NovelLMSFrappeProviderProps) {
  // Mock configuration for development
  const tokenParams: TokenParams = {
    useToken: false,
    type: 'Bearer'
  };

  return (
    <FrappeProvider 
      url='http://10.80.4.72'
      tokenParams={tokenParams}
      socketPort='9000'
    >
      {children}
    </FrappeProvider>
  );
}

export default NovelLMSFrappeProvider;