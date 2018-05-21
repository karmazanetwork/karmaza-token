import { EVMThrow, assertEqual, assertEqualBigNumbers } from './utils';

const KarmazaToken = artifacts.require('KarmazaToken');

contract('KarmazaToken', (wallets) => {
  const owner = wallets[0];
  const otherAccount = wallets[1];

  const DECIMALS = 18;

  const firstAccountAmount = 10 * (10 ** DECIMALS);
  const burnValidAmount = 4 * (10 ** DECIMALS);
  const burnInvalidAmount = 12 * (10 ** DECIMALS);

  beforeEach(async function () {
    // given
    this.token = await KarmazaToken.new();

    await this.token.transfer(otherAccount, firstAccountAmount, { from: owner });

    this.otherAccountBeforeBurnBalance = (await this.token.balanceOf(otherAccount)).toNumber();
    this.totalSupplyBeforeBurn = (await this.token.totalSupply()).toNumber();
  });

  describe('Burnable token tests', () => {
    it('should burn tokens for a sender', async function () {
      // when
      await this.token.burn(burnValidAmount, { from: otherAccount });

      // then
      const otherAccountAfterBurnBalance = await this.token.balanceOf(otherAccount);
      assertEqualBigNumbers(
        otherAccountAfterBurnBalance,
        new web3.BigNumber(this.otherAccountBeforeBurnBalance).sub(burnValidAmount),
      );

      const totalSupplyAfterBurn = await this.token.totalSupply();
      assertEqualBigNumbers(
        totalSupplyAfterBurn,
        new web3.BigNumber(this.totalSupplyBeforeBurn).sub(burnValidAmount),
      );
    });

    it('should not burn tokens if sender does not has enough tokens to be burned', async function () {
      // when
      const burn = this.token.burn(burnInvalidAmount, { from: otherAccount });

      // then
      await burn.should.be.rejectedWith(EVMThrow);

      const otherAccountAfterBurnBalance = (await this.token.balanceOf(otherAccount)).toNumber();
      assertEqual(
        otherAccountAfterBurnBalance,
        this.otherAccountBeforeBurnBalance,
      );

      const totalSupplyAfterBurn = (await this.token.totalSupply()).toNumber();
      assertEqual(
        totalSupplyAfterBurn,
        this.totalSupplyBeforeBurn,
      );
    });
  });
});
