var comp = new Competition("Shark Attack");
CodeObserver.register(Game);
CodeObserver.register(Phase);
CodeObserver.register(Team);

var TableGenerator = (function TableGeneratorBuilder(comp) {
    let HtmlTemplates = {};
    let EventTemplates = {};
    let TableGenerator = { HtmlTemplates, EventTemplates }

    TableGenerator.playerTable = {};

    HtmlTemplates.input = (() => {
        let frag = new DocumentFragment();
        frag.append(document.createElement("input"));
        return frag
    })();

    EventTemplates.newTeam = ElementTemplate.eventObjMaker({
        triggers: ["focusout"],
        func: function newTeamCallBk(ev) {
            if (ev.target.root.classList.contains("teamInput")) {
                let teamName = ev.target.value;
                if (!this.data.get(this)?.has('team')) {
                    let newTeam = new Team(teamName);
                    this.save({ element: this, dataArr: [{ key: "team", value: newTeam }] })
                } else {
                    this.data.get(this).get('team').changeDetail(e.NAME, teamName)
                }
            }
            if (ev.target.root.classList.contains("playerInput")) { //note: if players are created before team, they won't be attached to that team when it is made
                let playerName = ev.target.value;
                let jerseyNumber = Array.from(this.children).indexOf(ev.target.root);
                if (!this.data.get(this).has(ev.target.root)) {
                    let newPlayer = new Player({ firstName: playerName });
                    let team = this.data.get(this).get("team");
                    this.save({ element: this, dataArr: [{ key: ev.target.root, value: newPlayer }] })
                    if (team) team.addPlayer(newPlayer, jerseyNumber);
                } else {
                    let player = this.data.get(this).get(ev.target.root);
                    player.changeDetail(e.FIRST_NAME, playerName);
                }
            }
        }
    });

    EventTemplates.newMe = ElementTemplate.eventObjMaker({
        triggers: ['focusin'],
        func: function newMe(e) {   //placed on cells
            let root, template;
            if (this.classList.contains("playerInput")) {
                root = this.elder["row"];
                template = this.template
            } else {
                root = this.elder["row"].root;
                template = this.elder["row"].template;
            }
            root.append(template.build(root));
        },
        self: true,
        options: { once: true },
    });

    TableGenerator.playerTable.init = function () {
        TableGenerator.playerTable.teamInputTemplate = new ElementTemplate({
            htmlInsert: [document.createTextNode("Team: "), HtmlTemplates.input],
            addClasses: ["cell", "teamInput"],
            label: "teamInput",
            addEvents: [EventTemplates.newMe]
        });

        TableGenerator.playerTable.playerInputTemplate = new ElementTemplate({
            label: "playerInput",
            htmlInsert: ["Player: ", HtmlTemplates.input],
            addClasses: ["subRow", "playerInput"],
            addEvents: [EventTemplates.newMe]
        });

        TableGenerator.playerTable.rowTemplate = new ElementTemplate({
            addClasses: ["row"],
            label: "row",
            addAsElder: "row",
            addEvents: [EventTemplates.newTeam],
            addTemplates: [this.teamInputTemplate, this.playerInputTemplate]
        });

        TableGenerator.playerTable.tableTemplate = new ElementTemplate({
            addClasses: ["table"],
            label: "main player table",
            addTemplates: []
        });
        delete this.init;
    }
    TableGenerator.playerTable.init();

    //Phase Constructor - first row of bracketTable
    //HTML 
    HtmlTemplates.phaseCreator = parseHTML(`
    <select>
        <option selected data-phase-type='roundRobin'> Round Robin </option>
        <option data-phase-type='tournament'> Tournament </option>
    </select>
    <input type='number' class='numericalInput' data-phase-priority value=1>
    <input type='text' data-phase-name value='New Phase'>
    <button type='button'> Create Phase </button>
    `);
    //Events
    EventTemplates.createNewPhase = ElementTemplate.eventObjMaker({
        triggers:['click'], //attached to button
        queryselection:"button",
        func:(ev) =>{
            let mainDiv = ev.target.root;
            let phaseTypeString = mainDiv.querySelector("select").selectedOptions[0].dataset.phaseType;
            let phaseType = (phaseTypeString==="tournament") ? e.TOURNAMENT: e.ROUND_ROBIN;
            let priorityNumber = parseInt(mainDiv.querySelector("[data-phase-priority]").value);
            let phaseName = mainDiv.querySelector("[data-phase-name]").value;
            let bracketTable = ev.target.elder['table']
            let phase = comp.newPhase(phaseName,phaseType);
            phase.changeSetting(e.PRIORITY,priorityNumber);
            let newPhaseElement = TableGenerator.bracketTable.phaseTemplate.build(bracketTable,{creationCodeArg:phase});
            bracketTable.append(newPhaseElement);
        }
    })
    TableGenerator.phaseConstructor={};
    //Templates
    TableGenerator.phaseConstructor.init = function (){
        this.controlPanel = new ElementTemplate({
            label:"Control Panel to Create Phases",
            htmlInsert:HtmlTemplates.phaseCreator,
            addClasses:['row'],
            addEvents:[EventTemplates.createNewPhase]
        })
        delete this.init;
    }
    TableGenerator.phaseConstructor.init()
    TableGenerator.bracketTable = {};

    //HTML
    HtmlTemplates.addButton = (() => {
        let frag = new DocumentFragment();
        let div = document.createElement("div");
        let button = document.createElement("button");
        button.classList.add('orderLast');
        button.textContent = "+"
        frag.append(button);
        return frag
    })();

    HtmlTemplates.linkCreation = function () {
        let frag = new DocumentFragment();
        let sourceTypeSelect = document.createElement('select');
        ["Game", "Team", "Phase"].forEach((text) => {
            let option = document.createElement('option');
            option.append(text); option.dataset.sourceType = text;
            sourceTypeSelect.append(option)
        });
        sourceTypeSelect.classList.add("sourceTypeSelect")
        let sourceSelect = document.createElement('select');
        sourceSelect.classList.add('sourceSelect');
        let defaultOption = document.createElement('option');
        defaultOption.append(" Please Select Source ");
        sourceSelect.append(defaultOption);
        defaultOption.selected = true;

        defaultOption.disabled = 'disabled';

        let sourceRankInput = document.createElement('input');
        sourceRankInput.classList.add("numericalInput", "short", 'sourceRankInput')
        sourceRankInput.type = 'number'; sourceRankInput.min = 1; sourceRankInput.value = 1;
        frag.append(sourceSelect, sourceTypeSelect, sourceRankInput);
        return frag
    }
    HtmlTemplates.numberInput = parseHTML("<input type='number' class='numericalInput'>")
    //Functions
    let linkSourceUpdater = (function () {
        let lists = new Map([
            [Phase, []],
            [Game, []],
            [Team, []]
        ]);
        let receivers = new Set();
        let linkSourceUpdater = {
            getList(type) { return Array.from(lists.get(type)) },
            addReceiver(newReceiver) { receivers.add(newReceiver) },
            removeReceiver(oldReceiver) { receivers.delete(oldReceiver) }
        }
        Object.freeze(linkSourceUpdater);

        function updateHandler(observation) {
            let phasesList = Array.from(comp.allPhasesArray);
            let gamesList = [];
            phasesList.forEach((phase) => gamesList.push(...phase.allGamesInPhase));
            let teamsList = Array.from(Team.allTeams.values());

            lists.set(Phase, phasesList);
            lists.set(Game, gamesList);
            lists.set(Team, teamsList);
            pingReceivers();
        }

        function pingReceivers() {
            let newEvent = new CustomEvent('refresh', { detail: { origin: linkSourceUpdater } });
            receivers.forEach((receiver) => receiver.dispatchEvent(newEvent));
        }
        CodeObserver.addHandler(Phase, updateHandler);
        CodeObserver.addHandler(Game, updateHandler);
        CodeObserver.addHandler(Team, updateHandler);

        return linkSourceUpdater;
    })()
    //Events
    EventTemplates.onButtonNew = function onButtonNew(createThis) {
        return ElementTemplate.eventObjMaker({ //placed on button
            triggers: ['click'],
            func: function newElementOnClick(ev) {
                let root = this.root;
                root.append(createThis.build(root));
            },
            self: false,
            queryselection: 'button',
        })
    };

    EventTemplates.changePhasePriority = ElementTemplate.eventObjMaker({
        triggers:['input'], //goes on input in phaseContainer
        queryselection:"input",
        func:function changePhasePriority(ev){
            this.elder['phase'].spirit.changeSetting(e.PRIORITY, parseInt(this.value) ?? 1); 
        }

    })

    EventTemplates.refreshSourceList = new ElementTemplate.eventObjMaker({
        triggers: ['refresh'], //attached to teamSelectionTemplate
        func: function refreshSourceList(ev) {
            let currentSourceType = this.quickLoad("currentSourceType");
            let updatedList = linkSourceUpdater.getList(currentSourceType);
            let sourceSelect = this.querySelector(".sourceSelect");
            let frag = new DocumentFragment();
            let defaultOption = document.createElement('option')
            defaultOption.append("Please Select Source");
            defaultOption.selected = 'selected'; defaultOption.disabled = true;
            frag.append(defaultOption);
            this.deleteElementDataStore(sourceSelect);
            for (const member of updatedList) {
                const option = document.createElement('option');
                option.append(member.name);
                this.save({ element: sourceSelect, dataArr: [{ key: option, value: member },{key:member,value:option}]})
                if (member === this.quickLoad('source')) option.selected = 'selected';
                frag.append(option)
            }
            sourceSelect.replaceChildren(frag);
        }
    })
    EventTemplates.selectSource = new ElementTemplate.eventObjMaker({
        triggers: ['input'], //attached to sourceSelect element
        func: function selectSource(ev) {
            let selectedOption = this.selectedOptions[0];
            let selectedSource = this.root.data.get(this).get(selectedOption)
            this.root.quickSave('source', selectedSource)
        },
        queryselection: ".sourceSelect"
    });
    EventTemplates.selectSourceType = new ElementTemplate.eventObjMaker({
        triggers: ['input'], //attached to sourceTypeSelect element
        func: function selectSourceType(ev) {
            let currentOption = this.selectedOptions[0];
            let selectedSourceType = this.root.quickLoad(currentOption);
            this.root.quickSave("currentSourceType", selectedSourceType);
            this.root.quickSave("source", false);
            this.root.dispatchEvent(new Event('refresh'));
        },
        queryselection: ".sourceTypeSelect"
    });
    EventTemplates.createNewLink = new ElementTemplate.eventObjMaker({
        triggers: ['input'], //attached to gameContainer element
        func: function createNewLink(ev) {
            let game = this.quickLoad("Associated");
            let originTeamSelector = ev.target.root;
            let source = originTeamSelector.quickLoad("source");
            let sourceRank = originTeamSelector.querySelector('.numericalInput').value;
            let currentLink = this.quickLoad(originTeamSelector);
            currentLink?.deleteLink();
            if (source) {
                let newLink = game.newIncomingLink({ source, sourceRank });
                this.quickSave(originTeamSelector, newLink)
            }
        }

    })
    //Element Templates
    TableGenerator.bracketTable.init = function () {

        this.teamSelectionDivider = new ElementTemplate({
            addClasses: ['divideTeamSelection'],
            label: "The V Symbol between games",
            htmlInsert: parseHTML("<hr><p> </p><hr>"),
            onCreationCode: (mainDiv) => { mainDiv.querySelector('p').append(`Game ${mainDiv.elder["game"].quickLoad("Associated").id}`); }
        });
        this.teamSelectionTemplate = new ElementTemplate({
            addClasses: ['teamSelector'],
            label: "Team Selector",
            htmlInsert: HtmlTemplates.linkCreation,
            addEvents: [EventTemplates.refreshSourceList, EventTemplates.selectSource, EventTemplates.selectSourceType],
            addTemplates: [],
            addAsElder: "teamSelector",
            onCreationCode: (mainDiv) => {
                linkSourceUpdater.addReceiver(mainDiv);
                mainDiv.quickSave(mainDiv.querySelector("[data-source-type='Phase']"), Phase);
                mainDiv.quickSave(mainDiv.querySelector("[data-source-type='Game']"), Game);
                mainDiv.quickSave(mainDiv.querySelector("[data-source-type='Team']"), Team);
                let currentSelectType = mainDiv.quickLoad(mainDiv.querySelector('.sourceTypeSelect').selectedOptions[0])
                mainDiv.quickSave("currentSourceType", currentSelectType);
                mainDiv.dispatchEvent(new Event("refresh"));
                mainDiv.querySelector('.sourceSelect').dispatchEvent(new Event("input"));
            }
        });
        this.gameTemplate = new ElementTemplate({
            addClasses: ['gameContainer', "cell"],
            label: "Game Container",
            addAsElder: "game",
            addEvents: [EventTemplates.createNewLink],
            addTemplates: [this.teamSelectionTemplate, this.teamSelectionDivider, this.teamSelectionTemplate],
            onCreationCode: (gameContainer) => {
                let myBlock = gameContainer.elder['block'].quickLoad("Associated");
                let newGame = myBlock.newGame();
                bond(gameContainer,newGame)
                CodeObserver.register(newGame); 
                CodeObserver.addHandler(newGame, ({ mark }) => {
                    if (mark.validity.status) {
                        gameContainer.classList.remove("invalid")
                    }
                    else {
                        gameContainer.classList.add("invalid")
                        console.log(mark.name,mark.validity.message);
                    }
                })
                gameContainer.quickSave("Associated", newGame);
                newGame.verifyLinks()
            },

        });
        this.blockTemplate = new ElementTemplate({
            addClasses: ['blockContainer', "column"],
            label: "Block Container",
            addAsElder: "block",
            htmlInsert: (() => HtmlTemplates.addButton)(),
            addEvents: [EventTemplates.onButtonNew(this.gameTemplate)],
            addTemplates: [this.gameTemplate],
            onCreationCode: (blockContainer) => {
                let phaseContainer = blockContainer.root;
                let myPhase = phaseContainer.quickLoad("Associated");
                let newBlock = myPhase.newBlock();
                bond(blockContainer,newBlock);
                blockContainer.quickSave("Associated", newBlock);
                CodeObserver.register(newBlock); 
                CodeObserver.addHandler(newBlock, ({ mark }) => {
                    if (mark.validity.status) {
                        blockContainer.classList.remove("invalid")
                    }
                    else {
                        blockContainer.classList.add("invalid")
                        console.log(mark.name,mark.validity.message);
                    }
                })
            }
        });
        this.phaseTemplate = new ElementTemplate({
            addClasses: ['phaseContainer'],
            label: "Phase Container",
            addAsElder: "phase",
            htmlInsert: [HtmlTemplates.numberInput, HtmlTemplates.addButton],
            addEvents: [EventTemplates.onButtonNew(this.blockTemplate),EventTemplates.changePhasePriority],
            addTemplates: [this.blockTemplate],
            onCreationCode: (phaseContainer,existingPhase) => {
                let newPhase = (existingPhase) ? existingPhase:comp.newPhase();
                phaseContainer.quickSave("Associated", newPhase);
                bond(phaseContainer,newPhase);
                phaseContainer.querySelector("input").value = newPhase.currentSettings.get(e.PRIORITY);
                phaseContainer.prepend(document.createElement("br"));
                phaseContainer.prepend(newPhase.phaseType.description)
                CodeObserver.register(newPhase); 
                CodeObserver.addHandler(newPhase, ({ mark }) => {
                    if (mark.validity.status) {
                        phaseContainer.classList.remove("invalid")
                    }
                    else {
                        phaseContainer.classList.add("invalid")
                        console.log(mark.name,mark.validity.message);
                    }
                })
            }
        });
        this.tableTemplate = new ElementTemplate({
            addClasses: ["table"],
            label: "main bracket table",
            addAsElder: "table",
            htmlInsert: HtmlTemplates.addButton,
            addEvents: [EventTemplates.onButtonNew(this.phaseTemplate)],
            addTemplates: [TableGenerator.phaseConstructor.controlPanel],
            onCreationCode:(mainDiv)=>{
                bond(mainDiv,comp);
            }
        })
        delete this.init;
    }
    TableGenerator.bracketTable.init();

    TableGenerator.scheduleTable = {};
    //HTML
    HtmlTemplates.initialScheduleInput = parseHTML(`
        <label> Number of Fields: <input class = 'numericalInput' type='number' min=1 value=1 data-max-field-number=true></label>
        <label> Date Comp Start: <input type='date' data-date-comp-start></label>
        <label> Time Comp Start: <input  type='time' data-time-comp-start=true></label>
        <button type='button' data-schedule> Schedule </button>
        <button type='button' data-csv=team> Team CSV </button>
        <button type='button' data-csv=draw> Draw CSV </button>

    `);

    //Events
    EventTemplates.schedule = ElementTemplate.eventObjMaker({
        triggers: ['click'], // goes on schedule button
        func: function startSchedule(ev) {

            let initialRow = this.elder['initialRow']
            let fieldOrganiser = this.elder['table'].querySelector("[data-field-organiser]");
            fieldOrganiser.replaceChildren();
            let maxField = initialRow.querySelector("[data-max-field-number]").value;
            let startDateText = initialRow.querySelector("[data-date-comp-start]").value;
            let startTimeText = initialRow.querySelector("[data-time-comp-start]").value;
            let startDate = new Date(`${startDateText}T${startTimeText}`);
            let scheduling = new Scheduler(comp, maxField, startDate.getTime())
            scheduling.scheduleAll();
            let simpleSchedule = scheduling.getFieldSchedule();
            this.elder['table'].quickSave("csv", { team: CSVGenerator.teamCSV(), draw: CSVGenerator.drawCSV(simpleSchedule) });
            for (let i = 1; i < simpleSchedule.length; i++) {
                let fieldContainer = TableGenerator.scheduleTable.fieldContainer.build(fieldOrganiser);
                fieldOrganiser.append(fieldContainer);
                for (timeSlot of simpleSchedule[i]) {
                    let slot = document.createElement('div');
                    let startDate = new Date(timeSlot.absoluteStartTime);
                    let link1 = timeSlot.game.incomingLinks[0];
                    let link2 = timeSlot.game.incomingLinks[1]
                    slot.append(`Source:${link1.source.name} (${link1.sourceRank ?? ""}) vs. ${link2.source.name} (${link2.sourceRank ?? ""})`);
                    slot.append(document.createElement("br"));
                    slot.append(`${getDayName(startDate.getDay())}, ${startDate.toLocaleTimeString()}`)
                    fieldContainer.append(slot);
                }
            }

        },
        queryselection: "[data-schedule]"
    })

    EventTemplates.getCSV = ElementTemplate.eventObjMaker({
        triggers: ['click'], // goes on initial row
        func: function getCSV(ev) {
            let csvTarget = ev.target.dataset.csv;
            if (csvTarget) {
                let csv = this.elder['table'].quickLoad('csv')[csvTarget];
                downloadFile(csv, `${csvTarget}.csv`)
            }
        },
        queryselection: "[data-csv]"

    })
    //Elment Templates

    TableGenerator.scheduleTable.init = function () {
        this.initialRow = new ElementTemplate({
            label: "Initial row to set-up Scheduler",
            addClasses: ['row', "initialRow"],
            addAsElder: 'initialRow',
            htmlInsert: HtmlTemplates.initialScheduleInput,
            addEvents: [EventTemplates.schedule, EventTemplates.getCSV],
            onCreationCode: (mainDiv) => mainDiv.elder['table'].quickSave('initialRow', mainDiv)

        });

        this.fieldContainer = new ElementTemplate({
            label: "Field Container",
            addClasses: ['column', 'fieldContainer']
        })

        this.fieldContainerGrouping = new ElementTemplate({
            label: "Organises Field Containers",
            addClasses: ['flexContainer', 'columnContainer'],
            addDataset: [{ name: "fieldOrganiser", value: true }]

        })

        this.table = new ElementTemplate({
            label: "Table for scheduling",
            addClasses: ['table', 'noFlex'],
            addAsElder: "table",
            addTemplates: [this.initialRow, this.fieldContainerGrouping]
        })
        delete this.init;
    };
    TableGenerator.scheduleTable.init();

    

    function bond(mainDiv,unit){
        mainDiv.spirit=unit;
        unit.flesh = mainDiv;
    }
    return TableGenerator
})(comp)

