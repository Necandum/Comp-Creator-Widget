
var Link = (function () {

    function Link({ source, target, sourceRank, seed }) {
        if(target instanceof Phase) Break("Links cannot target a Phase",{args:arguments[0]});
        if (source === target) Alert("Source and Target cannot be the same", { args: arguments[0] });

        let objectors = new Set();
        let deletionFinished = false;
        defineGetter({ obj: this, name: "source", func: () => source })
        defineGetter({ obj: this, name: "target", func: () => target })
        defineGetter({ obj: this, name: "sourceRank", func: () => sourceRank })
        defineGetter({ obj: this, name: "objectors", func: () => new Set(objectors) })
        defineGetter({ obj: this, name: "seed", func: () => seed })

        if (source instanceof Team) sourceRank = 'Team';
        sourceRank = (sourceRank) ? sourceRank : 1;// the rank of the game in the outcome of the source. Indexed at 1;
        if(source.phase!==target.phase){
            if(!Number.isInteger(seed)){
                seed = target.phase.deriveCorrectSeed(this)
            }
        }

        this.deleteLink = function (deleteInitiator) {
            if (deletionFinished) return true
            deletionFinished = true;
            if (deleteInitiator !== this.source) this.source.removeLink(this,false);
            if (deleteInitiator !== this.target) this.target.removeLink(this,false);
            for(const objector of objectors){
                objector.verifyLinks();
            }
            if (deleteInitiator !== this.source) this.source.removeLink(this,true);
            if (deleteInitiator !== this.target) this.target.removeLink(this,true);
        }
        this.lodgeObjection = function (objector) {
            if (!objector) Break("Objector must be present", { objector }) // if the same object verifying multiple times due to multiple objections becomes a problem, get objcetors to group all their objections, then lodge them adding option not to trigger verification, then trigger verification. 
            if (objectors.has(objector)) return false
            objectors.add(objector);
            if (objector !== source) source.verifyLinks();
            if (objector !== target) target.verifyLinks();
            return true
        }
        this.revokeObjection = function (objector) {
            if (!objector) Break("Objector must be present", { objector });

            let objectionPresent = objectors.delete(objector);
            if (!objectionPresent) return false;
            if (objector !== source) source.verifyLinks();
            if (objector !== target) target.verifyLinks();
            return true
        }

        this.source.addLink(this, false);
        this.target.addLink(this, false);
        this.source.verifyLinks();
        this.target.verifyLinks();
        this.target?.block?.verifyLinks();
        if((source.phase !== target.phase)) target.phase.verifyLinks()
    }

    Object.freeze(Link);
    return Link
})()