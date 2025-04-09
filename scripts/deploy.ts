import { ethers } from "hardhat";

async function main() {
  const Implementation = await ethers.getContractFactory(
    "CreditDelegationVault"
  );
  const impl = await Implementation.deploy();
  await impl.deployed();

  const CDVFactory = await ethers.getContractFactory(
    "CreditDelegationVaultFactory"
  );
  const cdvFactory = await CDVFactory.deploy(
    impl.address,
    // Atomica Risk Pool Controller on Sepolia
    "0x70c9Ff46166257B6Bc3D9615552eA05EbecAf049"
  );
  await cdvFactory.deployed();

  console.log(
    `Implementation deployed to ${impl.address} and CDVFactory deployed to ${cdvFactory.address}`
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
