var UIManager = (function () {

    let UniqueSelection = (function () {
        let registry = new Map([document,new Map()]);
        let defaultClass = "toggleSelection"
        oLog.uniqueSelectionRegistry = registry;
        function UniqueSelection() {
            this.addGroup = (newGroupName,{alternateClasses=[]}={}) => {
                if (!registry.has(newGroupName)) {
                    let newEntry = new Map();
                    alternateClasses.push(defaultClass);
                    alternateClasses = new Set(alternateClasses);
                    alternateClasses.forEach(className=>newEntry.set(className,new Set()));
                    newEntry.aliasRegistry = new Map();
                    registry.set(newGroupName, newEntry);
                }
            }
            this.deleteGroup=(groupName)=>{
                registry.delete(groupName);
                return true;
            }
            this.deleteMember = (groupName,member)=>{
                let group = registry.get(groupName) ?? Break("Cannot delete from non-existant group", { groupName, member, registry });
                member = group.aliasRegistry.get(member) ?? member;
                group.forEach(classSet=>classSet.delete(member));
                return true;
            }
            this.addMember = (groupName=document, newMember, alias) => {
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, newMember, registry });
                if (alias) {
                    group.aliasRegistry.set(alias, newMember);
                }
                group.forEach(classSet=>classSet.add(newMember));
                return true
            }
            this.addFamily = (groupName,familyArray,alias) =>{
                if(!alias) Break("Must use alias to add family",{args:arguments});
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, familyArray, registry });
                familyArray = familyArray.filter(x=>(x instanceof Node));
                if(group.aliasRegistry.has(alias)){
                    this.expandFamily(groupName,alias,familyArray);
                    return true;
                }
                group.aliasRegistry.set(alias,familyArray);
                group.forEach(classSet=>classSet.add(familyArray));
                return true
            }
            this.expandFamily = (groupName,familyAlias,newMembers)=>{
                if(!familyAlias) Break("Must use alias to add to family",{args:arguments});
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, familyAlias, registry });
                let familyArray = group.aliasRegistry.get(familyAlias);
                if(!Array.isArray(newMembers)) newMembers=[newMembers];
                newMembers = newMembers.filter(x=>(x instanceof Node));
                familyArray.push(...newMembers);
                return true;
            }
            this.select = (groupName, selectedMember, addToSelection = false, useClasses=[e.DEFAULT]) => {
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                useClasses = new Set(useClasses);
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);
                if (addToSelection === false) {
                   this.wipeClasses(groupName,useClasses);
                }
                if (group.aliasRegistry.has(selectedMember)) {
                    selectedMember = group.aliasRegistry.get(selectedMember);
                }
                for(const selectedClass of useClasses){
                    if(selectedClass===null || selectedClass===undefined) continue;
                    if (group.has(selectedClass)){
                        if (group.get(selectedClass).has(selectedMember)) {
                            if(Array.isArray(selectedMember)){
                                selectedMember.forEach(x=>x.classList.add(selectedClass));
                            } else {
                                selectedMember.classList.add(selectedClass);
                            }
                        }
                    } else {
                        Alert("attempted class not in this group",{useClasses,selectedClass,group});
                    }
                }
               
                return true;
            }
            this.deselect = (groupName,selectedMember,useClasses=[e.DEFAULT])=>{
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                useClasses = new Set(useClasses);
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);

                if (group.aliasRegistry.has(selectedMember)) {
                    selectedMember = group.aliasRegistry.get(selectedMember);
                }
                for(const selectedClass of useClasses){
                    if(selectedClass===null || selectedClass===undefined) continue;
                    if (group.has(selectedClass)){
                        if (group.get(selectedClass).has(selectedMember)) {
                            if(Array.isArray(selectedMember)){
                                selectedMember.forEach(x=>x.classList.remove(selectedClass));
                            } else {
                                selectedMember.classList.remove(selectedClass);
                            }
                        }
                    } else {
                        Alert("attempted class not in this group",{useClasses,selectedClass,group});
                    }
                }
                return true;
            }
            this.wipeClasses=(groupName,useClasses=[])=>{
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, registry });
                useClasses = new Set(useClasses);
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);
                for(const [className,groupClassSet] of group){
                    if(!useClasses.has(className) && !useClasses.has(e.ALL)) continue
                    for (const member of groupClassSet) {
                        if(Array.isArray(member)){
                            member.forEach(x=>x.classList.remove(className));
                        } else {
                        member.classList.remove(className);
                        }
                    }
                }
            }
            this.selectN = (groupName, N, addToSelection = false,useClasses=[e.DEFAULT]) => {
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                let i = 1;
                for (const member in group.get(defaultClass)) {
                    if (i === N) {
                        this.select(groupName, member, addToSelection,useClasses);
                        break;
                    }
                    i++;
                }
            }
            this.toggle=(groupName,selectedMember,addToSelection=false,useClasses=[e.DEFAULT])=>{
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                let classNowPresent = false;
                useClasses = new Set(useClasses)
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);

                if (group.aliasRegistry.has(selectedMember)) {
                    selectedMember = group.aliasRegistry.get(selectedMember);
                }
                
                for(const selectedClass of useClasses){
                    let classGroup = group.get(selectedClass);
                    if(!classGroup) continue;
                    if(classGroup.has(selectedMember)){
                        if(selectedMember.classList?.contains(selectedClass) || selectedMember[0]?.classList?.contains(selectedClass)){
                            this.deselect(groupName,selectedMember,[selectedClass]);
                        } else {
                           classNowPresent = this.select(groupName,selectedMember,addToSelection,[selectedClass]);
                        }
                    }
                }
                return classNowPresent;
            }
        }
        oLog.uniqueSelection=UniqueSelection;
        let controlObject = new UniqueSelection();
        controlObject.addGroup("configurationMenu");
        controlObject.addGroup("configurationSection");
        controlObject.addGroup("competitorsMenu")

        return controlObject
    })();
    
    const UIManagerObject = {
        helperFunctions:{
            temporaryClass: function(html,timeToRemove,className){
                html.classList.add(className);
                setTimeout(()=>html.classList.remove(className),timeToRemove);
            },
            creationAnimation: function(html){
                this.temporaryClass(html,1000,"newUnitAnimation");
            },
        },
    };

    const configurationMenu$ = getE("#configurationMenu");
    const sectionMenus$=getE("#sectionMenus");
    const configurationSectionContainer$ = getE("#configurationSectionContainer");
    const competitorSectionMenuContainer$ = getE("#competitorSectionMenuContainer");
    const schedulingSectionMenuContainer$ = getE("#schedulingSectionMenuContainer");
    const bracketSectionMenuContainer$ = getE("#bracketSectionMenuContainer");
    const competitorSectionMenu$ = getE("#competitorSectionMenu");
    const displayArea$ = getE('#displayArea');
    const bracketSection$ = getE("#bracketSection");
    const teamForm$ = getE("#competitorTeamTab form");
    const teamNav$ = getE("#competitorTeamTab nav");
    const divisionForm$ = getE("#competitorDivisionTab form");
    const divisionNav$ = getE("#competitorDivisionTab nav")
    const playerForm$ = getE("#competitorPlayerTab form");
    const playerNav$ = getE("#competitorPlayerTab nav")
    const combinedFormPlayer$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Player']");
    const combinedFormTeam$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Team']");
    const combinedFormDivision$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Division']");
    const combinedNav$ = getE("#competitorCombinedTab nav")
    const schedulingDisplaySection$ = getE("#scheduleSection");

    function stringToObject(string) {
        switch (string) {
            case "Player":
                return Player;
            case "Game":
                return Game;
            case "Block":
                return Block;
            case "Phase":
                return Phase;
            case "Competition":
                return Competition;
            case "Division":
                return Division;
            case "Team":
                return Team;
            default:
                Break("Cannot recognise string", { string })
        }
    }
    function stringNormalisation(anything) {
        return String(anything).trim().normalize();
    }
    function integerNormalisation(anything) {
        return Number.parseInt(anything,10);
    }

    const HTMLTemplates = {};
    const HTMLAdditions = {};
    const EventTemplates = {};
    const ElementTemplates = {};
    const KeyNodes={
        popUp:{},
        unitContainers:{},
        menu:{},
        FacadeMap:null
    };

    oLog.KeyNodes = KeyNodes;
   

    const Harvest = {//Accepts (inputContainer,{insertValue,reset})
        standardTextInput(inputContainer,{insertValue,reset=false}={}) { 
            let inputElement = inputContainer.firstElementChild.firstElementChild;
            if(reset === true) insertValue = "";
            if(insertValue!== undefined){
                inputElement.value= insertValue ?? ""
            }
            return  stringNormalisation(inputElement.value);
        },
        smartStandardTextInput(resetValue) { 
            function inner(inputContainer,{insertValue,reset=false}={}){
                let inputElement = inputContainer.firstElementChild.firstElementChild;
                if(reset === true) insertValue = resetValue;
                if(insertValue!== undefined){
                    inputElement.value= insertValue ?? resetValue;
                }
                return  stringNormalisation(inputElement.value);
            }
            return  inner;
        },
        smartStandardNumber(resetValue) { 
            function inner(inputContainer,{insertValue,reset=false}={}){
                let inputElement = inputContainer.firstElementChild.firstElementChild;
                if(reset === true) insertValue = resetValue;
                if(insertValue!== undefined){
                    inputElement.value= insertValue ?? resetValue;
                }
                return  integerNormalisation(inputElement.value);
            }
            return  inner;
        },
        fireChangeSingleCheckbox(inputContainer,{insertValue,reset=false}){
            let inputElement = inputContainer.firstElementChild.firstElementChild;
            if(reset) insertValue = false;
            if(insertValue!==undefined){ 
                inputElement.checked=insertValue;
                let ev = new Event("progChange",{bubbles:true});
                inputElement.dispatchEvent(ev);
            }
            let value = inputElement.checked;
            
            return value;
        },
        standardSingleCheckbox(inputContainer,{insertValue,reset=false}){
            let inputElement = inputContainer.firstElementChild.firstElementChild;
            if(reset) insertValue = false;
            if(insertValue!==undefined) inputElement.checked=insertValue;
            let value = inputElement.checked;
            return value;
        },
        displayLabel(inputContainer,{insertValue,reset=false}){
            if(reset) insertValue ="";
            if(insertValue) inputContainer.firstElementChild.textContent = insertValue;
            return inputContainer.firstElementChild.textContent;
        },
        displayLabelSymbolConversion(objectDictionary){
            function inner(inputContainer,{insertValue,reset=false}){
            if(reset) insertValue ="";
            if(typeof insertValue ==='symbol') insertValue = objectDictionary[insertValue];
            if(insertValue) inputContainer.firstElementChild.textContent = insertValue;
            return false;
            }
            return inner;
        },
        radioButtons(inputContainer,{insertValue,reset=false}){
            let radioButtons = inputContainer.querySelectorAll("input[type='radio']");
            let selectedValue;
            if(reset) insertValue = radioButtons[0].value;
            for(let radioButton of radioButtons){
                if(radioButton.value===insertValue) radioButton.checked=true;
                if(radioButton.checked) selectedValue = radioButton.value;
            }
            return selectedValue;
        },
        smartStandardTime(hours=0,minutes=0,seconds=0,ms=0){
            let defaultTime = `
            ${String(hours).padStart(2,"0")}:
            ${String(minutes).padStart(2,"0")}:
            ${String(seconds).padStart(2,"0")}.
            ${String(ms).padStart(3,"0")}
            `;
            defaultTime = removeMultipleLines(defaultTime);
            

            function inner(inputContainer,{insertValue,reset=false}){
                let inputElement = inputContainer.firstElementChild.firstElementChild;
                if(reset) insertValue = defaultTime;
                if(insertValue!==undefined){
                    inputElement.value = insertValue ?? defaultTime;
                }
                let returnedTimeString = stringNormalisation(inputElement.value);
                return returnedTimeString;
            }
        return inner;
        },
        smartStandardDate(date=today.DATE,month=today.MONTH+1,year=today.YEAR){
            let defaultDate = `
            ${String(year).padStart(4,"20")}-
            ${String(month).padStart(2,"0")}-
            ${String(date).padStart(2,"0")}`;
            defaultDate = removeMultipleLines(defaultDate);

            function inner(inputContainer,{insertValue,reset=false}){
                let inputElement = inputContainer.firstElementChild.firstElementChild;
                if (reset) insertValue = defaultDate;
                if(insertValue!==undefined){
                    inputElement.value = insertValue ?? defaultDate;
                }
                let returnedDateString = stringNormalisation(inputElement.value);
                return returnedDateString;
            }
        return inner;
        }
    };
    const Verify = { //func accepts (value), returns T/F
        multiple(...verificationFunctions){
            function inner(value){
                for(const verifyFunc of verificationFunctions){
                    if(!verifyFunc(value)) return false;
                }
                return true;
            }
            return inner;
        },
        notBlank(value) {
            return /\S/.test(value);
        },
        positiveInt(value){
            let numValue = Number(value);
            return (Number.isInteger(numValue) && (numValue >= 0))
        },
        boolean(value){
            return (typeof value ==='boolean')
        }
    };
    const Retreive = { //Accepts (controlloed object,property)
        directProperty(controlledObject,property){
            return controlledObject?.[property]
        },
        deepProperty(propertyLadder=[]){
            function inner(controlledObject,property){
                let currentLocation = controlledObject;
                for(intermediateProperty of propertyLadder){
                    currentLocation = currentLocation[intermediateProperty]
                }
               if(property!==undefined) currentLocation = currentLocation[property];
                return currentLocation
            }
            return inner;
        },
        accessMap(propertyLadderToMap){
            propertyLadderToMap = ensureArray(propertyLadderToMap);
            function inner(controlledObject,key){
                let map = Retreive.deepProperty(propertyLadderToMap)(controlledObject);
                return map.get(key);
            }
            return inner;
        }
    }
    const Edit={ //Accepts (controlledobject,objectField,newValue)
        newSettings(controlledObject,objectField,newValue){
            controlledObject.updateSettings({[objectField]:newValue});
        },
        setMap(propertyLadderToMap){
            function inner(controlledObject,objectField,newValue){
                let map = Retreive.deepProperty(propertyLadderToMap)(controlledObject); 
                map.set(objectField,newValue);
            }
            return inner;
        },
        directProperty(controlledObject,objectField,newValue){
             controlledObject[objectField]=newValue;
        },
    }
    const MakeEvent = {
        get verify() {
            return new CustomEvent("verify", { bubbles: true })
        },
    }
    HTMLTemplates.simpleDisplayLabel = function(defaultText){
        return parseHTML(`<span class='displayLabel'>${defaultText}</span>`).querySelector("span");
    }
    HTMLTemplates.smartStandardText = function(label){
        let html = parseHTML(`
        <label>${label} <input type='text'/> </label>
        `)
        return html;
    }
    HTMLTemplates.smartStandardNumber = function(label,defaultNumber){
        let html = parseHTML(`
        <label>${label} <input type='number' value='${defaultNumber ? defaultNumber:0}'/> </label>
        `)
        return html;
    }
    HTMLTemplates.smartStandardSelect = function(label,optionArray){
        let select$= newE("select");
        for(const optionParameters of optionArray){
            let option$=newE("option");
            select$.append(option$);
            if(optionParameters.value!==undefined) option$.value=optionParameters.value;
            if(optionParameters.text!==undefined) option$.textContent=optionParameters.text;
        }
        let label$=newE("label");
        label$.textContent=label;
        label$.append(select$);
        return label$;
    }
    HTMLTemplates.smartStandardSingleCheckbox = function(label){
        let checkbox$= newE("input");
        checkbox$.setAttribute("type","checkbox");
       
        let label$=newE("label");
        label$.textContent=label;
        label$.append(checkbox$);
        return label$;
    }
    HTMLTemplates.smartStandardDate = function(label){
        let html = parseHTML(`
        <label>${label} <input type='date'/> </label>
        `)
        return html;
    }
    HTMLTemplates.smartStandardTime = function(label){
        let html = parseHTML(`
        <label>${label} <input type='time'/> </label>
        `)
        return html;
    }
    HTMLTemplates.buttonHider = function(){
        let span = document.createElement("span");
        span.classList.add("buttonHider");
        let button = document.createElement("button");
        button.setAttribute("type","button");
        span.append(button);
        return span;
    }
    HTMLTemplates.button = function(){
        let button = document.createElement("button");
        button.setAttribute("type","button");
        return button;
    }
    HTMLTemplates.actionButtonFactory = function(label,func){
        return function inner(){
            return HTMLTemplates.actionButton(label,func)
        }
    }
    HTMLTemplates.labelledButton = function(label,buttonFunction){
        let button = HTMLTemplates.button();
        button.append(label);
        if(buttonFunction) button.dataset.buttonFunction=buttonFunction;
        return button;
    }
    HTMLTemplates.actionButton = function(label,func){
        let button = HTMLTemplates.button();
        button.append(label);
        if(func){
            button.addEventListener("click",func);
        }
        return button;
    }
    HTMLTemplates.linkLabel=function(topOrBottom,contents){
        let div = document.createElement('div');
        div.classList.add(`${topOrBottom.description}`);
        div.append(contents);
        return div;
    }
    HTMLTemplates.buttonPanel = function(buttonChoices){
        const div=document.createElement("div")
        div.classList.add("buttonPanel");
        for(const {label,role,func} of buttonChoices){
            const button = HTMLTemplates.button();
            button.dataset.buttonFunction=role;
            button.textContent = label;
            if(func){
                button.addEventListener("click",func);
            };
            div.append(button);
        }
        return div
    }
    HTMLTemplates.smartRadioButtons=function(radioGroupName,...radioLabelValues){
        let radioButtonContainer = document.createElement("div");
        radioButtonContainer.classList.add("radioButtonContainer");
        for(let {label,value} of radioLabelValues){
            let radioButton =document.createElement("input");
            let radioButtonLabel = document.createElement("label")
            radioButton.setAttribute("type","radio");
            radioButton.setAttribute("value",value);
            radioButton.setAttribute("name",radioGroupName);
            radioButtonLabel.append(radioButton,label);
            radioButtonContainer.append(radioButtonLabel);
        }
        radioButtonContainer.firstElementChild.firstElementChild.checked=true;
        return radioButtonContainer;
    }
    HTMLTemplates.smartHeading = function(headingTitle){
        let heading = document.createElement("h1");
        heading.append(headingTitle);
        return heading;
    }
    HTMLAdditions.hideByDefault = function(htmlElement){
        htmlElement.classList.add("hiddenByDefault");
        return htmlElement;
    }
    topMenu:{
         //Set-up selection links
         for (let i = 0; i < configurationMenu$.children.length; i++) {
            let menuLink = configurationMenu$.children[i];
            let section = configurationSectionContainer$.children[i];
            let subMenu = sectionMenus$.children[i];
            UniqueSelection.addFamily("configurationMenu", [menuLink,section,subMenu],menuLink);

            configurationMenu$.children[i].addEventListener("click", (ev) => {
                UniqueSelection.select("configurationMenu", menuLink);
            })
        }
    }
    popUp:{
        function openPopUp(){
            UniqueSelection.select(e.POP_UP,this);
            document.body.classList.add("noscroll");
        }
        function closePopUp(){
            UniqueSelection.wipeClasses(e.POP_UP,[e.DEFAULT]);
            document.body.classList.remove("noscroll");
        }
        function addContent(htmlContent,insertionMethod = Element.prototype.append){
            insertionMethod.call(this.load(e.CONTENTS),htmlContent);
        }
        ElementTemplates.popUpBase = new ElementTemplate({
            label:"basePopUp",
            htmlInsert:function(mainDiv,options){
                let html = parseHTML(`
                <menu class='popUpWindow'>
                <section class='popUpContentContainer'>
                </section>
                <section class='popUpControlContainer'>
                </section>
                </menu>
                `);
                return html;
            },
            addAsElder:"popupbase",
            addClasses:["popUpBase","hiddenByDefault"],
            addDataStore:[[e.CONTENTS,null]],
            addFunctions:[openPopUp,closePopUp,addContent],
            onCompletionCode:function(){
                UniqueSelection.addGroup(e.POP_UP);
                UniqueSelection.addMember(e.POP_UP,this);
                document.body.append(this);
                let contentContainer = this.querySelector("section.popUpContentContainer");
                this.save(e.CONTENTS,contentContainer);
            }
        });
        EventTemplates.closePopUp = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-button-function='close']",
            func:function(ev){
                this.elder['popupbase'].func.closePopUp();
            }
        })
        ElementTemplates.popUpButtons = new ElementTemplate({
            htmlInsert:function(mainDiv,options){
                let html = parseHTML(`
                <nav>
                <button type="button" data-button-function="primary"> Okay</button>
                <button type="button" data-button-function="seconday"> Cancel</button>
                </nav>
                `);
                return html;
            },
            addAsElder:"buttonbox",
            addEvents:[EventTemplates.closePopUp],
            onCompletionCode:function(){
                
            }
        });
        
    }
    GenericForm:{
        ElementTemplates.genericControllingButton = new ElementTemplate({
            mainElement:"span",
            htmlInsert:HTMLTemplates.button,
            addClasses:"controlButton",
            addDataStore:[[e.CONTROLLED_OBJECT,null]],
            onCreationCode:function(mainDiv,options){
                const {addClasses,addDataset,buttonText}=options;
                this.init.addClasses(addClasses);
                this.init.addDataset(addDataset);
                this.querySelector("button").textContent = buttonText;
            }
        })
        function harvest({insertValue,reset=false}={}){
            return this.load(e.HARVEST).call(this,this,{insertValue,reset});
        }
        function retrieve(){
            return this.load(e.RETRIEVE).call(this,this.elder['form'].load(e.CONTROLLED_OBJECT),this.load(e.OBJECT_FIELD))
        }
        function verify(value){
            return this.load(e.VERIFICATION).call(this,value);
        }
        function edit(newValue){
            return this.load(e.EDIT).call(this,this.elder['form'].load(e.CONTROLLED_OBJECT),this.load(e.OBJECT_FIELD),newValue);
        }
        ElementTemplates.inputContainer = new ElementTemplate({
            addAsElder:"inputContainer",
            addClasses:"inputContainer",
            addFunctions:[harvest,retrieve,verify,edit],
            addDataStore:[
                [e.VERIFICATION,"assigned at runtime"],
                [e.HARVEST,"assigned at runtime"],
                [e.RETRIEVE,"assigned at runtime"],
                [e.EDIT,"assigned at runtime"],
                [e.OBJECT_FIELD,"assigned at runtime"],
            ],
            onCreationCode:function(mainDiv,options){
                const {
                objectField,
                verify,
                harvest,
                retrieve,
                edit,
                htmlContents,
                addEvents}=options;

                this.save(e.OBJECT_FIELD,objectField);
                this.save(e.HARVEST,harvest);
                this.save(e.VERIFICATION,verify);
                this.save(e.RETRIEVE,retrieve);
                this.save(e.EDIT,edit);
                this.init.htmlInsert(htmlContents);
                this.init.addEvents(addEvents)
                this.dataset.objectField = objectField;
            }
        });

        ElementTemplates.formControl = new ElementTemplate({
            addClasses:"formControlContainer",
            onCreationCode: function(mainDiv,options){
                const {html,func,eventObj,controlFunctionLabel='unspecified'}=options;
                this.init.htmlInsert(html);
                this.init.addDataset([{name:"controlFunction",value:controlFunctionLabel}]);

                if(func){
                    this.addEventListener("click",func);
                }
                if(eventObj){
                    this.init.addEvents(eventObj);
                }
            }
        })
        function switchMode(newMode){
            this.save(e.MODE,newMode);
            UniqueSelection.select(this,newMode);
            return newMode;
        }
        function harvestData(){
            let harvestedData = new Map();
            for(const inputContainer of this.load(e.INPUT_CONTAINER_LIST)){
                harvestedData.set(inputContainer,inputContainer.func.harvest());
            }
            this.save(e.HARVESTED_DATA,harvestedData);
            return harvestedData;
        }
        function getHarvestDataMappedByObjectField(){
            let harvestedData = this.load(e.HARVESTED_DATA);
            let byObjectField = new Map();
            for(const [inputContainer,data] of harvestedData){
                byObjectField.set(inputContainer.load(e.OBJECT_FIELD),data);
            }
            return byObjectField;
        }
        function verifyHarvestedData(){
            let harvestedData = this.load(e.HARVESTED_DATA);
            this.func.clearVerificationList();
            for(const [inputContainer,value] of harvestedData){
                if(value===e.NOT_IN_USE) continue;
                if(!inputContainer.func.verify(value)) failedVerification(this,inputContainer);
            }
            let result = (this.load(e.VERIFICATION_FAILED).size===0);
            if(!result) Alert("Verification failed!",{harvestedData})
            return result;
        }
        function resetValues(toDefaultState){
            let controlledObject = this.load(e.CONTROLLED_OBJECT);
            this.func.clearVerificationList();
            for(const inputContainer of this.load(e.INPUT_CONTAINER_LIST)){
                if(!toDefaultState && controlledObject){
                   inputContainer.func.harvest({insertValue:inputContainer.func.retrieve()}) 
                } else {
                   inputContainer.func.harvest({reset:true}) 
                }
            }
        }
        function importObject(newControlledObject){
            if(!(newControlledObject instanceof this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR))) Break("Ineligible object passed for import",{newControlledObject,form:this});
            this.save(e.CONTROLLED_OBJECT,newControlledObject);
        }
        function editingMode(newControlledObject){
            if(newControlledObject) this.func.importObject(newControlledObject);
            if(!this.load(e.CONTROLLED_OBJECT)) Break("Cannot engage editing mode without a controlledObject",{form:this});
            this.func.switchMode(e.EDIT);
            this.func.clearVerificationList();
            this.func.resetValues();
        }
        function creationMode(){
            this.func.switchMode(e.CREATE);
            this.func.clearVerificationList();
            this.func.resetValues(true);
        }
        function createObject(){
            let harvestedData = this.func.harvestData();
            this.func.clearVerificationList();
            if(this.func.verifyHarvestedData()){
                let creationObject={};
                for(const [inputContainer,data] of harvestedData){
                    creationObject[inputContainer.load(e.OBJECT_FIELD)]=data;
                }
                return new this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR)(creationObject);
            }
            return false;
        }
        function updateObject(){
            let harvestedData = this.func.harvestData();
            this.func.clearVerificationList();

            if(this.func.verifyHarvestedData() && this.load(e.CONTROLLED_OBJECT)){
                for(const [inputContainer,newValue] of harvestedData){
                    inputContainer.func.edit(newValue);
                }
                return true;
            }
            
            return false;
        }
        function clearVerificationList(){
            UniqueSelection.wipeClasses(this.elder['form'],["failed"]);
            this.load(e.VERIFICATION_FAILED).clear();
        }
        function failedVerification(form,inputContainer){
            form.load(e.VERIFICATION_FAILED).add(inputContainer);
            UniqueSelection.select(form.elder['form'],inputContainer,true,["failed"]);
        }
        function addInputContainer(...inputContainerOptionList){
            for(const inputContainerOptions of inputContainerOptionList){
               let {destination="section.inputContainers"} = inputContainerOptions;
               let {uniqueSelectionFamily=null} = inputContainerOptions;
               let [createdElement]= this.init.addTemplates([[ElementTemplates.inputContainer,{templateOptions:inputContainerOptions,parentElement:destination}]]);
               this.load(e.INPUT_CONTAINER_LIST).add(createdElement);
               UniqueSelection.addMember(this.elder['form'],createdElement); 
               if(uniqueSelectionFamily){
                if(!Array.isArray(uniqueSelectionFamily.familyAlias)) uniqueSelectionFamily.familyAlias = [uniqueSelectionFamily.familyAlias]
                for(let familyAlias of uniqueSelectionFamily.familyAlias){
                    UniqueSelection.expandFamily(uniqueSelectionFamily.groupName,familyAlias,createdElement)
                }
               }
               createdElement.func.harvest({reset:true});
            }
            return this.func;
        }
        function addStackableInputContainer(inputContainerOptions){
            let {destination="section.inputContainers"} = inputContainerOptions;
               let [createdElement]= this.init.addTemplates([[ElementTemplates.stackableInputContainer,{templateOptions:inputContainerOptions,parentElement:destination}]]);
               this.load(e.INPUT_CONTAINER_LIST).add(createdElement);
               UniqueSelection.addMember(this.elder['form'],createdElement);  
            return createdElement.func;
        }
        function removeInputContainer(inputContainer){
            this.load(e.INPUT_CONTAINER_LIST).delete(inputContainer);
            UniqueSelection.deleteMember(this.elder['form'],inputContainer);
            if(inputContainer.load(e.INPUT_CONTAINER_LIST)){
                for(const innerInputContainer of inputContainer.load(e.INPUT_CONTAINER_LIST)){
                    inputContainer.func.removeInputContainer(innerInputContainer);
                }
            }
            inputContainer.remove();
        }
        function addFormControls(...formControlList){
            for(const newFormControl of formControlList){
               let {html,func,eventObj,controlFunctionLabel,uniqueSelectionFamily,classes} = newFormControl;
               let [createdElement]=this.init.addTemplates([[ElementTemplates.formControl,{templateOptions:newFormControl,destination:"section.formControls"}]]);
               if(uniqueSelectionFamily){
                let {familyAliases,groupName} = uniqueSelectionFamily; 
                    if(!Array.isArray(familyAliases)) familyAliases = [familyAliases]
                    for(let familyAlias of familyAliases){
                        UniqueSelection.expandFamily(groupName ?? this ,familyAlias,createdElement)
                    }
                } 
                if(classes){
                    if(!Array.isArray(classes)) classes = [classes]
                    for(let className of classes){
                        createdElement.classList.add(className);
                    }
                }
            }
        }
        function addInputSection(...newSectionNames){
            for(let newSectionName of newSectionNames){
                let newSection = document.createElement("section");
                newSection.classList.add("subordinateInputContainer",newSectionName);
                newSection.dataset[newSectionName];
                 this.querySelector("section.inputContainers").append(newSection);
            }
        }
        ElementTemplates.stackableInputContainer = new ElementTemplate({
            addClasses:["inputContainer","stackableInputContainer"],
            addFunctions:[harvest,retrieve,verify,edit,addInputContainer,addStackableInputContainer,clearVerificationList,removeInputContainer],
            addDataStore:[
                [e.VERIFICATION,"assigned at runtime"],
                [e.HARVEST,"assigned at runtime"],
                [e.EDIT,"assigned at runtime"],
                [e.RETRIEVE,"assigned at runtime"],
                [e.OBJECT_FIELD,"assigned at runtime"],
                [e.HARVESTED_DATA,"assigned at runtime"],
                [e.INPUT_CONTAINER_LIST,Set],
                [e.VERIFICATION_FAILED,Set],

            ],
            onCreationCode:function(mainDiv,options){
                const {
                objectField,
                verify,
                harvest,
                retrieve,
                edit,
                htmlContents,
                addAsElder}=options;

                this.save(e.OBJECT_FIELD,objectField);
                this.save(e.HARVEST,harvest ?? harvestData.bind(mainDiv));
                this.save(e.VERIFICATION,verify ?? verifyHarvestedData.bind(mainDiv));
                this.save(e.RETRIEVE,retrieve);
                this.save(e.EDIT,edit);

                this.init.htmlInsert(htmlContents);
                this.init.addAsElder(addAsElder);
                this.dataset.objectField = objectField;
            }
        });
        ElementTemplates.genericForm = new ElementTemplate({
            mainElement:"form",
            addAsElder:"form",
            addFunctions:[harvestData,verifyHarvestedData,addInputContainer,addStackableInputContainer,switchMode,
                clearVerificationList,resetValues,importObject,editingMode,creationMode,createObject,updateObject,removeInputContainer,
                getHarvestDataMappedByObjectField,addFormControls,addInputSection],
            htmlInsert:function(mainForm,options){
                let html = parseHTML(`
                    <section class='inputContainers'>
                    
                    </section>
                    <section class='formControls'>
                    
                    </section>
                `)
                return html;
            },
            addDataStore:[
                [e.MODE, e.CREATE],
                [e.CONTROLLED_OBJECT_CONSTRUCTOR, "defined at build"],
                [e.CONTROLLED_OBJECT, null],
                [e.VERIFICATION_FAILED, Set],
                [e.HARVESTED_DATA, null],
                [e.PARENT_OBJECT,null],
                [e.INPUT_CONTAINER_LIST,Set]
                ],
                onCreationCode:function(mainForm,options){
                    const{controlledObjectConstructor} = options;
                    this.save(e.CONTROLLED_OBJECT_CONSTRUCTOR, controlledObjectConstructor); 
                    UniqueSelection.addGroup(this,{alternateClasses:["failed"]});
                    UniqueSelection.addFamily(this,[],e.CREATE);
                    UniqueSelection.addFamily(this,[],e.EDIT);
                },

        });



        EventTemplates.deleteTeamDisplayTag = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-button-function='delete']",
            func:function(ev){
                let currentSelected = ev.target.elder['teamSelector'].load(e.CONTENTS);
                let me = ev.target.elder['teamDisplayTag'].load(e.CONTROLLED_OBJECT);
                currentSelected.delete(me);
                ev.target.elder['teamSelector'].func.refreshDisplay();
            }
        });
        
        ElementTemplates.teamDisplayTag = new ElementTemplate({
            htmlInsert:(mainDiv,options)=>parseHTML(`
                <h3>${options.teamOrDiv.name}</h3><button type='button' data-button-function='delete'>X</button>
            `),
            addClasses:"teamDisplayTag",
            addAsElder:"teamDisplayTag",
            addEvents:[EventTemplates.deleteTeamDisplayTag],
            addDataStore:[
                [e.CONTROLLED_OBJECT,null]
            ],
            onCreationCode:function(mainDiv,options){
                let {teamOrDiv} = options;
                this.save(e.CONTROLLED_OBJECT,teamOrDiv);
                if(teamOrDiv instanceof Division){
                    let divTeams = Array.from(teamOrDiv.allTeams).sort((a,b)=>a.name.localeCompare(b.name));
                    if(divTeams.length>0){
                        let list$=newE("ul");
                        for(const team of divTeams){
                            let listEntry$ = newE("li");
                            listEntry$.textContent=team.name;
                            list$.append(listEntry$)
                        }
                        this.append(list$);
                    }
                }

            }
        });
        function refreshTeamOptions(){
            let select$= this.querySelector("select");
            select$.replaceChildren();
            let matchingMap = new Map();
            let allDivisions$ = newE("optgroup");
            allDivisions$.setAttribute("label","All Divisions")
            let allTeams$ = newE("optgroup");
            allTeams$.setAttribute("label","All Teams")
            let allDivisions = Division.allDivisionsArray.sort((a,b)=>a.name?.localeCompare?.(b.name)??0);
            let allTeams = Team.allTeamsArray.sort((a,b)=>a.name?.localeCompare?.(b.name)??0);
            for(const div of allDivisions){
                allDivisions$.append(newOption(div));
            }
            for(const team of allTeams){
                allTeams$.append(newOption(team));
            }
            select$.append(allDivisions$);
            select$.append(allTeams$);
            select$.setAttribute("multiple",true);
            function newOption(teamOrDiv){
                let option$ = newE("option");
                option$.textContent = teamOrDiv.name;
                matchingMap.set(option$,teamOrDiv);
                return option$;
            }
            this.save(e.OBJECT_HANDLING,matchingMap);
        }
        function refreshDisplay(){
            let display$ = this.querySelector("div.teamDisplay");
            display$.replaceChildren();
            for(const teamOrDiv of this.load(e.CONTENTS)){
                if(teamOrDiv.id===null){
                    this.load(e.CONTENTS).delete(teamOrDiv);
                    continue;
                }
                display$.append(ElementTemplates.teamDisplayTag.build(this,{teamOrDiv}));
            }

        }
        function makeSelection(teamOrDivArray){
            let currentlySelected = this.load(e.CONTENTS);
            teamOrDivArray.forEach(x=>currentlySelected.add(x));
            this.func.refreshDisplay();
        }
        function harvestTeamSelection({insertValue,reset=false}){

            if(reset) insertValue = new Set();
            if(insertValue!==undefined){
                this.save(e.CONTENTS,insertValue);
                this.func.refreshDisplay();
                this.func.refreshTeamOptions();
            }
            let selectedSet = this.load(e.CONTENTS)
          
            return new Set(selectedSet);
        }
        EventTemplates.selectTeamOrDivision = ElementTemplate.eventObjMaker({
            triggers:"input",
            queryselection:"select", //attached to selectelement
            func:function(ev){
                let selectedOptions = Array.from(this.selectedOptions);
                let matchingMap = this.elder['teamSelector'].load(e.OBJECT_HANDLING);
                let selectedTeamOrDivArray = selectedOptions.map((option)=>matchingMap.get(option))
                this.elder['teamSelector'].func.makeSelection(selectedTeamOrDivArray);
            },
        });
        ElementTemplates.displayTeamSelection = new ElementTemplate({
            htmlInsert:parseHTML(`
                <select></select>
                <div class='teamDisplay'></div>
            `),
            addFunctions:[refreshTeamOptions,makeSelection,refreshDisplay,[harvestTeamSelection,"harvest"]],
            addEvents:[EventTemplates.selectTeamOrDivision],
            addAsElder:"teamSelector",
            addClasses:"teamSelector",
            addDataStore:[
                [e.CONTENTS,Set],
                [e.OBJECT_HANDLING,Map]
            ],
            onCompletionCode:function(mainDiv,options){
                this.func.refreshTeamOptions();
                oLog.teamSelect = this;
            }
        });
    }
    displayBoard:{
        function refreshDisplayText(){
            let textNode = this.querySelector("div.displayItemText")
           textNode.textContent= this.func.generateDisplayText();
        }
        function generateDisplayText(){
            let textFunc = this.elder["displayBoard"].load(e.DISPLAY_TYPES).get(this.load(e.DISPLAY_TYPES))["textFunc"];
            let displayObj = this.load(e.DISPLAY);
            return textFunc(displayObj);
        }
        function deleteDisplayItem(){
            this.elder['displayBoard'].load(e.DISPLAY).delete(this);
            this.elder['displayBoard'].func.resetAll();
        }
        ElementTemplates.genericDisplayItem = new ElementTemplate({
            addAsElder:"displayItem",
            addClasses:"displayItem",
            htmlInsert:parseHTML(`<div class='displayItemText'></div>`),
            addFunctions:[refreshDisplayText,generateDisplayText,deleteDisplayItem],
            addDataStore:[
                [e.DISPLAY,null],
                [e.DISPLAY_TYPES,null]
            ],
            onCompletionCode: function(mainDiv,options){
                const {displayType,displayObj}=options;
                const {textFunc,attributes,classes,smartHtml} = this.elder["displayBoard"].load(e.DISPLAY_TYPES).get(displayType);
                this.init.addClasses(classes);
                this.init.addAttributes(attributes);
                this.init.htmlSmartInsert(smartHtml);
                this.save(e.DISPLAY,displayObj);
                this.save(e.DISPLAY_TYPES,displayType);
                this.func.refreshDisplayText();
            }
        })
        function addDisplayItem(objectForDisplay,displayType,sectionName){
            if(!displayType || displayType===e.DEFAULT){
                displayType = Array.from(this.load(e.DISPLAY_TYPES).keys())[0]
            }
            let displayItem = ElementTemplates.genericDisplayItem.build(this,{displayObj:objectForDisplay,displayType});
            this.load(e.DISPLAY).add(displayItem);
            if(sectionName){
                this.querySelector(sectionName).append(displayItem)
            } else {
            this.append(displayItem);
            }
            return displayItem;
        }
        function addDisplayType(newDisplayType){
            const {displayType,textFunc=(obj)=>obj.toString(),attributes=[],classes=[],smartHtml} = newDisplayType;
            this.load(e.DISPLAY_TYPES).set(displayType,{displayType,textFunc,attributes,classes,smartHtml});
        }
        function addSection(section){
            const {name="unnamed",classes=[]} =section;
            let sectionHtml = document.createElement("section");
            sectionHtml.dataset.sectionName=name;
            for(const className of classes){
                sectionHtml.classList.add(className);
            }
            this.init.htmlSmartInsert({html:sectionHtml,noClone:true})
        }
        function refreshAllText(){
            let displayItems = this.load(e.DISPLAY);
            for(const displayItem of displayItems){
                displayItem.func.refreshDisplayText();
            }
        }
        function resetAll(){
            let oldContents = new Set(this.load(e.DISPLAY));
            this.func.clearDisplay();
            for(const oldItem of oldContents){
                this.func.addDisplayItem(oldItem.load(e.DISPLAY),oldItem.load(e.DISPLAY_TYPES));
            }
        }
        function clearDisplay(){
            this.save(e.DISPLAY,new Set());
            this.replaceChildren();
        }
        ElementTemplates.genericDisplayBoard = new ElementTemplate({
            addAsElder:"displayBoard",
            addClasses:"displayBoard",
            addFunctions:[addSection,addDisplayItem,addDisplayType,refreshAllText,resetAll,clearDisplay],
            addDataStore:[
                [e.DISPLAY,Set],
                [e.DISPLAY_TYPES,Map]
            ],
            onCreationCode: function(mainDiv,options){
                const {displayTypes=[],sections=[]} = options;

                for(const displayType of displayTypes){
                    this.func.addDisplayType(displayType);
                }
                for(const section of sections){
                    this.func.addSection(section);
                }
            },
            onCompletionCode: function(mainDiv,options){
                
            },
        })
    }
    competitorsSection: {
        objectControl: {
            HTMLTemplates.objectControllerFormControls = function (mainForm$) {
                let html = parseHTML(`
                <div class="formButtonContainer">
                                        <div data-form-mode="edit" class="hiddenByDefault">
                                            <button type="button" data-form-button="save">Save Edits</button>
                                            <button type="button" data-form-button="reset">Reset</button>
                                        </div>
                                        <div data-form-mode="create" class="hiddenByDefault">
                                            <button type="button" data-form-button="create">Create</button>
                                        </div>
                                        <button type="button" data-form-button="cancel">Cancel</button>
                </div>
                `);
                const containerDiv$ = html.querySelector("div.formButtonContainer");
                const editDiv$ = containerDiv$.querySelector("div[data-form-mode='edit']");
                const editHeading$ = mainForm$.querySelector("h1[data-mode='edit']");
                const createDiv$ = containerDiv$.querySelector("div[data-form-mode='create']");
                const createHeading$ =mainForm$.querySelector("h1[data-mode='create']");
                UniqueSelection.addGroup(mainForm$);
                UniqueSelection.addFamily(mainForm$, [editDiv$,editHeading$], e.EDIT);
                UniqueSelection.addFamily(mainForm$, [createDiv$,createHeading$], e.CREATE);
                return containerDiv$;
            }
            //Switch Mode
            function switchMode(newMode, controlledObject) { //this = mainForm
                UniqueSelection.select(this, newMode);
                this.save(e.MODE, newMode);
                if (newMode === e.EDIT && controlledObject) this.save(e.CONTROLLED_OBJECT, controlledObject)
            }

            //Verification
            function verifyAll() {
                const inputContainers = this.querySelectorAll("div.inputContainer");
                for (const inputContainer of inputContainers) {
                    inputContainer.dispatchEvent(MakeEvent.verify);
                }
                return (this.load(e.VERIFICATION_FAILED).size === 0)
            }

            EventTemplates.inputVerification = ElementTemplate.eventObjMaker({
                triggers: "verify",
                func: function (ev) { //attached to mainForm
                    let inputContainer = ev.target;
                    let objectField = inputContainer.dataset.objectField;
                    let verificationFailedSet = this.load(e.VERIFICATION_FAILED);
                    let verificationFunction = this.load(e.VERIFICATION).get(objectField) ?? (() => true);
                    let harvestFunction = this.load(e.HARVEST_FUNCTIONS).get(objectField) ??
                        (Break("no harvest function specified for this objectField", { inputContainer, objectField, mainForm: this }));
                    let verificationResult = verificationFunction(harvestFunction(inputContainer));
                    if (verificationResult) {
                        verificationFailedSet.delete(inputContainer);
                        inputContainer.classList.remove("failed");
                    } else {
                        verificationFailedSet.add(inputContainer);
                        inputContainer.classList.add("failed");
                    }
                }
            });

            //Data Harvest
            function harvestData() { //this = mainForm
                const inputContainers = this.querySelectorAll("div.inputContainer");
                const harvestFunctions = this.load(e.HARVEST_FUNCTIONS);
                const harvestedData = {};
                for (const inputContainer of inputContainers) {
                    const harvestFunc = harvestFunctions.get(inputContainer.dataset.objectField) ??
                        (Break("no harvest function specified for this objectField", { inputContainer, harvestFunctions, mainForm: this }));
                    harvestedData[inputContainer.dataset.objectField] = stringNormalisation(harvestFunc(inputContainer));
                }
                this.save(e.HARVESTED_DATA, harvestedData);
                return harvestedData;
            }

            //Import
            function importObject(importedObj){
                let intendedConstructor = this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR);
                if(importedObj.constructor !== intendedConstructor) Break("Incorrect object attempetd to be passed to form for editing",{mainform:this,importedObj,intendedConstructor});
                this.func.switchMode(e.EDIT,importedObj);
                this.func.populateValues();
            }
            //Update
            function populateValues(){
                let controlledObject = this.load(e.CONTROLLED_OBJECT);
                if(controlledObject===null){
                    Alert("No control object currentnly selected",{mainForm:this},false);
                    return false;
                }
                const inputContainers = this.querySelectorAll("div.inputContainer");
                const harvestFunctions = this.load(e.HARVEST_FUNCTIONS);
                for (const inputContainer of inputContainers) {
                    const harvestFunc = harvestFunctions.get(inputContainer.dataset.objectField) ??
                        (Break("no harvest function specified for this objectField", { inputContainer, harvestFunctions, mainForm: this }));
                    harvestFunc(inputContainer,{insertValue:controlledObject[inputContainer.dataset.objectField]??null});
                }
                this.func.verifyAll();
            }
            function resetFields(){
                this.func.switchMode(e.CREATE,null);
                const inputContainers = this.querySelectorAll("div.inputContainer");
                const harvestFunctions = this.load(e.HARVEST_FUNCTIONS);
                for (const inputContainer of inputContainers) {
                    const harvestFunc = harvestFunctions.get(inputContainer.dataset.objectField) ??
                        (Break("no harvest function specified for this objectField", { inputContainer, harvestFunctions, mainForm: this }));
                    harvestFunc(inputContainer,{reset:true});
                    inputContainer.classList.remove("failed");
                }
                this.load(e.VERIFICATION_FAILED).clear()
            }
            function updateControlledObject(){
                let controlledObject = this.load(e.CONTROLLED_OBJECT);
                if(controlledObject===null){
                    Alert("No control object currentnly selected",{mainForm:this},false);
                    return false;
                }
                if(!this.func.verifyAll()) return false;
                let newData = this.func.harvestData();
                controlledObject.updateSettings(newData);
                this.func.forceNavigatorUpdate();
                return controlledObject;
            }
            EventTemplates.populateControlledObjectValues = ElementTemplate.eventObjMaker({
                triggers:"click", //on button
                queryselection:"button[data-form-button='reset']",
                func:(ev)=>{
                    ev.target.root.func.populateValues();
                }
            });
            EventTemplates.updateControlledObject = ElementTemplate.eventObjMaker({
                triggers:"click", //on button
                queryselection:"button[data-form-button='save']",
                func:(ev)=>{
                    ev.target.root.func.updateControlledObject();
                }
            });

            //Creation
            function objectCreation() { //this = mainForm
                if (!this.func.verifyAll()) return false;
                let harvestedData = this.func.harvestData();
                if (!harvestedData) {
                    Alert("No data has been harvested", { harvestedData, ev, mainForm: this });
                    return;
                }
                let constructorFunction = this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR);
                let parentObject = this.load(e.PARENT_OBJECT);
                let newObject;
                try{
                    newObject = new constructorFunction(harvestedData);
                    if(parentObject!==null){
                        if(parentObject instanceof Team){
                                parentObject.addPlayer(newObject)
                        } else 
                        if(parentObject instanceof Division){
                                parentObject.add(newObject)
                        }
                }
                }
                catch(err){
                    newObject = null;
                    IgnoreError("newObject falied to create",err);
                }
                if(newObject) {
                        this.func.forceNavigatorUpdate();
                        this.func.resetFields();
                    }
                return newObject;
            }

            EventTemplates.initiateCreation = ElementTemplate.eventObjMaker({
                triggers:"click",
                queryselection:"button[data-form-button='create']",
                func:(ev)=>{
                    ev.target.root.func.objectCreation();
                    ev.target.root.querySelector("input").focus();
                }
            });
            EventTemplates.initiateCreationViaEnter = ElementTemplate.eventObjMaker({
                triggers:"keydown",
                func:function(ev){
                    if(ev.key!=="Enter") return;
                    if(this.load(e.MODE)===e.CREATE){
                        this.func.objectCreation();
                        ev.target.root.querySelector("input").focus();
                    } else {
                        this.func.updateControlledObject();
                    }
                    ev.preventDefault();
                }
            });
            EventTemplates.cleanSlate = ElementTemplate.eventObjMaker({
                triggers:"click",
                queryselection:"button[data-form-button='cancel']",
                func:(ev)=>{
                    ev.target.root.func.resetFields();
                }
            });
            function forceNavigatorUpdate(){
                document.querySelectorAll(".navigationContainer").forEach(x=>x.func.refreshAll())
            }
            function receiveNewStack(objArray){
                let controlledObjectConstructor = this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR);
                let createObjectHeadingExtension$=this.querySelector("h1[data-mode='create'] span");
                createObjectHeadingExtension$.replaceChildren();
                this.save(e.PARENT_OBJECT,null);
                for(let i = objArray.length;i>=0;i--){
                    let obj = objArray[i];

                    if( (controlledObjectConstructor===Player && obj instanceof Team) ||
                        (controlledObjectConstructor===Team && obj instanceof Division) ||   
                        (controlledObjectConstructor===Division && obj instanceof Division)  
                    ){
                        createObjectHeadingExtension$.append(`within ${obj.name} [${obj.constructor.name}]`);
                        this.save(e.PARENT_OBJECT,obj);
                        break;
                    }
                }
                
            }
            //when build, use form element as main div
            ElementTemplates.objectController = new ElementTemplate({
                htmlInsert: HTMLTemplates.objectControllerFormControls,
                addFunctions: [switchMode,verifyAll, harvestData, objectCreation,importObject,populateValues,resetFields,updateControlledObject,receiveNewStack,forceNavigatorUpdate],
                addDataStore: [
                [e.MODE, e.CREATE],
                [e.CONTROLLED_OBJECT_CONSTRUCTOR, "defined at build"],
                [e.CONTROLLED_OBJECT, null],
                [e.VERIFICATION, "defined at build"],
                [e.VERIFICATION_FAILED, Set],
                [e.HARVEST_FUNCTIONS, "defined at build"],
                [e.HARVESTED_DATA, null],
                [e.PARENT_OBJECT,null]
                ],
                addEvents: [EventTemplates.inputVerification, 
                            EventTemplates.initiateCreation,
                            EventTemplates.initiateCreationViaEnter,
                            EventTemplates.cleanSlate,
                            EventTemplates.populateControlledObjectValues,
                            EventTemplates.updateControlledObject],
                addAsElder: "form",
                onCompletionCode: function (mainForm, options) {
                    let { verificationFunctions, dataHarvestFunctions } = options;
                    mainForm.save(e.CONTROLLED_OBJECT_CONSTRUCTOR, stringToObject(mainForm.dataset.controlledObjectConstructor)); 
                    mainForm.save(e.VERIFICATION, verificationFunctions ?? new Map()); //verification functions is a map, matching field names with functions to verify input. Verification also involves normalisation. 
                    mainForm.save(e.HARVEST_FUNCTIONS, dataHarvestFunctions ?? new Map()); //for each container, function to harvest the data. Map matching objectField to function. 
                    mainForm.func.switchMode(e.CREATE);
                    if(options.customButtonControls) this.querySelector("div.formButtonContainer").remove();
                }
            });

            
        }
        navigationPanels:{
            ElementTemplates.navigationLink = new ElementTemplate({
                addClasses:"navigationLink",
                onCreationCode: function(mainDiv,options){
                    const {stackMember,stackIndex,insertSpan}= options;
                    let underlinedText = document.createElement("span");
                    underlinedText.classList.add("underlined");
                    if(stackMember.constructor===Function){
                        underlinedText.append(`All ${stackMember.name}s`)
                        this.append(underlinedText)  ;
                    } else {
                        underlinedText.append(`${stackMember.name}`);
                        this.append(`[${stackMember.constructor.name.slice(0,1)}]\xa0`,underlinedText);
                    }
                    if(insertSpan) {
                        let span = document.createElement("span")
                        span.append("\xa0>\xa0");
                        this.append(span);
                    }
                    this.addEventListener("click",(ev)=>this.elder['panel'].func.openObject(stackMember,stackIndex));
                }
            });
                HTMLTemplates.navigationEntry = function(mainDiv){
                    let html = parseHTML(`
                        <span class='buttonHider'><button type='button' data-button-function='explore' tabindex='0'> Open </button></span><!--
                    --><span data-selectable='true' data-pass-through='true'></span><span class='buttonHider'><button type='button' data-button-function='edit' tabindex='0'> Edit</button></span>
                    `);
                    return html;
                };
            let  masterFunctionSet=[
                    {callBack:(htmlElem,ev)=>primaryMasterSelectAction(htmlElem,ev),timing:{startTime:0,endTime:600}},
                    {callBack:(htmlElem,ev)=>secondaryMasterSelectAction(htmlElem,ev),timing:{startTime:600,endTime:Number.POSITIVE_INFINITY}}
                ]
                let slaveFunctionSet =[
                    {callBack:(htmlElem,ev)=>primarySlaveSelectAction(htmlElem,ev),timing:{startTime:0,endTime:600}},
                    {callBack:(htmlElem,ev)=>secondarySlaveSelectAction(htmlElem,ev),timing:{startTime:600,endTime:Number.POSITIVE_INFINITY}}
                ]
                function primaryMasterSelectAction(htmlElem,ev){
                const selected = UniqueSelection.toggle(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["primarySelection"]);
                if(selected) htmlElem.elder['entry'].func.sendObjTo(e.LEFT_SLAVE);
                else htmlElem.elder['navigator'].func.sendStackToForms();
                }
                function secondaryMasterSelectAction(htmlElem,ev){
                const selected = UniqueSelection.toggle(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["secondarySelection"]);
                    if(selected) htmlElem.elder['entry'].func.sendObjTo(e.RIGHT_SLAVE);
                }

                function primarySlaveSelectAction(htmlElem,ev){
                    let multySelectStart = htmlElem.elder['panel'].load(e.MULTY_SELECT_START);
                    if(!multySelectStart){
                        multySelectStart = htmlElem.elder['entry'];
                        htmlElem.elder['panel'].save(e.MULTY_SELECT_START,multySelectStart);
                    }
                    let sameSection = multySelectStart.elder['section']===htmlElem.elder['section']
                        
                    if(ev.shiftKey && sameSection){
                            UniqueSelection.select(htmlElem.elder["panel"],multySelectStart,false,["primarySelection"]);
                            let state = 2;
                            for(const entry of Array.from(htmlElem.elder['entry'].parentNode.children)){
                                if(entry===htmlElem.elder['entry'] || entry ===multySelectStart) state--;
                                if(state<2){
                                    UniqueSelection.select(htmlElem.elder["panel"],entry,true,["primarySelection"]);
                                }
                                if(state===0) return;
                            }
                            UniqueSelection.select(htmlElem.elder["panel"],htmlElem,true,["primarySelection"]);
                    } else {
                        let action = (ev.ctrlKey) ? "toggle":"select";
                        let toggledSelectionOn = UniqueSelection[action](htmlElem.elder["panel"],htmlElem.elder['entry'],(ev.ctrlKey && sameSection),["primarySelection"]) ;
                        if(toggledSelectionOn) htmlElem.elder['panel'].save(e.MULTY_SELECT_START,htmlElem.elder['entry']);
                    }
                }
                function secondarySlaveSelectAction(htmlElem,ev){
                    htmlElem.elder['entry'].func.sendObjTo(e.MASTER);
                }

                function sendObjTo(destinationIdentity){
                    let destinationPanel = this.elder["navigator"].load(destinationIdentity);
                    destinationPanel.func.openObject(this.load(e.CONTROLLED_OBJECT),0);
                }

                EventTemplates.exploreObject=ElementTemplate.eventObjMaker({
                    triggers:["click"],
                    queryselection:"button[data-button-function='explore']",
                    func:(ev)=>{
                        let exploreButton = ev.target;
                        let controlledObject = exploreButton.elder['entry'].load(e.CONTROLLED_OBJECT);
                        exploreButton.elder['panel'].func.openObject(controlledObject);
                        if(isSpaceBar(ev)) exploreButton.elder['panel'].querySelector("li span[data-selectable]").focus();
                    }
                });

                EventTemplates.editObject = ElementTemplate.eventObjMaker({
                    triggers:["click"],
                    queryselection:"button[data-button-function='edit']",
                    func:function(ev){
                        let controlledObject = ev.target.elder['entry'].load(e.CONTROLLED_OBJECT);
                        ev.target.elder['navigator'].load(e.ASSOCIATED_FORMS).forEach((form,formConstructor)=>{
                            try{
                                if(controlledObject instanceof formConstructor) {
                                    form.func.resetFields();
                                    form.func.importObject(controlledObject)
                                    form.querySelector("input").focus();
                                }
                            } catch(err){
                                IgnoreError("Form could'nt edit this object",err)
                            }
                        });
                    }
                });

            ElementTemplates.genericNavigationEntry = new ElementTemplate({
                htmlInsert:HTMLTemplates.navigationEntry,
                addClasses:"navigationEntry",
                addAsElder:"entry",
                addEvents:[EventTemplates.exploreObject,EventTemplates.editObject],
                addDataStore:[e.CONTROLLED_OBJECT,null],
                addFunctions:[sendObjTo],
                onCreationCode:function(mainLi,options){
                    let controlledObject = options.newEntryObject;
                    let objectLabel$=this.querySelector('span[data-selectable]');
                    objectLabel$.setAttribute("tabindex",0);
                    this.save(e.CONTROLLED_OBJECT,controlledObject);
                    
                    mainLi.addEventListener("contextmenu",(ev)=>ev.preventDefault());
                    
                }
            });
            ElementTemplates.navigationEntry = new ElementTemplate({
                mainElement: ElementTemplates.genericNavigationEntry,
                onCreationCode:function(mainLi,options){
                    let objectLabel$=this.querySelector('span[data-selectable]');
                    let panelIdentity = this.elder["panel"].load(e.IDENTITY);
                    let controlledObject = options.newEntryObject;
                    objectLabel$.prepend(controlledObject.name);
                    if(panelIdentity===e.MASTER){
                        ExclusiveLongClickTimer( mainLi,masterFunctionSet)
                        mainLi.addEventListener("pointerup",(ev)=>{
                            if(ev.button!==2) return;
                            secondaryMasterSelectAction(objectLabel$,ev);
                        })
                    } else {
                        ExclusiveLongClickTimer( mainLi,slaveFunctionSet);
                        objectLabel$.addEventListener("pointerup",(ev)=>{
                            if(ev.button!==2) return;
                            secondarySlaveSelectAction( objectLabel$,ev);
                        })
                    }

                }
            });
                HTMLTemplates.navigationSection = function(mainDiv){
                    let html = parseHTML(`
                        <div class='navigationSubHeading'></div>
                        <ul>
                        </ul>
                    `);
                    return html
                }
                function addNavigationEntry(newEntryObject,newEntryLocation$){
                    let newLi$= document.createElement("li");
                    newEntryLocation$.append(ElementTemplates.navigationEntry.build(this,{useAsMainDiv:newLi$,newEntryObject}))
                    UniqueSelection.addMember(this.elder["panel"],newLi$);
                }
            ElementTemplates.genericNavigationSection = new ElementTemplate({
                htmlInsert:HTMLTemplates.navigationSection,
                addClasses:"navigationSection",
                addAsElder:"section",
                addFunctions:[addNavigationEntry],
                addDataStore:[
                    [e.CONTENTS,null]
                ],
                onCreationCode: function(mainDiv,options){
                    let {individualSectionParameters} = options
                    let {subHeading,funcToObtainArray,propertyName} = individualSectionParameters;
                    this.save(e.CONTENTS,individualSectionParameters);

                    let subHeadingDiv$=mainDiv.querySelector("div.navigationSubHeading");
                    

                    let currentObject = this.elder["panel"].load(e.CURRENTLY_OPEN);
                    let entryArray = funcToObtainArray(currentObject[propertyName] ?? currentObject);

                    if(subHeading && entryArray.length>0){
                        subHeadingDiv$.append(subHeading);
                    } else {
                        subHeadingDiv$.remove();
                    }

                }
            });
            ElementTemplates.navigationSection = new ElementTemplate({
                mainElement:ElementTemplates.genericNavigationSection,
                onCreationCode: function(mainDiv,options){
                    let individualSectionParameters = this.load(e.CONTENTS);
                    let {subHeading,funcToObtainArray,propertyName} = individualSectionParameters;
                    let entryList$=mainDiv.querySelector("ul");
                    let currentObject = this.elder["panel"].load(e.CURRENTLY_OPEN);
                    let entryArray = funcToObtainArray(currentObject[propertyName] ?? currentObject);

                    for(const newEntryObject of entryArray){
                        this.func.addNavigationEntry(newEntryObject,entryList$);
                    }

                }
            });

            HTMLTemplates.controlPanel = function(mainDiv){
                let html = parseHTML(`
                    <button type='button' data-button-function="copyLeftToRight"> +> </button>
                    <button type='button' data-button-function="moveLeftToRight"> >> </button>
                    <button type='button' data-button-function="moveRightToLeft"> << </button>
                    <button type='button' data-button-function="copyRightToLeft"> <+ </button>
                `);
                return html;
            }
            

            ElementTemplates.navigationControlPanel = new ElementTemplate({
                htmlInsert:HTMLTemplates.controlPanel,
                addFunctions:[],
                addClasses:"navigationControlPanel",
                addAsElder:"controlPanel",
                onCreationCode: function(mainDiv,options){
                
                    this.querySelector("button[data-button-function='moveLeftToRight'").addEventListener("click",(ev)=>{
                        this.elder["navigator"].func.moveObjects(e.LEFT_SLAVE,e.RIGHT_SLAVE,true)
                    })
                    this.querySelector("button[data-button-function='copyLeftToRight'").addEventListener("click",(ev)=>{
                        this.elder["navigator"].func.moveObjects(e.LEFT_SLAVE,e.RIGHT_SLAVE,false)
                    })
                    this.querySelector("button[data-button-function='copyRightToLeft'").addEventListener("click",(ev)=>{
                        this.elder["navigator"].func.moveObjects(e.RIGHT_SLAVE,e.LEFT_SLAVE,false)
                    })
                    this.querySelector("button[data-button-function='moveRightToLeft'").addEventListener("click",(ev)=>{
                        this.elder["navigator"].func.moveObjects(e.RIGHT_SLAVE,e.LEFT_SLAVE,true)
                    })
                }
            });
            HTMLTemplates.navigationPanel = function(mainDiv){
                let htmlString = `
                <div class="navigationPanelButtons">
                    <label> Display All </label>
                    <button type="button" data-display-all='Division' >Divisions</button>
                    <button type="button" data-display-all='Team'>Teams</button>
                    <button type="button" data-display-all='Player'>Players</button>
                </div>

                <div class="navigationCurrentLocation">

                </div>

                <div class="navigationStackDisplay">
                    
                </div>

                <div class="navigationPanelDisplay">

                </div>
                <div class='removalPane'>
                    <button type='button' data-button-function='remove'>Remove</button>
                    <button type='button' data-button-function='delete'>Delete</button>
                </div>
            </div>`           
                let html = parseHTML(htmlString);
                let navMaster$ = html.querySelector("div.navigationPanelButtons");
                let buttons$ = navMaster$.querySelectorAll("button[data-display-all]");
                // UniqueSelection.addGroup(navMaster$);
                // buttons$.forEach((button)=>UniqueSelection.addMember(navMaster$,button));
                buttons$.forEach((button)=>button.addEventListener("click",(ev)=>{
                    button.elder["panel"].func.openObject(stringToObject(button.dataset.displayAll),0);
                }));
                return html;
            }
            function openObject(object,trimStackToLength=false){
                if(trimStackToLength!==false) this.func.trimStack(trimStackToLength);
                this.save(e.CURRENTLY_OPEN,object);
                this.save(e.SECTION_PARAMETERNS,this.func.getSectionParameters(object,this.load(e.IDENTITY)));
                this.load(e.STACK).push(object);
                this.func.refreshAppearance();
            }
            function getSelected(byClass="primarySelection"){
                let displayPanel$ = this.querySelector("div.navigationPanelDisplay");
            return  Array.from(displayPanel$.querySelectorAll(`.${byClass}`)).map((entry)=>entry.load(e.CONTROLLED_OBJECT));
            }
            function refreshAppearance(){
                let currentObject = this.load(e.CURRENTLY_OPEN);
                if(currentObject===null) return false;
                let displayPanel$ = this.querySelector("div.navigationPanelDisplay");
                let stackDisplay$= this.querySelector("div.navigationStackDisplay");
                let currentLocationDisplay$= this.querySelector("div.navigationCurrentLocation");

                const currentPrimarySelections =new Set(this.func.getSelected("primarySelection"));
                const currentSecondarySelections = new Set(this.func.getSelected("secondarySelection")); 
                this.func.wipeDisplays();
                //Entries
                let sectionParameters = this.load(e.SECTION_PARAMETERNS);
                for(const individualSectionParameters of sectionParameters){
                    displayPanel$.append(this.load(e.NAVIGATION_SECTION_TEMPLATE).build(this,{individualSectionParameters}))
                }
                //Name
                
                let appendText =(currentObject.constructor===Function) ? `All ${currentObject.name}s`:`${currentObject.name} [${currentObject.constructor.name}]`;
                currentLocationDisplay$.append(appendText)
                //Stack
                let stack = this.load(e.STACK);
                if(stack.length>1){
                    for(let i=0;i<stack.length;i++){
                        const stackMember = stack[i];
                        stackDisplay$.append(ElementTemplates.navigationLink.build(this,{stackMember,stackIndex:i,insertSpan:i<(stack.length-1)}))
                    }
                }

                //Replace Selections
                const allEntries = this.querySelectorAll(".navigationEntry");
                let primarySection,secondarySection;
                for(const entry of allEntries){
                    const controlledObject = entry.load(e.CONTROLLED_OBJECT);
                    const section = entry.elder['section'];
                    if(currentPrimarySelections.has(controlledObject) && section === (primarySection??=section)){
                        UniqueSelection.select(this,entry,true,["primarySelection"]);
                    }
                    if(currentSecondarySelections.has(controlledObject) && section === (secondarySection??=section)){
                        UniqueSelection.select(this,entry,true,["secondarySelection"]);
                    }

                }
                //Update associated form headings
                forceCSSReflow();
                this.elder['navigator']?.func.sendStackToForms();
            }
            function trimStack(toLength){
                this.load(e.STACK).length=toLength;
            }
            function wipeDisplays(){
                this.querySelector("div.navigationPanelDisplay").replaceChildren();
                this.querySelector("div.navigationStackDisplay").replaceChildren();
                this.querySelector("div.navigationCurrentLocation").replaceChildren();
                UniqueSelection.deleteGroup(this);
                UniqueSelection.addGroup(this,{alternateClasses:["primarySelection","secondarySelection"]});
            }
            function deleteObjects(objects){
                console.log(objects);
                for(const object of objects){
                    if(object instanceof Player){
                        object.deletePlayer();
                    } else if(object instanceof Team){
                        object.deleteTeam();
                    } else if(object instanceof Division){
                        object.deleteDivision();
                    }
                }
            }
            function getPlayingSectionParameters(object,panelIdentity){
                let sectionParameters;

                if (object === Player){
                    sectionParameters = [{
                        subHeading:null,
                        propertyName:"allPlayersArray",
                        funcToObtainArray: x=>x
                    }]
                } else if (object === Team ){
                    sectionParameters = [{
                        subHeading:null,
                        propertyName:"allTeams",
                        funcToObtainArray: x=>Array.from(x.values())
                    }]
                } else if (object === Division ){
                    sectionParameters = [{
                        subHeading:null,
                        propertyName:"allDivisionsArray",
                        funcToObtainArray: allDivArray=>{
                            let allDivSet = new Set(allDivArray);
                                allDivArray.forEach(div=>{if(div.parentDivisions.size>0) allDivSet.delete(div)});
                            return Array.from(allDivSet);
                        }
                    },
                    {
                        subHeading:"All Subdivisions",
                        propertyName:"allDivisionsArray",
                        funcToObtainArray: allDivArray=>{
                            let allDivSet = new Set(allDivArray);
                                allDivArray.forEach(div=>{if(div.parentDivisions.size===0) allDivSet.delete(div)});
                            return Array.from(allDivSet);
                        }
                    }]
                } else if (object instanceof Player ){
                    sectionParameters =[
                        {subHeading:"Teams",
                        propertyName:"teams",
                        funcToObtainArray: teamsSet=>Array.from(teamsSet)}
                    ]

                } else if (object instanceof Team ){
                    sectionParameters =[
                        {subHeading:"Players",
                        propertyName:"players",
                        funcToObtainArray: playersMap=>Array.from(playersMap.keys())},
                        {subHeading:"In Divisions",
                        propertyName:"divisions",
                        funcToObtainArray: divisionSet=>Array.from(divisionSet)}
                    ]

                    
                } else if (object instanceof Division ){
                    sectionParameters =[
                        {subHeading:"Sub-Divisions",
                        propertyName:"subDivisions",
                        funcToObtainArray: subDivisionsSet=>Array.from(subDivisionsSet)},
                        {subHeading:"Teams",
                        propertyName:"teams",
                        funcToObtainArray: teamsSet=>Array.from(teamsSet)},
                        {subHeading:"In Divisions",
                        propertyName:"parentDivisions",
                        funcToObtainArray: divisionSet=>Array.from(divisionSet)}];

                        if(panelIdentity===e.MASTER) sectionParameters.push(
                            {subHeading:"All Possible Sub-Divisions",
                            propertyName:"allSubDivisions",
                            funcToObtainArray: subDivisionsSet=>Array.from(subDivisionsSet)},
                            {subHeading:"All Possible Teams",
                            propertyName:"allTeams",
                            funcToObtainArray: teamsSet=>Array.from(teamsSet)});
                    
                } else if(true){
                    Break("Can only get section parameters for players, teams and divisions",{object})
                }
                return sectionParameters
            }
            ElementTemplates.genericNavigationPanel = new ElementTemplate({
                label:"genericNavigationPanel",
                addClasses:"navigationPanel",
                addAsElder:"panel",
                addFunctions:[openObject,trimStack,wipeDisplays,getSelected,refreshAppearance,deleteObjects,[getPlayingSectionParameters,"getSectionParameters"]],
                addDataStore:[
                    [e.STACK,Array],
                    [e.CURRENTLY_OPEN,null],
                    [e.SECTION_PARAMETERNS,Set],
                    [e.IDENTITY,null],
                    [e.MULTY_SELECT_START,null],
                    [e.NAVIGATION_SECTION_TEMPLATE,null]
                ],
                onCreationCode:function(mainDiv,options){
                    let {identity} = options;
                    this.save(e.IDENTITY,identity);
                    this.dataset.identity=identity.description;
                }

            });
            ElementTemplates.navigationPanel = new ElementTemplate({
            mainElement:ElementTemplates.genericNavigationPanel,
            htmlInsert:HTMLTemplates.navigationPanel,
                onCreationCode:function(mainDiv,options){
                    let {identity} = options;
                    this.elder['navigator'].save(identity,this);
                    this.save(e.NAVIGATION_SECTION_TEMPLATE,ElementTemplates.navigationSection)
                    const removalPane$ = this.querySelector('div.removalPane');
                    const deleteButton$ = removalPane$.querySelector('button[data-button-function="delete"]');
                    const removeButton$ = removalPane$.querySelector('button[data-button-function="remove"]');
                    deleteButton$.addEventListener("click",(ev)=>{
                        this.func.deleteObjects(this.func.getSelected("primarySelection"));
                        this.elder['navigator'].func.refreshAll();
                    })
                    removeButton$.addEventListener("click",(ev)=>{
                        this.elder['navigator'].func.moveObjects(identity,identity,true);
                        this.elder['navigator'].func.refreshAll();
                    })
                }

            });
            ElementTemplates.navigationSlaveContainer = new ElementTemplate({
                addClasses:"navigationSlaveContainer",
                addTemplates:[[ElementTemplates.navigationPanel,{templateOptions:{identity:e.LEFT_SLAVE}}],
                            ElementTemplates.navigationControlPanel,
                            [ElementTemplates.navigationPanel,{templateOptions:{identity:e.RIGHT_SLAVE}}]]
            });

            function moveObjects(originPanelIdentity,destinationPanelIdentity,deleteOld=true){
                let originUnit = this.elder['navigator'].load(originPanelIdentity).load(e.CURRENTLY_OPEN);
                let objectArray =this.elder['navigator'].load(originPanelIdentity).func.getSelected("primarySelection")
                let destinationUnit = this.elder['navigator'].load(destinationPanelIdentity).load(e.CURRENTLY_OPEN);
                if(objectArray.length===0) return false; 
                const stableConstructor = objectArray[0].constructor;
                if(stableConstructor===Function) Break("Cannot move a constructor",{objectArray});
                const consistentObjectSet = new Set();
                objectArray.forEach((obj)=>{if(obj instanceof stableConstructor) consistentObjectSet.add(obj)});
            //Add new objects
            if(originUnit!==destinationUnit){
                        let destinationAddingFunction = false;
                    if(stableConstructor === Player){
                            if(destinationUnit=== Player){
                                destinationAddingFunction = null;
                            } else if(destinationUnit instanceof Team){
                                destinationAddingFunction="addPlayer"
                            }
                    } else if (stableConstructor === Team){
                            if(destinationUnit=== Team){
                                destinationAddingFunction = null;
                            } else if(destinationUnit instanceof Division){
                                destinationAddingFunction="add"
                            }
                    } else if (stableConstructor === Division){
                            if(destinationUnit=== Division){
                                destinationAddingFunction = null;
                            } else if(destinationUnit instanceof Division){
                                destinationAddingFunction="add"
                            }
                    }
                    if(destinationAddingFunction===false) return false;

                        
                        if(destinationAddingFunction!==null) {
                            consistentObjectSet.forEach(obj=>{
                                    let success=false;
                                    try{
                                    success=destinationUnit[destinationAddingFunction](obj)
                                    } catch(err){
                                        success=false;
                                    }
                                    if(!success) consistentObjectSet.delete(obj);
                            });
                            this.elder['navigator'].load(destinationPanelIdentity).func.refreshAppearance();
                        }
                }
            //Remove old ones
            if(deleteOld){
                    let originRemovingFunction = null;

                    if(originUnit.constructor===Function){
                            originRemovingFunction = null;

                    } else if (originUnit instanceof Team){
                                originRemovingFunction="removePlayer"

                    } else if (originUnit instanceof Division){
                                originRemovingFunction="remove"
                    }
                    if(originRemovingFunction!==null) {
                        consistentObjectSet.forEach(obj=>originUnit[originRemovingFunction](obj));
                        this.elder['navigator'].load(originPanelIdentity).func.refreshAppearance();
                    }
                }
            }
            function sendStackToForms(){
                let forms = this.load(e.ASSOCIATED_FORMS);
                let masterStack = this.load(e.MASTER).load(e.STACK);
                let masterSelection = this.load(e.MASTER).func.getSelected("primarySelection");
                let totalMasterStack = [...masterStack,...masterSelection]
                for(const [constructor,form] of forms){
                    try{
                        if(!form.func) continue;
                        form.func.receiveNewStack(totalMasterStack);
                    } catch(err){
                    IgnoreError("sending stack failded",err)
                    }
                }
            }
            function refreshAll(){
                this.load(e.MASTER).func.refreshAppearance();
                this.load(e.LEFT_SLAVE).func.refreshAppearance();
                this.load(e.RIGHT_SLAVE).func.refreshAppearance();
            }

            ElementTemplates.navigationContainer = new ElementTemplate({
                addClasses:"navigationContainer",
                addAsElder:"navigator",
                addFunctions: [moveObjects,sendStackToForms,refreshAll],
                addTemplates:[[ElementTemplates.navigationPanel,{templateOptions:{identity:e.MASTER}}],ElementTemplates.navigationSlaveContainer],
                addDataStore:[
                    [e.MODE,e.DISPLAY_ALL],
                    [e.MASTER,null],
                    [e.LEFT_SLAVE,null],
                    [e.RIGHT_SLAVE,null],
                    [e.ASSOCIATED_FORMS,null]
                ],
                onCreationCode:function(mainDiv,options){
                    const {associatedForms} = options;
                    let associatedFormsMap = new Map();
                    for(const form of associatedForms){
                        let constructor = stringToObject(form.dataset.controlledObjectConstructor);
                        associatedFormsMap.set(constructor,form);
                    }
                    this.save(e.ASSOCIATED_FORMS,associatedFormsMap);
                },
                onCompletionCode:function(mainDiv,options){
                    try{
                    let formConstructor = this.load(e.ASSOCIATED_FORMS)?.entries()?.next()?.value?.[0]
                    if(formConstructor) this.load(e.MASTER).func.openObject(formConstructor);
                } catch(err){
                    IgnoreError("Failed to auto show navigation for this tab",err)
                }
                }
            });

            
        }
            // EventTemplates.
        setUpSection: {
        
            //Set-up competitor menu
            const competitorSectionDisplayArea$ = getE("#competitorSectionDisplayArea")
            for (let i = 1; i < competitorSectionMenu$.children.length; i++) {
                let menuLink = competitorSectionMenu$.children[i];
                let section = competitorSectionDisplayArea$.children[i-1];
                UniqueSelection.addFamily("competitorsMenu",[menuLink,section], menuLink);

                competitorSectionMenu$.children[i].addEventListener("click", (ev) => {
                    UniqueSelection.select("competitorsMenu", menuLink);
                    section.querySelector("nav div.navigationContainer").func.refreshAll();
                })
            }
            // Set-up forms and nav

            divisionNav$.append(ElementTemplates.navigationContainer.build(null,{associatedForms:[divisionForm$]}));
            teamNav$.append(ElementTemplates.navigationContainer.build(null,{associatedForms:[teamForm$]}));
            playerNav$.append(ElementTemplates.navigationContainer.build(null,{associatedForms:[playerForm$]}));
            combinedNav$.append(ElementTemplates.navigationContainer.build(null,{associatedForms:[combinedFormDivision$,combinedFormTeam$,combinedFormPlayer$]}));

            ElementTemplates.objectController.build(null, {
                useAsMainDiv: divisionForm$,
                verificationFunctions: new Map([
                    ["name",Verify.notBlank],
                ]),
                dataHarvestFunctions: new Map([
                    ["name",Harvest.standardTextInput],
                ])
            });
            ElementTemplates.objectController.build(null, {
                useAsMainDiv: teamForm$,
                verificationFunctions: new Map([
                    ["name",Verify.notBlank],
                ]),
                dataHarvestFunctions: new Map([
                    ["name",Harvest.standardTextInput],
                ])
            });
        
            ElementTemplates.objectController.build(null, {
                useAsMainDiv: playerForm$,
                verificationFunctions: new Map([
                    ["firstName",Verify.notBlank],
                    ["preferredName",null],
                    ["lastName",Verify.notBlank],
                    ["comment",null]
                ]),
                dataHarvestFunctions: new Map([
                    ["firstName",Harvest.standardTextInput],
                    ["preferredName",Harvest.standardTextInput],
                    ["lastName",Harvest.standardTextInput],
                    ["comment",Harvest.standardTextInput]
                ])
            });
            ElementTemplates.objectController.build(null, {
                useAsMainDiv: combinedFormPlayer$,
                verificationFunctions: new Map([
                    ["firstName",Verify.notBlank],
                    ["preferredName",null],
                    ["lastName",Verify.notBlank],
                    ["comment",null]
                ]),
                dataHarvestFunctions: new Map([
                    ["firstName",Harvest.standardTextInput],
                    ["preferredName",Harvest.standardTextInput],
                    ["lastName",Harvest.standardTextInput],
                    ["comment",Harvest.standardTextInput]
                ])
            });
            ElementTemplates.objectController.build(null, {
                useAsMainDiv: combinedFormDivision$,
                verificationFunctions: new Map([
                    ["name",Verify.notBlank],
                ]),
                dataHarvestFunctions: new Map([
                    ["name",Harvest.standardTextInput],
                ])
            });
            ElementTemplates.objectController.build(null, {
                useAsMainDiv: combinedFormTeam$,
                verificationFunctions: new Map([
                    ["name",Verify.notBlank],
                ]),
                dataHarvestFunctions: new Map([
                    ["name",Harvest.standardTextInput],
                ])
            });
        }
    }
    bracketSection:{

        menu:{
            setUp:{
                //Competition Name
                let updateCompetitionNameForm$ = bracketSectionMenuContainer$.querySelector("form[data-controlled-object-constructor='Competition']")
                ElementTemplates.objectController.build(null,{
                    useAsMainDiv:updateCompetitionNameForm$,
                    customButtonControls:true,
                    verificationFunctions: new Map([
                        ["name",Verify.notBlank],
                    ]),
                    dataHarvestFunctions: new Map([
                        ["name",Harvest.standardTextInput],
                    ])
                })
                let compCreateButton$= updateCompetitionNameForm$.querySelector("button");
                
                    function createComp(){
                        updateCompetitionNameForm$.func.objectCreation();
                        updateCompetitionNameForm$.func.populateValues();
                    }
                    compCreateButton$.addEventListener("click",createComp);

                function compCreationHandler(observer,observation){
                    if(observer!==CodeObserver.Creation) return false;
                    convertCreateButtonToUpdate();
                }
                CodeObserver.addHandler(Competition,compCreationHandler);

                function convertCreateButtonToUpdate(){
                    if(compCreateButton$.dataset.buttonFunction!=="create") return false;
                    compCreateButton$.removeEventListener("click",createComp);
                    CodeObserver.removeHandler(Competition,compCreationHandler)
                    updateCompetitionNameForm$.func.importObject(Competition.current);
                    compCreateButton$.dataset.buttonFunction = 'update';
                    compCreateButton$.textContent = 'Update';
                    compCreateButton$.addEventListener("click",(ev)=>{
                        updateCompetitionNameForm$.func.updateControlledObject()
                    });
                }
               
                //Phase Editor
                phaseEditor:{
                    

                    gameStageInputMaker = function(form){
                        let baseStackableInput$ = ElementTemplates.stackableInputContainer.build(form,{
                            objectField:"gameStages",
                            addAsElder:"gamestages",
                            htmlContents:parseHTML(`
                            <section class='inputContainers'>
                            </section>
                            <button type='button' data-button-function='newLineInput'> + </button>
                            `),
                            retrieve:Retreive.accessMap("currentSettings"),
                            harvest:(inputContainer,{insertValue,reset})=>{
                                if(reset){
                                    insertValue = [ 
                                    { label: "Game", playTime: true, playerAvailable: false, endAtMiliSecond: 20*60*1000 },
                                    { label: "Change-Over", playTime: false, playerAvailable: true, endAtMiliSecond: 30*60*1000 }
                                    ]
                                }
                                if(insertValue!==undefined){
                                    let newLineSection = inputContainer.querySelector("section.inputContainers");
                                    for(const innerInput of inputContainer.load(e.INPUT_CONTAINER_LIST)){
                                        inputContainer.func.removeInputContainer(innerInput);
                                    }
                                    let cumultativeTime=0;
                                    for(const lineData of insertValue){
                                        let lineLength = lineData.endAtMiliSecond - cumultativeTime;
                                        cumultativeTime=lineData.endAtMiliSecond;
                                        lineData.lengthMin = Math.floor(lineLength/60000);
                                        lineData.lengthSec = Math.floor((lineLength%60000)/1000);
                                        gameStageLineInputAdder(inputContainer,newLineSection).func.harvest({insertValue:lineData});
                                    }
                                }
                                let harvestedData= new Map();
                                let returnData = [];
                                let cumultativeTime=0;
                                for(const innerInput of inputContainer.load(e.INPUT_CONTAINER_LIST)){
                                let innerData= innerInput.func.harvest();
                                let innerDataLength = innerData.lengthMin*60000+innerData.lengthSec*1000;
                                innerData.endAtMiliSecond = cumultativeTime + innerDataLength;
                                cumultativeTime= cumultativeTime + innerDataLength;
                                harvestedData.set(innerInput,innerData);
                                returnData.push(innerData);
                                }
                                inputContainer.save(e.HARVESTED_DATA,harvestedData);
                                return returnData;
                            },
                            edit:Edit.newSettings
                        });
                        form.load(e.INPUT_CONTAINER_LIST).add(baseStackableInput$);
                        let newLineSection$ = baseStackableInput$.querySelector("section.inputContainers");
                        gameStageLineInputAdder(baseStackableInput$,newLineSection$);

                        baseStackableInput$.querySelector("button[data-button-function='newLineInput']").addEventListener("click",(ev)=>{
                           let newLine= gameStageLineInputAdder(baseStackableInput$,newLineSection$);
                           UIManagerObject.helperFunctions.creationAnimation(newLine);
                        });

                        return baseStackableInput$;                    
                    }
                    function gameStageLineInputAdder(container,destination){
                        let lineInput$ = ElementTemplates.stackableInputContainer.build(container,{
                            addAsElder:"lineinput",
                            objectField:"null",
                            htmlContents:parseHTML(`
                            <section class='inputContainers'>
                            </section>
                            <button type='button' data-button-function='deleteInputLine'> x </button>
                            `),
                            harvest:(inputContainer,{insertValue})=>{
                                
                                let harvestedData= new Map();
                                let returnData ={};
                                
                                    for(const innerInput of inputContainer.load(e.INPUT_CONTAINER_LIST)){
                                        let objectField = innerInput.load(e.OBJECT_FIELD);
                                        let innerData = innerInput.func.harvest({insertValue:insertValue?.[objectField]});
                                        harvestedData.set(innerInput,innerData);
                                        returnData[objectField]=innerData;
                                    }
                                    inputContainer.save(e.HARVESTED_DATA,harvestedData);
                                
                                return returnData;
                            },
                        });
                        container.load(e.INPUT_CONTAINER_LIST).add(lineInput$);
                        lineInput$.func.addInputContainer(
                            {
                                objectField:"label",
                                htmlContents:HTMLTemplates.smartStandardText("Name"),
                                verify:Verify.notBlank,
                                harvest:Harvest.smartStandardTextInput("Stage Name"),
                            },
                            {
                                objectField:"playTime",
                                htmlContents:HTMLTemplates.smartStandardSingleCheckbox("Game Time"),
                                verify:(value)=>(value===true||value===false),
                                harvest:Harvest.standardSingleCheckbox,
                            },
                            {
                                objectField:"playerAvailable",
                                htmlContents:HTMLTemplates.smartStandardSingleCheckbox("Players Available"),
                                verify:(value)=>(value===true||value===false),
                                harvest:Harvest.standardSingleCheckbox,
                            },
                            {
                                objectField:"lengthMin",
                                htmlContents:HTMLTemplates.smartStandardNumber("Minutes"),
                                verify:Verify.notBlank,
                                harvest:Harvest.smartStandardNumber("0"),
                            },
                            {
                                objectField:"lengthSec",
                                htmlContents:HTMLTemplates.smartStandardNumber("Seconds"),
                                verify:Verify.notBlank,
                                harvest:Harvest.smartStandardNumber("0"),
                            }
                        )

                        destination.append(lineInput$);
                        lineInput$.querySelector("button[data-button-function='deleteInputLine']").addEventListener("click",(ev)=>{
                            container.func.removeInputContainer(lineInput$);
                        })
                        return lineInput$;
                    }
                    //Make pop-up
                    const phasePopUp$ = ElementTemplates.popUpBase.build(null);
                    KeyNodes.popUp.phaseEditor$ = phasePopUp$;

                    const phaseEditor$ = ElementTemplates.genericForm.build(phasePopUp$,{controlledObjectConstructor:Phase});
                    phaseEditor$.init.addClasses("phaseEditor")

                    
                    phaseEditor$.init.serialFunctions("switchMode",function disablePhaseTypeSelector(newMode){
                        if(newMode===e.EDIT){
                            this.querySelector(".inputContainer[data-object-field='phaseType'] select").disabled=true;
                        } else if(newMode ===e.CREATE){
                            this.querySelector(".inputContainer[data-object-field='phaseType'] select").disabled=false;
                        }
                    })
                    
                    bracketSectionMenuContainer$.querySelector("button[data-button-function='createPhase']").addEventListener("click",()=>{
                        phaseEditor$.func.switchMode(e.CREATE);
                        phaseEditor$.func.resetValues(true);
                        phasePopUp$.func.openPopUp();
                    
                    });

                    phasePopUp$.querySelector("section").append(phaseEditor$);
                    phaseEditor$.func.addInputContainer(
                    {
                        objectField:"name",
                        htmlContents:HTMLTemplates.smartStandardText("Name"),
                        verify:Verify.notBlank,
                        retrieve:Retreive.directProperty,
                        harvest:Harvest.smartStandardTextInput("New Phase"),
                        edit:Edit.newSettings
                    },
                    {
                        objectField:"priority",
                        htmlContents:HTMLTemplates.smartStandardNumber("Priority"),
                        verify:Verify.multiple(Verify.notBlank,Verify.positiveInt),
                        retrieve:Retreive.accessMap("currentSettings"),
                        harvest:Harvest.smartStandardNumber(0),
                        edit:Edit.newSettings
                    },
                    {
                        objectField:"supportSelection",
                        htmlContents:HTMLTemplates.smartStandardSelect("Duty Assignment Method",[{text:"Pre-determined",value:"0"},{text:"Outcome Driven",value:"1"}]),
                        verify:(value)=>Boolean(value===e.PREDETERMINED ||value=== e.TOURNAMENT),
                        retrieve:Retreive.accessMap(["currentSettings"]),
                        harvest:(inputContainer,{insertValue,reset=false}={})=>{
                            let selectElement$ = inputContainer.firstElementChild.firstElementChild;
                            let currentValue=selectElement$.selectedOptions[0].value;
                            let interpretedValue = (currentValue==="0") ? e.PREDETERMINED
                                                                        :(currentValue==="1") ? e.TOURNAMENT
                                                                                            :null;
                            if(reset) insertValue = e.PREDETERMINED;
                            if(insertValue!==undefined){
                                let neededValue = (insertValue===e.TOURNAMENT) ? "1":"0";
                                selectElement$.querySelector(`option[value='${neededValue}'`).selected=true;
                            } 
                            return interpretedValue;
                        },
                        edit:Edit.newSettings
                    },
                    {
                        objectField:"phaseType",
                        htmlContents:HTMLTemplates.smartStandardSelect("Phase Type",[{text:"Round Robin",value:"0"},{text:"Tournament",value:"1"}]),
                        verify:(value)=>Boolean(value===e.ROUND_ROBIN ||value=== e.TOURNAMENT),
                        retrieve:Retreive.directProperty,
                        harvest:(inputContainer)=>{
                            let selectElement$ = inputContainer.firstElementChild.firstElementChild;
                            let currentValue=selectElement$.selectedOptions[0].value;
                            let interpretedValue = null;
                            if(currentValue==="0") interpretedValue = e.ROUND_ROBIN;
                            if(currentValue==="1") interpretedValue = e.TOURNAMENT;
                                                                                            
                            return interpretedValue;
                        },
                        edit:()=>false
                    },
                    {
                        objectField:"supportTeams",
                        htmlContents:ElementTemplates.displayTeamSelection.build,
                        verify:(value)=>{
                            if(!(value instanceof Set)) return false;
                            let flag = true; 
                            value.forEach(teamOrDiv=>{
                                if(!(teamOrDiv instanceof Team) && !(teamOrDiv instanceof Division)) flag=false;
                            })
                            return flag; 
                        },
                        retrieve:Retreive.accessMap(["currentSettings"]),
                        harvest:(inputContainer,{insertValue,reset})=>inputContainer.firstElementChild.func.harvest({insertValue,reset}),
                        edit:Edit.newSettings
                    }
                    )
                    //Add in game stage editor
                    phaseEditor$.querySelector("section.inputContainers").append(gameStageInputMaker(phaseEditor$));
                    //Add in pop-up headings
                    let createHeading = parseHTML(`<h1 class='hiddenByDefault'> Create New Phase</h1>`).querySelector("h1");
                    let editHeading = parseHTML(`<h1 class='hiddenByDefault'> Edit Existing Phase</h1>`).querySelector("h1");
                    phaseEditor$.prepend(createHeading,editHeading)
                    UniqueSelection.expandFamily(phaseEditor$,e.CREATE,createHeading);
                    UniqueSelection.expandFamily(phaseEditor$,e.EDIT,editHeading);
                    //Add in form controls
                    phaseEditor$.querySelector("section.formControls").append(HTMLTemplates.objectControllerFormControls(phaseEditor$));

                    phaseEditor$.querySelector("button[data-form-button='create']").addEventListener("click",(ev)=>{
                        let harvestedData = phaseEditor$.func.harvestData();
                        if(phaseEditor$.func.verifyHarvestedData()){
                            let newPhaseSettings = {};
                            for(const [inputContainer,data] of harvestedData){
                                newPhaseSettings[inputContainer.load(e.OBJECT_FIELD)]=data;
                            }
                            let newPhase = Competition.current.newPhase(newPhaseSettings.name,newPhaseSettings.phaseType);
                            newPhase.updateSettings(newPhaseSettings);
                            newPhase.newBlock();
                            phasePopUp$.func.closePopUp();
                        }
                    });
                    phaseEditor$.querySelector("button[data-form-button='save']").addEventListener("click",(ev)=>{
                        phaseEditor$.func.updateObject();
                        
                    });
                    phaseEditor$.querySelector("button[data-form-button='reset']").addEventListener("click",(ev)=>{
                        phaseEditor$.func.resetValues();
                    });
                    phaseEditor$.querySelector("button[data-form-button='cancel']").addEventListener("click",(ev)=>{
                        phasePopUp$.func.closePopUp();
                        phaseEditor$.func.resetValues(true);
                    });

                    
                    
                }

                //Toggle Debugging
                {
                    const debuggingButton$ = bracketSectionMenuContainer$.querySelector("button[data-button-function='toggleDebugging']");
                    debuggingButton$.addEventListener('click',function(ev){
                        if(this.dataset.activated=="false"){
                            KeyNodes.unitContainers.bracketContainer.func.debuggingMode(true);
                            this.dataset.activated="true";
                            this.textContent = "Hide All Debugging"
                        } else {
                            KeyNodes.unitContainers.bracketContainer.func.debuggingMode(false);
                            this.dataset.activated="false";
                            this.textContent = "Show All Debugging"
                        }
                    })
                }
                //Autogenerate Bracket
                bracketGeneration:{
                    const autoGenerateButton$ = bracketSectionMenuContainer$.querySelector("button[data-button-function='autoGeneratePopUp']");
                    autoGenerateButton$.addEventListener("click",()=>{
                        KeyNodes.popUp.autoBracket.querySelector(".teamSelector").func.refreshTeamOptions();
                        KeyNodes.popUp.autoBracket.querySelector(".teamSelector").func.refreshDisplay();
                        KeyNodes.popUp.autoBracket.func.openPopUp();
                    })
                }
            }
        }
        mainSection:{
            let FacadeMap;
            buildingBlocks:{
                FacadeMap =(function(){
                    let htmlToUnit = new Map();
                    let unitToHTML = new Map();

                    return {
                        set(html,unit){
                            if(htmlToUnit.has(html)){
                                const oldUnit = htmlToUnit.get(html);
                                unitToHTML.delete(oldUnit);
                            } 
                            if(unitToHTML.has(unit)){
                                const oldHtml = unitToHTML.get(unit);
                                htmlToUnit.delete(oldHtml);
                            } 
                            htmlToUnit.set(html,unit);
                            unitToHTML.set(unit,html);
                            return true;
                        },
                        get(unitOrHtml){
                            return htmlToUnit.get(unitOrHtml) ?? unitToHTML.get(unitOrHtml);
                        },
                        getHtml(unitOrHtml){
                            return htmlToUnit.has(unitOrHtml)? (unitOrHtml) : unitToHTML.get(unitOrHtml);
                        },
                        getUnit(unitOrHtml){
                            return unitToHTML.has(unitOrHtml) ? (unitOrHtml) : htmlToUnit.get(unitOrHtml);
                        },
                        has(unitOrHtml){
                            return (htmlToUnit.has(unitOrHtml) || unitToHTML.has(unitOrHtml));
                        },
                        delete(htmlorUnit){
                            if(htmlToUnit.has(htmlorUnit)){
                                const html = htmlorUnit;
                                const unit = htmlToUnit.get(html);
                                htmlToUnit.delete(html)
                                unitToHTML.delete(unit);
                                return true;
                            } 
                            if(unitToHTML.has(htmlorUnit)){
                                const unit = htmlorUnit;
                                const html = unitToHTML.get(unit);
                                unitToHTML.delete(unit);
                                htmlToUnit.delete(html);
                                return true;
                            } 
                            return false;
                        },
                        createHtmlWrapper(unit){
                            let html,parentHtml;
                            if(unit instanceof Competition){
                                html = ElementTemplates.bracketContainer.build(null,{controlledObject:unit});
                            }
                            if(unit instanceof Phase){
                                parentHtml = FacadeMap.getHtml(unit.parent);
                                html = ElementTemplates.phaseContainer.build(parentHtml,{controlledObject:unit});
                            }
                            if(unit instanceof Block){
                                parentHtml = FacadeMap.getHtml(unit.parent);
                                html = ElementTemplates.blockContainer.build(parentHtml,{controlledObject:unit});
                            }
                            if(unit instanceof Game){
                                parentHtml = FacadeMap.getHtml(unit.parent);
                                html = ElementTemplates.gameContainer.build(parentHtml,{controlledObject:unit});
                                UniqueSelection.addMember(e.SELECTED,html);
                            }
                            if(!html) Break("Did not recoginse unit to create a htmlWrapper",{unit})
                            this.set(html,unit);
                            return {html,parentHtml};
                        }
                    }
                })();
                oLog.FacadeMap = FacadeMap;
                KeyNodes.FacadeMap = FacadeMap;
                bracketDislay:{
                function refreshCosmetics(){
                    Break("This function needs to be overriden",{element:this})
                };
                function addChild(newChild){
                    this.func.getChildren();
                    if(!this.load(e.CONTENTS).has(newChild)) return false;
                    if(!FacadeMap.has(newChild)) FacadeMap.createHtmlWrapper(newChild);
                    this.load(e.CHILD_CONTAINER).append(FacadeMap.getHtml(newChild));
                    this.load(e.CONTENTS_ORDER).push(newChild);
                    return true;
                }
                function refreshChildOrder(){
                    let contentsOrder = this.load(e.CONTENTS_ORDER)
                    contentsOrder = contentsOrder.filter((unit)=>FacadeMap.has(unit));
                    contentsOrder.sort((a,b)=>{ //Sorted in reverse order
                        let aOrder=  FacadeMap.getHtml(a).load(e.ORDER);
                        let bOrder=  FacadeMap.getHtml(b).load(e.ORDER);
                        return bOrder-aOrder;
                    });
                    let childContainer = this.load(e.CHILD_CONTAINER);
                    contentsOrder.forEach(child=>childContainer.prepend(FacadeMap.getHtml(child)));
                    this.func.updateChildOrder();
                }
                function updateChildOrder(){
                    this.func.getChildren() //needed?
                    let contentsOrder = [...this.load(e.CONTENTS)]
                    let htmlChildren = Array.from(this.load(e.CHILD_CONTAINER).children);
                    contentsOrder.sort((a,b)=>{
                        let aIndex = htmlChildren.indexOf(FacadeMap.getHtml(a));
                        aIndex = (aIndex===-1) ? Number.POSITIVE_INFINITY: aIndex;
                        
                        let bIndex = htmlChildren.indexOf(FacadeMap.getHtml(b));
                        bIndex = (bIndex===-1) ? Number.POSITIVE_INFINITY: bIndex;
                        return aIndex-bIndex
                    })
                    contentsOrder.forEach((child,index)=>FacadeMap.getHtml(child).save(e.ORDER,index));
                    this.save(e.CONTENTS_ORDER,contentsOrder);
                }
                function requestChildrenRefreshCosmetics(){
                    let children = this.load(e.CONTENTS);
                    for(const child of children){
                        let childHtml = FacadeMap.getHtml(child);
                        childHtml?.func.refreshCosmetics();
                        childHtml?.func.requestChildrenRefreshCosmetics();
                    }
                }
                function refreshChildren(){
                    let childContainer = this.load(e.CHILD_CONTAINER);
                    let children = this.load(e.CONTENTS);
                    let childCheckList = new Set(children);
                    let childOrder = this.load(e.CONTENTS_ORDER);
                    childContainer.replaceChildren();
                    //Create new html wrappers
                    for(const child of children){
                        FacadeMap.createHtmlWrapper(child);
                    }
                    //Place all wrappers of children that previously had an order
                    for(const child of childOrder){
                        const childHtml = FacadeMap.getHtml(child);
                        childContainer.append(childHtml);
                        childCheckList.remove(child);
                    }
                    //Place all wrappers of children that didn't previously have an order
                    for(const child of childCheckList){
                        const childHtml = FacadeMap.getHtml(child);
                        childContainer.append(childHtml);
                    }
                    return true;
                }
                function getChildren(){
                    let childArray;
                    let controlledObject = this.load(e.CONTROLLED_OBJECT);
                    if(controlledObject instanceof Competition){
                        childArray = controlledObject.allPhasesArray;
                    }
                    if(controlledObject instanceof Phase){
                        childArray = controlledObject.allBlocksArray;
                    }
                    if(controlledObject instanceof Block){
                        childArray = controlledObject.allGamesArray;
                    }
                    if(controlledObject instanceof Game){
                        childArray = controlledObject.incomingLinks;
                    }
                    this.save(e.CONTENTS,new Set(childArray));
                    return childArray;
                }
                function markFailure(){
                    this.classList.add("failedVerification");
                    this.classList.remove("passedVerification");
                }
                function markSuccess(){
                    this.classList.add("passedVerification");
                    this.classList.remove("failedVerification");
                }
                const deleteUnit = (function(){
                    let refreshQueued = false;
                        function deleteUnit(){
                            UniqueSelection.deleteMember(Verification,this);
                            CodeObserver.deregister(this.load(e.CONTROLLED_OBJECT))
                            FacadeMap.delete(this);
                            this.save(e.CONTROLLED_OBJECT,null)
                            this.remove();
                            if(!refreshQueued){
                                queueMicrotask(()=>{
                                    this.elder['bracketContainer'].func.updateAllGameOrder();
                                    this.elder['bracketContainer'].func.requestChildrenRefreshCosmetics();
                                    refreshQueued = false;
                                })
                            }
                            return this.load(e.CONTENTS);
                        }
                    return deleteUnit
                    })()
                UniqueSelection.addGroup(Verification,{alternateClasses:["verificationSuspect","verificationSource","verificationTarget","debuggingVisible"]});

            ElementTemplates.baseUnitContainer = new ElementTemplate({
                htmlInsert:parseHTML(`
                        <div class='anteChildrenDisplayArea'></div>
                        <div class='contentsDisplayArea'>
                            <section class='childContainer'></section> 
                        </div>
                        <div class='postChildrenDisplayArea'></div>
                `),
                addFunctions:[refreshCosmetics,getChildren,refreshChildren,requestChildrenRefreshCosmetics,
                              updateChildOrder,refreshChildOrder,addChild,markSuccess,markFailure,deleteUnit],
                addClasses:["unitContainer","notSelectable","newUnitAnimation"],
                addDataStore:[
                    [e.CONTROLLED_OBJECT,null],
                    [e.NAME,null],
                    [e.ORDER,Number.POSITIVE_INFINITY],
                    [e.CONTENTS,Set],
                    [e.CONTENTS_ORDER,Array],
                    [e.CHILD_CONTAINER,null],
                ],
                onCreationCode:function(mainDiv,options){
                    const {controlledObject} = options;
                    this.save(e.CONTROLLED_OBJECT,controlledObject);
                    this.save(e.NAME,controlledObject.name);
                    this.save(e.CHILD_CONTAINER,this.querySelector("section.childContainer"));
                    UniqueSelection.addMember(Verification,this);
                    UIManagerObject.helperFunctions.creationAnimation(this);
                }

            });

                //Buttons
                ElementTemplates.baseAdditionButton = new ElementTemplate({
                    mainElement:ElementTemplates.genericControllingButton,
                    addClasses:"unitAdditionButton",
                    onCreationCode:function(maindDiv,options){
                        this.querySelector("button").textContent="+"
                    }
                })

                ElementTemplates.blockAdditionButton = new ElementTemplate({
                    mainElement:ElementTemplates.baseAdditionButton,
                    addClasses:"blockAdditionButton",
                    onCompletionCode:function(mainDiv,options){
                        this.addEventListener("click",()=>{
                            let order = this.elder["blockContainer"]?.load(e.ORDER) ?? Number.POSITIVE_INFINITY;
                            let createdBlock =  this.elder['phaseContainer'].load(e.CONTROLLED_OBJECT).newBlock();
                            let createdBlockHtml = FacadeMap.getHtml(createdBlock);
                            createdBlockHtml.save(e.ORDER,order-0.5);
                        });
                    }
                })
                ElementTemplates.gameAdditionButton = new ElementTemplate({
                    mainElement:ElementTemplates.baseAdditionButton,
                    addClasses:"gameAdditionButton",
                    onCompletionCode:function(mainDiv,options){
                        this.addEventListener("click",()=>{
                            let order = this.elder['gameContainer']?.load(e.ORDER) ?? Number.NEGATIVE_INFINITY; //if undefined, then button does not have game elder
                            let createdGame =  this.elder['blockContainer'].load(e.CONTROLLED_OBJECT).newGame();
                            let createdGameHtml = FacadeMap.getHtml(createdGame);
                            createdGameHtml.save(e.ORDER,order+0.5);
                        });
                    }
                })
                //Unit Containers
                    EventTemplates.gameSelection = new ElementTemplate.eventObjMaker({
                        triggers:["mouseup"],
                        queryselection:"section.childContainer",
                        func:function(ev){
                            const currentlySelected = this.elder['bracketContainer'].load(e.SELECTED);
                            const chosenGameHtml = this.elder['gameContainer'];
                            const chosenGame = chosenGameHtml.load(e.CONTROLLED_OBJECT);
                            const sourceRank =( ev.button===0) ? 1:2;
                            if(currentlySelected===chosenGame) return false;

                            if((ev.altKey)){
                                if(ev.button!==0) return false;
                                this.elder['bracketContainer'].func.selectGame(chosenGame);
                                return true;
                            } 
                            if(!currentlySelected) return false;
                            const currentlySelectedHtml = FacadeMap.getHtml(currentlySelected);
                            if(!ev.ctrlKey){
                                if(!ev.shiftKey){
                                    currentlySelectedHtml.func.createLink(e.BOTTOM_LINK,chosenGame,sourceRank)
                                } else{
                                    currentlySelectedHtml.func.createLink(e.TOP_LINK,chosenGame,sourceRank)
                                }
                            } else{
                                if(!ev.shiftKey){
                                    chosenGameHtml.func.createLink(e.BOTTOM_LINK,currentlySelected,sourceRank)
                                } else{
                                    chosenGameHtml.func.createLink(e.TOP_LINK,currentlySelected,sourceRank)
                                }
                            }

                        }
                    })
                    EventTemplates.unitDeletion = new ElementTemplate.eventObjMaker({
                        triggers:"click",
                        queryselection:"span[data-button-function='delete']",
                        func:function(ev){
                            this.root.load(e.CONTROLLED_OBJECT).delete();
                        }
                    })
                    function refreshGameDisplay(){
                        let gameLabelGenFunc = UIManagerObject.gameLabelGenerationFunctions.selected;
                        let linkLabelGenFunc = UIManagerObject.linkLabelGenerationFunctions.selected;
                        this.load(e.CHILD_CONTAINER).replaceChildren();
                        this.func.getDisplayIndex();
                        this.func.removeDeletedLinks();
                        let gameLabelDiv = document.createElement("div");
                        gameLabelDiv.classList.add("gameLabel");
                        gameLabelDiv.append(gameLabelGenFunc(this.load(e.CONTROLLED_OBJECT)))
                        this.load(e.CHILD_CONTAINER).append(gameLabelDiv);
                        this.load(e.CHILD_CONTAINER).append(HTMLTemplates.linkLabel(e.TOP_LINK,linkLabelGenFunc(this.load(e.TOP_LINK))));
                        this.load(e.CHILD_CONTAINER).append(HTMLTemplates.linkLabel(e.BOTTOM_LINK,linkLabelGenFunc(this.load(e.BOTTOM_LINK))));
                    }
                    function getGameDisplayIndex(){
                        let index = this.elder['bracketContainer'].load(e.GAME_ORDER).indexOf(this.load(e.CONTROLLED_OBJECT))
                        this.save(e.GAME_ORDER,index);
                        return index
                    }
                        UIManagerObject.blockLabelGenerationFunctions  = {
                            select(func){
                                this.selected=func;
                            },
                            simpleName(block){
                                return block.name;
                            },
                            simpleOrder(block){
                                return `B${FacadeMap.getHtml(block).load(e.ORDER)+1}`
                            }
                        }
                        UIManagerObject.blockLabelGenerationFunctions.select(UIManagerObject.blockLabelGenerationFunctions.simpleOrder);

                        UIManagerObject.gameLabelGenerationFunctions  = {
                            select(func){
                                this.selected=func;
                            },
                            simpleName(game){
                                return game.name;
                            },
                            simpleOrder(game){
                                
                                return `Game ${FacadeMap.getHtml(game).load(e.GAME_ORDER)+1}`
                            }
                        }
                        UIManagerObject.gameLabelGenerationFunctions.select(UIManagerObject.gameLabelGenerationFunctions.simpleOrder);

                        UIManagerObject.linkLabelGenerationFunctions  = {
                            select(func){
                                this.selected=func;
                            },
                            plain(link){
                                let unitName,ranking;
                                if(!link) return "No Link"
                                if(link.source instanceof Game){
                                    ranking = (link.sourceRank === 1) ? "W":"L";
                                    unitName = `Game ${FacadeMap.getHtml(link.source).func.getDisplayIndex()+1}`
                                }
                                if(link.source instanceof Phase){
                                    ranking = String(link.sourceRank);
                                    unitName = `[Phase] ${link.source.name}`
                                }
                                if(link.source instanceof Team){
                                    ranking = "Team";
                                    unitName =link.source.name;
                                }
                                return `${unitName} (${ranking})`
                            }
                        }
                        UIManagerObject.linkLabelGenerationFunctions.select(UIManagerObject.linkLabelGenerationFunctions.plain);

                        UIManagerObject.unitNameGenerationFunction = function(unit){
                            let name;
                                if(unit instanceof Game){
                                    name = `[${unit.phase.name}] ${UIManagerObject.gameLabelGenerationFunctions.selected(unit)} (${UIManagerObject.blockLabelGenerationFunctions.selected(unit.block)})`;
                                }
                                if(unit instanceof Block){
                                    name = `[${unit.phase.name}] ${UIManagerObject.blockLabelGenerationFunctions.selected(unit)}`
                                }
                                if(unit instanceof Phase){
                                    name = `${unit.name}`
                                }
                                return name;
                        }

                    function resetLinkPosition(){
                        let incomingLinks = this.load(e.CONTROLLED_OBJECT)?.incomingLinks;
                        if(incomingLinks){
                            this.func.assignLinkPosition(incomingLinks[0])
                            this.func.assignLinkPosition(incomingLinks[1])
                        }
                    }
                    function assignLinkPosition(link){
                        const bottomLink =this.load(e.BOTTOM_LINK);
                        const topLink = this.load(e.TOP_LINK);
                        if(link ===bottomLink || link ===topLink) return false;
                        if(!bottomLink){ 
                            this.save(e.BOTTOM_LINK,link);
                        } else if(!topLink) {
                            this.save(e.TOP_LINK,link)
                        }
                        this.save(e.CONTENTS,new Set([this.load(e.BOTTOM_LINK),this.load(e.TOP_LINK)]));
                    }
                    function removeDeletedLinks(){
                        if(this.load(e.BOTTOM_LINK)?.forDeletion) this.save(e.BOTTOM_LINK,null)
                        if(this.load(e.TOP_LINK)?.forDeletion) this.save(e.TOP_LINK,null)
                        this.save(e.CONTENTS,new Set([this.load(e.BOTTOM_LINK),this.load(e.TOP_LINK)]));
                    }
                    function createLink(position,source,sourceRank){
                        const currentLink = this.load(position);
                        if(currentLink) currentLink.deleteLink();
                        const newLink = new Link({source,sourceRank,target:this.load(e.CONTROLLED_OBJECT)});
                        this.save(position,newLink);
                    }
                    EventTemplates.callLinkPopUp = ElementTemplate.eventObjMaker({
                        triggers:"click",
                        queryselection:"button[data-button-function='edit']",
                        func:function(ev){
                            KeyNodes.popUp.linkCreation.func.openPopUp(this.root.load(e.CONTROLLED_OBJECT));
                        }
                    })
                ElementTemplates.gameContainer = new ElementTemplate({
                    label:"gameContainer",
                    mainElement:ElementTemplates.baseUnitContainer,
                    htmlSmartInsert:{html:HTMLTemplates.labelledButton("Edit","edit"),destination:"div.contentsDisplayArea"},
                    addEvents:[EventTemplates.gameSelection,EventTemplates.unitDeletion,EventTemplates.callLinkPopUp],
                    addFunctions:[[refreshGameDisplay,"refreshCosmetics"],resetLinkPosition,assignLinkPosition,[getGameDisplayIndex,"getDisplayIndex"],createLink,removeDeletedLinks],
                    addAsElder:"gameContainer",
                    addClasses:["gameContainer"],
                    addDataStore:[
                        [e.TOP_LINK,null],
                        [e.BOTTOM_LINK,null],
                        [e.GAME_ORDER,null],
                    ],
                    addTemplates:[
                        [ElementTemplates.gameAdditionButton,{parentElement:"div.postChildrenDisplayArea"}],
                        [ElementTemplates.genericControllingButton,{parentElement:"div.contentsDisplayArea",
                                                                    templateOptions: {addClasses:"deleteButton",
                                                                                      addDataset:[{name:"buttonFunction",value:"delete"}],
                                                                                      buttonText:"Delete"}
                                                                    }]
                    ],
                    onCompletionCode:function(mainDiv,options){
                        this.func.resetLinkPosition();
                        this.querySelector("section.childContainer").addEventListener("contextmenu",(ev)=>ev.preventDefault());
                    }
                });
                    function getBlockDisplayIndex(){
                        this.elder['phaseContainer'].func.updateChildOrder();
                        return this.load(e.ORDER);
                    }
                    function refreshBlockDisplay(){
                        const blockLabelGenFunc = UIManagerObject.blockLabelGenerationFunctions.selected;
                        const postChildrenDisplayArea$ = this.querySelector("div.blockContainer>div.postChildrenDisplayArea>span.displayLabel");
                        postChildrenDisplayArea$.textContent = blockLabelGenFunc(this.load(e.CONTROLLED_OBJECT));
                    }
                ElementTemplates.blockContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    addFunctions:[[refreshBlockDisplay,"refreshCosmetics"],[getBlockDisplayIndex,"getDisplayIndex"]],
                    addAsElder:"blockContainer",
                    addClasses:"blockContainer",
                    htmlSmartInsert:[{html:HTMLTemplates.simpleDisplayLabel("Block"),destination:"div.postChildrenDisplayArea"}],
                    addTemplates:[
                        [ElementTemplates.blockAdditionButton,{parentElement:"div.anteChildrenDisplayArea"}],
                        [ElementTemplates.gameAdditionButton,{parentElement:"div.contentsDisplayArea"}],
                        [ElementTemplates.genericControllingButton,{parentElement:"div.postChildrenDisplayArea",
                                                                    templateOptions: {addClasses:"deleteButton",
                                                                                      addDataset:[{name:"buttonFunction",value:"delete"}],
                                                                                      buttonText:"Delete"}
                                                                    }]],
                    addEvents:[EventTemplates.unitDeletion],
                        
                    onCompletionCode:function(mainDiv,options){
                    }
                });


                        EventTemplates.saveFormOnInputChange = ElementTemplate.eventObjMaker({
                            triggers:"input",
                            queryselection:"div[data-object-field='priority'] input",
                            func:function(ev){
                                this.elder["phaseLabel"].func.updateObject();
                            }
                        })
                        EventTemplates.editPhasePopUp = ElementTemplate.eventObjMaker({
                            triggers:'click',
                            queryselection:"span[data-button-function='edit']",
                            func:function(ev){
                                KeyNodes.popUp.phaseEditor$.func.openPopUp();
                                let form = KeyNodes.popUp.phaseEditor$.querySelector("form");
                                form.func.editingMode(this.elder['phaseLabel'].load(e.CONTROLLED_OBJECT));
                            }
                        })
                    ElementTemplates.phaseContainerLabel = new ElementTemplate({
                        mainElement:ElementTemplates.genericForm,
                        addTemplates:[
                            [ElementTemplates.genericControllingButton,{templateOptions:{addDataset:[{name:"buttonFunction",value:"edit"}],
                                                                                        buttonText:"Edit"},
                                                                        parentElement:"section.formControls"}],
                            [ElementTemplates.genericControllingButton,{parentElement:"section.formControls",
                                                                        templateOptions: {addClasses:"deleteButton",
                                                                                          addDataset:[{name:"buttonFunction",value:"delete"}],
                                                                                          buttonText:"Delete"}
                                                                        }]
                        ],
                        addEvents:[EventTemplates.saveFormOnInputChange,EventTemplates.editPhasePopUp,EventTemplates.unitDeletion],
                        addAsElder:"phaseLabel",
                        addClasses:"phaseContainerLabel",
                        onCreationCode:function(mainDiv,options){
                            mainDiv.func.addInputContainer(
                                {
                                    objectField:"name",
                                    htmlContents: HTMLTemplates.simpleDisplayLabel("Phase Name Here"),
                                    harvest:Harvest.displayLabel,
                                    verify:()=>true,
                                    edit:()=>true,
                                    retrieve:Retreive.directProperty
                                },
                                {
                                    objectField:"phaseType",
                                    htmlContents: HTMLTemplates.simpleDisplayLabel("Phase Type Here"),
                                    harvest:Harvest.displayLabelSymbolConversion({[e.ROUND_ROBIN]:"(Round Robin)",[e.TOURNAMENT]:"(Tournament)"}),
                                    verify:()=>true,
                                    edit:()=>true,
                                    retrieve:Retreive.directProperty
                                },
                                {
                                    objectField:"priority",
                                    htmlContents:HTMLTemplates.smartStandardNumber("Priority"),
                                    harvest:Harvest.smartStandardNumber(0),
                                    verify:Verify.positiveInt,
                                    edit:Edit.newSettings,
                                    retrieve:Retreive.accessMap(["currentSettings"])
                                },
                            )
                            this.func.importObject(this.elder["phaseContainer"].load(e.CONTROLLED_OBJECT));
                            this.func.resetValues();
                            CodeObserver.addHandler(this.elder['phaseContainer'].load(e.CONTROLLED_OBJECT),(obs,{keyword})=>{
                                if(keyword===e.EDIT) mainDiv.func.resetValues();
                            })
                        }
                    })
                ElementTemplates.phaseContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    addFunctions:[[()=>false,"refreshCosmetics"]],
                    addTemplates:[[ElementTemplates.phaseContainerLabel,
                                    {parentElement:"div.postChildrenDisplayArea",
                                    addDataset:{name:"buttonFunction",value:"edit"},
                                    templateOptions:{controlledObjectConstructor:Phase}}],
                                [ElementTemplates.blockAdditionButton,{parentElement:"div.contentsDisplayArea"}]],
                    addAsElder:"phaseContainer",
                    addClasses:"phaseContainer",
                    onCompletionCode:function(){
                        
                    }
                });
                    function refreshBracketCosmetics(){
                        const competitionNameLabel$ = this.querySelector("div.anteChildrenDisplayArea span");
                        competitionNameLabel$.textContent=this.load(e.CONTROLLED_OBJECT).name;

                        const selectedGameDisplay$ = bracketSectionMenuContainer$.querySelector("span[data-display='selectedGame']") ??( Break("Not found",{}));
                        
                        const selectedGame = this.load(e.SELECTED);
                        if(selectedGame){
                            selectedGameDisplay$.textContent = `Selected: Game ${this.load(e.GAME_ORDER).indexOf(selectedGame)+1}`;
                        } else {
                            selectedGameDisplay$.textContent = `No Game Selected`;
                        }
                    }
                    function selectGame(selectedGame){
                        this.save(e.SELECTED,selectedGame);
                        if(selectedGame){
                            UniqueSelection.select(e.SELECTED,FacadeMap.getHtml(selectedGame),false,["selectedGame"]);
                        } else {
                            UniqueSelection.wipeClasses(e.SELECTED,[e.ALL])
                        }
                        this.func.refreshCosmetics();
                        CodeObserver.Execution({mark:Verification,keyword:e.VERIFICATION});
                    }
                    function selectNextGame(forwards=true){
                        const currentlySelectedGame = this.load(e.SELECTED);
                        const gameOrder = this.load(e.GAME_ORDER);
                        let newIndex;
                        if(currentlySelectedGame){
                            const currentIndex = gameOrder.indexOf(currentlySelectedGame);
                            newIndex = currentIndex + ((forwards) ? 1:-1); 
                            if(newIndex >= gameOrder.length) newIndex = newIndex - gameOrder.length;
                        } else {
                            newIndex = 0;
                        }
                        const nextGame = gameOrder.at(newIndex);
                        if(nextGame) this.func.selectGame(nextGame);
                    }
                   
                    function updateAllGameOrder(){
                        let allGamesOrder = this.load(e.GAME_ORDER);
                        allGamesOrder.length=0;
                        this.func.updateChildOrder();
                        for(const phase of this.load(e.CONTENTS_ORDER)){
                            const phaseHtml = FacadeMap.getHtml(phase);
                            phaseHtml.func.updateChildOrder();
                            for(const block of phaseHtml.load(e.CONTENTS_ORDER)){
                                const blockHtml = FacadeMap.getHtml(block)
                                blockHtml.func.updateChildOrder();
                                allGamesOrder.push(...blockHtml.load(e.CONTENTS_ORDER));
                            }
                        }
                    }
                    function debuggingMode(active){
                        if(active){
                            this.classList.add("debuggingVisible");
                        } else {
                            this.classList.remove("debuggingVisible");
                        }
                    }
                ElementTemplates.bracketContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    addFunctions:[[refreshBracketCosmetics,"refreshCosmetics"],selectGame,selectNextGame,updateAllGameOrder,debuggingMode],
                    htmlSmartInsert:{html:parseHTML(`Creating Bracket For: <span> </span>`),destination:"div.anteChildrenDisplayArea"},
                    addDataStore:[
                        [e.SELECTED,null],
                        [e.GAME_ORDER,Array]
                    ],
                    addAsElder:"bracketContainer",
                    addClasses:"bracketContainer",
                    onCompletionCode: function(mainDiv,options){
                        this.func.refreshCosmetics();
                        UniqueSelection.deleteMember(Verification,this);
                        CodeObserver.addHandler(this.load(e.CONTROLLED_OBJECT),(observer,{keyword,currentObject})=>{
                            if(keyword!==e.EDIT) return;
                            mainDiv.func.refreshCosmetics();
                        });
                        UniqueSelection.addGroup(e.SELECTED,{alternateClasses:["selectedGame"]});
                        UserInteraction.addHandler(UserInteraction.ESCAPE,()=>this.func.selectGame(null));
                        KeyNodes.unitContainers.bracketContainer = this;
                    }
                });
                }

                linkCreationPopUp:{
                        function selectLinkSource(sourceRank,linkSource){
                            this.elder["linkCreationArea"].save(e.SOURCE,linkSource);
                            this.elder["linkCreationArea"].save(e.SOURCE_RANK,sourceRank);
                            this.elder["linkCreationArea"].func.setInputValues(linkSource,sourceRank)
                        }
                        function primaryMasterSelectAction(htmlElem,ev){
                            const entryObject = htmlElem.elder['entry'].load(e.CONTROLLED_OBJECT)
                            if(entryObject instanceof Division || entryObject instanceof Block) return false
                            UniqueSelection.wipeClasses(htmlElem.elder["panel"],["secondarySelection"]);
                            UniqueSelection.select(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["primarySelection"]);
                            htmlElem.elder['entry'].func.selectLinkSource(1,entryObject)
                        }
                        function secondaryMasterSelectAction(htmlElem,ev){
                            const entryObject = htmlElem.elder['entry'].load(e.CONTROLLED_OBJECT)
                            if(entryObject instanceof Division || entryObject instanceof Block) return false
                            UniqueSelection.wipeClasses(htmlElem.elder["panel"],["primarySelection"]);
                            UniqueSelection.select(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["secondarySelection"]);
                            htmlElem.elder['entry'].func.selectLinkSource(2,entryObject);
                        }
                        let  masterFunctionSet=[
                            {callBack:(htmlElem,ev)=>primaryMasterSelectAction(htmlElem,ev),timing:{startTime:0,endTime:600}},
                            {callBack:(htmlElem,ev)=>secondaryMasterSelectAction(htmlElem,ev),timing:{startTime:600,endTime:Number.POSITIVE_INFINITY}}
                        ]
                    ElementTemplates.gameNavigationEntry = new ElementTemplate({
                        mainElement: ElementTemplates.genericNavigationEntry,
                        addFunctions: [selectLinkSource],
                        onCreationCode:function(mainLi,options){
                            let objectLabel$=this.querySelector('span[data-selectable]');
                            let controlledObject = this.load(e.CONTROLLED_OBJECT);
                            if(controlledObject instanceof Team || controlledObject instanceof Division || controlledObject instanceof Phase){
                                objectLabel$.prepend(controlledObject.name);
                            } else if (controlledObject instanceof Game || controlledObject instanceof Block){
                                let gameOrder = FacadeMap.getHtml(controlledObject).func.getDisplayIndex()+1;
                                objectLabel$.prepend(`${(controlledObject instanceof Game)?"Game":"Block"} ${gameOrder}`)
                            } 
                                ExclusiveLongClickTimer( mainLi,masterFunctionSet)
                                mainLi.addEventListener("pointerup",(ev)=>{
                                    if(ev.button!==2) return;
                                    secondaryMasterSelectAction(objectLabel$,ev);
                                })
                                //Delete Edit Button
                                this.querySelector("span:has(button[data-button-function='edit'])").remove();
                        }
                    });
                        function addGameNavigationEntry(newEntryObject,newEntryLocation$){
                            let newLi$= document.createElement("li");
                             newEntryLocation$.append(ElementTemplates.gameNavigationEntry.build(this,{useAsMainDiv:newLi$,newEntryObject}))
                            UniqueSelection.addMember(this.elder["panel"],newLi$);
                        }
                    ElementTemplates.gameNavigationSection = new ElementTemplate({
                        mainElement: ElementTemplates.genericNavigationSection,
                        addFunctions:[[addGameNavigationEntry,"addNavigationEntry"]],
                        onCompletionCode:function(mainDiv,options){
                            let individualSectionParameters = this.load(e.CONTENTS);
                            let {subHeading,funcToObtainArray,propertyName} = individualSectionParameters;
                            let entryList$=mainDiv.querySelector("ul");
                            let currentObject = this.elder["panel"].load(e.CURRENTLY_OPEN);
                            let entryArray = funcToObtainArray(currentObject[propertyName] ?? currentObject);
                            if(entryArray && entryArray.length>0){
                                if(entryArray[0] instanceof Game || entryArray[0] instanceof Block){
                                    entryArray.sort((a,b)=>{
                                        const aIndex = FacadeMap.getHtml(a).func.getDisplayIndex() 
                                        const bIndex = FacadeMap.getHtml(b).func.getDisplayIndex() 
                                        return aIndex - bIndex;
                                    });
                                } else if(entryArray[0] instanceof Phase){
                                        entryArray.sort();
                                        entryArray.sort((a,b)=>{
                                            const aPriority = a.currentSettings.get(e.PRIORITY.description);
                                            const bPriority = b.currentSettings.get(e.PRIORITY.description);
                                            return aPriority - bPriority;
                                        });
                                    } else {
                                        entryArray.sort();
                                    }
                                
                            }
                            for(const newEntryObject of entryArray){
                                this.func.addNavigationEntry(newEntryObject,entryList$);
                            }
                        }
                    })
                        HTMLTemplates.gameNavigationPanel = function(mainDiv){
                            let htmlString = `
                            <div class="navigationPanelButtons">
                                <label> Display All </label>
                                <button type="button" data-display-all='Division' >Divisions</button>
                                <button type="button" data-display-all='Team'>Teams</button>
                                <button type="button" data-display-all='Game'>Games</button>
                                <button type="button" data-display-all='Phase'>Phases</button>
                            </div>
            
                            <div class="navigationCurrentLocation">
            
                            </div>
            
                            <div class="navigationStackDisplay">
                                
                            </div>
            
                            <div class="navigationPanelDisplay">
            
                            </div>
                            
                        </div>`           
                            let html = parseHTML(htmlString);
                            let navMaster$ = html.querySelector("div.navigationPanelButtons");
                            let buttons$ = navMaster$.querySelectorAll("button[data-display-all]");
                            
                            buttons$.forEach((button)=>button.addEventListener("click",(ev)=>{
                                button.elder["panel"].func.openObject(stringToObject(button.dataset.displayAll),0);
                            }));
                            return html;
                        }
                        function getGameSectionParameters(object,panelIdentity){
                            let sectionParameters;

                            if (object === Phase ){
                                    sectionParameters = [{
                                        subHeading:null,
                                        propertyName:null,
                                        funcToObtainArray: x=>Competition.current.allPhasesArray
                            }]} else if (object === Game ){
                                    sectionParameters = [{
                                        subHeading:null,
                                        propertyName:null,
                                        funcToObtainArray: x=>Competition.current.allGamesArray
                            }]} else if (object === Team ){
                                    sectionParameters = [{
                                        subHeading:null,
                                        propertyName:"allTeams",
                                        funcToObtainArray: x=>Array.from(x.values())
                                    }]
                                } else if (object === Division ){
                                    sectionParameters = [{
                                        subHeading:null,
                                        propertyName:"allDivisionsArray",
                                        funcToObtainArray: allDivArray=>{
                                            let allDivSet = new Set(allDivArray);
                                                allDivArray.forEach(div=>{if(div.parentDivisions.size>0) allDivSet.delete(div)});
                                            return Array.from(allDivSet);
                                        }
                                    },
                                    {
                                        subHeading:"All Subdivisions",
                                        propertyName:"allDivisionsArray",
                                        funcToObtainArray: allDivArray=>{
                                            let allDivSet = new Set(allDivArray);
                                                allDivArray.forEach(div=>{if(div.parentDivisions.size===0) allDivSet.delete(div)});
                                            return Array.from(allDivSet);
                                        }
                                    }]
                                }  else if (object instanceof Phase ){
                                    sectionParameters =[
                                        {subHeading:"Blocks",
                                        propertyName:"allBlocksArray",
                                        funcToObtainArray: x=>x}
                                    ]
                                }  else if (object instanceof Block ){
                                    sectionParameters =[
                                        {subHeading:"Games",
                                        propertyName:"allGamesArray",
                                        funcToObtainArray: x=>x}
                                    ]
                                }  else if (object instanceof Game ){
                                    sectionParameters =[
                                        {subHeading:"Parent Games",
                                        propertyName:"incomingLinks",
                                        funcToObtainArray: incomingLinks=>incomingLinks.map(iLink=>iLink.source)},
                                        {subHeading:"Child Games",
                                        propertyName:"outgoingLinks",
                                        funcToObtainArray: outgoingLinks=>outgoingLinks.map(oLink=>oLink.target)},
                                    ]
                                }  else if (object instanceof Team ){
                                    sectionParameters =[
                                        {subHeading:"Players",
                                        propertyName:"players",
                                        funcToObtainArray: playersMap=>Array.from(playersMap.keys())},
                                        {subHeading:"In Divisions",
                                        propertyName:"divisions",
                                        funcToObtainArray: divisionSet=>Array.from(divisionSet)}
                                    ]
                                } else if (object instanceof Division ){
                                    sectionParameters =[
                                        {subHeading:"Sub-Divisions",
                                        propertyName:"subDivisions",
                                        funcToObtainArray: subDivisionsSet=>Array.from(subDivisionsSet)},

                                        {subHeading:"Teams",
                                        propertyName:"teams",
                                        funcToObtainArray: teamsSet=>Array.from(teamsSet)},

                                        {subHeading:"In Divisions",
                                        propertyName:"parentDivisions",
                                        funcToObtainArray: divisionSet=>Array.from(divisionSet)},

                                        {subHeading:"All Possible Sub-Divisions",
                                        propertyName:"allSubDivisions",
                                        funcToObtainArray: subDivisionsSet=>Array.from(subDivisionsSet)},
                                        
                                        {subHeading:"All Possible Teams",
                                        propertyName:"allTeams",
                                        funcToObtainArray: teamsSet=>Array.from(teamsSet)}
                                    ];
                                    
                                } else if(true){
                                    Break("Can only get section parameters for games,phases , teams and divisions",{object})
                                }
                                return sectionParameters
                        }
                        function defaultView(){
                            const currentSource = this.elder['linkCreationArea'].load(e.CONTROLLED_OBJECT)?.source;
                            let currentSourceRank =  this.elder['linkCreationArea'].load(e.CONTROLLED_OBJECT)?.sourceRank;
                            if(currentSourceRank ==="Team") currentSourceRank = 1;
                            this.func.wipeDisplays();
                            this.func.openObject(Phase,0);

                            if(currentSource){
                                if(currentSource instanceof Phase){
                                    //go with default
                                }else if(currentSource instanceof Team){
                                    this.func.openObject(Team);
                                } else {
                                    this.func.openObject(currentSource.phase)
                                    this.func.openObject(currentSource.block)
                                }
                                this.func.selectEntry(currentSource,(currentSourceRank===1) ? true:false);
                                this.elder["linkCreationArea"].func.setInputValues(currentSource,currentSourceRank)
                            } else {
                                const currentUnit = this.elder['linkCreationPopUp'].load(e.CONTROLLED_OBJECT);
                                const blockOrder = currentUnit.block.blockOrder;
                                if(currentUnit.phase.currentSettings.get(e.PHASE_TYPE.description)===e.ROUND_ROBIN){
                                    this.func.openObject(Team,0);
                                } else {
                                    if(blockOrder===1){
                                        //go with default: this.func.openObject(Phase,0);
                                    } else {
                                        this.func.openObject(currentUnit.phase)
                                        this.func.openObject(currentUnit.phase.allBlocksArray[blockOrder-2])
                                    }
                                }
                            }
                            this.elder['linkCreationArea'].save(e.EDIT,false);
                        }
                        function selectEntry(desiredControlledObject,primarySelection){
                            const entries = this.querySelectorAll(".navigationEntry");
                            for(const entry of entries){
                                if(entry.load(e.CONTROLLED_OBJECT)===desiredControlledObject){
                                    if(primarySelection){
                                        primaryMasterSelectAction(entry);
                                    } else {
                                        secondaryMasterSelectAction(entry);
                                    }
                                }
                            }
                        }
                        function correctCurrentLocationDisplay(){
                            let currentLocationDisplay$= this.querySelector("div.navigationCurrentLocation");
                            let currentObject = this.load(e.CURRENTLY_OPEN);
                            let correctedName;
                            if(currentObject instanceof Phase || currentObject instanceof Team){
                                correctedName = currentObject.name;
                            }
                            if(currentObject instanceof Block || currentObject instanceof Game){
                                correctedName = `${currentObject.constructor.name} ${FacadeMap.getHtml(currentObject).func.getDisplayIndex()+1}`
                            }
                            let appendText =(currentObject.constructor===Function) ? `All ${currentObject.name}s`:`${correctedName} [${currentObject.constructor.name}]`;
                            currentLocationDisplay$.textContent=appendText;
                        }
                    ElementTemplates.gameNavigationPanel = new ElementTemplate({
                        label:"gameNavigationPanel",
                        mainElement:ElementTemplates.genericNavigationPanel,
                        htmlInsert: HTMLTemplates.gameNavigationPanel,
                        serialFunctions:[{newFunction:correctCurrentLocationDisplay,oldFunctionName:"refreshAppearance"}],
                        addFunctions:[[getGameSectionParameters,"getSectionParameters"],defaultView,selectEntry],
                        onCompletionCode: function(mainDiv,options){
                            this.save(e.NAVIGATION_SECTION_TEMPLATE,ElementTemplates.gameNavigationSection);
                        }
                    });
                        EventTemplates.detectEditing = ElementTemplate.eventObjMaker({
                            triggers:"input", //attached to form, detects change in number input
                            func:function(ev){
                                let value = parseInt(ev.target.value);
                                this.save(e.EDIT,true);
                                this.save(e.SOURCE_RANK,value);
                            }
                        })
                        function setInputValues(sourceUnit,sourceRank){
                            this.querySelector("[data-object-field='sourceLabel'] input").value = this.func.generateUnitLabel(sourceUnit);
                            const sourceRankInput= this.querySelector("[data-object-field='sourceRank'] input");
                            sourceRankInput.value = (typeof sourceRank==="string") ? 1: sourceRank;
                            if(sourceUnit instanceof Team) {
                                sourceRankInput.parentElement.classList.add("invisible");
                                sourceRankInput.setAttribute("readonly",true)
                            } else {
                                sourceRankInput.parentElement.classList.remove("invisible");
                                sourceRankInput.removeAttribute("readonly")
                            }
                            this.save(e.SOURCE,sourceUnit);
                            this.save(e.SOURCE_RANK,sourceRank)
                            this.save(e.EDIT,true);
                        }
                        function generateUnitLabel(unit){
                            let label;
                                if(unit instanceof Phase) label = `[Phase] ${unit.name}`;
                                if(unit instanceof Game) label = `Game ${FacadeMap.getHtml(unit).func.getDisplayIndex()+1}` ;
                                if(unit instanceof Team) label = `[Team] ${unit.name}`;
                            return label;
                        }
                        function createLink(){
                            if(!this.load(e.EDIT)) return false;
                            const currentIdentity = this.load(e.IDENTITY);
                            const currentGame = this.elder['linkCreationPopUp'].load(e.CONTROLLED_OBJECT);

                            const newSource = this.load(e.SOURCE);
                            const newSourceRank = this.load(e.SOURCE_RANK);
                            FacadeMap.getHtml(currentGame).func.createLink(currentIdentity,newSource,newSourceRank);
                        }
                        function getRelevantLink(){
                            const unit = this.root.load(e.CONTROLLED_OBJECT);
                            const identity = this.load(e.IDENTITY);
                            const relevantLink = FacadeMap.getHtml(unit)?.load(identity)
                            this.save(e.CONTROLLED_OBJECT,relevantLink);
                            return relevantLink;
                        }
                    ElementTemplates.linkCreationArea = new ElementTemplate({
                        addAsElder:"linkCreationArea",
                        mainElement:ElementTemplates.genericForm,
                        addFunctions:[setInputValues,generateUnitLabel,createLink,getRelevantLink],
                        addEvents:[EventTemplates.detectEditing],
                        addDataStore:[
                            [e.IDENTITY,null],
                            [e.EDIT,false],
                            [e.SOURCE,null],
                            [e.SOURCE_RANK,null]
                        ],
                        addTemplates:[
                            [ElementTemplates.gameNavigationPanel,{
                                templateOptions:{identity:e.MASTER,useAsMainDiv:"nav"}
                                }
                            ]],
                        onCreationCode:function(mainDiv,options){
                            const {identity} = options;
                            
                            this.save(e.IDENTITY,identity);
                            this.func.getRelevantLink();
                            this.func.addInputContainer(
                                {
                                    objectField:"sourceLabel",
                                    htmlContents:HTMLTemplates.smartStandardText("Source"),
                                    verify:()=>true,
                                    harvest:Harvest.smartStandardTextInput("No Link Exists"),
                                    edit:()=>false,
                                    retrieve:function(controlledObject,objectField){
                                        return this.elder['linkCreationArea'].func.generateUnitLabel(controlledObject.source);
                                    },
                                },
                                {
                                    objectField:"sourceRank",
                                    htmlContents:HTMLTemplates.smartStandardNumber("Source Rank"),
                                    verify:Verify.positiveInt,
                                    harvest:Harvest.smartStandardNumber(1),
                                    retrieve:function(controlledObject,objectField){
                                       return controlledObject.sourceRank;
                                    },
                                }
                                );
                            this.querySelector("[data-object-field='sourceLabel'] input").setAttribute("readonly",true)
                        },
                        onCompletionCode:function(mainDiv,options){
                            
                        }
                    })
                        function setControlledGame(openPopUpReturn,newGame){
                            this.save(e.CONTROLLED_OBJECT,newGame)
                        }
                        function resetLinkCreationAppearance(){
                            const forms = this.querySelectorAll("form");
                            const navigators = this.querySelectorAll("nav");
                            for(const form of forms){
                                form.func.getRelevantLink();
                                form.func.resetValues();
                            }
                            for(const navigator of navigators){
                                navigator.func.defaultView();
                            }
                        }
                        EventTemplates.newLink = ElementTemplate.eventObjMaker({
                            triggers:"click",
                            queryselection:"button[data-button-function='save']",
                            func:function(ev){
                                this.root.load(e.TOP_LINK).func.createLink();
                                this.root.load(e.BOTTOM_LINK).func.createLink();
                                this.root.func.closePopUp();
                            }
                        });
                        EventTemplates.resetLinks = ElementTemplate.eventObjMaker({
                            triggers:"click",
                            queryselection:"button[data-button-function='reset']",
                            func: function(ev){
                                this.root.func.resetLinkCreationAppearance()
                            }
                        });
                        EventTemplates.closeLinkPopUp = ElementTemplate.eventObjMaker({
                            triggers:"click",
                            queryselection:"button[data-button-function='cancel']",
                            func: function(ev){
                                this.root.func.closePopUp();
                            }
                        });
                    ElementTemplates.linkCreationPopUp = new ElementTemplate({
                        addAsElder:"linkCreationPopUp",
                        addEvents:[EventTemplates.newLink,EventTemplates.resetLinks,EventTemplates.closeLinkPopUp],
                        serialFunctions:[
                            {oldFunctionName:"openPopUp",newFunction:setControlledGame},
                            {oldFunctionName:"openPopUp",newFunction:resetLinkCreationAppearance},
                        ],
                        addFunctions:[resetLinkCreationAppearance],
                        mainElement:ElementTemplates.popUpBase,
                        htmlSmartInsert:{html:HTMLTemplates.buttonPanel([{label:"Ok",role:"save"},{label:"Reset",role:"reset"},{label:"Cancel",role:"cancel"}]),
                                        destination:"section.popUpControlContainer"},
                        addDataStore:[
                            [e.CONTROLLED_OBJECT,null],
                            [e.TOP_LINK,null],
                            [e.BOTTOM_LINK,null]
                        ],
                        addTemplates:[
                            [ElementTemplates.linkCreationArea,{
                                templateOptions:{identity:e.TOP_LINK},
                                parentElement:"section.popUpContentContainer",
                                saveAs:e.TOP_LINK}],
                            [ElementTemplates.linkCreationArea,{
                                templateOptions:{identity:e.BOTTOM_LINK},
                                parentElement:"section.popUpContentContainer",
                                saveAs:e.BOTTOM_LINK}]
                        ],
                        onCompletionCode:function(){

                        }
                    })
                    
                    KeyNodes.popUp.linkCreation = ElementTemplates.linkCreationPopUp.build(null)
                }

                autoGeneratePopUp:{
                    ElementTemplates.simpleTeamSelectionForm = new ElementTemplate({
                        mainElement: ElementTemplates.genericForm,
                        addClasses:"autoGenerationTeams",
                        onCompletionCode: function(mainDiv,options){
                            this.func.addInputContainer(
                                {
                                    objectField:"supportTeams",
                                    htmlContents:ElementTemplates.displayTeamSelection.build,
                                    verify:(value)=>{
                                        if(!(value instanceof Set)) return false;
                                        let flag = true; 
                                        value.forEach(teamOrDiv=>{
                                            if(!(teamOrDiv instanceof Team) && !(teamOrDiv instanceof Division)) flag=false;
                                        })
                                        return flag; 
                                    },
                                    retrieve:Retreive.accessMap(["currentSettings"]),
                                    harvest:(inputContainer,{insertValue,reset})=>inputContainer.firstElementChild.func.harvest({insertValue,reset}),
                                    edit:Edit.newSettings
                                }
                            )
                        }
                    });

                        EventTemplates.initiateRoundRobin = ElementTemplate.eventObjMaker({
                            triggers:"click",
                            queryselection:"button[data-button-function='roundRobin']",
                            func:function(ev){
                               const dataArray=Array.from( this.root.load(e.ROUND_ROBIN).func.harvestData().values());
                               const teamDivSet = dataArray[0];
                               const teamSet = new Set();
                               for(const teamDiv of teamDivSet){
                                if(teamDiv instanceof Team) teamSet.add(teamDiv);
                                if(teamDiv instanceof Division){
                                    teamDiv.allTeams.forEach(x=>teamSet.add(x));
                                }
                               }
                               UIManagerObject.helperFunctions.temporaryClass(this,1000,"flashGreen")
                               console.log(this)
                               AutoBracket.generate(AutoBracket.roundRobin,{phaseName:"New Round Robin",allowFailure:true,allowDuplicates:true,limitSetSize:true},Array.from(teamSet));
                            }
                        })
                    ElementTemplates.autoBracketPopUp = new ElementTemplate({
                        mainElement:ElementTemplates.popUpBase,
                        addAsElder:"autoBracketPopUp",
                        addEvents:[EventTemplates.closePopUp,EventTemplates.initiateRoundRobin],
                        serialFunctions:[
                        ],
                        htmlSmartInsert:[{html:HTMLTemplates.buttonPanel([{label:"Round-Robin",role:"roundRobin"}]),
                                        destination:"section.popUpContentContainer"},
                        {html:HTMLTemplates.buttonPanel([{label:"Close",role:"close"}]),
                                        destination:"section.popUpControlContainer"},
                                    ],
                        addDataStore:[
                            [e.CONTROLLED_OBJECT,null],
                            [e.ROUND_ROBIN,null],
                        ],
                        addTemplates:[
                            [ElementTemplates.simpleTeamSelectionForm,{destination:"section.popUpContentContainer",saveAs:e.ROUND_ROBIN}]
                        ],
                        onCompletionCode:function(){

                        }
                    });
                    KeyNodes.popUp.autoBracket = ElementTemplates.autoBracketPopUp.build(null)
                }
            
            }
            setUp:{
                function unitCreationHtmlHandler(observer,observation){
                    const {mark,newObject} = observation;
                    if(observer!==CodeObserver.Creation) return false;
                    if(mark===Link) return false;
                    const {html,parentHtml} = FacadeMap.createHtmlWrapper(newObject);
                    return true;
                }
                function unitCreationAppendingHandler(observer,observation){
                    const {mark,newObject} = observation;
                    if(observer!==CodeObserver.Creation) return false;
                    if(mark===Link){
                        let targetHtml = FacadeMap.getHtml(newObject.target);
                        targetHtml.func.assignLinkPosition(newObject);
                        targetHtml.func.refreshCosmetics(); 
                        return true; 
                    }
                    const unitHtml = FacadeMap.getHtml(newObject);
                    if(!unitHtml.root){
                        bracketSection$.append(unitHtml);
                    } else{
                        unitHtml.root.func.addChild(newObject);
                        unitHtml.root.func.refreshChildOrder();
                    }
                    if(newObject instanceof Game || newObject instanceof Block){
                        unitHtml.elder['bracketContainer'].func.updateAllGameOrder();
                        unitHtml.elder['bracketContainer'].func.requestChildrenRefreshCosmetics();
                        unitHtml.elder['bracketContainer'].func.refreshCosmetics();
                    }
                }
                function unitDeletionHandler(observer,observation){
                    if(observer!==CodeObserver.Deletion) return false
                    const {mark,deletedObject} = observation;
                    const deletedHtml = FacadeMap.getHtml(deletedObject);
                    deletedHtml.func.deleteUnit();
                    if(deletedObject === KeyNodes.unitContainers.bracketContainer.load(e.SELECTED)){

                        KeyNodes.unitContainers.bracketContainer.func.selectGame(null);
                    }
                }

                function changeValidityHandler(observer,observation){
                    const {keyword,mark}=observation;
                    if(observer !== CodeObserver.Execution || keyword!==e.VERIFICATION) return false; 
                    
                    const validityTracker = mark.validity;
                    if(!validityTracker.status){
                        console.log(UIManagerObject.unitNameGenerationFunction(mark),validityTracker.message)
                        FacadeMap.getHtml(mark).func.markFailure();
                    } else {
                        FacadeMap.getHtml(mark).func.markSuccess();
                    }
                }
                function verificationRunHandler(observer,observation){
                    const {mark,keyword} =observation;
                    if(mark!==Verification || keyword!==e.VERIFICATION) return false;
                    const objectionsSet = Verification.objections; 
                    const selectedGame = KeyNodes.unitContainers.bracketContainer.load(e.SELECTED);
                    UniqueSelection.wipeClasses(Verification,[e.ALL]);

                    for(const objection of objectionsSet){
                        const visibleDebug = selectedGame === objection.objector;
                        for(const associatedLink of objection.associatedLinkList){
                            const sourceHtml = FacadeMap.getHtml(associatedLink.source);
                            const targetHtml =FacadeMap.getHtml(associatedLink.target);

                            if(sourceHtml) UniqueSelection.select(Verification,sourceHtml,true,["verificationSource",(visibleDebug) ? "debuggingVisible":null])
                            if(targetHtml) UniqueSelection.select(Verification,targetHtml,true,["verificationTarget",(visibleDebug) ? "debuggingVisible":null])
                        }
                        const primeSuspectHtml = FacadeMap.getHtml(objection.primeSuspect);
                        if(primeSuspectHtml) UniqueSelection.select(Verification,primeSuspectHtml,true,["verificationSuspect",(visibleDebug) ? "debuggingVisible":null]);
                    }
                }
                function updateNamesHandler(observer,observation){
                    let {mark,keyword}=observation;
                    if(mark!==Team || keyword !==e.EDIT) return false;
                    for (let game of Competition.current.allGamesArray){
                        let gameHtml = FacadeMap.getHtml(game);
                        gameHtml.func.refreshCosmetics();
                    }
                }
                function selectNextGameHandler(ev){
                    if(ev.key==="2" && ev.altKey===true && ev.repeat===false){
                        KeyNodes.unitContainers.bracketContainer.func.selectNextGame(false);
                        ev.preventDefault();
                    }
                    if(ev.key==="1" && ev.altKey===true && ev.repeat===false){
                        KeyNodes.unitContainers.bracketContainer.func.selectNextGame();
                        ev.preventDefault();
                    }
                }

                CodeObserver.addToHandlerGroup(e.CREATE,[unitCreationHtmlHandler],false);
                CodeObserver.addToHandlerGroup(e.CREATE,[unitCreationAppendingHandler],true);
                CodeObserver.addToHandlerGroup(e.DELETE,[unitDeletionHandler],false);
                CodeObserver.registerHandlerGroup(e.VERIFICATION);  
                CodeObserver.addToHandlerGroup(e.VERIFICATION,[changeValidityHandler],false);
                CodeObserver.addToHandlerGroup(e.EDIT,[updateNamesHandler],false)

                CodeObserver.addHandler(Verification,verificationRunHandler);

                // bracketSection$.setAttribute("tabIndex",0);
                bracketSection$.addEventListener("keydown",selectNextGameHandler);
                // CodeObserver.addToHandlerGroup(e.CREATE,[(o,obs)=>console.log(obs.mark.name,"async")],true);
                // CodeObserver.addToHandlerGroup(e.CREATE,[(o,obs)=>console.log(obs.mark.name)],false);
            } 
        }
    }
    scheduleSection:{
        const ScheduleSettings={
            getSettings(){Break("Must be overridden in menu section")},
            calendar: null,//overidden when calendar created
            getNameFromLink(link){
                if(!link) return "None"
                let name;
                if(link.source instanceof Team){
                    name = link.source.name
                }
                if(link.source instanceof Game){
                    name = `${KeyNodes.FacadeMap.getHtml(link.source).load(e.NAME)} (${(link.sourceRank===1) ? "W":"L"})`
                }
                if(link.source instanceof Phase){
                    name = `${link.source.name} [${link.sourceRank}]`
                }
                return name;
            },
            getRestrictions(){Break("Must be overriden in restrictionPopUp section")},
            currentSchedule: null,

        };
        UIManagerObject.ScheduleSettings = ScheduleSettings;
        CodeObserver.register(ScheduleSettings);
        CodeObserver.addHandler(ScheduleSettings,newCurrentSchedule,false)
        function newCurrentSchedule(observer,observations){
            const {newObject} = observations;
            ScheduleSettings.currentSchedule = newObject;
        }
        oLog.scheduleSettings = ScheduleSettings;

        function runAndDisplaySchedule(){
            let restrictions = ScheduleSettings.getRestrictions();
            let scheduler=new Scheduler(Competition.current,ScheduleSettings.getSettings().get('fieldNumber'),ScheduleSettings.getSettings().get('startDateObject').getTime(),{restrictions})
            scheduler.scheduleAll();
            let simpleFieldSchedule = scheduler.getFieldSchedule();
            let supportScheduler = new SupportScheduler(Competition.current,simpleFieldSchedule)
            let completeFieldSchedule = supportScheduler.getCompleteSchedule();
            ScheduleSettings.calendar.func.processFieldSchedule(completeFieldSchedule);
        }
        menu:{
            const schedulingMenuForm$ = ElementTemplates.genericForm.build(null,{useAsMainDiv:"menu"});
            schedulingSectionMenuContainer$.append(schedulingMenuForm$);
            schedulingMenuForm$.init.addClasses("schedulingSectionMenuContainer")
            schedulingMenuForm$.func.addInputContainer(
                {
                objectField:"fieldNumber",
                verify:Verify.positiveInt,
                harvest:Harvest.smartStandardNumber(1),
                retrieve:()=>1,
                edit:()=>true,
                htmlContents: HTMLTemplates.smartStandardNumber("Fields:",1)
                },
                {
                objectField:"scheduleIncrement",
                verify:Verify.positiveInt,
                harvest:Harvest.smartStandardNumber(30),
                retrieve:()=>1,
                edit:()=>true,
                htmlContents: HTMLTemplates.smartStandardNumber("Time Increment:",30)
                },
                {
                objectField:"startDate",
                verify:Verify.positiveInt,
                harvest:Harvest.smartStandardTextInput(`${new Date().getFullYear()}-${String(new Date().getMonth()+1).padStart(2,0)}-${String(new Date().getDate()).padStart(2,0)}`),
                retrieve:()=>1,
                edit:()=>true,
                htmlContents: HTMLTemplates.smartStandardDate("Comp Date:")
                },
                {
                objectField:"startTime",
                verify:Verify.positiveInt,
                harvest:Harvest.smartStandardTextInput("08:00"),
                retrieve:()=>1,
                edit:()=>true,
                htmlContents: HTMLTemplates.smartStandardTime("Comp Time:")
                },
            )

            schedulingMenuForm$.func.addFormControls(
                {html:HTMLTemplates.labelledButton("Schedule"),
                controlFunction:"startScheduling",
                func:()=>{runAndDisplaySchedule()}},

                {html:HTMLTemplates.labelledButton("Get Team CSV"),
                controlFunction:"getTeamCSV",
                func:()=>{downloadFile(CSVGenerator.teamCSV(),"team.csv")}},
                
                {html:HTMLTemplates.labelledButton("Get Draw CSV"),
                controlFunction:"getDrawCSV",
                func:()=>{downloadFile(CSVGenerator.drawCSV(ScheduleSettings.currentSchedule),"draw.csv")}},

                {html:HTMLTemplates.labelledButton("Restrictions"),
                controlFunction:"editRestrictions",
                func:()=>{KeyNodes.popUp.restrictions.func.openPopUp()}}
            )

            ScheduleSettings.getSettings = function getSettings(){
                schedulingMenuForm$.func.harvestData();
                const scheduleInfo = schedulingMenuForm$.func.getHarvestDataMappedByObjectField();
                const startDateObject = getUTCDateFromStrings(scheduleInfo.get("startDate"),scheduleInfo.get("startTime"));
                startDateObject.setSeconds(0,0);
                scheduleInfo.set("startDateObject",startDateObject)
                return scheduleInfo
            }
            
        }
        restrictionsPopUp:{
            const restrictionsPopUp = ElementTemplates.popUpBase.build(null,{});
            const restrictionDisplay = ElementTemplates.genericDisplayBoard.build(restrictionsPopUp,{
                displayTypes:[{
                displayType:"name",
                textFunc:(x)=>x.restrictionName,
                smartHtml:{html:HTMLTemplates.actionButtonFactory("X",function(ev){
                                                this.root.func.deleteDisplayItem();
                                                this.elder['displayBoard'].func.deleteRestrictionObject(this.root.load(e.DISPLAY).restrictionName)})}
                }]
            });
            restrictionDisplay.init.addClasses("restrictionDisplay")

            const restrictionForm = ElementTemplates.genericForm.build(restrictionsPopUp,{controlledObjectConstructor:Object});
                    oLog.restrictionDisplay = restrictionDisplay;
                    KeyNodes.popUp.restrictions = restrictionsPopUp;

            //Settings getRestrictions
            ScheduleSettings.getRestrictions = function(){
                const formattedRestrictions =[];
                const restrictionObjects = restrictionsPopUp.load(e.RESTRICTIONS);
                for(const [restrictionName,restrictionObject] of restrictionObjects){
                    let startField = restrictionObject.startField;
                    if(restrictionObject.firstField || restrictionObject.allFields) startField =0;
                    
                    let endField = restrictionObject.endField;
                    if(restrictionObject.lastField || restrictionObject.allFields) endField =Number.POSITIVE_INFINITY;

                    let startTime;
                    let endTime;
                    let length;
                    let compStartDate = ScheduleSettings.getSettings().get("startDateObject");
                    if(restrictionObject.timeChoice ==="objective"){
                        startTime = getUTCDateFromStrings(restrictionObject.startDate,restrictionObject.startTime).getTime();
                        endTime = getUTCDateFromStrings(restrictionObject.startDate,restrictionObject.startTime).getTime();
                        length = endTime-startTime;
                    }
                    if(restrictionObject.timeChoice ==="relativeDay"){
                        let compStartOfDayTime = getUTCDayBoundary(compStartDate.getTime()).dayStart;
                        // let compStartOfDayTime = 0;
                        startTime = compStartOfDayTime + 
                                    (restrictionObject.startDay-1)*d.DAY_MS +
                                    getMsFromTimeString(restrictionObject.startTime);
                        endTime = compStartOfDayTime + 
                                    (restrictionObject.endDay-1)*d.DAY_MS +
                                    getMsFromTimeString(restrictionObject.endTime);
                        length = endTime-startTime;
                    }
                    if(restrictionObject.timeChoice ==="relativeTime"){
                        let compStartTime = compStartDate.getTime();
                        startTime = compStartTime + 
                                    (restrictionObject.startDay-1)*d.DAY_MS +
                                    (restrictionObject.startHour)*d.HOUR_MS +
                                    (restrictionObject.startMinute)*d.MINUTE_MS;
                        endTime = compStartTime + 
                                    (restrictionObject.endDay-1)*d.DAY_MS +
                                    (restrictionObject.endHour)*d.HOUR_MS +
                                    (restrictionObject.endMinute)*d.MINUTE_MS;
                        length = endTime-startTime;
                    }
                    startTime=startTime - compStartDate.getTime();
                    console.log(new Date(startTime),new Date(endTime),length)

                    const formattedRestriction = {
                        name: restrictionObject.restrictionName,
                        description:restrictionObject.restrictionName,
                        startField:startField,
                        endField:endField,
                        type:e.FIELD_CLOSURE,
                        startTime,
                        length
                    }
                    console.log(formattedRestriction);
                    formattedRestrictions.push(formattedRestriction);
                }
                return formattedRestrictions;
            }
            //Popup Set-up
            restrictionsPopUp.init.addDataStore([e.RESTRICTIONS,Map]);
            restrictionsPopUp.init.addDataStore([e.DISPLAY,restrictionDisplay]);
            restrictionsPopUp.init.addDataStore([e.FORM,restrictionForm]);
            restrictionsPopUp.init.htmlSmartInsert(
            {html:()=>HTMLTemplates.buttonPanel([{label:"Close",role:"close",func:function(ev){this.elder["popupbase"].func.closePopUp()}}]),
            destination:"section.popUpControlContainer",
            });
            
            restrictionsPopUp.func.addContent(restrictionForm);
            restrictionsPopUp.func.addContent(restrictionDisplay);
            //Form set-up
            restrictionForm.init.addClasses("restrictionEditor")
            restrictionForm.func.addInputSection("basicDetails","timeChoice","timeDetails");
            UniqueSelection.addGroup(e.DISPLAY);
            UniqueSelection.addFamily(e.DISPLAY,[],"relativeDay");//aliases correspond to radio button values for type of time selection
            UniqueSelection.addFamily(e.DISPLAY,[],"relativeTime");
            UniqueSelection.addFamily(e.DISPLAY,[],"objective");

            function newRestrictionObject(harvestedDataAsMap){
                let restrictionObject={};
                for(let [fieldName,data] of harvestedDataAsMap){
                    restrictionObject[fieldName]=data;
                }
                this.elder['popupbase'].load(e.RESTRICTIONS).set(restrictionObject.restrictionName,restrictionObject);
                this.elder['popupbase'].load(e.DISPLAY).func.clearDisplay();
                for(const [name,obj] of this.elder['popupbase'].load(e.RESTRICTIONS)){
                    let displayItem = this.elder['popupbase'].load(e.DISPLAY).func.addDisplayItem(obj);
                displayItem.firstChild.addEventListener("click",function(){
                    this.elder['popupbase'].load(e.FORM).func.editingMode(this.root.load(e.DISPLAY));
                    UniqueSelection.select(e.DISPLAY,restrictionObject.timeChoice)
                });
                }
            }
            function deleteRestrictionObject(name){
                this.elder['popupbase'].load(e.RESTRICTIONS).delete(name);
                console.log(restrictionsPopUp.load(e.RESTRICTIONS));
            }
            function viewDefaultTimeChoice(){
                UniqueSelection.select(e.DISPLAY,"relativeDay");
            }
            restrictionForm.init.addFunctions(newRestrictionObject);

            restrictionDisplay.init.addFunctions(deleteRestrictionObject);

            restrictionForm.func.addInputContainer(
                    {
                    objectField:"restrictionName",
                    verify:function(value){
                     return   (value === this.func.retrieve() ||
                        !restrictionsPopUp.load(e.RESTRICTIONS).has(value))},
                    harvest:Harvest.smartStandardTextInput("New Restriction"),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardText("Name: "),
                    destination:"section.basicDetails",
                    },
                    {
                    objectField:"allFields",
                    verify:Verify.boolean,
                    harvest:Harvest.fireChangeSingleCheckbox,
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardSingleCheckbox("All Fields "),
                    destination:"section.basicDetails",
                    addEvents:[{triggers:["change","progChange"],func:function(ev){
                        let checked = this.func.harvest();
                    if(checked) this.elder['form'].querySelectorAll("section.basicDetails div:not([data-object-field=allFields]) input:not([type='text'])")?.forEach(x=>{if(x.getAttribute("disabled")!=='true')x.setAttribute("disabled",false)});
                    else this.elder['form'].querySelectorAll("section.basicDetails input:not([type='text'])")?.forEach(x=>{if(x.getAttribute("disabled")==='false') x.removeAttribute("disabled")});
                    }}]
                    },
                    {
                    objectField:"firstField",
                    verify:Verify.boolean,
                    harvest:Harvest.fireChangeSingleCheckbox,
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardSingleCheckbox("First Field "),
                    destination:"section.basicDetails",
                    addEvents:[{triggers:["change","progChange"],func:function(ev){
                        let checked = this.func.harvest();
                    if(checked) this.elder['form'].querySelector("[data-object-field='startField'] input")?.setAttribute("disabled",true);
                    else this.elder['form'].querySelector("[data-object-field='startField'] input")?.removeAttribute("disabled");
                    }}]
                    },
                    {
                    objectField:"startField",
                    verify:Verify.positiveInt,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("Start Field:",1),
                    destination:"section.basicDetails"
                    },
                    {
                    objectField:"lastField",
                    verify:Verify.boolean,
                    harvest:Harvest.fireChangeSingleCheckbox,
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardSingleCheckbox("Last Field "),
                    destination:"section.basicDetails",
                    addEvents:[{triggers:["change","progChange"],func:function(ev){
                        let checked = this.func.harvest();
                       if(checked) this.elder['form'].querySelector("[data-object-field='endField'] input")?.setAttribute("disabled",true);
                       else this.elder['form'].querySelector("[data-object-field='endField'] input")?.removeAttribute("disabled");
                    }}]
                    },
                    {
                    objectField:"endField",
                    verify:Verify.positiveInt,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("End Field:",1),
                    destination:"section.basicDetails"
                    },
                    {
                    objectField:"timeChoice",
                    verify:()=>true,
                    harvest:Harvest.radioButtons,
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartRadioButtons("timeChoice",
                    {value:"relativeDay",label:"Relative to First Day of Competition"},
                    {value:"relativeTime",label:"Relative to Competition Start Time"},
                    {value:"objective",label:"Choose Date / Time"},
                    ),
                    addEvents:{triggers:"change",queryselection:"input[type='radio']",func:function(){
                        UniqueSelection.select(e.DISPLAY,this.value);
                    }},
                    destination:"section.timeChoice"
                    },
                    {
                    objectField:"startDate",
                    verify:()=>true,
                    harvest:Harvest.smartStandardDate(),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardDate("Start Date:"),
                    uniqueSelectionFamily:{familyAlias:["objective"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"startDay",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("Start Day:"),
                    uniqueSelectionFamily:{familyAlias:["relativeDay","relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"startHour",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("Start Hour:"),
                    uniqueSelectionFamily:{familyAlias:["relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"startMin",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("Start Minute:"),
                    uniqueSelectionFamily:{familyAlias:["relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"startTime",
                    verify:()=>true,
                    harvest:Harvest.smartStandardTime(8,0),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardTime("Start Time:"),
                    uniqueSelectionFamily:{familyAlias:["relativeDay","objective"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"endDate",
                    verify:()=>true,
                    harvest:Harvest.smartStandardDate(),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardDate("End Date:"),
                    uniqueSelectionFamily:{familyAlias:["objective"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"endDay",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("End Day:"),
                    uniqueSelectionFamily:{familyAlias:["relativeDay","relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"endHour",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("End Hour:"),
                    uniqueSelectionFamily:{familyAlias:["relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"endMin",
                    verify:()=>true,
                    harvest:Harvest.smartStandardNumber(1),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardNumber("End Minute:"),
                    uniqueSelectionFamily:{familyAlias:["relativeTime"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },
                    {
                    objectField:"endTime",
                    verify:()=>true,
                    harvest:Harvest.smartStandardTime(10,0),
                    retrieve:Retreive.directProperty,
                    edit:Edit.directProperty,
                    htmlContents: HTMLTemplates.smartStandardTime("End Time:"),
                    uniqueSelectionFamily:{familyAlias:["relativeDay","objective"],groupName:e.DISPLAY},
                    destination:"section.timeDetails"
                    },

            )
            restrictionForm.func.addFormControls(
                {
                    html: HTMLTemplates.labelledButton("Create","newRestriction"),
                    func: function(){
                        this.elder['form'].func.harvestData();
                        if(this.elder['form'].func.verifyHarvestedData()){
                            let dataMapByField = this.elder['form'].func.getHarvestDataMappedByObjectField();
                            this.elder['form'].func.newRestrictionObject(dataMapByField);
                        }
                    },
                    uniqueSelectionFamily: {familyAliases:[e.CREATE],groupName:restrictionForm},
                    classes:"hiddenByDefault"
                },
                {
                    html: HTMLTemplates.labelledButton("Edit","editRestricion"),
                    func: function(){
                        if(this.elder['form'].func.updateObject()){
                        this.elder['popupbase'].load(e.DISPLAY).func.refreshAllText();
                        this.elder['form'].func.resetValues(true);
                        this.elder['form'].func.switchMode(e.CREATE);
                        viewDefaultTimeChoice()}
                    },
                    uniqueSelectionFamily: {familyAliases:[e.EDIT],groupName:restrictionForm},
                    classes:"hiddenByDefault"
                },
                {
                    html: HTMLTemplates.labelledButton("Cancel","resetValueEntry"),
                    func: function(){
                        this.elder['form'].func.resetValues(true);
                        this.elder['form'].func.switchMode(e.CREATE);
                        viewDefaultTimeChoice()
                        
                    },
                    uniqueSelectionFamily: {familyAliases:[e.CREATE,e.EDIT],groupName:restrictionForm},
                    classes:"hiddenByDefault"
                },
            )

            let newHeading =HTMLAdditions.hideByDefault(HTMLTemplates.smartHeading("New Restriction"));
            let [newHeadingInserted] = restrictionForm.init.htmlSmartInsert({html:newHeading,insertionMethod:Element.prototype.prepend})
            UniqueSelection.expandFamily(restrictionForm,e.CREATE,newHeadingInserted);
            let editHeading =HTMLAdditions.hideByDefault(HTMLTemplates.smartHeading("Edit Restriction"));
            let [editHeadingInserted] = restrictionForm.init.htmlSmartInsert({html:editHeading,insertionMethod:Element.prototype.prepend})
            UniqueSelection.expandFamily(restrictionForm,e.EDIT,editHeadingInserted);

            let timeDetailInputs = restrictionForm.querySelectorAll("section.timeDetails>.inputContainer");
            timeDetailInputs.forEach(x=>x.classList.add("hiddenByDefault"));
            
            restrictionForm.func.switchMode(e.CREATE);
            UniqueSelection.select(e.DISPLAY,"relativeDay");

            
            
            

        }
        scheduleTable:{
            ElementTemplates.calendarControls = new ElementTemplate({
                mainElement: ElementTemplates.genericForm,
                addDataStore:[
                   
                ],
                onCompletionCode: function(mainDiv,options){
                   

                }
            });
            function createTable(){
                const table = document.createElement("table");
                const rowContainer = table;
                return {table,rowContainer}
            }
            function createRow(rowTime,increment,fieldNumber,rowContainer){
                const rowDate = new Date(rowTime);
                const tr = document.createElement("tr");
                const timeCell = document.createElement("td");
                tr.append(timeCell);
                timeCell.append(`${String(rowDate.getUTCHours()).padStart(2,"0")}:${String(rowDate.getUTCMinutes()).padStart(2,"0")}`);
                const rowReference = {startTime:rowTime,endTime:rowTime+increment-1,timeCell,htmlRow:tr,fieldCell:{},empty:true}

                for(let i=1;i<=fieldNumber;i++){
                    let fieldCell = document.createElement("td");
                    tr.append(fieldCell);
                    rowReference.fieldCell[i]=fieldCell;
                }

                rowContainer.append(tr);
                this.load(e.CELL_TIME).set(rowReference,rowReference);
                UniqueSelection.addMember(this,rowReference.htmlRow);
                return rowReference;
            }
            function createCaps(table,fieldNumber){
                let headingRow = document.createElement("tr");
                let timeHeading = document.createElement("th");
                timeHeading.append("Time");
                headingRow.append(timeHeading);
                for(let i=1;i<=fieldNumber;i++){
                    let fieldHeading = document.createElement("th");
                    fieldHeading.append(`Field ${i}`);
                    headingRow.append(fieldHeading);
                }
                table.prepend(headingRow);
            }
            function createCalendarGrid(fieldNumber=1){
                 const increment =   this.load(e.INCREMENT) 
                 const startTime = this.load(e.START_TIME)
                 const setPointForToday = this.load(e.SET_POINT) + startTime;
                 const endTime=   this.load(e.END_TIME)
                 let earliestRowTime;
                 let rowTimes =[];

                 const {table,rowContainer} = this.func.createTable();
                
                 for(let currentTime=setPointForToday;currentTime<endTime;currentTime= currentTime+increment){
                     rowTimes.push(currentTime);
                    }
                 for(let currentTime=setPointForToday-increment;currentTime>=startTime;currentTime= currentTime-increment){
                     rowTimes.unshift(currentTime)
                     earliestRowTime = currentTime;
                 }

                 this.func.createRow(startTime,earliestRowTime-startTime,fieldNumber,rowContainer)
                 
                 for(const rowTime of rowTimes){
                    const adjustedIncrement = ((rowTime+increment)>endTime) ? endTime-rowTime:increment;
                   this.func.createRow(rowTime,adjustedIncrement,fieldNumber,rowContainer);
                 }

                //  this.func.createCaps(rowContainer)
                 this.replaceChildren();
                 this.save(e.CONTENTS,table);
                 this.append(table);    
            }
            function fillCalendarGrid(withinDaySet){
                for(let timeSlot of withinDaySet){
                    let timeSlotAdjustedStartTime = (timeSlot.absoluteStartTime<this.load(e.START_TIME)) ? this.load(e.START_TIME):timeSlot.absoluteStartTime
                    let appropriateRow = this.load(e.CELL_TIME).findOverlap(timeSlotAdjustedStartTime).items[0];
                    let cellText;
                    if(timeSlot.type === e.GAME_SLOT){

                        let teamNames =[];
                        for(let inLink of timeSlot.scheduledItem.incomingLinks){
                            teamNames.push(ScheduleSettings.getNameFromLink(inLink))
                        }
                        cellText = newE("div");
                        cellText.classList.add("cellText")
                        let firstLine = newE("p");
                        firstLine.append( `${KeyNodes.FacadeMap.getHtml(timeSlot.scheduledItem).load(e.NAME)}: ${teamNames[1]} vs. ${teamNames[0]}`);
                        cellText.append(firstLine)
                        let secondLine = newE("p");
                        secondLine.append(`(Duty:${ScheduleSettings.getNameFromLink(timeSlot.supportRoles.get(SupportScheduler.DUTY))}) `);
                        cellText.append(secondLine)
                    }
                    if(timeSlot.type === e.FIELD_CLOSURE){
                        cellText=timeSlot.description;
                    }
                    appropriateRow.fieldCell[timeSlot.fieldNumber].append(cellText);
                    appropriateRow.empty=false;
                }
            }
            function trimCalendarGrid(){
                let cellTime = this.load(e.CELL_TIME);
                let allRowEntries = cellTime.entries(true)
                //from start
                    for(let i=0;i<allRowEntries.length;i++){
                        let rowReference = allRowEntries[i].item
                        if(!rowReference.empty) break;
                        UniqueSelection.select(this,rowReference.htmlRow,true,["hiddenByDefault"])
                    }
                //from end
                for(let i=allRowEntries.length-1;i>=0;i--){
                    let rowReference = allRowEntries[i].item
                    if(!rowReference.empty) break;
                    UniqueSelection.select(this,rowReference.htmlRow,true,["hiddenByDefault"])
                }
            }
            ElementTemplates.calendarDayDisplay = new ElementTemplate({
                addAsElder:"calendarDayDisplay",
                addClasses:["calendarDayDisplay","hiddenByDefault"],
                addDataStore:[
                    [e.SET_POINT,null],
                    [e.INCREMENT,null],
                    [e.START_TIME,null],
                    [e.END_TIME,null],
                    [e.CONTENTS,null],
                    [e.CELL_TIME,TimeMap]
                ],
                addFunctions:[createCalendarGrid,fillCalendarGrid,trimCalendarGrid,createRow,createTable,createCaps],
                onCompletionCode: function(mainDiv,options){
                    const {increment,setPoint,dayStart,dayEnd,dayOfComp,withinDaySet} = options;
                    this.save(e.INCREMENT, increment)
                    this.save(e.SET_POINT, setPoint)
                    this.save(e.START_TIME, dayStart)
                    this.save(e.END_TIME, dayEnd)
                    let calendarDayButton = HTMLTemplates.actionButton(`D${dayOfComp} (${getHumanDate(dayStart)})`,()=>UniqueSelection.toggle(this.elder['calendar'],this));
                    this.elder['calendar'].load(e.DAY_BUTTONS).append(calendarDayButton);
                    UniqueSelection.addFamily(this.elder['calendar'],[this,calendarDayButton],this);
                    UniqueSelection.addGroup(this,{alternateClasses:["hiddenByDefault"]});
                    this.func.createCalendarGrid(this.elder['calendar'].load(e.FIELD_NUMEBER));
                    this.func.fillCalendarGrid(withinDaySet);
                    this.func.trimCalendarGrid();
                    this.func.createCaps(this.load(e.CONTENTS),this.elder['calendar'].load(e.FIELD_NUMEBER));
                }
            });
            function addCalendarDisplay(dayStart,withinDaySet,dayOfComp){
                let dayEnd = dayStart + d.DAY_MS;
                let newCalendarDisplay = ElementTemplates.calendarDayDisplay.build(this,{
                    increment:this.func.getIncrement(),
                    setPoint:this.func.getSetPoint(),
                    dayStart,
                    dayEnd,
                    dayOfComp,
                    withinDaySet
                })
                this.load(e.CONTENTS).add(newCalendarDisplay);
                this.load(e.CHILD_CONTAINER).append(newCalendarDisplay);
            }
            function getIncrement(){
                // this.load(e.CONTROLS).func.harvestData();
                // let labelledData = this.load(e.CONTROLS).func.getHarvestDataMappedByObjectField();
                // return labelledData.get("scheduleIncrement")*60*1000;
                return ScheduleSettings.getSettings().get("scheduleIncrement")*60*1000;
            }
            function getSetPoint(){
                let setPointTime = new Date(`1970-01-01T${ScheduleSettings.getSettings().get("startTime")}Z`).getTime();
                return setPointTime;
            }
            function clearCalendarDisplay(){
                this.load(e.CHILD_CONTAINER).replaceChildren();
                this.load(e.DAY_BUTTONS).replaceChildren();
                this.save(e.FIELD_SCHEDULE,null);
                this.save(e.FIELD_NUMEBER,null);
                this.save(e.CONTENTS,new Set());
                UniqueSelection.deleteGroup(this);
                UniqueSelection.addGroup(this);
            }
            
            function processFieldSchedule(simpleFieldSchedule){
                let fieldNumber = simpleFieldSchedule.length-1;
                let dayMap = simpleFieldSchedule.dayMap;
                this.func.clearCalendarDisplay();
                this.save(e.FIELD_NUMEBER,fieldNumber);
                this.save(e.FIELD_SCHEDULE,simpleFieldSchedule)
                let sortedDayStarts = Array.from(dayMap.keys()).sort(SortFn.numAscending)
                for(let i=0;i<sortedDayStarts.length;i++){
                    let dayStart = sortedDayStarts[i];
                    this.func.addCalendarDisplay(dayStart,dayMap.get(dayStart),i+1);
                }
                UniqueSelection.toggle(this,Array.from(this.load(e.CONTENTS))[0]);
            }

            ElementTemplates.calendar= new ElementTemplate({
                addClasses:"calendar",
                addAsElder:"calendar",
                addFunctions:[getDayBoundary,getIncrement,clearCalendarDisplay,addCalendarDisplay,processFieldSchedule,getSetPoint],
                htmlInsert: parseHTML(`
                <section class='controlPanel'>
                <nav class='daySelection'> DAYS </nav>
                </section>
                <section class='calendarDisplay'>CALENDERS</section>
                `),
                addDataStore:[
                    [e.CONTROLS,null],
                    [e.CONTENTS,Set],
                    [e.CHILD_CONTAINER,null],
                    [e.DAY_BUTTONS,null],
                    [e.FIELD_SCHEDULE,null],
                    [e.FIELD_NUMEBER,null],
                ],
                addTemplates:[
                    [ElementTemplates.calendarControls,{destination:"section.controlPanel",saveAs:e.CONTROLS,prepend:true}]
                ],
                onCreationCode:function(mainDiv,options){
                    this.save(e.CHILD_CONTAINER,mainDiv.querySelector("section.calendarDisplay"));
                    this.save(e.DAY_BUTTONS,mainDiv.querySelector("section.controlPanel nav.daySelection"));
                    this.func.clearCalendarDisplay();
                    ScheduleSettings.calendar = this;
                }
            });
        }
        setup:{
            const calendar$ = ElementTemplates.calendar.build(null,{});
            schedulingDisplaySection$.append(calendar$);
            oLog.calendar = calendar$;
        }
    }

    return UIManagerObject;
})()
 