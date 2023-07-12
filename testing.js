let mEvent = {
    click: new Event("click", { bubbles: true }),
    input: new Event("input", { bubbles: true }),
    focusOut: new Event("focusout", { bubbles: true }),
    focusIn: new Event("focusin", { bubbles: true })
}
let oLog ={};

let teams = {
  
}
newTeam("A")
newTeam("B")
newTeam("C")
newTeam("D")
newTeam("E")
newTeam("F")
newTeam("G")
newTeam("H")
let phases = {
}

let blocks = {
}

let games = {
}

function newTeam(name) {
    let teamInput = Array.from(document.querySelectorAll(".teamInput input")).at(-1);
    teamInput.dispatchEvent(mEvent.focusIn);
    teamInput.value = name;
    teamInput.dispatchEvent(mEvent.focusOut);
    let newTeam = Team.allTeams.get(name)
    teams[newTeam.id] = newTeam;
    return newTeam;
}

function newPhase({ name = "X", phaseType = e.ROUND_ROBIN, phasePriority = 1 } = {}) {

    let phase = comp.newPhase(name, phaseType);
    phase.changeSetting(e.PRIORITY, phasePriority);
    let phaseContainer = TableGenerator.bracketTable.phaseTemplate.build(comp.flesh, { creationCodeArg: phase })
    comp.flesh.append(phaseContainer)
    phases[phaseContainer.spirit.id] = phaseContainer.spirit;
    blocks[phaseContainer.spirit.id]={[phaseContainer.spirit.allBlocksArray[0].blockOrder]:phaseContainer.spirit.allBlocksArray[0]}
    games[phaseContainer.spirit.id]={
                        [phaseContainer.spirit.allBlocksArray[0].blockOrder]:{
                            [phaseContainer.spirit.allBlocksArray[0].allGamesArray[0].gameOrder]:phaseContainer.spirit.allBlocksArray[0].allGamesArray[0]
                        }};
                                      

    return phaseContainer.spirit;
}

function newBlock(phase) {
    let blockContainer = TableGenerator.bracketTable.blockTemplate.build(phase.flesh)
    phase.flesh.append(blockContainer)
    blocks[phase.id][blockContainer.spirit.blockOrder]= blockContainer.spirit;
    games[phase.id][blockContainer.spirit.blockOrder]={[blockContainer.spirit.allGamesArray[0].gameOrder]:blockContainer.spirit.allGamesArray[0]}
    return blockContainer.spirit;
}

function newGame(block) {
    let gameContainer = TableGenerator.bracketTable.gameTemplate.build(block.flesh);
    block.flesh.append(gameContainer);
    games[block.parent.id][block.blockOrder][gameContainer.spirit.gameOrder] = gameContainer.spirit;
    return gameContainer.spirit;
}

function setLink(game, { index = 0, source,sourceRank=1 }) {
    let sourceTypeSelect = game.flesh.querySelectorAll(".sourceTypeSelect")[index];
    sourceTypeSelect.querySelector(`[data-source-type='${source.constructor.name}']`).selected = true;
    sourceTypeSelect.dispatchEvent(mEvent.input);
    let sourceSelect = game.flesh.querySelectorAll(".sourceSelect")[index];
    let sourceOption = sourceSelect.root.data.get(sourceSelect).get(source);
    sourceOption.selected = true;
    game.flesh.querySelectorAll(".sourceRankInput")[index].value=sourceRank;
    sourceSelect.dispatchEvent(mEvent.input)
}
Verification.pause();
newPhase({phaseType:e.TOURNAMENT,name:"T"})
newGame(blocks[1][1])
newBlock(phases[1])
newGame(blocks[1][2])
newBlock(phases[1])



newPhase({phaseType:e.ROUND_ROBIN,name:"RR"})
newGame(blocks[2][1])
newBlock(phases[2])
newGame(blocks[2][2])
newBlock(phases[2])
//Phase 1 Set links
setLink(games[1][1][1], { index: 0, source: teams[1] })
setLink(games[1][1][1], { index: 1, source: teams[2] })
setLink(games[1][1][2], { index: 0, source: teams[3] })
setLink(games[1][1][2], { index: 1, source: teams[4] })

setLink(games[1][2][1], { index: 0, source: games[1][1][1],sourceRank:1 })
setLink(games[1][2][1], { index: 1, source: games[1][1][1],sourceRank:2 })
setLink(games[1][2][2], { index: 0, source: games[1][1][2],sourceRank:1 })
setLink(games[1][2][2], { index: 1, source: games[1][1][2],sourceRank:2 })

setLink(games[1][3][1], { index: 0, source: games[1][2][1],sourceRank:1 })
setLink(games[1][3][1], { index: 1, source: games[2][1][1],sourceRank:2 })
// //Phase 2 set links
setLink(games[2][1][1], { index: 0, source: teams[5] })
setLink(games[2][1][1], { index: 1, source: teams[6] })
setLink(games[2][1][2], { index: 0, source: teams[7] })
setLink(games[2][1][2], { index: 1, source: teams[8] })

setLink(games[2][2][1], { index: 0, source: games[2][1][1],sourceRank:1 })
setLink(games[2][2][1], { index: 1, source: games[2][1][1],sourceRank:2 })
setLink(games[2][2][2], { index: 0, source: games[1][1][2],sourceRank:1 })
setLink(games[2][2][2], { index: 1, source: games[1][1][2],sourceRank:2 })

setLink(games[2][3][1], { index: 0, source: games[1][2][1],sourceRank:1 })
setLink(games[2][3][1], { index: 1, source: games[1][2][2],sourceRank:1 })

Verification.unPause();

// s.scheduleAll();



let a = new TimeMap();
a.set("1",{startTime:0,endTime:50})
a.set("2",{startTime:30,endTime:50})
a.set("3",{startTime:50,endTime:75})
a.set("3.1",{startTime:51,endTime:75})
a.set("4",{startTime:80,endTime:101})
a.set("4.1",{startTime:80,endTime:100})
a.set("5",{startTime:100,endTime:120})
a.set("6",{startTime:150,endTime:160})
a.set("7",{startTime:155,endTime:190})
a.set("8",{startTime:156,endTime:300})
a.set("9",{startTime:200,endTime:280})

// console.log(a.findOverlap(50),"overal 50");
// console.log(a.findOverlap(76),"overlap 76");
// console.log(a.findOverlap(250),"overlap 250");
console.log(a.findGap(50))
console.log(a.findGap(80))
console.log(a.findGap(130))
console.log(a.findGap(200))
a.delete("8")
console.log(a.findGap(200))
a.set("8",{startTime:156,endTime:400})
a.set("8",{startTime:410,endTime:20})
console.log(a.findGap(200))