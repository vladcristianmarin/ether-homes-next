import type { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

import type { Marketplace, RealEstate } from '@/typechain-types';

const ethToWei = (n: number) => {
  return ethers.parseUnits(n.toString(), 'ether');
};

const tokenURI = 'ipfs://QmPRUexYFgx9zCg7H5zFdAw6yvAZk3a2kcGPzRcGHvfCqg';

describe('Marketplace', () => {
  let buyer: HardhatEthersSigner;
  let seller: HardhatEthersSigner;
  let lender: HardhatEthersSigner;
  let inspector: HardhatEthersSigner;
  let realEstate: RealEstate;
  let marketplace: Marketplace;
  let transaction;
  let tokenId: bigint;

  const listProperty = async () => {
    transaction = await marketplace
      .connect(seller)
      .listProperty(tokenId, tokenURI, ethToWei(1));

    await transaction.wait();
  };

  const makeOffer = async () => {
    await listProperty();
    transaction = await marketplace.connect(buyer).makeOffer(tokenId);

    await transaction.wait();
  };

  const acceptOffer = async () => {
    await makeOffer();

    const event = marketplace.getEvent('EscrowCreated');

    const eventPromise = new Promise<string>((resolve, reject) => {
      marketplace.once(event, (_, address) => {
        resolve(address);
      });

      setTimeout(() => {
        reject(new Error('Event did not trigger in time'));
      }, 60000); // Timeout after 60 seconds
    });

    transaction = await marketplace.connect(seller).acceptOffer(tokenId, buyer);

    await transaction.wait();

    return eventPromise;
  };

  beforeEach(async () => {
    [buyer, seller, lender, inspector] = await ethers.getSigners();

    const RealEstate = await ethers.getContractFactory('RealEstate');
    realEstate = await RealEstate.deploy([inspector]);
    await realEstate.waitForDeployment();

    transaction = await realEstate.connect(seller).mintDummy(tokenURI);

    tokenId = transaction.value;

    const Marketplace = await ethers.getContractFactory('Marketplace');
    marketplace = await Marketplace.deploy(await realEstate.getAddress());
    await marketplace.waitForDeployment();

    transaction = await realEstate
      .connect(seller)
      .approve(await marketplace.getAddress(), tokenId);

    await transaction.wait();
  });

  it('should list property nft', async () => {
    const event = marketplace.getEvent('PropertyListed');

    const eventPromise = new Promise<{ nftId: bigint }>((resolve, reject) => {
      marketplace.once(event, (nftId) => {
        resolve({ nftId });
      });

      setTimeout(() => {
        reject(new Error('Event did not trigger in time'));
      }, 60000); // Timeout after 60 seconds
    });

    transaction = await marketplace.listProperty(
      tokenId,
      tokenURI,
      ethToWei(1),
    );

    await transaction.wait();

    const { nftId } = await eventPromise;

    expect(nftId).to.equal(tokenId);
  });

  it('should cancel listing', async () => {
    await listProperty();

    const event = marketplace.getEvent('ListingCanceled');

    const eventPromise = new Promise<{ nftId: bigint }>((resolve, reject) => {
      marketplace.once(event, (nftId) => {
        resolve({ nftId });
      });

      setTimeout(() => {
        reject(new Error('Event did not trigger in time'));
      }, 60000); // Timeout after 60 seconds
    });

    transaction = await marketplace.connect(seller).cancelListing(tokenId);
    await transaction.wait();

    const { nftId } = await eventPromise;

    const listings = await marketplace.getAllListed();

    expect(listings.length).to.be.greaterThan(0);
    expect(listings[0].isActive).to.be.false;
    expect(nftId).to.equal(tokenId);
  });

  it('makes offer', async () => {
    await listProperty();

    transaction = await marketplace.connect(buyer).makeOffer(tokenId);

    await transaction.wait();

    const listings = await marketplace.getAllListed();

    expect(listings.length).to.be.greaterThan(0);
    expect(listings[0].buyers[0]).to.be.equal(buyer);
  });

  it('should accept offer', async () => {
    await makeOffer();

    const event = marketplace.getEvent('EscrowCreated');

    const eventPromise = new Promise<string>((resolve, reject) => {
      marketplace.once(event, (_, address) => {
        resolve(address);
      });

      setTimeout(() => {
        reject(new Error('Event did not trigger in time'));
      }, 60000); // Timeout after 60 seconds
    });

    transaction = await marketplace.connect(seller).acceptOffer(tokenId, buyer);

    await transaction.wait();

    const newAddress = await eventPromise;
    const tokenAddress = await realEstate.ownerOf(tokenId);

    expect(tokenAddress).to.equal(newAddress);
  });

  it('should pay deposit', async () => {
    const escrowAddress = await acceptOffer();

    await marketplace
      .connect(buyer)
      .payDeposit(tokenId, { value: ethToWei(0.0003) });

    const Escrow = await ethers.getContractFactory('Escrow');

    const escrow = Escrow.attach(escrowAddress);

    const balance = await ethers.provider.getBalance(escrow);

    expect(balance).to.equal(ethToWei(0.0003));
  });
});
