new Player({firstName:"A",lastName:"a"})
new Player({firstName:"O",lastName:"a"})
new Player({firstName:"E",lastName:"a"})
new Player({firstName:"U",lastName:"a"})

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

let comp = new Competition({name:"All sharks"});
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
let teamNum = 6
let teamSet = new Set();
for(let i=0;i<teamNum;i++){
    let name = `T${i+1}`;
   teamSet.add(new Team({name}));
}
console.time()
let roundRobinPhase = AutoBracket.generate(AutoBracket.roundRobin,{phaseName:"Good Job",allowFailure:true,allowDuplicates:true,limitSetSize:true},Team.allTeamsArray);
roundRobinPhase.updateSettings({[e.SUPPORT_TEAMS.description]:teamSet});
// AutoBracket.generate(AutoBracket.roundRobin,{phaseName:"Good Job"},Team.allTeamsArray)
console.timeEnd()
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