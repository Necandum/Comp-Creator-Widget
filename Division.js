var Division = (function(){ 
    let id = 0
    let allDivisions = [];
    defineGetter({ obj: Division, name: "allDivisionsArray", func: () => Array.from(allDivisions) });

    function Division(name){
        let teams = [];
        let myId = ++id;
        allDivisions.push(this);

        defineGetter({ obj: this, name: "teams", func: () => Array.from(teams) });
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });

        this.deleteDivision = function(){
            allDivisions.splice(allDivsions.indexOf(this),1);
        }

        this.changeDetail = function (detail, newValue) {
            switch (detail) {
                case e.NAME:
                    name = newValue;
                    break;
            }
        }

        this.addTeam = function (team) {
            if(!(team instanceof Team)) throw new Error('Not a Team');
            if(teams.indexOf(team)>-1) throw new Error("Division already has Team")

            teams.push(team);

            return this
         }

        this.removeTeam = function (team) {
            if(!(team instanceof Team)) throw new Error('Not a Team');
            if(!(teams.indexOf(team)>-1)) throw new Error("Team not in Division");

            let indexToDelete = teams.indexOf(team);
            teams.splice(indexToDelete,1);
            return this
        }
    }

    Division.prototype={
    }
    Division.prototype.constructor=Division

return Division
})()

