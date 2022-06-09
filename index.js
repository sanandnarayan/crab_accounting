let depositShares = {};
let multiplierPerDS = 1;
let totalUSDC = 0; //USDC.getBalance(this)
let totalDeployedUSDC = [0]; // totalDeployedUSD cummulative roundwise to calculate crab per round
let totalDepositShares = 0; //DepositSharestoken.totalSupply()
let lastDepositedRound = {}; // lastDepositedRound of each user

let totalCrab = 0; //crabShares
let crabPerDS = [0]; //crabShaeresPerDepositedShare cumulative per round array

let vault = { debt: 25, collateral: 50 }; // in eth
let ETHUSD = 1;
//const crabValue = ()=> (vault.collateral - vault.debt)*ETHUSD;
const perCrabValue = () => ETHUSD; // Abstract out, *** Need reality
let round = 0; // current round

let accrued_crab = {}; //per user, when he withdraws
let full_hedge = [];

const deposit = (user_id, amount) => {
  //full hedge between last user deposit round, and current round){
  let lastFullHedge = full_hedge[full_hedge.length - 1];
  if (lastFullHedge >= lastDepositedRound[user_id]) {
    accrued_crab[user_id] = depositShares[user_id] * crabPerDS[round];
    totalDepositShares -= depositShares[user_id];
    depositShares[user_id] = 0;
  }

  lastDepositedRound[user_id] = round + 1;
  console.log("user ", user_id, "is adding ", amount);
  if (!depositShares[user_id]) {
    depositShares[user_id] = 0;
  }

  let added_shares = amount / multiplierPerDS;
  depositShares[user_id] = depositShares[user_id] + added_shares;
  totalUSDC += amount;
  totalDepositShares += added_shares;
};

const withdraw = (user_id, amount) => {
  if (amount > getUserBalance(user_id)["USDC"]) return;
  //lastDepositedRound[user_id] = round + 1;
  console.log("user ", user_id, "is removing ", amount);

  let withdrawn_shares = amount / multiplierPerDS;
  depositShares[user_id] = depositShares[user_id] - amount / multiplierPerDS;
  totalUSDC -= amount;
  totalDepositShares -= withdrawn_shares;

  accrued_crab[user_id] = withdrawn_shares * crabPerDS[round];
  console.log("added to accrued_crab", accrued_crab[user_id]);
};

const hedge = (percent) => {
  let thisRoundCrab = 0;
  round += 1;
  const amount = totalUSDC * percent;
  totalUSDC -= amount;
  totalDeployedUSDC[round] = totalDeployedUSDC[round - 1] + amount;

  if (percent === 1) {
    multiplierPerDS = 1;
    full_hedge.push(round);
  } else {
    multiplierPerDS = multiplierPerDS * (1 - percent);
  }
  thisRoundCrab = amount / (amount + totalDeployedUSDC[round - 1]);

  if (totalCrab === 0) {
    totalCrab = amount;
  } else {
    //totalCrab += amount / perCrabValue();
    totalCrab = totalCrab / (1 - thisRoundCrab);
  }
  console.log(
    " round ",
    round,
    "hedge percent",
    percent,
    " ThisRoundCrab",
    thisRoundCrab
  );
  let CrabIncrease = totalCrab * thisRoundCrab;
  crabPerDS[round] = crabPerDS[round - 1] + CrabIncrease / totalDepositShares;
};

let main = () => {
  /**  deposit(1, 100);
  printVars();

  hedge(0.25);
  printVars();

  hedge(0.3333333);
  printVars();

  withdraw(1, 25);
  printVars();

  hedge(1);
  printVars();

  deposit(2, 200);
  printVars();

  getUserBalance(2);
  getUserBalance(1);

  hedge(0.2);
  printVars();

  hedge(0.2);
  printVars();

  hedge(0.5);
  printVars();
  */

  deposit(1, 100);
  printVars();

  deposit(1, 100);
  printVars();

  hedge(1);
  printVars();

  getUserBalance(1);

  deposit(1, 100);
  printVars();

  getUserBalance(1);
};

const printVars = () => {
  console.log(
    depositShares,
    "totalUSDC",
    Math.round(totalUSDC),
    "totalShares",
    totalDepositShares,
    "USDCperShare",
    totalUSDC / totalDepositShares,
    "crabPerDS",
    crabPerDS,
    "lastUserDepositRound",
    lastDepositedRound,
    "\n----------\n"
  );
};

let getUserBalance = (user_id) => {
  let result = {};
  let sharesAtLastFullHedge = 0; // I am guessing we will need to
  let last_full_hedge = full_hedge[full_hedge.length - 1] ?? -1;
  // TODO look at this buggy logic
  if (full_hedge.length > 0 && lastDepositedRound[user_id] < last_full_hedge) {
    let crabPerDSAtLastFullHedge = crabPerDS[last_full_hedge];
    sharesAtLastFullHedge = depositShares[user_id] / crabPerDSAtLastFullHedge;
  }
  result.USDC =
    (depositShares[user_id] - sharesAtLastFullHedge) * multiplierPerDS;
  result.crab =
    depositShares[user_id] *
      (crabPerDS[crabPerDS.length - 1] -
        crabPerDS[lastDepositedRound[user_id] - 1]) +
    (accrued_crab[user_id] ?? 0);
  console.log("User Balance of ", user_id, " is ", result, "\n");
  return result;
};

main();

// should be User Balance of  1  is  { USDC: 100, crab: 200 }
//  Bug: User 1 should not be able to remove post hedge 1, after user 2 adds 200, before round 4
// his balance should be zero.
// Bug: getBalance(2) is not right as price/DS is incorrect after User deposits 200

// TODO Fix the infinity; using an array
// where you record the zeroing out.

// Think about the case where there are no deposits and hedges for sometime.
// In that the strategy accrues large profits, and the crabShareValue increases.
// Does this affect our code? we currently use USDValueContributed in that round / total USDvalue contributed in line 56
