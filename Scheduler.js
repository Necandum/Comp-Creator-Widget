var Scheduler = (function () {

    function TimeSlot({scheduledGames,absoluteCompStartTime,name, description,scheduledItem,fieldNumber, startTime,length,type}) {
        if (!Number.isInteger(fieldNumber) || fieldNumber > (scheduledGames.fields.length + 1)) Break("fieldNumber must be integer and field must exist", { fieldNumber })
        if (!(scheduledGames.index instanceof Map)) Break("scheduledGames must be the _scheduledGames of the relevant Scheduler", { scheduledGames });
        let field = scheduledGames.fields[fieldNumber];
        
        defineGetter({ obj: this, name: "prev", func: () => field[this.fieldIndex - 1] });
        defineGetter({ obj: this, name: "next", func: () => field[this.fieldIndex + 1] });
        defineGetter({ obj: this, name: "fieldIndex", func: () => parseInt(field.indexOf(this))});
        defineGetter({ obj: this, name: "field", func: () => field});
        defineGetter({ obj: this, name: "fieldNumber", func: () => parseInt(fieldNumber) });
        defineGetter({ obj: this, name: "startTime", func: () => parseInt(startTime) });
        defineGetter({ obj: this, name: "absoluteStartTime", func: () => { return parseInt(startTime) + parseInt(absoluteCompStartTime) } });
        defineGetter({ obj: this, name: "endTime", func: () => parseInt(this.startTime + this.length) });
        defineGetter({ obj: this, name: "length", func: () => parseInt(length)});
        defineGetter({ obj: this, name: "scheduledItem", func: () => scheduledItem });
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "description", func: () => description });
        defineGetter({ obj: this, name: "type", func: () => type });

            scheduledGames.index.set(scheduledItem, this);
            field.set(this,{startTime:this.startTime,endTime:this.endTime});

        return this;
    }
    
    function Restriction(startField,endField,startTime,endTime,type,name,description){
        defineGetter({obj:this,name:"startField",func:()=>startField})
        defineGetter({obj:this,name:"endField",func:()=>endField})
        defineGetter({obj:this,name:"startTime",func:()=>startTime})
        defineGetter({obj:this,name:"endTime",func:()=>endTime})
        defineGetter({obj:this,name:"length",func:()=>endTime-startTime})
        defineGetter({obj:this,name:"type",func:()=>type})
        defineGetter({obj:this,name:"name",func:()=>name})
        defineGetter({obj:this,name:"description",func:()=>description})
        
        return this
    }


    function Scheduler(comp, maxFieldNumber, absoluteCompStartTime = Date.now(),restrictions=[]) {
        let me = this;
        this._absoluteCompStartTime = parseInt(absoluteCompStartTime);
        this._allPhases = new Map();
        comp.allPhasesArray.forEach(phase => this._allPhases.set(phase, false));

        this._allGames = new Map();
        this._unscheduledGames = new Set();
        this._shortestGameTime;
        comp.allGamesArray.forEach(game=>{
            this._allGames.set(game,false);
            this._unscheduledGames.add(game);
            this._shortestGameTime =(this._shortestGameTime===undefined) ? game.length: Math.min(this._shortestGameTime,game.length)
        });

        this._readyGames = new Map();

        this._scheduledGames = {
            index: new Map(),
            fields: [],
            insert(game,fieldNumber,time) { return new GameSlot(game,fieldNumber,time) },
            closeField(restriction,fieldNumber){return new ClosureSlot(restriction,fieldNumber)},
            getNextAvailable() {
                return getAvailability(this.fields);
            },
        };
        for (let fieldNumber = 1; fieldNumber <= maxFieldNumber; fieldNumber++) {
            this._scheduledGames.fields[fieldNumber] = new TimeMap();
            this._scheduledGames.fields[fieldNumber].restrictions = new TimeMap();
            this._scheduledGames.fields[fieldNumber].fieldNumber = fieldNumber;
            this._scheduledGames.fields[fieldNumber].nextAvailable = 0;
            for(const restriction of restrictions){
                if(fieldNumber>=restriction.startField && fieldNumber<=restriction.endField){
                    if(restriction.type===e.FIELD_CLOSURE){
                        this._scheduledGames.closeField(restriction,fieldNumber)
                    }
                }
            }
        }

        function GameSlot(game,fieldNumber,startTime){
            let gameSlot =   new TimeSlot({ 
                  scheduledGames:me._scheduledGames,
                  absoluteCompStartTime,
                  name:game.name,
                  description: `${game.incomingLinks[0].source.name} (${game.incomingLinks[0].sourceRank}) vs ${game.incomingLinks[1].source.name} (${game.incomingLinks[1].sourceRank})`,
                  scheduledItem: game,
                  fieldNumber,
                  startTime,
                  length:game.length,
                  type:e.GAME_SLOT
              })
              gameSlot.field.nextAvailable=gameSlot.endTime;
              return gameSlot;
          }
          
          function ClosureSlot(restriction,fieldNumber){
              return new TimeSlot({
                  scheduledGames:me._scheduledGames,
                  absoluteCompStartTime,
                  name:restriction.name,
                  description:restriction.description,
                  scheduledItem: restriction,
                  fieldNumber,
                  startTime:restriction.startTime,
                  length:restriction.length,
                  type:e.FIELD_CLOSURE
              })
          }
    }

    Scheduler.prototype = {
        assessGameReadiness(game) {
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });
            let ready = true;
            let readyTime =0;
            
                for(const link of game.incomingLinks){
                    if(link.source instanceof Team) continue;
                    if(link.source instanceof Game){
                        let linkReadyTime = this._allGames.get(link.source)
                        if(linkReadyTime ===false) {
                            ready = false;
                            break;
                         }
                        readyTime = Math.max(readyTime,linkReadyTime);
                    }
                    if(link.source instanceof Phase){
                        let linkReadyTime = this._allPhases.get(link.source);
                        if(linkReadyTime===false) {
                            ready = false;
                            break;
                        }
                        readyTime=Math.max(readyTime,linkReadyTime);
                    }
                }
            if(ready) this.readyGame(game,{game,score:0,reason:"",startTime:readyTime});
        },
        assessAllGameReadiness() {
            this._unscheduledGames.forEach((game) => this.assessGameReadiness(game));
        },
        readyGame(game,gameScore) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._unscheduledGames.has(game)) Break("Game must be unscheduled", { game, allGames: this._allGames, unscheduledGames: this._unscheduledGames });
                this._readyGames.set(game,gameScore);
                this._unscheduledGames.delete(game);
        },
        rankReadyGames() {
            let gameScores = Array.from(this._readyGames.values());
            let periods = [];
            let priorityThenBlockNum = {};
            let minLength={};
            let earliestLength=[];

            for (let gameScore of gameScores) {
                let priorityNum = gameScore.game.phase.currentSettings.get(e.PRIORITY);
                let blockNum = gameScore.game.block.blockOrder;
                let length = gameScore.game.length;
                minLength[length] = (minLength[length]===undefined) ? gameScore.startTime : Math.min(gameScore.startTime,minLength[length])

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

            for(const length of Object.keys(minLength).sort(SortFn.numAscending)){
                earliestLength.push({length:parseInt(length),readyTime:minLength[length]})
            }
            return { periods, priorityThenBlockNum,earliestLength };

        },
        scheduleGame(game, fieldNumber, time) {
            if (!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp", { game, allGames: this._allGames });
            if (!this._readyGames.has(game)) Break("Game must be ready for scheduling", { game, readyGames: this._readyGames });
            let newTimeSlot = this._scheduledGames.insert(game,fieldNumber,time);
            this._allGames.set(game, newTimeSlot.endTime);
            this._readyGames.delete(game);

                let phaseComplete = true;
                for(const phaseGame of game.phase.allGamesInPhase){
                    if(this._allGames.get(phaseGame)===false) phaseComplete = false;
                    break;
                }
                if (phaseComplete) this._allPhases.set(game.phase, newTimeSlot.endTime);
            this.assessAllGameReadiness();
            return newTimeSlot;
        },
        scheduleAll() {
            let success = true;
            this.assessAllGameReadiness();
            while (this._unscheduledGames.size > 0 || this._readyGames.size > 0) {
                let rankingObject = this.rankReadyGames();
                if (rankingObject.periods.length === 0) {
                    success = false;
                    break
                }
                let nextAvailable = this._scheduledGames.getNextAvailable();
                if(nextAvailable ===false){
                    success=false;
                    break
                }

                let choiceArray=[];//choice = {game: ,startTime: fieldNumber: }
                console.log("Schedule Loop",nextAvailable.all)
                for(const field of nextAvailable.all){
                    let initialFieldReadyTime = field.nextAvailable;
                    let scoringObject = this.serialScoring({field,scoreFuncArray:[fuckError],rankingObject});
                    choiceArray.push(scoringObject.choice);
                }
                choiceArray.sort((a,b)=>a.startTime-b.startTime)
                // schedule earliest game
                this.scheduleGame(choiceArray[0].game, choiceArray[0].fieldNumber,choiceArray[0].startTime);
            }
            return success
        },
        serialScoring({field,scoreFuncArray,rankingObject}){
            let scoringObject = {gameScoresByPeriod:[],invalidGames:[],
                earliestLength:rankingObject.earliestLength,
                          choice:{game:false,startTime:false,fieldNumber:false}}
            if(rankingObject.periods.length===0)  return scoringObject;
            for(const periodSet of rankingObject.periods){ //deep copy periods so can be seperately used by each field
                let newSet =new Set();
                newSet.gameLengths = new Set(periodSet.gameLengths);
                for(const gameScore of periodSet){
                    let newGameScore = {...gameScore};
                    newSet.add(newGameScore);
                }
                scoringObject.gameScoresByPeriod.push(newSet);
            }
            
            for(const scoreFunc of scoreFuncArray){
                scoringObject = scoreFunc(scoringObject,this,field);
            }
            
            scoringObject.choice = Array.from(scoringObject.gameScoresByPeriod[0]).sort((a,b)=>a.startTime-b.startTime)[0]
            scoringObject.choice.fieldNumber = field.fieldNumber;
            return scoringObject; 
        },
        getFieldSchedule() {
            let fields = this._scheduledGames.fields;

            let simplifiedFieldSchedule = [];
            for (let i = 1; i < fields.length; i++) {
                simplifiedFieldSchedule[i] = [];
                for (const timeSlot of fields[i]) {
                    simplifiedFieldSchedule[i].push({
                        scheduledItem: timeSlot.scheduledItem,
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
    Scheduler.Restriction = Restriction;

    


  function getAvailability(fields){
      let availability = {fieldNumber:false,time:false,field:false,all:[]};
      for(const field of fields){
          if(!field) continue;
          if(field.nextAvailable === false) continue;
          availability.all.push(field)
      }
      if(availability.all.length===0) return false;

      availability.all.sort((a,b)=>a.nextAvailable-b.nextAvailable);
      availability.field = availability.all[0]
      availability.fieldNumber = availability.field.fieldNumber;
      availability.time = availability.field.nextAvailable;
      return availability;
  }

  function fuckError(scoringObject,scheduler,field){
        
    let gap = field.findGap(field.nextAvailable);
    let currentStartTime = Math.max(gap.startTime,field.nextAvailable);
    let currentGapLength = gap.endTime-currentStartTime;
    let a =0;
   gapSearch: while(gap.startTime!==false && gap.startTime!==Number.POSITIVE_INFINITY){
    if(++a>6) break;
    console.log(a,gap)
    let nextSearchTime = gap.endTime;
        //Ensure first gap found can fit *any* game in the comp. If not, close the gap and find another one that can. If no one can, close field. 
        if(gap.length<scheduler._shortestGameTime){
            let newRestriction = Scheduler.Restriction(field.fieldNumber,field.fieldNumber,gap.startTime,gap.endTime,e.FIELD_CLOSURE,"Closed by Computer","Not enough of a gap for any game in competition")
            scheduler._scheduledGames.closeField(newRestriction,field.fieldNumber)
            field.nextAvailable = TimeMap.sortByEnd(gap.nextEntries).at(-1).endTime ?? false;
            if(field.nextAvailable===false){ //If field closed, reject all potential games. Field will not assessed for use again. 
                for(const periodSet of scoringObject.gameScoresByPeriod){
                    for(const gameScore of periodSet){
                        gameScore.score = false;
                        gameScore.reason = "Field no longer has capacity"
                        scoringObject.invalidGames.push(gameScore);
                    }
                }
                scoringObject.gameScoresByPeriod.length=0;
                return scoringObject;
            }
        } else{
        //Find if *any* game that is ready can fit in this gap, by re: length and readiness. If one can, break. If not, find next gap with nil temp closure. 
        let nextValidTime = Number.POSITIVE_INFINITY;
        let anythingFits = false;
       
        for(const earliest of scoringObject.earliestLength){
            let fit = earliest.length<=currentGapLength;
            let valid = earliest.readyTime<=currentStartTime

            if(earliest.readyTime>currentStartTime) nextValidTime = Math.min(nextValidTime,earliest.readyTime);
            if(fit&&!valid){
                anythingFits = true;
            }
            if(fit&&valid){
                break gapSearch;
            }
        }
        if(anythingFits){
            nextSearchTime = Math.min(nextValidTime,gap.endTime);
        } else {
            nextSearchTime = gap.endTime;
        }
        if(a>3) console.log(scoringObject.earliestLength,{currentGapLength,currentStartTime,anythingFits,nextSearchTime})
    }  
        
            gap = field.findGap(nextSearchTime);
            currentStartTime = Math.max(gap.startTime,field.nextAvailable,nextSearchTime);
            currentGapLength = gap.endTime-currentStartTime;
            console.log(a,"end",gap)
    }

    for(let i=0;i<scoringObject.gameScoresByPeriod.length;i++){
        let period = scoringObject.gameScoresByPeriod[i];
        for(const gameScore of period){
            let fit = gameScore.game.length<=currentGapLength ;
            let readyInTime = gameScore.startTime <=currentStartTime;
            if(fit && readyInTime ){
                gameScore.startTime = Math.max(gameScore.startTime,currentStartTime);
                continue;
            } else {
                gameScore.score=false;
                gameScore.reason = `Game ${(!readyInTime) ? "was not valid at current time":""} ${(!fit && !readyInTime) ? " and ":""}${(!fit)?"could not fit in available gap":""}`;
                scoringObject.invalidGames.push(gameScore);
                 period.delete(gameScore);
                        if (period.size===0){
                            scoringObject.gameScoresByPeriod.splice(i,1);
                            i--
                        }
            }
        }
    }
    return scoringObject;
}
    
    // function enoughTime(scoringObject,scheduler,field){
    //     let gap = field.findGap(field.nextAvailable)
    //     let minCompLength = scheduler._shortestGameTime;
    //     while(gap.startTime!==false && gap.startTime !== Number.POSITIVE_INFINITY){
    //         if(gap.length>=scoringObject.minRankedLength){ //gap will fit at least one game
    //             for(let i = 0;i< scoringObject.gameScoresByPeriod.length;i++){
    //                 const periodSet = scoringObject.gameScoresByPeriod[i];
    //                 for(const gameScore of periodSet){
    //                     gameScore.startTime = gap.startTime;
    //                     if(gameScore.game.length>gap.length){
    //                         gameScore.score=false;
    //                         gameScore.reason = "Too big for current gap";
    //                         scoringObject.invalidGames.push(gameScore);
    //                         periodSet.delete(gameScore);
    //                         if (periodSet.size===0){
    //                             scoringObject.gameScoresByPeriod.splice(i,1);
    //                             i--
    //                         }
    //                     }
    //                 }
    //             }
    //             return scoringObject;
    //         } else if (gap.length<minCompLength){ //gap will not fit any game in the comp
    //             let newRestriction = Scheduler.Restriction(field.fieldNumber,field.fieldNumber,gap.startTime,gap.endTime,e.FIELD_CLOSURE,"Closed by Computer","Not enough of a gap for any game in competition")
    //             scheduler._scheduledGames.closeField(newRestriction,field.fieldNumber)
    //             field.nextAvailable = (gap.nextEntries[0].endTime===Number.POSITIVE_INFINITY) ? false: gap.nextEntries[0].endTime;
    //             return scoringObject;
    //         } 
    //     gap = field.findGap(gap.endTime);
    //     }
    //     //if no gap that will fit, fail all, return
    //     for(const periodSet of scoringObject.gameScoresByPeriod){
    //         for(const gameScore of periodSet){
    //             gameScore.score = false;
    //             gameScore.reason = "Field no longer has capacity"
    //             scoringObject.invalidGames.push(gameScore);
    //         }
    //     }
    //     scoringObject.gameScoresByPeriod.length=0;
    //     return scoringObject;
    // }
    
    // function checkValidity(scoringObject,scheduler,field){
    //     for(let i = 0;i< scoringObject.gameScoresByPeriod.length;i++){
    //                 const periodSet = scoringObject.gameScoresByPeriod[i];
    //                 for(const gameScore of periodSet){
    //                     let validForCurrentTime=true;
    //                     for(const inLink of gameScore.game){
    //                         if(inLink.source instanceof Team) continue;
    //                         if(inLink.source instanceof Game){
    //                             if(scheduler._allGames.get(inLink.source)>gameScore.startTime){
    //                                 validForCurrentTime = false;
    //                                 break;
    //                             }
    //                         }
    //                         if(inLink.source instanceof Phase){
    //                             if(scheduler._allPhases.get(inLink.source)>gameScore.startTime){
    //                                 validForCurrentTime = false;
    //                                 break;
    //                             }
    //                         }
    //                     }
    //                         if(!validForCurrentTime){
    //                         gameScore.score=false;
    //                         gameScore.reason = "Not all sources actually finished at this time.";
    //                         scoringObject.invalidGames.push(gameScore);
    //                         periodSet.delete(gameScore);
    //                         if (periodSet.size===0){
    //                             scoringObject.gameScoresByPeriod.splice(i,1);
    //                             i--
    //                         }
    //                     }
    //                 }
    //                 }
                
    // } 

   
    

    return Scheduler
})()



