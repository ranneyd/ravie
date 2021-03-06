'use strict';

var express = require('express');
var passport = require('passport');
var router = express.Router();

var nodemailer = require("nodemailer");
var transporter = nodemailer.createTransport('smtps://ravieevents%40gmail.com:pass@smtp.gmail.com');


var Group = require('../models/group.js');
var Banner = require('../models/banner.js');
var Event = require('../models/event.js');
var User = require('../models/user.js');
var Suggestion = require('../models/suggestion.js');



/* GET home page. */
router.get('/', function(req, res, next) {
    req.session.returnTo = req.path;
    let user = (req.user ? req.user : { username: "", email: ""}) 

    res.render('index', { title: 'Ravie', user : user });
});

router.get('/register', function(req, res) {
    res.render('register', { title: 'Ravie' });
});

router.post('/register', function(req, res) {
    User.register(new User({ username : req.body.username, email: req.body.email }), req.body.password, function(err, user) {
        if (err) {
            return res.render('register', { user : user, error : err.message});
        }

        passport.authenticate('local')(req, res, function () {
            res.redirect(req.session.returnTo || '/');
        });
    });
});

router.get('/login', function(req, res) {
    res.render('login', { title: "Ravie", user : req.user });
});

router.post('/login', function(req, res) {
    passport.authenticate('local', function(err, user, info) {
        if(err){
            console.log("Error");
            console.log(err);
            res.redirect("/uh-oh");
        }
        if(!user) {
            res.render('login', { title: "Ravie", error: "Username and password combination failed."});
        }
        else{
            req.logIn(user, function(err) {
                if(err){
                    console.log("Error");
                    console.log(err);
                    res.redirect("/uh-oh");
                }
                return res.redirect(req.session.returnTo || '/');
            })
        }
    })(req, res);
});

router.get('/logout', function(req, res) {
    req.logout();
    res.redirect(req.session.returnTo || '/');
});


router.get(/\/ajax\/userExists\/(.+)\/?/, function(req, res) {
    User.findOne(
        {
            "username" : req.params[0]
        },
        function(err, results){
            res.send(!!results);
    });
});

router.post(/\/ajax\/groupExists/, function(req, res) {
    Group.findOne(
        {
            "url" : req.body.name
        },
        function(err, results){
            res.send(!!results);
    });
});

router.get('/ajax/getBannerImages', function(req, res, next) {
    Banner.find(
        {},
        function(err, results){
            if (err) {
                console.log("Error");
                console.log(err);
                res.redirect("/uh-oh");
            }
            res.send(results);
    });
});
router.post('/suggestion', function(req, res, next) {
    let suggestionConfig = {
        sentiment: req.body.sentiment,
        suggestion: req.body.suggestion,
        user: req.user && req.body.sendUser ? req.user.username : "anonymous" ,
        url: req.body.sendUrl ? req.url : "anonymous"
    };
    var newSuggestion = new Suggestion(suggestionConfig);
    newSuggestion.save(function(err) {
        if (err) {
            console.log("Error");
            console.log(err);
            res.send("Uh oh!");
            return;
        }
        var mailOptions = {
            from: '"Suggestions" <ravieevents@gmail.com>', // sender address
            to: 'ravieevents@gmail.com', // list of receivers
            subject: 'Suggestion', // Subject line
            text: `User: ${suggestionConfig.user}\n`
                + `Url: ${suggestionConfig.url}\n`
                + `Sentiment: ${suggestionConfig.sentiment}\n`
                + `Suggestion: ${suggestionConfig.suggestion}`, // plaintext body
        };

        // send mail with defined transport object
        transporter.sendMail(mailOptions, function(error, info){
            if(error){
                return console.log(error);
            }
            console.log('Message sent: ' + info.response);
        });
        res.send("success");
    });
});


router.post('/mygroups', function(req, res, next) {
    if(req.user){
        Group.find(
            {
                $or:[
                    {members: { $in: [req.user.username] }},
                    {invites: { $in: [req.user.username] }}
                ]
            },
            "name url description members invites",
            function(err, results){
                if (err) {
                    console.log("Error");
                    console.log(err);
                    res.send("uh-oh");
                    return;
                }


                let reeeee = results.map(result => { 
                    result.invites = result.invites.indexOf(req.user.username) !== -1;
                    result.members = null;    
                    return result
                });
                console.log(reeeee);
                res.send(reeeee);
        });
    }
    else {
        return res.send('You need to be logged in.');
    }
});

router.get('/uh-oh', function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""}) 

    res.render('uh-oh', { title: "Ravie", user: user });
});

// Group page 
router.get(/^\/([^\/]+)\/?$/, function(req, res, next) {
    req.session.returnTo = req.path;
    let user = (req.user ? req.user : { username: "", email: ""}) 
    Group.findOne({
            "url": req.params[0]
        },
        function (err, results){
            if (err) {
                console.log("Error");
                console.log(err);
                res.redirect("/uh-oh");
            }
            if ( results !== null){

                if ( results.visibility !== "hidden" || results.members.indexOf(user.username) !== -1 || results.invites.indexOf(user.username) !== -1){
                    res.render('group', { 
                        title: results.name, 
                        group: true, 
                        currentUrl: req.params[0], 
                        user: user, 
                        isAdmin: results.admins.indexOf(user.username) !== -1,
                        description: results.description,
                        visibility: results.visibility
                    });
                }
                else{
                    res.render('404', { title: "Ravie", user: user });
                }
            }
            else {
                res.render('404', { title: "Ravie", user: user });
            }
    });
});
// Member list 
router.post(/^\/([^\/]+)\/members\/?$/, function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""}) 
    Group.findOne({
            "url": req.params[0]
        },
        "members visibility admins",
        function (err, results){
            if (err) {
                console.log("Error");
                console.log(err);
                res.send("uh-oh");
                return;
            }
            if ( results !== null){

                if ( results.visibility === "public" || results.members.indexOf(user.username) !== -1){
                    res.send(results.members.map(elem => {
                        let val = {name: elem};
                        if(results.admins.indexOf(elem) !== -1) {
                            val.admin = true;
                        }
                        return val;
                    }));
                }
                else{
                    res.send("404. Sorry bro.");
                }
            }
            else {
                res.send("404. Sorry bro.");
            }
    });
});
// // promote to admin
// router.post(/^\/([^\/]+)\/promote\/?$/, function(req, res, next) {
//     let user = (req.user ? req.user : { username: "", email: ""}) 
//     Group.findOne({
//             "url": req.params[0]
//         },
//         "members admins",
//         function (err, results){
//             if (err) {
//                 console.log("Error");
//                 console.log(err);
//                 res.send("uh-oh");
//             }
//             if ( results !== null){

//                 if ( results.admins.indexOf(user.username) !== -1){
//                     res.send(results.members);
//                 }
//                 else{
//                     res.send("Authentication error");
//                 }
//             }
//             else {
//                 res.send("Authentication error");
//             }
//     });
// });
// invite
router.post(/^\/([^\/]+)\/invite\/?$/, function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""})
    User.findOne({
        $or:[
            {username: req.body.name},
            {email: req.body.name.toLowerCase()}
        ]
    },
    (err, result) =>{
        console.log("Got the result?");
        console.log(err);
        console.log(result);
        if (err) {
            console.log("Error");
            console.log(err);
            res.send("uh-oh");
            return;
        }
        if( !result ){
            console.log("Uh oh, no user found pls");
            res.send(`User not found`);
            return; // express confirmed this dumb
        }
        let invitee = result.username;
        Group.update({
                "url": req.params[0],
                "admins": {
                    $in: [user.username]
                },
                "invites": {
                    $nin: [req.body.name]
                }
            },
            {
                $push: { "invites": req.body.name}
            },
            {},
            function (err, results){
                if (err) {
                    console.log("Error");
                    console.log(err);
                    res.send("uh-oh");
                }
                else {
                    res.send(`Invite sent to ${invitee}`);
                }
        });
    });
});
router.post(/newGroup/, function(req, res, next) {
    Group.findOne(
        {
            $or: [
                {"url" : req.body.url},
                {"name": req.body.name} 
            ]
        },
        function(err, results){
            if(!!results) {
                console.log("Error");
                console.log("Group already exists");
                res.redirect("/uh-oh");
            }
            else {
                if(!req.user){
                    console.log("Error");
                    console.log("Someone tried to make a group without logging in.");
                    res.redirect("/uh-oh");
                }
                let newUrl = req.body.name.toLowerCase().replace(/ /g, "_").replace(/[^a-z0-9_]/g,"");
                var newGroup = new Group({
                    name: req.body.name,
                    url: newUrl,
                    description: req.body.description,
                    visibility: req.body.visibility,
                    postpolicy: req.body.postpolicy,
                    owner: req.user.username,
                    admins: [req.user.username],
                    members: [req.user.username],
                    requests: [],
                    invites: []
                });
                newGroup.save(function(err) {
                    if (err) {
                        console.log("Error");
                        console.log(err);
                        res.redirect("/uh-oh");
                    }
                });
                res.redirect(`/${newUrl}`);
            }
    });
});

router.post(/^\/(.*)\/new/, function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""}) 

    let dateStart = new Date(req.body.date);
    let dateEnd = new Date(req.body.date);


    let dateRegex = /(1[012]|[1-9]):([0-5][0-9]) ([ap]m)/;
    let matchData;
    if(matchData = dateRegex.exec(req.body.timeStart)){
        // If destructing was supported I'd do this
        // let [sGarbage, sHours, sMinutes, sAMPM, ...sRest] = dateRegex.exec(req.body.timeStart) || [];
        dateStart.setHours(Number(matchData[1]) + (matchData[3] === "pm" ? 12 : 0), matchData[2]);
    }
    else{
        console.log("Error");
        console.log("Invalid date for date start");
        res.redirect("/uh-oh");
    }

    if(matchData = dateRegex.exec(req.body.timeEnd)){
        // If destructing was supported I'd do this
        // let [sGarbage, sHours, sMinutes, sAMPM, ...sRest] = dateRegex.exec(req.body.timeStart) || [];

        dateEnd.setHours(Number(matchData[1]) + (matchData[3] === "pm" ? 12 : 0), matchData[2]);
    }
    else{
        console.log("Error");
        console.log("Invalid date for date end");
        res.redirect("/uh-oh");
    }
    Group.findOne(
        {
            "url" : req.params[0]
        },
        "members admins postpolicy",
        function(err, results){
            if (err) {
                console.log("Error");
                console.log(err);
                res.redirect("/uh-oh");
            }
            let isAdmin = results.admins.indexOf(user.username) !== -1;
            let isMember = results.members.indexOf(user.username) !== -1;
            if( (results.postpolicy === "admin" && !isAdmin) 
              || results.postpolicy === "members" && !isMember) {
                res.redirect("/" + req.params[0]);
            }

            let pending = 0;
            if(results.postpolicy === "approval" && !isAdmin){
                pending = 1;
            }
            var newEvent = new Event({
                name: req.body.name,
                dateStart: dateStart,
                dateEnd: dateEnd,
                description: req.body.description.replace(/\n/g, "<br>"),
                banner: req.body['banner-picker'],
                location: req.body.location,
                rsvp: req.body.rsvp,
                owner: user.username || "anonymous",
                group: req.params[0],
                pending: pending
            });
            newEvent.save(function(err) {
                if (err) {
                    console.log("Error");
                    console.log(err);
                    res.redirect("/uh-oh");
                }
            });
            res.redirect("/" + req.params[0]);

        }
    );
});

router.get(/^\/(.*)\/getEvents/, function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""}) 

    Group.findOne(
        {
            "url" : req.params[0]
        },
        "members admins visibility",
        function(err, results){
            if (err) {
                console.log("Error");
                console.log(err);
                res.redirect("/uh-oh");
            }
            let isMember = results.members.indexOf(user.username) !== -1;
            if(results.visibility === "public" || isMember) {
                var after = new Date();
                if(req.query.after){
                    var after = new Date(req.query.after);
                }
                Event.find({
                        group: req.params[0],
                        dateEnd: {$gt: after },
                        pending: {$ne: 1}
                    }).sort("dateEnd").exec(function(err, events){
                        if (err) {
                            console.log("Error");
                            console.log(err);
                            res.redirect("/uh-oh");
                        }
                        else {
                            res.send(events);
                        }
                    });
            }
            else if (results.visibility === "hidden"){
                res.send("private");
            }
            else{
                res.redirect("/404");
            }
        }
    );
});

// 404
router.get(/.+/, function(req, res, next) {
    let user = (req.user ? req.user : { username: "", email: ""}) 
    res.render('404', { title: "Ravie", user: user });
});

module.exports = router;
