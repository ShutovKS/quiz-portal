import User from '../../models/User.js';
import Quiz from '../../models/Quiz.js';
import Attempt from "../../models/Attempt.js";
import Question from "../../models/Question.js";

export async function getUserCount() {
    return User.countDocuments();
}

export async function getQuizCount() {
    return Quiz.countDocuments();
}

export async function getAttemptCount() {
    return Attempt.countDocuments();
}

export async function getAverageScore() {
    const scoreAgg = await Attempt.aggregate([{$group: {_id: null, avg: {$avg: "$score"}}}]);
    return scoreAgg[0]?.avg ? Number(scoreAgg[0].avg.toFixed(1)) : 0;
}

export async function getActiveUsersCount() {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const activeUsers = await Attempt.distinct("user", {createdAt: {$gte: weekAgo}});
    return activeUsers.length;
}

export async function getUniqueParticipantsCount() {
    const uniqueParticipants = await Attempt.distinct("user");
    return uniqueParticipants.length;
}

export async function getMostPopularQuiz() {
    const agg = await Attempt.aggregate([
        {$group: {_id: "$quiz", count: {$sum: 1}}},
        {$sort: {count: -1}},
        {$limit: 1},
        {$lookup: {from: "quizzes", localField: "_id", foreignField: "_id", as: "quiz"}},
        {$unwind: "$quiz"}
    ]);
    return agg[0] ? {title: agg[0].quiz.title, attempts: agg[0].count} : {title: null, attempts: 0};
}

export async function getQuestionCount() {
    return Question.countDocuments();
}

export async function getNewUsersCount(days) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    return User.countDocuments({registeredAt: {$gte: since}});
}

export async function getPublicQuizPercent() {
    const [publicQuizCount, qCount] = await Promise.all([
        Quiz.countDocuments({isPublic: true}),
        Quiz.countDocuments()
    ]);
    return qCount > 0 ? Math.round((publicQuizCount / qCount) * 100) : 0;
}

export async function getTopAvgQuizzes() {
    return Quiz.aggregate([
        {$addFields: {avgScore: "$stats.averageScore"}},
        {$sort: {avgScore: -1}},
        {$limit: 3},
        {$project: {title: 1, avgScore: 1}}
    ]);
}

export async function getQuizzesWithoutAttempts() {
    return Quiz.aggregate([
        {$lookup: {from: "attempts", localField: "_id", foreignField: "quiz", as: "attempts"}},
        {$addFields: {attemptsCount: {$size: "$attempts"}}},
        {$match: {attemptsCount: 0}},
        {$project: {title: 1}}
    ]);
}

export async function getAvgAttemptsPerUser() {
    const [aCount, uCount] = await Promise.all([
        Attempt.countDocuments(),
        User.countDocuments()
    ]);
    return uCount > 0 ? (aCount / uCount).toFixed(2) : 0;
}