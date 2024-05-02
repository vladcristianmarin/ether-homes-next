import { ethers } from "hardhat";
import { expect } from "chai";
import { RealEstate } from "../typechain-types/contracts/RealEstate";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

const TEST_IPFS = [
  "QmPRUexYFgx9zCg7H5zFdAw6yvAZk3a2kcGPzRcGHvfCqg",
  "QmbqCZ8xfR6yHapNPCt8NAgD8QxAY7rpPhqJoVWDu9rnUf",
];

describe("RealEstate", () => {
  let realEstate: RealEstate;
  let dApp: HardhatEthersSigner, seller: HardhatEthersSigner;

  beforeEach(async () => {
    [dApp, seller] = await ethers.getSigners();
    const RealEstate = await ethers.getContractFactory("RealEstate");
    realEstate = await RealEstate.deploy();
    await realEstate.waitForDeployment();
  });

  it("should initialize the contract correctly", async () => {
    const owner = await realEstate.owner();
    expect(owner).to.be.equal(dApp);
  });

  it("should mint an initial NFT", async () => {
    let transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0]);
    await transaction.wait();

    const tokenURI = await realEstate.tokenURI(0);

    expect(tokenURI).to.be.equal(TEST_IPFS[0]);
  });

  it("should update the tokenURI", async () => {
    let transaction = await realEstate
      .connect(seller)
      .createTokenURI(TEST_IPFS[0]);
    await transaction.wait();

    transaction = await realEstate
      .connect(seller)
      .updateTokenURI(0, TEST_IPFS[1]);
    await transaction.wait();

    const tokenURI = await realEstate.tokenURI(0);

    expect(tokenURI).to.be.equal(TEST_IPFS[1]);
  });
});
