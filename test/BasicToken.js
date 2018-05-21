import { EVMThrow, assertEqual } from './utils';

const KarmazaToken = artifacts.require('KarmazaToken');

contract('KarmazaToken', (wallets) => {
  const owner = wallets[0];
  const accountOne = wallets[1];
  const accountTwo = wallets[2];

  const DECIMALS = 18;
  const TOTAL_SUPPLY = (10 ** 11) * (10 ** DECIMALS);

  const firstAccountAmount = 10 * (10 ** DECIMALS);
  const transferAllowedAmount = 4 * (10 ** DECIMALS);
  const transferUnallowedAmount = 12 * (10 ** DECIMALS);

  beforeEach(async function () {
    // given
    this.token = await KarmazaToken.new();

    await this.token.transfer(accountOne, firstAccountAmount, { from: owner });
  });

  describe('Basic token tests', () => {
    it('should increase account balance after transfer', async function () {
      // then
      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);
    });

    it('should provide correct total supply', async function () {
      // then
      const totalSupply = (await this.token.totalSupply()).toNumber();
      assertEqual(totalSupply, TOTAL_SUPPLY);
    });

    it('should transfer tokens to another account', async function () {
      // when
      await this.token.transfer(accountTwo, transferAllowedAmount, { from: accountOne });

      // then
      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount - transferAllowedAmount);

      const accountTwoBalance = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(accountTwoBalance, transferAllowedAmount);
    });

    it('should not transfer tokens to 0x0 address', async function () {
      // when
      const transfer = this.token.transfer(0x0, transferAllowedAmount, { from: accountOne });

      // then
      await transfer.should.be.rejectedWith(EVMThrow);

      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);
    });

    it('should not transfer tokens if sender does not have enough tokens', async function () {
      // when
      const transfer = this.token.transfer(
        accountTwo,
        transferUnallowedAmount,
        { from: accountOne },
      );

      // then
      await transfer.should.be.rejectedWith(EVMThrow);

      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);

      const accountTwoBalance = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(accountTwoBalance, 0);
    });
  });
});
