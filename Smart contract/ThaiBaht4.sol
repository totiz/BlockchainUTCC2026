// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0 and Community Contracts commit b0ddd27
pragma solidity ^0.8.27;

// import {ERC20Freezable} from "@openzeppelin/community-contracts/token/ERC20/extensions/ERC20Freezable.sol";
import "https://raw.githubusercontent.com/OpenZeppelin/openzeppelin-community-contracts/master/contracts/token/ERC20/extensions/ERC20Freezable.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {ERC20Pausable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import {ERC20Permit} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ThaiBaht4 is ERC20, ERC20Burnable, ERC20Pausable, Ownable, ERC20Permit, ERC20Freezable {
    constructor(address initialOwner)
        ERC20("Thai Baht 4", "THB4")
        Ownable(initialOwner)
        ERC20Permit("Thai Baht 4")
    {}

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function mint(address to, uint256 amount) public onlyOwner {
        _mint(to, amount);
    }

    function freeze(address user, uint256 amount) public onlyOwner {
        _setFrozen(user, amount);
    }

    // The following functions are overrides required by Solidity.

    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Freezable)
    {
        super._update(from, to, value);
    }
}
