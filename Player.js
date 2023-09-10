//requires Basic Tools be loaded

var Player= (function(){
    
    let id = 0;
    allPlayers = new Map();

    defineGetter({obj:Player,name:"allPlayersArray",func:()=>Array.from(allPlayers.keys())});
    Player.search = function(searchCriterionObj){
        let results = new Set();
        playerSearch: for(const [player,teams] of allPlayers){
                        for(const property in searchCriterionObj){
                            if(player[property]!==searchCriterionObj[property]) continue playerSearch;
                        }
                        results.add(player);
                      }
        return results;
    }
     
    function Player({firstName,lastName,preferredName,comment}={}){
        let values = {firstName,lastName,preferredName,comment};

        if(values.firstName===undefined || values.lastName===undefined) UserError("Cannot create player no first or last name",{firstName,lastName});
       if(Player.search({firstName:values.firstName,lastName:values.lastName}).size>0) UserError("Cannot create player with same first and last name",{firstName,lastName});

       let myId=++id;
       allPlayers.set(this,new Set()) //Set of teams player is in
       defineGetter({obj:this,name:"firstName",func:()=>values.firstName});
       defineGetter({obj:this,name:"lastName",func:()=>values.lastName});
       defineGetter({obj:this,name:"preferredName",func:()=>values.preferredName});
       defineGetter({obj:this,name:"name",func:()=>`${values.firstName} ${(values.preferredName) ? `'${values.preferredName}'`:""} ${values.lastName}`});
       defineGetter({obj:this,name:"id",func:()=>myId});
       defineGetter({obj:this,name:"comment",func:()=>values.comment});
       defineGetter({obj:this,name:"teams",func:()=>new Set(allPlayers.get(this))});

        this.addTeam =(team)=>allPlayers.get(this).add(team);
        this.deleteTeam = (team)=>allPlayers.get(this).delete(team);
        this.deletePlayer = ()=>{
            const teams = allPlayers.get(this);
            for(const team of teams){
                team.removePlayer(this);
            }
            allPlayers.delete(this);
            values={firstName:"Deleted"}
        }
        this.removeTeam=function(team){
            allPlayers.get(this).delete(team);
        }
       this.updateSettings = function (newSettings={}){
            for(const property in newSettings){
                if(values.hasOwnProperty(property)){
                    values[property]=newSettings[property];
                }
            }
        }
    }

    Player.prototype ={
    }
    Player.prototype.constructor=Player;
    return Player;
})()



