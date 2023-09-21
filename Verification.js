


var Verification = (function(){ 
    let paused = false;
    let activatedWhilePaused = false;
    let Verification = {
        objections: new Set(),
        forVerification: new Set(),
        get paused(){return paused},
        addObjection(objection){
            this.objections.add(objection)
        },
        removeObjection(objection){
            this.objections.delete(objection)
        },
        queue(unit){
            this.forVerification.add(unit);
        },
        activate(){
            if(!paused){
                this.forVerification.forEach(unit=>unit.verifyLinks())
                this.forVerification.clear();
                console.log("~~~~~~~~~~~")
            } else {
                activatedWhilePaused = true;
            }
        },
        revokeAllObjections(unit){
            this.objections.forEach(objection=> (objection.objector===unit) ? this.objections.delete(objection): false)
        },
        pause(){
            if(!paused){
                paused =true;
                activatedWhilePaused = false;
                return true;
            } else{
                return false;
            }
        },
        unPause(){
            if(paused){
                paused = false;
                if(activatedWhilePaused) this.activate();
                activatedWhilePaused = false;
                return true;
            } else {
                return false;
            }
        }
        
    }

    Object.freeze(Verification);

return Verification
})()


var PostponeMakingAncestralLinks = (function(){ 

    let PostponeMakingAncestralLinks = {
       
        blocks: new Set(),
        phases: new Set(),
        queue(...units){
            for(const unit of units){
            if(unit instanceof Block) this.blocks.add(unit);
            if(unit instanceof Phase) this.phases.add(unit);
        }
        },
        activate(){
            this.phases.forEach(phase=>phase.remakeAncestralRegister());
            this.blocks.forEach(block=>block.remakeAncestralRegister());
            this.phases.clear();
            this.blocks.clear();
        }
        
        
    }

    Object.freeze(PostponeMakingAncestralLinks);

return PostponeMakingAncestralLinks
})()




/**
 * @function
 * @param {object} primeTarget 
 * @param {Array} associatedLinkList
 * @param {enum} reason
 * @param {Game} objector
 * @enum SourceRankDuplication 
 * @enum RecursiveLoop
 * @enum TwoTeamGame
 * @enum GameOnlyTwoRanks
 * @enum TournamentAsSource
 * @enum RoundRobinGameAsSource
 * @enum NotATournament
 * @enum OneBlockOneTeam
 * @enum MustHaveSeed
 * @enum RedundantSeeds
 * @enum OverLoadedSeed
 * @enum NotEnoughTeams
*/
var Objection = (function(){ 

   Objection["SourceRankDuplication"]=  Symbol("Potential for same team to appear twice in bracket leading up to this game");
   Objection["RecursiveLoop"]=  Symbol("A loop has been created, such that a game's or phase's sources are determiend by its outcome.");
   Objection["TwoTeamGame"]=  Symbol("Two and only two incoming links must exist");
   Objection["GameOnlyTwoRanks"]=  Symbol("Only ranks 1 and 2 valid for Games");
   Objection["TournamentAsSource"]=  Symbol("A Tournament phase cannot be used as a source");
   Objection["RoundRobinGameAsSource"]=  Symbol("Games inside a round robin cannot be a source.");
   Objection["NotATournament"]=  Symbol("In a round robin, games cannot be dependant on outcome of other games in the same Phase.");
   Objection["OneBlockOneTeam"]=  Symbol("A team can only appear once per block, or even have the potential for doing. ");
   Objection["MustHaveSeed"]=  Symbol("A link coming into a phase must have a seed number");
   Objection["RedundantSeeds"]=  Symbol("Links to same source and source rank cannot have different seeds");
   Objection["OverLoadedSeed"]=  Symbol("Links with the same seed must share source and source rank");
   Objection["NotEnoughTeams"]=  Symbol("Cannot have a source rank from a Phase higher than the max number of participating teams");


    function Objection(primeSuspect,associatedLinkList,reason,objector){
        this.primeSuspect = primeSuspect;
        this.associatedLinkList = associatedLinkList;
        this.reason = reason;   
        this.objector = objector;
        this.lodge = function lodgeObjection(){
            Verification.addObjection(this);
        };
        this.revoke = function revokeObjection(){
            Verification.removeObjection(this);
        }
    }

return Objection
})()
Object.freeze(Objection);
    
var ValidityTracker = (function(){ 

    function ValidityTracker(initialState=true){
        this._status = initialState;
        this._message ='';
        this._reasons =[];
    }

    ValidityTracker.prototype={
        fail(reason){
            this._status=false;
            if(reason) {
            this._reasons.push(reason)
           this._message+=`\n -${reason.description}`
            }
           
        },
        pass(){
            this._status = true;
            this._message="";
            this._reasons=[];
        },
        copy(){
            let newTracker = new ValidityTracker(this.status);
            newTracker._message=this.message;
            newTracker._reasons = this.reasons;
            return newTracker;
        }
    }
    defineGetter({obj: ValidityTracker.prototype,name:"status",func:function(){return this._status}})
    defineGetter({obj: ValidityTracker.prototype,name:"message",func:function(){return this._message}})
    defineGetter({obj: ValidityTracker.prototype,name:"reasons",func:function(){return [...this._reasons]}})
    ValidityTracker.prototype.constructor=ValidityTracker

return ValidityTracker
})()