import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { BigNumber } from "@ethersproject/bignumber";

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
import { AtomicaPoolMock } from "../typechain-types/contracts/mocks/AtomicaPool.sol";
import { AtomicaPoolMock__factory } from "../typechain-types/factories/contracts/mocks/AtomicaPool.sol";
import { AavePoolMock } from "../typechain-types/contracts/mocks/AavePool.sol";
import { AavePoolMock__factory } from "../typechain-types/factories/contracts/mocks/AavePool.sol";
import { TokenERC20Mock } from "../typechain-types/contracts/mocks/TokenERC20.sol";
import { TokenERC20Mock__factory } from "../typechain-types/factories/contracts/mocks/TokenERC20.sol";

let cdvFactory_factory: CreditDelegationVaultFactory__factory;
let cdvFactory: CreditDelegationVaultFactory;
let impl_factory: CreditDelegationVault__factory;
let impl: CreditDelegationVault;
let debtToken_factory: DebtTokenMock__factory;
let debtToken: DebtTokenMock;
let atomicaPool_factory: AtomicaPoolMock__factory;
let atomicaPool: AtomicaPoolMock;
let aavePool_factory: AavePoolMock__factory;
let aavePool: AavePoolMock;
let tokenErc20_factory: TokenERC20Mock__factory;
let tokenErc20: TokenERC20Mock;

describe("Credit Delegation Vault", () => {
  beforeEach(() => setup());

  describe("Initialization", async () => {
    it("Should not accept zero address for manager", async () => {
      await expect(
        cdvFactory.deployVault(
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          debtToken.address
        )
      ).to.be.revertedWith("CDV003: Manager is the zero address");
    });

    it("Should not initialize an vault with factory as zero address", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      await expect(
        impl.initialize(
          owner.address,
          manager.address,
          pool.address,
          debtToken.address
        )
      ).to.be.revertedWith("CDV001: Initialization Unauthorized");
    });
  });

  describe("Access and view functions", () => {
    it("Should not allow not owner/manager calling borrow", async () => {
      const [_, manager, pool] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        pool.address,
        debtToken.address
      );
      await expect(
        vault.connect(pool).borrow(ethers.utils.parseEther("100"))
      ).to.be.revertedWith("CDV005: Only owner or manager");
    });
    it("Should not allow not owner calling change manager", async () => {
      const [_, manager, pool] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        pool.address,
        debtToken.address
      );
      await expect(
        vault.connect(manager).changeManager(pool.address)
      ).to.be.revertedWith("CDV004: Only owner");
    });
    it("Should successfully change manager", async () => {
      const [_, manager, pool] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        pool.address,
        debtToken.address
      );
      expect(await vault.manager()).to.be.eq(manager.address);

      const tx = await vault.changeManager(pool.address);
      await tx.wait();

      expect(await vault.manager()).to.be.eq(pool.address);
    });
    it("Should successfully return borrow allowance", async () => {
      const [_, manager, pool] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        pool.address,
        debtToken.address
      );
      const allowanceAmount = ethers.utils.parseEther("100");
      await debtToken.approveDelegation(vault.address, allowanceAmount);
      expect(await vault.borrowAllowance()).to.be.eq(allowanceAmount);
    });
  });

  describe("Borrow", async () => {
    it("Should borrow successfully as a manager", async () => {
      const [owner, manager] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        atomicaPool.address,
        debtToken.address
      );
      const amount = ethers.utils.parseEther("100");
      await debtToken.approveDelegation(vault.address, amount);
      await fundAavePool(amount);
      const tx = await vault.connect(manager).borrow(amount);
      const receipt = await tx.wait();
      const borrowEvent = getFromEvent(receipt, "Borrow");
      expect(borrowEvent[1]).to.be.eq(owner.address);
      expect(borrowEvent[2]).to.be.eq(amount);
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(amount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(amount);
      expect(await vault.loanAmount()).to.be.eq(amount);
    });

    it("Should borrow successfully as a owner", async () => {
      const [owner, manager] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        atomicaPool.address,
        debtToken.address
      );
      const amount = ethers.utils.parseEther("100");
      await debtToken.approveDelegation(vault.address, amount);
      await fundAavePool(amount);
      const tx = await vault.borrow(amount);
      const receipt = await tx.wait();
      const borrowEvent = getFromEvent(receipt, "Borrow");
      expect(borrowEvent[1]).to.be.eq(owner.address);
      expect(borrowEvent[2]).to.be.eq(amount);
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(amount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(amount);
      expect(await vault.loanAmount()).to.be.eq(amount);
    });

    it("Should revert with the borrow amount is bigger than approved", async () => {
      const [owner, manager] = await ethers.getSigners();
      const vault = await deployVault(
        manager.address,
        atomicaPool.address,
        debtToken.address
      );
      const amount = ethers.utils.parseEther("100");
      await debtToken.approveDelegation(vault.address, amount);
      await fundAavePool(amount);
      await expect(
        vault.borrow(ethers.utils.parseEther("1000"))
      ).to.be.revertedWith("ERC20: transfer amount exceeds balance");
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(
        ethers.utils.parseEther("0")
      );
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        ethers.utils.parseEther("0")
      );
      expect(await vault.loanAmount()).to.be.eq(ethers.utils.parseEther("0"));
    });
  });
});

const setup = async () => {
  cdvFactory_factory = await ethers.getContractFactory(
    "CreditDelegationVaultFactory"
  );
  debtToken_factory = await ethers.getContractFactory("DebtTokenMock");
  impl_factory = await ethers.getContractFactory("CreditDelegationVault");
  tokenErc20_factory = await ethers.getContractFactory("TokenERC20Mock");
  atomicaPool_factory = await ethers.getContractFactory("AtomicaPoolMock");
  aavePool_factory = await ethers.getContractFactory("AavePoolMock");
  impl = await impl_factory.deploy();
  cdvFactory = await cdvFactory_factory.deploy(impl.address);
  aavePool = await aavePool_factory.deploy();
  tokenErc20 = await tokenErc20_factory.deploy();
  atomicaPool = await atomicaPool_factory.deploy(tokenErc20.address);
  debtToken = await debtToken_factory.deploy(
    tokenErc20.address,
    aavePool.address
  );
};

const getFromEvent = (receipt: ContractReceipt, eventName: string) => {
  const event = receipt.events?.find((e) => e.event == eventName);
  return event?.args || [];
};

const deployVault = async (
  manager: string,
  pool: string,
  debtToken: string
) => {
  const tx = await cdvFactory.deployVault(manager, pool, debtToken);
  const receipt = await tx.wait();
  const vaultEvent = getFromEvent(receipt, "VaultCreated");
  return ethers.getContractAt("CreditDelegationVault", vaultEvent[0]);
};

const fundAavePool = async (amount: BigNumber) => {
  await tokenErc20.transfer(aavePool.address, amount);
};
