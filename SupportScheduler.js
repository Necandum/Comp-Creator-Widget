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
        
        phaseRegistry.obtainAvailable = function(timeSlot){
           return  this.get(timeSlot.scheduledItem.phase)?.obtainAvailable?.(timeSlot.startTime,timeSlot.endTime)??[];
        }
        this.__phaseRegistry=phaseRegistry;

        for(const phase of comp.allPhasesArray){
            if(phase.currentSettings.get(e.SUPPORT_SELECTION)===e.PREDETERMINED){
                let phaseEntry = new Map();
                let phaseSupportTeams = phase.currentSettings.get(e.SUPPORT_TEAMS);
                phaseRegistry.set(phase,phaseEntry);

                for(const team of phaseSupportTeams){
                    let newEntry = {support:team,collisionChecker:new TimeMap()}

                    for(const game of comp.allGamesArray){
                        if(game.ancestralSources.has(team)){
                            let timeSLot = simplifiedFieldSchedule.index.get(game);
                            newEntry.collisionChecker.set({game,role:e.PLAYER},{startTime:timeSLot.startTime,endTime:timeSLot.endTime})
                        }
                    }
                    phaseEntry.set(team,newEntry);
                    performanceRegistry.set(team,new Map())
                }
                phaseEntry.obtainAvailable = findValidPredeterminedSupport;
                phaseEntry.maxSupport = Math.ceil(phase.allGamesInPhase.length/phaseSupportTeams.size)
            }
            if(phase.currentSettings.get(e.SUPPORT_SELECTION)===e.TOURNAMENT){

            }
        }
        this.settings = {
            roles:[SupportScheduler.DUTY],
        }
        this.getCompleteSchedule=function completeFieldSchedule(){
            for(const timeSlot of simplifiedFieldSchedule.index.values()){
                let availableTeamScores = phaseRegistry.obtainAvailable(timeSlot);
                // availableTeamScores = serialScoring (availableTeamScores);
                availableTeamScores.length = Math.min(this.settings.roles.length,availableTeamScores.length);

                for(const role of this.settings.roles){
                    console.log(availableTeamScores.map(x=>x.team.name))
                    availableTeamScores.sort((a,b)=> performanceRegistry.get(a.team)?.get(role) ?? 0 - performanceRegistry.get(b.team)?.get(role) ?? 0)
                    console.log(availableTeamScores.map(x=>x.team.name))
                    let chosenTeam = availableTeamScores.splice(0,1)[0]?.team 
                    timeSlot.setSupportRole(role, chosenTeam ?? null);
                    if(chosenTeam) {
                        let currentRoleCount = performanceRegistry.get(chosenTeam).get(role) ?? 0;
                        performanceRegistry.get(chosenTeam).set(role, currentRoleCount+1)}
                }
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
    return validSupportScores;
}

return SupportScheduler
})()