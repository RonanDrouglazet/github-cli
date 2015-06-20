var cp = require("child_process");
var debug = false;

exports.clone = function(uri, url, done) {
    exports.exec(uri, "git clone " + url, done);
};

exports.checkout = function(uri, branchName, done, cleanAlreadyDone) {
    exports.exec(uri, "git fetch origin && git checkout " + branchName, function(err, stdout, stderr) {
        if (err && !cleanAlreadyDone) {
            exports.clean(uri,
                exports.reset.bind(this, uri, null,
                    exports.checkout.bind(this, uri, branchName, done, true)
                )
            );
        } else {
            done(err);
        }
    });
};

exports.recover = function(uri, repo, branchName, pushToken, done) {
    repoUrl = repo.url.replace("https://", "https://" + pushToken + "@");
    exports.exec(uri, "git reset --hard " + branchName + "_backup" +
        " && git push -f " + repoUrl + " " + branchName, done);
};

exports.reset = function(uri, branchName, done) {
    exports.exec(uri, "git reset --hard" + (branchName ? (" origin/" + branchName) : ""), done);
};

exports.pull = function(uri, done) {
    exports.exec(uri, "git pull --rebase", done);
};

exports.rebase = function(uri, rebaseOrigin, done) {
    exports.exec(uri, "git rebase origin/" + rebaseOrigin, function(err, stdout, stderr) {
        if (stdout.endsWith("is up to date.\n")) {
            done(err, true);
        } else {
            done(err, false);
        }
    });
};

exports.merge = function(uri, branchToMerge, done, msg) {
    exports.exec(uri, "git merge --no-ff origin/" + branchToMerge + (msg ? (" -m '" + msg + "'") : ""), function(err, stdout, stderr) {
        done(err, stdout === "Already up-to-date.\n");
    });
};

exports.branch = function(uri, branchName, done) {
    exports.exec(uri, "git branch -f " + branchName, done);
};

exports.add = function(uri, path, done) {
    exports.exec(uri, "git add " + path, done);
};

exports.commit = function(uri, message, done) {
    exports.exec(uri, "git commit -am '" + message + "'", done);
};

exports.push = function(pushToken, uri, repoUrl, branchName, done, force) {
    repoUrl = repoUrl.replace("https://", "https://" + pushToken + "@");
    exports.exec(uri, "git push " + (force ? "-f " : "") + repoUrl + " " + branchName, done);
};

exports.abortRebase = function(uri, done) {
    exports.exec(uri, "git rebase --abort", done);
};

exports.clean = function(uri, done) {
    exports.exec(uri, "git clean -f -d -x", done);
};

exports.getMissingCommits = function(uri, branchName, rebaseOrigin, done) {
    exports.exec(uri, "git cherry origin/"+ branchName + " origin/" + rebaseOrigin, function(err, stdout, stderr) {
        var match = stdout.match(/\+/g);
        done(err, match ? match.length : 0);
    });
};

exports.setGrebaseAuthor = function(uri, done) {
    exports.exec(uri, "git config user.name 'GRebase-' && git config user.email 'grebase.2014@gmail.com'", done);
};

exports.exec = function(localPath, command, done) {
    cp.exec("cd " + localPath + " && " + command, function(error, stdout, stderr) {
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
