let playerTable = TableGenerator.playerTable.tableTemplate.build();
playerTable.append(TableGenerator.playerTable.rowTemplate.build(playerTable));
getE("body").append(playerTable);

getE('body').append(document.createElement('hr'));

let bracketTable = TableGenerator.bracketTable.tableTemplate.build();
getE('body').append(bracketTable);

getE('body').append(document.createElement('hr'));

let scheduleTable = TableGenerator.scheduleTable.table.build()
getE('body').append(scheduleTable)