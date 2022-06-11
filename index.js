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
  if (array.length == 0) return;
  let low = 0;
  let high = array.length;
  let mid;
  while (1) {
    mid = Math.floor((low + high) / 2);
    if (mid < 1) {
      // single element
      break;
    }
    if (array[mid - 1] < x && array[mid] >= x) break;
    if (array[mid] < x) {
      low = mid;
    } else {
      high = mid;
    }
  }
  return array[mid];
};

const _accrue_crab = (user_id) => {
  let latestFullHedge = full_hedge[full_hedge.length - 1];
  //CRAB Accrue
  //has a full hedge happened after user deposited
  let userLastDeposit = lastDepositedRound[user_id];
  let top = round;
  if (latestFullHedge >= userLastDeposit) {
    let top = greaterOrEquals(userLastDeposit, full_hedge);
    accrued_crab[user_id] +=
      depositShares[user_id] *
      (crabPerDS[top] - crabPerDS[userLastDeposit - 1]);
    _reduceShares(user_id, depositShares[user_id]);
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
      (crabPerDS[top] - crabPerDS[userLastDeposit - 1]);
    // the multiplier has already been updated while heding,
    // so no need to reduce shares
  }
};

// accrue crab , then add usd + do sharemath
const deposit = (user_id, amount) => {
  console.log("user ", user_id, "is adding ", amount);
  // initialize
  if (!depositShares[user_id]) {
    depositShares[user_id] = 0;
    accrued_crab[user_id] = 0;
  }
  //-------
  _accrue_crab(user_id);
  // Increase user last deposited round
  lastDepositedRound[user_id] = round + 1;

  // add amount to totalUSD
  totalUSDC += amount;
  // increase shares to represent the deposit
  _addShares(user_id, amount / multiplierPerDS);
};

const withdraw = (user_id, amount) => {
  //unsigned int will take care
  //if (amount > getUserBalance(user_id)["USDC"]) return;
  //lastDepositedRound[user_id] = round + 1;
  console.log("user ", user_id, "is removing ", amount);

  _accrue_crab(user_id);
  // Increase user last deposited round
  lastDepositedRound[user_id] = round + 1;
  console.log("added to accrued_crab", accrued_crab[user_id]);

  // reduce amount to totalUSD
  totalUSDC -= amount;
  // reduce shares to represent the withdrawal
  _reduceShares(user_id, amount / multiplierPerDS);
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
    "\n total deposit shares ",
    totalDepositShares,
    "\n----------\n"
  );
};

let _reduceShares = (user_id, shares) => {
  depositShares[user_id] -= shares;
  if (totalDepositShares > 0) {
    totalDepositShares -= shares;
  }
};

let _addShares = (user_id, shares) => {
  depositShares[user_id] += shares;
  totalDepositShares += shares;
};

let getAccruedCrabs = (user_id, till_round) => {
  let last_deposit_from_user = lastDepositedRound[user_id];
  return (
    accrued_crab[user_id] +
    depositShares[user_id] *
      (crabPerDS[till_round] - crabPerDS[last_deposit_from_user - 1])
  );
};

let getUserBalance = (user_id) => {
  let result = {};
  let last_full_hedge = full_hedge[full_hedge.length - 1] ?? -1;
  let anyFullHedge = full_hedge.length > 0;
  // If there was a full hedge after the user deposited
  // then set the sharesAtFullHedge to fullShares
  if (anyFullHedge && last_full_hedge >= lastDepositedRound[user_id]) {
    // get the first full hedge after users last deposit
    let top = greaterOrEquals(lastDepositedRound[user_id], full_hedge);
    let users_accrued_crab = getAccruedCrabs(user_id, top);

    // ?? will we need the unclaimed crab?
    // I dont think so, because if the user deposited after a full hedge
    // we wont go into this case. and thats why USDC is 0, because there
    // was no user deposit after a full hedge!
    result.USDC = 0;
    result.crab = users_accrued_crab;
    console.log("User Balance of ", user_id, " is ", result, "\n");
    return result;

    // get the accrued crab and the new deposit shares without a write
  } else {
    result.USDC = depositShares[user_id] * multiplierPerDS;

    // lastest compounded Crab price - the crab price the user paid?
    // crabPerDS is cumulative, so you have to take one round prior
    // for ex: crabPerDS [ 0, 0.5 ] , so user got 100* (0.5-0)
    let userUnClaimedCrab =
      crabPerDS[crabPerDS.length - 1] -
      crabPerDS[lastDepositedRound[user_id] - 1];
    result.crab =
      depositShares[user_id] * userUnClaimedCrab + accrued_crab[user_id];
    console.log("User Balance of ", user_id, " is ", result, "\n");
    return result;
  }
};

export { withdraw, deposit, getUserBalance, hedge, reset, printVars };

// Think about the case where there are no deposits and hedges for sometime.
// In that the strategy accrues large profits, and the crabShareValue increases.
// Does this affect our code? we currently use USDValueContributed in that round / total USDvalue contributed in line 56
