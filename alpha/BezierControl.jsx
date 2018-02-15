/*
    Create Nulls From Paths.jsx v.0.5
    Attach nulls to shape and mask vertices, and vice-versa.

    Changes:
        - wraps it all in an IIFE
        - fixes call to missing method array.indexOf
*/
(function createNullsFromPaths (thisObj) {
  /* Build UI */
  function buildUI(thisObj) {
      var windowTitle = localize("$$$/AE/Script/CreatePathNulls/CreateNullsFromPaths=Create Nulls From Paths");
      var firstButton = localize("$$$/AE/Script/CreatePathNulls/PathPointsToNulls=Bezier Controls");
      var win = (thisObj instanceof Panel)? thisObj : new Window('palette', windowTitle);
          win.spacing = 0;
          win.margins = 4;
          var myButtonGroup = win.add ("group");
              myButtonGroup.spacing = 4;
              myButtonGroup.margins = 0;
              myButtonGroup.orientation = "row";
              win.button1 = myButtonGroup.add ("button", undefined, firstButton);
              myButtonGroup.alignment = "center";
              myButtonGroup.alignChildren = "center";

          win.button1.onClick = function(){
              linkPointsToNulls();
          }

      win.layout.layout(true);

      return win
  }


  // Show the Panel
  var w = buildUI(thisObj);
  if (w.toString() == "[object Panel]") {
      w;
  } else {
      w.show();
  }


  /* General functions */

  function getActiveComp(){
      var theComp = app.project.activeItem;
      if (theComp == undefined){
          var errorMsg = localize("$$$/AE/Script/CreatePathNulls/ErrorNoComp=Error: Please select a composition.");
          alert(errorMsg);
          return null
      }

      return theComp
  }

  function getSelectedLayers(targetComp){
      var targetLayers = targetComp.selectedLayers;
      return targetLayers
  }

  function createNull(targetComp){
      return targetComp.layers.addNull();
  }

  function getSelectedProperties(targetLayer){
      var props = targetLayer.selectedProperties;
      if (props.length < 1){
          return null
      }
      return props
  }

  function forEachLayer(targetLayerArray, doSomething) {
      for (var i = 0, ii = targetLayerArray.length; i < ii; i++){
          doSomething(targetLayerArray[i]);
      }
  }

  function forEachProperty(targetProps, doSomething){
      for (var i = 0, ii = targetProps.length; i < ii; i++){
          doSomething(targetProps[i]);
      }
  }

  function forEachEffect(targetLayer, doSomething){
      for (var i = 1, ii = targetLayer.property("ADBE Effect Parade").numProperties; i <= ii; i++) {
          doSomething(targetLayer.property("ADBE Effect Parade").property(i));
      }
  }

  function matchMatchName(targetEffect,matchNameString){
      if (targetEffect != null && targetEffect.matchName === matchNameString) {
          return targetEffect
      } else {
          return null
      }
  }

  function getPropPath(currentProp,pathHierarchy){
      var pathPath = "";
          while (currentProp.parentProperty !== null){

              if ((currentProp.parentProperty.propertyType === PropertyType.INDEXED_GROUP)) {
                  pathHierarchy.unshift(currentProp.propertyIndex);
                  pathPath = "(" + currentProp.propertyIndex + ")" + pathPath;
              } else {
                  pathPath = "(\"" + currentProp.matchName.toString() + "\")" + pathPath;
              }

              // Traverse up the property tree
              currentProp = currentProp.parentProperty;
          }
      return pathPath
  }

  function getPathPoints(path){
      return path.value.vertices;
  }


  /* Project specific code */

  function forEachPath(doSomething){

      var comp = getActiveComp();

      if(comp == null) {
          return
      }

          var selectedLayers = getSelectedLayers(comp);
          if (selectedLayers == null){
              return
          }

          // First store the set of selected paths
          var selectedPaths = [];
          var parentLayers = [];
          forEachLayer(selectedLayers,function(selectedLayer){

              var paths = getSelectedProperties(selectedLayer);
              if (paths == null){
                  return
              }

              forEachProperty(paths,function(path){
                  var isShapePath = matchMatchName(path,"ADBE Vector Shape");
                  var isMaskPath = matchMatchName(path,"ADBE Mask Shape");
              // var isPaintPath = matchMatchName(path,"ADBE Paint Shape"); //Paint and roto strokes not yet supported in scripting
                  if(isShapePath != null || isMaskPath != null ){
                      selectedPaths.push(path);
                      parentLayers.push(selectedLayer);
                  }
              });
          });

          // Then operate on the selection
          if (selectedPaths.length == 0){
              var pathError = localize("$$$/AE/Script/CreatePathNulls/ErrorNoPathsSelected=Error: No paths selected.");

              alert(pathError);
              return
          }

          for (var p = 0; p < selectedPaths.length; p++) {
                  doSomething(comp,parentLayers[p],selectedPaths[p]);
          }

  }


  function linkPointsToNulls(){
      var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsToNulls=Create Bezier Controls");
      app.beginUndoGroup(undoGroup);

      forEachPath(function(comp,selectedLayer,path){
          // Get property path to path
          var pathHierarchy = [];
          var pathPath = getPropPath(path, pathHierarchy);
          var pointSet = [];
          var tanInSet = [];
          var tanOutSet = [];
          // Do things with the path points
          var pathPoints = getPathPoints(path);
          var pathInTan = getPathInTangents(path);
          var pathOutTan = getPathOutTangents(path);
          //setup pos ctrls
          for (var i = 0, ii = pathPoints.length; i < ii; i++){ //For each path point
              var pointName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
              pointSet.push(pointName);

              // Get names of nulls that don't exist yet and create them
              if(comp.layer(pointName) == undefined){

                  //Create nulls
                  var newPoint = createNull(comp);
                  // Null layer name
                  newPoint.name = pointName;
                  newPoint.label = 10;

                  // Set position using layer space transforms, then remove expressions
                  newPoint.position.setValue(pathPoints[i]);
                  newPoint.position.expression =
                          "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                          "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                          "srcLayer.toComp(srcPath);";
                  newPoint.position.setValue(newPoint.position.value);
                  newPoint.position.expression = '';
                  }

              }
          
          //setup tan out ctrls
          for (var i = 0, ii = pathInTan.length; i < ii; i++){ //For each path point
            var nullName = selectedLayer.name + ": " + path.parentProperty.name + " IN [" + pathHierarchy.join(".") + "." + i + "]";
            tanInSet.push(nullName);

            // Get names of nulls that don't exist yet and create them
            if(comp.layer(nullName) == undefined){

                //Create nulls
                var newNull = createNull(comp);
                // Null layer name
                newNull.name = nullName;
                newNull.label = 11;

                // Set position using layer space transforms, then remove expressions
                newNull.position.setValue(pathInTan[i]);
                newNull.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".inTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                newNull.position.setValue(newNull.position.value);
                newNull.position.expression = '';
                newNull.parent = comp.layer(pointSet[i]);
                }

            }
          // setup tangent out
          for (var i = 0, ii = pathOutTang.length; i < ii; i++){ //For each path point
            var nullName = selectedLayer.name + ": " + path.parentProperty.name + " OUT [" + pathHierarchy.join(".") + "." + i + "]";
            tanOutSet.push(nullName);

            // Get names of nulls that don't exist yet and create them
            if(comp.layer(nullName) == undefined){

                //Create nulls
                var newNull = createNull(comp);
                // Null layer name
                newNull.name = nullName;
                newNull.label = 9; // green

                // Set position using layer space transforms, then remove expressions
                newNull.position.setValue(pathOutTang[i]);
                newNull.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".outTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                newNull.position.setValue(newNull.position.value);
                newNull.position.expression = '';
                newNull.parent = comp.layer(pointSet[i]);
                }

            }


          // Get any existing Layer Control effects
          var existingEffects = [];
          forEachEffect(selectedLayer,function(targetEffect){
              if(matchMatchName(targetEffect,"ADBE Layer Control") != null) {
                  existingEffects.push(targetEffect.name);
              }
          });

          // Add new layer control effects for point layer
          for(var n = 0; n < pointSet.length;n++){
              if(existingEffects.join("|").indexOf(pointSet[n]) != -1){ //If layer control effect exists, relink it to null
                  selectedLayer.property("ADBE Effect Parade")(pointSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(pointSet[n]).index);
              } else {
                  var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                  newControl.name = pointSet[n];
                  newControl.property("ADBE Layer Control-0001").setValue(comp.layer(pointSet[n]).index);
              }
          }
           // Add new layer control effects for tan In layer
          for(var n = 0; n < tanInSet.length;n++){
            if(existingEffects.join("|").indexOf(tanInSet[n]) != -1){ //If layer control effect exists, relink it to null
                selectedLayer.property("ADBE Effect Parade")(tanInSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(tanInSet[n]).index);
            } else {
                var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                newControl.name = tanInSet[n];
                newControl.property("ADBE Layer Control-0001").setValue(comp.layer(tanInSet[n]).index);
            }
           }
           // Add new layer control effects for tan out layer
          for(var n = 0; n < tanOutSet.length;n++){
            if(existingEffects.join("|").indexOf(tanOutSet[n]) != -1){ //If layer control effect exists, relink it to null
                selectedLayer.property("ADBE Effect Parade")(tanOutSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(tanOutSet[n]).index);
            } else {
                var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                newControl.name = tanOutSet[n];
                newControl.property("ADBE Layer Control-0001").setValue(comp.layer(tanOutSet[n]).index);
            }
          }

          // Set path expression that references nulls
          path.expression =
                      "var nullLayerNames = [\"" + pointSet.join("\",\"") + "\"]; \r" +
                      "var nullTanInLayerNames = [\"" + tanInSet.join("\",\"") + "\"]; \r" + 
                      "var nullTanOutLayerNames = [\"" + tanOutSet.join("\",\"") + "\"]; \r" + 
                      "var origPath = thisProperty; \r" +
                      "var origPoints = origPath.points(); \r" +
                      "var origInTang = origPath.inTangents(); \r" +
                      "var origOutTang = origPath.outTangents(); \r" +
                      "var getNullLayers = []; \r" +
                      "var getNullIns = []; \r" +
                      "var getNullOuts = []; \r" +
                      "for (var i = 0; i < nullLayerNames.length; i++){ \r" +
                      "    try{  \r" +
                      "        getNullLayers.push(effect(nullLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                      "        getNullIns.push(effect(nullTanInLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                      "        getNullOuts.push(effect(nullTanOutLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                      "    } catch(err) { \r" +
                      "        getNullLayers.push(null); \r" +
                      "        getNullIns.push(null); \r" +
                      "        getNullOuts.push(null); \r" +
                      "    }} \r" +
                      "for (var i = 0; i < getNullLayers.length; i++){ \r" +
                      "    if (getNullLayers[i] != null && getNullLayers[i].index != thisLayer.index){ \r" +
                      "        origPoints[i] = fromCompToSurface(getNullLayers[i].toComp(getNullLayers[i].anchorPoint));  \r" +
                      "    } \r" +
                      "    if (getNullIns[i] != null && getNullIns[i].index != thisLayer.index){ \r" +
                      "        origInTang[i] = fromCompToSurface(getNullIns[i].toComp(getNullIns[i].anchorPoint)) - origPoints[i];  \r" +
                      "    } \r" +
                      "    if (getNullOuts[i] != null && getNullOuts[i].index != thisLayer.index){ \r" +
                      "        origOutTang[i] = fromCompToSurface(getNullOuts[i].toComp(getNullOuts[i].anchorPoint)) - origPoints[i];  \r" +
                      "    }} \r" +
                      "createPath(origPoints,origInTang,origOutTang,origPath.isClosed());";

      });
      app.endUndoGroup();
  }   

})(this);
