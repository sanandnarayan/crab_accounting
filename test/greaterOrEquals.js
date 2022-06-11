import { _greaterOrEquals } from "../index.js";
import assert from "assert";
describe("Algo", function () {
  describe("GreaterOreQuals", function () {
    it("reject empty array", function () {
      let result = _greaterOrEquals(1, []);
      assert.equal(result, null);
    });
    it("find the only element", function () {
      let result = _greaterOrEquals(1, [1]);
      assert.equal(result, 1);
    });
    it("find for equals", function () {
      let result = _greaterOrEquals(3, [1, 3, 10]);
      assert.equal(result, 3);
    });
    it("find greaterThan", function () {
      let result = _greaterOrEquals(2, [1, 3, 10]);
      assert.equal(result, 3);
    });
  });
});
