pragma solidity ^0.4.15;

contract Escrow {

  address owner;

  function Escrow() payable {
	owner = msg.sender;    
  }

}
