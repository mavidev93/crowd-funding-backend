 /* Requirements:

-  Anyone can create a new campaign.

-  Multiple campaigns can be created by single owner.

- Each contributor can fund multiple campaigns.

- Each campaign status is open or closed

- Campaign owner can withdraw funds only when required funding goal has been achieved (can withdraw before deadline has passed if funding goal is achieved).


- A Campaign is closed when:
            * deadline has passed (not closed when target goal amount is reached as campaign owner can collect more funds than the initial target) or
            * Campaign owner withdraws funds
            * Any time by the Campaign Owner for any reason.



- Each contributor can only claim refunds:
            * if deadline has passed and the required funding goal has not been achieved or
            *  if the deadline has not passed and the required funding goal has also not been achieved but the campaign has still been closed by the owner

*/