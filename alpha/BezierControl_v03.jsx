/*
    Create Nulls From Paths.jsx v.0.6
    Updated 24 Oct 2017 by Nick Hill, nomagnolia.tv
    Attach nulls to shape and mask vertices, and vice-versa.
 
    Changes:
        - wraps it all in an IIFE
        - fixes call to missing method array.indexOf
*/
(function createNullsFromPaths(thisObj) {
    /* Build UI */
    function buildUI(thisObj) {
        var windowTitle = localize("$$$/AE/Script/CreatePathNulls/CreateNullsFromPaths=Create Nulls From Paths");
        var fourthButton = localize("$$$/AE/Script/CreatePathNulls/PathTangentsFollowNulls=BezierControls");
        var win = (thisObj instanceof Panel) ? thisObj : new Window('palette', windowTitle);
        win.spacing = 0;
        win.margins = 4;
        var myButtonGroup = win.add("group");
        myButtonGroup.spacing = 4;
        myButtonGroup.margins = 0;
        myButtonGroup.orientation = "row";
        win.button2 = myButtonGroup.add("button", undefined, fourthButton);
        myButtonGroup.alignment = "center";
        myButtonGroup.alignChildren = "center";
        win.button2.onClick = function () {
            createBezierControls();
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
    function getActiveComp() {
        var theComp = app.project.activeItem;
        if (theComp == undefined) {
            var errorMsg = localize("$$$/AE/Script/CreatePathNulls/ErrorNoComp=Error: Please select a composition.");
            alert(errorMsg);
            return null
        }
        return theComp
    }

    function getSelectedLayers(targetComp) {
        var targetLayers = targetComp.selectedLayers;
        return targetLayers
    }

    function createNull(targetComp) {
        return targetComp.layers.addNull();
    }

    function getSelectedProperties(targetLayer) {
        var props = targetLayer.selectedProperties;
        if (props.length < 1) {
            return null
        }
        return props
    }

    function forEachLayer(targetLayerArray, doSomething) {
        for (var i = 0, ii = targetLayerArray.length; i < ii; i++) {
            doSomething(targetLayerArray[i]);
        }
    }

    function forEachProperty(targetProps, doSomething) {
        for (var i = 0, ii = targetProps.length; i < ii; i++) {
            doSomething(targetProps[i]);
        }
    }

    function forEachEffect(targetLayer, doSomething) {
        for (var i = 1, ii = targetLayer.property("ADBE Effect Parade").numProperties; i <= ii; i++) {
            doSomething(targetLayer.property("ADBE Effect Parade").property(i));
        }
    }

    function matchMatchName(targetEffect, matchNameString) {
        if (targetEffect != null && targetEffect.matchName === matchNameString) {
            return targetEffect
        } else {
            return null
        }
    }

    function getPropPath(currentProp, pathHierarchy) {
        var pathPath = "";
        while (currentProp.parentProperty !== null) {

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

    function getPathPoints(path) {
        return path.value.vertices;
    }

    function getPathInTangents(path) {
        return path.value.inTangents;
    }

    function getPathOutTangents(path) {
        return path.value.outTangents;
    }

    // function tangentCreate(layerName, grpName, label, handleSize){
    //     var tanShape = comp.layers.addShape();
    //     tanShape.name = layerName + " boob" + i;
    //     tanShape.label = label;
    //     var tanContents = tanShape.property("ADBE Root Vectors Group");
    //     var tanGrp = tanContents.addProperty("ADBE Vector Group");
    //     tanOutGrp.name = grpName;
    //     var handle = tanOutGrp.content.addProperty("ADBE Vector Shape - Rect");
    //     handle.name = "tanHandle";
    //     var tanFill = tanOutGrp.content.addProperty("ADBE Vector Graphic - Fill");
    //     handle = tanGrp.content.property("ADBE Vector Shape - Rect");
    //     var handleSize = handle.property("ADBE Vector Rect Size");
    //     handleSize.setValue([handleSize,handleSize]);
        
    // }

    /* Project specific code */
    function forEachPath(doSomething) {

        var comp = getActiveComp();
        if (comp == null) {
            return
        }
        var selectedLayers = getSelectedLayers(comp);
        if (selectedLayers == null) {
            return
        }
        // First store the set of selected paths
        var selectedPaths = [];
        var parentLayers = [];
        forEachLayer(selectedLayers, function (selectedLayer) {
            var paths = getSelectedProperties(selectedLayer);
            if (paths == null) {
                return
            }
            forEachProperty(paths, function (path) {
                var isShapePath = matchMatchName(path, "ADBE Vector Shape");
                var isMaskPath = matchMatchName(path, "ADBE Mask Shape");
                // var isPaintPath = matchMatchName(path,"ADBE Paint Shape"); //Paint and roto strokes not yet supported in scripting
                if (isShapePath != null || isMaskPath != null) {
                    selectedPaths.push(path);
                    parentLayers.push(selectedLayer);
                }
            });
        });

        // Then operate on the selection
        if (selectedPaths.length == 0) {
            var pathError = localize("$$$/AE/Script/CreatePathNulls/ErrorNoPathsSelected=Error: No paths selected.");
            alert(pathError);
            return
        }
        for (var p = 0; p < selectedPaths.length; p++) {
            doSomething(comp, parentLayers[p], selectedPaths[p]);
        }
    }



    //
    function createBezierControls() {
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsAndTangentsToNulls=Create Bezier Controls");
        app.beginUndoGroup(undoGroup);

        forEachPath(function (comp, selectedLayer, path) {
            // get current comp and layer object
            var curComp = app.project.activeItem;
            if (!curComp || !(curComp instanceof CompItem)) {
                alert('noComp');
                return;
            }


            // Get property path to path
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            var ptSet = [];
            var tanInSet = [];
            var tanOutSet = [];
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            var pathInTangents = getPathInTangents(path); // there will be two tangents for each point except the first and last, if the path's open
            var pathOutTangents = getPathOutTangents(path);

            //Setup all at once

            for (var i = 0, ii = pathPoints.length; i < ii; i++) { //For each path point
                var pointName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                var tanInName = selectedLayer.name + ": " + path.parentProperty.name + " IN [" + pathHierarchy.join(".") + "." + i + "]";
                var tanOutName = selectedLayer.name + ": " + path.parentProperty.name + " OUT [" + pathHierarchy.join(".") + "." + i + "]";
                ptSet.push(pointName);
                tanInSet.push(tanInName);
                tanOutSet.push(tanOutName);

                // Get names of nulls that don't exist yet and create them
                if (comp.layer(pointName) == undefined) {
                    // tan In Shape Creation
                    var tanInShape = comp.layers.addShape();
                    tanInShape.name = tanInName + i;
                    tanInShape.label = 12;
                    var tanInContents = tanInShape.property("ADBE Root Vectors Group");
                    var tanInGrp = tanInContents.addProperty("ADBE Vector Group");
                    tanInGrp.name = "tanIn";
                    
                    var handleInGrp = tanInGrp.content.addProperty("ADBE Vector Group");
                    handleInGrp.name = "handleIn";

                    var handleIn = handleInGrp.content.addProperty("ADBE Vector Shape - Ellipse");
                    handleIn.name = "tanInHandle";
                    var tanInFill = handleInGrp.content.addProperty("ADBE Vector Graphic - Fill");
                    handleIn = handleInGrp.content.property("ADBE Vector Shape - Ellipse");
                    var handleInSize = handleIn.property("ADBE Vector Ellipse Size");
                    handleInSize.setValue([15,15]);

                    var lineInGrp = tanInGrp.content.addProperty("ADBE Vector Group");
                    lineInGrp.name = "lineIn";

                    var lineIn = lineInGrp.content.addProperty("ADBE Vector Shape - Rect");
                    lineIn.name = "tanInLine";
                    var lineInFill = lineInGrp.content.addProperty("ADBE Vector Graphic - Fill");
                    lineIn = lineInGrp.content.property("ADBE Vector Shape - Rect");
                    var lineInSize = lineIn.property("ADBE Vector Rect Size");
                    lineInSize.setValue([200,3]);


                    // tanOut Shape Layer Construct
                    var tanOutShape = comp.layers.addShape();
                    tanOutShape.name = tanOutName + i;
                    tanOutShape.label = 11;
                    var tanOutContents = tanOutShape.property("ADBE Root Vectors Group");
                    var tanOutGrp = tanOutContents.addProperty("ADBE Vector Group");
                    tanOutGrp.name = "tanOut";
                    
                    var handleOutGrp = tanOutGrp.content.addProperty("ADBE Vector Group");
                    handleOutGrp.name = "handleOut";

                    var handleOut = handleOutGrp.content.addProperty("ADBE Vector Shape - Rect");
                    handleOut.name = "tanOutHandle";
                    var tanOutFill = handleOutGrp.content.addProperty("ADBE Vector Graphic - Fill");
                    handleOut = handleOutGrp.content.property("ADBE Vector Shape - Rect");
                    var handleOutSize = handleOut.property("ADBE Vector Rect Size");
                    handleOutSize.setValue([15,15]);

                    var lineOutGrp = tanOutGrp.content.addProperty("ADBE Vector Group");
                    lineOutGrp.name = "lineOut";

                    var lineOut = lineOutGrp.content.addProperty("ADBE Vector Shape - Rect");
                    lineOut.name = "tanOutLine";
                    var lineOutFill = lineOutGrp.content.addProperty("ADBE Vector Graphic - Fill");
                    lineOut = lineOutGrp.content.property("ADBE Vector Shape - Rect");
                    var lineOutSize = lineOut.property("ADBE Vector Rect Size");
                    lineOutSize.setValue([200,3]);
                    
                    
                    // Point shape creation                    
                    var ptShape = comp.layers.addShape();
                    ptShape.name = pointName + "dingleberry" + i;
                    ptShape.label = 10;
                    var ptContents = ptShape.property("ADBE Root Vectors Group");
                    var ptGrp = ptContents.addProperty("ADBE Vector Group");
                    ptGrp.name = "point";
                    
                    var centerPtGrp = ptGrp.content.addProperty("ADBE Vector Group");
                    centerPtGrp.name = "dot";
                    
                    var dot = centerPtGrp.content.addProperty("ADBE Vector Shape - Ellipse");
                    dot.name = "dot";
                    var dotFill = centerPtGrp.content.addProperty("ADBE Vector Graphic - Fill");
                    dot = centerPtGrp.content.property("ADBE Vector Shape - Ellipse");
                    var dotSize = dot.property("ADBE Vector Ellipse Size");
                    dotSize.setValue([6,6]);

                    var ringPtGrp = ptGrp.content.addProperty("ADBE Vector Group");
                    ringPtGrp.name = "ring";
                    
                    var ring = ringPtGrp.content.addProperty("ADBE Vector Shape - Ellipse");
                    ring.name = "ring";
                    var ringStroke = ringPtGrp.content.addProperty("ADBE Vector Graphic - Stroke");
                    ring = ringPtGrp.content.property("ADBE Vector Shape - Ellipse");
                    var ringSize = ring.property("ADBE Vector Ellipse Size");
                    ringSize.setValue([25,25]);
                    
                    
                    
                    //Create nulls
                    //tanIn
                    var tanInNull = createNull(comp);
                    tanInNull.name = tanInName;
                    tanInNull.label = 12;
                    //tanOut
                    var tanOutNull = createNull(comp);
                    tanOutNull.name = tanOutName;
                    tanOutNull.label = 11
                    // point Null
                    var pointNull = createNull(comp);
                    pointNull.name = pointName;
                    pointNull.label = 10;
                    
                                       
                   

                    // Set point position using layer space transforms, then remove expressions
                    pointNull.position.setValue(pathPoints[i]);
                    pointNull.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    pointNull.position.setValue(pointNull.position.value);
                    pointNull.position.expression = '';

                    ptShape.position.setValue(pathPoints[i]);
                    ptShape.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    ptShape.position.setValue(pointNull.position.value);
                    ptShape.position.expression = '';


                    // Set position using layer space transforms, then remove expressions
                    tanOutNull.position.setValue(pathOutTangents[i]);
                    tanOutNull.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".outTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    tanOutNull.position.setValue(tanOutNull.position.value);
                    tanOutNull.position.expression = '';

                    tanOutShape.position.setValue(pathOutTangents[i]);
                    tanOutShape.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".outTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    tanOutShape.position.setValue(tanOutNull.position.value);
                    tanOutShape.position.expression = '';

                    
                    lineOutGrp.property("ADBE Vector Transform Group")("ADBE Vector Anchor").expression =
                        
                    "pt = thisComp.layer(\"" + ptShape.name + "\"); \r" +
                    "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                    "radius = pt.content(\"" + ptGrp.name + "\").content(\"" + ringPtGrp.name+ "\").content(\"" + ring.name + "\").size[0]*.5; \r" +
                    "tanOutPos = thisLayer.toWorld(thisLayer.anchorPoint); \r" +
                    "sizeX = length(ptPos, tanOutPos)-radius; \r" +
                    "sizeY = value[1]; \r" +
                    "[sizeX, sizeY] \r";
                                        









                    // Set position using layer space transforms, then remove expressions
                    tanInNull.position.setValue(pathInTangents[i]);
                    tanInNull.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".inTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    tanInNull.position.setValue(tanInNull.position.value);
                    tanInNull.position.expression = '';

                    tanInShape.position.setValue(pathInTangents[i]);
                    tanInShape.position.expression =
                        "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                        "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".inTangents()[" + i + "]; \r" +
                        "srcLayer.toComp(srcPath);";
                    tanInShape.position.setValue(tanInNull.position.value);
                    tanInShape.position.expression = '';


                    var ptGroup = pointNull.property("ADBE Effect Parade").addProperty("ADBE Slider Control");
                    ptGroup.name = "Init Tangent Out Dist";
                    ptGroup.property("ADBE Slider Control-0001").expression =
                        "pt = thisComp.layer(\"" + ptSet[i] + "\"); \r" +
                        "tan = thisComp.layer(\"" + tanOutSet[i] + "\"); \r" +
                        "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                        "tanPos = tan.toWorld(tan.anchorPoint); \r" +
                        "l = length(ptPos, tanPos); \r" +
                        "l";
                    ptGroup.property("ADBE Slider Control-0001").setValue(ptGroup.property("ADBE Slider Control-0001").value);
                    ptGroup.property("ADBE Slider Control-0001").expression = "";

                    ///TAN OUT Expressions
                    tanOutNull.rotation.expression =
                        "pt = thisComp.layer(\"" + ptSet[i] + "\"); \r" +
                        "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                        "tanOutPos = thisLayer.toWorld(thisLayer.anchorPoint); \r" +
                        "v = tanOutPos - ptPos; \r" +
                        "r= radiansToDegrees( Math.atan2( v[1], v[0] ) ); \r" +
                        "r";
                    
                    
                    tanOutShape.rotation.expression =
                        "pt = thisComp.layer(\"" + ptSet[i] + "\"); \r" +
                        "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                        "tanOutPos = thisLayer.toWorld(thisLayer.anchorPoint); \r" +
                        "v = tanOutPos - ptPos; \r" +
                        "r= radiansToDegrees( Math.atan2( v[1], v[0] ) ); \r" +
                        "r";



                    ////TAN IN Expressions
                    var tanInTog = tanInNull.property("ADBE Effect Parade").addProperty("ADBE Checkbox Control");
                    tanInTog.name = "Constrain to Parent";
                    tanInTog.property("ADBE Checkbox Control-0001").setValue(1);
                    //set tan in position
                    tanInNull.position.expression =
                        "//linkToggle \r" +
                        "tog = effect(\"Constrain to Parent\")(\"Checkbox\"); \r" +
                        "//Set Reference Layers \r" +
                        "pt = thisComp.layer(\"" + ptSet[i] + "\"); \r" +
                        "TanOut = thisComp.layer(\"" + tanOutSet[i] + "\"); \r" +
                        "//Get Init Data \r" +
                        "InitTanOutDist = pt.effect(\"Init Tangent Out Dist\")(\"Slider\"); \r" +
                        "//Get global point position \r" +
                        "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                        "//Calculate Parent Layer Offset \r" +
                        "try { \r" +
                        "//Get tanOut Position \r" +
                        "TanOutPos = parent.toWorld(parent.anchorPoint); \r" +
                        "//Get TanOutDist \r" +
                        "TanOutDist= length(ptPos, TanOutPos); \r" +
                        "//calculate how much TanOut has grown \r" +
                        "chg = TanOutDist - InitTanOutDist; \r" +
                        "//constrain to tanOut or not \r" +
                        "if(tog == 0){y=value[1];} \r" +
                        "else{y=0;} \r" +
                        "} \r" +
                        "catch(err) { chg = 0; y = value[1];} \r" +
                        "//offset X \r" +
                        "x=value[0]-chg; \r" +
                        "//set coordinates \r" +
                        "[x,y]";
                    //set tan in rotation
                    tanInNull.rotation.expression =
                        "//Set Reference Layers \r" +
                        "pt = thisComp.layer(\"" + ptSet[i] + "\"); \r" +
                        "//Get global point position \r" +
                        "ptPos = pt.toWorld(pt.anchorPoint); \r" +
                        "//Get tanOut Position \r" +
                        "tanPos = thisLayer.toWorld(thisLayer.anchorPoint); \r" +
                        "//Get angle between Pt and tanOUt \r" +
                        "v = tanPos - ptPos; \r" +
                        "//check for Parent \r" +
                        "try { \r" +
                        "parentRotate = parent.transform.rotation; \r" +
                        "r= radiansToDegrees( Math.atan2( v[1], v[0] ) ); \r" +
                        "} \r" +
                        "catch(err) { parentRotate = 0; r=radiansToDegrees( Math.atan2( v[1], v[0] ) );} \r" +
                        "// Output degrees \r" +
                        "r-parentRotate";
                    
                    //Assign Parents
                    tanOutNull.parent = comp.layer(ptSet[i]);
                    tanInNull.parent = comp.layer(tanOutSet[i]);
                }

            }

            // Get any existing Layer Control effects
            var existingEffects = [];
            forEachEffect(selectedLayer, function (targetEffect) {
                if (matchMatchName(targetEffect, "ADBE Layer Control") != null) {
                    existingEffects.push(targetEffect.name);
                }
            });

            // Add new layer control effects for each null
            for (var n = 0; n < ptSet.length; n++) {
                if (existingEffects.join("|").indexOf(ptSet[n]) != -1) { //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(ptSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(ptSet[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = ptSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(ptSet[n]).index);
                }
            }

            for (var n = 0; n < tanInSet.length; n++) {
                if (existingEffects.join("|").indexOf(tanInSet[n]) != -1) { //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(tanInSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(tanInSet[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = tanInSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(tanInSet[n]).index);
                }
            }

            for (var n = 0; n < tanOutSet.length; n++) {
                if (existingEffects.join("|").indexOf(tanOutSet[n]) != -1) { //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(tanOutSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(tanOutSet[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = tanOutSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(tanOutSet[n]).index);
                }
            }

            // Set path expression that references nulls
            path.expression =

                "var nullPointLayerNames = [\"" + ptSet.join("\",\"") + "\"]; \r" +
                "var nullTanInLayerNames = [\"" + tanInSet.join("\",\"") + "\"]; \r" +
                "var nullTanOutLayerNames = [\"" + tanOutSet.join("\",\"") + "\"]; \r" +
                "var origPath = thisProperty; \r" +
                "var origPoints = origPath.points(); \r" +
                "var origInTang = origPath.inTangents(); \r" +
                "var origOutTang = origPath.outTangents(); \r" +
                "var getNullLayers = []; \r" +
                "var getNullIns = []; \r" +
                "var getNullOuts = []; \r" +
                "for (var i = 0; i < nullPointLayerNames.length; i++){ \r" +
                "    try{  \r" +
                "        getNullLayers.push(effect(nullPointLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
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