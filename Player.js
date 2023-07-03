//requires Basic Tools be loaded

var Player= (function(){
    
    let id = 0;
    allPlayers = new Map();

    defineGetter({obj:Player,name:"allPlayersArray",func:()=>Array.from(allPlayers.keys())});
    Player.search = function({map,property=undefined,searchTerm="",searchFunc}){
        return searchMap({map:allPlayers,property,searchTerm,excludeKey:false,excludeValue:false,searchFunc});
    }
     
    function Player({firstName="-",lastName="",preferredName}){
       let myId=++id;
       allPlayers.set(this,"")
       defineGetter({obj:this,name:"firstName",func:()=>firstName});
       defineGetter({obj:this,name:"lastName",func:()=>lastName});
       defineGetter({obj:this,name:"preferredName",func:()=>(preferredName) ? preferredName:firstName});
       defineGetter({obj:this,name:"name",func:()=>`${firstName} ${(preferredName) ? ` '${preferredName}' `:""}${lastName}`});
       defineGetter({obj:this,name:"id",func:()=>myId});

       this.changeDetail = function (detail,newValue){
            switch (detail){
                case e.FIRST_NAME:
                    firstName=newValue;
                    break;
                case e.LAST_NAME:
                    lastName=newValue;
                    break;
                case e.PREFERRED_NAME:
                    preferredName=newValue;
                    break;

            }
        }
    }

    Player.prototype ={
    }
    Player.prototype.constructor=Player;
    return Player;
})()



