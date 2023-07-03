var Team = (function () {
    let id = 0;
    let allTeams = new Map();
    defineGetter({ obj: Team, name: "allTeams", func: () => new Map(allTeams.entries())});

    function Team(name = `Unnamed ${id + 1}`) {
        if (allTeams.has(name)) throw new Error('Team name already exists');
        let myId = ++id;
        let teamPlayers = new Map();
        let teamJerseyNumbers = new Map();


        allTeams.set(name,this)
        defineGetter({ obj: this, name: "name", func: () => name });
        defineGetter({ obj: this, name: "id", func: () => myId });
        defineGetter({ obj: this, name: "players", func: () => new Map(teamPlayers.entries())});
        this.deleteTeam = function(){
            allTeams.delete(this.name);
        }
        this.changeDetail = function changeDetail(detail, newValue) {
            switch (detail) {
                case e.NAME:
                    if (allTeams.has(name)) throw new Error('Team name already exists');
                    allTeams.delete(name);
                    allTeams.set(newValue,this);
                    name = newValue;
                    CodeObserver.Execution({mark:Team,currentFunction:changeDetail,currentObject:this});
                    break;
            }
        }

        this.addPlayer = function (player,jerseyNumber) {
            if(!(player instanceof Player)) throw new Error('Not a Player');
            if(teamJerseyNumbers.has(jerseyNumber)) throw new Error ("Jersey Number Taken")
            if(teamPlayers.has(player)) throw new Error("Team already has player")

            teamPlayers.set(player,jerseyNumber);
            teamJerseyNumbers.set(jerseyNumber,player);

            return this
         }

        this.removePlayer = function (player) {
            if(!(player instanceof Player)) throw new Error('Not a Player');

            teamJerseyNumbers.delete(teamPlayers.get(player))
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

