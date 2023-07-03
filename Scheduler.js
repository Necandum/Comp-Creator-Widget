var Scheduler = (function(){ 
    
        function TimeSlot(scheduledGames,fieldNumber,game,absoluteCompStartTime){
            if(!Number.isInteger(fieldNumber) || fieldNumber>(scheduledGames.fields.length+1)) Break("fieldNumber must be integer and field must exist",{fieldNumber})
            if(!scheduledGames.index instanceof Map) Break("scheduledGames must be the _scheduledGames of the relevant Scheduler",{scheduledGames});
            let me = this;
            let field = scheduledGames.fields[fieldNumber];
                field.push(this);
                 
            let startTime;
            let indexObj = {
                get field(){return Array.from(field)},
                get fieldNumber(){return me.fieldNumber},
                get fieldIndex(){return me.fieldIndex}
            }

            defineGetter({obj:this,name:"prev",func:()=>field[this.fieldIndex-1]});
            defineGetter({obj:this,name:"next",func:()=>field[this.fieldIndex+1]});
            defineGetter({obj:this,name:"game",func:()=>game});
            defineGetter({obj:this,name:"fieldIndex",func:()=>parseInt(field.indexOf(this))});
            defineGetter({obj:this,name:"fieldNumber",func:()=>parseInt(fieldNumber)});
            defineGetter({obj:this,name:"length",func:()=>parseInt((game) ? game.gameStages.at(-1).endAtSecond :  0)});
            defineGetter({obj:this,name:"startTime",func:()=>parseInt(startTime)});
            defineGetter({obj:this,name:"absoluteStartTime",func:()=>{return parseInt(startTime)*1000+parseInt(absoluteCompStartTime)}});
            defineGetter({obj:this,name:"endTime",func:()=>parseInt(this.startTime+this.length)});           

            this.assignGame = function(assignedGame){
                if(!game instanceof Game) Break("only accepts Game",{assignedGame});
                scheduledGames.index.set(assignedGame,indexObj);
                scheduledGames.index.delete(game);
                game = assignedGame;
                return this;
            }
            this.assignField = function({assignedFieldNumber,assignedFieldIndex}){
                if(!Number.isInteger(assignedFieldNumber ) || assignedFieldNumber>(scheduledGames.fields.length+1)) Break("assignedFieldNumber must be integer and field must exist",{assignedFieldNumber})
                if(!Number.isInteger(assignedFieldIndex) && assignedFieldIndex) Break("assignedFieldIndex must be integer",{assignedFieldIndex});
                
                field.splice(this.fieldIndex,1);
                let newField = scheduledGames.fields[assignedFieldNumber]
                if(assignedFieldIndex){
                    newField.splice(assignedFieldIndex,0,this);
                } else {
                    newField.push(this);
                }
                field=newField;
                fieldNumber = assignedFieldNumber;
                this.calculateStartTime();
                return this
            } 

            this.calculateStartTime=function(){
                startTime=(this.prev) ? this.prev.endTime: 0;
            }

            if(game) scheduledGames.index.set(game,indexObj);
            this.calculateStartTime();
            return this;
        }
    
    
    function Scheduler(comp,maxFieldNumber,absoluteCompStartTime=Date.now()){
        this._allPhases = new Map();
        comp.allPhasesArray.forEach(el=>this._allPhases.set(el,false));
        
        this._allGames = new Map();
        
        this._allPhases.forEach(
            (readiness,phase)=>phase.allGamesInPhase.forEach(
                (game) =>this._allGames.set(game,false)))
        
        this._unscheduledGames = new Map();
        this._allGames.forEach((readiness,game) =>{
           let incomingLinkResults = new Map()
            game.incomingLinks.forEach(link => incomingLinkResults.set(link,link.source instanceof Team));
            this._unscheduledGames.set(game,incomingLinkResults)
        })
        
        this._readyGames = new Map();
       
        this._scheduledGames = {index:new Map(),
                                fields:[],
                                insert:function(fieldNumber,game){return new TimeSlot(this,fieldNumber,game,absoluteCompStartTime)},
                                get availableField(){
                                    return this.fields.reduce((acc,cv)=>{ 
                                                                        let currentFinishTime = acc.at(-1)?.endTime ?? 0;
                                                                        let potentialFinishTime = cv.at(-1)?.endTime ?? 0;
                                                                        return (currentFinishTime<=potentialFinishTime) ? acc:cv});
                                    },
                                };
        for(let fieldNumber=1;fieldNumber<=maxFieldNumber;fieldNumber++){
            this._scheduledGames.fields[fieldNumber]=[];
            this._scheduledGames.fields[fieldNumber].restrictions=[];
            this._scheduledGames.fields[fieldNumber].fieldNumber=fieldNumber;
        }

        this.assessAllGameReadiness();
        
    }
    
    Scheduler.prototype={
        assessGameReadiness(game){
            if(!this._unscheduledGames.has(game)) Break("Game must be unscheduled",{game,allGames:this._allGames,unscheduledGames:this._unscheduledGames});

            this._unscheduledGames.forEach( 
                (linkMap,game)=>{
                    linkMap.forEach(
                        (readiness,link) => {
                            if(link.source instanceof Phase) linkMap.set(link,this._allPhases.get(link.source))
                            if(link.source instanceof Game) linkMap.set(link,this._allGames.get(link.source))
                        }
                    );
                    this.readyGame(game);
                }
            )
        },
        assessAllGameReadiness(){
            this._unscheduledGames.forEach((linkMap,game)=>this.assessGameReadiness(game));
        },
        
        readyAllGames(){
            this._unscheduledGames.forEach((linkReadiness,game)=>this.readyGame(game));
        },

        readyGame (game){
            if(!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp",{game,allGames:this._allGames});
            if(!this._unscheduledGames.has(game)) Break("Game must be unscheduled",{game,allGames:this._allGames,unscheduledGames:this._unscheduledGames});
            let prepared = true;
            let linkReadinessMap = this._unscheduledGames.get(game);
            linkReadinessMap.forEach((readiness,link)=>{if(!readiness) prepared = false});
            if(linkReadinessMap.size===0) prepared =false;
            if(prepared){
                this._readyGames.set(game,linkReadinessMap);
                this._unscheduledGames.delete(game);
            }

            return prepared;
        },
        rankReadyGames(){
            let games = Array.from(this._readyGames.keys());
            let periods = [];
            let priorityThenBlockNum = {};
            

            for(let game of games){
                let priorityNum = game.phase.currentSettings.get(e.PRIORITY);
                let blockNum = game.parent.blockOrder;

                if(!priorityThenBlockNum[priorityNum]) priorityThenBlockNum[priorityNum]={};
                if(!priorityThenBlockNum[priorityNum][blockNum]) priorityThenBlockNum[priorityNum][blockNum]=[];
                priorityThenBlockNum[priorityNum][blockNum].push(game)
            }
            
            for(let priorityNum of Object.keys(priorityThenBlockNum).sort(SortFn.numDescending)){
                for(let blockNum of Object.keys(priorityThenBlockNum[priorityNum]).sort(SortFn.numAscending)){
                    periods.push([...priorityThenBlockNum[priorityNum][blockNum]]);
                }

            }
            return {periods,priorityThenBlockNum};
            
        },
        scheduleGame(game,fieldNumber){
            if(!(game instanceof Game) || !this._allGames.has(game)) Break("Must be a game present in this comp",{game,allGames:this._allGames});
            if(!this._readyGames.has(game)) Break("Game must be ready for scheduling",{game,readyGames:this._readyGames});
            this._allGames.set(game,true);
            let newTimeSlot = this._scheduledGames.insert(fieldNumber,game);
            this._readyGames.delete(game);

            let phaseCompleteGameCounter=0;
            game.phase.allGamesInPhase.forEach((game)=>{if(this._allGames.get(game)) phaseCompleteGameCounter++});
            if(game.phase.allGamesInPhase.length === phaseCompleteGameCounter) this._allPhases.set(game.phase,true);

            this.assessAllGameReadiness();
            return newTimeSlot;
        },
        scheduleAll(){
            let success = true;

            while(this._unscheduledGames.size > 0 || this._readyGames.size>0){
                let periods = this.rankReadyGames().periods;

                if(periods.length===0) {
                    success = false;
                    break
                }
                let availableFieldNumber = this._scheduledGames.availableField.fieldNumber;
                this.scheduleGame(periods[0][0],availableFieldNumber);
            }
            return success
        },
        getFieldSchedule(){
            let fields = this._scheduledGames.fields;       
              
            let simplifiedFieldSchedule =[];
            for(let i=1;i<fields.length;i++){
                simplifiedFieldSchedule[i]=[];
                for(const timeSlot of fields[i]){
                    simplifiedFieldSchedule[i].push({
                        game:timeSlot.game,
                        absoluteStartTime:timeSlot.absoluteStartTime,
                        fieldNumber:timeSlot.fieldNumber
                    })
                }
            }
            return simplifiedFieldSchedule
        },
    

        
        
    }
    Scheduler.prototype.constructor=Scheduler

    
    

return Scheduler
})() 



