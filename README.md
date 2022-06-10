```
yarn install
yarn test
```

so I need to claim the crabs, when a user deposits after a hedge (partial of ful) has happend.
why because at that stage , the deposited shares then represent the crabs also which is not true as the hedge has not happened.
but that is why we have the round numbers right? But as we dont know what was the deposit shares before the deposit we need to do the claim

### TODO

1. cleanup the deposit function, furthur if possible
2. binary search for greaterThanEquals
3. test withdraws
4. make getBalance into a view function.
5. reuse the claimcrabs logic
