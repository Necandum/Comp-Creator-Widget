function DupleSet(dupleArray=[]){
    const duples = new Set();
    const index = new Map();
    
    if(dupleArray instanceof DupleSet) dupleArray = dupleArray.entries();
    for(let duple of dupleArray){
        addDuple(...duple);
    }
    
    defineGetter({obj:this,name:"size",func:()=>this.entries().length});

    this.add = addDuple;
    function addDuple(x,y){
            if(!Number.isInteger(x) || !Number.isInteger(y)) Break("Both members of duple must be integers",{x,y,duples,index})
            const duple = [x,y];
            if(!index.has(x)) index.set(x,new Map());
            if(!index.has(y)) index.set(y,new Map());

            if(index.get(x).has(y)) return false 

            index.get(x).set(y,duple)
            index.get(y).set(x,duple)
            duples.add(duple);
        return duple;
    };

    this.delete = function deleteDuples(x,y){
        if(Array.isArray(x)){
            for(const [a,b] of x){
                removeDuple(a,b)
            }
        } else if (x instanceof DupleSet){
            for(const [a,b] of x.entries()){
                removeDuple(a,b)
            }
        } else if(Number.isInteger(x) && Number.isInteger(y)){
           return removeDuple(x,y);
        }
    }
    
    function removeDuple(x,y){
            const duple = index.get(x)?.get(y);
            if(!duple) return false;

            duples.delete(duple);
            index.get(x).delete(y);
            index.get(y).delete(x);
        return true;
    };

    this.has = function hasDuple(x,y){
        if(y===undefined){
            return index.has(x);
        } else {
            return index.get(x)?.has(y) ?? false;
        }

    }

    this.get = function getDuple(x,y){
        const duple = index.get(x)?.get(y);
        return duple ?? false;
    }
    this.getMissing = function getMissingIntegers(start,end){
        const missingIntegers = [];
        for(let i=start;i<=end;i++){
            if(!this.has(i)) missingIntegers.push(i);
        }
        return missingIntegers;
    }

    this.entries = function getAllDuples(){
        return Array.from(duples);
    }
    this.all = function getAllIntegers(){
        return Array.from(index.keys())
    }
    
    this.getComplements = function getComplement(int,options={}){
        if(!this.has(int)) return false;

        const {exclusions=[]} = options;
        const possibleDuples = new Set();
        for(let complement of index.get(int).keys()){
            if(exclusions.indexOf(complement)>-1) continue;
            possibleDuples.add(this.get(int,complement));
        }
        return (possibleDuples.size>0) ? Array.from(possibleDuples): false;
    }

    this.getConsecutiveUnique = function* getConsecutiveUnique(start,end,options={}){ // desinged with even range in mind
        const {allowFailure,allowDuplicates,limitSetSize}=options;
        let   bestEffort = new DupleSet();
        const availableDuples = new DupleSet(this);
        const rangeLength = end-start+1;
      circuit: while (true) {
           offset: for(let offset =0;offset<(rangeLength);offset++){
            let currentDuples = new DupleSet();
                for(let i = start; i<=end;i++){
                    let initial = i + offset;
                    if(initial>end) initial = initial - rangeLength;
                    if(currentDuples.has(initial)) continue;
                    const chosenDuple = availableDuples.getComplements(initial,{exclusions:currentDuples.all()})?.[0]
                    if(!chosenDuple){
                        continue offset;
                    }
                    currentDuples.add(...chosenDuple);
                    bestEffort = (currentDuples.entries().length>bestEffort.entries().length) ? currentDuples: bestEffort;
                }
                availableDuples.delete(currentDuples);
                bestEffort= new DupleSet();
                yield currentDuples.entries();
                continue circuit
            }   
            if(allowFailure && bestEffort.size>0){
                if(allowDuplicates){
                    const missingIntegers = bestEffort.getMissing(start,end).reverse(); // reversed so that if null added to team array, used first
                    let additions = (limitSetSize) ? Math.ceil(missingIntegers.length/2): missingIntegers.length;
                    for(missingInt of missingIntegers){
                        const chosenDuple = availableDuples.getComplements(missingInt)?.[0]
                        if(chosenDuple){
                            bestEffort.add(...chosenDuple);
                            additions--
                            if(additions===0) break;
                        }
                    }
                }
                availableDuples.delete(bestEffort);
                yield bestEffort.entries();
                bestEffort= new DupleSet();
                continue circuit;
            }
            
            return false;
        }
        
    }

}

DupleSet.createAllPossible= function createAllPossible(low,high){
    let newDupleArray =[]
    for(let i = low;i<high;i++){
        for(let j = i+1;j<=high;j++){
            newDupleArray.push([i,j]);
        }
    }
    return new DupleSet(newDupleArray);
}