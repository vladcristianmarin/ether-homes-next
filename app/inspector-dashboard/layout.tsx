import { Suspense } from 'react';

import InspectorDashboardLoading from './loading';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<InspectorDashboardLoading />}>{children}</Suspense>
  );
}
