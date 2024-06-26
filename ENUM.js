var e = {
        ID:"id",
        FIRST_NAME:"firstName",
        LAST_NAME:"lastName",
        PREFERRED_NAME:"preferredName",
        NAME:"name",
        START_TIME:"startTime",
        PRIORITY:"priority",
        TOTAL_GAME_SECONDS:"totalGameSeconds",
        GAME_STAGES:"gameStages",
        PHASE_TYPE:"phaseType",
        ROUND_ROBIN:"roundRobin",
        TOURNAMENT:"tournament",
        PREDETERMINED:"predetermined",
        GAME:"game",
        PHASE:"phase",
        FIELD_NUMEBER:"fieldNumber",
        SEED:"seed",
        GAME_VALIDITY:"gameValidity",
        FIELD_CLOSURE:"fieldClosure",
        GAME_SLOT:"gameSlot",
        SUPPORT_TEAMS:"supportTeams",
        SUPPORT_SELECTION:"supportSelection",
        PLAYER:"player",
        POTENTIAL_CLASH:"potentialClash",
}


for(let prop in e){
    e[prop]=Symbol(e[prop])
}

Object.freeze(e);