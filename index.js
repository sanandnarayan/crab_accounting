let depositShares = {};
let multiplierPerDS = 1;
let totalUSDC = 0; //USDC.getBalance(this)
let totalDeployedUSDC = [0]; // ??
let totalDepositShares = 0; //DepositSharestoken.totalSupply()
let lastDepositedRound = {};

let totalCrab = 0; //crabShares
let crabPerDS = [0]

let vault = {debt: 25, collateral: 50}; // in eth
let ETHUSD = 1;
//const crabValue = ()=> (vault.collateral - vault.debt)*ETHUSD;
const perCrabValue = ()=> ETHUSD; // Abstract out, *** Need reality
let round = 0


let accrued_crab = {};

const deposit = (user_id, amount) => {
  lastDepositedRound[user_id] = round+1;
  console.log("user " , user_id, "is adding ", amount);
  if(!depositShares[user_id]) {
    depositShares[user_id] = 0;
  }

  let added_shares = amount/multiplierPerDS
  depositShares[user_id] = depositShares[user_id]  + added_shares;
  totalUSDC += amount;
  totalDepositShares += added_shares;
}

const withdraw = (user_id, amount) => {
  if(amount > getUserBalance(user_id)['USDC']) return;
  lastDepositedRound[user_id] = round+1;
  console.log("user " , user_id, "is removing ", amount);

  let withdrawn_shares = amount/multiplierPerDS
  depositShares[user_id] = depositShares[user_id]  - amount/multiplierPerDS;
  totalUSDC -= amount;
  totalDepositShares -= withdrawn_shares;

  accrued_crab[user_id] = withdrawn_shares * crabPerDS[round];
  console.log("added to accrued_crab" , accrued_crab[user_id]);
}

const hedge = (percent) => {
  
  let thisRoundCrab = 0;
  round += 1;
  const amount = totalUSDC * percent;
  totalUSDC -= amount;
  totalDeployedUSDC[round] =totalDeployedUSDC[round-1]+ amount;
  
  multiplierPerDS = multiplierPerDS * (1-percent);
  thisRoundCrab = (amount/(amount+totalDeployedUSDC[round-1]))

  if(totalCrab === 0) {
    totalCrab = amount;
  } else {
    //totalCrab += amount / perCrabValue();
    totalCrab = totalCrab / (1-thisRoundCrab);
  }
  console.log(" round ",round,"hedge percent", percent ," ThisRoundCrab", thisRoundCrab);
  let CrabIncrease = totalCrab * thisRoundCrab;
  crabPerDS[round] = crabPerDS[round-1] + (CrabIncrease / totalDepositShares);
}

let main = () => {
  deposit(1, 100);
  printVars();
  
  hedge(0.25);
  printVars();


  hedge(0.3333333);
  printVars();

  withdraw(1, 25);
  printVars();
  
  hedge(0.5);
  printVars();

  deposit(2, 200);
  printVars();

  hedge(0.2);
  printVars();

  hedge(0.2);
  printVars();

  hedge(0.5);
  printVars();

  console.log(getUserBalance(2));
}

const printVars = ()=> {
  console.log(depositShares, Math.round(totalUSDC), totalDepositShares, totalUSDC/totalDepositShares, crabPerDS, lastDepositedRound);
}

let getUserBalance = (user_id) => {
  let result = {};
  result.USDC = depositShares[user_id]*multiplierPerDS;
  result.crab = (depositShares[user_id] * (crabPerDS[crabPerDS.length-1] - crabPerDS[lastDepositedRound[user_id]-1])) + (accrued_crab[user_id]??0) ;
  
  return result;
}


main();

// TODO create the hedge = 1 case, and then solve it using an array
// where you record the zeroing out. 

// Think about the case where there are no deposits and hedges for sometime.
// In that the strategy accrues large profits, and the crabShareValue increases.
// Does this affect our code? we currently use USDValueContributed in that round / total USDvalue contributed in line 56