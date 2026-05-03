Write a smart contract call WorkshopSolver.sol to solve the student workshop.
Which I want student to deploy Stablecoin (USDT) with Mintable, Pauseable and Freezable which you can check the implemntation in ThaiBaht4.sol file.

This solver contract should verify that user has deployed the smart contract succesfully by verifying below.

Expected values:
- token name: Wakanda
- token symbol: WAKA
- Owner should hold at least 1,000,000 tokens
- Address 0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045 should hold at least 10,000 tokens
- Address 0x3327873dc0474C3b8b784FDf89719bdC6d39eaFa should hold at least 50,000 tokens but not more than 100,000 tokens

The public view function we should have
Allow user to input their deployed token address and respond with text describe all execpted values step by step and tell user exactly what is correct / incorrect for each bullet.

Write function that allow user to submit their token address and verify all expected values and records on the smart contract as passed.