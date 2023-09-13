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
                group.aliasRegistry.set(alias,familyArray);
                group.forEach(classSet=>classSet.add(familyArray));
                return true
            }
            this.expandFamily = (groupName,familyAlias,newMembers)=>{
                if(!familyAlias) Break("Must use alias to add to family",{args:arguments});
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, familyAlias, registry });
                let familyArray = group.aliasRegistry.get(familyAlias);
                if(!Array.isArray(newMembers)) newMembers=[newMembers];
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
            this.wipeClasses=(groupName,useClasses)=>{
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

    const HTMLTemplates = {};
    const EventTemplates = {};
    const ElementTemplates = {};
    const Harvest = {//if insert data is included, its sown instead of harvesting
        standardTextInput(inputContainer,{insertValue,reset=false}={}) {
            let inputElement = inputContainer.firstElementChild.firstElementChild;
            if(reset === true) insertValue = "";
            if(insertValue!== undefined){
                inputElement.value= insertValue ?? ""
            }
            return  stringNormalisation(inputElement.value);
        },
    };
    const Verify = {
        notBlank(value) {
            return /\S/.test(value);
        }
    };
    const Retreive = {
        directProperty(controlledObject,property){
            return controlledObject[property]
        },
        deepProperty(propertyLadder=[]){
            function inner(controlledObject,property){
                let currentLocation = controlledObject;
                for(intermediateProperty of propertyLadder){
                    currentLocation = currentLocation[intermediateProperty]
                }
                currentLocation = currentLocation[property];
                return currentLocation
            }
            return inner;
        }
    }
    const MakeEvent = {
        get verify() {
            return new CustomEvent("verify", { bubbles: true })
        },
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
                <menu class='popUpWindox'>
                <section class='popUpContentContainer'>
                Hello
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
                console.log(importedObj)
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
                onCreationCode: function (mainForm, options) {
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

            ElementTemplates.navigationEntry = new ElementTemplate({
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
                    objectLabel$.prepend(controlledObject.name);

                    let panelIdentity = this.elder["panel"].load(e.IDENTITY);

                    
                    mainLi.addEventListener("contextmenu",(ev)=>ev.preventDefault());
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
                UniqueSelection.addGroup(navMaster$);
                buttons$.forEach((button)=>UniqueSelection.addMember(navMaster$,button));
                buttons$.forEach((button)=>button.addEventListener("click",(ev)=>{
                    button.elder["panel"].func.openObject(stringToObject(button.dataset.displayAll),0);
                }));
                return html;
            }
            function openObject(object,trimStackToLength=false){
                if(trimStackToLength!==false) this.func.trimStack(trimStackToLength);
                this.save(e.CURRENTLY_OPEN,object);
                this.save(e.SECTION_PARAMETERNS,getSectionParameters(object,this.load(e.IDENTITY)));
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
                    displayPanel$.append(ElementTemplates.navigationSection.build(this,{individualSectionParameters}))
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
                this.elder['navigator'].func.sendStackToForms();
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
            ElementTemplates.navigationPanel = new ElementTemplate({
                htmlInsert:HTMLTemplates.navigationPanel,
                addClasses:"navigationPanel",
                addAsElder:"panel",
                addFunctions:[openObject,trimStack,wipeDisplays,getSelected,refreshAppearance,deleteObjects],
                addDataStore:[
                    [e.STACK,Array],
                    [e.CURRENTLY_OPEN,null],
                    [e.SECTION_PARAMETERNS,Set],
                    [e.IDENTITY,null],
                    [e.MULTY_SELECT_START,null]
                ],
                onCreationCode:function(mainDiv,options){
                    let {identity} = options;
                    this.save(e.IDENTITY,identity);
                    this.dataset.identity=identity.description;
                    this.elder['navigator'].save(identity,this);
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
                phaseEditor:{
                    function harvest({insertValue,reset=false}={}){
                        return this.load(e.HARVEST)(this,{insertValue,reset});
                    }
                    function retrieve(){
                        return this.load(e.RETRIEVE)(this.elder['form'].load(e.CONTROLLED_OBJECT),this.load(e.OBJECT_FIELD))
                    }
                    function verify(){
                        let value = this.func.harvest();
                        return this.load(e.VERIFICATION)(value);
                    }
                    ElementTemplates.inputContainer = new ElementTemplate({
                        addAsElder:"inputContainer",
                        addClasses:"inputContainer",
                        addDataStore:[
                            [e.VERIFICATION,"assigned at runtime"],
                            [e.HARVEST,"assigned at runtime"],
                            [e.RETRIEVE,"assigned at runtime"],
                            [e.OBJECT_FIELD,"assigned at runtime"],
                        ],
                        onCreationCode:function(mainDiv,options){
                            const {objectField,
                            verify,
                            harvest,
                            retrieve,
                            htmlContents}=options;
                            this.save(e.OBJECT_FIELD,objectField);
                            this.save(e.HARVEST,harvest);
                            this.save(e.VERIFICATION,verify);
                            this.save(e.RETRIEVE,retrieve);

                            this.init.htmlInsert(htmlContents);
                            this.dataset.objectField = objectField;

                            this.elder['form'].load(e.INPUT_CONTAINER_LIST).add(this);
                        }
                    });

                    function harvestData(){

                    }
                    ElementTemplates.genericForm = new ElementTemplate({
                        mainElement:"form",
                        htmlInsert:function(mainForm,options){
                            let html = parseHTML(`
                                <section class='formFields'>
                                Section
                                </section>
                                <section class='formControls'>
                                Controls
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
                            },
                            onCompletionCode:function(mainForm,options){
                                const{inputContainerList} = options;
                                for(const inputContainerOptions of inputContainerList)
                                this.init.addTemplates([[ElementTemplates.inputContainer,{templateOptions:inputContainerOptions,parentElement:"section.formFields"}]])
                            }

                    })
                }

        }
        setUp:{
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
            }).func.importObject(Competition.current);
            updateCompetitionNameForm$.querySelector("button").addEventListener("click",(ev)=>updateCompetitionNameForm$.func.updateControlledObject());

            //testing
            let testpop=ElementTemplates.popUpBase.build(null)
            testpop.init.addTemplates([[ElementTemplates.popUpButtons,{prepend:false,parentElement:"menu"}]]);
            testpop.init.addTemplates([[ElementTemplates.genericForm,{parentElement:"section",templateOptions:{
                controlledObjectConstructor:Phase,
                inputContainerList:[
                    {objectField:"Hello",
                    htmlContents:parseHTML("<div> yay </div>"),
                    verify:()=>console.log("verify"),
                    retrieve:()=>console.log("retrieve"),
                    harvest:()=>console.log("harvest")}
                ]
            }}]]);
            document.body.append(testpop)
            testpop.func.openPopUp()

            bracketSectionMenuContainer$.querySelector("button[data-button-function='createPhase']").addEventListener("click",()=>testpop.func.openPopUp())
            
        }
    }


    return UIManagerObject;
})()
