var CSVGenerator = (function(){ 

    function csvMaker(arr=[]){
        let data ='';
        for(const row of arr){
            for(let col of row){
                col = (col) ? col:"";
              //  data += `"${col.toString().replace(/"/g,'""')}",`
                  data += `${col.toString().replace(/"/g,'""')},` // comp creator appears not to like escaped values
            }
            data+="\n"
        }
        let blob = new Blob([data],{type:"data:text/csv;charset=utf-8,"})
        return blob
    }

    function makeTeamCSVArray(){
        let allTeamsArr = Array.from(Team.allTeams.values());
        let teamsCSVArray=[]
        for(const team of allTeamsArr){
            let teamRow =[];
            teamRow[0]="Div"
            teamRow[1]=team.name;

            let teamPlayers = Array.from(team.players.keys())
            let i = 2;
            if(teamPlayers.length===0){
                teamRow[i] = "X"
            } else {
                for(const player of teamPlayers){
                    teamRow[i]=player.name;
                    i++;
                }
            }
            teamsCSVArray.push(teamRow);
        }
        return teamsCSVArray;
    }

    function makeDrawCSVArray(simpleSchedule=[]){
        let drawArray=[]
        for(let i =1;i<simpleSchedule.length;i++){
            const field = simpleSchedule[i];
            for(const timeSlot of field){
                if(!(timeSlot.scheduledItem instanceof Game)) continue;
                let game = timeSlot.scheduledItem;
                let poolName = (game.phase.phaseType === e.ROUND_ROBIN) ? game.phase.name : game.name;
                let team1 = (game.incomingLinks[0].source instanceof Team) ? game.incomingLinks[0].source.name:
                                                                                     linkingFormat(game.incomingLinks[0]);

                let team2 = (game.incomingLinks[1].source instanceof Team) ? game.incomingLinks[1].source.name:
                                                                                      linkingFormat(game.incomingLinks[1]);
                let ref1, ref2,duty;
                if(timeSlot.supportRoles.has(SupportScheduler.REF1)){
                    let assignedTeam = timeSlot.supportRoles.get(SupportScheduler.REF1)
                    ref1 = (assignedTeam.source instanceof Team) ? assignedTeam.source.name: linkingFormat(assignedTeam);
                }
                if(timeSlot.supportRoles.has(SupportScheduler.REF2)){
                    let assignedTeam = timeSlot.supportRoles.get(SupportScheduler.REF2)
                    ref2 = (assignedTeam.source instanceof Team) ? assignedTeam.source.name: linkingFormat(assignedTeam);
                }
                if(timeSlot.supportRoles.has(SupportScheduler.DUTY)){
                    let assignedTeam = timeSlot.supportRoles.get(SupportScheduler.DUTY)
                    console.log("Assigned team",assignedTeam)
                    if(assignedTeam){ 
                        duty = (assignedTeam.source instanceof Team) ? assignedTeam.source.name: linkingFormat(assignedTeam);
                    }
                }
                let gameArray = [
                convertDateToCompCreatorTimeString( new Date(timeSlot.absoluteStartTime)),
                timeSlot.fieldNumber.toString(),
                poolName.toString(),
                team1,
                team2,
                ref1??"X",
                ref2??"X",
                duty??"X"
                ]
                drawArray.push(gameArray);
            }
            console.log(drawArray)
        }
        return drawArray
    }
    function linkingFormat(link){
        return `_${intToOrdinal(link.sourceRank)}::${link.source.name}_`;
    }
    function convertDateToCompCreatorTimeString(date){
        let year = date.getUTCFullYear();
        let month = (date.getUTCMonth()+1).toString().padStart(2,'0');
        let day = date.getUTCDate().toString().padStart(2,'0');
        let hour = date.getUTCHours();
        let minutes = date.getUTCMinutes().toString().padStart(2,'0');
        let halfDay = (hour>11) ? "pm":"am";

        hour = (hour>12) ? hour-12: hour;
        hour = hour.toString().padStart(2,'0')

        return `${year}-${month}-${day} ${hour}:${minutes}${halfDay}`
    }

    let CSVGenerator={
        teamCSV(){
            return csvMaker(makeTeamCSVArray())
        },
        drawCSV(simpleSchedule){
            return csvMaker(makeDrawCSVArray(simpleSchedule))
        }
    }
     

return CSVGenerator
})()