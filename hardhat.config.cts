import '@nomicfoundation/hardhat-toolbox';
import type { HardhatUserConfig } from 'hardhat/config';

const config: HardhatUserConfig = {
  solidity: '0.8.25',
  networks: {
    hardhat: {
      chainId: 1337,
    },
  },
};

export default config;
