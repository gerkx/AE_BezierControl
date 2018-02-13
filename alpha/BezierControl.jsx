/*=======================================================
|| Bezier Control                                      ||
|| V0.0.1                                              ||
|| Created by Patrick Gerke                            ||
|| http://gerkx.com                                    ||
=======================================================*/

//Main Function - create controls for bezier points
function controlBezierPaths(thisObj){

  //UI will go here

  // get active Comp
  function getActiveComp(){
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

  // create array of selected layers
  function forEachLayer(targetLayerArray, doSomething){
    for (var i=0, ii = targetLayerArray.lenght; i<ii; i++){
      doSomething(targetLayerArray[i]);
    }
  }

  // create array for selected Props of selected Layers
  function forEachProp(targetProps, doSomething){
    for (var i=0, ii = targetProps.length; i<ii, i++;){
      doSomething(targetProps[i]);
    }
  }

  //Get effect Info
  function forEachEffect(targetLayer, doSomething){
    for (var i = 1, ii = targetLayer.property("ADBE Effect Parade").numProperties; i < ii, i++;){
      doSomething(targetLayer.property("ADBE Effect Parade").property(i));
    }
  }

  //if things match, return select effects
  function matchMatchName(targetEffect, matchNameString){
    if(targetEffect != null && targetEffect.matchName === matchNameString){
      return targetEffect
    }else{
      return null
    }
  }

  // Get path of the path
  function getPropPath(currentProp,pathHierarchy){
    var pathPath = "";
    while (currentProp.parentProperty !== null){
      //set path for selected path
      if((currentProp.parentProperty.propertyType === PropertyType.INDEXED_GROUP)){
        pathHierarchy.unshift(currentProp.propertyIndex);
        pathPath = "(" + currentProp.propertyIndex + ")" + pathPath;
      }else{
        pathPath = "(\"" + currentProp.matchName.toString() + "\")" + pathPath;
      }
      // go up tree
      currentProp = currentProp.parentProperty;
    }
    return pathPath
  }

  //get vertices
  function getPathPoints(path){
    return path.value.vertices;
  }


  /* Specific Code */

  //
  function forEachPath(doSomething){
    //assign active comp to var comp
    var comp = getActiveComp();
    //if no comp sel, return
    if (comp == null){
      return
    }
    // assign selected layers to var selectedLayers
    var selectedLayers = getSelLayers(comp);
    // if no layer selected return
    if(selectedLayers == null){
      return
    }
    //store selected paths into array
    var selectedPaths = [];
    var parentLayers = [];
    //
    forEachLayer(selectedLayers,
      function(selectedLayer){
        var paths = getSelectedProps(selectedLayer);
        if (paths == null){
          return
        }
        forEachProp(paths,
          function(path){
            var isShapePath = matchMatchName(path, "ADBE Vector Shape");
            var isMaskPath = matchMatchName(path, "ADBE Mask Shape");
            if(isShapePath != null || isMaskPath != null){
              selectedPaths.push(path);
              parentLayers.push(selectedLayer);
            }
          });

        });
      }



      





























    }
