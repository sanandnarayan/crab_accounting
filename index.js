let depositShares = {};
let lastDepositedRound = {}; // lastDepositedRound of each user
let multiplierPerDS = 1;
let totalDepositShares = 0; //DepositSharestoken.totalSupply()

let totalUSDC = 0; //USDC.getBalance(this)

let totalCrab = 0; //crabShares
let crabPerDS = [0]; //crabShaeresPerDepositedShare cumulative per round array
let accrued_crab = {}; //per user, when he withdraws

let round = 0; // current round
let full_hedge = [];

const reset = () => {
  depositShares = {};
  lastDepositedRound = {}; // lastDepositedRound of each user
  multiplierPerDS = 1;
  totalDepositShares = 0; //DepositSharestoken.totalSupply()

  totalUSDC = 0; //USDC.getBalance(this)

  totalCrab = 0; //crabShares
  crabPerDS = [0]; //crabShaeresPerDepositedShare cumulative per round array
  accrued_crab = {}; //per user, when he withdraws

  round = 0; // current round
  full_hedge = [];
};

const greaterOrEquals = (x, array) => {
  // TODO change this to binary implementation
  let i = 0;
  while (i < array.length) {
    if (array[i] >= x) break;
  }
  return array[i];
};

// accrue crab , then add usd + do sharemath
const deposit = (user_id, amount) => {
  console.log("user ", user_id, "is adding ", amount);
  // initialize
  if (!depositShares[user_id]) {
    depositShares[user_id] = 0;
    accrued_crab[user_id] = 0;
  }
  let latestFullHedge = full_hedge[full_hedge.length - 1];
  //-------

  //CRAB Accrue
  //has a full hedge happened after user deposited
  let userLastDeposit = lastDepositedRound[user_id];
  if (latestFullHedge >= userLastDeposit) {
    let base =
      latestFullHedge === userLastDeposit
        ? latestFullHedge - 1
        : userLastDeposit - 1;
    let top = greaterOrEquals(userLastDeposit, full_hedge);
    console.log("top is", top);
    accrued_crab[user_id] +=
      depositShares[user_id] * (crabPerDS[top] - crabPerDS[base]);
    totalDepositShares -= depositShares[user_id];
    depositShares[user_id] = 0;
  }
  // if no full hedge has happend
  // and a partial has hedge happened after users last deposit
  else if (round >= userLastDeposit) {
    // since we will move the userLastDeposit round up
    // we need to accrue the crabs he has accrued till now'
    // to compensate for the reduction in cumulativeAccruedCrabs
    // which will be caused by moving the userLastDeposit up
    accrued_crab[user_id] +=
      depositShares[user_id] *
      (crabPerDS[round] - crabPerDS[userLastDeposit - 1]);
  }

  // Increase user last deposited round
  // add amount to totalUSD
  // increase shares to represent the deposit
  lastDepositedRound[user_id] = round + 1;

  totalUSDC += amount;
  let added_shares = amount / multiplierPerDS;
  totalDepositShares += added_shares;
  depositShares[user_id] = depositShares[user_id] + added_shares;
};

//TODO yet to complete
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

const crabETHVal = () => 1;

const hedge = (percent) => {
  // increases round
  round += 1;

  // reduces amount in USDC
  const amount = totalUSDC * percent;
  totalUSDC -= amount;

  const thisRoundCrabs = amount / crabETHVal();
  // adds equivalent crab
  totalCrab = totalCrab + thisRoundCrabs;
  crabPerDS[round] = crabPerDS[round - 1] + thisRoundCrabs / totalDepositShares;

  if (percent !== 1) {
    // if not a full hedge, reduce share price to reflect new value
    multiplierPerDS = multiplierPerDS * (1 - percent);
  } else {
    // else reset shares to initial state and push the edge case to array
    totalDepositShares = 0;
    multiplierPerDS = 1;
    full_hedge.push(round);
  }

  console.log(
    " round ",
    round,
    "hedge percent",
    percent,
    " ThisRoundCrab",
    thisRoundCrabs
  );
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
    "\naccrued crabs",
    accrued_crab,
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

  // lastest compounded Crab price - the crab price the user paid?
  // crabPerDS is cumulative, so you have to take one round prior
  // for ex: crabPerDS [ 0, 0.5 ] , so user got 100* (0.5-0)
  let userUnClaimedCrab =
    crabPerDS[crabPerDS.length - 1] -
    crabPerDS[lastDepositedRound[user_id] - 1];
  result.crab =
    depositShares[user_id] * userUnClaimedCrab + (accrued_crab[user_id] ?? 0);
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
