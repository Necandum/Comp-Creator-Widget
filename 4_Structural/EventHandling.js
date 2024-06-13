function ExclusiveLongClickTimer(htmlElement,callBackArray=[]){ //callBackArray: [{callBack,timing:{startTime,endTime}}]
    let startTime, endTime;
    let callBackMap = new TimeMap();
    callBackArray.forEach((x)=>callBackMap.set(x.callBack,x.timing))

    function startActivationFunction(ev){
        if(ev.pointerType==="mouse" && ev.button!==0) return
        startTime = Math.round(performance.now());
        endTime = null;
    }

    function stopActivationFunction(ev){
        if(ev.pointerType==="mouse" && ev.button!==0) return
        endTime = Math.round(performance.now());
        let relevantCallBacks = callBackMap.findOverlap(endTime-startTime).items;
        relevantCallBacks.forEach((callBack)=>callBack(htmlElement,ev,endTime-startTime))
    }

    htmlElement.addEventListener("pointerdown",(ev)=>{
        if(!ev.target.dataset.passThrough && ev.target !== ev.currentTarget) return;
        htmlElement.setPointerCapture(ev.pointerId)
        startActivationFunction(ev);
    });
    
    htmlElement.addEventListener("keydown",(ev)=>{
        if(!ev.target.dataset.passThrough && ev.target !== ev.currentTarget) return;
        if(ev.code==='Space' && ev.repeat===false) startActivationFunction(ev);
    });
    
    htmlElement.addEventListener("pointerup",(ev)=>{
        if(!ev.target.dataset.passThrough && ev.target !== ev.currentTarget) return;
        htmlElement.releasePointerCapture(ev.pointerId);
        stopActivationFunction(ev);
    });
    htmlElement.addEventListener("keyup",(ev)=>{
        if(!ev.target.dataset.passThrough && ev.target !== ev.currentTarget) return;
        if(ev.code==='Space') stopActivationFunction(ev);
    });
}