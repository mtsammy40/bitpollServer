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
    var elecByballotKey = await query('selectElectionByBallotKey', { ballotKey: vt.ballotKey});
    console.log('vt ballotkey', vt.ballotKey);
    console.log('elecByballotKey', elecByballotKey[0].$identifier);
    console.log('election', vt.election.$identifier);
    if(elecByballotKey[0].$identifier === vt.election.$identifier){
        console.log('elecByballotKey passed', elecByballotKey);
        var elecByusedballotKey = await query('selectElectionByusedballotKey', { usedballotKey: vt.ballotKey});
        console.log('election', elecByusedballotKey);
        if(elecByusedballotKey.length === 0){
            console.log('begining vote...');
            let votedCount = vt.candidate.count;
            vt.candidate.count = votedCount +1;
            let candidateRegistry = await getParticipantRegistry('org.bitpoll.net.Candidate');
            await candidateRegistry.update(vt.candidate);
            if(typeof vt.election.usedballotKey !== 'object' || vt.election.usedballotKey.constructor !== Array){
                vt.election.usedballotKey = [];
            }
            var ballotKeys =[];
            ballotKeys.push(vt.ballotKey);
            console.log('ballotKeys', vt.ballotKey);
            vt.election.usedballotKey = vt.election.usedballotKey.concat(ballotKeys);
            let electionRegistry = await getAssetRegistry('org.bitpoll.net.Election');
            await electionRegistry.update(vt.election);
        } else {
            console.log('ballot key already used');
        }
    } else {
        console.log('ballot Key validation failed');
    }
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
    var newCands=[];
    for(var i= 0; i<ce.candidateNames.length; i++){
        var randId = Math.random().toString(36).substr(2, 5);
        let newCand = await factory.newResource('org.bitpoll.net', 'Candidate', randId);
        newCand.name = ce.candidateNames[i];
        newCand.count = 0;
        await candidateRegistry.add(newCand);
        newCands.push(newCand);
    }
    //create ballots
    var newBallots =[];
    var newballotKeys = [];
    for(i=0; i<ce.ballotNo; i++){
        var keys = Math.random().toString(36).substr(2, 5);
        newballotKeys.push(keys);
    }
    //create election
    return getAssetRegistry('org.bitpoll.net.Election')
        .then(function (electionAssetRegistry) {
        // Get the factory for creating new asset instances.
            var factory = getFactory();
            // Create the Election.
            var Election = factory.newResource('org.bitpoll.net', 'Election', Math.random().toString(36).substr(2, 5));
            Election.motion = ce.motion;
            Election.institution = ce.institution;
            if(typeof Election.candidates !== 'object' || Election.candidates.constructor !== Array) {
                Election.candidates = [];
            }
            console.log('candidates', Election.candidates);
            console.log('new cands', newCands);
            //add created candidates to election collection
            Election.candidates = Election.candidates.concat(newCands);
            Election.start = ce.start;
            Election.end = ce.end;
            // Add the election to the election asset registry.
            if(typeof Election.ballotKey !== 'object' || Election.ballotKey.constructor !== Array) {
                Election.ballotKey = [];
            }
            Election.ballotKey = Election.ballotKey.concat(newballotKeys);
            Election.usedballotKey=[];
            console.log('The elections', Election);
            return electionAssetRegistry.add(Election);
        })
        .catch(function (error) {
        // log any errors experienced
            console.log(error);
        });

}
