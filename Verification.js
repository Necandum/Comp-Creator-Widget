
// /**
//  * @typedef Verification
//  * @property {(mark:Object)=>undefined} register
//  * @property {(mark,handler)} addHandler
//  * @property {function} removeHandler
//  * @property {function} distributeObservation
//  * @property {({mark,currentFunction,currentObject})} Execution - Merely messages that a function executed. 
//  * 
//  */

// /**
//  * @type {Verification}
// */

var Verification = (function(){ 

    let Verification = {
        objections: new Set(),
        forVerification: new Set(),
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
            this.forVerification.forEach(unit=>unit.verifyLinks())
            this.forVerification.clear();
        },
        revokeAllObjection(unit){
            this.objections.forEach(objection=> (objection.objector===unit) ? this.objections.delete(objection): false)
        }
    }

    Object.freeze(Verification);

return Verification
})()





/**
 * @function
 * @param {object} primeTarget 
 * @param {Array} associatedLinkList
 * @param {enum} reason
 * @param {Game} objector
 * @enum SourceRankDuplication 
 * @enum RecursiveLoop
*/
var Objection = (function(){ 

   Objection["SourceRankDuplication"]=  Symbol("Potential for same team to appear twice in bracket leading up to this game");
   Objection["RecursiveLoop"]=  Symbol("A loop has been created, such that a game's or phase's sources are determiend by its outcome.");

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

    function ValidityTracker(initialState){
        this._status = initialState;
        this.message ='';
        this.reasons =[];
    }

    ValidityTracker.prototype={
        fail(reason){
            this._status=false;
           if(message) this.message+=`\n -${reason.description}`
           if(reason) this.reasons.push(reason)
        },
        pass(){
            this._status = true;
            this.message="";
            this.reasons=[];
        }
    }
    defineGetter({obj: ValidityTracker.prototype,name:"status",func:()=>this._status})
    ValidityTracker.prototype.constructor=ValidityTracker

return ValidityTracker
})()