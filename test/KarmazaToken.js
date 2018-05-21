import { EVMThrow, assertEqual } from './utils';

const KarmazaToken = artifacts.require('KarmazaToken');
const RecipientContract = artifacts.require('RecipientContract');

contract('KarmazaToken', (wallets) => {
  const owner = wallets[0];
  const accountOne = wallets[1];
  const accountTwo = wallets[2];

  const DECIMALS = 18;
  const transferAmount = 10 * (10 ** DECIMALS);
  const allowedAmount = 5 * (10 ** DECIMALS);

  describe('Karmaza token initial state test', () => {
    it('should have correct state', async function () {
      // given
      this.token = await KarmazaToken.new();

      const expectedTokenName = 'KARMAZA';
      const expectedTokenSymbol = 'KMZ';
      const expectedTokenDecimals = 18;
      const expectedTotalSupply = 100 * (10 ** 9) * (10 ** DECIMALS);

      // then
      const tokenName = await this.token.name();
      assertEqual(tokenName, expectedTokenName);

      const tokenSymbol = await this.token.symbol();
      assertEqual(tokenSymbol, expectedTokenSymbol);

      const tokenDecimals = (await this.token.decimals()).toNumber();
      assertEqual(tokenDecimals, expectedTokenDecimals);

      const totalSupplyValue = (await this.token.TOTAL_SUPPLY_VALUE()).toNumber();
      assertEqual(totalSupplyValue, expectedTotalSupply);

      const totalSupply = (await this.token.totalSupply()).toNumber();
      assertEqual(totalSupply, expectedTotalSupply);

      const ownerBalance = (await this.token.balanceOf(owner)).toNumber();
      assertEqual(ownerBalance, expectedTotalSupply);
    });
  });

  describe('Karmaza token tests', () => {
    beforeEach(async function () {
      // given
      this.token = await KarmazaToken.new();

      await this.token.transfer(accountOne, transferAmount, { from: owner });
      await this.token.approve(accountTwo, allowedAmount, { from: accountOne });

      this.accountOneBalanceBefore = (await this.token.balanceOf(accountOne)).toNumber();
      this.accountTwoBalanceBefore = (await this.token.balanceOf(accountTwo)).toNumber();
      this.ownerBalanceBefore = (await this.token.balanceOf(owner)).toNumber();
    });

    it('should transfer tokens', async function () {
      // when
      await this.token.transfer(
        accountTwo,
        allowedAmount,
        { from: accountOne },
      );

      // then
      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore - allowedAmount,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore + allowedAmount,
      );
    });

    it('should transfer tokens from one account to another', async function () {
      // when
      await this.token.transferFrom(
        accountOne,
        accountTwo,
        allowedAmount,
        { from: accountTwo },
      );

      // then
      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore - allowedAmount,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore + allowedAmount,
      );
    });

    it('should reject the request for transfer tokens if the contract is paused', async function () {
      // given
      await this.token.pause({ from: owner });

      // when
      const transfer = this.token.transfer(
        accountTwo,
        allowedAmount,
        { from: accountOne },
      );

      // then
      await transfer.should.be.rejectedWith(EVMThrow);

      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore,
      );
    });

    it('should reject the request for transfer tokens from one account to another if the contract is paused', async function () {
      // given
      await this.token.pause({ from: owner });

      // when
      const transferFrom = this.token.transferFrom(
        accountOne,
        accountTwo,
        allowedAmount,
        { from: accountTwo },
      );

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore,
      );
    });

    it('should reject the request for transfer tokens if sender balance is frozen', async function () {
      // given
      await this.token.freezeAccount(accountOne, { from: owner });

      // when
      const transfer = this.token.transfer(
        accountTwo,
        allowedAmount,
        { from: accountOne },
      );

      // then
      await transfer.should.be.rejectedWith(EVMThrow);

      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore,
      );
    });

    it('should reject the request for transfer tokens from one account to another if sender balance is frozen', async function () {
      // given
      await this.token.freezeAccount(accountTwo, { from: owner });

      // when
      const transferFrom = this.token.transferFrom(
        accountOne,
        accountTwo,
        allowedAmount,
        { from: accountTwo },
      );

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore,
      );
    });

    it('should reject the request for transfer tokens from one account to another if token owner balance is frozen', async function () {
      // given
      await this.token.freezeAccount(accountOne, { from: owner });

      // when
      const transferFrom = this.token.transferFrom(
        accountOne,
        accountTwo,
        allowedAmount,
        { from: accountTwo },
      );

      // then
      await transferFrom.should.be.rejectedWith(EVMThrow);

      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore,
      );
    });

    it('should allow the tokens transfer to contract', async function () {
      // given
      const recipient = await RecipientContract.new();
      await recipient.setForward(accountTwo, { from: owner });
      const recipientAddress = recipient.address;


      // when
      await this.token.approveAndCall(
        recipientAddress,
        allowedAmount,
        0,
        { from: accountOne },
      );

      // then
      const accountOneBalanceAfter = (await this.token.balanceOf(accountOne)).toNumber();
      assertEqual(
        accountOneBalanceAfter,
        this.accountOneBalanceBefore - allowedAmount,
      );

      const accountTwoBalanceAfter = (await this.token.balanceOf(accountTwo)).toNumber();
      assertEqual(
        accountTwoBalanceAfter,
        this.accountTwoBalanceBefore + allowedAmount,
      );
    });
  });
});
