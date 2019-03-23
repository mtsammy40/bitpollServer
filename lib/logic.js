/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

'use strict';

/**
 * Write your transction processor functions here
 */

/**
 * voting
 * @param {org.bitpoll.net.Voting} vt voting parameter
 * @transaction
 */
async function voting(vt) {
    console.log(vt.candidate.count);
    //check if ballot is valid
    var elecByballotKey = await query('selectElectionByBallotKey', { ballotKey: vt.ballotKey });
    console.log('vt ballotkey', vt.ballotKey);
    console.log('elecByballotKey', elecByballotKey[0].$identifier);
    console.log('election', vt.election.$identifier);
    if (elecByballotKey[0].$identifier === vt.election.$identifier) {
        console.log('elecByballotKey passed', elecByballotKey);
        var elecByusedballotKey = await query('selectElectionByusedballotKey', { usedballotKey: vt.ballotKey });
        console.log('election', elecByusedballotKey);
        var today = new Date();
        if (elecByusedballotKey.length === 0 && elecByballotKey[0].start >= today.getDate() && elecByballotKey[0].end > today.getDate()) {
            console.log('begining vote...');
            let votedCount = vt.candidate.count;
            vt.candidate.count = votedCount + 1;
            let candidateRegistry = await getParticipantRegistry('org.bitpoll.net.Candidate');
            await candidateRegistry.update(vt.candidate);
            if (typeof vt.election.usedballotKey !== 'object' || vt.election.usedballotKey.constructor !== Array) {
                vt.election.usedballotKey = [];
            }
            var ballotKeys = [];
            ballotKeys.push(vt.ballotKey);
            console.log('ballotKeys', vt.ballotKey);
            vt.election.usedballotKey = vt.election.usedballotKey.concat(ballotKeys);
            let electionRegistry = await getAssetRegistry('org.bitpoll.net.Election');
            let voteNotif = getFactory().newEvent('org.bitpoll.net', 'NewVote');
            voteNotif.candidate = vt.candidate;
            voteNotif.election = vt.election;
            voteNotif.count = vt.candidate.count;
            emit(voteNotif);
            await electionRegistry.update(vt.election);
            return 'Successful';
        } else {
            console.log('ballot key already used or date validation failed');
            return 'Error: ballot Key already used';
        }
    } else {
        console.log('ballot Key validation failed');
        return 'Error: ballot Key validation failed';
    }
}


/**
 * BoothVote
 * @param {org.bitpoll.net.BoothVote} vb BoothVote parameter
 * @transaction
 */
async function BoothVote(vb) {
    console.log('data', vb);
    //check if ballot is valid
    var elecByboothKey = await query('selectElectionByBoothKey', { boothKey: vb.boothKey });
    console.log('vb boothKey', vb.boothKey);
    console.log('elecByboothKey', elecByboothKey[0].$identifier);
    console.log('election', vb.election.$identifier);
    if (elecByboothKey[0].$identifier === vb.election.$identifier) {
        console.log('elecByboothKey passed', elecByboothKey);
        var elecByusedboothKey = await query('selectElectionByusedboothKey', { usedboothKey: vb.boothKey });
        console.log('election', elecByusedboothKey);
        var today = new Date();
        if (elecByusedboothKey.length === 0 && elecByboothKey[0].start >= today.getDate() && elecByboothKey[0].end > today.getDate()) {
            console.log('begining vote...');
            let votedCount = vb.candidate.count;
            vb.candidate.count = votedCount + 1;
            let candidateRegistry = await getParticipantRegistry('org.bitpoll.net.Candidate');
            await candidateRegistry.update(vb.candidate);
            if (typeof vb.election.usedboothKey !== 'object' || vb.election.usedboothKey.constructor !== Array) {
                vb.election.usedboothKey = [];
            }
            var boothKeys = [];
            boothKeys.push(vb.boothKey);
            console.log('boothKeys', vb.boothKey);
            vb.election.usedboothKey = vb.election.usedboothKey.concat(boothKeys);
            let electionRegistry = await getAssetRegistry('org.bitpoll.net.Election');
            let voteNotif = getFactory().newEvent('org.bitpoll.net', 'NewVote');
            voteNotif.candidate = vb.candidate;
            voteNotif.election = vb.election;
            voteNotif.count = vb.candidate.count;
            emit(voteNotif);
            await electionRegistry.update(vb.election);
            return 'Successful';
        } else {
            console.log('booth Key already used or date validation failed');
            return 'Error: booth Key already used';
        }
    } else {
        console.log('booth Key validation failed');
        return 'Error: booth Key validation failed';
    }
}

/**
 * RecordVoted
 * @param {org.bitpoll.net.RecordVoted} rv RecordVoted parameter
 * @transaction
 */
async function RecordVoted(rv) {
    let voter = rv.voter;
    let VoterRegistry = await getParticipantRegistry('org.bitpoll.net.Voter');
    if (typeof rv.voter.hist !== 'object' || rv.voter.hist.constructor !== Array) {
        rv.voter.hist = [];
    }
    voter.hist.push(rv.election);
    await VoterRegistry.update(voter);
}
/**
 * RecordVotedBooth
 * @param {org.bitpoll.net.RecordVotedBooth} rv RecordVotedBooth parameter
 * @transaction
 */
async function RecordVotedBooth(rv) {
    let voter = rv.voter;
    let VoterRegistry = await getParticipantRegistry('org.bitpoll.net.Voter');
    if (typeof rv.voter.hist !== 'object' || rv.voter.hist.constructor !== Array) {
        rv.voter.hist = [];
    }
    voter.hist.push(rv.election);
    await VoterRegistry.update(voter);
    let electionRegistry = await getAssetRegistry('org.bitpoll.net.Election');
    let election = await electionRegistry.get(rv.election.electionId);
    console.log('election booth = ', election);
    var Valids = election.boothKey.filter(x => !election.usedboothKey.includes(x));
    return Valids[0];
}


/**
 * Create Admin
 * @param {org.bitpoll.net.CreateAdminy} ca Create Admin parameter
 * @transaction
 */
async function CreateAdminy(ca) {
    console.log(ca);
    let AdminRegistry = await getParticipantRegistry('org.bitpoll.net.Admin');
    var factory = getFactory();
    let newAdmin = factory.newResource('org.bitpoll.net', 'Admin', ca.id);
    newAdmin.name = ca.name;
    newAdmin.email = ca.email;
    newAdmin.gender = ca.gender;
    newAdmin.dob = ca.dob;
    newAdmin.nationality = ca.nationality;
    newAdmin.county = ca.county;
    newAdmin.phoneNo = ca.phoneNo;
    newAdmin.dp = ca.dp;
    await AdminRegistry.add(newAdmin);
}

/**
 * Create Election
 * @param {org.bitpoll.net.CreateElection} ce create elections
 * @transaction
 */
async function createElection(ce) {
    console.log('starting to create new election');
    // Get the election asset registry.
    let candidateRegistry = await getParticipantRegistry('org.bitpoll.net.Candidate');
    var factory = getFactory();
    //Create new candidate
    var newCands = [];
    for (var i = 0; i < ce.candidateNames.length; i++) {
        var randId = Math.random().toString(36).substr(2, 5);
        let newCand = await factory.newResource('org.bitpoll.net', 'Candidate', randId);
        newCand.name = ce.candidateNames[i];
        newCand.category = ce.categories[i];
        newCand.count = 0;
        await candidateRegistry.add(newCand);
        newCands.push(newCand);
    }
    //create ballots and booths
    var newBallots = [];
    var newballotKeys = [];
    for (i = 0; i < ce.ballotNo; i++) {
        var keys = Math.random().toString(36).substr(2, 5);
        newballotKeys.push(keys);
    }
    var newboothKeys = [];
    for (i = 0; i < ce.ballotNo; i++) {
        var keyss = Math.random().toString(36).substr(2, 5);
        newboothKeys.push(keyss);
    }
    //create election
    var RainId = Math.random().toString(36).substr(2, 5);
    return getAssetRegistry('org.bitpoll.net.Election')
        .then(function (electionAssetRegistry) {
            // Get the factory for creating new asset instances.
            var factory = getFactory();
            // Create the Election.
            var Election = factory.newResource('org.bitpoll.net', 'Election', RainId);
            Election.motion = ce.motion;
            Election.admin = ce.admin;
            if (typeof Election.candidates !== 'object' || Election.candidates.constructor !== Array) {
                Election.candidates = [];
            }
            console.log('candidates', Election.candidates);
            console.log('new cands', newCands);
            //add created candidates to election collection
            Election.candidates = Election.candidates.concat(newCands);
            Election.start = ce.start;
            Election.end = ce.end;
            Election.institution = ce.institution;
            // Add the election to the election asset registry.
            if (typeof Election.ballotKey !== 'object' || Election.ballotKey.constructor !== Array) {
                Election.ballotKey = [];
            }
            if (typeof Election.boothKey !== 'object' || Election.boothKey.constructor !== Array) {
                Election.boothKey = [];
            }
            Election.ballotKey = Election.ballotKey.concat(newballotKeys);
            Election.boothKey = Election.boothKey.concat(newboothKeys);
            Election.usedballotKey = [];
            Election.usedboothKey = [];
            console.log('The elections', Election);
            let newElectionNotif = getFactory().newEvent('org.bitpoll.net', 'NewElection');
            newElectionNotif.motion = Election.motion;
            newElectionNotif.election = Election;
            newElectionNotif.start = Election.start;
            newElectionNotif.end = Election.end;
            newElectionNotif.admin = ce.admin;
            emit(newElectionNotif);
            console.log('ce.admin', ce.admin);
            var inst = 'resource:org.bitpoll.net.Institution#' + ce.admin.institution.$identifier;
            console.log('institution', ce.admin.institution.$identifier);
            var Candidates = [];
            Election.candidates.forEach((c) => {
                Candidates.push(c.email);
            });
            var emailData = {};
            var CleanElection = {
                motion: Election.motion,
                start: Election.start,
                end: Election.end,
                candidates: Candidates,
                admin: Election.$identifier,
                electionId: Election.$identifier
            };
            var voters = query('selectVotersByInstitution', { institution: inst }).then(function (voter) {
                var emails = [];
                voter.forEach(votr => {
                    emails.push(votr.email);
                });
                emailData = {
                    ballotKeys: newballotKeys,
                    recepients: emails,
                    election: CleanElection
                };
                console.log('voters', voter);
                console.log('newelection', Election);
                var mailSent = sendMail(emailData);
                console.log('mailSent', emailData);
            });

            return electionAssetRegistry.add(Election);
        })
        .catch(function (error) {
            // log any errors experienced
            console.log(error);
        });
    // eslint-disable-next-line require-jsdoc
    async function sendMail(data) {
        const sender = await request.post({ uri: 'http://angeliaforos.herokuapp.com/newElection/', json: data }).then(res => {
            return res;
        });
        return sender;
    }

}
