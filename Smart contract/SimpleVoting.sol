// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.6.0
pragma solidity ^0.8.27;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";

contract Voting is Pausable, Ownable {
  /* the mapping field below is equivalent to an associative array or hash.
  */
  mapping (string => uint256) votesReceived;

  /* Solidity doesn't let you pass in an array of strings in the constructor (yet).
  We will use an array of bytes32 instead to store the list of candidates
  */
  string[] public candidateList;

  /* Broadcast event when a user voted
  */
  event VoteReceived(address user, string candidate);

  /* Broadcast event when a new candidate is added
  */
  event CandidateAdded(string candidate);

  /* This is the constructor which will be called once and only once - when you
  deploy the contract to the blockchain. When we deploy the contract,
  we will pass an array of candidates who will be contesting in the election
  */
  constructor(string[] memory candidateNames) Ownable(msg.sender) {
    candidateList = candidateNames;
  }

  // Pause/unpause voting (only owner)
  function pause() public onlyOwner {
    _pause();
  }

  function unpause() public onlyOwner {
    _unpause();
  }

  // This function returns the total votes a candidate has received so far
  function totalVotesFor(string memory candidate) public view returns (uint256) {
    return votesReceived[candidate];
  }

  // This function increments the vote count for the specified candidate. This
  // is equivalent to casting a vote
  function voteForCandidate(string memory candidate) public whenNotPaused {
    votesReceived[candidate] += 1;

    // Broadcast voted event
    emit VoteReceived(msg.sender, candidate);
  }

  function candidateCount() public view returns (uint256) {
      return candidateList.length;
  }

  // This function allows the owner (deployer) to add new candidates after deployment
  function addCandidate(string memory candidateName) public onlyOwner {
    candidateList.push(candidateName);
    emit CandidateAdded(candidateName);
  }
}
