

comp.newPhase("RoundRobin")
comp.newPhase("Tournament")
comp.newPhase("Losing Tournament")
comp.newPhase("To Delete")

let amber = new Team("Amber");
let bling = new Team("Bling");
let coast = new Team("Coast");
let dragon = new Team("Dragon");

comp.removePhase(comp.allPhasesArray[3]);

let roundRobin = comp.allPhasesArray[0];
let tournament = comp.allPhasesArray[1];

roundRobin.newBlock().newGame().newIncomingLink({ source: amber }).target.newIncomingLink({ source: bling });
roundRobin.allBlocksArray[0].newGame().newIncomingLink({ source: roundRobin.allGamesInPhase[0] }).target.newIncomingLink({ source: dragon });
roundRobin.changeSetting(e.PRIORITY, 2);
roundRobin.newBlock().newGame().newIncomingLink({ source: dragon }).target.newIncomingLink({ source: amber });

tournament.changeSetting(e.PRIORITY, 5);
tournament.newBlock().newGame().newIncomingLink({ source: bling }).target.newIncomingLink({ source: coast }).target
    .parent.newGame().newIncomingLink({ source: coast }).target.newIncomingLink({ source: dragon }).target
    .parent.newGame().newIncomingLink({ source: amber }).target.newIncomingLink({ source: bling }).target
    .parent.parent.newBlock()
    .newGame().newIncomingLink({ source: dragon }).target.newIncomingLink({ source: bling });

let games = comp.allPhasesArray[0].allGamesInPhase;



let s = new Scheduler(comp, 9);
s.scheduleAll();



