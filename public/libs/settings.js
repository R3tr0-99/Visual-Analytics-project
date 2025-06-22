if (window.system == undefined) window.system = {}
system.settings = (function () {
    const that = this;


    this.perfect_selected = false;
    this.quantile_selected = false;
    this.cluster_selected = false;
    this.indipendent_selected = false;
    this.radvizplusplus_selected = false;

    this.color_selected = false;

    this.max_quantile_value = -1;
    this.max_cluster_quantile_value = -1;

    this.max_quantile_label = null;
    this.max_cluster_quantile_label = null;

    this.max_quantile_label_dimensions = null;
    this.max_cluster_quantile_label_dimensions = null;

    this.indipendent_mean = null;
    this.radvizplusplus_mean = null;

    this.quantile_DBI = null;
    this.cluster_DBI = null;
    this.indipendent_DBI = null;
    this.radvizplusplus_DBI = null;
    this.perfect_DBI = null;
    this.value_DBI = null;

    this.quantile_global_quality = null;
    this.indipendent_global_quality = null;
    this.radvix_plus_plus_global_quality = null;
    this.value_global_quality = null;

    this.selected_dataset_option = '';

    this.baseAttributesIntervals = {}
    this.attributesIntervals = {}

    this.usingCustomMinMax = false

    this.stopCustomizedMinMax = (isUpload) => {
        this.usingCustomMinMax = false
        document.getElementById('stop_custom_minmax').remove()

        this.attributesIntervals = this.baseAttributesIntervals
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset, name_temp
        if (isUpload) {
            name_dataset = document.querySelector('#uploaded-dataset option:checked').value;
            name_temp = name_dataset
        }
        else {
            name_dataset = document.querySelector('#select-dataset option:checked').value;
            name_temp = system.data.LINK_SERVER + 'data/' + name_dataset + '.csv'
        }
        d3_radviz.remove(true);
        system.data.nameDataset = name_dataset
        system.settings.choiceDimensionsNewDataset(null, name_temp, 'custom', isUpload)
    }
    this.useCustomMinMax = (isUpload) => {
        if (!this.usingCustomMinMax) {
            let btn_reset = document.createElement('button')
            //<button type="button" class="btn btn-secondary" data-dismiss="modal">Update <br>min & max</button>
            btn_reset.setAttribute('type', 'button')
            btn_reset.setAttribute('id', 'stop_custom_minmax')

            btn_reset.setAttribute('class', 'btn btn-secondary')
            //btn_reset.setAttribute('data-dismiss', 'modal')
            if (isUpload) {
                btn_reset.setAttribute('onclick', 'system.settings.stopCustomizedMinMax(true)')
            }
            else {
                btn_reset.setAttribute('onclick', 'system.settings.stopCustomizedMinMax()')
            }
            btn_reset.innerHTML = "Reset <br> min & max"
            document.getElementById('modal-footer_settings-panel').appendChild(btn_reset)
        }
        this.usingCustomMinMax = true
        this.updateMinMax_Button_pressed(isUpload)
    }
    this.updateMinMax_Button_pressed = (isUpload) => {
        system.data.dime.forEach(attr => {
            this.setCustomAttributesIntervals(attr)
        })
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset, name_temp
        if (isUpload) {
            name_dataset = document.querySelector('#uploaded-dataset option:checked').value;
            name_temp = name_dataset
        }
        else {
            name_dataset = document.querySelector('#select-dataset option:checked').value;
            name_temp = system.data.LINK_SERVER + 'data/' + name_dataset + '.csv'
        }
        d3_radviz.remove(true);
        system.data.nameDataset = name_dataset
        system.settings.choiceDimensionsNewDataset(null, name_temp, 'custom', isUpload)
        //system.settings.updateRadviz('heuristic', d3.radvizDA.minEffectivenessErrorHeuristic(d3_radviz.data()))

    }

    this.setBaseAttributesIntervals = (attr, min, max) => {
        this.baseAttributesIntervals[attr] = { 'min': min, 'max': max }
        this.attributesIntervals = this.baseAttributesIntervals
        //let min_el = document.getElementById('minInput_' + attr)
        //min_el.setAttribute('value', min)
        //let max_el = document.getElementById('maxInput_' + attr)
        //max_el.setAttribute('value', max)

    }
    this.setCustomAttributesIntervals = (attr) => {
        this.usingCustomMinMax = true
        this.attributesIntervals[attr].min = document.getElementById('minInput_' + attr).value
        this.attributesIntervals[attr].max = document.getElementById('maxInput_' + attr).value

    }
    /*
    this.updateMinMax = (attr, val) => {
        if (val < this.baseAttributesIntervals[attr].min) {
            this.baseAttributesIntervals[attr].min = val
        }
        if (val > this.baseAttributesIntervals[attr].max) {
            this.baseAttributesIntervals[attr].max = val
        }
    }*/
    this.cleanVisualization = () => {
        system.structure.removeElementsByClass("attributes_ul")

        system.structure.removeElementsByClass("label_classification");
        system.structure.removeElementsByClass("checkbox_classification");

        d3.select("#btn_quantile").attr("class", "btn_style");
        d3.select("#btn_cluster").attr("class", "btn_style");

    };

    this.resetVariables = () => {
        this.perfect_selected = false;
        this.quantile_selected = false;
        this.cluster_selected = false;
        this.max_quantile_value = -1;
        this.max_cluster_quantile_value = -1;

        $('button').removeClass('active');
        $('#effectiveness-radio').prop('checked', true)

    }

    this.updateClassificationAttribute = (attr, isUpload) => {
        let classification = d3.select(attr).attr("value")
        classification_selected = d3.select(attr).attr("value")
        d3_radviz.setColorClassification(d3.select(attr).attr("value"))

        if (!ORIGINAL_CLASSIFIED) {
            system.data.dime.forEach(function (dim, i) {
                if (dim == classification) {
                    document.getElementById("check_attr" + i).checked = false;
                    document.getElementById("radio_attr" + i).checked = true;
                }
            })
            system.settings.removeDimDataset(d3.select("#check_attr" + system.data.dime.indexOf(classification))._groups[0][0], 'radio', isUpload)
        }

        name_attr = classification_selected
    }
/*
    this.updateClassificationAttributeUpload = (attr) => {

        let classification = d3.select(attr).attr("value")
        classification_selected = d3.select(attr).attr("value")
        d3_radviz.setColorClassification(d3.select(attr).attr("value"))

        if (!ORIGINAL_CLASSIFIED) {
            system.data.dime.forEach(function (dim, i) {
                if (dim == classification) {
                    document.getElementById("check_attr" + i).checked = false;
                    document.getElementById("radio_attr" + i).checked = true;
                }
            })
        }

        system.settings.removeDimDatasetUploaded(d3.select("#check_attr" + system.data.dime.indexOf(classification))._groups[0][0], 'radio')
        name_attr = classification_selected
    }
*/
    this.newDataset = async function (loadfile, nameDataset, isUpload) {


        d3_radviz = d3.radviz()

        DATASET_NAME = nameDataset
        dimensions_removed = []
        attr_removed = []

        let dataset, load_file_name_temp
        if (isUpload) {
            dataset = (d3.csvParse(system.uploadedfile.readDataUploaded(nameDataset)))
            name_attr = ''
            load_file_name_temp = nameDataset
        }
        else {
            dataset = await d3.csv(loadfile)
            if (DATASET_NAME.indexOf('(') > 0) {
                name_attr = DATASET_NAME.substring(DATASET_NAME.indexOf('(') + 1, DATASET_NAME.indexOf(')'));
                ORIGINAL_CLASSIFIED = true
            }
            load_file_name_temp = system.data.LINK_SERVER + "data/" + nameDataset + ".csv"
        }
        //d3.csv(loadfile).then(dataset => {

        d3_radviz.data(dataset, name_attr)
        if (d3_radviz.data().attributes.length != 0) {
            name_attr = d3_radviz.data().attributes[0].id
            d3_radviz.setColorClassification()
            d3_radviz.setColorClassification(name_attr)
            ORIGINAL_CLASSIFIED = true

        } else if (!isUpload && DATASET_NAME.indexOf('(') > 0) {
            name_attr = DATASET_NAME.substring(DATASET_NAME.indexOf('(') + 1, DATASET_NAME.indexOf(')'));
            d3_radviz.setColorClassification(name_attr);
            ORIGINAL_CLASSIFIED = true

        } else {
            ORIGINAL_CLASSIFIED = false
        }

        system.data.load(load_file_name_temp, nameDataset, isUpload);
        system.structure.initializePie();
        system.structure.initializePieAxes(d3_radviz.data().angles);
        system.structure.initializeRepOverlay(d3_radviz.data().angles);



        let f_context_menu = function (_) {
            system.structure.initializePieAxes(_);
        }
        let f_click = function (a, b, c) {
            system.structure.uploadProgressBar();

        }

        let f_drag_end = function (a) {
            system.structure.initializePieAxes(a);
            system.structure.drawboxplot(d3_radviz.data().entries.map(d => d.errorE));

        }

        let f_mouse_over = function (a, b) {    //a = dimensions, b = hovered point
            system.representative.focusPoint(b)
            system.pie.drawPie(a, b);
            /*
            var div = d3.select(".tooltip")
            div.transition()
                .duration(200)
                .style("opacity", .9)

                .delay(500);
            div.html("(" + b.x1.toFixed(2) + "," + b.x2.toFixed(2) + ")<br> EE: " + b.errorE.toFixed(2))
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px")
                .style("color", "white")
                .style("background", "black")*/
        }

        let f_mouse_out = function () {
            system.representative.stopFocus()
            system.pie.resetPie()
            var div = d3.select(".tooltip")
            div.transition()
                .duration(50)
                .style("opacity", 0);

        }

        let results1 = function (error_value) {

            document.getElementById('menu1').innerHTML = ' <b>Effectiveness Error</b>: ' + error_value.toFixed(4)

            /* TEST FUNZIONI METRICHE*/

            system.settings.addOtherMetrics();

            /* --- */
        }
        d3_radviz.setFunctionUpdateResults(results1)
        d3_radviz.setFunctionClick(f_click)
        d3_radviz.setFunctionMouseOver(f_mouse_over)
        d3_radviz.setFunctionMouseOut(f_mouse_out)
        d3_radviz.setFunctionDragEnd(f_drag_end)
        d3_radviz.setFunctionContextMenu(f_context_menu)

        system.structure.legenda_cluster(Array.from(new Set(d3_radviz.data().attributes.filter(function (pilot) {
            return pilot.id === name_attr
        }).map(d => d.values)[0])))
        const set = d3_radviz.data().dimensions.map(d => d.values)
        d3.select('#container').call(d3_radviz);
        system.structure.drawboxplot(d3_radviz.data().entries.map(d => d.errorE));
        system.structure.uploadProgressBar();
        system.settings.updateRadviz('heuristic', d3.radvizDA.minEffectivenessErrorHeuristic(d3_radviz.data()))

        //})
    }

    this.addOtherMetrics = function () {
        let metrics = new RadVizMetrics(d3_radviz)
        if (d3.select("#oth-metrics").property('checked')) {
            if (isNaN(metrics.dbindex())) {
                document.getElementById('metric-value').innerHTML = "  <b>Projection Error COS</b>: " + metrics.projectionError("cosine").toFixed(4) +
                    "<br>  <b>Clumping50</b>: " + metrics.clumping50().toFixed(4)
            } else {
                document.getElementById('metric-value').innerHTML = "  <b>Projection Error COS</b>: " + metrics.projectionError("cosine").toFixed(4) +
                    "<br>  <b>Clumping50</b>: " + metrics.clumping50().toFixed(4) +
                    "<br>  <b>DB index</b>: " + metrics.dbindex().toFixed(4)
            }
        } else {
            document.getElementById('metric-value').innerHTML = ""
        }
    }

    this.deselectPoints = function () {

        d3.selectAll('.data_point-' + d3_radviz.getIndex())
            .each(function (d) {
                d.selected = false;
            })
            .style("stroke-width", '0.2')
        system.structure.uploadProgressBar();
    }
/*
    this.newDataset_upload = function (loadfile, nameDataset) {
        d3_radviz = d3.radviz()



        let dataset = d3.csvParse(system.uploadedfile.readDataUploaded(nameDataset))
        DATASET_NAME = nameDataset
        dimensions_removed = []
        name_attr = ''

        d3_radviz.data(dataset)
        if (d3_radviz.data().attributes.length != 0) {
            name_attr = d3_radviz.data().attributes[0].id
            d3_radviz.setColorClassification(name_attr)
            ORIGINAL_CLASSIFIED = true
        } else {
            ORIGINAL_CLASSIFIED = false
        }


        //system.data.load_upload(loadfile, nameDataset);
        system.data.load(loadfile, nameDataset, true);
        system.structure.initializePie();

        system.structure.initializePieAxes(d3_radviz.data().angles);
        system.structure.initializeRepOverlay(d3_radviz.data().angles);


        let f_context_menu = function (_) {
            system.structure.initializePieAxes(_);
        }
        let f_click = function (a, b, c) {
            system.structure.uploadProgressBar();
        }

        let f_drag_end = function (a) {
            system.structure.initializePieAxes(a);
            system.structure.drawboxplot(d3_radviz.data().entries.map(d => d.errorE));
        }

        let f_mouse_over = function (a, b) {
            system.representative.focusPoint(b)
            system.pie.drawPie(a, b);
            
        }

        let f_mouse_out = function () {
            system.representative.stopFocus()
            system.pie.resetPie()

            var div = d3.select(".tooltip")
            div.transition()
                .duration(50)
                .style("opacity", 0);
        }

        let results1 = function (error_value) {

            document.getElementById('menu1').innerHTML = ' <b>Effectiveness Error</b>: ' + error_value.toFixed(4)

            // TEST FUNZIONI METRICHE

            system.settings.addOtherMetrics();

            
        }
        d3_radviz.setFunctionClick(f_click)
        d3_radviz.setFunctionMouseOver(f_mouse_over)
        d3_radviz.setFunctionMouseOut(f_mouse_out)
        d3_radviz.setFunctionDragEnd(f_drag_end)
        d3_radviz.setFunctionContextMenu(f_context_menu)
        d3_radviz.setFunctionUpdateResults(results1)

        system.structure.legenda_cluster(Array.from(new Set(d3_radviz.data().attributes.filter(function (pilot) {
            return pilot.id === name_attr
        }).map(d => d.values)[0])))
        const set = d3_radviz.data().dimensions.map(d => d.values)
        d3.select('#container').call(d3_radviz);
        system.structure.drawboxplot(d3_radviz.data().entries.map(d => d.errorE));
        system.structure.uploadProgressBar();
        system.settings.updateRadviz('heuristic', d3.radvizDA.minEffectivenessErrorHeuristic(d3_radviz.data()))
    }
*/
    this.choiceDimensionsNewDataset = async function (d, dat, but, isUpload) {
        let currentdataset
        if (isUpload) {
            currentdataset = (d3.csvParse(system.uploadedfile.readDataUploaded(dat)))
        }
        else {
            currentdataset = await d3.csv(dat)
        }
        //d3.csv(dat).then(currentdataset => {
        if (but == 'check') {
            if (!d.checked) {
                if (dimensions_removed.indexOf(d.value) == -1) {
                    dimensions_removed.push(d.value);
                }
            } else {

                let indx = dimensions_removed.indexOf(d.value)
                if (indx > -1)
                    dimensions_removed.splice(indx, 1)
                else
                    attr_removed = []

                let ind_clas = attr_removed.indexOf(d.value)
                if (ind_clas > -1) {
                    attr_removed = []
                }


            }


        }
        if (but == 'radio') {


            if (attr_removed.indexOf(d.value) > -1) attr_removed = []
            else attr_removed = [d.value]

        }

        currentdataset.forEach(element => {
            dimensions_removed.forEach(dd => {
                if (attr_removed.indexOf(dd) == -1) {
                    delete currentdataset.columns[currentdataset.columns.indexOf(dd)]
                    delete element[dd];
                }
            })
        });

        if (but == 'custom') {
            d3_radviz.data(currentdataset, name_attr)
            d3_radviz.setColorClassification(name_attr)
            system.data.load(dat, DATASET_NAME, isUpload);
        }
        if (but == 'check') {

            if (isUpload) {
                if (attr_removed != []) {
                    name_attr = attr_removed[0]
                    d3_radviz.data(currentdataset, name_attr)
                    d3_radviz.setColorClassification(name_attr)
                    system.data.load(dat, DATASET_NAME, isUpload);

                } else if (d3_radviz.data().attributes.length != 0) {

                    name_attr = d3_radviz.data().attributes[0].id
                    d3_radviz.setColorClassification()
                    d3_radviz.setColorClassification(name_attr)
                    d3_radviz.data(currentdataset, name_attr)
                    system.data.load(dat, DATASET_NAME, isUpload);
                } else {
                    d3_radviz.data(currentdataset)
                    system.data.load(dat, DATASET_NAME, isUpload);
                }
            }

            else {
                if (DATASET_NAME.indexOf('(') != -1) {
                    name_attr = DATASET_NAME.substring(DATASET_NAME.indexOf('(') + 1, DATASET_NAME.length - 1)

                    d3_radviz.data(currentdataset, name_attr)
                    d3_radviz.setColorClassification(name_attr)
                    system.data.load(dat, DATASET_NAME, isUpload);
                } else if (attr_removed != []) {
                    name_attr = attr_removed[0]
                    d3_radviz.data(currentdataset, name_attr)
                    d3_radviz.setColorClassification(name_attr)
                    system.data.load(dat, DATASET_NAME, isUpload);

                } else if (d3_radviz.data().attributes.length != 0) {

                    name_attr = d3_radviz.data().attributes[0].id
                    d3_radviz.setColorClassification()
                    d3_radviz.setColorClassification(name_attr)
                    d3_radviz.data(currentdataset, name_attr)
                    system.data.load(dat, DATASET_NAME, isUpload);
                } else {
                    d3_radviz.data(currentdataset)
                    system.data.load(dat, DATASET_NAME, isUpload);
                }
            }
        }
        if (but == 'radio') {

            name_attr = d.value

            d3_radviz.data(currentdataset, name_attr)
            d3_radviz.setColorClassification(name_attr)
            system.data.load(dat, DATASET_NAME, isUpload);
        }
        /*
                if (isUpload) {
                    name_attr = DATASET_NAME.substring(DATASET_NAME.indexOf('(') + 1, DATASET_NAME.length - 1)
                    d3_radviz.setColorClassification(name_attr)
                }
        */

        system.structure.initializePie();
        system.structure.initializePieAxes(d3_radviz.data().angles);
        system.structure.initializeRepOverlay(d3_radviz.data().angles);



        let f_context_menu = function (_) {
            system.structure.initializePieAxes(_);
        }
        let f_click = function (a, b, c) {
            system.structure.uploadProgressBar();
        }

        let f_drag_end = function (a) {
            system.structure.initializePieAxes(a);
        }

        let f_mouse_over = function (a, b) {
            system.representative.focusPoint(b)
            system.pie.drawPie(a, b);
        }

        let f_mouse_out = function () {
            system.representative.stopFocus()
            system.pie.resetPie()

            var div = d3.select(".tooltip")
            div.transition()
                .duration(50)
                .style("opacity", 0);
        }
        d3_radviz.setFunctionClick(f_click);
        d3_radviz.setFunctionMouseOver(f_mouse_over);
        d3_radviz.setFunctionMouseOut(f_mouse_out);
        d3_radviz.setFunctionDragEnd(f_drag_end);
        d3_radviz.setFunctionContextMenu(f_context_menu);

        system.structure.legenda_cluster(Array.from(new Set(d3_radviz.data().attributes.filter(function (pilot) {
            return pilot.id === name_attr
        }).map(d => d.values)[0])))
        const set = d3_radviz.data().dimensions.map(d => d.values)
        d3.select('#container').call(d3_radviz);
        system.structure.uploadProgressBar();
        system.settings.updateRadviz('heuristic', d3.radvizDA.minEffectivenessErrorHeuristic(d3_radviz.data()))


        //})
    }
/*
    this.choiceDimensionsNewDataset_upload = function (d, dat, but) {


        let dataset = d3.csvParse(system.uploadedfile.readDataUploaded(dat))


        if (but == 'check') {
            if (!d.checked) {
                if (dimensions_removed.indexOf(d.value) == -1) {
                    dimensions_removed.push(d.value);
                }
            } else {

                let indx = dimensions_removed.indexOf(d.value)
                if (indx > -1)
                    dimensions_removed.splice(indx, 1)
                else
                    attr_removed = []

                let ind_clas = attr_removed.indexOf(d.value)
                if (ind_clas > -1) {
                    attr_removed = []
                }


            }


        }
        if (but == 'radio') {
            if (attr_removed.indexOf(d.value) > -1) attr_removed = []
            else attr_removed = [d.value]

        }

        dataset.forEach(element => {
            dimensions_removed.forEach(dd => {
                if (attr_removed.indexOf(dd) == -1) {
                    delete dataset.columns[dataset.columns.indexOf(dd)]
                    delete element[dd];
                }
            })
        });


        if (but == 'check') {


            if (attr_removed != []) {
                name_attr = attr_removed[0]
                d3_radviz.data(dataset, name_attr)
                d3_radviz.setColorClassification(name_attr)
                system.data.load(dat, DATASET_NAME);

            } else if (d3_radviz.data().attributes.length != 0) {

                name_attr = d3_radviz.data().attributes[0].id
                d3_radviz.setColorClassification()
                d3_radviz.setColorClassification(name_attr)
                d3_radviz.data(dataset, name_attr)
                system.data.load(dat, DATASET_NAME);
            } else {
                d3_radviz.data(dataset)
                system.data.load(dat, DATASET_NAME);
            }

        }
        if (but == 'radio') {

            name_attr = d.value

            d3_radviz.data(dataset, name_attr)
            d3_radviz.setColorClassification(name_attr)
            system.data.load(dat, DATASET_NAME);
        }


        name_attr = DATASET_NAME.substring(DATASET_NAME.indexOf('(') + 1, DATASET_NAME.length - 1)
        d3_radviz.setColorClassification(name_attr)
        //system.data.load_upload(dat, DATASET_NAME);
        system.data.load(dat, DATASET_NAME, true);

        system.structure.initializePie();

        system.structure.initializePieAxes(d3_radviz.data().angles);
        system.structure.initializeRepOverlay(d3_radviz.data().angles);



        let f_context_menu = function (_) {
            system.structure.initializePieAxes(_);
        }
        let f_click = function (a, b, c) {
            system.structure.uploadProgressBar();

        }

        let f_drag_end = function (a) {
            system.structure.initializePieAxes(a);

        }

        let f_mouse_over = function (a, b) {
            system.representative.focusPoint(b)
            system.pie.drawPie(a, b);

        }

        let f_mouse_out = function () {
            system.representative.stopFocus()
            system.pie.resetPie()

            var div = d3.select(".tooltip")
            div.transition()
                .duration(50)
                .style("opacity", 0);
        }
        d3_radviz.setFunctionClick(f_click)
        d3_radviz.setFunctionMouseOver(f_mouse_over)
        d3_radviz.setFunctionMouseOut(f_mouse_out)
        d3_radviz.setFunctionDragEnd(f_drag_end)
        d3_radviz.setFunctionContextMenu(f_context_menu)

        system.structure.legenda_cluster(Array.from(new Set(d3_radviz.data().attributes.filter(function (pilot) {
            return pilot.id === name_attr
        }).map(d => d.values)[0])))
        const set = d3_radviz.data().dimensions.map(d => d.values)
        d3.select('#container').call(d3_radviz);
        system.structure.uploadProgressBar();



    }
*/
    this.initializeDB = (isUpload) => {
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset, name_temp

        if (isUpload) {
            name_dataset = document.querySelector('#uploaded-dataset option:checked').value
            name_temp = name_dataset
        }
        else {
            name_dataset = document.querySelector('#select-dataset option:checked').value
            name_temp = system.data.LINK_SERVER + 'data/' + name_dataset + '.csv'
        }
        d3_radviz.remove(true);
        system.data.nameDataset = name_dataset

        system.settings.newDataset(name_temp, name_dataset, isUpload);



    }
/*
    this.initializeDBUploaded = () => {
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset = document.querySelector('#uploaded-dataset option:checked').value

        d3_radviz.remove(true);

        system.data.nameDataset = name_dataset
        system.settings.newDataset_upload(name_dataset, name_dataset)
    }
*/
    this.removeDimDataset = (d, but, isUpload) => {
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset, name_temp
        if (isUpload) {
            name_dataset = document.querySelector('#uploaded-dataset option:checked').value;
            name_temp = name_dataset
        }
        else {
            name_dataset = document.querySelector('#select-dataset option:checked').value;
            name_temp = system.data.LINK_SERVER + 'data/' + name_dataset + '.csv'
        }
        d3_radviz.remove(true);
        system.data.nameDataset = name_dataset
        system.settings.choiceDimensionsNewDataset(d, name_temp, but, isUpload)
    }
/*
    this.removeDimDatasetUploaded = (d, but) => {
        system.data.original_dimensions = '';
        system.settings.cleanVisualization();
        system.settings.resetVariables();

        let name_dataset = document.querySelector('#uploaded-dataset option:checked').value;
        d3_radviz.remove(true);

        system.data.nameDataset = name_dataset
        system.settings.choiceDimensionsNewDataset_upload(d, name_dataset, but)
    }

    this.redraw = () => {

    }
    this.start = () => {


        system.structure.initializeSVG();
        system.data.initializeScale();
        system.structure.initializePie();

        system.radviz.initializeGrid();
        system.radviz.disegnapuntiedimensioni();
        let tot_distance = 0;

        system.data.points.forEach((p) => {
            system.radviz.calculatePerfectPointDisposition(p, system.data.dimensions_current);
            tot_distance = tot_distance + system.radviz.calculateDistanceDimensions(system.data.dimensions_current, p.order);
        });

        let clusters_array = system.data.points.map((d) => { return d[system.data.cluster_label[system.data.nameDataset]] });

        system.radviz.calculateInformation(system.data.points, system.data.dimensions_current);
        system.structure.initializePieAxes(system.data.dimensions_current);
        system.structure.legenda_cluster(clusters_array);

        system.structure.initializeRepOverlay(d3_radviz.data().angles);

    }

*/
    this.resetVisualization = function () {

        $('button').removeClass('active');
        system.settings.initializeDB(!(document.querySelector('#select-dataset option:checked').value != ''))
        /*if (document.querySelector('#select-dataset option:checked').value != '') {
            system.settings.initializeDB(false);
        } else {
            system.settings.initializeDB(true);
        }
        */
        system.structure.uploadProgressBar();
    }

    this.updateRadviz = function (butt, _) {
        $('button').removeClass('active');
        $('#' + butt).addClass('active');
        if (_ == undefined)
            d3_radviz.updateRadviz();
        else
            d3_radviz.updateRadviz(_);

        system.structure.initializePieAxes(d3_radviz.data().angles);
        system.structure.drawboxplot(d3_radviz.data().entries.map(d => d.errorE));
        system.structure.initializeRepOverlay(d3_radviz.data().angles);

    }

    return this;
}).call({})