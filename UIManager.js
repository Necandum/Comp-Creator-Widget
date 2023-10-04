var UIManager = (function () {

    let UniqueSelection = (function () {
        let registry = new Map([document,new Map()]);
        let defaultClass = "toggleSelection"

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
            this.wipeClasses=(groupName,useClasses=[])=>{
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, registry });
                useClasses = new Set(useClasses);
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);
                for(const [className,groupClassSet] of group){
                    if(!useClasses.has(className)) continue
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
                        if(selectedMember.classList.contains(selectedClass)){
                            selectedMember.classList.remove(selectedClass);
                        } else {
                           classNowPresent = this.select(groupName,selectedMember,addToSelection,[selectedClass]);
                        }
                    }
                }
                return classNowPresent;
            }
        }

        let controlObject = new UniqueSelection();
        controlObject.addGroup("configurationMenu");
        controlObject.addGroup("configurationSection");
        controlObject.addGroup("competitorsMenu")

        return controlObject
    })();

    UIManagerObject = {};

    const configurationMenu$ = getE("#configurationMenu");
    const sectionMenus$=getE("#sectionMenus");
    const configurationSectionContainer$ = getE("#configurationSectionContainer");
    const competitorSectionMenuContainer$ = getE("#competitorSectionMenuContainer");
    const bracketSectionMenuContainer$ = getE("#bracketSectionMenuContainer");
    const competitorSectionMenu$ = getE("#competitorSectionMenu");
    const displayArea$ = getE('#displayArea');
    const bracketSection$ = getE("#bracketSection");
    const teamForm$ = getE("#competitorTeamTab form");
    const teamNav$ = getE("#competitorTeamTab nav")
    const divisionForm$ = getE("#competitorDivisionTab form");
    const divisionNav$ = getE("#competitorDivisionTab nav")
    const playerForm$ = getE("#competitorPlayerTab form");
    const playerNav$ = getE("#competitorPlayerTab nav")
    const combinedFormPlayer$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Player']");
    const combinedFormTeam$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Team']");
    const combinedFormDivision$ = getE("#competitorCombinedTab form[data-controlled-object-constructor='Division']");
    const combinedNav$ = getE("#competitorCombinedTab nav")

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
    const EventTemplates = {};
    const ElementTemplates = {};
    const KeyNodes={};
    KeyNodes.popUp = {};

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
        }
    };
    const Retreive = { //Accepts (controlloed object,property)
        directProperty(controlledObject,property){
            return controlledObject[property]
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
        }
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
    HTMLTemplates.smartStandardNumber = function(label){
        let html = parseHTML(`
        <label>${label} <input type='number' value='0'/> </label>
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
    HTMLTemplates.labelledButton = function(label){
        let button = HTMLTemplates.button();
        button.append(label);
        return button;
    }
    HTMLTemplates.linkLabel=function(topOrBottom,contents){
        let div = document.createElement('div');
        div.classList.add(`${topOrBottom.description}`);
        div.append(contents);
        return div;
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
        ElementTemplates.popUpBase = new ElementTemplate({
            htmlInsert:function(mainDiv,options){
                let html = parseHTML(`
                <menu class='popUpWindow'>
                <section class='popUpContentContainer'>
                </section>
                </menu>
                `);
                return html;
            },
            addAsElder:"popupbase",
            addClasses:["popUpBase","hiddenByDefault"],
            addFunctions:[openPopUp,closePopUp],
            onCompletionCode:function(){
                UniqueSelection.addGroup(e.POP_UP);
                UniqueSelection.addMember(e.POP_UP,this);
                document.body.append(this);
            }
        });
        EventTemplates.closePopUp = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-button-function='primary']",
            func:function(ev){
                this.elder['popupbase'].func.closePopUp();
            }
        })
        ElementTemplates.popUpButtons = new ElementTemplate({
            htmlInsert:function(mainDiv,options){
                let html = parseHTML(`
                <nav>
                <button type="button" data-button-function="primary"> Okay</button>
                <button type="button" data-button-function="Seconday"> Cancel</button>
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
            return this.load(e.HARVEST)(this,{insertValue,reset});
        }
        function retrieve(){
            return this.load(e.RETRIEVE)(this.elder['form'].load(e.CONTROLLED_OBJECT),this.load(e.OBJECT_FIELD))
        }
        function verify(value){
            return this.load(e.VERIFICATION)(value);
        }
        function edit(newValue){
            return this.load(e.EDIT)(this.elder['form'].load(e.CONTROLLED_OBJECT),this.load(e.OBJECT_FIELD),newValue);
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
                htmlContents}=options;

                this.save(e.OBJECT_FIELD,objectField);
                this.save(e.HARVEST,harvest);
                this.save(e.VERIFICATION,verify);
                this.save(e.RETRIEVE,retrieve);
                this.save(e.EDIT,edit);

                this.init.htmlInsert(htmlContents);
                this.dataset.objectField = objectField;
            }
        });

        
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
        function verifyHarvestedData(){
            let harvestedData = this.load(e.HARVESTED_DATA);
            for(const [inputContainer,value] of harvestedData){
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
               let [createdElement]= this.init.addTemplates([[ElementTemplates.inputContainer,{templateOptions:inputContainerOptions,parentElement:"section.inputContainers"}]]);
               this.load(e.INPUT_CONTAINER_LIST).add(createdElement);
               UniqueSelection.addMember(this.elder['form'],createdElement);  
               createdElement.func.harvest({reset:true});
            }
            return this.func;
        }
        function addStackableInputContainer(inputContainerOptions){
               let [createdElement]= this.init.addTemplates([[ElementTemplates.stackableInputContainer,{templateOptions:inputContainerOptions,parentElement:"section.inputContainers"}]]);
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
                clearVerificationList,resetValues,importObject,editingMode,creationMode,createObject,updateObject,removeInputContainer],
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
            let allDivisions = Division.allDivisionsArray.sort((a,b)=>a.name.localeCompare(b.name));
            let allTeams = Team.allTeamsArray.sort((a,b)=>a.name.localeCompare(b.name));
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
                    if(ev.code!=="Enter") return;
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
                            gameStageLineInputAdder(baseStackableInput$,newLineSection$);
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
                //Currently Selected Game
                const selectedGameDisplay$ = document.createElement("span");
                selectedGameDisplay$.dataset.display='selectedGame';
                let selectedGameDisplayMenuItem$ = document.createElement("li");
                selectedGameDisplayMenuItem$.append(selectedGameDisplay$);
                bracketSectionMenuContainer$.append(selectedGameDisplayMenuItem$)
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
                            }
                            this.set(html,unit);
                            return {html,parentHtml};
                        }
                    }
                })();
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
                    let contentsOrder = this.load(e.CONTENTS_ORDER);
                    contentsOrder.length=0;
                    for(const child of this.load(e.CONTENTS)){
                        contentsOrder.push(child);
                    }
                   let htmlChildren = Array.from(this.load(e.CHILD_CONTAINER).children);
                   contentsOrder.sort((a,b)=>{
                        let aIndex = htmlChildren.indexOf(FacadeMap.getHtml(a));
                        aIndex = (aIndex===-1) ? Number.POSITIVE_INFINITY: aIndex;

                        let bIndex = htmlChildren.indexOf(FacadeMap.getHtml(b));
                        bIndex = (bIndex===-1) ? Number.POSITIVE_INFINITY: bIndex;
                        return aIndex-bIndex
                    })
                   contentsOrder.forEach((child,index)=>FacadeMap.getHtml(child).save(e.ORDER,index));
                }
                function requestChildrenRefreshCosmetics(){
                    let children = this.load(e.CONTENTS);
                    for(const child of children){
                        let childHtml = FacadeMap.getHtml(child);
                        childHtml.func.refreshCosmetics();
                        childHtml.func.requestChildrenRefreshCosmetics();
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
                ElementTemplates.baseUnitContainer = new ElementTemplate({
                    htmlInsert:parseHTML(`
                            <div class='anteChildrenDisplayArea'></div>
                            <div class='contentsDisplayArea'>
                                <section class='childContainer'></section> 
                            </div>
                            <div class='postChildrenDisplayArea'></div>
                    `),
                    addFunctions:[refreshCosmetics,getChildren,refreshChildren,requestChildrenRefreshCosmetics,updateChildOrder,refreshChildOrder,addChild],
                    addClasses:"unitContainer",
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
                    }

                });
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
                            this.elder['phaseContainer'].func.refreshChildOrder();
                        });
                    }
                })
                ElementTemplates.gameAdditionButton = new ElementTemplate({
                    mainElement:ElementTemplates.baseAdditionButton,
                    addClasses:"gameAdditionButton",
                    onCompletionCode:function(mainDiv,options){
                        this.addEventListener("click",()=>{
                            let order = this.elder['gameContainer']?.load(e.ORDER) ?? Number.POSITIVE_INFINITY;
                            let createdBlock =  this.elder['blockContainer'].load(e.CONTROLLED_OBJECT).newGame();
                            let createdBlockHtml = FacadeMap.getHtml(createdBlock);
                            createdBlockHtml.save(e.ORDER,order-0.5);
                            this.elder['blockContainer'].func.refreshChildOrder();
                        });
                    }
                })
                    EventTemplates.gameSelection = new ElementTemplate.eventObjMaker({
                        triggers:"click",
                        queryselection:"section.childContainer",
                        func:function(ev){
                            let currentlySelected = this.elder['bracketContainer'].load(e.SELECTED);
                            let chosenGame = this.elder['gameContainer'].load(e.CONTROLLED_OBJECT);
                            let sourceRank =( ev.button===0) ? 1:2;
                            if(!currentlySelected || ev.altKey){
                                this.elder['bracketContainer'].func.selectGame(chosenGame);
                                return true;
                            } 

                            if(!ev.ctrlKey){
                                if(!ev.shiftKey){
                                    
                                } else{
                                    
                                }
                            } else{
                                if(!ev.shiftKey){
                                    
                                } else{

                                }
                            }

                        }
                    })
                    function refreshGameDisplay(){
                        let gameLabelGenFunc = UIManagerObject.gameLabelGenerationFunctions.selected;
                        let linkLabelGenFunc = UIManagerObject.linkLabelGenerationFunctions.selected;
                        this.load(e.CHILD_CONTAINER).replaceChildren();
                        this.func.getGameDisplayIndex();
                        this.load(e.CHILD_CONTAINER).append(gameLabelGenFunc(this.load(e.CONTROLLED_OBJECT)));
                        this.load(e.CHILD_CONTAINER).append(HTMLTemplates.linkLabel(e.TOP_LINK,linkLabelGenFunc(this.load(e.TOP_LINK))));
                        this.load(e.CHILD_CONTAINER).append(HTMLTemplates.linkLabel(e.BOTTOM_LINK,linkLabelGenFunc(this.load(e.BOTTOM_LINK))));
                    }
                    function getGameDisplayIndex(){
                        let index = this.elder['bracketContainer'].load(e.GAME_ORDER).indexOf(this.load(e.CONTROLLED_OBJECT))
                        this.save(e.GAME_ORDER,index);
                        return index
                    }
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
                                let ranking;
                                if(!link) return "No Link"
                                if(link.source instanceof Game){
                                    ranking = (link.sourceRank === 1) ? "W":"L"
                                }
                                if(link.source instanceof Phase){
                                    ranking = String(link.sourceRank);
                                }
                                return `${link.source.name} (${ranking})`
                            }
                        }
                        UIManagerObject.linkLabelGenerationFunctions.select(UIManagerObject.linkLabelGenerationFunctions.plain);

                    function resetLinkPosition(){
                        let incomingLinks = this.load(e.CONTROLLED_OBJECT)?.incomingLinks;
                        if(incomingLinks){
                            if(incomingLinks.length===0){
                                this.save(e.TOP_LINK,null)
                                this.save(e.BOTTOM_LINK,null)
                            }
                            if(incomingLinks.length===1){
                                this.save(e.TOP_LINK,null)
                                this.save(e.BOTTOM_LINK,incomingLinks[0])
                            }
                            if(incomingLinks.length===2){
                                this.save(e.TOP_LINK,incomingLinks[1])
                                this.save(e.BOTTOM_LINK,incomingLinks[0])
                            }
                        }
                    }
                    function assignLinkPosition(link){
                        if(!this.load(e.BOTTOM_LINK)){ 
                            this.save(e.BOTTOM_LINK,link);
                        } else if(!this.load(e.TOP_LINK)) {
                            this.save(e.TOP_LINK,link)
                        }       
                    }
                    EventTemplates.callLinkPopUp = ElementTemplate.eventObjMaker({
                        triggers:"click",
                        queryselection:"button",
                        func:function(){
                            KeyNodes.popUp.linkCreation.func.openPopUp();
                        }
                    })
                ElementTemplates.gameContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    htmlSmartInsert:{html:HTMLTemplates.labelledButton("Edit"),destination:"div.contentsDisplayArea"},
                    addEvents:[EventTemplates.gameSelection,EventTemplates.callLinkPopUp],
                    addFunctions:[[refreshGameDisplay,"refreshCosmetics"],resetLinkPosition,assignLinkPosition,getGameDisplayIndex],
                    addAsElder:"gameContainer",
                    addClasses:"gameContainer",
                    addDataStore:[
                        [e.TOP_LINK,null],
                        [e.BOTTOM_LINK,null],
                        [e.GAME_ORDER,null]
                    ],
                    addTemplates:[
                        [ElementTemplates.gameAdditionButton,{parentElement:"div.anteChildrenDisplayArea"}],
                    ],
                    onCompletionCode:function(mainDiv,options){
                        this.load(e.CHILD_CONTAINER).append(this.load(e.CONTROLLED_OBJECT).name); //testing
                        this.func.resetLinkPosition();
                    }
                });
                ElementTemplates.blockContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    addFunctions:[[()=>false,"refreshCosmetics"]],
                    addAsElder:"blockContainer",
                    addClasses:"blockContainer",
                    addTemplates:[
                        [ElementTemplates.blockAdditionButton,{parentElement:"div.anteChildrenDisplayArea"}],
                        [ElementTemplates.gameAdditionButton,{parentElement:"div.contentsDisplayArea"}]],
                    onCompletionCode:function(mainDiv,options){
                        mainDiv.append(this.load(e.CONTROLLED_OBJECT).name);
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
                    ],
                    addEvents:[EventTemplates.saveFormOnInputChange,EventTemplates.editPhasePopUp],
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
                                harvest:Harvest.displayLabelSymbolConversion({[e.ROUND_ROBIN]:"Round Robin",[e.TOURNAMENT]:"Tournament"}),
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
                        oLog.pform = this;
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
                    addClasses:"phaseContainer"
                });
                function refreshBracketCosmetics(){
                    const competitionNameLabel$ = this.querySelector("div.anteChildrenDisplayArea span");
                    competitionNameLabel$.textContent=this.load(e.CONTROLLED_OBJECT).name;

                    const selectedGameDisplay$ = bracketSectionMenuContainer$.querySelector("span[data-display='selectedGame']");
                    const selectedGame = this.load(e.SELECTED);
                    if(selectedGame){
                        selectedGameDisplay$.textContent = `Selected: ${selectedGame.name}`;
                    } else {
                        selectedGameDisplay$.textContent = `No Game Selected`;
                    }
                }
                function selectGame(selectedGame){
                    this.save(e.SELECTED,selectedGame);
                    this.func.refreshCosmetics();
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
                ElementTemplates.bracketContainer = new ElementTemplate({
                    mainElement:ElementTemplates.baseUnitContainer,
                    addFunctions:[[refreshBracketCosmetics,"refreshCosmetics"],selectGame,updateAllGameOrder],
                    htmlSmartInsert:{html:parseHTML(`Creating Bracket For: <span> </span>`),destination:"div.anteChildrenDisplayArea"},
                    addDataStore:[
                        [e.SELECTED,null],
                        [e.GAME_ORDER,Array]
                    ],
                    addAsElder:"bracketContainer",
                    addClasses:"bracketContainer",
                    onCompletionCode: function(mainDiv,options){
                        this.func.refreshCosmetics();
                        CodeObserver.addHandler(this.load(e.CONTROLLED_OBJECT),(observer,{keyword,currentObject})=>{
                            if(keyword!==e.EDIT) return;
                            mainDiv.func.refreshCosmetics();
                        })
                    }
                });

                linkCreationPopUp:{
                        function selectLinkSource(winner,linkSource){
                            if(winner){
                                console.log("Chosen Link",linkSource.name,1)
                            } else {
                                console.log("Chosen Link",linkSource.name,2)
                            }
                        }
                        function primaryMasterSelectAction(htmlElem,ev){
                            const selected = UniqueSelection.toggle(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["primarySelection"]);
                            if(selected) htmlElem.elder['entry'].func.selectLinkSource(true,htmlElem.elder['entry'].load(e.CONTROLLED_OBJECT))
                        }
                        function secondaryMasterSelectAction(htmlElem,ev){
                            const selected = UniqueSelection.toggle(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["secondarySelection"]);
                            if(selected) htmlElem.elder['entry'].func.selectLinkSource(false,htmlElem.elder['entry'].load(e.CONTROLLED_OBJECT));
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
                            if(controlledObject instanceof Team || controlledObject instanceof Division || controlledObject instanceof Phase || controlledObject instanceof Block){
                                objectLabel$.prepend(controlledObject.name);
                            } else if (controlledObject instanceof Game){
                                let gameOrder = FacadeMap.getHtml(controlledObject).func.getGameDisplayIndex()+1;
                                objectLabel$.prepend(`Game ${gameOrder}`)
                            } 
                                ExclusiveLongClickTimer( mainLi,masterFunctionSet)
                                mainLi.addEventListener("pointerup",(ev)=>{
                                    if(ev.button!==2) return;
                                    secondaryMasterSelectAction(objectLabel$,ev);
                                })
        
                        }
                    });
                        function addGameNavigationEntry(newEntryObject,newEntryLocation$){
                            console.log("added")
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
                    ElementTemplates.gameNavigationPanel = new ElementTemplate({
                        mainElement:ElementTemplates.genericNavigationPanel,
                        htmlInsert: HTMLTemplates.gameNavigationPanel,
                        addFunctions:[[getGameSectionParameters,"getSectionParameters"]],
                        onCompletionCode: function(mainDiv,options){
                            this.save(e.NAVIGATION_SECTION_TEMPLATE,ElementTemplates.gameNavigationSection)
                            
                        }

                    })
                    ElementTemplates.linkCreationPopUp = new ElementTemplate({
                        mainElement:ElementTemplates.popUpBase,
                        addTemplates:[
                            [ElementTemplates.gameNavigationPanel,{
                                templateOptions:{identity:e.MASTER,useAsMainDiv:document.createElement("nav")},
                                parentElement:"section.popUpContentContainer"}],
                            [ElementTemplates.gameNavigationPanel,{
                                    templateOptions:{identity:e.MASTER,useAsMainDiv:document.createElement("nav")},
                                    parentElement:"section.popUpContentContainer"}],
                        ]

                    })
                    
                    KeyNodes.popUp.linkCreation = ElementTemplates.linkCreationPopUp.build(null)
                }
            
            }
            setUp:{
                function unitCreationHtmlHandler(observer,observation){
                    const {mark,newObject} = observation;
                    if(observer!==CodeObserver.Creation) return false;
                    if(mark===Link){
                        let targetHtml = FacadeMap.getHtml(newObject.target);
                        targetHtml.func.assignLinkPosition(newObject);
                        targetHtml.func.refreshCosmetics(); 
                        return true; 
                    }
                    const {html,parentHtml} = FacadeMap.createHtmlWrapper(newObject);
                    return true;
                }
                function unitCreationAppendingHandler(observer,observation){
                    const {mark,newObject} = observation;
                    if(observer!==CodeObserver.Creation) return false;
                    if(mark===Link) return false //code to update relavent game here later. 
                    const unitHtml = FacadeMap.getHtml(newObject);
                    if(!unitHtml.root){
                        bracketSection$.append(unitHtml);
                    } else{
                        unitHtml.root.func.addChild(newObject);
                        unitHtml.root.func.refreshChildOrder();
                    }
                    if(newObject instanceof Game){
                        unitHtml.elder['bracketContainer'].func.updateAllGameOrder();
                        unitHtml.elder['bracketContainer'].func.requestChildrenRefreshCosmetics();
                        
                    }
                }
                CodeObserver.addToHandlerGroup(e.CREATE,[unitCreationHtmlHandler],false);
                CodeObserver.addToHandlerGroup(e.CREATE,[unitCreationAppendingHandler],true);
                // CodeObserver.addToHandlerGroup(e.CREATE,[(o,obs)=>console.log(obs.mark.name,"async")],true);
                // CodeObserver.addToHandlerGroup(e.CREATE,[(o,obs)=>console.log(obs.mark.name)],false);
            } 
        }
    }


    return UIManagerObject;
})()
