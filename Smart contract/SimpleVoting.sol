// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;
// specifies what version of compiler this code will be compiled with

contract Voting {
  /* the mapping field below is equivalent to an associative array or hash.
  */

  mapping (string => uint256) votesReceived;

  /* Solidity doesn't let you pass in an array of strings in the constructor (yet).
  We will use an array of bytes32 instead to store the list of candidates
  */

  string[] public candidateList;

  /* Store the contract deployer as the owner
  */
  address public owner;

  /* Broadcast event when a user voted
  */
  event VoteReceived(address user, string candidate);

  /* Broadcast event when a new candidate is added
  */
  event CandidateAdded(string candidate);

  /* Modifier to restrict functions to the contract owner (deployer)
  */
  modifier onlyOwner() {
    require(msg.sender == owner, "Only the contract owner can call this function");
    _;
  }

  /* This is the constructor which will be called once and only once - when you
  deploy the contract to the blockchain. When we deploy the contract,
  we will pass an array of candidates who will be contesting in the election
  */
  constructor(string[] memory candidateNames) public {
    owner = msg.sender;
    candidateList = candidateNames;
  }

  // This function returns the total votes a candidate has received so far
  function totalVotesFor(string memory candidate) public view returns (uint256) {
    return votesReceived[candidate];
  }

  // This function increments the vote count for the specified candidate. This
  // is equivalent to casting a vote
  function voteForCandidate(string memory candidate) public {
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
