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
        MODE:"mode",
        CREATE:"create",
        EDIT:"edit",
        CONTROLLED_OBJECT:"controlledObject",
        CONTROLLED_OBJECT_CONSTRUCTOR:"controlledObjectConstructor",
        VERIFICATION:"verificationFunctions",
        VERIFICATION_FAILED:"verificationFailed",
        HARVEST_FUNCTIONS:"harvestFunctions",
        HARVEST:"harvest",
        RETRIEVE:"retrieve",
        HARVESTED_DATA:"harvestedData",
        DISPLAY_ALL:"displayAll",
        DISPLAY_NOT_PLAYERS:"displayNotPlayers",
        STACK:"stack",
        CURRENTLY_OPEN:"currentlyOpen",
        CONTENTS:"contents",
        FIELD_NAME:"fieldName",
        SECTION_PARAMETERNS:"sectionParameters",
        MASTER:"maste",
        LEFT_SLAVE:"leftSlave",
        RIGHT_SLAVE:"rightSlave",
        IDENTITY:"identity",
        DEFAULT:"default",
        MULTY_SELECT_START:"multySelectStart",
        ASSOCIATED_FORMS:"associatedFroms",
        NAVIGATOR:"navigator",
        PARENT_OBJECT:"parentObject",
        POP_UP:"popUp",
        OBJECT_HANDLING:"objectHandlingFunctions",
        OBJECT_FIELD:"objectField",
        INPUT_CONTAINER_LIST:"inputContainerList",
        
        

};

(function () {
    let descriptionSet = new Set();
    let symbolSet = new Set();

    for(let prop in e){
        descriptionSet.add(e[prop]);
        e[prop]=Symbol(e[prop])
        symbolSet.add(e[prop]);
    }

    e.has = (isEnum)=>(descriptionSet.has(isEnum) || symbolSet.has(isEnum));
})();



Object.freeze(e);
