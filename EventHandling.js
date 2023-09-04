function ExclusiveLongClickTimer(htmlElement,callBackArray=[]){ //callBackArray: [{callBack,timing:{startTime,endTime}}]
    let startTime, endTime;
    let callBackMap = new TimeMap();
    callBackArray.forEach((x)=>callBackMap.set(x.callBack,x.timing))

    htmlElement.addEventListener("pointerdown",(ev)=>{
        if(ev.pointerType==="mouse" && ev.button!==0) return
        startTime = Math.round(performance.now());
        endTime = null;
        htmlElement.setPointerCapture(ev.pointerId)
    });


    htmlElement.addEventListener("pointerup",(ev)=>{
        if(ev.pointerType==="mouse" && ev.button!==0) return
        endTime = Math.round(performance.now());
        htmlElement.releasePointerCapture(ev.pointerId);
        let relevantCallBacks = callBackMap.findOverlap(endTime-startTime).items;
        relevantCallBacks.forEach((callBack)=>callBack(htmlElement,ev,endTime-startTime))
    });
}