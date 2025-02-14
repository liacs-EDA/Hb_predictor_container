var old_unit = "gperl";
var interval_id;
var running = false;
var computed = [];

function convert_hb_unit(from, to, hb) {
    hb = parseFloat(hb);
    console.log(`In convert_hb_unit: from="${from}" to="${to}" hb="${hb}"`);
    if (from == to) {
	return(hb);
    }  else if (from=="gperl" && to=="gperdl") {
	return(hb/10.0);
    }  else if (from=="gperl" && to == "mmolperl") {
	return(hb * 0.01551 * 4);
    }  else if (from=="gperdl" && to == "gperl") {
	return(hb*10.0);
    }  else if (from=="gperdl" && to == "mmolperl") {
	return(hb * 10.0 * 0.01551 * 4);
    }  else if (from=="mmolperl" && to == "gperl") {
	return(hb / (0.01551 * 4));
    }  else if (from=="mmolperl" && to == "gperdl") {
	return(hb / (0.01551 * 4) / 10.0);
    } else {
	console.log("Unsupported units");
    }
}

function handle_hb_unit(e) {
    v = e.srcElement.value;
    console.log("Hb unit changed from " + old_unit + " to " + v);
    em = document.getElementById("Hb_cutoff_male");
    ef = document.getElementById("Hb_cutoff_female");
    em.value = convert_hb_unit(old_unit, v, em.value);
    ef.value = convert_hb_unit(old_unit, v, ef.value);
    old_unit = v;
}

function set_hb_unit(unit_string) {
    unit = document.getElementById("unit");
    unit.value = unit_string; // Because Sanquin is the default input format, set this to its unit
    unit.dispatchEvent(new Event('change', { 'bubbles': true }));  // trigger the change event
}

// Some parts of the UI are shown only under certain conditions.
function show_and_enable(e) {
    e.style.display = "table-row";
    e.querySelector("input").disabled = false;
}

function hide_and_disable(e) {
    e.style.display = "none";
    e.querySelector("input").disabled = true;
}

function handle_input_format(e) {
    value = document.querySelector('input[name="input_format"]:checked').value;
    e1 = document.getElementById("donations_row");
    e2 = document.getElementById("donors_row");
    e3 = document.getElementById("donor_specific_row");
    e4 = document.getElementById("preprocessed_row");
    e5 = document.getElementById("max_diff_date_first_donation_row");
    
    if (value == "FRCBS") {
	set_hb_unit("gperl");
	show_and_enable(e1);
	show_and_enable(e2);
	show_and_enable(e3);
	hide_and_disable(e4);
	hide_and_disable(e5);
    } else if (value == "Sanquin") {
	set_hb_unit("gperdl");
	show_and_enable(e1);
	show_and_enable(e2);
	hide_and_disable(e3);
	hide_and_disable(e4);
	hide_and_disable(e5);

    } else {
	set_hb_unit("gperl");
	hide_and_disable(e1);
	hide_and_disable(e2);
	hide_and_disable(e3);
	show_and_enable(e4);
	hide_and_disable(e5);
    }
    
    console.log("Fieldset clicked: " + value);
}

function handle_hyperparameters(e) {
    console.log("In handle_hyperparameters");
    //value = document.querySelector('input[name="hyperparameters"]:checked').value;
    value = e.srcElement.value;
    e1 = document.getElementById("hyperparameter_file_row");
    if (value == "upload") {
	show_and_enable(e1);
    } else {
	hide_and_disable(e1);
    }
    console.log("Hyperparameter select clicked: " + value);
}


function handle_keypress(e) {
    console.log("In handle_keypress");
    //`You pressed ${e.key}`
    console.log("Key " + e.key + " was pressed");
    s = document.getElementById("submit")
    // If Esc was pressed, make the submit button active again.
    if (e.key == "Escape" && ! running) {
	s.disabled = false;
    }
}

document.onreadystatechange = function() {
    console.log("Executing Javascript");
    

    
    //<label for="lmm">
    //<input type="checkbox" value="on", id="lmm" name="lmm" />
    //Linear mixed model
    //</label>
    if (document.readyState == "complete") {
	
	////////////////////////////////////////////
	// Show tick boxes for predictive variables.
	////////////////////////////////////////////
	
	// Predictive variables
	dvs = ["days_to_previous_fb", "age", "previous_Hb_def", "year",                 
	       "warm_season", "consecutive_deferrals", "recent_donations", "recent_deferrals",     
	       "hour", "previous_Hb", "Hb_first", "sex", "nb_donat"]  ;
	el = document.getElementById("predictive-variables");
	for (i=0; i < dvs.length; ++i) {
	    l = document.createElement('label');
	    l.setAttribute("for", dvs[i]);
	    inp = document.createElement('input');
	    inp.setAttribute("type", "checkbox");
	    inp.setAttribute("value", "on");
	    if (dvs[i] != "nb_donat" && dvs[i] != "year") 
		inp.checked = true;
	    else
		inp.checked = false;
	    inp.setAttribute("id", "id_"+dvs[i]);
	    inp.setAttribute("name", "dv_"+dvs[i]);
	    l.appendChild(inp);
	    l.appendChild(document.createTextNode(dvs[i]));
	    el.appendChild(l);
	}
	
	//////////////////////
	// Set event handlers.
	//////////////////////
	
	console.log("Setting handleButtonPress");
	document.getElementById("submit").onclick = handleButtonPress;
	document.getElementById("FRCBS").onchange = handle_input_format;
	document.getElementById("Sanquin").onchange = handle_input_format;
	document.getElementById("Preprocessed").onchange = handle_input_format;
	document.getElementById("unit").onchange = handle_hb_unit;
	document.getElementById("hyperparameters").onchange = handle_hyperparameters;

	window.addEventListener('keydown', handle_keypress, false);
	
	el = document.getElementById("unit");
	el.value="gperdl"; // Because Sanquin is the default input format, set this to its unit
	el.dispatchEvent(new Event('change', { 'bubbles': true }));  // trigger the change event

	// Ask for verification before navigating away from the page
	window.onbeforeunload = function() {
	    return true;
	};
    }

    var httpRequest;
    var start_time;
    var time=document.getElementById("time");
    

    
    // This handles button press on the submit button
    function handleButtonPress(e) {
	console.log("In handleButtonPress");
	e.preventDefault();   // Prevent the default event handler
	var form = document.getElementById("form");
	var progress = document.getElementById("progress");
	var formData = new FormData(form);
	httpRequest = new XMLHttpRequest();

	/*
	  var upload = httpRequest.upload;
	  upload.onprogress = function(e) {
	  progress.max = e.total;
	  progress.value = e.loaded;
	  };
	  upload.onload = function(e) {
	  progress.max = 1;
	  progress.value = 1;
	  };
	*/

	/////////////////////////
	// Clear previous results
	/////////////////////////
	
	var el = document.getElementById("error_messages");
	el.innerHTML="";
	var el = document.getElementById("warning_messages");
	el.innerHTML="";
	var el = document.getElementById("info");
	el.innerHTML="";
	var el = document.getElementById("detailed-results").firstElementChild;  // the table body
	for (i=el.childElementCount-1; i > 0; --i) {  // Remove table rows except the header row
	    el.children[i].remove()
	}	
	document.getElementById("results-container").hidden = true;
	document.getElementById("download_results_container").hidden = true;
	computed = [];
	
	httpRequest.onreadystatechange = handleResponseForUpload;
	//httpRequest.onreadystatechange = handleResponse;
	//httpRequest.timeout = 5000;
	httpRequest.ontimeout = handleTimeout;
	httpRequest.onerror = handleError;
	httpRequest.onabort = handleAbort;
	httpRequest.open("POST", form.action);
	httpRequest.setRequestHeader("Accept", "application/json");
	httpRequest.send(formData);
	console.log("Timeout is " + httpRequest.timeout);
	running = true;
	document.getElementById("submit").disabled = true;
	document.getElementById("finish-time-container").style.display = "none";
	//document.getElementsByClassName("lds-spinner")[0].removeAttribute("hidden");
	document.getElementById("error_messages").innerHTML = "";
	document.getElementsByClassName("lds-spinner")[0].style.display = "inline-block";
	
	start_time=Date.now();
	set_time(0);
	interval_id = window.setInterval(interval_callback, 1000);  // Once a second
	document.getElementById("start-time").innerHTML = new Date().toString();//.substr(0, 19);
	document.getElementById("info-container").removeAttribute("hidden");
	
    }
    
    function handleTimeout() {
	console.log("Timeout");
	el = document.getElementById("error_messages");
	el.innerHTML = "<p>Timeout</p>  ";
    }
    
    function handleError() {
	console.log("Error");
    }

    function handleAbort() {
	console.log("Abort");
    }

    function handleResponseForUpload() {
	console.log("In handleResponseForUpload, readyState: " + httpRequest.readyState + " status: " + httpRequest.status);
	if (httpRequest.readyState == 4 && httpRequest.status == 200) {                                   // SUCCESS
	    //  httpRequest.overrideMimeType("application/json");
	    //document.getElementsByClassName("lds-spinner")[0].setAttribute("hidden", "hidden");
	    //document.getElementsByClassName("lds-spinner")[0].style.display = "none";
	    //clearInterval(interval_id);  // stop the timer
	    var data = JSON.parse(httpRequest.responseText);

	    if ("error_messages" in data && data.error_messages.length > 0) {
		el = document.getElementById("error_messages");
		for (i=0; i < data.error_messages.length; ++i) {
		    el.innerHTML += "<p>" + data.error_messages[i] + "</p>";
		}
		document.getElementById("submit").disabled = false;
		stop_waiting(interval_id);
		document.getElementById("finish-time-container").style.display = "block";
		document.getElementById("finish-time").innerHTML = new Date().toString();//.substr(0, 19);

		return;
	    }
	    websocket_address = window.location.href.replace("http", "ws")
	    console.log("Websocket address is " +  websocket_address);
	    var exampleSocket = new WebSocket(websocket_address);
	    exampleSocket.onmessage = function (event) {
		parsed = JSON.parse(event.data);
		process_json_result(parsed);
		console.log("Got message from server of type " + parsed.type);
		if (parsed.type == "final") exampleSocket.close()
		//divi.innerHTML += p("Received: " + event.data);
	    }
	    exampleSocket.onopen = function (event) {
		console.log("Websocket opened");
		//divi.innerHTML += p("Websocket opened");
		exampleSocket.send("start");
	    }
	    exampleSocket.onclose = function (event) {
		console.log("Websocket closed");
		// If we hadn't yet finished when the socket closed, stop the timer and give an error message
		if (document.getElementsByClassName("lds-spinner")[0].style.display != "none") {
		    data = { type : "final", error_messages : [ "Websocket closed unexpectely!" ] };
		    process_json_result(data);
		}

		//divi.innerHTML += p("Websocket closed");
	    }
	    
	} else if (httpRequest.readyState == 4 && httpRequest.status != 200) {                            // FAIL
	    console.log("Server error! readyState: " + httpRequest.readyState + " status: " + httpRequest.status);
	    running = false;
	    stop_waiting(interval_id);
	    //document.getElementsByClassName("lds-spinner")[0].style.display = "none";
	    //clearInterval(interval_id);  // stop the timer
	    el = document.getElementById("error_messages");
	    el.innerHTML = "<p>Server error!  readyState: " + httpRequest.readyState + " status: " + httpRequest.status + "</p>  ";
	}
    }

    function add_rows_to_details_table(data) {
	// Add pointers to separate result pages in the details table
	console.log(`Details dataframe has ${data.details_df.length} rows`);
	// get the tbody element under the table element
	detailed_results = document.getElementById("detailed-results").firstElementChild;  
	for (i=0; i < data.details_df.length; ++i) {   // iterate over rows of the table
            var wrapper= document.createElement('tbody');
            e = data.details_df[i];
            t = `<tr id="${e.id}"> <td>${e.pretty}</td> <td>${e.sex}</td> <td><a href="${e.html}" target="_blank" >html</a></td> <td><a href="${e.pdf}" target="_blank" >pdf</a></td> </tr>`;
            wrapper.innerHTML = t;
            console.log(t)
            detailed_results.appendChild(wrapper.firstChild);
	}
    }


    function add_error_messages(data) {
	if ("error_messages" in data && data.error_messages.length > 0) {
            el = document.getElementById("error_messages");
	    if (typeof(data.error_messages) == "string")
		data.error_messages = [data.error_messages];
            for (i=0; i < data.error_messages.length; ++i) {
		el.innerHTML += "<pre>" + data.error_messages[i] + "</pre>";
            }
            document.getElementById("submit").disabled = false;
            return;
	}
	
    }

    function add_warning_messages(data) {
	if ("warning_messages" in data && data.warning_messages.length > 0) {
            el = document.getElementById("warning_messages");
            if (typeof(data.warning_messages) == "string")
		data.warning_messages = [data.warning_messages];
	    for (i=0; i < data.warning_messages.length; ++i) {
		
		el.innerHTML += "<pre>" + data.warning_messages[i].replace("<error/rlang_error>\n", "") + "</pre>";
            }
            document.getElementById("submit").disabled = false;
            return;
	}
	
    }

    /////////////////////////////
    // Process websocket messages
    /////////////////////////////
    
    function process_json_result(data) {
	
	if (data.type == "final") {
            //  httpRequest.overrideMimeType("application/json");
	    //document.getElementsByClassName("lds-spinner")[0].setAttribute("hidden", "hidden");
	    //document.getElementsByClassName("lds-spinner")[0].style.display = "none";
	    //clearInterval(interval_id);  // stop the timer
	    running = false;
	    stop_waiting(interval_id);
	    document.getElementById("finish-time-container").style.display = "block";
	    document.getElementById("finish-time").innerHTML = new Date().toString();//.substr(0, 19);
	    
            document.getElementById("download_results_container").removeAttribute("hidden");
	    
	    console.log("Type of data is " + typeof(data))
	    add_error_messages(data)
	    add_warning_messages(data)

	    // Show the link to the zip file containing rf and svm models
	    function svm_or_rf(s) { return s.startsWith("rf") || s.startsWith("svm"); }
	    if (computed.filter(svm_or_rf).length > 0) {   // Were any svm or rf models computed?
		document.getElementById("download_rf_svm_models").style.display = "";
	    } else {
		document.getElementById("download_rf_svm_models").style.display = "none";
	    }
	    
	    if (!document.getElementById("random-forest").checked) {
		document.getElementById("variable-importance").style.display = "none";
		//document.getElementById("detail-rf").style.display = "none";
	    }
	    if (!document.getElementById("lmm").checked && !document.getElementById("dlmm").checked) {
		document.getElementById("effect-size").style.display = "none";
		//document.getElementById("detail-lmm-male").style.display = "none";
		//document.getElementById("detail-lmm-female").style.display = "none";
	    }
	    
	    //add_rows_to_details_table(data);
	    
	    //document.getElementById("results-container").removeAttribute("hidden");  
	    
	    if (document.querySelector('input[name="input_format"]:checked').value == "Preprocessed")
		document.getElementById("preprocessed").style.display = "none";
	} else if (data.type == "status") {
	    // Show status
	    if (data.status == "Ready") {   // This is not very pretty. Try to do it better later.
		document.getElementById("results-container").removeAttribute("hidden");  
	    }
	    document.getElementById("status").innerHTML = data.status;
	} else if (data.type == "info") {
            // Show information about input and preprocessed dataframes
	    document.getElementById("info").innerHTML += data.result;
	} else if (data.type == "summary") {
	    // Show summary table
	    document.getElementById("table_container").innerHTML = data.summary_table_string;
	} else if (data.type == "computed") {
	    console.log("Computed " + data.id);
	    computed.push(data.id);
	} else if (data.type == "timing") {
	    // Show timing table
	    document.getElementById("timing_table_container").innerHTML = data.timing_table_string;
	} else if (data.type == "error") {
	    // Show error
	    add_error_messages(data)
	    add_warning_messages(data)
	} else if (data.type == "warning") {
	    // Show error
	    add_error_messages(data)
	    add_warning_messages(data)
	} else if (data.type == "detail") {
	    add_rows_to_details_table(data);
	    document.getElementById("results-container").removeAttribute("hidden");  
	}
    }

    // This is not used anymore.
    // function handleResponse() {
    // 	console.log("In handleResponse, readyState: " + httpRequest.readyState + " status: " + httpRequest.status);
    // 	if (httpRequest.readyState == 4 && httpRequest.status == 200) {                                   // SUCCESS
    // 	    var data = JSON.parse(httpRequest.responseText);
    // 	    process_json_result(data);
    // 	} else if (httpRequest.readyState == 4 && httpRequest.status != 200) {                            // FAIL
    // 	    console.log("Server error! readyState: " + httpRequest.readyState + " status: " + httpRequest.status);
    // 	    //document.getElementsByClassName("lds-spinner")[0].style.display = "none";
    // 	    //clearInterval(interval_id);  // stop the timer
    // 	    stop_waiting(interval_id);
    // 	    el = document.getElementById("error_messages");
    // 	    el.innerHTML = "<p>Server error!  readyState: " + httpRequest.readyState + " status: " + httpRequest.status + "</p>  ";
    // 	}
    // }
    
    function stop_waiting(interval_id) {
	document.getElementsByClassName("lds-spinner")[0].style.display = "none";
	console.log("interval_id is: " + interval_id);
	clearInterval(interval_id);  // stop the timer
    }

    function seconds_to_dhms(seconds) {
	//seconds = Number(seconds);
	seconds = parseInt(seconds);
	var d = Math.floor(seconds / (3600*24));
	var h = Math.floor(seconds % (3600*24) / 3600);
	var m = Math.floor(seconds % 3600 / 60);
	var s = Math.floor(seconds % 60);
	
	var d2 = d > 0 ? d + (d == 1 ? " day" : " days") : "";
	var h2 = h > 0 ? h + (h == 1 ? " hour" : " hours") : "";
	var m2 = m > 0 ? m + (m == 1 ? " minute" : " minutes") : "";
	var s2 = s > 0 ? s + (s == 1 ? " second" : " seconds") : "";
	elements = [d2, h2, m2, s2];
	result = elements.filter(function(s) {return s.length > 0}).join(", ");
	return result;
    }
    
    // Set elapsed time
    function set_time(milliseconds) {
	//date = new Date(milliseconds).toISOString().substr(11, 8);
	date = seconds_to_dhms(milliseconds / 1000);
	time.innerHTML = date;
    }
    
    function interval_callback(e) {
	milliseconds = Date.now() - start_time;
	set_time(milliseconds);
    }
};  
