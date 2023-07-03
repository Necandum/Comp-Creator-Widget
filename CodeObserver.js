
/**
 * @typedef CodeObserver
 * @property {(mark:Object)=>undefined} register
 * @property {(mark,handler)} addHandler
 * @property {function} removeHandler
 * @property {function} distributeObservation
 * @property {({mark,currentFunction,currentObject})} Execution - Merely messages that a function executed. 
 * 
 */

/**
 * @type {CodeObserver}
*/

var CodeObserver = (function(){ 

  
    let registry = new Map(); 

    let CodeObserver = {
        
        register(mark){
            if(!registry.has(mark)) registry.set(mark,[]);
        },
        addHandler(mark,handler){
            if(!registry.has(mark)) {   
                this.register(mark);                
                Alert("Mark doesn't exist",{mark,handler,registry});
            }
            if(!(typeof handler === 'function')) Break("Handler must be a function",{mark, handler,registry});
            let updatedArray = registry.get(mark);
            updatedArray.push(handler)
            registry.set(mark,updatedArray );
        },
        removeHandler(mark,handler){
            if(!registry.has(mark)) Break("Mark doesn't exist",{mark,handler,registry});
            registry.set(mark, registry.get(mark).filter((value)=>value!==handler));
        },
        distributeObservation(mark,observation){
            let allHandlers = registry.get(mark);
            for(const handler of allHandlers){
                handler(observation);
            }
        }

    }
    //Informers, each returns unique observations for handlers. 


    CodeObserver.Execution = function Execution({mark,currentFunction,currentObject}={}){
        if(!registry.has(mark)) CodeObserver.register(mark);
        let observation = arguments[0];
        CodeObserver.distributeObservation(mark,observation);
    }
Object.freeze(CodeObserver);
return CodeObserver
})()

