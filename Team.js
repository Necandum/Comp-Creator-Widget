var Team = (function () {
    let id = 0;
    let allTeams = new Map();
    defineGetter({ obj: Team, name: "allTeams", func: () => new Map(allTeams.entries())});

    function Team({name = `Unnamed ${id + 1}`}) {
        if (allTeams.has(name)) throw new Error('Team name already exists');
        let myId = ++id;
        let teamPlayers = new Map();
        let teamJerseyNumbers = new Map();
        let divisions = new Set();


        allTeams.set(name,this)
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "players", func: () => new Map(teamPlayers.entries())});
        defineGetter({ obj: this, name: "ancestralLinks", func: () => new Set()});
        defineGetter({ obj: this, name: "divisions", func: () => new Set(divisions)});

        this.deleteTeam = function(){
            let players = teamPlayers.keys();

            for(const player of players){
                this.removePlayer(player);
            }
            for(const division of divisions){
                division.remove(this);
            }
            allTeams.delete(this.name);
            name="Deleted";
        }
        this.updateSettings = function (newSettings) {
                if(newSettings.name!==undefined){
                    if (allTeams.has(newSettings.name)) throw new Error('Team name already exists');
                    allTeams.delete(name);
                    name = newSettings.name;
                    allTeams.set(name,this);
                    CodeObserver.Execution({mark:Team,currentFunction:this.updateSettings,currentObject:this});
                }
        }
        this.addToDivision=function(division){
            divisions.add(division);
        }
        this.removeFromDivision=function(division){
            divisions.delete(division);
        }
        this.addPlayer = function (player,jerseyNumber) {
            if(!(player instanceof Player)) throw new Error('Not a Player');
            if(!jerseyNumber) {
                jerseyNumber=1;
                teamJerseyNumbers.forEach((v,k,map)=>{if(map.has(jerseyNumber)) jerseyNumber++});
            }
            if(teamJerseyNumbers.has(jerseyNumber)) throw new Error ("Jersey Number Taken")
            if(teamPlayers.has(player)) throw new Error("Team already has player")

            teamPlayers.set(player,jerseyNumber);
            teamJerseyNumbers.set(jerseyNumber,player);
            player.addTeam(this);

            return true
         }

        this.removePlayer = function (player) {
            if(!(player instanceof Player)) throw new Error('Not a Player');

            teamJerseyNumbers.delete(teamPlayers.get(player));
            player.removeTeam(this);
            return teamPlayers.delete(player);
        }

        this.removePlayerJerseyNumber = function (player){
            if(!(player instanceof Player)) throw new Error('Not a Player');
            if(!teamPlayers.has(player)) throw new Error("No such player on team");

            teamJerseyNumbers.delete(teamPlayers.get(player))
            teamPlayers.set(player,"None Assigned")

            return this
        }

        this.changePlayerJerseyNumber = function (player,newNumber) {
            if(!(player instanceof Player)) throw new Error('Not a Player');
            if(!teamPlayers.has(player)) throw new Error("No such player on team");
            if(teamJerseyNumbers.has(newNumber)) throw new Error("Jersey Number Must be Unique")

            teamJerseyNumbers.delete(teamPlayers.get(player));
            teamPlayers.set(player,newNumber)
            teamJerseyNumbers.set(newNumber,player)
        }

        this.isPlayerOnTeam = function (player){
            if(!(player instanceof Player)) throw new Error('Not a Player');

            return teamPlayers.has(player)
        }

        this.addLink= function(link){
            
        }
        this.removeLink = function(link){
            
        }

        this.verifyLinks = function(link){

        }
        CodeObserver.Execution({mark:Team,currentFunction:Team,currentObject:this});
    }
    return Team
})()

