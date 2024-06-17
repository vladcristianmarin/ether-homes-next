import type { Marketplace } from '@/typechain-types/contracts/Marketplace.sol';

import type { RealEstate } from '../typechain-types';

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');
const { ethers } = require('hardhat');

async function main() {
  const [dApp, _seller, _buyer, inspector] = await ethers.getSigners();

  // Deploy RealEstate NFT contract
  const RealEstateFactory = await ethers.getContractFactory('RealEstate');
  const realEstate: RealEstate = await RealEstateFactory.connect(dApp).deploy([
    inspector,
  ]);
  await realEstate.waitForDeployment();

  console.log(
    `Deployed RealEstate contract at: ${await realEstate.getAddress()}`,
  );

  const realEstateAbi = (await hre.artifacts.readArtifact('RealEstate')).abi;

  const dir = path.join(__dirname, '../abis');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, 'RealEstate.json'),
    JSON.stringify(
      { abi: realEstateAbi, address: await realEstate.getAddress() },
      null,
      2,
    ),
  );

  // Deploy Marketplace contract
  const MarketplaceFactory = await ethers.getContractFactory('Marketplace');
  const marketplace: Marketplace = await MarketplaceFactory.connect(
    dApp,
  ).deploy(await realEstate.getAddress());

  await marketplace.waitForDeployment();

  console.log(
    `Deployed MarketplaceContract contract at: ${await marketplace.getAddress()}`,
  );

  const marketplaceAbi = (await hre.artifacts.readArtifact('Marketplace')).abi;

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(dir, 'Marketplace.json'),
    JSON.stringify(
      { abi: marketplaceAbi, address: await marketplace.getAddress() },
      null,
      2,
    ),
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
