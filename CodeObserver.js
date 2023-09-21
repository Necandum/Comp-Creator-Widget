
/**
 * @typedef CodeObserver
 * @property {(mark:Object,handlerGroupName:enum)=>undefined} register
 * @property {(handlerGroupName:enum,handlerArray:Array)=>undefined} registerHandlerGroup
 * @property {(handlerGroupName:enum,newMembers:Array,async:Boolean)=>undefined} addToHandlerGroup
 * @property {(mark,handler)} addHandler
 * @property {function} removeHandler
 * @property {function} distributeObservation
 * @property {({mark,currentFunction,currentObject})} Execution - Merely messages that a function executed. 
 * @property {({mark,constructor,newObject})} Creation - New object created from constructor
 */

/**
 * @type {CodeObserver}
*/
// NOTE: sync and async does NOT refer to any inherent qualities of the function. Any 'sync' handlers will be triggered synchronously at the point of the observer/informer in the code. 
// 'async' functions are made async artificially, and are added to the queue to be executed after synchronous code execution has finished. This makes their timing not-gaurenteed, 
// but does not mean that they are actually asynchronous in their procedures. 
var CodeObserver = (function(){ 

  
    let registry = new Map(); 
    let handlerRegistry = new Map();

    let CodeObserver = {
        
        register(mark,...handlerGroups){
            let handlerArray ={sync:[],async:[]}
            handlerArray.handlerGroups= [...handlerGroups]
            if(!registry.has(mark)) {
                registry.set(mark,handlerArray);
                    for(const handlerGroupName of handlerArray.handlerGroups){
                        if(!handlerRegistry.has(handlerGroupName)) this.registerHandlerGroup(handlerGroupName,{sync:[],async:[]})
                    }
            }
        },
        registerHandlerGroup(handlerGroupName,{sync=[],async=[]}){
            handlerRegistry.set(handlerGroupName,{sync,async});
        },
        addToHandlerGroup(handlerGroupName,newMembers=[],async){
            if(async){
                handlerRegistry.get(handlerGroupName).async.push(...newMembers);
            } else {
                handlerRegistry.get(handlerGroupName).sync.push(...newMembers);
           }
        },
        addHandler(mark,handler,async){
            if(!registry.has(mark)) {   
                this.register(mark);                
                Alert("Mark doesn't exist",{mark,handler,registry});
            }
            if(!(typeof handler === 'function')) Break("Handler must be a function",{mark, handler,registry});
           if(async){
            registry.get(mark).async.push(handler)
           } else {
            registry.get(mark).sync.push(handler)
           }
        },
        removeHandler(mark,handler){
            if(!registry.has(mark)) Break("Mark doesn't exist",{mark,handler,registry});
            let handlers = registry.get(mark);
            handlers.sync = handlers.sync.filter((value)=>value!==handler);
            handlers.async = handlers.async.filter((value)=>value!==handler);
        },
         distributeObservation:  async function(mark,observer,observation){
            let allHandlers =  registry.get(mark);

            for(const handler of allHandlers.sync){
                    handler(observer,observation);
            }
            
            for(const handlerGroupName of allHandlers.handlerGroups){
                let syncHandlerGroup = handlerRegistry.get(handlerGroupName).sync;
                syncHandlerGroup.forEach(handler => {
                    handler(observer,observation);
                });
            }

            allHandlers = await registry.get(mark);

            for(const handler of allHandlers.async){
                    handler(observer,observation);
            }
            for(const handlerGroupName of allHandlers.handlerGroups){
                let asyncHandlerGroup = handlerRegistry.get(handlerGroupName).async;
                asyncHandlerGroup.forEach(handler => {
                    handler(observer,observation);
                });
            }
        }

    }
    //Informers, each returns unique observations for handlers. 


    CodeObserver.Execution = function Execution({mark,currentFunction,currentObject,keyword}={}){
        CodeObserver.distributeObservation(mark,Execution,{mark,currentFunction,currentObject,keyword});
    }
    CodeObserver.Creation = function Creation({mark,newObject}){
        CodeObserver.distributeObservation(mark,Creation,{mark,newObject});
    }
Object.freeze(CodeObserver);
return CodeObserver
})()

