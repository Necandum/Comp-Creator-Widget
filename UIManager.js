var UIManager = (function () {

    let UniqueSelection = (function () {
        let registry = new Map();
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
            this.addMember = (groupName, newMember, alias) => {
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, newMember, registry });
                if (alias) {
                    group.aliasRegistry.set(alias, newMember);
                }
                group.forEach(classSet=>classSet.add(newMember));
                return true
            }
            this.addFamily = (groupName,familyArray,alias) =>{
                if(!alias) Break("Must use alias to add family",{args:arguments});
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, newMember, registry });
                group.aliasRegistry.set(alias,familyArray);
                group.forEach(classSet=>classSet.add(familyArray));
                return true
            }
            this.select = (groupName, selectedMember, addToSelection = false, useClasses=[e.DEFAULT]) => {
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                useClasses = new Set(useClasses);
                if(useClasses.delete(e.DEFAULT)) useClasses.add(defaultClass);
                if (addToSelection === false) {
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
        controlObject.addGroup("competitorsSection")

        return controlObject
    })();

    UIManagerObject = {};

    const configurationMenu$ = getE("#configurationMenu");
    const configurationSectionContainer$ = getE("#configurationSectionContainer");
    const displayArea$ = getE('#displayArea');
    const playerForm$ = getE("#competitorPlayerTab form");
    const playerNav$ = getE("#competitorPlayerTab nav")

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

    const HTMLTemplates = {};
    const EventTemplates = {};
    const ElementTemplates = {};
    const Harvest = {//if insert data is included, its sown instead of harvesting
        standardTextInput(inputContainer,{insertValue=undefined,reset=false}={}) {
            let inputElement = inputContainer.firstElementChild.firstElementChild;
            if(reset === true) insertValue = "";
            return (insertValue===undefined) ? stringNormalisation(inputElement.value): inputElement.value=insertValue;
        },
    };
    const Verify = {
        notBlank(value) {
            return /\S/.test(value);
        }
    };
    const MakeEvent = {
        get verify() {
            return new CustomEvent("verify", { bubbles: true })
        },
    }

    objectControl: {
        HTMLTemplates.objectControllerFormControls = function (mainForm$) {
            let html = parseHTML(`
            <div class="formButtonContainer">
                                    <div data-form-mode="edit">
                                        <button type="button" data-form-button="save">Save Edits</button>
                                        <button type="button" data-form-button="reset">Reset</button>
                                    </div>
                                    <div data-form-mode="create">
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
            UniqueSelection.addGroup(containerDiv$);
            UniqueSelection.addFamily(containerDiv$, [editDiv$,editHeading$], e.EDIT);
            UniqueSelection.addFamily(containerDiv$, [createDiv$,createHeading$], e.CREATE);
            return containerDiv$;
        }
        //Switch Mode
        function switchMode(newMode, controlledObject) { //this = mainForm
            UniqueSelection.select(this.querySelector("div.formButtonContainer"), newMode);
            this.save(e.MODE, newMode);
            if (newMode === e.EDIT) this.save(e.CONTROLLED_OBJECT, controlledObject)
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
                harvestFunc(inputContainer,{insertValue:controlledObject[inputContainer.dataset.objectField]});
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
            console.log(newData,controlledObject)
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
            let newObject;
            try{
                newObject = new constructorFunction(harvestedData);}
            catch(err){
                newObject = null;
            }
            return newObject;
        }

        EventTemplates.initiateCreation = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-form-button='create']",
            func:(ev)=>{
                ev.target.root.func.objectCreation();
            }
        });
        EventTemplates.cleanSlate = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-form-button='cancel']",
            func:(ev)=>{
                ev.target.root.func.resetFields();
            }
        });
        
        //when build, use form element as main div
        ElementTemplates.objectController = new ElementTemplate({
            htmlInsert: HTMLTemplates.objectControllerFormControls,
            addFunctions: [switchMode,verifyAll, harvestData, objectCreation,importObject,populateValues,resetFields,updateControlledObject],
            addDataStore: [
            [e.MODE, e.CREATE],
            [e.CONTROLLED_OBJECT_CONSTRUCTOR, "defined at build"],
            [e.CONTROLLED_OBJECT, null],
            [e.VERIFICATION, "defined at build"],
            [e.VERIFICATION_FAILED, new Set()],
            [e.HARVEST_FUNCTIONS, "defined at build"],
            [e.HARVESTED_DATA, null]
            ],
            addEvents: [EventTemplates.inputVerification, EventTemplates.initiateCreation,EventTemplates.cleanSlate,EventTemplates.populateControlledObjectValues,EventTemplates.updateControlledObject],
            addAsElder: "form",
            onCreationCode: function (mainForm, options) {
                let { verificationFunctions, dataHarvestFunctions } = options;
                mainForm.save(e.CONTROLLED_OBJECT_CONSTRUCTOR, stringToObject(mainForm.dataset.controlledObjectConstructor)); 
                mainForm.save(e.VERIFICATION, verificationFunctions); //verification functions is a map, matching field names with functions to verify input. Verification also involves normalisation. 
                mainForm.save(e.HARVEST_FUNCTIONS, dataHarvestFunctions); //for each container, function to harvest the data. Map matching objectField to function. 
                mainForm.func.switchMode(e.CREATE);
            }
        });

        //executable set-up
        oLog.formTest=ElementTemplates.objectController.build(null, {
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
    }

    navigationPanels:{
        HTMLTemplates.navigationPanel = function(mainDiv){
            let html = parseHTML(`
                                    <div class="navigationPanelButtons">
                                        <button type="button" data-display-all='Division' >All Divisions</button>
                                        <button type="button" data-display-all='Team'>All Teams</button>
                                        <button type="button" data-display-all='Player'>All Players</button>
                                    </div>

                                    <div class="navigationCurrentLocation">

                                    </div>

                                    <div class="navigationStackDisplay">
                                        
                                    </div>

                                    <div class="navigationPanelDisplay">

                                    </div>
                                </div>
            `);
            let navMaster$ = html.querySelector("div.navigationPanelButtons");
            let buttons$ = navMaster$.querySelectorAll("button");
            UniqueSelection.addGroup(navMaster$);
            buttons$.forEach((button)=>UniqueSelection.addMember(navMaster$,button));
            buttons$.forEach((button)=>button.addEventListener("click",(ev)=>{
                button.elder["panel"].func.openObject(stringToObject(button.dataset.displayAll),0);
            }));
            return html;
        }
        HTMLTemplates.controlPanel = function(mainDiv){
            let html = parseHTML(`
                Control Button Here
            `);
            return html;
        }
        HTMLTemplates.navigationSection = function(mainDiv){
            let html = parseHTML(`
                <div class='navigationSubHeading'></div>
                <ul>
                </ul>
            `);
            return html
        }
        
       
        ElementTemplates.navigationLink = new ElementTemplate({
            addClasses:"navigationLink",
            htmlInsert:parseHTML("<span> > </span>"),
            onCreationCode: function(mainDiv,options){
                const {stackMember,stackIndex}= options;
                this.prepend(`${stackMember.name} [${stackMember.constructor.name}]`)  
                this.addEventListener("click",(ev)=>this.elder['panel'].func.openObject(stackMember,stackIndex));
            }
        });
        HTMLTemplates.navigationEntry = function(mainDiv){
            let html = parseHTML(`
                <button type='button' data-button-function='explore'> O </button>
                <span></span>
                <button type='button' data-button-function='edit'> E </button>
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
            UniqueSelection.select(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["primarySelection"]);
            htmlElem.elder['entry'].func.sendObjTo(e.LEFT_SLAVE);
        }
        function secondaryMasterSelectAction(htmlElem,ev){
            UniqueSelection.select(htmlElem.elder["panel"],htmlElem.elder['entry'],false,["secondarySelection"]);
            htmlElem.elder['entry'].func.sendObjTo(e.RIGHT_SLAVE);
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
            triggers:"click",
            queryselection:"button[data-button-function='explore']",
            func:(ev)=>{
                let exploreButton = ev.target;
                let controlledObject = exploreButton.elder['entry'].load(e.CONTROLLED_OBJECT);
                exploreButton.elder['panel'].func.openObject(controlledObject);
            }
        });
        ElementTemplates.navigationEntry = new ElementTemplate({
            htmlInsert:HTMLTemplates.navigationEntry,
            addClasses:"navigationEntry",
            addAsElder:"entry",
            addEvents:[EventTemplates.exploreObject],
            addDataStore:[e.CONTROLLED_OBJECT,null],
            addFunctions:[sendObjTo],
            onCreationCode:function(mainDiv,options){
                let controlledObject = options.newEntryObject;
                let objectLabel$=this.querySelector('span');
                this.save(e.CONTROLLED_OBJECT,controlledObject);
                objectLabel$.append(controlledObject.name);

                let panelIdentity = this.elder["panel"].load(e.IDENTITY);

                
                objectLabel$.addEventListener("contextmenu",(ev)=>ev.preventDefault());
                if(panelIdentity===e.MASTER){
                    ExclusiveLongClickTimer( objectLabel$,masterFunctionSet)
                    objectLabel$.addEventListener("pointerup",(ev)=>{
                        if(ev.button!==2) return;
                        secondaryMasterSelectAction(objectLabel$,ev);
                    })
                } else {
                    ExclusiveLongClickTimer( objectLabel$,slaveFunctionSet);
                    objectLabel$.addEventListener("pointerup",(ev)=>{
                        if(ev.button!==2) return;
                        secondarySlaveSelectAction( objectLabel$,ev);
                    })
                }

            }
        });
        function addNavigationEntry(newEntryObject,newEntryLocation$){
            let newLi$= document.createElement("li");
            newEntryLocation$.append(ElementTemplates.navigationEntry.build(this,{useAsMainDiv:newLi$,newEntryObject}))
            UniqueSelection.addMember(this.elder["panel"],newLi$);
        }
        ElementTemplates.navigationSection = new ElementTemplate({
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
                let entryList$=mainDiv.querySelector("ul");

                let currentObject = this.elder["panel"].load(e.CURRENTLY_OPEN);
                let entryArray = funcToObtainArray(currentObject[propertyName]);

                if(subHeading && entryArray.length>0){
                    subHeadingDiv$.append(subHeading);
                } else {
                    subHeadingDiv$.remove();
                }
                for(const newEntryObject of entryArray){
                    this.func.addNavigationEntry(newEntryObject,entryList$);
                }

            }
        });
        function moveObjects(originPanel,destinationPanel,objectArray=[],deleteOld){
            if(objectArray.length===0) return false; 
            let stableConstructor
        }
        ElementTemplates.navigationControlPanel = new ElementTemplate({
            htmlInsert:HTMLTemplates.controlPanel,
            addClasses:"navigationControlPanel",
        });
        
        function openObject(object,trimStackToLength=false){
            if(trimStackToLength!==false) this.func.trimStack(trimStackToLength);
            this.save(e.CURRENTLY_OPEN,object);
            this.save(e.SECTION_PARAMETERNS,getSectionParameters(object,this.load(e.IDENTITY)));
            this.load(e.STACK).push(object);
            this.func.refreshAppearance();
        }
        function refreshAppearance(){
            this.func.wipeDisplays();
            let displayPanel$ = this.querySelector("div.navigationPanelDisplay");
            let stackDisplay$= this.querySelector("div.navigationStackDisplay");
            let currentLocationDisplay$= this.querySelector("div.navigationCurrentLocation");
            //Entries
            let sectionParameters = this.load(e.SECTION_PARAMETERNS);
            for(const individualSectionParameters of sectionParameters){
                displayPanel$.append(ElementTemplates.navigationSection.build(this,{individualSectionParameters}))
            }
            //Name
            let currentObject = this.load(e.CURRENTLY_OPEN)
            let appendText =(currentObject.constructor===Function) ? `All ${currentObject.name}s`:`${currentObject.name} [${currentObject.constructor.name}]`;
            currentLocationDisplay$.append(appendText)
            //Stack
            let stack = this.load(e.STACK);
            for(let i=0;i<stack.length;i++){
                const stackMember = stack[i];
                if(stackMember.constructor===Function)   continue;
                stackDisplay$.append(ElementTemplates.navigationLink.build(this,{stackMember,stackIndex:i}))
            }
            stackDisplay$.lastChild?.querySelector("span")?.remove();
            if(stackDisplay$.children.length===1) stackDisplay$.replaceChildren();
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
        
        function getSectionParameters(object,panelIdentity){
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
                    funcToObtainArray: playersMap=>Array.from(playersMap.keys())}]

                    if(panelIdentity===e.MASTER) sectionParameters.push({
                        subHeading:"In Divisions",
                        propertyName:"divisions",
                        funcToObtainArray: divisionSet=>Array.from(divisionSet)});
                   
            } else if (object instanceof Division ){
                sectionParameters =[
                    {subHeading:"Sub-Divisions",
                    propertyName:"subDivisions",
                    funcToObtainArray: subDivisionsSet=>Array.from(subDivisionsSet)},
                    {subHeading:"Teams",
                    propertyName:"teams",
                    funcToObtainArray: teamsSet=>Array.from(teamsSet)}];

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

        ElementTemplates.navigationPanel = new ElementTemplate({
            htmlInsert:HTMLTemplates.navigationPanel,
            addClasses:"navigationPanel",
            addAsElder:"panel",
            addFunctions:[openObject,trimStack,wipeDisplays,refreshAppearance],
            addDataStore:[
                [e.STACK,[]],
                [e.CURRENTLY_OPEN,null],
                [e.SECTION_PARAMETERNS,new Set()],
                [e.IDENTITY,null],
                [e.MULTY_SELECT_START,null]
            ],
            onCreationCode:function(mainDiv,options){
                let {identity} = options;
                this.save(e.IDENTITY,identity);
                this.elder['navigator'].save(identity,this);
            }

        });
        ElementTemplates.navigationSlaveContainer = new ElementTemplate({
            addClasses:"navigationSlaveContainer",
            addTemplates:[[ElementTemplates.navigationPanel,{identity:e.LEFT_SLAVE}],
                           ElementTemplates.navigationControlPanel,
                          [ElementTemplates.navigationPanel,{identity:e.RIGHT_SLAVE}]]
        });
        
        ElementTemplates.navigationContainer = new ElementTemplate({
            addClasses:"navigationContainer",
            addAsElder:"navigator",
            addTemplates:[[ElementTemplates.navigationPanel,{identity:e.MASTER}],ElementTemplates.navigationSlaveContainer],
            addDataStore:[
                [e.MODE,e.DISPLAY_ALL],
                [e.MASTER,null],
                [e.LEFT_SLAVE,null],
                [e.RIGHT_SLAVE,null]
            ],
            onCreationCode:function(mainDiv,options){

            },
            onCompletionCode:function(mainDiv,options){

            }
        });

        playerNav$.append(ElementTemplates.navigationContainer.build())
    }
    competitorsSection: {
        // EventTemplates.
    }

    configurationSections: {
        //Set-up selection links
        for (let i = 0; i < configurationMenu$.children.length; i++) {
            let menuLink = configurationMenu$.children[i];
            let section = configurationSectionContainer$.children[i];
            UniqueSelection.addMember("configurationMenu", menuLink);
            UniqueSelection.addMember("configurationSection", section);

            configurationMenu$.children[i].addEventListener("click", (ev) => {
                UniqueSelection.select("configurationMenu", menuLink);
                UniqueSelection.select("configurationSection", section);
            })
        }
    }




    return UIManagerObject;
})()
