 var Scheduler = (function () {

    function TimeSlot({ scheduledGames, absoluteCompStartTime, name, description, scheduledItem, fieldNumber, startTime, length, type }) {
        if (!Number.isInteger(fieldNumber) || fieldNumber > (scheduledGames.fields.length + 1)) Break("fieldNumber must be integer and field must exist", { fieldNumber })
        if (!(scheduledGames.index instanceof Map)) Break("scheduledGames must be the _scheduledGames of the relevant Scheduler", { scheduledGames });
        let field = scheduledGames.fields[fieldNumber];
        let supportRoles = new Map();

        defineGetter({ obj: this, name: "prev", func: () => field[this.fieldIndex - 1] });
        defineGetter({ obj: this, name: "next", func: () => field[this.fieldIndex + 1] });
        defineGetter({ obj: this, name: "fieldIndex", func: () => parseInt(field.indexOf(this)) });
        defineGetter({ obj: this, name: "field", func: () => field });
        defineGetter({ obj: this, name: "fieldNumber", func: () => parseInt(fieldNumber) });
        defineGetter({ obj: this, name: "startTime", func: () => parseInt(startTime) });
        defineGetter({ obj: this, name: "absoluteStartTime", func: () => { return parseInt(startTime) + parseInt(absoluteCompStartTime) } });
        defineGetter({ obj: this, name: "absoluteCompStartTime", func: () => { return parseInt(absoluteCompStartTime) } });
        defineGetter({ obj: this, name: "endTime", func: () => this.startTime + this.length });
        defineGetter({ obj: this, name: "length", func: () => length });
        defineGetter({ obj: this, name: "scheduledItem", func: () => scheduledItem });
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "description", func: () => description });
        defineGetter({ obj: this, name: "type", func: () => type });
        defineGetter({ obj: this, name: "supportRoles", func: () => new Map(supportRoles)});

        this.setSupportRole = function(role,team){
            supportRoles.set(role,team);
            // console.log(role,team?.name??"Null")
        }
        this.modifyTimes = function({newStartTime,newEndTime}){
            if(Number.isInteger(newStartTime)) startTime = newStartTime;
            if(Number.isInteger(newEndTime)) endTime = newEndTime;
        }
        scheduledGames.index.set(scheduledItem, this);
        scheduledGames.all.set(this, { startTime: this.startTime, endTime: this.endTime })
        field.set(this, { startTime: this.startTime, endTime: this.endTime });
        scheduledGames.addToDayMap(this);

        return this;
    }

    function Restriction(startField, endField, startTime, endTime, type, name, description) {
        defineGetter({ obj: this, name: "startField", func: () => startField })
        defineGetter({ obj: this, name: "endField", func: () => endField })
        defineGetter({ obj: this, name: "startTime", func: () => startTime })
        defineGetter({ obj: this, name: "endTime", func: () => endTime })
        defineGetter({ obj: this, name: "length", func: () => endTime - startTime })
        defineGetter({ obj: this, name: "type", func: () => type })
        defineGetter({ obj: this, name: "name", func: () => name })
        defineGetter({ obj: this, name: "description", func: () => description })

        return this
    }

    // schedulerOptions{orderByBlock,orderByPriority,fieldLocations:{fieldNumber:[i,j]} }
    //useGamesInstead ~~ array/set of games to be used instead of all the games inside a comp. Useful for various calculations. 
    function Scheduler(comp, maxFieldNumber, absoluteCompStartTime = Date.now(), {restrictions = [],schedulerOptions={},useGamesInsted=false}={}) {
        let me = this;
        comp.scheduler = this;
        this._absoluteCompStartTime = parseInt(absoluteCompStartTime);
        this._comp=comp;
        this._schedulerOptions = schedulerOptions;
        this._allPhases = new Map();
        this._maxFieldNumber = maxFieldNumber;

        this._allGames = new Map();
        this._unscheduledGames = new Set();
        this._shortestGameTime;
        
        let gamesToSchedule = (useGamesInsted)? useGamesInsted: comp.allGamesArray;
        gamesToSchedule.forEach(game => {
            this._allGames.set(game, false);
            this._unscheduledGames.add(game);
            this._shortestGameTime = (this._shortestGameTime === undefined) ? game.length : Math.min(this._shortestGameTime, game.length)
            this._allPhases.set(game.phase,false)
        });

        this._readyGames = new Map();

        this._collisionChecker = {
            _registry: new Map(),
            include(gameScore) { //when a new game is added, check for collisions against all games later than its ready time. 
                let game = gameScore.game;
                let collisionMap = new TimeMap();
                this._registry.set(game, collisionMap);
                let toAdd = me._scheduledGames.all.findOverlap(gameScore.startTime-gameScore.game.length*3).entries; //find other games happening at earliest time this game could be scheduled and a little before
                let lastFoundIndex = toAdd.at(-1)?.index ?? -1;
                let allEntries = me._scheduledGames.all.entries()
                for (let i = lastFoundIndex + 1; i < allEntries.length; i++) { //start from latest overlapping entry +1
                    toAdd.push(allEntries[i]) //add all later entries to testing array
                }
                for (const entry of toAdd) { //entry = TimeMap entry, item = TimeSlot. 
                    if (entry.item.type !== e.GAME_SLOT) continue
                    this.investigateCollision(game, entry.item)
                }
            },
            findCollisions(game,time){
                let collisionMap = this._registry.get(game);
                return collisionMap.findOverlap(time);
            },
            allCollisions(game,sortByStart){
                return this._registry.get(game).entries(sortByStart);
            },
            findFreeGap(game, time) {
                let gap;
                let collisionMap = this._registry.get(game);
                let nextSearchTime = time;
                do {
                    gap = collisionMap.findGap(nextSearchTime)
                }
                while ((function () {
                    if (gap.startTime === false) return false;
                    if (gap.lengthFromSearch > game.length) {
                        return false;
                    } else {
                        nextSearchTime = gap.endTime;
                        return true;
                    }
                })())
                return gap;
            },
            investigateCollision(game, timeSlot) {
                if (game.testForCollision(timeSlot.scheduledItem) || game.ancestralSources.has(timeSlot.scheduledItem)) {
                    let collisionMap = this._registry.get(game)
                    collisionMap.set(timeSlot.scheduledItem, { startTime: timeSlot.startTime, endTime: timeSlot.endTime });
                }
            },
            gameScheduled(timeSlot) {
                this._registry.delete(timeSlot.scheduledItem);
                for (const entry of this._registry) {
                    let game = entry[0];
                    this.investigateCollision(game, timeSlot);
                }
            }
        };

        this._scheduledGames = {
            index: new Map(),
            all: new TimeMap(),
            dayMap: new Map(),
            noGameDays: new Set(),
            addToDayMap:this.addToDayMap.bind(this),
            fields: [],
            insert(game, fieldNumber, time) { return new GameSlot(game, fieldNumber, time) },
            closeField(restriction, fieldNumber) {return new ClosureSlot(restriction, fieldNumber) },
            getNextAvailable() {
                return getAvailability(this.fields);
            },
        };

        for (let fieldNumber = 1; fieldNumber <= maxFieldNumber; fieldNumber++) {
            this._scheduledGames.fields[fieldNumber] = new TimeMap();
            this._scheduledGames.fields[fieldNumber].restrictions = new TimeMap();
            this._scheduledGames.fields[fieldNumber].fieldNumber = fieldNumber;
            this._scheduledGames.fields[fieldNumber].nextAvailable = 0;
            this._scheduledGames.fields[fieldNumber].location = schedulerOptions.fieldLocations?.[fieldNumber] ?? [0,0];
            this._scheduledGames.fields[fieldNumber].distanceTo = function distanceTo(otherFieldNumber){
                let [i1,j1]= this.location;
                let [i2,j2] = me._scheduledGames.fields[otherFieldNumber]?.location ?? [0,0];
                return Math.round(Math.sqrt((i1-i2)**2+(j1-j2)**2));
            }
            for (const restriction of restrictions) {
                if (fieldNumber >= restriction.startField && fieldNumber <= restriction.endField) {
                    if (restriction.type === e.FIELD_CLOSURE) {
                        this._scheduledGames.closeField(restriction, fieldNumber)
                    }
                }
            }
        }

        function GameSlot(game, fieldNumber, startTime) {
            let gameSlot = new TimeSlot({
                scheduledGames: me._scheduledGames,
                absoluteCompStartTime,
                name: game.name,
                description: `${game.incomingLinks[0].source.name} (${game.incomingLinks[0].sourceRank}) vs ${game.incomingLinks[1].source.name} (${game.incomingLinks[1].sourceRank})`,
                scheduledItem: game,
                fieldNumber,
                startTime,
                length: game.length,
                type: e.GAME_SLOT
            })
            gameSlot.field.nextAvailable = gameSlot.endTime;
            return gameSlot;
        }

        function ClosureSlot(restriction, fieldNumber) {
            return new TimeSlot({
                scheduledGames: me._scheduledGames,
                absoluteCompStartTime,
                name: restriction.name,
                description: restriction.description,
                scheduledItem: restriction,
                fieldNumber,
                startTime: restriction.startTime,
                length: restriction.length,
                type: e.FIELD_CLOSURE
            })
        }
    }

    Scheduler.prototype = {
        assessGameReadiness(game) {
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });
            let ready = true;
            let readyTime = 0;

            for (const link of game.incomingLinks) {
                if (link.source instanceof Team) continue;
                if (link.source instanceof Game) {
                    let linkReadyTime = this._allGames.get(link.source)
                    if (linkReadyTime === false) {
                        ready = false;
                        break;
                    }
                    readyTime = Math.max(readyTime, linkReadyTime);
                }
                if (link.source instanceof Phase) {
                    let linkReadyTime = this._allPhases.get(link.source);
                    if (linkReadyTime === false) {
                        ready = false;
                        break;
                    }
                    readyTime = Math.max(readyTime, linkReadyTime);
                }
            }
            if (ready) this.readyGame(game, { game, score: 0, reason: "", startTime: readyTime });
        },
        assessAllGameReadiness() {
            this._unscheduledGames.forEach((game) => this.assessGameReadiness(game));
        },
        readyGame(game, gameScore) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });
            this._readyGames.set(game, gameScore);
            this._unscheduledGames.delete(game);
            this._collisionChecker.include(gameScore);
        },
        rankReadyGames() {
            let gameScores = Array.from(this._readyGames.values());
            let periods = [];
            let priorityThenBlockNum = {};
            let minLength = {};
            let earliestLength = [];

            for (let gameScore of gameScores) {
                let priorityNum =(this._schedulerOptions?.orderByPriority===false)? 0 : gameScore.game.phase.currentSettings.get(e.PRIORITY);
                let blockNum = (this._schedulerOptions?.orderByBlock ===false) ? 0: gameScore.game.block.blockOrder;
                let length = gameScore.game.length;
                minLength[length] = (minLength[length] === undefined) ? gameScore.startTime : Math.min(gameScore.startTime, minLength[length])

                if (!priorityThenBlockNum[priorityNum]) priorityThenBlockNum[priorityNum] = {};
                if (!priorityThenBlockNum[priorityNum][blockNum]) priorityThenBlockNum[priorityNum][blockNum] = [];
                priorityThenBlockNum[priorityNum][blockNum].push(gameScore)
            }

            for (const priorityNum of Object.keys(priorityThenBlockNum).sort(SortFn.numDescending)) {
                for (const blockNum of Object.keys(priorityThenBlockNum[priorityNum]).sort(SortFn.numAscending)) {
                    let periodArray = priorityThenBlockNum[priorityNum][blockNum];
                    periods.push(new Set(periodArray));
                }
            }

            for (const length of Object.keys(minLength).sort(SortFn.numAscending)) {
                earliestLength.push({ length: parseInt(length), readyTime: minLength[length] })
            }
            return { periods, priorityThenBlockNum, earliestLength };

        },
        scheduleGame(game, fieldNumber, time) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._readyGames.has(game)) Break("Game must be ready for scheduling", { game, readyGames: this._readyGames });
            let newTimeSlot = this._scheduledGames.insert(game, fieldNumber, time);
            this._allGames.set(game, newTimeSlot.endTime);
            this._readyGames.delete(game);
            this._collisionChecker.gameScheduled(newTimeSlot);
            let phaseComplete = true;
            for (const phaseGame of game.phase.allGamesInPhase) {
                if (this._allGames.get(phaseGame) === false) phaseComplete = false;
                break;
            }
            if (phaseComplete) this._allPhases.set(game.phase, newTimeSlot.endTime);

            this.assessAllGameReadiness();
            return newTimeSlot;
        },
        addToDayMap(timeSlot){
            let dayBoundaries=getUTCDayBoundary(timeSlot.absoluteStartTime);
            let timeSlotAbsoluteEndTime = timeSlot.absoluteStartTime + timeSlot.length;
            let timeSlotDayStart = dayBoundaries.dayStart;
            let timeSlotDayEnd = dayBoundaries.dayEnd;
            for(let i=0;(i*d.DAY_MS+timeSlotDayStart)<timeSlotAbsoluteEndTime;i++){
                    let dayStart = i*d.DAY_MS+timeSlotDayStart
                    if(!this._scheduledGames.dayMap.has(dayStart)){
                        this._scheduledGames.dayMap.set(dayStart,new Set());
                        this._scheduledGames.noGameDays.add(dayStart);
                    }
                    let withinDaySet = this._scheduledGames.dayMap.get(dayStart);
                    withinDaySet.add(timeSlot);
                    if(timeSlot.type===e.GAME_SLOT) this._scheduledGames.noGameDays.delete(dayStart);
                }

        },
        tidyScheduledGames(){
            for(let dayStart of this._scheduledGames.noGameDays){
                let dayEnd = dayStart + d.DAY_MS;
                let withinDaySet = this._scheduledGames.dayMap.get(dayStart);
                    for(let timeSlot of withinDaySet){
                        if(timeSlot.endTime<dayEnd){
                            this._scheduledGames.index.delete(timeSlot.scheduledItem)
                            timeSlot.field.delete(timeSlot);

                        } else {
                            if(timeSlot.startTime<dayEnd){
                            timeSlot.modifyTimes({newStartTime:dayEnd});
                            timeSlot.field.set(timeSlot,{timeSlot});
                        }
                        }
                    }
                    this._scheduledGames.dayMap.delete(dayStart);

            }
        },
        scheduleAll() {
            comp.refreshTerminalDistance();
            console.time("Scheduling")
            let success = true;
            this.assessAllGameReadiness();
            let count=0
            while (this._unscheduledGames.size > 0 || this._readyGames.size > 0) {
                let rankingObject = this.rankReadyGames();
                count++
                if (rankingObject.periods.length === 0) {
                    success = false;
                    break
                }
                let nextAvailable = this._scheduledGames.getNextAvailable();
                if (nextAvailable === false) {
                    success = false;
                    break
                }

                let choiceArray = [];//choice = {game: ,startTime: fieldNumber: }
                for (const field of nextAvailable.all) {
                    let scoringObject = this.serialScoring({ field, scoreFuncArray: [findNextValid,scrChildren,scrLargestTerminal,scrRecency,scrSameField], rankingObject });
                    if (scoringObject.choice.game) choiceArray.push(scoringObject.choice);
                   
                   
                    let displayArray =[scoringObject.choice.startTime/1000]
                    for(const gameScore of scoringObject.gameScoresByPeriod[0]){
                        displayArray.push(`${gameScore.game.name}: ${gameScore.score}`)
                        
                    }
                }
                let minStartTime = Math.min(...choiceArray.map(x=>x.startTime));
                choiceArray = choiceArray.filter(x=>x.startTime===minStartTime);
                choiceArray.sort((a,b)=>b.score-a.score)
                if (choiceArray.length === 0) {
                    success = false;
                    break
                }
                // schedule earliest game
                this.scheduleGame(choiceArray[0].game, choiceArray[0].fieldNumber, choiceArray[0].startTime);
            }
            console.timeEnd("Scheduling")
            this.tidyScheduledGames();
            return success
        },
        serialScoring({ field, scoreFuncArray, rankingObject }) {
            let scoringObject = {
                gameScoresByPeriod: [], invalidGames: [],
                earliestLength: rankingObject.earliestLength,
                choice: { game: false, startTime: false, fieldNumber: false }
            }
            if (rankingObject.periods.length === 0) return scoringObject;
            for (const periodSet of rankingObject.periods) { //deep copy periods so can be seperately used by each field
                let newSet = new Set();
                newSet.gameLengths = new Set(periodSet.gameLengths);
                for (const gameScore of periodSet) {
                    let newGameScore = { ...gameScore };
                    newSet.add(newGameScore);
                }
                scoringObject.gameScoresByPeriod.push(newSet);
            }

            for (const scoreFunc of scoreFuncArray) {
                scoringObject = scoreFunc(scoringObject, this, field);
            }

            if (scoringObject.gameScoresByPeriod.length > 0) {
                scoringObject.choice = Array.from(scoringObject.gameScoresByPeriod[0]).sort((a, b) => b.score- a.score)[0]
            }
            // console.log(Array.from(scoringObject.gameScoresByPeriod[0]).map(x=>`${x.game.name}: ${x.score}`))
            scoringObject.choice.fieldNumber = field.fieldNumber;
            return scoringObject;
        },
        getFieldSchedule() {
            let fields = this._scheduledGames.fields;

            let simplifiedFieldSchedule = [];
            simplifiedFieldSchedule.index=new Map();
            for (let i = 1; i < fields.length; i++) {
                simplifiedFieldSchedule[i] = [];
                for (const timeSlot of fields[i]) {
                    simplifiedFieldSchedule[i].push(timeSlot)
                    simplifiedFieldSchedule.index.set(timeSlot.scheduledItem,timeSlot)
                }
            }
            simplifiedFieldSchedule.phaseEndTimes = new Map(this._allPhases);
            simplifiedFieldSchedule.dayMap = this._scheduledGames.dayMap;
            CodeObserver.Creation({mark:UIManager.ScheduleSettings,newObject:simplifiedFieldSchedule});
            return simplifiedFieldSchedule
        },

    }
    Scheduler.prototype.constructor = Scheduler
    Scheduler.TimeSlot = TimeSlot;
    Scheduler.Restriction = Restriction;

    function getAvailability(fields) {
        let availability = { fieldNumber: false, time: false, field: false, all: [] };
        for (const field of fields) {
            if (!field) continue;
            if (field.nextAvailable === false || field.nextAvailable === Number.POSITIVE_INFINITY) continue;
            availability.all.push(field)
        }
        if (availability.all.length === 0) return false;

        availability.all.sort((a, b) => a.nextAvailable - b.nextAvailable);
        availability.field = availability.all[0]
        availability.fieldNumber = availability.field.fieldNumber;
        availability.time = availability.field.nextAvailable;
        return availability;
    }
    function findNextValid(scoringObject, scheduler, field) {
        let gap = field.findGap(field.nextAvailable);
        let currentStartTime = Math.max(gap.startTime, field.nextAvailable);
        let currentGapLength = gap.endTime - currentStartTime;
        let validGameScores = new Set();
        gapSearch: while (gap.startTime !== false) {
            
            timeEvaluation: {
                if (gap.length < scheduler._shortestGameTime) {
                    let newRestriction = new Scheduler.Restriction(field.fieldNumber, field.fieldNumber, gap.startTime, gap.endTime, e.FIELD_CLOSURE, "Closed by Computer", "Not enough of a gap for any game in competition")
                    scheduler._scheduledGames.closeField(newRestriction, field.fieldNumber)
                    field.nextAvailable = TimeMap.sortByEnd(gap.nextEntries).at(-1).endTime;
                    if (field.nextAvailable === Number.POSITIVE_INFINITY) { //If field closed, reject all potential games. Field will not assessed for use again. 
                        failAll("Field no longer has capacity");
                        return scoringObject
                    }
                    break timeEvaluation;
                }

                let fit = false; //does *anything* fit in current gap? and would it be ready to go?
                for (const earliest of scoringObject.earliestLength) {
                    if (earliest.length <= currentGapLength && (gap.endTime - earliest.length) >= earliest.readyTime) {
                        fit = true;
                        break;
                    }
                }
                if (!fit) break timeEvaluation; //if not, find next gap;


                let earliestBatchValidTime = Number.POSITIVE_INFINITY;
                for (const periodSet of scoringObject.gameScoresByPeriod) { //if yes, find if any games that fit also do not clash. 
                    for (const gameScore of periodSet) {
                        let game = gameScore.game;
                        let gameLength = game.length;
                        if (gameLength <= currentGapLength && (gap.endTime - gameLength) >= gameScore.startTime) { //does game fit and could be ready to go in this gap
                            let firstClashFreeGap = scheduler._collisionChecker.findFreeGap(game, currentStartTime);
                            if (firstClashFreeGap.startTime > (gap.endTime - gameLength)) break; //clash free gap does not overlap enough with current gap for game length
                            if ((firstClashFreeGap.endTime - gameLength) < currentStartTime || (firstClashFreeGap.endTime - gameLength) < gameScore.startTime) break; //clash free gap ends to close to currentStartTime or game valid time 
                            //game must fit in current gap 
                            let earliestVaildTime = Math.max(currentStartTime, gameScore.startTime, firstClashFreeGap.startTime);
                            gameScore.startTime = earliestVaildTime;

                            if (earliestVaildTime < earliestBatchValidTime) {
                                earliestBatchValidTime = earliestVaildTime;
                                validGameScores = new Set();
                            }
                            if (earliestVaildTime === earliestBatchValidTime) {
                                validGameScores.add(gameScore);
                            }
                        }
                        
                    }
                    if(validGameScores.size>0) {
                        break gapSearch; //if found any good gomes, stop search
                    }
                }
            }
                gap = field.findGap(gap.endTime);
                currentStartTime = Math.max(gap.startTime, field.nextAvailable);
                currentGapLength = gap.endTime - currentStartTime;
            
        }

        if (validGameScores.size === 0) {
            failAll("No valid games for field could be found");
        }

        for (let i = 0; i < scoringObject.gameScoresByPeriod.length; i++) {
            let period = scoringObject.gameScoresByPeriod[i];
            for (const gameScore of period) {
                if (validGameScores.has(gameScore)) {
                    continue;
                } else {
                    gameScore.score = false;
                    gameScore.reason = `Game could not fit in current gap`;
                    scoringObject.invalidGames.push(gameScore);
                    period.delete(gameScore);
                    if (period.size === 0) {
                        scoringObject.gameScoresByPeriod.splice(i, 1);
                        i--
                    }
                }
            }
        }

        return scoringObject


                function failAll(message) {
                    for (const periodSet of scoringObject.gameScoresByPeriod) {
                        for (const gameScore of periodSet) {
                            gameScore.score = false;
                            gameScore.reason = message
                            scoringObject.invalidGames.push(gameScore);
                        }
                    }
                    scoringObject.gameScoresByPeriod.length = 0;
                }
    }
    function scrChildren(scoringObject,scheduler,field){
        
        for(const gameScore of scoringObject.gameScoresByPeriod[0]){
            gameScore.score+=scheduler._comp.getChildCount(gameScore.game);
            if(gameScore.game.outgoingLinks.length===2 && (gameScore.game.outgoingLinks[0].target !== gameScore.game.outgoingLinks[1].target)) gameScore.score*=1.1;
        }
    return scoringObject
    }
    function scrLargestTerminal(scoringObject,scheduler,field){
        for(const gameScore of scoringObject.gameScoresByPeriod[0]){
            gameScore.score+=scheduler._comp.getLargestTerminal(gameScore.game);
        }
        return scoringObject;
    }
    function scrRecency (scoringObject,scheduler,field){

        let recencyArray = [
            {gameLengthMultiple:0.5,pointCost:1000},
            {gameLengthMultiple:1,pointCost:500},
            {gameLengthMultiple:2,pointCost:1},
            {gameLengthMultiple:3,pointCost:-20},
            {gameLengthMultiple:Number.POSITIVE_INFINITY,pointCost:-5}
        ]
        for(const gameScore of scoringObject.gameScoresByPeriod[0]){
            // for(const inLink of gameScore.game.incomingLinks){ //if direct parent end less than half a game time previously, maximum penalty
            //     if(inLink.source instanceof Team) continue;
            //     if((gameScore.startTime - scheduler._scheduledGames.index.get(inLink.source).endTime) < recencyArray[0].gameLengthMultiple*gameScore.game.length){ 
            //         gameScore.score-=recencyArray[0].pointCost;
            //     }
            // }
                let collidingGameEntries =  scheduler._collisionChecker.allCollisions(gameScore.game,true);
                for(const collidingGameEntry of collidingGameEntries){
                    let timeDifference = (gameScore.startTime - collidingGameEntry.endTime)/gameScore.game.length;
                        for(const penalty of recencyArray){
                            if(timeDifference<penalty.gameLengthMultiple){
                                gameScore.score-=penalty.pointCost;
                                break;
                            }
                        }
                }
            }
    return scoringObject
    }
    function scrSameField(scoringObject,scheduler,field){
        
        for(const gameScore of scoringObject.gameScoresByPeriod[0]){
            let collidingGameEntries = scheduler._collisionChecker.allCollisions(gameScore.game,true);
            collidingGameEntries.sort((a,b)=>b.endTime-a.endTime)
            let count = 4;
            for(const collidingGameEntry of collidingGameEntries){
                if(count===0) break;
                count--;
                const collidingGame = collidingGameEntry.item;
                const collidingGameFieldNumber = scheduler._scheduledGames.index.get(collidingGame).fieldNumber;
                const timeMultiplier = (gameScore.startTime - collidingGameEntry.endTime)/gameScore.game.length+1;
                const travelTime = field.distanceTo(collidingGameFieldNumber)/1000
                let posScore = 20/(timeMultiplier**2);
                posScore = Math.trunc(posScore*10)/10
                let  negScore =-1*Math.floor(travelTime/30)
                negScore = Math.trunc(negScore*10)/10
                gameScore.score += (collidingGameFieldNumber===field.fieldNumber) ? posScore:negScore;
           }
        }
        return scoringObject;
    }

    return Scheduler
})()



