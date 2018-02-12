/*=======================================================
|| Control Bezier Paths                                ||
|| V0.0.1                                              ||
|| Created by Patrick Gerke                            ||
|| http://gerkx.com                                    ||
=======================================================*/

//Main Function - create controls for bezier points
function controlBezierPaths(thisObj){

  //UI will go here

  // get active Comp
  function activeComp(){
    var activeComp = app.project.activeItem;
    if (activeComp == undefined){
      var errMsg = localize("$$$/AE/Script/ControlBezierPaths/ErrorNoComp=Error: No comp selected!");
      alert(errMsg);
      return null
    }
    return activeComp
  }

  // get selected layers
  function getSelLayers(targetComp){
    var targLayers = targComp.selectedLayers;
    return targLayers
  }

  //create null. later replace with Shape
  function createNull(targetComp){
    return targetComp.layers.addNull();
  }

  // get selected properties
  function getSelProps(targetLayer){
    var props = targetLayer.selectedProperties;
    if(props.length < 1){
      return null
    }
    return props
  }

  function forEachLayer(targetLayerArray, doSomething){


  }


  
























}
