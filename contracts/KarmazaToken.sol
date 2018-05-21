pragma solidity ^0.4.23;

import "zeppelin-solidity/contracts/token/ERC20/StandardToken.sol";
import "zeppelin-solidity/contracts/token/ERC20/BurnableToken.sol";
import "zeppelin-solidity/contracts/lifecycle/Pausable.sol";

import "./FreezableToken.sol";


interface tokenRecipient {
    function receiveApproval(
        address _from,
        uint256 _value,
        address _token,
        bytes _extraData)
    external;
}


contract KarmazaToken is StandardToken, BurnableToken, FreezableToken, Pausable {
    string public constant name = "KARMAZA";
    string public constant symbol = "KMZ";
    uint8 public constant decimals = 18;

    uint256 public constant TOTAL_SUPPLY_VALUE = 100 * (10 ** 9) * (10 ** uint256(decimals));

    /**
    * @dev Create KarmazaToken contract.
    */
    constructor() public {
        totalSupply_ = TOTAL_SUPPLY_VALUE;

        balances[msg.sender] = TOTAL_SUPPLY_VALUE;
        emit Transfer(address(0), msg.sender, TOTAL_SUPPLY_VALUE);
    }

    /**
    * @dev Transfer token for a specified address with pause and freeze features for owner.
    * @dev Only applies when the transfer is allowed by the owner.
    * @param _to The address to transfer to.
    * @param _value The amount to be transferred.
    */
    function transfer(address _to, uint256 _value) public whenNotPaused returns (bool) {
        require(!isFrozen(msg.sender));
        return super.transfer(_to, _value);
    }

    /**
    * @dev Transfer tokens from one address to another with pause and freeze features for owner.
    * @dev Only applies when the transfer is allowed by the owner.
    * @param _from address The address which you want to send tokens from
    * @param _to address The address which you want to transfer to
    * @param _value uint256 the amount of tokens to be transferred
    */
    function transferFrom(address _from, address _to, uint256 _value) public whenNotPaused returns (bool) {
        require(!isFrozen(msg.sender));
        require(!isFrozen(_from));
        return super.transferFrom(_from, _to, _value);
    }

    /**
    * Set allowance for other address and notify
    *
    * Allows `_spender` to spend no more than `_value` tokens on your behalf, and then ping the contract about it
    *
    * @param _spender The address authorized to spend
    * @param _value the max amount they can spend
    * @param _extraData some extra information to send to the approved contract
    */
    function approveAndCall(address _spender, uint256 _value, bytes _extraData) public returns (bool success) {
        tokenRecipient spender = tokenRecipient(_spender);
        if (approve(_spender, _value)) {
            spender.receiveApproval(
                msg.sender,
                _value, this,
                _extraData);
            return true;
        }
    }
}
