import { Suspense } from 'react';

import TokenizePageLoading from './loading';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <Suspense fallback={<TokenizePageLoading />}>{children}</Suspense>;
}
