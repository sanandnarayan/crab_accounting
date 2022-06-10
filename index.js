let depositShares = {};
let lastDepositedRound = {}; // lastDepositedRound of each user
let multiplierPerDS = 1;
let totalDepositShares = 0; //DepositSharestoken.totalSupply()

let totalUSDC = 0; //USDC.getBalance(this)
let totalDeployedUSDC = [0]; // totalDeployedUSD cummulative roundwise to calculate crab per round

let totalCrab = 0; //crabShares
let crabPerDS = [0]; //crabShaeresPerDepositedShare cumulative per round array
let accrued_crab = {}; //per user, when he withdraws

let round = 0; // current round
let full_hedge = [];

const reset = () => {
  depositShares = {};
  multiplierPerDS = 1;
  totalUSDC = 0; //USDC.getBalance(this)
  totalDeployedUSDC = [0]; // totalDeployedUSD cummulative roundwise to calculate crab per round
  totalDepositShares = 0; //DepositSharestoken.totalSupply()
  lastDepositedRound = {}; // lastDepositedRound of each user

  totalCrab = 0; //crabShares
  crabPerDS = [0]; //crabShaeresPerDepositedShare cumulative per round array

  //const crabValue = ()=> (vault.collateral - vault.debt)*ETHUSD;
  round = 0; // current round

  accrued_crab = {}; //per user, when he withdraws
  full_hedge = [];
};

const deposit = (user_id, amount) => {
  //full hedge between last user deposit round, and current round){
  let lastFullHedge = full_hedge[full_hedge.length - 1];
  if (lastFullHedge >= lastDepositedRound[user_id]) {
    let base =
      lastFullHedge === lastDepositedRound[user_id]
        ? lastFullHedge - 1
        : lastDepositedRound[user_id];
    accrued_crab[user_id] =
      depositShares[user_id] * (crabPerDS[lastFullHedge] - crabPerDS[base]);
    // TODO algo for nearest full hedge
    // accrued_crab[user_id] = depositShares[user_id] * (crabPerDS[nearEstFullHedge]-crabPerDS[lastDepositedRound[user_id]]);
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
  thisRoundCrab = amount / (amount + totalDeployedUSDC[round - 1]);

  if (totalCrab === 0) {
    totalCrab = amount;
  } else {
    //totalCrab += amount / perCrabValue();
    totalCrab = totalCrab / (1 - thisRoundCrab);
  }
  let CrabIncrease = totalCrab * thisRoundCrab;
  crabPerDS[round] = crabPerDS[round - 1] + CrabIncrease / totalDepositShares;

  if (percent === 1) {
    multiplierPerDS = 1;
    full_hedge.push(round);
    totalDepositShares = 0;
  } else {
    multiplierPerDS = multiplierPerDS * (1 - percent);
  }

  console.log(
    " round ",
    round,
    "hedge percent",
    percent,
    " ThisRoundCrab",
    thisRoundCrab
  );
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

const USDCperShare = () =>
  totalDepositShares != 0 ? totalUSDC / totalDepositShares : 0;

const printVars = () => {
  console.log(
    depositShares,
    "\ntotalUSDC",
    Math.round(totalUSDC),
    "\ntotalShares",
    totalDepositShares,
    "\nUSDCperShare",
    USDCperShare(),
    "\ncrabPerDS",
    crabPerDS,
    "\nlastUserDepositRound",
    lastDepositedRound,
    "\nfullHedgeRounds",
    full_hedge,
    "\n----------\n"
  );
};

let reduceShares = (user_id, shares) => {
  depositShares[user_id] -= shares;
  if (totalDepositShares > 0) {
    totalDepositShares -= shares;
  }
};

let claimCrabs = (user_id, till_round, percent) => {
  let previousShares = depositShares[user_id];
  reduceShares(user_id, previousShares * percent);
  let last_deposit_from_user = lastDepositedRound[user_id];

  if (till_round === last_deposit_from_user) {
    // set last_deposit_user_round to the previous to the previous round
    last_deposit_from_user -= 1;
  }
  accrued_crab[user_id] =
    previousShares *
    (crabPerDS[till_round] - crabPerDS[last_deposit_from_user]);
};

let getUserBalance = (user_id) => {
  let result = {};
  let last_full_hedge = full_hedge[full_hedge.length - 1] ?? -1;
  let anyFullHedge = full_hedge.length > 0;
  // If there was a full hedge after the user deposited
  // then set the sharesAtFullHedge to fullShares
  if (anyFullHedge && lastDepositedRound[user_id] <= last_full_hedge) {
    claimCrabs(user_id, last_full_hedge, 1);
  }
  result.USDC = depositShares[user_id] * multiplierPerDS;
  result.crab =
    depositShares[user_id] *
      (crabPerDS[crabPerDS.length - 1] -
        crabPerDS[lastDepositedRound[user_id] - 1]) +
    (accrued_crab[user_id] ?? 0);
  console.log("User Balance of ", user_id, " is ", result, "\n");
  return result;
};

export { withdraw, deposit, getUserBalance, hedge, reset, printVars };

// should be User Balance of  1  is  { USDC: 100, crab: 200 }
//  Bug: User 1 should not be able to remove post hedge 1, after user 2 adds 200, before round 4
// his balance should be zero.
// Bug: getBalance(2) is not right as price/DS is incorrect after User deposits 200

// TODO Fix the infinity; using an array
// where you record the zeroing out.

// Think about the case where there are no deposits and hedges for sometime.
// In that the strategy accrues large profits, and the crabShareValue increases.
// Does this affect our code? we currently use USDValueContributed in that round / total USDvalue contributed in line 56
