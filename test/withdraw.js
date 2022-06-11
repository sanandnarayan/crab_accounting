import {
  deposit,
  getUserBalance,
  hedge,
  reset,
  printVars,
  withdraw,
} from "../index.js";
import assert from "assert";
describe("Algo", function () {
  describe("deposit", function () {
    beforeEach(function () {
      console.log("**** RESET ****");
      reset();
    });
    it("allows a user to withdraw immediately after deposit", function () {
      deposit(1, 100);
      withdraw(1, 100);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 0);
    });
    it("allows a user to partial withdraw immediately after deposit", function () {
      deposit(1, 100);
      withdraw(1, 10);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 90);
      assert.equal(balance.crab, 0);
    });
    it("allows a user to partial withdraw after hedge", function () {
      deposit(1, 100);
      hedge(0.5);
      withdraw(1, 10);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 40);
      assert.equal(balance.crab, 50);
    });
    it("Full hedge correctly hands the withdrawn amount as well", function () {
      deposit(1, 100);
      hedge(0.5);
      withdraw(1, 10);
      hedge(1);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 90);
    });
  });
});
