const UserLog = require('./user');
const debug = require('debug')('themis:scoring');

/**
 * Scoring works very simply.
 * For each log parsed a score is updated into a global "scores"
 * collection, that contains the score for each contestant/problem.
 */


const getScore = () => {
	const users = UserLog.Users;
	console.log(users);
	debug(users);
};
const scores = getScore();
const highestScores = {};


/**
 * Adds a score into the collection.
 * New score overrides old ones, no matter how different.
 * Non-numeric verdicts are treated as 0.
 * @param  {string} user    The user that submitted the file.
 * @param  {string} problem The problem that was attempted.
 * @param  {[type]} verdict The given submission's Log.verdict.
 */
function addScore(user, problem, verdict) {
	const score = (isNaN(Number(verdict)) ? 0 : Number(verdict));


	if (!scores[user]) scores[user] = {total: 0};
	if (!scores[user][problem]) scores[user][problem] = 0;
	scores[user].total += score - scores[user][problem];
	scores[user][problem] = score;

	if (!highestScores[user]) highestScores[user] = {total: 0, submitCounts: {}};
	if (!highestScores[user][problem]) highestScores[user][problem] = 0;
	const prevScore = highestScores[user][problem];
	highestScores[user][problem] = Math.max(highestScores[user][problem], score);
	highestScores[user].total += highestScores[user][problem] - prevScore;

	const {submitCounts} = highestScores[user];
	if (!submitCounts[problem]) submitCounts[problem] = 0;
	submitCounts[problem] += 1;

	debug(`New score ${score} for ${user} on ${problem}. Highest score: ${highestScores[user][problem]}. Submit count: ${submitCounts[problem]}`);
}

module.exports = {
	add: addScore, scores: scores, highestScores: highestScores,
};
