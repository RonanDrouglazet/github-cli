var cp = require("child_process");
var debug = false;

exports.clone = function(url, done) {
    exports.exec("../repos/", "git clone " + url, done);
};

exports.checkout = function(repoName, branchName, done, cleanAlreadyDone) {
    exports.exec("../repos/" + repoName, "git fetch origin && git checkout " + branchName, function(err, stdout, stderr) {
        if (err && !cleanAlreadyDone) {
            exports.clean(repoName,
                exports.reset.bind(this, repoName, null,
                    exports.checkout.bind(this, repoName, branchName, done, true)
                )
            );
        } else {
            done(err);
        }
    });
};

exports.recover = function(repo, branchName, pushToken, done) {
    repoUrl = repo.url.replace("https://", "https://" + pushToken + "@");
    exports.exec("../repos/" + repo.name, "git reset --hard " + branchName + "_backup" +
        " && git push -f " + repoUrl + " " + branchName, done);
};

exports.reset = function(repoName, branchName, done) {
    exports.exec("../repos/" + repoName, "git reset --hard" + (branchName ? (" origin/" + branchName) : ""), done);
};

exports.pull = function(repoName, done) {
    exports.exec("../repos/" + repoName, "git pull --rebase", done);
};

exports.rebase = function(repoName, rebaseOrigin, done) {
    exports.exec("../repos/" + repoName, "git rebase origin/" + rebaseOrigin, function(err, stdout, stderr) {
        if (stdout.endsWith("is up to date.\n")) {
            done(err, true);
        } else {
            done(err, false);
        }
    });
};

exports.merge = function(repoName, branchToMerge, done, msg) {
    exports.exec("../repos/" + repoName, "git merge --no-ff origin/" + branchToMerge + (msg ? (" -m '" + msg + "'") : ""), function(err, stdout, stderr) {
        done(err, stdout === "Already up-to-date.\n");
    });
};

exports.branch = function(repoName, branchName, done) {
    exports.exec("../repos/" + repoName, "git branch -f " + branchName, done);
};

exports.push = function(pushToken, repoName, repoUrl, branchName, done, force) {
    repoUrl = repoUrl.replace("https://", "https://" + pushToken + "@");
    exports.exec("../repos/" + repoName, "git push " + (force ? "-f " : "") + repoUrl + " " + branchName, done);
};

exports.abortRebase = function(repoName, done) {
    exports.exec("../repos/" + repoName, "git rebase --abort", done);
};

exports.clean = function(repoName, done) {
    exports.exec("../repos/" + repoName, "git clean -f -d -x", done);
};

exports.getMissingCommits = function(repoName, branchName, rebaseOrigin, done) {
    exports.exec("../repos/" + repoName, "git cherry origin/"+ branchName + " origin/" + rebaseOrigin, function(err, stdout, stderr) {
        var match = stdout.match(/\+/g);
        done(err, match ? match.length : 0);
    });
};

exports.setGrebaseAuthor = function(repoName, done) {
    exports.exec("../repos/" + repoName, "git config user.name 'GRebase-' && git config user.email 'grebase.2014@gmail.com'", done);
};

exports.exec = function(localPath, command, done) {
    cp.exec("cd " + __dirname + "/" + localPath + " && " + command, function(error, stdout, stderr) {
        if (debug) {
            console.log("#########################");
            console.log("Exec command: ", command);
            console.log("Exec path: ", localPath);
            console.log("Exec stderr: ", error);
            console.log("Exec stdout: ", stdout);
        }
        done(error, stdout, stderr);
    });
};

String.prototype.endsWith = function(suffix) {
    return this.indexOf(suffix, this.length - suffix.length) !== -1;
};
