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
  let transaction: any = await realEstate
    .connect(caller)
    .createProperty(
      'Bucuresti',
      'Str Sandulesti 7',
      4,
      1,
      59,
      62,
      1992,
      ['docs'],
      ['images'],
    );

  transaction = await transaction.wait();
};

describe('RealEstate', () => {
  let realEstate: RealEstate;
  let dApp: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let inspector: HardhatEthersSigner;

  beforeEach(async () => {
    [dApp, seller, inspector] = await ethers.getSigners();
    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy([inspector]);
    await realEstate.waitForDeployment();
  });

  it('should initialize the contract correctly', async () => {
    const owner = await realEstate.owner();
    expect(owner).to.be.equal(dApp);
  });

  it('should create property', async () => {
    await createTestProperty(realEstate, seller);

    const myProperties = await realEstate
      .connect(seller)
      .getCreatedProperties();

    expect(myProperties[0].id).to.be.equal(0);
  });

  it('should update property', async () => {
    await createTestProperty(realEstate, seller);

    const transaction = await realEstate
      .connect(inspector)
      .verifyProperty(seller, 0);

    await transaction.wait();

    const property = await realEstate.connect(seller).getCreatedPropertyById(0);

    expect(property.verified).to.be.equal(true);
  });

  it('should mint an initial NFT', async () => {
    await createTestProperty(realEstate, seller);

    let transaction = await realEstate
      .connect(inspector)
      .verifyProperty(seller, 0);

    await transaction.wait();

    transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0], 0);
    await transaction.wait();

    const tokenURI = await realEstate.tokenURI(0);

    expect(tokenURI).to.be.equal(TEST_IPFS[0]);
  });

  it('should update the tokenURI', async () => {
    await createTestProperty(realEstate, seller);

    let transaction = await realEstate
      .connect(inspector)
      .verifyProperty(seller, 0);

    await transaction.wait();

    transaction = await realEstate
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

    let transaction = await realEstate
      .connect(inspector)
      .verifyProperty(seller, 0);

    await transaction.wait();

    transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0], 0);
    await transaction.wait();

    const ownedTokens = await realEstate.getOwnedTokens(seller);

    expect(ownedTokens[0]).to.be.equal('0');
  });

  it('should return assigned contracts for inspector', async () => {
    await createTestProperty(realEstate, seller);
    let uninspectedProperties = await realEstate
      .connect(inspector)
      .getUninspectedProperties();

    const initLength = uninspectedProperties.length;

    const transaction = await realEstate
      .connect(inspector)
      .verifyProperty(seller, 0);

    await transaction.wait();

    uninspectedProperties = await realEstate
      .connect(inspector)
      .getUninspectedProperties();

    const finalLength = uninspectedProperties.length;

    const allAssigned = await realEstate
      .connect(inspector)
      .getAssignedProperties();

    expect(initLength).to.be.equal(1);
    expect(finalLength).to.be.equal(0);
    expect(allAssigned.length).to.be.equal(1);
  });
});
