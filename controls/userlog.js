/**
 * The userlog is a log that records all user submit historym
 * though source code is not saved (but rather a md5 hash of it).
 * It is mainly used to find out suspicious actions and in the
 * event of score loss, used as a proof of score.
 */

const nedb = require('nedb');
const debug = require('debug')('themis:userlog');
const path = require('path');
const md5 = require('md5');

const UserLog = new nedb({
	filename: path.join(process.cwd(), 'data', '.userlog.db'), autoload: true
});

/**
 * Adds a new user into the user log.
 * @param {string} 		username The user's username.
 * @param {Function} 	cb		   The callback function.
 */
function addUser(username, cb = () => {
}) {
	// Adds a new user.
	UserLog.findOne({username: username}, (err, user) => {
		if (err) return cb(err);
		if (user === null) {
			debug(`creating new user ${username}`);
			UserLog.insert({
				username: username, submits: {}, scores: {}, highestScores: {submitCounts: {}}
			}, (err, user) => {
				if (cb) cb(err, user);
			});
		} else cb();
	});
}

/**
 * Receives the user's log async-ly.
 * @param  {string}   username The user's username.
 * @param  {Function} cb       The callback function (err, log) => { }
 */
function getUser(username, cb) {
	UserLog.findOne({username: username}, cb);
}

/**
 * Receives the user's log async-ly.
 * @param  {string}   username The user's username.
 */
function getUsers(cb) {
	UserLog.find({}, cb);
}


/**
 * Add a submission. Content will be hashed before saving.
 * @param {string} user     The user that submitted the file.
 * @param {string} filename The submitted filename.
 * @param {string} contents The submitted file's content.
 */
function addSubmit(username, filename, contents) {
	getUser(username, (err, user) => {
		if (err) {
			debug(err);
			return; // Can't happen
		}
		UserLog.update({_id: user._id}, {
			$set: {
				[`submits.${filename}`]: md5(contents.replace(/\s/g, '')),
			}
		});
	});
}

/**
 * Add a score.
 * New score overrides old ones, no matter how different.
 * @param  {string} user    The user that submitted the file.
 * @param  {string} problem The problem that was attempted.
 * @param  {[type]} contents The given submission's Log.verdict.
 */
function addScore(username, problem, contents) {
	getUser(username, (err, user) => {
		if (err) {
			debug(err);
			return; // Can't happen
		}
		const currentScore = user.highestScores[problem] || 0;
		debug({'highestScores': user.highestScores, currentScore});

		debug({contents, username});
		const highestScore = Math.max(currentScore, contents.verdict);
		debug({highestScore, username});

		const submitCount = (user.highestScores && user.highestScores.submitCounts && user.highestScores.submitCounts[problem] || 0) + 1;

		UserLog.update({_id: user._id}, {
			$set: {
				[`scores.${problem}`]: contents,
				[`highestScores.${problem}`]: highestScore,
				[`highestScores.submitCounts.${problem}`]: submitCount,
			}
		});
	});
}

module.exports = {
	addUser: addUser, addSubmit: addSubmit, addScore: addScore, getUsers: getUsers
};
