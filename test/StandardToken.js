import { EVMThrow, assertEqual } from './utils';

const KarmazaToken = artifacts.require('KarmazaToken');

contract('KarmazaToken', (wallets) => {
  const owner = wallets[0];
  const accountOne = wallets[1];
  const accountTwo = wallets[2];
  const accountThree = wallets[3];

  const DECIMALS = 18;

  const firstAccountAmount = 10 * (10 ** DECIMALS);
  const overflowAmount = 12 * (10 ** DECIMALS);
  const allowAmount = 5 * (10 ** DECIMALS);
  const changeAllowedAmount = 2 * (10 ** DECIMALS);
  const allowableAmount = 4 * (10 ** DECIMALS);
  const unallowableAmount = 8 * (10 ** DECIMALS);

  beforeEach(async function () {
    // given
    this.token = await KarmazaToken.new();

    await this.token.transfer(accountOne, firstAccountAmount, { from: owner });

    await this.token.approve(accountTwo, allowAmount, { from: accountOne });
  });

  describe('Standard token tests', () => {
    it('should set allowable amount of tokens for a spender', async function () {
      // when
      await this.token.approve(accountTwo, changeAllowedAmount, { from: accountOne });

      // then
      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, changeAllowedAmount);
    });

    it('should increase allowed amount of tokens for a spender', async function () {
      // when
      await this.token.increaseApproval(accountTwo, changeAllowedAmount, { from: accountOne });

      // then
      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount + changeAllowedAmount);
    });

    it('should decrease allowed amount of tokens for a spender', async function () {
      // when
      await this.token.decreaseApproval(accountTwo, changeAllowedAmount, { from: accountOne });

      // then
      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount - changeAllowedAmount);
    });

    it('should decrease allowed amount of tokens to 0 for a spender if sender uses too much value while decrease', async function () {
      // when
      await this.token.decreaseApproval(accountTwo, overflowAmount, { from: accountOne });

      // then
      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, 0);
    });

    it('should transfer tokens from one account to another', async function () {
      // when
      await this.token.transferFrom(
        accountOne,
        accountThree,
        allowableAmount,
        { from: accountTwo },
      );

      // then
      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount - allowableAmount);

      const accountThreeBalance = (await this.token.balanceOf(accountThree)).toNumber();
      assertEqual(accountThreeBalance, allowableAmount);

      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount - allowableAmount);
    });

    it('should not transfer tokens from one account to another if token holder does not have enough tokens', async function () {
      // when
      const transferFrom = this.token.transferFrom(
        accountOne,
        accountThree,
        overflowAmount,
        { from: accountTwo },
      );

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);

      const accountThreeBalance = (await this.token.balanceOf(accountThree)).toNumber();
      assertEqual(accountThreeBalance, 0);

      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount);
    });

    it('should not transfer tokens from one account to another if sender does not have enough allowance', async function () {
      // when
      const transferFrom = this.token.transferFrom(
        accountOne,
        accountThree,
        unallowableAmount,
        { from: accountTwo },
      );

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);

      const accountThreeBalance = (await this.token.balanceOf(accountThree)).toNumber();
      assertEqual(accountThreeBalance, 0);

      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount);
    });

    it('should not transfer tokens from one account to another if sender uses 0x0 address as destination account', async function () {
      // when
      const transferFrom =
        this.token.transferFrom(accountOne, 0x0, allowableAmount, { from: accountTwo });

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalance = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(accountOneBalance, firstAccountAmount);

      const accountTwoAllowance = (await this.token.allowance(accountOne, accountTwo)).toNumber();
      assertEqual(accountTwoAllowance, allowAmount);
    });
  });
});
