1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
27
28
29
30
31
32
33
34
35
36
37
38
39
40
41
42
43
44
45
46
47
48
49
50
51
52
53
54
55
56
57
58
59
60
61
62
63
64
65
66
67
68
69
70
71
72
73
74
75
76
77
78
79
80
81
82
83
84
85
86
87
88
89
90
91
92
93
94
95
96
97
98
99
100
101
102
103
104
105
106
107
108
109
110
111
112
113
114
115
116
117
118
119
120
121
122
123
124
125
126
127
128
129
130
131
132
133
134
135
136
137
138
139
140
141
142
143
144
145
146
147
148
149
150
151
152
153
154
155
156
157
158
159
160
161
162
163
164
165
166
167
168
169
170
171
172
173
174
175
176
177
178
179
180
181
182
183
184
185
186
187
188
189
190
191
192
193
194
195
196
197
198
199
200
201
202
203
204
205
206
207
208
209
210
211
212
213
214
215
216
217
218
219
220
221
222
223
224
225
226
227
228
229
230
231
232
233
234
235
236
237
238
239
240
241
242
243
244
245
246
247
248
249
250
251
252
253
254
255
256
257
258
259
260
261
262
263
264
265
266
267
268
269
270
271
272
273
274
275
276
277
278
279
280
281
282
283
284
285
286
287
288
289
290
291
292
293
294
295
296
297
298
299
300
301
302
303
304
305
306
307
308
309
310
311
312
313
314
315
316
317
318
319
320
321
322
323
324
325
326
327
328
329
330
331
332
333
334
335
336
337
338
339
340
341
342
343
344
345
346
347
348
349
350
351
352
353
354
355
356
357
358
359
360
361
362
363
364
365
366
367
368
369
370
371
372
373
374
375
376
377
378
379
380
381
382
383
384
385
386
387
388
389
390
391
392
393
394
395
396
397
398
399
400
401
402
403
404
405
406
407
408
409
410
411
412
413
414
415
416
417
418
419
420
421
422
423
424
425
426
427
428
429
430
431
432
433
434
435
436
437
438
439
440
441
442
443
444
445
446
447
448
449
450
451
452
453
454
455
456
457
458
459
460
461
462
463
464
465
466
467
468
469
470
471
472
473
474
475
476
477
478
479
480
481
482
483
484
485
486
487
488
489
490
491
492
493
494
495
496
497
498
499
500
501
502
503
504
505
506
507
508
509
510
511
512
513
514
515
516
517
518
519
/*
    Create Nulls From Paths.jsx v.0.6
    Updated 24 Oct 2017 by Nick Hill, nomagnolia.tv
    Attach nulls to shape and mask vertices, and vice-versa.
 
    Changes:
        - wraps it all in an IIFE
        - fixes call to missing method array.indexOf
*/
(function createNullsFromPaths (thisObj) {
    /* Build UI */
    function buildUI(thisObj) {
 
        var windowTitle = localize("$$$/AE/Script/CreatePathNulls/CreateNullsFromPaths=Create Nulls From Paths");
        var firstButton = localize("$$$/AE/Script/CreatePathNulls/PathPointsToNulls=Points Follow Nulls");
        var secondButton = localize("$$$/AE/Script/CreatePathNulls/NullsToPathPoints=Nulls Follow Points");
        var thirdButton = localize("$$$/AE/Script/CreatePathNulls/TracePath=Trace Path");
        var fourthButton = localize("$$$/AE/Script/CreatePathNulls/PathTangentsFollowNulls=Points and Tangents follow Nulls");
        var win = (thisObj instanceof Panel)? thisObj : new Window('palette', windowTitle);
            win.spacing = 0;
            win.margins = 4;
            var myButtonGroup = win.add ("group");
                myButtonGroup.spacing = 4;
                myButtonGroup.margins = 0;
                myButtonGroup.orientation = "row";
                win.button1 = myButtonGroup.add ("button", undefined, firstButton);
                win.button2 = myButtonGroup.add ("button", undefined, fourthButton);
                win.button3 = myButtonGroup.add ("button", undefined, secondButton);
                win.button4 = myButtonGroup.add ("button", undefined, thirdButton);
                myButtonGroup.alignment = "center";
                myButtonGroup.alignChildren = "center";
 
            win.button1.onClick = function(){
                linkPointsToNulls();
            }
            win.button2.onClick = function(){
                linkPointsAndTangentsToNulls();
            }
            win.button3.onClick = function(){
                linkNullsToPoints();
            }
            win.button4.onClick = function(){
                tracePath();
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
 
    function getPathInTangents(path){
        return path.value.inTangents;
    }
 
    function getPathOutTangents(path){
        return path.value.outTangents;
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
 
    function linkNullsToPoints(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkNullsToPathPoints=Link Nulls to Path Points");
        app.beginUndoGroup(undoGroup);
 
        forEachPath(function(comp,selectedLayer,path){
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            for (var i = 0, ii = pathPoints.length; i < ii; i++){
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
 
    function linkPointsToNulls(){
        var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsToNulls=Link Path Points to Nulls");
        app.beginUndoGroup(undoGroup);
 
        forEachPath(function(comp,selectedLayer,path){
            // Get property path to path
            var pathHierarchy = [];
            var pathPath = getPropPath(path, pathHierarchy);
            var nullSet = [];
            // Do things with the path points
            var pathPoints = getPathPoints(path);
            for (var i = 0, ii = pathPoints.length; i < ii; i++){ //For each path point
                var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
                nullSet.push(nullName);
 
                // Get names of nulls that don't exist yet and create them
                if(comp.layer(nullName) == undefined){
 
                    //Create nulls
                    var newNull = createNull(comp);
                    // Null layer name
                    newNull.name = nullName;
                    newNull.label = 11;
 
                    // Set position using layer space transforms, then remove expressions
                    newNull.position.setValue(pathPoints[i]);
                    newNull.position.expression =
                            "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                            "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                            "srcLayer.toComp(srcPath);";
                    newNull.position.setValue(newNull.position.value);
                    newNull.position.expression = '';
                    }
 
                }
 
            // Get any existing Layer Control effects
            var existingEffects = [];
            forEachEffect(selectedLayer,function(targetEffect){
                if(matchMatchName(targetEffect,"ADBE Layer Control") != null) {
                    existingEffects.push(targetEffect.name);
                }
            });
 
            // Add new layer control effects for each null
            for(var n = 0; n < nullSet.length;n++){
                if(existingEffects.join("|").indexOf(nullSet[n]) != -1){ //If layer control effect exists, relink it to null
                    selectedLayer.property("ADBE Effect Parade")(nullSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
                } else {
                    var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                    newControl.name = nullSet[n];
                    newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
                }
            }
 
            // Set path expression that references nulls
            path.expression =
                        "var nullLayerNames = [\"" + nullSet.join("\",\"") + "\"]; \r" +
                        "var origPath = thisProperty; \r" +
                        "var origPoints = origPath.points(); \r" +
                        "var origInTang = origPath.inTangents(); \r" +
                        "var origOutTang = origPath.outTangents(); \r" +
                        "var getNullLayers = []; \r" +
                        "for (var i = 0; i < nullLayerNames.length; i++){ \r" +
                        "    try{  \r" +
                        "        getNullLayers.push(effect(nullLayerNames[i])(\"ADBE Layer Control-0001\")); \r" +
                        "    } catch(err) { \r" +
                        "        getNullLayers.push(null); \r" +
                        "    }} \r" +
                        "for (var i = 0; i < getNullLayers.length; i++){ \r" +
                        "    if (getNullLayers[i] != null && getNullLayers[i].index != thisLayer.index){ \r" +
                        "        origPoints[i] = fromCompToSurface(getNullLayers[i].toComp(getNullLayers[i].anchorPoint));  \r" +
                        "    }} \r" +
                        "createPath(origPoints,origInTang,origOutTang,origPath.isClosed());";
 
        });
        app.endUndoGroup();
    }
 
    function linkPointsAndTangentsToNulls(){
      var undoGroup = localize("$$$/AE/Script/CreatePathNulls/LinkPathPointsAndTangentsToNulls=Link Path Points and Tangents to Nulls");
      app.beginUndoGroup(undoGroup);
 
      forEachPath(function(comp,selectedLayer,path){
            // get current comp and layer object
            var curComp = app.project.activeItem;
            if (!curComp || !(curComp instanceof CompItem)) {
                alert('noComp');
                return;
            }
            
        
          // Get property path to path
          var pathHierarchy = [];
          var pathPath = getPropPath(path, pathHierarchy);
          var nullSet = [];
          var nullInSet = [];
          var nullOutSet = [];
          // Do things with the path points
          var pathPoints = getPathPoints(path);
          var pathInTangents = getPathInTangents(path); // there will be two tangents for each point except the first and last, if the path's open
          var pathOutTangents = getPathOutTangents(path);
          for (var i = 0, ii = pathPoints.length; i < ii; i++){ //For each path point
              var nullName = selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "." + i + "]";
              nullSet.push(nullName);
 
              // Get names of nulls that don't exist yet and create them
              if(comp.layer(nullName) == undefined){
 
                  //Create nulls
                  var newNull = createNull(comp);
                  // Null layer name
                  newNull.name = nullName;
                  newNull.label = 11;
 
                  // Set position using layer space transforms, then remove expressions
                  newNull.position.setValue(pathPoints[i]);
                  newNull.position.expression =
                          "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                          "var srcPath = srcLayer" + pathPath + ".points()[" + i + "]; \r" +
                          "srcLayer.toComp(srcPath);";
                  newNull.position.setValue(newNull.position.value);
                  newNull.position.expression = '';
                  }
 
              }
 
          for (var i = 0, ii = pathInTangents.length; i < ii; i++){ //For each path point
              var nullName = selectedLayer.name + ": " + path.parentProperty.name + " IN [" + pathHierarchy.join(".") + "." + i + "]";
              nullInSet.push(nullName);
 
              // Get names of nulls that don't exist yet and create them
              if(comp.layer(nullName) == undefined){
 
                  //Create nulls
                  var newNull = createNull(comp);
                  // Null layer name
                  newNull.name = nullName;
                  newNull.label = 10; // purple
 
                  // Set position using layer space transforms, then remove expressions
                  newNull.position.setValue(pathInTangents[i]);
                  newNull.position.expression =
                          "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                          "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".inTangents()[" + i + "]; \r" +
                          "srcLayer.toComp(srcPath);";
                  newNull.position.setValue(newNull.position.value);
                  newNull.position.expression = '';
                  newNull.parent = comp.layer(nullSet[i]);
                  }
 
              }
          
          for (var i = 0, ii = pathOutTangents.length; i < ii; i++){ //For each path point
              var nullName = selectedLayer.name + ": " + path.parentProperty.name + " OUT [" + pathHierarchy.join(".") + "." + i + "]";
              nullOutSet.push(nullName);
 
              // Get names of nulls that don't exist yet and create them
              if(comp.layer(nullName) == undefined){
 
                  //Create nulls
                  var newNull = createNull(comp);
                  // Null layer name
                  newNull.name = nullName;
                  newNull.label = 9; // green
 
                  // Set position using layer space transforms, then remove expressions
                  newNull.position.setValue(pathOutTangents[i]);
                  newNull.position.expression =
                          "var srcLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                          "var srcPath = srcLayer" + pathPath + ".points()[" + i + "] + srcLayer" + pathPath + ".outTangents()[" + i + "]; \r" +
                          "srcLayer.toComp(srcPath);";
                  newNull.position.setValue(newNull.position.value);
                  newNull.position.expression = '';
                  newNull.parent = comp.layer(nullSet[i]);
                  }
 
              }
 
          // Get any existing Layer Control effects
          var existingEffects = [];
          forEachEffect(selectedLayer,function(targetEffect){
              if(matchMatchName(targetEffect,"ADBE Layer Control") != null) {
                  existingEffects.push(targetEffect.name);
              }
          });
 
          // Add new layer control effects for each null
          for(var n = 0; n < nullSet.length;n++){
              if(existingEffects.join("|").indexOf(nullSet[n]) != -1){ //If layer control effect exists, relink it to null
                  selectedLayer.property("ADBE Effect Parade")(nullSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
              } else {
                  var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                  newControl.name = nullSet[n];
                  newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullSet[n]).index);
              }
          }
 
          for(var n = 0; n < nullInSet.length;n++){
              if(existingEffects.join("|").indexOf(nullInSet[n]) != -1){ //If layer control effect exists, relink it to null
                  selectedLayer.property("ADBE Effect Parade")(nullInSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullInSet[n]).index);
              } else {
                  var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                  newControl.name = nullInSet[n];
                  newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullInSet[n]).index);
              }
          }
      
        for(var n = 0; n < nullOutSet.length;n++){
              if(existingEffects.join("|").indexOf(nullOutSet[n]) != -1){ //If layer control effect exists, relink it to null
                  selectedLayer.property("ADBE Effect Parade")(nullOutSet[n]).property("ADBE Layer Control-0001").setValue(comp.layer(nullOutSet[n]).index);
              } else {
                  var newControl = selectedLayer.property("ADBE Effect Parade").addProperty("ADBE Layer Control");
                  newControl.name = nullOutSet[n];
                  newControl.property("ADBE Layer Control-0001").setValue(comp.layer(nullOutSet[n]).index);
              }
          }
 
          // Set path expression that references nulls
          path.expression =
                      
                    "var nullPointLayerNames = [\"" + nullSet.join("\",\"") + "\"]; \r" +
                    "var nullTanInLayerNames = [\"" + nullInSet.join("\",\"") + "\"]; \r" +
                    "var nullTanOutLayerNames = [\"" + nullOutSet.join("\",\"") + "\"]; \r" +
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
 
    function tracePath(){
    var undoGroup = localize("$$$/AE/Script/CreatePathNulls/CreatePathTracerNull=Create Path Tracer Null");
    app.beginUndoGroup(undoGroup);
 
    var sliderName = localize("$$$/AE/Script/CreatePathNulls/TracerTiming=Tracer Timing");
    var checkboxName = localize("$$$/AE/Script/CreatePathNulls/LoopTracer=Loop Tracer");
 
    forEachPath(function(comp,selectedLayer,path){
        var pathHierarchy = [];
        var pathPath = getPropPath(path, pathHierarchy);
 
        // Create tracer null
        var newNull = createNull(comp);
 
        // Add expression control effects to the null
        var nullControl = newNull.property("ADBE Effect Parade").addProperty("Pseudo/ADBE Trace Path");
        nullControl.property("Pseudo/ADBE Trace Path-0002").setValue(true);
        nullControl.property("Pseudo/ADBE Trace Path-0001").setValuesAtTimes([0,1],[0,100]);
        nullControl.property("Pseudo/ADBE Trace Path-0001").expression =
                    "if(thisProperty.propertyGroup(1)(\"Pseudo/ADBE Trace Path-0002\") == true && thisProperty.numKeys > 1){ \r" +
                    "thisProperty.loopOut(\"cycle\"); \r" +
                    "} else { \r" +
                    "value \r" +
                    "}";
        newNull.position.expression =
                "var pathLayer = thisComp.layer(\"" + selectedLayer.name + "\"); \r" +
                "var progress = thisLayer.effect(\"Pseudo/ADBE Trace Path\")(\"Pseudo/ADBE Trace Path-0001\")/100; \r" +
                "var pathToTrace = pathLayer" + pathPath + "; \r" +
                "pathLayer.toComp(pathToTrace.pointOnPath(progress));";
        newNull.rotation.expression =
                "var pathToTrace = thisComp.layer(\"" + selectedLayer.name + "\")" + pathPath + "; \r" +
                "var progress = thisLayer.effect(\"Pseudo/ADBE Trace Path\")(\"Pseudo/ADBE Trace Path-0001\")/100; \r" +
                "var pathTan = pathToTrace.tangentOnPath(progress); \r" +
                "radiansToDegrees(Math.atan2(pathTan[1],pathTan[0]));";
        newNull.name = "Trace " + selectedLayer.name + ": " + path.parentProperty.name + " [" + pathHierarchy.join(".") + "]";
        newNull.label = 10;
 
    });
    app.endUndoGroup();
    }
 
})(this);