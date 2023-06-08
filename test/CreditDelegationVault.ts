import { expect } from "chai";
import { ethers } from "hardhat";
import { ContractReceipt } from "@ethersproject/contracts/src.ts";
import { BigNumber } from "@ethersproject/bignumber";

import { predictAndSignPermit, signPermit } from "./helpers/contractHelpers";

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
import {
  DebtToken6DecimalsMock,
  DebtToken6DecimalsMock__factory,
} from "../typechain-types";

let cdvFactory_factory: CreditDelegationVaultFactory__factory;
let cdvFactory: CreditDelegationVaultFactory;
let impl_factory: CreditDelegationVault__factory;
let impl: CreditDelegationVault;
let debtToken_factory: DebtTokenMock__factory;
let debtToken6decimals_factory: DebtToken6DecimalsMock__factory;
let debtToken: DebtTokenMock;
let debtToken6decimals: DebtToken6DecimalsMock;
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
      const allowanceAmount = ethers.utils.parseEther("100");
      const [owner] = await ethers.getSigners();
      const { v, r, s } = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );
      await expect(
        cdvFactory.deployVault(
          "0x0000000000000000000000000000000000000000",
          "0x0000000000000000000000000000000000000000",
          debtToken.address,
          allowanceAmount,
          2661766724,
          v,
          r,
          s,
          ethers.utils.parseEther("0"),
          ethers.utils.parseEther("2")
        )
      ).to.be.revertedWith("CDV003: Manager is the zero address");
    });

    it("Should not initialize an vault with factory as zero address", async () => {
      const allowanceAmount = ethers.utils.parseEther("100");
      const [owner, manager, pool] = await ethers.getSigners();
      const { v, r, s } = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );

      await expect(
        impl.initialize(
          owner.address,
          manager.address,
          pool.address,
          debtToken.address,
          ethers.utils.parseEther("2"),
          allowanceAmount,
          2661766724,
          v,
          r,
          s,
          ethers.utils.parseEther("0")
        )
      ).to.be.revertedWith("CDV001: Initialization Unauthorized");
    });

    it("Should not allow initialize an vault already initialized", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { v, r, s } = await predictAndSignPermit(
        cdvFactory,
        debtToken,
        owner,
        allowanceAmount
      );

      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      await expect(
        vault.initialize(
          owner.address,
          manager.address,
          pool.address,
          debtToken.address,
          ethers.utils.parseEther("2"),
          allowanceAmount,
          2661766724,
          v,
          r,
          s,
          ethers.utils.parseEther("0")
        )
      ).to.be.revertedWith("CDV001: Initialization Unauthorized");
    });
    it("Should perform an borrow/deposit at initializion if percentage is 10%", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("200");
      const initAmount = ethers.utils.parseEther("20");
      await fundAavePool(amount);
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        // ethers.utils.parseEther("10"),
        1000,
        ethers.utils.parseEther("2")
      );
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(initAmount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        initAmount
      );
      expect(await vault.loanAmount()).to.be.eq(initAmount);
    });
    it("Should perform an borrow/deposit at initializion if percentage is 15%", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const initAmount = ethers.utils.parseEther("15");
      await fundAavePool(amount);
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        1500,
        ethers.utils.parseEther("2")
      );
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(initAmount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        initAmount
      );
      expect(await vault.loanAmount()).to.be.eq(initAmount);
    });
    it("Should perform an borrow/deposit at initializion if percentage is 33%", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const initAmount = ethers.utils.parseEther("33");
      await fundAavePool(amount);
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        3300,
        ethers.utils.parseEther("2")
      );
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(initAmount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        initAmount
      );
      expect(await vault.loanAmount()).to.be.eq(initAmount);
    });
    it("Should perform an borrow/deposit at initializion if percentage is 98%", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const initAmount = ethers.utils.parseEther("98");
      await fundAavePool(amount);
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        9800,
        ethers.utils.parseEther("2")
      );
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(initAmount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        initAmount
      );
      expect(await vault.loanAmount()).to.be.eq(initAmount);
    });
    it("Should perform an borrow/deposit at initializion if percentage is 15% and the decimals are 6", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const initAmount = ethers.utils.parseEther("15");
      await fundAavePool(amount);
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        1500,
        ethers.utils.parseEther("2")
      );
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(initAmount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(
        initAmount
      );
      expect(await vault.loanAmount()).to.be.eq(initAmount);
    });
  });

  describe("Access and config functions", () => {
    it("Should not allow not owner/manager calling borrow", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      await expect(
        vault.connect(pool).borrow(ethers.utils.parseEther("100"))
      ).to.be.revertedWith("CDV005: Only authorized");
    });
    it("Should not allow not owner calling change manager", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      await expect(
        vault.connect(manager).changeManager(pool.address)
      ).to.be.revertedWith("CDV004: Only owner");
    });
    it("Should not allow not ownerr calling borrowWithSig", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      const { v, r, s } = await signPermit(
        debtToken,
        owner,
        ethers.utils.parseEther("100"),
        vault.address
      );
      await expect(
        vault.connect(pool).borrowWithSig(allowanceAmount, 2661766724, v, r, s)
      ).to.be.revertedWith("CDV004: Only owner");
    });
    it("Should successfully change manager", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      expect(await vault.manager()).to.be.eq(manager.address);

      const tx = await vault.changeManager(pool.address);
      await tx.wait();
      expect(await vault.manager()).to.be.eq(pool.address);
    });
    it("Should successfully return borrow allowance", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        ethers.utils.parseEther("2")
      );
      expect(await vault.borrowAllowance()).to.be.eq(allowanceAmount);
    });
    it("Should successfully change interest rate model", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const model = ethers.utils.parseEther("2");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        model
      );
      expect(await vault.model()).to.be.eq(model);
      await vault.setModel(ethers.utils.parseEther("1"));
      expect(await vault.model()).to.be.eq(ethers.utils.parseEther("1"));
    });
    it("Shouldnt allow change interest rate model if not owner", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const model = ethers.utils.parseEther("2");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        model
      );
      await expect(
        vault.connect(manager).setModel(ethers.utils.parseEther("1"))
      ).to.be.revertedWith("CDV004: Only owner");
    });
    it("Should successfully increase borrow allowance", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const newAllowanceAmount = ethers.utils.parseEther("150");
      const model = ethers.utils.parseEther("2");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        model
      );
      expect(await vault.borrowAllowance()).to.be.eq(allowanceAmount);
      const { v, r, s } = await signPermit(
        debtToken,
        owner,
        newAllowanceAmount,
        vault.address
      );
      await vault.updateAllowance(newAllowanceAmount, 2661766724, v, r, s);
      expect(await vault.borrowAllowance()).to.be.eq(newAllowanceAmount);
    });
    it("Should successfully decrease borrow allowance", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const newAllowanceAmount = ethers.utils.parseEther("0");
      const model = ethers.utils.parseEther("2");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        model
      );
      expect(await vault.borrowAllowance()).to.be.eq(allowanceAmount);
      const { v, r, s } = await signPermit(
        debtToken,
        owner,
        newAllowanceAmount,
        vault.address
      );
      await vault.updateAllowance(newAllowanceAmount, 2661766724, v, r, s);
      expect(await vault.borrowAllowance()).to.be.eq(newAllowanceAmount);
    });
    it("Shouldnt allow update borrow allowance if not owner", async () => {
      const [owner, manager, pool] = await ethers.getSigners();
      const allowanceAmount = ethers.utils.parseEther("100");
      const newAllowanceAmount = ethers.utils.parseEther("0");
      const model = ethers.utils.parseEther("2");
      const { vault } = await deployVault(
        manager.address,
        pool.address,
        allowanceAmount,
        owner,
        0,
        model
      );
      expect(await vault.borrowAllowance()).to.be.eq(allowanceAmount);
      const { v, r, s } = await signPermit(
        debtToken,
        manager,
        newAllowanceAmount,
        vault.address
      );
      await expect(
        vault
          .connect(manager)
          .updateAllowance(newAllowanceAmount, 2661766724, v, r, s)
      ).to.be.revertedWith("CDV004: Only owner");
    });
  });

  describe("Borrow", async () => {
    it("Should borrow successfully as a manager", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        0,
        BigNumber.from(2)
      );

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
      const amount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        0,
        BigNumber.from(2)
      );

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
      const amount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        amount,
        owner,
        0,
        BigNumber.from(2)
      );

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
    it("Should borrow successfully if owner calls borrowWithSig", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        ethers.utils.parseEther("0"),
        owner,
        0,
        BigNumber.from(2)
      );
      await fundAavePool(amount);
      const { v, r, s } = await signPermit(
        debtToken,
        owner,
        amount,
        vault.address
      );
      const tx = await vault.borrowWithSig(amount, 2661766724, v, r, s);
      const receipt = await tx.wait();
      const borrowEvent = getFromEvent(receipt, "Borrow");
      expect(borrowEvent[1]).to.be.eq(owner.address);
      expect(borrowEvent[2]).to.be.eq(amount);
      expect(await atomicaPool.balanceOf(owner.address)).to.be.eq(amount);
      expect(await tokenErc20.balanceOf(atomicaPool.address)).to.be.eq(amount);
      expect(await vault.loanAmount()).to.be.eq(amount);
    });
    it("Shouldnt borrow if owner calls borrowWithSig with wrong signature", async () => {
      const [owner, manager] = await ethers.getSigners();
      const amount = ethers.utils.parseEther("100");
      const { vault } = await deployVault(
        manager.address,
        atomicaPool.address,
        ethers.utils.parseEther("0"),
        owner,
        0,
        BigNumber.from(2)
      );
      await fundAavePool(amount);
      const { v, r, s } = await signPermit(
        debtToken,
        owner,
        ethers.utils.parseEther("90"),
        vault.address
      );
      const tx = await expect(
        vault.borrowWithSig(amount, 2661766724, v, r, s)
      ).to.be.revertedWith("ERC20Permit: invalid signature");
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
  debtToken6decimals_factory = await ethers.getContractFactory(
    "DebtToken6DecimalsMock"
  );
  impl = await impl_factory.deploy();
  cdvFactory = await cdvFactory_factory.deploy(impl.address);
  aavePool = await aavePool_factory.deploy();
  tokenErc20 = await tokenErc20_factory.deploy();
  atomicaPool = await atomicaPool_factory.deploy(tokenErc20.address);
  debtToken = await debtToken_factory.deploy(
    tokenErc20.address,
    aavePool.address
  );
  debtToken6decimals = await debtToken_factory.deploy(
    tokenErc20.address,
    aavePool.address
  );
  debtToken6decimals = await debtToken_factory.deploy(
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
  allowanceAmount: BigNumber,
  owner: any,
  percentage: number,
  model: BigNumber,
  sixDecimals?: boolean
) => {
  const { v, r, s } = await predictAndSignPermit(
    cdvFactory,
    sixDecimals ? debtToken6decimals : debtToken,
    owner,
    allowanceAmount
  );
  const tx = await cdvFactory.deployVault(
    manager,
    pool,
    sixDecimals ? debtToken6decimals.address : debtToken.address,
    allowanceAmount,
    2661766724,
    v,
    r,
    s,
    percentage,
    model
  );
  const receipt = await tx.wait();
  const vaultEvent = getFromEvent(receipt, "VaultCreated");
  const vault = await ethers.getContractAt(
    "CreditDelegationVault",
    vaultEvent[0]
  );
  return {
    vault,
    receipt,
  };
};

const fundAavePool = async (amount: BigNumber) => {
  await tokenErc20.transfer(aavePool.address, amount);
};
