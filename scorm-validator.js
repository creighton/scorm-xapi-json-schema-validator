// use: node scorm-validator.js [-v] [path to schemas]
var validator = require('is-my-json-valid/require');
var fs = require('fs');
var colors = require('colors');
var cmdarg = require('command-line-args');

var args = cmdarg([
    {name: 'verbose', alias: 'v', type: Boolean},
    {name: 'path', alias: 'p', type: String}
]);

var SCHEMA_PATH = args.path || '../scorm-json-schemas/';
if (! SCHEMA_PATH.endsWith('/')) SCHEMA_PATH = SCHEMA_PATH + '/';

var schemas = ['scorm.profile.activity.profile.schema.json',
               'scorm.profile.activity.state.schema.json',
               'scorm.profile.agent.profile.schema.json',
               'scorm.profile.attempt.state.schema.json'];




var res_tracker = {"tests": {}, "starttime": +Date.now()};
var verbose = args.verbose;


console.log();
console.log("+ + Starting tests + +".yellow.bold.underline);
console.log("location:".white.bold, require('path').resolve(SCHEMA_PATH));
console.log();


schemas.forEach(function(cur, idx, arr) {
    var validate = validator(SCHEMA_PATH + cur);
    var folder = cur.split('.')[2] + '-' +  cur.split('.')[3] + '-' + 'tests/';
    runtestsSync(folder, validate);
});
printResults(+Date.now());



function runtestsSync(folder, validate) {
    res_tracker.tests[folder] = {};
    fs.readdirSync(folder).forEach(function(filename, idx, arr) {
        var content = fs.readFileSync(folder + filename, 'utf8');
        res_tracker.tests[folder][filename] = [];
        var c = JSON.parse(content);
        c.tests.forEach(function(cur, idx, arr) {
            cur.validate_res = validate(cur.test);
            cur.test_res = cur.expect === cur.validate_res;
            cur.errors = (! cur.test_res) ? validate.errors || "test passed unexpectedly" : undefined;
            res_tracker.tests[folder][filename].push(cur);
            printTestResult(folder, filename, cur, validate, verbose);
        });
    });
}

function printTestResult(folder, name, curtest, validate, verbose) {
    if (curtest.expect !== curtest.validate_res) {
        console.log(folder + name);
        console.log(colors.red("FAIL"), colors.white.bold(curtest.title));
        console.log("\t", colors.red(JSON.stringify(curtest.errors || curtest.validate_res)));
        console.log();
    }
    else if (verbose) {
        console.log(colors.green("PASS"), colors.white.bold(curtest.title));
        console.log();
    }
}

function printResults(endTime) {
    var folder = 0, testfile = 1;

    Object.keys(res_tracker.tests).forEach(function(key, idx, arr) {
        console.log(key, printTestDetails(res_tracker.tests[key]));
    });

    console.log("done in", endTime - res_tracker.starttime, "ms");
}

// ¯\_(ツ)_/¯
function printTestDetails(testfilearr) {
    var res = Object.keys(testfilearr).reduce(function(prev, cur, idx, arr) {
        prev.passed += testfilearr[cur].reduce(function (p, c, i, a) {
            var testct = ((c.test_res) ? 1 : 0)
            var ret = p + testct;
            return ret;
        }, 0);
        prev.failed += testfilearr[cur].reduce(function (p, c, i, a) {
            var testct = ((c.test_res) ? 0 : 1)
            var ret = p + testct;
            return ret;
        }, 0);
        return prev;
    }, {"passed": 0, "failed": 0});
    return "passed: " + colors.green(res.passed) + "  failed: " + colors.red(res.failed);
}
