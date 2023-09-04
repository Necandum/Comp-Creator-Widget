new Player({firstName:"A",lastName:"a"})
new Player({firstName:"O",lastName:"a"})
new Player({firstName:"E",lastName:"a"})
new Player({firstName:"U",lastName:"a"})

let diva = new Division("A")
let divaa = new Division("A.A")
let divab = new Division("A.B")
let divaaa=new Division("A.A.A");
diva.add(divaa);
diva.add(divab);
divaa.add(divaaa);

let t1 = new Team("1")
let t2 = new Team("2")
let t3 = new Team("3")
let t4 = new Team("4")
let t5 = new Team("5")
let t6 = new Team("6")
let t7 = new Team("7")
let t8 = new Team("8")

diva.add(t1)
diva.add(t2)
divaa.add(t3)
divab.add(t4)
divaaa.add(t5)
getE("div.navigationPanel").func.openObject(Player);
oLog.testNav =(x)=> getE("div.navigationPanel").func.openObject(x);
