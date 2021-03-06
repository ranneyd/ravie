var timePicker = event => {
    TimePicker.openOnInput(event.target);
    //$(event.target).trigger("focusin");
};

var timePickerValidator = () => {
    // Make sure end happens after start
    let compTimes = (start, end) => {
        if(!(start && end)){
            return false;
        }
        let dateRegex = /(1[012]|[1-9]):([0-5][0-9]) ([ap]m)/;
        let [sGarbage, sHours, sMinutes, sAMPM, ...sRest] = dateRegex.exec(start) || [];
        let [eGarbage, eHours, eMinutes, eAMPM, ...eRest] = dateRegex.exec(end) || [];

        // I hate javascript
        sHours = Number(sHours);
        sMinutes = Number(sMinutes);
        eHours = Number(eHours);
        eMinutes = Number(eMinutes);

        // Simplify this with boolean logic? Meh, not worth it
        if(eAMPM === "am" && sAMPM === "pm"){
            return false;
        }
        else if(eAMPM === "pm" && sAMPM === "am") {
            return true;
        }
        else if(sHours === 12 && eHours !== 12){
            return true;
        }
        else if(sHours > eHours){
            return false;
        }
        else if(sHours < eHours) {
            return true;
        }
        else if(sMinutes > eMinutes){
            return false;
        }
        else {
            return true;
        }
    };

    if(!compTimes( $("#timeStart").val(), $("#timeEnd").val() )) {
        let error = "End time must occur after the start time."
        $("#timeStart").removeClass("valid").addClass("invalid")[0].setCustomValidity(error);
        $("#timeEnd").removeClass("valid").addClass("invalid")[0].setCustomValidity(error);
        $("#error").html(error);
    }
    else {
        $("#timeStart").removeClass("invalid").addClass("valid")[0].setCustomValidity("");
        $("#timeEnd").removeClass("invalid").addClass("valid")[0].setCustomValidity("");
        $("#error").html("");
    }
}

$("#timeStart").on('focusin', timePicker);
$("#timeEnd").on('focusin', timePicker);

$("#timeStart").on("input", timePickerValidator);
$("#timeEnd").on("input", timePickerValidator);

$("#date").on("change", function(){
    if($(this).val() !== ""){
        $(this).removeClass("invalid").addClass("valid");
    }
});

var getGoogleMapsURL = location => {
    let API_KEY = "AIzaSyA_pbDU2WPMoChRE2oFhjJVNJHPI5-1Ewg";
    let newLocation =  location.replace(/[^a-zA-Z0-9-]/g, "").split(" ").join("+");
    return `https://www.google.com/maps/embed/v1/place?q=${newLocation}&key=${API_KEY}`;
};
$.get(`/${currentUrl}/getEvents`, data => {
    if( data.length === 0 ){
        $("#no-events").show();
        return;
    }
    if( data === "private") {
        return;
    }
    // I could put in an else, but then I'd have to indent.
    data.forEach(elem => {
        let dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        let timeFormatter = (dateStr) => {
            let date = new Date(dateStr);
            let hours = date.getHours();
            let ampm = "am";
            if(hours === 0) {
                hours = 12;
            }
            if(hours / 12 > 1){
                hours -= 12;
                ampm = 'pm';
            }

            let minutes = date.getMinutes();
            if (minutes < 10){
                minutes = "0" + minutes;
            };
            return `${hours}:${minutes} ${ampm}`;
        };

        let now = new Date();
        let startTime = new Date(elem.dateStart);
        let endTime = new Date(elem.dateEnd);


        let minutesSinceStart = -(startTime - now)/60000 | 0;
        let minutesUntilEnd = (endTime - now)/60000 | 0;
        let timeMessage = "";

        if(minutesSinceStart > -60){
            if (minutesUntilEnd < 30) {
                timeMessage = `<span class="red-text">(ends in ${minutesUntilEnd} minutes)</span>`;
            }
            else if(minutesSinceStart >= 60) {
                timeMessage = `<span class="red-text text-accent-4">(started over an hour ago)</span>`;
            }
            else if (minutesSinceStart > 0) {
                timeMessage = `<span class="red-text text-accent-4">(started ${minutesSinceStart} minutes ago)</span>`;
            }
            else if (minutesSinceStart > -30){
                timeMessage = `<span class="green-text">(starts in ${-minutesSinceStart} minutes)</span>`;
            }
        }
        

        let eventCard = 
        '<div class="row">' +
            '<div class="col s12 l8 offset-l2">' +
                '<div class="card hoverable">' +
                    '<div class="card-image waves-effect waves-block waves-light">' +
                        `<img class="activator" src="/images/banners/${elem.banner}">` +
                    '</div>' +
                    '<div class="card-content">'+
                        '<div class="activator">' +
                            `<span class="card-title activator">${elem.name}` + 
                                '<i class="material-icons right">more_vert</i>' +
                            '</span>' +
                        '</div>' +
                        '<div class="row no-margin-bottom">' + 
                            '<div class="col s8">' +
                                `<p>${new Date(elem.dateStart).toLocaleString('en-US', dateOptions)}</p>` + 
                                `<p>${timeFormatter(elem.dateStart)} - ${timeFormatter(elem.dateEnd)} ${timeMessage}</p>` +
                            '</div>' +
                            // '<div class="col s4">' +
                            //     `  <a class="right waves-effect waves-orange btn-flat">RSVP</a>` +
                            // '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="card-reveal">' +
                        `<span class="card-title">${elem.name}` + 
                            '<i class="material-icons right">close</i>' +
                        '</span>' + 
                        '<div class="row no-margin-bottom" style="padding-bottom:0px">' +
                            '<div class="col s12 l5">' +
                                '<h5>Details</h5>' + 
                                `<p>${elem.description}</p>` +
                                '<h5>Location</h5>' + 
                                `<p>${elem.location}</p>` +
                            '</div>' +
                            '<div class="col s10 l7">' + 
                                '<div class="video-container">' +
                                    `<iframe class="card-map" allowfullscreen frameborder="0" src="${getGoogleMapsURL(elem.location)}"></iframe>` +
                                '</div>' +
                            '</div>' +
                        '</div>' + 
                    '</div>' +
                '</div>' + 
            '</div>' +
        '</div>';
    
        $("#content").append(eventCard);
    });
});


$("#newEventButton").click(function(){
    if($("#basicInfoTab").hasClass("active")){
        $("#bannerTabButton").click();
    }
    else if($("#bannerTabButton").hasClass("active")){
        $("#detailsTabButton").click();
    }
    else{
        var error;
        $("#basicTab input").each(function( index ){
            if($(this).hasClass("invalid")) {
                error = $("#error").html();
            }
            if(($(this).val() === "" && $(this).attr("required"))){
                $(this).addClass("invalid");
                error = "Red fields are required";
            }
        })
        if(error) {
            $("#error").html(error);
            $("#basicInfoTab").click();
        }
        else {
            $("#detailsTab input").each(function( index ){
                if($(this).hasClass("invalid")) {
                    error = $("#error").html();
                }
                if(($(this).val() === "" && $(this).attr("required"))){
                    $(this).addClass("invalid");
                    error = "Red fields are required";
                }
            });
            if(error) {
                $("#error-details").html(error);
                $("#detailsTab").click();
            }
            else{
                $("#newEvent").submit();    
            }
        }
    }
});

$("#newEventClose").click(function(){
    if($("#basicInfoTab").hasClass("active")){
        $("#add-event").closeModal();
    }
    else if($("#bannerTabButton").hasClass("active")){
        $("#basicInfoTab").click();
    }
    else {
        $("#bannerTabButton").click();
    }
});

$("li.tab a").click(function(){
    if($(this).attr("id") === "basicInfoTab") {
        $("#newEventClose").html("Close");
    }
    else{
        $("#newEventClose").html("Back");
    }
    if($(this).attr("id") === "detailsTabButton") {
        $("#newEventButton").html("Submit");
    }
    else{
        $("#newEventButton").html("Next");
    }
});

// The tab indicator isn't on when the modal opens, so we need to hack it a
// bit When we click on the modal launcher, "click" on the first tab to put
// the "current tab" indicator under it. However, the modal animates in, and
// if it hasn't animated in, the click will register a weird size, so wait a
// few millis after it's been clicked to do it.
//
// Also, we have to AJAX the list of banners. 
$(".add-event-trigger").click(function( event ){
    if(user === "") {
        event.preventDefault();
        window.location.replace("/login");
    }
    setTimeout(function(){
        $("#basicInfoTab").trigger("click");
    },200);

    $.get("/ajax/getBannerImages", function( data ) {
        var newData = data.sort(function( a, b ) {
            if(a.name[0] < b.name[0])
                return -1;
            if(a.name[0] > b.name[0])
                return 1;
            else
                return 0; 
        });
        newData.forEach(function(val){
            $("#banner-picker").append(
                $("<option>").attr("value", val.url)
                    .attr("data-icon", "/images/banners/icons/" + val.url)
                    .attr("selected", val.url === "lights.png"? '': false)
                    .html(val.name[0])
            );
        });
        $('#banner-picker').material_select();

        $("#banner-loading").hide();
        $("#banner-row").show();
    });
});

$("#banner-picker").change(function(){
    $(".banner-preview").attr("src", "/images/banners/" +$(this).val());
});

$("#banner-row").hide();

$("#enter-location").click(function(){
    $(".map").attr("src", getGoogleMapsURL($("#location").val()))
});


$(".members").click(function(){
    $("#list-title").html(`${title} Members`);

    // Invite box
    let inviteRow = $("<div class='row'>");
    let inviteHeader = $("<p>").html("Invite people to your group <small>Note: they must have an account to receive the invite</small>");
    let nameInput = $("<input>")
        .attr("type", "text")
        .attr("id", "inviteInput")
        .attr("placeholder", "Username or Email")
        .css({
            "width":"auto",
            "min-width": "300px",
            "margin-right": "20px",
        });
    let inviteSubmit = $("<button>")
        .addClass("waves-effect")
        .addClass("waves-light")
        .addClass("btn")
        .html("Invite")
        .click(function(){
            $.ajax({
                method:"post",
                url: `/${currentUrl}/invite`,
                data: {
                    name: $("#inviteInput").val()
                },
                success: (data) => {
                    Materialize.toast(data, 4000)
                }
            });
        });
    inviteRow.append(inviteHeader).append(nameInput).append(inviteSubmit);
    $("#list-body").html("").append(inviteRow);
    $("#list-progress").show();
    $.post(`/${currentUrl}/members`, data => {
        for(let i = 0; i < data.length; ++i) {
            let p = $("<p class='flow-text'>");
            let chip;
            if(data[i].admin) {
                chip = "<div class='chip'>admin</div>";
            }
            else if (isAdmin === "true") {
                chip = `<small><a href='#' data-user='${data[i].name}'>Promote to admin</a></small>`;
            }
            else{
                chip = "";
            }
            p.append(`${data[i].name} ${chip}`);
            $("#list-body").append(p);
        }
        $("#list-progress").hide();
    });
});