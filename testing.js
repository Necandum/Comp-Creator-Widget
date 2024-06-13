new Player({firstName:"Alphie",lastName:"Smith"})
new Player({firstName:"Bob",lastName:"Smith"})
new Player({firstName:"Charlie",lastName:"Smith"})
new Player({firstName:"Doubles",lastName:"Smith"})
new Player({firstName:"John",lastName:"Smith"})
new Player({firstName:"Alfred",lastName:"Noble"})

// let diva = new Division({name:"A"})
// let divaa = new Division({name:"A.A"})
// let divab = new Division({name:"A.B"})
// let divaaa=new Division({name:"A.A.A"});
// diva.add(divaa);
// diva.add(divab);
// divaa.add(divaaa);

// let t1 = new Team({name:"1"})
// let t2 = new Team({name:"2"})
// let t3 = new Team({name:"3"})
// let t4 = new Team({name:"4"})
// let t5 = new Team({name:"5"})
// let t6 = new Team({name:"6"})
// let t7 = new Team({name:"7"})
// let t8 = new Team({name:"8"})

// diva.add(t1)
// diva.add(t2)
// divaa.add(t3)
// divab.add(t4)
// divaaa.add(t5)

for(const nav of document.querySelectorAll("div.navigationContainer")){
    nav.func.refreshAll()
}

let comp = new Competition({name:"Ballarat"});
// let d = DupleSet.createAllPossible(0,7);
// let dGen = d.getConsecutiveUnique(0,7);
// function tGen(){
//     let result = dGen.next()
//     console.log(result,result.value,result.done);
// }
// tGen();
// tGen();
// tGen();
// tGen();
// tGen();
// tGen();
// tGen();
// tGen();
let teamNum = 8
let teamSet = new Set();
let divA = new Division({name:"A"})
let divB = new Division({name:"B"})
for(let i=0;i<teamNum;i++){
    let name = `T${i+1}`;
    let newTeam = new Team({name})
    if(i<4) divA.add(newTeam);
    else divB.add(newTeam);
   teamSet.add(newTeam);
}

let gameNum = 4;
let blockNum =4

let phase = comp.newPhase("Double Bracket",e.TOURNAMENT);

for(let i=0;i<blockNum;i++){
    let block = phase.newBlock("B"+(i+1));
    for(let j=0;j<gameNum;j++){
        block.newGame();
    }
}

let teams = Array.from(teamSet);
let games = comp.allGamesArray;

games[0].newIncomingLink({source:teams[1]});
games[0].newIncomingLink({source:teams[0]});
games[1].newIncomingLink({source:teams[3]});
games[1].newIncomingLink({source:teams[2]});
games[2].newIncomingLink({source:teams[5]});
games[2].newIncomingLink({source:teams[4]});
games[3].newIncomingLink({source:teams[7]});
games[3].newIncomingLink({source:teams[6]});

//Second Block
games[4].newIncomingLink({source:games[1],sourceRank:1});
games[4].newIncomingLink({source:games[0],sourceRank:1});
games[5].newIncomingLink({source:games[3],sourceRank:1});
games[5].newIncomingLink({source:games[2],sourceRank:1});

games[6].newIncomingLink({source:games[1],sourceRank:2});
games[6].newIncomingLink({source:games[0],sourceRank:2});
games[7].newIncomingLink({source:games[3],sourceRank:2});
games[7].newIncomingLink({source:games[2],sourceRank:2});

//Third Block
games[8].newIncomingLink({source:games[5],sourceRank:1});
games[8].newIncomingLink({source:games[4],sourceRank:1});
games[9].newIncomingLink({source:games[7],sourceRank:1});
games[9].newIncomingLink({source:games[6],sourceRank:1});

games[10].newIncomingLink({source:games[5],sourceRank:2});
games[10].newIncomingLink({source:games[4],sourceRank:2});
games[11].newIncomingLink({source:games[7],sourceRank:2});
games[11].newIncomingLink({source:games[6],sourceRank:2});

//Fourth Block
games[12].newIncomingLink({source:games[9],sourceRank:1});
games[12].newIncomingLink({source:games[8],sourceRank:1});
games[13].newIncomingLink({source:games[11],sourceRank:1});
games[13].newIncomingLink({source:games[10],sourceRank:1});

games[14].newIncomingLink({source:games[9],sourceRank:2});
games[14].newIncomingLink({source:games[8],sourceRank:2});
games[15].newIncomingLink({source:games[11],sourceRank:2});
games[15].newIncomingLink({source:games[10],sourceRank:2});

// console.time()
// let roundRobinPhase = AutoBracket.generate(AutoBracket.roundRobin,{phaseName:"Good Job",allowFailure:true,allowDuplicates:true,limitSetSize:true},Team.allTeamsArray);
// roundRobinPhase.updateSettings({[e.SUPPORT_TEAMS.description]:teamSet});
// AutoBracket.generate(AutoBracket.roundRobin,{phaseName:"Good Job"},Team.allTeamsArray)
// console.timeEnd()
// let phase = comp.newPhase("Yay");
// let block = phase.newBlock();
// let game1 = block.newGame();

// let game2= block.newGame();
// let game3= block.newGame();
let time = new Date()
time.setHours(0,0,0,0);
time=time.getTime();
// oLog.calendar.func.addCalendarDisplay(time,1,1);

// console.log(new Date(getMsFromTimeString(getTimeStringFromMs(getMsFromTimeString("11:59:05.999")))).toUTCString());
// console.log(new Date(getMsFromTimeString(getTimeStringFromMs(getMsFromTimeString("11:59:05.999")))).getUTCMilliseconds());
// console.log(getMsFromTimeString("11:01:05.999"))
// console.log(getMsFromTimeString("11:01:05.998"))
// console.log(getTimeStringFromMs(getMsFromTimeString("11:01:05.999")))
// console.log(getTimeStringFromMs(getMsFromTimeString("11:01:05.998")))

// console.log(getDateStringFromUTCTime(getUTCTimeFromDateString(getDateStringFromUTCTime(getUTCTimeFromDateString("2023-01-15")))));