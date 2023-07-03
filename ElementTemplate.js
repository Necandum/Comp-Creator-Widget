var ElementTemplate = (function () {

    function ElementTemplate({ htmlInsert, addEvents = [], addDataset = [], addClasses = [], addTemplates = [], label, addAsElder, onCreationCode }) {

        this.__peek = arguments[0];
        this.build = function (root,{creationCodeArg}={}) {
            let mainDiv = document.createElement('div');
            let data = new Map([[mainDiv, new Map()]]);
            let treeData = new Map();
            let initialHtml;
            let elder = (root) ? root.elder : {};
            let uniqueKey = Symbol("Unique Key");
            if (addAsElder && elder[addAsElder]) Break("Cannot add two elders of same name", { args: arguments[0], addAsElder })
            if (addAsElder) elder[addAsElder] = mainDiv;
            mainDiv.__label = label; //for debugging
            defineGetter({ obj: mainDiv, name: "root", func: () => root });
            defineGetter({ obj: mainDiv, name: "elder", func: () => ({ ...elder }) });
            defineGetter({ obj: mainDiv, name: "spirit", func: () => mainDiv.quickLoad(uniqueKey) });
            defineSetter({ obj: mainDiv, name: "spirit", func: (unit) => mainDiv.quickSave(uniqueKey,unit)});
            defineGetter({
                obj: mainDiv, name: "data", func: () => {
                    let newData = new Map();
                    data.forEach((elemData, elem) => { newData.set(elem, new Map(elemData.entries())) })
                    return newData;
                }
            });
            defineGetter({ obj: mainDiv, name: "leaf", func: () => ({ data: mainDiv.data, treeData }) });
            Object.defineProperty(mainDiv, "template", { value: this,configurable: false, enumerable: true, writable: false });

            mainDiv.save = function save({ element, dataArr = [{ key: "", value: false }], override = true }) {
                if (!element instanceof HTMLElement) Break("element must be a HTML element", { args: arguments[0] });

                if (!data.has(element)) data.set(element, new Map())
                let elementDataStore = data.get(element);

                for (const datum of dataArr) {
                    if (!override && elementDataStore.has(datum.key)) continue
                    elementDataStore.set(datum.key, datum.value);
                }
                if (root) root.acceptPropogation(this, this.leaf);
            }
            mainDiv.quickSave = function quickSave (key, value) {
                this.save({ element: this, dataArr: [{ key, value }], override: true });
            }
            mainDiv.quickLoad = function quickLoad(key) {
                if (!data?.get?.(this)) Break("Cannot quick load when data element doesn't exist")
                return data.get(this).get(key);
            }
            mainDiv.deleteElementDataStore= function deleteElementDataStore(key){
                data.get(key)?.clear();
            }
            mainDiv.acceptPropogation = function acceptPropogation(node, leaf) {
                treeData.set(node, leaf);
                if (root) root.acceptPropogation(this, this.leaf);
            }


            if (htmlInsert) {
                if (!Array.isArray(htmlInsert)) htmlInsert = [htmlInsert];
                for (const htmlInsertItem of htmlInsert) {
                    let htmlForInsertion;
                    if(typeof htmlInsertItem ==="function"){
                        htmlForInsertion = htmlInsertItem();
                    } else if (htmlInsertItem instanceof HTMLElement || htmlInsertItem instanceof Node){
                        htmlForInsertion= htmlInsertItem.cloneNode(true);
                    } else if( typeof htmlInsertItem==='string'){
                        htmlForInsertion = document.createTextNode(htmlInsertItem)
                    }
                    else{
                        Break("htmlInsert must be function or HTMLElement",{htmlInsert,htmlInsertItem})
                    }
                    addRootToChildNodes(mainDiv, mainDiv.elder, htmlForInsertion);
                    mainDiv.append(htmlForInsertion);
                }
            }

            mainDiv.classList.add(...addClasses);

            for (const newDataset of addDataset) {
                mainDiv.dataset[newDataset.name] = newDataset.value;
            }

            for (const newEvent of addEvents) {
                let elements;
                if (!newEvent.queryselection) {
                    elements = [mainDiv]
                } else {
                    const queryResult = mainDiv.querySelectorAll(newEvent.queryselection);
                    elements = (queryResult.length>0) ? Array.from(queryResult)
                                                      : (newEvent.selfBackUp) ? [mainDiv]
                                                                              : Alert("Failed to find elements by query selection", { newEvent, addEvents, mainDiv, htmlInsert })

                }
                for (const trigger of newEvent.triggers) {
                    for(const element of elements){
                    element.addEventListener(trigger, newEvent.func, newEvent.options)
                    }
                }
            }

            if (onCreationCode && typeof onCreationCode === "function") onCreationCode(mainDiv,creationCodeArg);

            for (const template of addTemplates) {
                if (!template instanceof ElementTemplate) Break("addTemplates must be array of ElementTemplators", { addTemplates })
                mainDiv.append(template.build(mainDiv))
            }

            return mainDiv
        }

        Object.freeze(this);
    };

    ElementTemplate.eventObjMaker = function eventObjMaker({ triggers = ["click"], func, options = false, selfBackUp = false, queryselection }) {
        return { triggers, func, options, selfBackUp, queryselection }
    }

    function addRootToChildNodes(root, elder, node) {
        if (!root || !elder || !node) Break("All three arguments required", { root, elder, node });
        defineGetter({ obj: node, name: "root", func: () => root });
        defineGetter({ obj: node, name: "elder", func: () => ({ ...elder }) });
        let childNodes = Array.from(node.childNodes);
        for (const childNode of childNodes) {
            addRootToChildNodes(root, elder, childNode);
        }
    }

    return ElementTemplate
})()
