'use client';

import {
  Navbar as NextUINavbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from '@nextui-org/navbar';
import { link as linkStyles } from '@nextui-org/theme';
import { useWeb3ModalAccount } from '@web3modal/ethers/react';
import clsx from 'clsx';
import NextLink from 'next/link';

import { ThemeSwitch } from '@/components/theme-switch';
import { siteConfig } from '@/config/site';

export const Navbar = () => {
  const { isConnected } = useWeb3ModalAccount();

  return (
    <NextUINavbar maxWidth="xl" position="sticky" shouldHideOnScroll isBordered>
      <NavbarContent className="basis-1/5 sm:basis-full" justify="start">
        <NavbarBrand as="li" className="max-w-fit gap-3">
          <NextLink className="flex items-center justify-start gap-1" href="/">
            <p className="font-bold text-inherit">RETH</p>
          </NextLink>
        </NavbarBrand>
        <ul className="ml-2 flex justify-start gap-4">
          {siteConfig.navItems.map((item) => (
            <NavbarItem key={item.href}>
              <NextLink
                className={clsx(
                  linkStyles({ color: 'foreground' }),
                  'data-[active=true]:font-medium data-[active=true]:text-primary',
                )}
                color="foreground"
                href={item.href}
              >
                {item.label}
              </NextLink>
            </NavbarItem>
          ))}
        </ul>
      </NavbarContent>

      <NavbarContent className="flex basis-1/5 sm:basis-full" justify="end">
        <NavbarItem className="flex gap-4">
          <ThemeSwitch />
          <w3m-button balance="hide" />
          {isConnected ? <w3m-network-button /> : null}
        </NavbarItem>
      </NavbarContent>
    </NextUINavbar>
  );
};
