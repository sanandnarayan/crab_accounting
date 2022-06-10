import { deposit, getUserBalance, hedge, reset, printVars } from "../index.js";
import assert from "assert";
describe("Algo", function () {
  describe("deposit", function () {
    beforeEach(function () {
      console.log("**** RESET ****");
      reset();
    });
    it("allows a user to deposit, and know his balance", function () {
      deposit(1, 100);
      deposit(1, 100);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 200);
      assert.equal(balance.crab, 0);
    });
    it("allows a user to deposit, and know his balance after a hedge round", function () {
      deposit(1, 100);
      hedge(1);
      deposit(1, 100);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 100);
      assert.equal(balance.crab, 100);
    });
    it("allows a user to deposit, and know his balance immediately after a hedge round", function () {
      deposit(1, 100);
      printVars();
      hedge(1);
      printVars();
      deposit(2, 100);
      printVars();
      hedge(1);
      printVars();
      deposit(1, 100);
      printVars();
      let balance = getUserBalance(2);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 100);
      balance = getUserBalance(1);
      assert.equal(balance.USDC, 100);
      assert.equal(balance.crab, 100);
    });
    xit("deposit, and balance long after hedge", function () {
      deposit(1, 100);
      printVars();

      hedge(1);
      printVars();

      deposit(2, 100);
      printVars();

      hedge(1);
      printVars();

      deposit(2, 100);
      printVars();

      hedge(1);
      printVars();
      let balance = getUserBalance(2);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 200);

      balance = getUserBalance(1);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 100);
    });
  });
});
