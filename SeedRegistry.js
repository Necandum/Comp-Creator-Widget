function SeedRegistry(linksArr =[]) {
    let registry = new Map();
    let seedReference = [];
    let noSeeds = new Set();
    let duplicateReference = new Set() //same source, different seeds
    let doublingUpOnSeed = new Set() // different sources, same seed
    let uniqueSeedArray =[];

    this.make = function makeSourceRegistryBySeed(){
    for(const link of linksArr){
       addLink(link);
    }
    uniqueSeedArray=[];
    seedReference.forEach((liArr)=>{
        if(liArr) uniqueSeedArray.push(liArr[0])
    });
        this.make =()=>({registry,seedReference,noSeeds,duplicateReference,doublingUpOnSeed,uniqueSeedArray})
        return  this.make();
    }

    function addLink(link){
       
        if(!Number.isInteger(link.seed)) { // must have seed
            noSeeds.add(link);
            return;
        }
        
        if (!registry.has(link.source)) registry.set(link.source, new Map())
        let linkRegistration = registry.get(link.source);
        if (!linkRegistration.has(link.sourceRank)) linkRegistration.set(link.sourceRank,new Map());
        let rankGroup = linkRegistration.get(link.sourceRank)

        if(!rankGroup.has(link.seed)) rankGroup.set(link.seed,{seedNumber:link.seed,linkList:[]})
        let seedGroup = rankGroup.get(link.seed);
        seedGroup.linkList.push(link)
        
        if(!seedReference[link.seed]) seedReference[link.seed] = [];
        seedReference[link.seed].push(link);

            let protoSeed = seedReference[link.seed][0]; //implies links from different sources have been assigned same seed
            if((link.source !== protoSeed.source) || (link.sourceRank !== protoSeed.sourceRank)){
                seedReference[link.seed].forEach(iLink=>doublingUpOnSeed.add(iLink));
            }
            if(rankGroup.size>1){ //implies two links with same source and rank, but different seeds
                for(const iSeedGroup of rankGroup.values()){
                    iSeedGroup.linkList.forEach((iLink)=>duplicateReference.add(iLink))
                }
            }
    }
}