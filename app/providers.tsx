'use client';

import { NextUIProvider } from '@nextui-org/system';
import { useRouter } from 'next/navigation';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ThemeProviderProps } from 'next-themes/dist/types';
import * as React from 'react';

import ContractsContextProvider from '@/context/contracts-context';
import WalletContextProvider from '@/context/wallet-context';
import { Web3ModalProivder } from '@/context/web3modal';

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <Web3ModalProivder>
          <WalletContextProvider>
            <ContractsContextProvider>{children}</ContractsContextProvider>
          </WalletContextProvider>
        </Web3ModalProivder>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
