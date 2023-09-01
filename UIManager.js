var UIManager = (function () {
    let UniqueSelection = (function () {

        let registry = new Map();
        let selectionClass = "toggleSelection"

        function UniqueSelection() {
            this.addGroup = (newGroupName) => {
                if (!registry.has(newGroupName)) {
                    let newEntry = new Set();
                    newEntry.aliasRegistry = new Map();
                    registry.set(newGroupName, newEntry);
                }
            }
            this.addMember = (groupName, newMember, alias) => {
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, newMember, registry });
                if (alias) {
                    group.aliasRegistry.set(alias, newMember);
                }
                return group.add(newMember);
            }
            this.addFamily = (groupName,familyArray,alias) =>{
                if(!alias) Break("Must use alias to add family",{args:arguments});
                let group = registry.get(groupName) ?? Break("Cannot add to non-existant group", { groupName, newMember, registry });
                group.aliasRegistry.set(alias,familyArray)
                return group.add(familyArray);
            }
            this.select = (groupName, selectedMember, addToSelection = false) => {
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                if (addToSelection === false) {
                    for (const member of group) {
                        if(Array.isArray(member)){
                            member.forEach(x=>x.classList.remove(selectionClass));
                        } else {
                        member.classList.remove(selectionClass);
                        }
                    }
                }
                if (group.aliasRegistry.has(selectedMember)) {
                    selectedMember = group.aliasRegistry.get(selectedMember);
                }
                if (group.has(selectedMember)) {
                    if(Array.isArray(selectedMember)){
                        selectedMember.forEach(x=>x.classList.add(selectionClass));
                    } else {
                    selectedMember.classList.add(selectionClass);
                    }
                }
            }
            this.selectN = (groupName, N, addToSelection = false) => {
                let group = registry.get(groupName) ?? Break("Cannot select member in non-existant group", { groupName, selectedMember, registry });
                let i = 1;
                for (const member in group) {
                    if (i === N) {
                        this.select(groupName, member, addToSelection);
                        break;
                    }
                    i++;
                }
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
            default:
                Break("Cannot recognise string", { string })
        }
    }
    function stringNormalisation(anything) {
        return String(anything).trim().normalize();
    }

    const HTMLTemplates = {
        objectControllerFormControls: function (mainForm$) {
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
            console.log(createHeading$,editHeading$)
            return containerDiv$;
        },
    };
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
            this.func.harvestData();
            let harvestedData = this.load(e.HARVESTED_DATA)
            if (!harvestedData) {
                Alert("No data has been harvested", { harvestedData, ev, mainForm: this });
                return;
            }
            let constructorFunction = this.load(e.CONTROLLED_OBJECT_CONSTRUCTOR);
            let newObject;
            try{
                newObject = new constructorFunction(harvestedData);}
            catch(err){
                newObject = null
            }
            return newObject;
        }

        EventTemplates.initiateCreation = ElementTemplate.eventObjMaker({
            triggers:"click",
            queryselection:"button[data-form-button='create']",
            func:(ev)=>{
                console.log(ev.target.root.func.objectCreation());
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
            addDataStore: [[e.MODE, e.CREATE],
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
                mainForm.save(e.CONTROLLED_OBJECT_CONSTRUCTOR, stringToObject(mainForm.dataset.controlledObject)); 
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
