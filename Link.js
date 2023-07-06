
var Link = (function () {

    function Link({ source, target, sourceRank}) {
        if(target instanceof Phase) Break("Links cannot target a Phase",{args:arguments[0]});
        if (source === target) Alert("Source and Target cannot be the same", { args: arguments[0] });
        let validity = new ValidityTracker(true);
        let forDeletion = false;
        defineGetter({ obj: this, name: "source", func: () => source })
        defineGetter({ obj: this, name: "target", func: () => target })
        defineGetter({ obj: this, name: "sourceRank", func: () => sourceRank })
        defineGetter({ obj: this, name: "forDeletion", func: () => forDeletion })
        defineGetter({ obj: this, name: "valid", func: () => validity.status })

        if (source instanceof Team) sourceRank = 'Team';
        sourceRank ??= 1;// the rank of the game in the outcome of the source. Indexed at 1;

        this.deleteLink = function () {
            forDeletion=true;
            source.removeLink(this);
            target.removeLink(this);
            PostponeMakingAncestralLinks.activate();
            Verification.activate();
        }

        source.addLink(this);
        target.addLink(this);
        Verification.activate();
        

    }

    Object.freeze(Link);
    return Link
})()