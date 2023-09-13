var ElementTemplate = (function () {
    let id=0;
    function ElementTemplate({ htmlInsert,mainElement,addFunctions,addDataStore,addAttributes=[],addEvents = [], addDataset = [], addClasses, addTemplates = [], label, addAsElder, onCreationCode, onCompletionCode }) {

        this.__peek = arguments[0];
        
        this.build = function (root,options={useAsMainDiv:null}) {
            let templateMainElement = (mainElement) ? document.createElement(mainElement)
                                                    :document.createElement('div');
            let mainDiv = options.useAsMainDiv ?? templateMainElement;
            let elder = (root) ? root.elder : {};
            let data = (root) ? root.getActualDataObject():new Map();
            let localData = new Map();
            data.set(mainDiv,localData);
            let uniqueKey = Symbol("Unique Key");
            let uniqueID = ++id;
            if (addAsElder && elder[addAsElder]) Break("Cannot add two elders of same name", { args: arguments[0], addAsElder })
            if (addAsElder) elder[addAsElder] = mainDiv;
            

            defineGetter({ obj: mainDiv, name: "root", func: () => root });
            defineGetter({ obj: mainDiv, name: "elder", func: () => ({ ...elder }) });
            defineGetter({ obj: mainDiv, name: "uniqueKey", func: () => uniqueKey});
            defineGetter({ obj: mainDiv, name: "uniqueID", func: () => uniqueID});
            defineGetter({ obj: mainDiv, name: "__data", func: () => localData});
           
            Object.defineProperty(mainDiv, "template", { value: this,configurable: false, enumerable: true, writable: false });

            mainDiv.getActualDataObject = function getActualDataObject(){
                return data;
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
            mainDiv.init = {};

            mainDiv.init.addFunctions=function(addFunctions){
                mainDiv.func ={};
                if(addFunctions){
                    if(!Array.isArray(addFunctions)) addFunctions = [addFunctions];
                    for(let functionItem of addFunctions){
                        if(!Array.isArray(functionItem)) functionItem = [functionItem,functionItem.name];
                        const [newFunc,newFuncName]=functionItem;
                        mainDiv.func[newFuncName]=newFunc.bind(mainDiv);
                    }
                }
                Object.freeze(mainDiv.func);
            }
            mainDiv.init.addFunctions(addFunctions);

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
                }

                for(const childNode of mainDiv.childNodes){
                 addRootToChildNodes(mainDiv, mainDiv.elder, childNode);
                }
            }
            mainDiv.init.htmlInsert(htmlInsert);

            mainDiv.init.addClasses=function(addClasses){
                if(addClasses){
                    if(!Array.isArray(addClasses)) addClasses = [addClasses];
                    mainDiv.classList.add(...addClasses);
                }
            }
            mainDiv.init.addClasses(addClasses);

            mainDiv.init.addDataSet = function(addDataset){
                for (const newDataset of addDataset) {
                    mainDiv.dataset[newDataset.name] = newDataset.value;
                }
            }
            mainDiv.init.addDataSet(addDataset);

            mainDiv.init.addEvents=function(addEvents){
                for (const newEvent of addEvents) {
                    if(!newEvent) continue;
                    let elements;
                    if (!newEvent.queryselection) {
                        elements = [mainDiv]
                    } else {
                        const queryResult = mainDiv.querySelectorAll(newEvent.queryselection);
                        elements = (queryResult.length>0) ? Array.from(queryResult)
                                                        : (newEvent.selfBackUp) ? [mainDiv]
                                                                                : (newEvent.optional) ? []
                                                                                                        : Alert("Failed to find elements by query selection", { newEvent, addEvents, mainDiv, htmlInsert });
                    }
                    for (const trigger of newEvent.triggers) {
                        for(const element of elements){
                        element.addEventListener(trigger, newEvent.func, newEvent.options)
                        }
                    }
                }
            }
            mainDiv.init.addEvents(addEvents);

            if (onCreationCode && typeof onCreationCode === "function") onCreationCode.call(mainDiv,mainDiv,options);

            mainDiv.init.addTemplates=function(addTemplates){ 
                if(!addTemplates) return false;
                if(!Array.isArray(addTemplates)) addTemplates = [addTemplates];
                    for (let item of addTemplates) {
                        if(!Array.isArray(item)) item = [item]
                        let [template,{templateOptions,parentElement,prepend}={}] = item;
                        if (!template instanceof ElementTemplate) Break("addTemplates must be array of ElementTemplators and option pairs", { addTemplates })
                        if(typeof parentElement ==="string") parentElement = mainDiv.querySelector(parentElement);
                        (parentElement??mainDiv)[(prepend) ? "prepend":"append"](template.build(mainDiv,templateOptions))
                    }
                    }
             mainDiv.init.addTemplates(addTemplates);

            if (onCompletionCode && typeof onCompletionCode === "function") onCompletionCode.call(mainDiv,mainDiv,options);

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
        if(node.root!==undefined) return false; //if has already been assigned, skip
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
