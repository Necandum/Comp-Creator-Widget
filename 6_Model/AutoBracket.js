var AutoBracket = {
    generate(generationFunction,options,teamsArray,phasesArray){
        return generationFunction(options,teamsArray,phasesArray);
    },

    roundRobin(options,teams){
        const {phaseName} = options;
        const phase = Competition.current.newPhase(phaseName,e.ROUND_ROBIN);
        //Phase settings set here
        
        
        if(teams.length % 2 !==0){
            teams.push(null);
        }
        const teamCount = teams.length; //null team results in bye, skipped during game production
        const blockCount = teamCount-1;
        const allPossibleIndexPairings = DupleSet.createAllPossible(0,teamCount-1);
        const pairingsGen = allPossibleIndexPairings.getConsecutiveUnique(0,teamCount-1,options);
        for(let i = 0;i<blockCount;i++){
                const block = phase.newBlock();
                const pairings = pairingsGen.next().value;
                if(!pairings) Break("Whoops, too many block",{pairings})
                for(const [teamX,teamY] of pairings){
                    gameFromPairing(teamX,teamY,block);
                }

        }
        //If impossible to fit into the assigned blocks
        let remainder;
        while(remainder = pairingsGen.next().value){
            for(const [teamX,teamY] of remainder){
                gameFromPairing(teamX,teamY,phase.allBlocksArray.at(-1));
            }
        }

        function gameFromPairing(teamX,teamY,block){
            const primaryTeam = teams[teamX];
            const secondaryTeam = teams[teamY];
                    if(primaryTeam===null || secondaryTeam ===null ) return
                    const game = block.newGame();
                    game.newIncomingLink({source:secondaryTeam})
                    game.newIncomingLink({source:primaryTeam})
        }
        return phase
    }
}

