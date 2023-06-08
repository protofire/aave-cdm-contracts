import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";

import {
  CreditDelegationVaultFactory,
  CreditDelegationVault,
} from "../typechain-types/contracts";
import {
  CreditDelegationVaultFactory__factory,
  CreditDelegationVault__factory,
} from "../typechain-types/factories/contracts";
import { DebtTokenMock } from "../typechain-types/contracts/mocks/DebtToken.sol";
import { DebtTokenMock__factory } from "../typechain-types/factories/contracts/mocks/DebtToken.sol";

import { predictAndSignPermit } from "./helpers/contractHelpers";

let cdvFactory_factory: CreditDelegationVaultFactory__factory;
let cdvFactory: CreditDelegationVaultFactory;
let impl_factory: CreditDelegationVault__factory;
let impl: CreditDelegationVault;
let debtToken_factory: DebtTokenMock__factory;
let debtToken: DebtTokenMock;

describe("Credit Delegation Vault Factory", () => {
  describe("Deployment", async () => {
    it("Should not allow deploy a factory with implementation address being 0", async () => {
      cdvFactory_factory = await ethers.getContractFactory(
        "CreditDelegationVaultFactory"
      );
      await expect(
        cdvFactory_factory.deploy("0x0000000000000000000000000000000000000000")
      ).to.be.revertedWith("CDVF001: Implementation is the zero address");
    });
    it("Should successfully deploy an factory", async () => {
      cdvFactory_factory = await ethers.getContractFactory(
        "CreditDelegationVaultFactory"
      );
      impl_factory = await ethers.getContractFactory("CreditDelegationVault");
      impl = await impl_factory.deploy();
      cdvFactory = await cdvFactory_factory.deploy(impl.address);
      expect(await cdvFactory.CDV_IMPLEMENTATION()).to.be.eq(impl.address);
    });
  });
  describe("Deploy vault", async () => {
    before(() => setup());
    it("Should deploy a vault with the correct settings", async () => {
      const allowanceAmount = ethers.utils.parseEther("100");
      const [owner, manager, atomicaPool] = await ethers.getSigners();

      const { v, r, s } = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );

      const tx = await cdvFactory.deployVault(
        manager.address,
        atomicaPool.address,
        debtToken.address,
        allowanceAmount,
        2661766724,
        v,
        r,
        s,
        0,
        ethers.utils.parseEther("2")
      );
      const receipt = await tx.wait();
      const vautEvent = getFromEvent(receipt, "VaultCreated");
      const vault = await ethers.getContractAt(
        "CreditDelegationVault",
        vautEvent[0]
      );
      const txAllowance = await debtToken.approveDelegation(
        vault.address,
        allowanceAmount
      );
      await txAllowance.wait();
      expect(await vault.owner()).to.equal(owner.address);
      expect(await vault.manager()).to.equal(manager.address);
      expect(await vault.ATOMICA_POOL()).to.equal(atomicaPool.address);
      expect(await vault.DEBT_TOKEN()).to.equal(debtToken.address);
      expect(
        await debtToken.borrowAllowance(owner.address, vault.address)
      ).to.equal(allowanceAmount);
      expect(await cdvFactory.nonces(owner.address)).to.be.eq(1);
    });

    it("Should correctly keep record of vaults deployed by owner", async () => {
      const [owner, manager, atomicaPool1, atomicaPool2] =
        await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");

      const { v, r, s } = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );

      const tx1 = await cdvFactory.deployVault(
        manager.address,
        atomicaPool1.address,
        debtToken.address,
        allowanceAmount,
        2661766724,
        v,
        r,
        s,
        0,
        ethers.utils.parseEther("2")
      );

      let sig = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );
      const tx2 = await cdvFactory.deployVault(
        manager.address,
        atomicaPool2.address,
        debtToken.address,
        allowanceAmount,
        2661766724,
        sig.v,
        sig.r,
        sig.s,
        0,
        ethers.utils.parseEther("2")
      );
      const receipt1 = await tx1.wait();
      const receipt2 = await tx2.wait();
      const vaultEvent1 = getFromEvent(receipt1, "VaultCreated");
      const vaultEvent2 = getFromEvent(receipt2, "VaultCreated");
      const vaults = await cdvFactory.vaultsByOwner(owner.address);
      expect(vaults[1]).to.be.equal(vaultEvent1[0]);
      expect(vaults[2]).to.be.equal(vaultEvent2[0]);
      expect(await cdvFactory.nonces(owner.address)).to.be.eq(3);
    });
  });
});

const setup = async () => {
  cdvFactory_factory = await ethers.getContractFactory(
    "CreditDelegationVaultFactory"
  );
  impl_factory = await ethers.getContractFactory("CreditDelegationVault");
  impl = await impl_factory.deploy();
  cdvFactory = await cdvFactory_factory.deploy(impl.address);
  debtToken_factory = await ethers.getContractFactory("DebtTokenMock");
  const [asset, pool] = await ethers.getSigners();
  debtToken = await debtToken_factory.deploy(asset.address, pool.address);
};

const getFromEvent = (receipt: ContractReceipt, eventName: string) => {
  const event = receipt.events?.find((e) => e.event == eventName);
  return event?.args || [];
};
