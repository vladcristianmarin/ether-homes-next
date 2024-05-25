import { Card } from '@nextui-org/card';
import { Skeleton } from '@nextui-org/react';
import React from 'react';

const InspectorDashboardLoading = () => {
  return (
    <div className="min-h-max w-full gap-6">
      <Skeleton className="mb-6 w-32 rounded-md">
        <div className="h-3 rounded-lg bg-default-300"></div>
      </Skeleton>
      <Card className="w-full gap-6 p-2">
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
      </Card>

      <Skeleton className="my-6 w-32 rounded-md">
        <div className="h-3 rounded-lg bg-default-300"></div>
      </Skeleton>
      <Card className="w-full gap-6 p-2">
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
        <Skeleton className="rounded-md">
          <div className="h-8 rounded-lg bg-default-300"></div>
        </Skeleton>
      </Card>
    </div>
  );
};

export default InspectorDashboardLoading;
