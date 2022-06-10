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
      printVars();
      hedge(1);
      printVars();
      deposit(1, 100);
      printVars();
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 100);
      assert.equal(balance.crab, 100);
    });
    it("allows a user to deposit, and know his balance immediately after a hedge round", function () {
      deposit(1, 100);
      hedge(1);
      deposit(2, 100);
      hedge(1);
      deposit(1, 100);
      let balance = getUserBalance(2);
      assert.equal(balance.USDC, 0);
      assert.equal(balance.crab, 100);
      balance = getUserBalance(1);
      assert.equal(balance.USDC, 100);
      assert.equal(balance.crab, 100);
    });
    it("allows a user to deposit, and know his balance after a partial hedge", function () {
      deposit(1, 100);
      hedge(0.5);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 50);
      assert.equal(balance.crab, 50);
    });
    it("redosit and know balance", function () {
      deposit(1, 100);
      hedge(0.5);
      deposit(1, 100);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 150);
      assert.equal(balance.crab, 50);
    });
    it("allows a user to deposit again after a hedge, and know his balance", function () {
      deposit(1, 100);
      hedge(0.5);
      deposit(1, 100);
      hedge(0.5);
      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 75);
      //fix by claiming the 50 he already had
      assert.equal(balance.crab, 125);
    });
    it("deposit, then few full hedges happens and know his balance", function () {
      deposit(1, 100);
      printVars();
      hedge(1);
      printVars();

      deposit(2, 100);
      printVars();
      hedge(1);
      printVars();

      deposit(3, 100);
      printVars();
      hedge(1);
      printVars();

      deposit(1, 10);
      printVars();

      let balance = getUserBalance(1);
      assert.equal(balance.USDC, 10);
      assert.equal(balance.crab, 100);
    });
    it("deposit, and balance long after hedge", function () {
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
