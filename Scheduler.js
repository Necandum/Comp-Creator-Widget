var Scheduler = (function () {

    function TimeSlot(scheduledGames, fieldNumber, game, startTime,absoluteCompStartTime) {
        if (!Number.isInteger(fieldNumber) || fieldNumber > (scheduledGames.fields.length + 1)) Break("fieldNumber must be integer and field must exist", { fieldNumber })
        if (!(scheduledGames.index instanceof Map)) Break("scheduledGames must be the _scheduledGames of the relevant Scheduler", { scheduledGames });
        if (!(game instanceof Game)) Break("game must be a Game",{game})
        let field = scheduledGames.fields[fieldNumber];
        

        this.type = e.TIME_SLOT;
        this.name=game.name;
        this.description = `${game.incomingLinks[0].source.name} (${game.incomingLinks[0].sourceRank}) vs ${game.incomingLinks[1].source.name} (${game.incomingLinks[1].sourceRank})`
        defineGetter({ obj: this, name: "prev", func: () => field[this.fieldIndex - 1] });
        defineGetter({ obj: this, name: "next", func: () => field[this.fieldIndex + 1] });
        defineGetter({ obj: this, name: "game", func: () => game });
        defineGetter({ obj: this, name: "fieldIndex", func: () => parseInt(field.indexOf(this))});
        defineGetter({ obj: this, name: "field", func: () => field});
        defineGetter({ obj: this, name: "fieldNumber", func: () => parseInt(fieldNumber) });
        defineGetter({ obj: this, name: "length", func: () => parseInt(game.length)});
        defineGetter({ obj: this, name: "startTime", func: () => parseInt(startTime) });
        defineGetter({ obj: this, name: "absoluteStartTime", func: () => { return parseInt(startTime) + parseInt(absoluteCompStartTime) } });
        defineGetter({ obj: this, name: "endTime", func: () => parseInt(this.startTime + this.length) });

        scheduledGames.index.set(game, this);
        field.set(this,{startTime:this.startTime,endTime:this.endTime});
        field.nextAvailable=this.endTime
        return this;
    }


    function Scheduler(comp, maxFieldNumber, absoluteCompStartTime = Date.now()) {
        this._allPhases = new Map();
        comp.allPhasesArray.forEach(phase => this._allPhases.set(phase, false));

        this._allGames = new Map();
        let shortestGameTime;
        comp.allGamesArray.forEach(game=>{
            this._allGames.set(game,false);
            shortestGameTime =(shortestGameTime===undefined) ? game.length: Math.min(shortestGameTime,game.length)
        });

       defineGetter({obj:this,name:"shortestGameTime",func:()=>parseInt(shortestGameTime)})

        this._unscheduledGames = new Map();
        this._allGames.forEach((readiness, game) => {
            let incomingLinkResults = new Map()
            game.incomingLinks.forEach(link => incomingLinkResults.set(link, link.source instanceof Team));
            this._unscheduledGames.set(game, incomingLinkResults)
        })

        this._readyGames = new Map();

        this._scheduledGames = {
            index: new Map(),
            fields: [],
            insert(game,fieldNumber,time) { return new TimeSlot(this, fieldNumber, game,time, absoluteCompStartTime) },
            closeField(fieldNumber=1,startTime=0,endTime=Number.POSITIVE_INFINITY,description=""){
                let field = this.fields[fieldNumber];
                if(field.length>0) Break("Cannot close a field once scheduling has begun");
                field.set({type:e.FIELD_CLOSURE,description,name:"Field Closed"},{startTime,endTime})
            },
            getNextAvailable() {
                return getAvailability(this.fields);
            },
        };
        for (let fieldNumber = 1; fieldNumber <= maxFieldNumber; fieldNumber++) {
            this._scheduledGames.fields[fieldNumber] = new TimeMap();
            this._scheduledGames.fields[fieldNumber].restrictions = new TimeMap();
            this._scheduledGames.fields[fieldNumber].fieldNumber = fieldNumber;
            this._scheduledGames.fields[fieldNumber].nextAvailable = 0;
        }

        this.assessAllGameReadiness();

    }

    function getAvailability(fields){
        let availability = {fieldNumber:false,time:false,all:[]};
        for(const field of fields){
            if(!field) continue
            availability.all.push({fieldNumber:field.fieldNumber,time:field.nextAvailable})
        }
        availability.all.sort((a,b)=>a.time-b.time);
        availability.fieldNumber = availability.all[0].fieldNumber;
        availability.time = availability.all[0].time;
        return availability;
    }

    Scheduler.prototype = {
        assessGameReadiness(game) {
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });

            this._unscheduledGames.forEach(
                (linkMap, game) => {
                    linkMap.forEach(
                        (readiness, link) => {
                            if (link.source instanceof Phase) linkMap.set(link, this._allPhases.get(link.source))
                            if (link.source instanceof Game) linkMap.set(link, this._allGames.get(link.source))
                        }
                    );
                    this.readyGame(game);
                }
            )
        },
        assessAllGameReadiness() {
            this._unscheduledGames.forEach((linkMap, game) => this.assessGameReadiness(game));
        },

        readyAllGames() {
            this._unscheduledGames.forEach((linkReadiness, game) => this.readyGame(game));
        },

        readyGame(game) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });
            let prepared = true;
            let linkReadinessMap = this._unscheduledGames.get(game);
            linkReadinessMap.forEach((readiness, link) => { if (!readiness) prepared = false });
            if (linkReadinessMap.size === 0) prepared = false;
            if (prepared) {
                this._readyGames.set(game, linkReadinessMap);
                this._unscheduledGames.delete(game);
            }

            return prepared;
        },
        rankReadyGames() {
            let games = Array.from(this._readyGames.keys());
            let periods = [];
            let priorityThenBlockNum = {};
            let minLength;


            for (let game of games) {
                let priorityNum = game.phase.currentSettings.get(e.PRIORITY);
                let blockNum = game.block.blockOrder;
                let length = game.length;
                minLength = (minLength===undefined) ? length : Math.min(length,minLength);

                if (!priorityThenBlockNum[priorityNum]) priorityThenBlockNum[priorityNum] = {};
                if (!priorityThenBlockNum[priorityNum][blockNum]) priorityThenBlockNum[priorityNum][blockNum] = [];
                priorityThenBlockNum[priorityNum][blockNum].push(game)
            }

            for (const priorityNum of Object.keys(priorityThenBlockNum).sort(SortFn.numDescending)) {
                for (const blockNum of Object.keys(priorityThenBlockNum[priorityNum]).sort(SortFn.numAscending)) {
                    periods.push([...priorityThenBlockNum[priorityNum][blockNum]]);
                } 

            }
            return { periods, priorityThenBlockNum,minLength };

        },
        scheduleGame(game, fieldNumber, time) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._readyGames.has(game)) Break("Game must be ready for scheduling", { game, readyGames: this._readyGames });
            let newTimeSlot = this._scheduledGames.insert(game,fieldNumber,time);
            this._allGames.set(game, newTimeSlot.endTime);
            this._readyGames.delete(game);

            let phaseCompleteGameCounter = 0;
            game.phase.allGamesInPhase.forEach((game) => { if (this._allGames.get(game)) phaseCompleteGameCounter++ });
            if (game.phase.allGamesInPhase.length === phaseCompleteGameCounter) this._allPhases.set(game.phase, newTimeSlot.endTime);

            this.assessAllGameReadiness();
            return newTimeSlot;
        },
        scheduleAll() {
            let success = true;

            while (this._unscheduledGames.size > 0 || this._readyGames.size > 0) {
                let periods = this.rankReadyGames().periods;

                if (periods.length === 0) {
                    success = false;
                    break
                }
                let nextAvailable = this._scheduledGames.getNextAvailable();
                this.scheduleGame(periods[0][0], nextAvailable.fieldNumber,nextAvailable.time);
            }
            return success
        },
        getFieldSchedule() {
            let fields = this._scheduledGames.fields;

            let simplifiedFieldSchedule = [];
            for (let i = 1; i < fields.length; i++) {
                simplifiedFieldSchedule[i] = [];
                for (const timeSlot of fields[i]) {
                    simplifiedFieldSchedule[i].push({
                        game: timeSlot.game,
                        name:timeSlot.name,
                        description:timeSlot.description,
                        absoluteStartTime: timeSlot.absoluteStartTime,
                        fieldNumber: timeSlot.fieldNumber
                    })
                }
            }
            return simplifiedFieldSchedule
        },

    }
    Scheduler.prototype.constructor = Scheduler
    Scheduler.TimeSlot = TimeSlot;
    return Scheduler
})()



