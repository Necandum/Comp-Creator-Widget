var ElementTemplate = (function () {
    let id=0;
    function ElementTemplate({ htmlInsert,htmlSmartInsert,mainElement,addFunctions,serialFunctions,addDataStore,addAttributes=[],addEvents = [], addDataset = [], addClasses, addTemplates = [], label, addAsElder, onCreationCode, onCompletionCode }) {

        this.__peek = arguments[0];
        
        this.build = function (root,options={useAsMainDiv:null,skipTemplate:false}) {
            let templateMainElement;
            options = {...options};
            if(mainElement instanceof ElementTemplate){
                let newOptions = {...options};
                newOptions.skipTemplate = true;
                delete options.useAsMainDiv;
                templateMainElement = mainElement.build(root,newOptions);
            } else {
                templateMainElement = (typeof mainElement ==="string") ? document.createElement(mainElement)
                                                                       : document.createElement("div");
            }
            if(typeof options.useAsMainDiv ==="string"){
                options.useAsMainDiv = document.createElement(options.useAsMainDiv);
            }
            if(typeof options.useAsMainDiv ==="function"){
                options.useAsMainDiv = options.useAsMainDiv();
            }
            const mainDiv = options.useAsMainDiv ?? templateMainElement;
            const elder = (mainDiv.elder) ? mainDiv.getActualElderObject()
                                        :(root) ? root.elder 
                                                : {};
                                                         
            let data = (root) ? root.getActualDataObject()
                              :(mainDiv.getActualDataObject) ? mainDiv.getActualDataObject()
                                                             : new Map();
            let localData = data.get(mainDiv) ?? new Map();
            data.set(mainDiv,localData);
            let uniqueKey = Symbol("Unique Key");
            let uniqueID = ++id;
    

            defineGetter({ obj: mainDiv, name: "root", func: () => root });
            defineGetter({ obj: mainDiv, name: "elder", func: () => ({ ...elder }) });
            defineGetter({ obj: mainDiv, name: "uniqueKey", func: () => uniqueKey});
            defineGetter({ obj: mainDiv, name: "uniqueID", func: () => uniqueID});
            defineGetter({ obj: mainDiv, name: "__data", func: () => localData});
           
           if(!options.skipTemplate) Object.defineProperty(mainDiv, "template", { value: this,configurable: false, enumerable: true, writable: false });

            mainDiv.getActualDataObject = function getActualDataObject(){
                return data;
            }
            mainDiv.getActualElderObject = function getActualElderObject(){
                return elder;
            }
            mainDiv.save = function quickSave (dataStoreName, value,overide=true) {
                if(!localData.has(dataStoreName)) Break("All data stores must be declared in template creation",{localData,addDataStore,args:arguments});
                let dataStoreValue = mainDiv.load(dataStoreName)
                if(!overide && dataStoreValue!==undefined) return false;
                localData.set(dataStoreName,value)
                return true;
            }
            mainDiv.load = function quickLoad(dataStoreName) {
                return localData.get(dataStoreName);
            }
            mainDiv.init ??= {};
           mainDiv.init.addAsElder=function(addAsElder,deletePriorRefrences){
               if (addAsElder && elder[addAsElder]) Break("Cannot add two elders of same name", { args: arguments[0], addAsElder,elder,label})
               if(deletePriorRefrences){
                   for(const elderReference in elder){
                       if(elder[elderReference]===mainDiv) delete elder[elderReference]
                    }
                }
                if (addAsElder) elder[addAsElder] = mainDiv;
            }
            mainDiv.init.addAsElder(addAsElder);
            

            mainDiv.init.addFunctions=function(addFunctions){
                mainDiv.func??={};
                if(addFunctions){
                    if(!Array.isArray(addFunctions)) addFunctions = [addFunctions];
                    for(let functionItem of addFunctions){
                        if(!Array.isArray(functionItem)) functionItem = [functionItem,functionItem.name];
                        const [newFunc,newFuncName]=functionItem;
                        mainDiv.func[newFuncName]=newFunc.bind(mainDiv);
                    }
                }
                if(!options.skipTemplate) Object.defineProperty(mainDiv,"func",{writable:false})
            }
            mainDiv.init.addFunctions(addFunctions);

            mainDiv.init.serialFunctions=function(oldFunctionName,newFunction){
                Object.defineProperty(mainDiv,"func",{writable:true});

                let oldFunction = mainDiv.func[oldFunctionName] ?? (Break("Cannot find old function name"),{functions:mainDiv.func,oldFunctionName,newFunction});
                newFunction = newFunction.bind(mainDiv);

                mainDiv.func[oldFunctionName] =function combinedFunctions(){
                  return  newFunction(oldFunction(...arguments),...arguments);
                }
                Object.defineProperty(mainDiv,"func",{writable:false})
            }
            if(serialFunctions){
                if(!Array.isArray(serialFunctions)) serialFunctions = [serialFunctions];
                for(const {oldFunctionName,newFunction} of serialFunctions){
                    mainDiv.init.serialFunctions(oldFunctionName,newFunction);
                }
            }

            mainDiv.init.addDataStore=function(addDataStore){
                if(!addDataStore) return false;
                if(!Array.isArray(addDataStore)) addDataStore = [addDataStore];
                if(!Array.isArray(addDataStore[0])) addDataStore = [addDataStore];
                for(const [newDataStoreName,newDataStoreValue] of addDataStore){
                    localData.set(newDataStoreName,(newDataStoreValue instanceof Function) ? new newDataStoreValue(): newDataStoreValue);
                }
            }
            mainDiv.init.addDataStore(addDataStore);

            mainDiv.init.addAttributes=function(addAttributes){
                if(!addAttributes || addAttributes.length===0) return false;
                if(!Array.isArray(addAttributes)) addAttributes = [addAttributes];
                if(!Array.isArray(addAttributes[0])) addAttributes = [addAttributes];
                for(const [attribute,value] of addAttributes){
                    mainDiv.setAttribute(attribute,value);
                }
            }
            mainDiv.init.addAttributes(addAttributes);

            mainDiv.init.htmlInsert=function(htmlInsert){
                if (htmlInsert) {
                    if (!Array.isArray(htmlInsert)) htmlInsert = [htmlInsert];
                    for (const htmlInsertItem of htmlInsert) {
                        let htmlForInsertion;
                        if(typeof htmlInsertItem ==="function"){
                            htmlForInsertion = htmlInsertItem(mainDiv,options);
                        } else if (htmlInsertItem instanceof HTMLElement || htmlInsertItem instanceof Node){
                            htmlForInsertion= htmlInsertItem.cloneNode(true);
                        } else if( typeof htmlInsertItem==='string'){
                            htmlForInsertion = document.createTextNode(htmlInsertItem)
                        }
                        else{
                            Break("htmlInsert must be function or HTMLElement",{htmlInsert,htmlInsertItem})
                        }
                        mainDiv.append(htmlForInsertion);
                    }
                    for(const childNode of mainDiv.childNodes){
                        addRootToChildNodes(mainDiv, elder, childNode);
                       }
                }
            }
            mainDiv.init.htmlInsert(htmlInsert);

            mainDiv.init.htmlSmartInsert=function(...htmlInsertionObjects){
                let insertedNodes =[];
                for(const htmlInsertionObject of htmlInsertionObjects){
                    if(!htmlInsertionObject) continue;
                    let {html,destination,insertionMethod,saveAs,noClone}=htmlInsertionObject;
                    if (html) {
                            let htmlForInsertion;
                            if(typeof html ==="function"){
                                htmlForInsertion = html(mainDiv,options);
                            } else if (html instanceof HTMLElement || html instanceof Node){
                                htmlForInsertion= noClone ? html:html.cloneNode(true);
                            } else if( typeof html==='string'){
                                htmlForInsertion = document.createTextNode(html)
                            }
                            else{
                                Break("htmlInsert must be function or HTMLElement",{html,htmlInsertionObject})
                            }
                            let targetedElement = mainDiv;
                            if(destination){
                                if(typeof destination ==='string') targetedElement = mainDiv.querySelector(destination) ?? targetedElement;
                                if(destination instanceof Node || destination instanceof HTMLElement) targetedElement = (mainDiv.contains(destination)) ? destination: targetedElement;
                            }
                            let intendedInsertionMethod = insertionMethod ?? Element.prototype.append;
                            intendedInsertionMethod.call(targetedElement,htmlForInsertion);
                            addRootToChildNodes(mainDiv, elder, htmlForInsertion);
                            insertedNodes.push(htmlForInsertion)
                        };
                }
                return insertedNodes;
            }
            if(htmlSmartInsert){
                if(!Array.isArray(htmlSmartInsert)) htmlSmartInsert = [htmlSmartInsert];
                mainDiv.init.htmlSmartInsert(...htmlSmartInsert);
            }

            mainDiv.init.addClasses=function(addClasses){
                if(addClasses){
                    if(!Array.isArray(addClasses)) addClasses = [addClasses];
                    mainDiv.classList.add(...addClasses);
                }
            }
            mainDiv.init.addClasses(addClasses);

            mainDiv.init.addDataset = function(addDataset){
                if(addDataset===undefined) return false;

                for (const newDataset of addDataset) {
                    const {name,value} = newDataset
                    mainDiv.dataset[name] = value;
                }
            }
            mainDiv.init.addDataset(addDataset);

            

            mainDiv.init.addTemplates=function(addTemplates){ 
                if(!addTemplates) return false;
                if(!Array.isArray(addTemplates)) addTemplates = [addTemplates];
                let products =[];
                    for (let item of addTemplates) {
                        if(!Array.isArray(item)) item = [item]
                        let [template,{templateOptions,parentElement,destination,prepend,saveAs}={}] = item;
                        parentElement ??=destination;
                        if (!template instanceof ElementTemplate) Break("addTemplates must be array of ElementTemplators and option pairs", { addTemplates })
                        if(typeof parentElement ==="string") parentElement = mainDiv.querySelector(parentElement);
                        let producedElement = template.build(mainDiv,templateOptions)
                        products.push(producedElement);
                        (parentElement??mainDiv)[(prepend) ? "prepend":"append"](producedElement)
                        if(saveAs) mainDiv.save(saveAs,producedElement);
                    }
                return products
            }
            //delayed exec
            mainDiv.init.addEvents=function(addEvents){//newEvent = {querySelection,selfBackUp,optional,triggers:[],func,options}
                if(!addEvents) return;
                if(!Array.isArray(addEvents)) addEvents=[addEvents];
                for (const newEvent of addEvents) {
                    if(!newEvent) continue;
                    let {queryselection,selfBackUp=true,optional,triggers=["click"],func,options} = newEvent;
                    let elements;
                   if (!queryselection) {
                       elements = [mainDiv]
                   } else {
                       const queryResult = mainDiv.querySelectorAll(queryselection);
                       elements = (queryResult.length>0) ? Array.from(queryResult)
                                                       : (selfBackUp) ? [mainDiv]
                                                                               : (optional) ? []
                                                                                                       : Break("Failed to find elements by query selection", { newEvent, addEvents, mainDiv, htmlInsert });
                   }
                   if(!Array.isArray(triggers)) triggers=[triggers];
                   for (const trigger of triggers) {
                       for(const element of elements){
                       element.addEventListener(trigger, func, options)
                       }
                   }
               }
            } //delayed exec
            
            if (onCreationCode && typeof onCreationCode === "function") onCreationCode.call(mainDiv,mainDiv,options);

                mainDiv.init.addTemplates(addTemplates);

                mainDiv.init.addEvents(addEvents);
            onCompletionCode:{
                        const prevFunc = mainDiv.init.onCompletionCode;
                        let currentFunc = null;
                        if(onCompletionCode && typeof onCompletionCode === "function") currentFunc = onCompletionCode.bind(mainDiv);

                    if(prevFunc){
                        let combinedFunc;
                        if(currentFunc){
                            combinedFunc = function combinedOnCompletionCode(mainDiv,options){
                                prevFunc(mainDiv,options);
                                currentFunc(mainDiv,options);
                            }
                        } else {
                            combinedFunc = function combinedOnCompletionCode(){
                                prevFunc(mainDiv,options);
                            }
                        }
                        mainDiv.init.onCompletionCode = combinedFunc;
                    } else if(currentFunc) {
                        mainDiv.init.onCompletionCode = currentFunc;
                    }
                if(!options.skipTemplate) mainDiv.init.onCompletionCode?.(mainDiv,options);
            }

            mainDiv.__label = label ?? addClasses?.toString() ?? addAsElder; //for debugging
            return mainDiv
        }

        Object.freeze(this);
    };

    ElementTemplate.eventObjMaker = function eventObjMaker({ triggers = ["click"], func, options = false, selfBackUp = false, queryselection }) {
        if(!Array.isArray(triggers)) triggers=[triggers];
        return { triggers, func, options, selfBackUp, queryselection }
    }

    function addRootToChildNodes(root, elder, node) {
        if (!root || !elder || !node) Break("All three arguments required", { root, elder, node });
        if(node.root !==undefined) return false; //if has already been assigned, skip
        defineGetter({ obj: node, name: "root", func: () => root });
        defineGetter({ obj: node, name: "elder", func: () => ({ ...elder }) });

        node.quickSave =(key,value)=> root.quickSave.call(node,key,value);
        node.quickLoad = (key)=> root.quickLoad.call(node,key);
        let childNodes = Array.from(node.childNodes);
        for (const childNode of childNodes) {
            addRootToChildNodes(root, elder, childNode);
        }
    }

    return ElementTemplate
})()
