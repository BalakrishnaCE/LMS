import React, { ReactNode } from 'react';
import { FrappeProvider, TokenParams } from 'frappe-react-sdk';
import { LMS_API_BASE_URL } from "@/config/routes";

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
      url={LMS_API_BASE_URL}
      tokenParams={tokenParams}
      // enableSocket={false}
      socketPort='9000'
      swrConfig={{
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        // revalidateOnMount: false,
        // revalidateIfStale: false,
        refreshInterval: 0,
      }}
    >
      {children}
    </FrappeProvider>
  );
}

export default NovelLMSFrappeProvider;