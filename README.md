```
yarn install
yarn test
```

Abbreviation
CummulateCrabPerDepositoryShare

The crux of the algo is

1. The deposit shares represent USD DS \* DSmultiplier
2. Everytime depositor adds or withdraws we store his accumulated crabs in another variable.
   So DS \* (CCDS(Now)-CCDS(lastDepositRound-1)) + accumulatedCrab gives the crab of the user

Note CumulativeCrab/DS (ccds) is the list of cummulative crab value per depository share. ccds[@RoundY] - ccds[@RoundX] gives us the crabs earned by depositing at X and staying till round Y. So if I as a user deposit from W, and then make another deposit at Round X , I should not get the ccds from W to Y for the shares I got in round X . That is why we are accruing till X into a new variable.

3. The specialcase here being fullHedge, as we dont reduce the shares of each depositor at full hedge, we need to account for this when user deposit/withdraws or checks balance as a special case
