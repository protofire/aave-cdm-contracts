# Aave Credit Delegation Contracts

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Aave credit delegation is a collection of smart contracts designed to bring peer to pool for aave's credit delegation. This repository contains the source code for the smart contracts, as well as unit tests and deployment scripts.

## Table of Contents

- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

## Getting Started

These instructions will help you set up the project on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/en/download/) (version 12.x or higher)
- [npm](https://www.npmjs.com/get-npm) (included with Node.js)
- [Hardhat](https://hardhat.org/) (version 2.x or higher)
- [Slither](https://github.com/crytic/slither)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/protofire/aave-cdm-contracts.git
```

Change to the project directory:

```bash
cd aave-cdm-contracts
```

Install the dependencies:

```bash
npm install
```

Usage
To compile the smart contracts, run:

```bash
npm run compile
```

Testing
To run the unit tests:

```bash
npm run test
```

Deployment
To deploy the smart contracts to a live network, modify the hardhat.config.ts and .env file with the appropriate settings, then run:

```bash
npm run deploy
```

> **_NOTE:_** The package.json script command for deploy is set to mumbai, please make sure to change the network

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
