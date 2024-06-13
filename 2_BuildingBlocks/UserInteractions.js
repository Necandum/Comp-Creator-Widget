const UserInteraction = (function(){
let UserInteraction = {
    addHandler(interaction,handler){
        handlerRegistery.get(interaction)?.push(handler);
    },
    ESCAPE:{
        eventType:"keyup",
        propertyChecker:CODE,
        property:"Escape",
    },
    BACKSPACE:{
        eventType:"keyup",
        propertyChecker:CODE,
        property:"Backspace",
    },
    
}
function CODE(ev){
    return ev.code
}

UserInteraction.report = function report(){
    console.log(handlerRegistery)
}
//event handler format: function(ev){}
let handlerRegistery = new Map();
let eventTypeMap = new Map();

for(let interactionLabel in UserInteraction){
    if(typeof UserInteraction[interactionLabel] ==="function") continue;
    let interaction = UserInteraction[interactionLabel];
    let eventType = interaction.eventType;
    Object.freeze(interaction);
    handlerRegistery.set(interaction,[])
    if(!eventTypeMap.has(eventType)) eventTypeMap.set(eventType,[]);
    eventTypeMap.get(eventType).push(interaction);
}

for(const [eventType,interactionObjArray] of eventTypeMap){
    window.addEventListener(eventType,checkForInteractions(interactionObjArray))
}

function checkForInteractions(interactionObjArray){
    return function inner(ev){
        for(const interaction of interactionObjArray){
            if(interaction.propertyChecker(ev)===interaction.property){
                activateHandlers(interaction,ev)
            }
        }
    }
}
function activateHandlers(interaction,ev){
        let handlers = handlerRegistery.get(interaction);
        handlers.forEach(x =>x(ev));
}

    return UserInteraction;
})()


Object.freeze(UserInteraction);
