var Division = (function(){ 
    let id = 0
    let allDivisions = new Map();
    defineGetter({ obj: Division, name: "allDivisionsArray", func: () => Array.from(allDivisions.values()) });

    function Division({name}){
        if(allDivisions.has(name)) Break("Division already exists",{divisions:Division.allDivisionsArray,name})
        let divisionContent = new Set();
        let divisionParents = new Set();
        let myId = ++id;
        allDivisions.set(name,this);

        defineGetter({ obj: this, name: "contents", func: () => new Set(divisionContent)});
        defineGetter({ obj: this, name: "parentDivisions", func: () => new Set(divisionParents)});
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "teams", func: () => new Set(Array.from(divisionContent).filter(value=>value instanceof Team))});
        defineGetter({ obj: this, name: "subDivisions", func: () => new Set(Array.from(divisionContent).filter(value=>value instanceof Division))});
        defineGetter({ obj: this, name: "allTeams", func: () =>new Set( Array.from(divisionContent).reduce
        ( (result,content)=>{ 
                (content instanceof Team) ? result.push(content): result.push(...content.allTeams)
                return result;
            },
            []
        ) )});
        defineGetter({ obj: this, name: "allSubDivisions", func: () =>new Set( Array.from(divisionContent).reduce
        ( (result,content)=>{ 
                if (content instanceof Division)  result.push(content,...content.allSubDivisions)
                return result;
            },
            []
        ) )});

        this.deleteDivision = function(){
            allDivisions.delete(this.name);
            divisionParents.forEach(parentDivision=>parentDivision.remove(this));
            divisionContent.forEach(teamOrDivision=>teamOrDivision.removeFromDivision(this));
            name="Deleted";
            myId=null;
        }

        this.changeDetail = function (detail, newValue) {
            switch (detail) {
                case e.NAME:
                    name = newValue;
                    break;
            }
        }

        this.add = function (teamOrDivision) {
            if(!(teamOrDivision instanceof Team)&&!(teamOrDivision instanceof Division)) Break("can only add teams or other divisions to a division",{teamOrDivision})
           if(checkForLoop(this,teamOrDivision)) return false 
           divisionContent.add(teamOrDivision);
           teamOrDivision.addToDivision(this)
           return true;
         }

        this.remove = function (teamOrDivision) {
            if(!(teamOrDivision instanceof Team)&&!(teamOrDivision instanceof Division)) Break("can only add teams or other divisions to a division",{teamOrDivision})
            divisionContent.delete(teamOrDivision)
            teamOrDivision.removeFromDivision(this);
            return true 
        }
        this.addToDivision=function(division){
            divisionParents.add(division);
        }
        this.removeFromDivision=function(division){
            divisionParents.delete(division);
        }
        function checkForLoop(currentDiv,newDiv){
            if(!(currentDiv instanceof Division) || !(newDiv instanceof Division)) return false;
            if(currentDiv===newDiv) return true;
            if(newDiv.allSubDivisions.has(currentDiv)) return true;
            return false;
        }
        this.updateSettings = function(newSettings){
            if(newSettings.name){
                if(allDivisions.has(newSettings.name)) return false;
                allDivisions.delete(name);
                name = newSettings.name;
                allDivisions.set(name,this);
            }
        }
    }

    Division.prototype={
    }
    Division.prototype.constructor=Division

return Division
})()

