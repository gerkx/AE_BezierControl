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
    for (var i=0, ii = targetLayerArray.length; i<ii; i++){
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
      
      //Raise Error if no path selected
      if selectedPaths.length == 0 {
        var pathError = localize("$$$/AE/Script/CreatePathNulls/ErrorNoPathsSelected=Error: No Paths Selected.");
        alert(pathError);
        return
      }

      for (var p = 0; p < selectedPaths.length; p++){
        doSomething(comp,parentLayers[p], selectedPaths[p]);
      }
  }
  // nix this - only interested in linking points to nulls
  function linkNullsToPoints(){
    var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkNullsToPathPoints=Link Nulls to Path Points");
    app.beginUndoGroup(undoGroup);

    forEachPath(function(comp.selectedLayer, path){
      var pathHierarchy = [];
      var pathPath = getPropPath(path,pathHierarchy);
      //Act on path points
      var pathPoints = getPathPoints(path);
      for(var i=0, ii = pathPoints.length; i <ii; i++){
        var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
        if(comp.layer(nullName) == undefined){
          var newNull = createNull(comp);
          newNull.position.setValue(pathPoints[i]);
          newNull.position.expression = 
            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" + 
            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
            "srcLayer.toComp(srcPath);";
          newNull.name = nullName;
          newNull.label = 10;
        }
      }
    });
    app.endUndoGroup();
  }

  //This is the the function we care about
  function linkPointsToNulls(){
    var undoGroup = localize("$$$/AE/Script/CreatPathNulls/LinkPathPointsToNulls=Link Paths Points to Nulls");
    app.beginUndoGroup(undoGroup);

    forEachPath(function(comp,selectedLayer,path){
      //Get Prop path to path
      var pathHierarchy = [];
      var pathPath = getPropPath(path, pathHierarchy);
      var nullSet = [];
      //Act on path points
      var pathPoints = getPathPoints(path);
      for (var i = 0, ii = pathPoints.length; i < ii; i++){
        var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
        nullSet.push(nullName);

        // Get names of nulls that don't exist yet and crate them
        if(comp.layer(nullName) == undefined){
          //Create Nulls
          var newNull = createNull(comp);
          //Null Layer Name
          newNull.name = nullName;
          newNull.label = 11;

          //Set Position using layer space transforms, then remove exp
          newNull.position.setValue(pathPoints[i]);
          newNull.position.expression = 
            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" + 
            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
            "srcLayer.toComp(srcPath);";
          newNull.position.setValue(newNull.position.value);
          newNull.position.expression = '';
        }
      }
      //Get any existing layer control effects
      var existingEffects = [];
      forEachEffect(selectedLayer,function(targetEffect){
        if(matchMatchName(targetEffect,"ADBE Layer Control") != null){
          existingEffects.push(targetEffect.name);
        }              
      });

      //Add new layer control effects for each null
      for(var n = 0; n < nullSet.length; n++){
        if(existingEffects.join("|").indexOf(nullSet[n]) != -1){//If layer control effects exist, relink
          selectedLayer.property("ADBE Effect Parade")(nullSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullset[n]).index);
        } else {
          var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
          newControl.name = nullSet[n];
          newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
        }
      }

      //Set path Expression that ref nulls
      
    
    })


  }





      





























    }
