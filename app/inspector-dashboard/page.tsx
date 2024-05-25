'use client';

import { Button, Tooltip } from '@nextui-org/react';
import type { NextPage } from 'next';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { IoReload } from 'react-icons/io5';
import { toast } from 'react-toastify';

import InspectorAllPropertyTable from '@/components/inspector-all-properties-table';
import InspectorUnverifiedPropertyTable from '@/components/inspector-unverified-property-table';
import { useContracts } from '@/context/contracts-context';
import { useWallet } from '@/context/wallet-context';
import type { RealEstate } from '@/typechain-types';

const InspectorDashboard: NextPage = () => {
  const router = useRouter();

  const { isLoadingWallet } = useWallet();
  const { realEstate, loadingInspectorStatus, isInspector } = useContracts();

  const [unverifiedProperties, setUnverifiedProperties] = useState<
    RealEstate.PropertyStruct[]
  >([]);
  const [isFetchingUnverified, setIsFetchingUnverified] =
    useState<boolean>(false);

  const [allProperties, setAllProperties] = useState<
    RealEstate.PropertyStruct[]
  >([]);
  const [isFetchingAll, setIsFetchingAll] = useState<boolean>(false);

  const accessDenied = useMemo(
    () =>
      loadingInspectorStatus === false &&
      !isInspector &&
      isLoadingWallet === false,
    [isInspector, isLoadingWallet, loadingInspectorStatus],
  );

  useEffect(() => {
    if (accessDenied) {
      router.replace('/access-denied');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessDenied]);

  const fetchUnverifiedProperties = useCallback(async () => {
    setIsFetchingUnverified(true);

    try {
      const properties = await realEstate?.getUninspectedProperties();
      if (properties) setUnverifiedProperties(properties);
    } catch (e: any) {
      toast('Fetch properties failed', { autoClose: 500, type: 'error' });
    } finally {
      setIsFetchingUnverified(false);
    }
  }, [realEstate]);

  const fetchAllProperties = useCallback(async () => {
    setIsFetchingAll(true);

    try {
      const properties = await realEstate?.getAssignedProperties();
      if (properties) setAllProperties(properties);
    } catch (e: any) {
      toast('Fetch properties failed', { autoClose: 500, type: 'error' });
    } finally {
      setIsFetchingAll(false);
    }
  }, [realEstate]);

  useEffect(() => {
    fetchAllProperties().then().catch();
    fetchUnverifiedProperties().then().catch();
  }, [fetchAllProperties, fetchUnverifiedProperties]);

  if (accessDenied) return null;

  return (
    <div className="mx-16 flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Unverified properties</h2>
          <Tooltip
            content={isFetchingUnverified ? 'Fetching data...' : 'Refetch data'}
            offset={15}
            delay={500}
          >
            <Button
              isIconOnly
              aria-label="Reset"
              variant="light"
              onPress={fetchUnverifiedProperties}
              isLoading={isFetchingUnverified}
            >
              <IoReload size={18} />
            </Button>
          </Tooltip>
        </div>

        <InspectorUnverifiedPropertyTable
          properties={unverifiedProperties}
          isLoading={isFetchingUnverified}
          refetch={async () => {
            await fetchUnverifiedProperties();
            await fetchAllProperties();
          }}
        />
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">
            All properties assign to you
          </h2>
          <Tooltip
            content={isFetchingAll ? 'Fetching data...' : 'Refetch data'}
            offset={15}
            delay={500}
          >
            <Button
              isIconOnly
              aria-label="Reset"
              variant="light"
              onPress={fetchAllProperties}
              isLoading={isFetchingAll}
            >
              <IoReload size={18} />
            </Button>
          </Tooltip>
        </div>

        <InspectorAllPropertyTable
          properties={allProperties}
          isLoading={isFetchingAll}
        />
      </div>
    </div>
  );
};

export default InspectorDashboard;
