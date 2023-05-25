import { BigNumber } from "@ethersproject/bignumber";
import { ethers } from "hardhat";
import {
  CreditDelegationVaultFactory,
  DebtTokenMock,
} from "../../typechain-types";

export const signTypedData = async (
  owner: any,
  spender: string,
  value: BigNumber,
  nonce: BigNumber,
  contract: string
): Promise<string> => {
  const domain = {
    name: "DebtToken",
    version: "1",
    verifyingContract: contract,
    chainId: 31337,
  };

  const types = {
    Permit: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
      { name: "deadline", type: "uint256" },
    ],
  };

  const values = {
    owner: owner.address,
    spender,
    value,
    nonce,
    deadline: 2661766724,
  };

  return owner._signTypedData(domain, types, values);
};

export const getSignatureFromTypedData = (signature: string) => {
  return ethers.utils.splitSignature(signature);
};

export const getTransactionCount = (address: string) => {
  return ethers.provider.getTransactionCount(address);
};

export const predictVaultAddress = (from: string, nonce: number) => {
  return ethers.utils.getContractAddress({ from, nonce });
};

export const predictAndSignPermit = async (
  factory: CreditDelegationVaultFactory,
  debtToken: DebtTokenMock,
  owner: any,
  allowanceAmount: BigNumber
) => {
  const contractNonce = await getTransactionCount(factory.address);
  const predictedVaultAddress = predictVaultAddress(
    factory.address,
    contractNonce
  );

  const nonces = await debtToken.nonces(owner.address);
  const signature = await signTypedData(
    owner,
    predictedVaultAddress,
    allowanceAmount,
    nonces,
    debtToken.address
  );

  return getSignatureFromTypedData(signature);
};
