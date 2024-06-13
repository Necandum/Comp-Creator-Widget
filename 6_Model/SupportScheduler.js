var SupportScheduler = (function () {
    function initiateDefaultOptions(options) {
        options.supportSource ??= {
            firstBlock: {
                inBlock: 0,
                externalAlts: undefined,
                backUp: -50
            },
            subsequentBlocks: {
                inBlock: undefined,
                internalAlts: 10,
                externalAlts: 0,
                previousRoundWinners: undefined,
                previousRoundLosers: 10,
                previousRoundParticipants: undefined,
                backUp: -50
            }
        }
        options.roles ??= [SupportScheduler.DUTY]

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

        function normaliseTeamReference(teamReference) {
            let normalisedTeamReference;
            if (teamReference instanceof Team) {
                normalisedTeamReference = new FakeLink({ source: teamReference })
            } else if (teamReference instanceof FakeLink) {
                normalisedTeamReference = teamReference
            } else {
                Break("Tried to normalise teamReference of unexpected format",teamReference)
            }
            return normalisedTeamReference
        }

        phaseRegistry.obtainAvailable = function obtainAvailable(timeSlot) {
            return this.get(timeSlot.scheduledItem.phase)?.obtainAvailable?.(timeSlot) ?? [];
        }
        serviceRegistry.setSupport = function setSupport(teamReference, timeSlot, role) {
            if(!(teamReference instanceof FakeLink)) Break("Team reference must be a FakeLink",teamReference);
            let phase = timeSlot.scheduledItem.phase;
            let serviceEntry = { teamReference, timeSlot, role, phase };
            this.get(teamReference).get(phase).get(role).push(serviceEntry);
            this.get(phase).get(teamReference).get(role).push(serviceEntry);

            clashRegistry.addCommitment(teamReference, timeSlot, e.SUPPORT_TEAMS);
        }
        serviceRegistry.induction = function induction(teamReference, phase) {
            if(!(teamReference instanceof FakeLink)) Break("Team reference must be a FakeLink",teamReference);
            let roleMap = new Map();
            for (const role of options.roles) {
                roleMap.set(role, [])
            }
            if (!this.has(teamReference)) this.set(teamReference, new Map())
            if (!this.get(teamReference).has(phase)) this.get(teamReference).set(phase, roleMap);

            if (!this.has(phase)) this.set(phase, new Map())
            if (!this.get(phase).has(teamReference)) this.get(phase).set(teamReference, roleMap)
            return true;
        }
        clashRegistry.addCommitment = function addCommitment(teamReference, timeSlot, role) {
            this.recordClash(teamReference,timeSlot,role);
            for (const [key, timeMap] of clashRegistry) {
                if (key === teamReference) continue;
                if (key.source instanceof Team) continue;
                if(!(key.source instanceof Game)&&!(key.source instanceof Phase)) Break("teamReference must be a Fakelink, and the source should be a Team or a Game or Phase.",{teamReference,timeSlot,role})
                if(key.source.testLinkForCollision(teamReference)) this.recordClash(teamReference,timeSlot,e.POTENTIAL_CLASH)
            }
            return true
        }
        clashRegistry.recordClash = function recordClash(teamReference, timeSlot, role){
            if(!(teamReference instanceof FakeLink)) Break("Team reference must be a FakeLink",teamReference);
            let clashMap = this.getTimeMap(teamReference);
            clashMap.set({ game: timeSlot.scheduledItem, role }, { startTime: timeSlot.startTime, endTime: timeSlot.endTime });
        }

        clashRegistry.induction = function induction(teamReference) {
            if(!(teamReference instanceof FakeLink)) Break("Team reference must be a FakeLink",teamReference);
            if (clashRegistry.has(teamReference)) return false;

            //Establish a clash to ensure a teamReference to a game/phase is not eligible for service before the game/phase they come from is finished
            if(teamReference.source instanceof Game){
                for(const inLink of teamReference.source.incomingLinks){
                    if(inLink.source instanceof Team){
                        continue;
                    } else if(inLink.source instanceof Game){
                        let fakeTimeSlot = {scheduledItem:"Parent Game unfinished",startTime:0,endTime:simplifiedFieldSchedule.index.get(inLink.source).endTime};
                        this.recordClash(teamReference,fakeTimeSlot,"Parent Game unfinished");
                    } else if(inLink.source instanceof Phase){
                        let fakeTimeSlot = {scheduledItem:"Parent Phase unfinished",startTime:0,endTime:simplifiedFieldSchedule.phaseEndTimes.get(inLink.source)};
                        this.recordClash(teamReference,fakeTimeSlot,"Parent Phase unfinished");
                    } else {
                        Break("Error, incoming link source is not a Team/Game/Phase",{teamReference,inLink})
                    }
                }
            } else if(teamReference.source instanceof Phase){
                let fakeTimeSlot = {scheduledItem:"Phase unfinished",startTime:0,endTime:simplifiedFieldSchedule.phaseEndTimes.get(teamReference.source)};
                this.recordClash(teamReference,fakeTimeSlot,"Phase unfinished");
            }

            //Establish a clash for any existing clashRegistry entries that have the new addition as a possible clash
                for (const [game, timeSlot] of simplifiedFieldSchedule.index.entries()) {
                    if (!(game instanceof Game)) continue;
                    if (game.testLinkForCollision(teamReference)) {
                        clashRegistry.recordClash(teamReference, timeSlot, e.PLAYER);
                    }
                }
            return true;
        }
        clashRegistry.getTimeMap = function getTimeMap(teamReference) {
            teamReference = normaliseTeamReference(teamReference);
            if (!clashRegistry.has(teamReference)) clashRegistry.set(teamReference, new TimeMap())
            return clashRegistry.get(teamReference);
        }
       
        this.__phaseRegistry = phaseRegistry; // for debugging only

        //Identify teams suitable for support service for each phase(/block)
        for (const phase of comp.allPhasesArray) {
            //Predetermined Support Players
            if (phase.currentSettings.get(e.SUPPORT_SELECTION.description) === e.PREDETERMINED) {
                let phaseEntry = new Set();
                let allBlocks = phase.allBlocksArray;
                let phaseSupportTeams = phase.getSupportTeams();
                phaseRegistry.set(phase, phaseEntry);
                for (const team of phaseSupportTeams) {
                    let teamReference = normaliseTeamReference(team)
                    phaseEntry.add(teamReference);
                    serviceRegistry.induction(teamReference, phase)
                    clashRegistry.induction(teamReference)
                }
                phaseEntry.obtainAvailable = findValidPredeterminedSupport;
                phaseEntry.supportOwed = Math.ceil(phase.allGamesInPhase.length / phaseSupportTeams.size)
            }
            //Support Players Determined as we go, with back-up
            if (phase.currentSettings.get(e.SUPPORT_SELECTION.description) === e.TOURNAMENT) {
                if (phase.allBlocksArray.length === 0) continue;

                let phaseEntry = new Map();
                phaseRegistry.set(phase, phaseEntry);
                phaseEntry.obtainAvailable = function (timeSlot) {
                    return phaseEntry.get(timeSlot.scheduledItem.block).obtainAvailable(timeSlot);
                }
                let phaseSupportTeams = phase.getSupportTeams();
                let allBlocks = phase.allBlocksArray;
                //Set-up back-up teams
                for (const team of phaseSupportTeams) {
                    let teamReference = normaliseTeamReference(team);
                    serviceRegistry.induction(teamReference, phase);
                    clashRegistry.induction(teamReference);
                }

                //Create potential for first blocks
                firstBlock: {
                    let potentialSupports = new UniqueSourceRankRegistry();
                    let block = allBlocks[0];
                    if (options.supportSource.firstBlock.inBlock !== undefined) {
                        for (const inLink of block.incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: inLink.sourceRank, startingScore: options.supportSource.firstBlock.inBlock }));
                        }
                    }
                    if (options.supportSource.firstBlock.externalAlts !== undefined) {
                        for (const inLink of block.incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.firstBlock.externalAlts }));
                        }
                    }
                    if (options.supportSource.firstBlock.backUp !== undefined) {
                        for (const team of phaseSupportTeams) {
                            potentialSupports.add(new FakeLink({ source: team, startingScore: options.supportSource.firstBlock.backUp }));
                        }
                    }

                    let blockEntry = potentialSupports.uniqueArray;
                    blockEntry.supportOwed = Math.ceil(block.allGamesArray.length / blockEntry.size)
                    blockEntry.obtainAvailable = findValidTournamentSupport;
                    phaseEntry.set(block, blockEntry);
                }

                //Create potentials for subsequent blocks
                subsequentBlocks: for (let i = 1; i < allBlocks.length; i++) {
                    const block = allBlocks[i];
                    let potentialSupports = new UniqueSourceRankRegistry();
                    if (options.supportSource.subsequentBlocks.inBlock !== undefined) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            potentialSupports.add(new FakeLink({ source: inLink.source, sourceRank: inLink.sourceRank, startingScore: options.supportSource.subsequentBlocks.inBlock }));
                        }
                    }
                    if (options.supportSource.subsequentBlocks.internalAlts !== undefined) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            if (inLink.source.phase !== phase) continue;
                            let newFakeLink = new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.subsequentBlocks.internalAlts })
                            if (block.hasIncomingLink(newFakeLink)) continue
                            potentialSupports.add(newFakeLink);
                        }
                    }
                    if (options.supportSource.subsequentBlocks.externalAlts !== undefined) {
                        for (const inLink of allBlocks[i].incomingLinks) {
                            if (inLink.source.phase === phase) continue;
                            let newFakeLink = new FakeLink({ source: inLink.source, sourceRank: (inLink.sourceRank === 1) ? 2 : 1, startingScore: options.supportSource.subsequentBlocks.externalAlts });
                            if (block.hasIncomingLink(newFakeLink)) continue
                            potentialSupports.add(newFakeLink);
                        }
                    }
                    if (options.supportSource.subsequentBlocks.previousRoundLosers !== undefined) {
                        for (const prevGame of allBlocks[i - 1].allGamesArray) {
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank: 2, startingScore: options.supportSource.subsequentBlocks.previousRoundLosers }));
                        }
                    }
                    if (options.supportSource.subsequentBlocks.previousRoundWinners !== undefined) {
                        for (const prevGame of allBlocks[i - 1].allGamesArray) {
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank: 1, startingScore: options.supportSource.subsequentBlocks.previousRoundWinners }));
                        }
                    }
                    if (options.supportSource.subsequentBlocks.previousRoundParticipants !== undefined) {
                        for (const prevGame of allBlocks[i - 1].allGamesArray) {
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank: 1, startingScore: options.supportSource.subsequentBlocks.previousRoundParticipants }));
                            potentialSupports.add(new FakeLink({ source: prevGame, sourceRank: 2, startingScore: options.supportSource.subsequentBlocks.previousRoundParticipants}));
                        }
                    }
                    if (options.supportSource.firstBlock.backUp !== undefined) {
                        for (const team of phaseSupportTeams) {
                            potentialSupports.add(new FakeLink({ source: team, startingScore: options.supportSource.firstBlock.backUp }));
                        }
                    }

                    let blockEntry = potentialSupports.uniqueArray;
                    blockEntry.supportOwed = Math.ceil(block.allGamesArray.length / blockEntry.size);
                    blockEntry.obtainAvailable = findValidTournamentSupport;
                    phaseEntry.set(allBlocks[i], blockEntry);
                }
                //Induct all potentials
                for (const [block, blockEntry] of phaseEntry) {
                    // console.log("Block",block.id)
                    for (const teamReference of blockEntry) {
                        // console.log("Induction Link:",fakeLink.name)
                        if(!(teamReference instanceof FakeLink)) Break("Team references must be a fakelink", {teamReference,blockEntry,block,phaseEntry})
                        serviceRegistry.induction(teamReference, phase);
                        clashRegistry.induction(teamReference);
                    }
                }
            }
        }



        this.getCompleteSchedule = function completeFieldSchedule() {
            for (const timeSlot of simplifiedFieldSchedule.index.values()) {
                if (!(timeSlot.scheduledItem instanceof Game)) continue

                let availableTeamScores = phaseRegistry.obtainAvailable(timeSlot);
                availableTeamScores = serialScoring(availableTeamScores, timeSlot, [scrPreviousService, scrPreferActive, scrEnsureBreak, scrOptional]);
                // console.log(timeSlot.scheduledItem.name, availableTeamScores.map(x => `${x.team.name}:${x.score}`))  

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
            CodeObserver.Creation({mark:UIManager.ScheduleSettings,newObject:simplifiedFieldSchedule});
            return simplifiedFieldSchedule;
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
                    if (timeTilActive <= timeSlot.length*0.9) {
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
            let { startTime, endTime } = timeSlot;
            for (const team of this) {
                let gap = clashRegistry.getTimeMap(team).findGap(startTime);
                if (gap.startTime === false) continue
                if (gap.startTime <= startTime && gap.endTime >= endTime) {
                    validSupportScores.push({ team, gap, score: 0 });
                }
            }
            validSupportScores.supportOwed = this.supportOwed;
            return validSupportScores;
        }
        function findValidTournamentSupport(timeSlot) {
            let validSupportScores = []
            let { startTime, endTime } = timeSlot;
            for (const teamReference of this) {
                let gap = clashRegistry.getTimeMap(teamReference).findGap(startTime);
                if (gap.startTime === false) continue
                if (gap.startTime <= startTime && gap.endTime >= endTime) {
                    validSupportScores.push({ team: teamReference, gap, score: teamReference.startingScore});
                }
            }
            validSupportScores.supportOwed = this.supportOwed;
            return validSupportScores;
        }

    }

var FakeLink = (function(){ 
let uniqueRegistry = new UniqueSourceRankRegistry(FakeLink);

    function FakeLink({ source, sourceRank, startingScore }){
        if (source instanceof Team) {
            sourceRank = 'Team';
        } else {
            sourceRank ??= 1;// the rank of the game in the outcome of the source. Indexed at 1;
            sourceRank = parseInt(sourceRank);
        }

        this.source = source;
        this.sourceRank = sourceRank;
        this.startingScore = startingScore ?? 0;
        this.name = `${this.source.name} (${this.sourceRank})`

        return uniqueRegistry.add(this)
    }

return FakeLink
})()

    return SupportScheduler
})()