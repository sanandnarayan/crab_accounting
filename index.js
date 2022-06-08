let depositShares = {};
let multiplierPerDS = 1;
let totalUSDC = 0; //USDC.getBalance(this)
let totalDeployedUSDC = [0]; // ??
let totalDepositShares = 0; //DepositSharestoken.totalSupply()

let totalCrab = 0; //crabShares
let crabPerDS = [0]

let vault = {debt: 25, collateral: 50}; // in eth
let ETHUSD = 1;
//const crabValue = ()=> (vault.collateral - vault.debt)*ETHUSD;
const perCrabValue = ()=> ETHUSD; // Abstract out, *** Need reality
let round = 0

const deposit = (user_id, amount) => {
  console.log("user " , user_id, "is adding ", amount);
  if(!depositShares[user_id]) {
    depositShares[user_id] = 0;
  }
  depositShares[user_id] = depositShares[user_id]  + amount/multiplierPerDS;
  totalUSDC += amount;
  totalDepositShares += amount/multiplierPerDS;
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
    console.log("thisroundCrab ",thisRoundCrab)
    totalCrab = totalCrab / (1-thisRoundCrab);
  }
  console.log(" round ",round,"hedge percent", percent ," crab", thisRoundCrab);
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
  
}

const printVars = ()=> {
  console.log(depositShares, Math.round(totalUSDC), totalDepositShares, totalUSDC/totalDepositShares, crabPerDS);
}

let getUserBalance = (user_id) => {
  return depositShares[user_id]*multiplierPerDS;
}


main();