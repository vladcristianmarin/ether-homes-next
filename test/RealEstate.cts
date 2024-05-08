import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import type { RealEstate } from '../typechain-types/contracts/RealEstate';
import { ContractRunner } from 'ethers';

const TEST_IPFS = [
  'QmPRUexYFgx9zCg7H5zFdAw6yvAZk3a2kcGPzRcGHvfCqg',
  'QmbqCZ8xfR6yHapNPCt8NAgD8QxAY7rpPhqJoVWDu9rnUf',
];

const createTestProperty = async (
  realEstate: RealEstate,
  caller: ContractRunner,
) => {
  const transaction = await realEstate
    .connect(caller)
    .createProperty('Bucuresti', 'Str Sandulesti 7', 4, 1, 59, 62, 1992);

  await transaction.wait();

  const filter = realEstate.filters['PropertyCreated(uint256)'];
  const propertyId = (await realEstate.queryFilter(filter))[0].args[0];

  const property = await realEstate
    .connect(caller)
    .getOwnedPropertyById(propertyId);
};

describe('RealEstate', () => {
  let realEstate: RealEstate;
  let dApp: HardhatEthersSigner;
  let seller: HardhatEthersSigner;

  beforeEach(async () => {
    [dApp, seller] = await ethers.getSigners();
    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();
  });

  it('should initialize the contract correctly', async () => {
    const owner = await realEstate.owner();
    expect(owner).to.be.equal(dApp);
  });

  it('should create property', async () => {
    await createTestProperty(realEstate, seller);

    const myProperties = await realEstate.connect(seller).getOwnedProperties();

    expect(myProperties[0].id).to.be.equal(0);
  });

  it('should mint an initial NFT', async () => {
    await createTestProperty(realEstate, seller);

    const transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0], 0);
    await transaction.wait();

    const tokenURI = await realEstate.tokenURI(0);

    expect(tokenURI).to.be.equal(TEST_IPFS[0]);
  });

  it('should update the tokenURI', async () => {
    await createTestProperty(realEstate, seller);

    let transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0], 0);
    await transaction.wait();

    transaction = await realEstate
      .connect(seller)
      .updateTokenURI(0, TEST_IPFS[1]);
    await transaction.wait();

    const tokenURI = await realEstate.tokenURI(0);

    expect(tokenURI).to.be.equal(TEST_IPFS[1]);
  });

  it('should return address minted tokens', async () => {
    await createTestProperty(realEstate, seller);

    const transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0], 0);
    await transaction.wait();

    const ownedTokens = await realEstate.getOwnedTokens(seller);

    expect(ownedTokens[0]).to.be.equal('0');
  });

  it('should return all properties', async () => {
    await createTestProperty(realEstate, seller);
    await createTestProperty(realEstate, seller);

    const allProperties = await realEstate.getAllProperties();

    expect(allProperties.length).to.be.equal(2);
  });
});
