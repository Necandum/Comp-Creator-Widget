var SupportScheduler = (function(){ 
/**
 * @constructor
 * @enum REF1
 * @enum REF2
 * @enum DUTY
 */
    SupportScheduler["REF1"] = Symbol("Referee 1")
    SupportScheduler["REF2"] = Symbol("Referee 2")
    SupportScheduler["DUTY"] = Symbol("Duty")

    function SupportScheduler(comp, simplifiedFieldSchedule,restrictions){
        let phaseRegistry = new Map();
        let performanceRegistry = new Map();
        
        this.__phaseRegistry=phaseRegistry;
        for(const phase of comp.allPhasesArray){
            if(phase.currentSettings.get(e.SUPPORT_SELECTION)===e.PREDETERMINED){
                let phaseEntry = new Map();
                phaseRegistry.set(phase,phaseEntry);

                for(const team of phase.currentSettings.get(e.SUPPORT_TEAMS)){
                    let newEntry = {support:team,collisionChecker:new TimeMap()}
                    for(const game of comp.allGamesArray){
                        if(game.ancestralSources.has(team)){
                            let simplifiedTimeSlot = simplifiedFieldSchedule.index.get(game);
                            newEntry.collisionChecker.set({game,role:e.PLAYER},{startTime:simplifiedTimeSlot.startTime,endTime:simplifiedTimeSlot.endTime})
                        }
                    }
                    phaseEntry.set(team,newEntry);
                }
                phaseEntry.obtain = findValidPredeterminedSupport;
            }
            if(phase.currentSettings.get(e.SUPPORT_SELECTION)===e.TOURNAMENT){

            }
        }

        this.settings = {
            roles:[],

        }

        this.getCompleteSchedule=function completeFieldSchedule(){
            for(const simpleTimeSlot of simplifiedFieldSchedule){
                let game = simpleTimeSlot.scheduledItem;
                let availableTeams 
            }
        }
    }

function findValidPredeterminedSupport(startTime,endTime){
    let validSupportScores =[]
    for(let [team,entry] of this){
        let gap = entry.collisionChecker.findGap(startTime);
        if(gap.startTime===false) continue
        if(gap.startTime<=startTime && gap.endTime>=endTime){
            validSupportScores.push({team,entry,gap,score:0});
        }
    }
    return validSupportEntries;
}

return SupportScheduler
})()