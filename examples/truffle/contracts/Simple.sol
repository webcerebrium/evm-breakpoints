pragma solidity ^0.4.18;

import "./SafeMath.sol";

contract Simple {

  using SafeMath for uint;

  function Simple() public {
  }

  function calculate(uint n) public pure returns (uint) {
		uint number = n;
		uint iterations = 0;
		while (number > 1) {
			if (number.div(2).mul(2) == number) {
				number = number.div(2);
			} else {
				number = number.mul(3).add(1);
			}
			iterations ++;
		}
		return iterations;
  }
}
