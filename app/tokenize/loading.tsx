import { Card, Skeleton } from '@nextui-org/react';

const TokenizePageLoading = () => {
  return (
    <div className="grid min-h-max w-full grid-cols-9 gap-4">
      <div className="col-span-5 flex h-full flex-col gap-4 ">
        <Card className="flex grow flex-col gap-2 p-2">
          <Skeleton className="mb-6 rounded-md">
            <div className="h-3 rounded-lg bg-default-300"></div>
          </Skeleton>
          {new Array(6).fill(null).map((_, index) => (
            <Skeleton key={index} className="rounded-md">
              <div className="h-8 rounded-lg bg-default-300"></div>
            </Skeleton>
          ))}
        </Card>
        <Card className="flex flex-col gap-2 p-2">
          {new Array(2).fill(null).map((_, index) => (
            <Skeleton key={index} className="rounded-md">
              <div className="h-6 rounded-lg bg-default-300"></div>
            </Skeleton>
          ))}
        </Card>
      </div>

      <Card className="col-span-4 h-full p-2">
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="col-span-2 mb-6 rounded-md">
            <div className="h-3 rounded-lg bg-default-300"></div>
          </Skeleton>
          <Skeleton className="col-span-2 rounded-md">
            <div className="h-14 rounded-lg bg-default-300"></div>
          </Skeleton>
          {new Array(6).fill(null).map((_, index) => (
            <Skeleton key={index} className="rounded-md">
              <div className="h-14 rounded-lg bg-default-300"></div>
            </Skeleton>
          ))}
          {new Array(3).fill(null).map((_, index) => (
            <Skeleton key={index} className="col-span-2 rounded-md">
              <div className="h-14 rounded-lg bg-default-300"></div>
            </Skeleton>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default TokenizePageLoading;
