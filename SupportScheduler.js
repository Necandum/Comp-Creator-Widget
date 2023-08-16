var SupportScheduler = (function () {
    function initiateDefaultOptions(options) {
        options.supportSource ?? (options.supportSource = {
            firstBlock: {
                inBlock: 0,
                externalAlts: false,
                backUp: -50
            },
            subsequentBlocks: {
                inBlock: false,
                internalAlts: 10,
                externalAlts: 0,
                previousRoundWinners:false,
                previousRoundLosers:10,
                backUp: -50
            }
        })
        options.roles ?? (options.roles= [SupportScheduler.DUTY])

    }
    /**
     * @constructor
     * @enum REF1
     * @enum REF2
     * @enum DUTY
     */
    SupportScheduler["REF1"] = Symbol("Referee 1")
    SupportScheduler["REF2"] = Symbol("Referee 2")
    SupportScheduler["DUTY"] = Symbol("Duty")
    //options ={preferNotCompetingForDuty,supportSource = {firstBlock:{inBlock,internalAlts,externalAlts,backUp},subsquentBlocks:{inBlock,internalAlts,externalAlts,backUp}}
    function SupportScheduler(comp, simplifiedFieldSchedule, restrictions, options = {}) {
        let phaseRegistry = new Map();
        let serviceRegistry = new Map();
        let clashRegistry = new Map();
        initiateDefaultOptions(options);

        phaseRegistry.obtainAvailable = function obtainAvailable(timeSlot) {
            return this.get(timeSlot.scheduledItem.phase)?.obtainAvailable?.(timeSlot) ?? [];
        }
        serviceRegistry.setSupport = function setSupport(team, timeSlot, role) {
            // let currentRoleCount = this.get(team).get(timeSlot.scheduledItem.phase).get(role) ?? 0;
            // this.get(team).get(timeSlot.scheduledItem.phase).set(role, currentRoleCount + 1);
            // this.get(timeSlot.scheduledItem.phase).get(team).push({ timeSlot, role })
            let phase = timeSlot.scheduledItem.phase;
            let serviceEntry = {team,timeSlot,role,phase};
            this.get(team).get(phase).get(role).push(serviceEntry);
            this.get(phase).get(team).get(role).push(serviceEntry);

            clashRegistry.addCommitment(team, timeSlot, e.SUPPORT_TEAMS);
        }
        serviceRegistry.induction = function induction(team, phase) {
            let roleMap = new Map();
            for(const role of options.roles){
                roleMap.set(role,[])
            }
            if (!this.has(team))            this.set(team, new Map())
            if (!this.get(team).has(phase)) this.get(team).set(phase, roleMap);

            if (!this.has(phase))           this.set(phase, new Map())
            if (!this.get(phase).has(team)) this.get(phase).set(team, roleMap)
            return true;
        }
        clashRegistry.addCommitment = function addCommitment(teamReference, timeSlot, role) {
            let clashMap = this.getTimeMap(teamReference);
            clashMap.set({ game: timeSlot.scheduledItem, role }, { startTime: timeSlot.startTime, endTime: timeSlot.endTime })
            return true
        }
        clashRegistry.induction = function induction(teamReference) {
            if(teamReference?.source instanceof Team) teamReference = teamReference.source
            if (clashRegistry.has(teamReference)) return false;
            let role = e.PLAYER;
            if(teamReference instanceof Team){
                for (const [game, timeSlot] of simplifiedFieldSchedule.index.entries()) {
                    if (!(game instanceof Game)) continue;
                    if (game.ancestralSources.has(teamReference)) {
                        clashRegistry.addCommitment(teamReference, timeSlot, role)
                    }
                }
            } else {
                for (const [game, timeSlot] of simplifiedFieldSchedule.index.entries()) {
                    if (!(game instanceof Game)) continue;
                    // if(game.id===8) console.log("TestingLinks",game.testLinkForCollision(teamReference),teamReference.name)
                    if (game.testLinkForCollision(teamReference)) {
                        clashRegistry.addCommitment(teamReference, timeSlot, role)
                    }
                }
            }
            return true;
        }
        clashRegistry.getTimeMap = function getTimeMap(teamReference){
           if(teamReference?.source instanceof Team) teamReference = teamReference.source
           if(!clashRegistry.has(teamReference)) clashRegistry.set(teamReference,new TimeMap())
            return clashRegistry.get(teamReference);
        }
        this.__phaseRegistry = phaseRegistry;

        for (const phase of comp.allPhasesArray) {
            //Predetermined Support Players
            if (phase.currentSettings.get(e.SUPPORT_SELECTION) === e.PREDETERMINED) {
                let phaseEntry = new Set();
                let allBlocks = phase.allBlocksArray;
                let phaseSupportTeams = phase.currentSettings.get(e.SUPPORT_TEAMS);
                phaseRegistry.set(phase, phaseEntry);
                for (const team of phaseSupportTeams) {
                    phaseEntry.add(team);
                    serviceRegistry.induction(team, phase)
                    clashRegistry.induction(team)
                }
                phaseEntry.obtainAvailable = findValidPredeterminedSupport;
                phaseEntry.supportOwed = Math.ceil(phase.allGamesInPhase.length / phaseSupportTeams.size)
            }
            //Support Players Determined as we go, with back-up
            if (phase.currentSettings.get(e.SUPPORT_SELECTION) === e.TOURNAMENT) {
                if (phase.allBlocksArray.length === 0) continue;

                let phaseEntry = new Map();
                phaseRegistry.set(phase, phaseEntry);
                phaseEntry.obtainAvailable=function(timeSlot){
                    return phaseEntry.get(timeSlot.scheduledItem.block).obtainAvailable(timeSlot);
                }
                let phaseSupportTeams = phase.currentSettings.get(e.SUPPORT_TEAMS);
                let allBlocks = phase.allBlocksArray;
                //Set-up back-up teams
                for (const team of phaseSupportTeams) {
                    serviceRegistry.induction(team, phase);
                    clashRegistry.induction(team);
                }

                //Create potential for first blocks
                firstBlock: {
                    let potentialSupports = new UniqueSourceRankRegistry();
                    let block = allBlocks[0];
                    if (options.supportSource.firstBlock.inBlock !== false) {
                        for (const inLink of block.incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: inLink.sourceRank, startingScore: options.supportSource.firstBlock.inBlock }));
                        }
                    }
                    if (options.supportSource.firstBlock.externalAlts !== false) {
                        for (const inLink of block.incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.firstBlock.externalAlts }));
                        }
                    }
                    if (options.supportSource.firstBlock.backUp !== false) {
                        for (const team of phaseSupportTeams) {
                            potentialSupports.add(new FakeLink({ source: team,  startingScore: options.supportSource.firstBlock.backUp }));
                        }
                    }

                    let blockEntry = potentialSupports.uniqueArray;
                    blockEntry.supportOwed = Math.ceil(block.allGamesArray.length/blockEntry.size)
                    blockEntry.obtainAvailable = findValidTournamentSupport;
                    phaseEntry.set(block,blockEntry);
                }

                //Create potentials for subsequent blocks
                for (let i = 1; i < allBlocks.length; i++) {
                    const block = allBlocks[i];
                    let potentialSupports = new UniqueSourceRankRegistry();
                    if (options.supportSource.subsequentBlocks.inBlock !== false) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: inLink.sourceRank, startingScore: options.supportSource.subsequentBlocks.inBlock }));
                        }
                    }
                    if (options.supportSource.subsequentBlocks.internalAlts !== false) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            if(inLink.source.phase!==phase) continue;
                            let newFakeLink = new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.subsequentBlocks.internalAlts })
                            if(block.hasIncomingLink(newFakeLink)) continue
                            potentialSupports.add(newFakeLink);
                        }
                    }
                    if (options.supportSource.subsequentBlocks.externalAlts !== false) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            if(inLink.source.phase===phase) continue;
                            let newFakeLink = new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.subsequentBlocks.externalAlts });
                            if(block.hasIncomingLink(newFakeLink)) continue
                            potentialSupports.add(newFakeLink);
                        }
                    }
                    if (options.supportSource.subsequentBlocks.previousRoundLosers !== false) {
                        for (const prevGame of allBlocks[i-1].allGamesArray) {
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank:2, startingScore: options.supportSource.subsequentBlocks.previousRoundLosers }));
                        }
                    }
                    if (options.supportSource.subsequentBlocks.previousRoundWinners !== false) {
                        for (const prevGame of allBlocks[i-1].allGamesArray) {
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank:1, startingScore: options.supportSource.subsequentBlocks.previousRoundWinners }));
                        }
                    }
                    if (options.supportSource.firstBlock.backUp !== false) {
                        for (const team of phaseSupportTeams) {
                            potentialSupports.add(new FakeLink({ source: team, startingScore: options.supportSource.firstBlock.backUp }));
                        }
                    }

                    let blockEntry = potentialSupports.uniqueArray;
                    blockEntry.supportOwed = Math.ceil(block.allGamesArray.length/blockEntry.size);
                    blockEntry.obtainAvailable = findValidTournamentSupport;
                    phaseEntry.set(allBlocks[i],blockEntry);
                }
                //Induct all potentials
                for(const [block,blockEntry] of phaseEntry){
                    // console.log("Block",block.id)
                    for(const fakeLink of blockEntry){
                        fakeLink.name = `${fakeLink.source.name} (${fakeLink.sourceRank})`
                        // console.log("Induction Link:",fakeLink.name)
                        serviceRegistry.induction(fakeLink,phase);
                        clashRegistry.induction(fakeLink);
                    }
                }
            }
        }

     

        this.getCompleteSchedule = function completeFieldSchedule() {
            for (const timeSlot of simplifiedFieldSchedule.index.values()) {
                if (!(timeSlot.scheduledItem instanceof Game)) continue

                let availableTeamScores = phaseRegistry.obtainAvailable(timeSlot);
                availableTeamScores = serialScoring(availableTeamScores, timeSlot, [scrPreviousService, scrPreferActive, scrEnsureBreak, scrOptional]);
                console.log(timeSlot.scheduledItem.name,availableTeamScores.map(x => `${x.team.name}:${x.score}`))

                availableTeamScores.length = Math.min(options.roles.length, availableTeamScores.length);
                let gamePhase = timeSlot.scheduledItem.phase
                for (const role of options.roles) {
                    availableTeamScores.sort((a, b) => serviceRegistry.get(a.team)?.get(gamePhase)?.get(role).length ?? 0 - serviceRegistry.get(b.team)?.get(gamePhase)?.get(role).length ?? 0)
                    const chosenTeam = availableTeamScores.splice(0, 1)[0]?.team ?? null;
                    timeSlot.setSupportRole(role, chosenTeam);
                    if (chosenTeam) {
                        serviceRegistry.setSupport(chosenTeam, timeSlot, role);
                    }
                }
            }
        }

        function serialScoring(availableTeamScores, timeSlot, scoringFunctions) {
            for (const scoringFunction of scoringFunctions) {
                scoringFunction(availableTeamScores, timeSlot);
            }
            availableTeamScores.sort((a, b) => b.score - a.score)
            return availableTeamScores;
        }

        function scrPreviousService(availableTeamScores, timeSlot) {
            for (const availableTeamScore of availableTeamScores) {
                let supportOwed = availableTeamScores.supportOwed;
                let supportProvided = [...serviceRegistry.get(availableTeamScore.team).get(timeSlot.scheduledItem.phase).values()].reduce((cumulative, newVal) => cumulative + newVal.length, 0);
                let supportExcess = supportProvided - supportOwed
                if (supportExcess >= 0) {
                    availableTeamScore.score += (supportExcess === 0) ? -1000 : -10000;
                }
            }
        }
        function scrPreferActive(availableTeamScores, timeSlot) {
            for (const availableTeamScore of availableTeamScores) {
                if (availableTeamScore.gap.startTime !== 0) {
                    let timeSinceActive = timeSlot.startTime - availableTeamScore.gap.startTime;
                    let previousRole = availableTeamScore.gap.previousEntries[0]?.item.role;
                    if (timeSinceActive <= timeSlot.length * 0.7) {
                        availableTeamScore.score += (previousRole === e.SUPPORT_TEAMS) ? 100 : 50;
                    }
                    if (timeSinceActive > timeSlot.length * 0.7 && timeSinceActive <= timeSlot.length * 2) {
                        availableTeamScore.score += -20;
                    }
                    if (timeSinceActive > timeSlot.length * 2 && timeSinceActive <= timeSlot.length * 3) {
                        availableTeamScore.score += -10;
                    }
                    if (timeSinceActive > timeSlot.length * 2 && timeSinceActive <= timeSlot.length * 3) {
                        availableTeamScore.score += -5;
                    }
                }
            }
        }

        function scrEnsureBreak(availableTeamScores, timeSlot) {
            for (const availableTeamScore of availableTeamScores) {
                if (availableTeamScore.gap.endTime !== false) {
                    let timeTilActive = availableTeamScore.gap.endTime - timeSlot.endTime;
                    let nextRole = availableTeamScore.gap.nextEntries[0]?.item.role;
                    if (timeTilActive <= timeSlot.length) {
                        availableTeamScore.score += (nextRole === e.PLAYER) ? -2000 : 10;
                    }
                }
            }
        }
        function scrOptional(availableTeamScores, timeSlot) {
            if (options.preferNotCompetingForDuty === true) {
                for (const availableTeamScore of availableTeamScores) {
                    let absGapStartTime = availableTeamScore.gap.startTime + timeSlot.absoluteCompStartTime;
                    let absGapEndTime = availableTeamScore.gap.endTime + timeSlot.absoluteCompStartTime;
                    let timeSlotDate = new Date(timeSlot.absoluteStartTime)
                    if ((absGapStartTime < timeSlotDate.setHours(0, 0, 0, 0).getTime() || availableTeamScore.gap.startTime === 0) && (absGapEndTime > timeSlotDate.setHours(23, 59, 59, 999))) {
                        availableTeamScore.score += 2000
                    }
                }
            }
        }
        function findValidPredeterminedSupport(timeSlot) {
            let validSupportScores = []
            let {startTime,endTime} = timeSlot;
            for (const team of this) {
                let gap = clashRegistry.get(team).findGap(startTime);
                if (gap.startTime === false) continue
                if (gap.startTime <= startTime && gap.endTime >= endTime) {
                    validSupportScores.push({ team, gap, score: 0 });
                }
            }
            validSupportScores.supportOwed = this.supportOwed;
            return validSupportScores;
        }
        function findValidTournamentSupport(timeSlot){
            let validSupportScores = []
            let {startTime,endTime} = timeSlot;
            for (const fakeLink of this) {
                let gap = clashRegistry.getTimeMap(fakeLink).findGap(startTime);
                if (gap.startTime === false) continue
                if (gap.startTime <= startTime && gap.endTime >= endTime) {
                    validSupportScores.push({ team:fakeLink, gap, score: fakeLink.startingScore ?? 0 });
                }
            }
            validSupportScores.supportOwed = this.supportOwed;
            return validSupportScores;
        }

    }




    function makeFakeOutLinks(game, { includeWinner = true, includeLoser = true }) {
        let fakeLinks = [];
        for (const link of game.outgoingLinks) {
            if ((includeWinner === true && link.sourceRank == 1) || (includeLoser === true && link.sourceRank == 2)) {
                fakeLinks.push({ source: link.source, sourceRank: link.sourceRank });
            }
        }
        return fakeLinks
    }


    function makeFakeInLinks(game) {
        let fakeLinks = [];
        for (const link of game.incomingLinks) {
            fakeLinks.push({ source: link.source, sourceRank: link.sourceRank });
        }
        return fakeLinks
    }

    function FakeLink({source,sourceRank,startingScore}){
        if (source instanceof Team){ 
            sourceRank = 'Team';
        } else {    
            sourceRank ??= 1;// the rank of the game in the outcome of the source. Indexed at 1;
            sourceRank = parseInt(sourceRank);
        }

        this.source=source;
        this.sourceRank=sourceRank;
        this.startingScore = startingScore ?? 0;
    }

    return SupportScheduler
})()