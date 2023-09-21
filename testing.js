new Player({firstName:"A",lastName:"a"})
new Player({firstName:"O",lastName:"a"})
new Player({firstName:"E",lastName:"a"})
new Player({firstName:"U",lastName:"a"})

let diva = new Division({name:"A"})
let divaa = new Division({name:"A.A"})
let divab = new Division({name:"A.B"})
let divaaa=new Division({name:"A.A.A"});
diva.add(divaa);
diva.add(divab);
divaa.add(divaaa);

let t1 = new Team({name:"1"})
let t2 = new Team({name:"2"})
let t3 = new Team({name:"3"})
let t4 = new Team({name:"4"})
let t5 = new Team({name:"5"})
let t6 = new Team({name:"6"})
let t7 = new Team({name:"7"})
let t8 = new Team({name:"8"})

diva.add(t1)
diva.add(t2)
divaa.add(t3)
divab.add(t4)
divaaa.add(t5)

for(const nav of document.querySelectorAll("div.navigationContainer")){
    nav.func.refreshAll()
}

let comp = new Competition({name:"All sharks"});
let phase = comp.newPhase("Yay");
let block = phase.newBlock("Yo ^2");
let game = block.newGame();
block.newGame();
