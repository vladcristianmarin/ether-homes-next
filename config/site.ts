export type SiteConfig = typeof siteConfig;

export const siteConfig = {
  name: 'EtherHomes',
  description: 'Transact Realestate using cutting edge blockchain technology!',
  navItems: [
    {
      label: 'Tokenize property',
      href: '/tokenize',
    },
    {
      label: 'Inspector dashboard',
      href: '/inspector-dashboard',
    },
    { label: 'Listings dashboard', href: '/listed-properties' },
    { label: 'Manage transaction', href: '/buying-properties' },
  ],
  navMenuItems: [],
  links: {},
};
