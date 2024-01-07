const debug = require('debug')(`slide:wss`);
const WebSocket = require('ws');
var cuid = require('cuid');

let channels = {}

function init (port) {
    debug('ws init invoked, port:', port)

    const wss = new WebSocket.Server({ port });
    wss.on('connection', (socket) => {
        debug('A client has connected!');
        
        socket.on('error', debug);
        socket.on('message', message => onMessage(wss, socket, message));
        socket.on('close', message => onClose(wss, socket, message));
    })
}

function send(wsClient, type, body) {
    debug('ws send', body);
    wsClient.send(JSON.stringify({
        type,
        body,
    }))
}

function clearClient(wss, socket) {
    // clear all client
    // channels = {}
    Object.keys(channels).forEach((cname) => {
        Object.keys(channels[cname]).forEach((uid) => {
            if (channels[cname][uid] === socket) {
                delete channels[cname][uid]
            }
        })
    })
}

function onMessage(wss, socket, message) {
    debug(`onMessage ${message}`);

    const parsedMessage = JSON.parse(message)
    const type = parsedMessage.type
    const body = parsedMessage.body
    const userId = body.userId
    const channelCuid = body.channelCuid
    
    switch (type) {
        case 'join': {
            const interests = body.interests
            const channelType = body.channelType
            interests.map(interest=>{ return interest.toUpperCase(); });

            let findChannelResults = findChannel(interests, channelType);
            let channelCuid = null;
            console.log('findchannel result', findChannelResults)
            if (findChannelResults) {
                channelCuid = findChannelResults.channelCuid

                console.log(channelCuid);
                console.log( channels[channelCuid])
                channels[channelCuid]['users'][userId] = socket;
                // let newChannelInterests = matchInterests(interests, channel[interests]);
                channels[channelCuid]['interests'] = findChannelResults.matchedInterests;
            } else {
                channelCuid = cuid()
                channels[channelCuid] = {}
                channels[channelCuid]['users'] = {}
                channels[channelCuid]['channelType'] = channelType;
                channels[channelCuid]['users'][userId] = socket;
                channels[channelCuid]['interests'] = interests;
            }
            // const userIds = Object.keys(channels[channelName])
            console.log(channels);
            const channelInfo = [channels[channelCuid]['interests'], channelCuid];
            console.log('channelInfo sent');
            send(socket, 'joined', channelInfo);
            break;
        }
        case 'quit': {
            // quit channel
            console.log('quit invoked')
            if (channels[channelCuid]) {
                const userIds = Object.keys(channels[channelCuid]['users'])
                
                userIds.forEach(id => {
                    const wsClient = channels[channelCuid]['users'][id]
                    if (userId.toString() !== id.toString()) {
                        send(wsClient, 'quit')
                    }
                })
                delete channels[channelCuid]
                console.log('user quit channel', userId)
                console.log('channels', channels)
            }
            break;
        }
        case 'send_offer': { 
            // exchange sdp to peer 
            const sdp = body.sdp;
            let userIds = Object.keys(channels[channelCuid]['users']);
            console.log('userids to send offer', userIds);

            const interests = channels[channelCuid]['interests']
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    console.log('offer sent');
                    const wsClient = channels[channelCuid]['users'][id]
                    send(wsClient, 'offer_sdp_received', {sdp, interests})
                }
            })
            break;
        }
        case 'send_answer': { 
            console.log('send_answer invoked');
            // exchange sdp to peer 
            const sdp = body.sdp
            let userIds = Object.keys(channels[channelCuid]['users']);
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelCuid]['users'][id]
                    send(wsClient, 'answer_sdp_received', sdp)
                }
            })
            break;
        }
        case 'send_ice_candidate': {
            const candidate = body.candidate
            let userIds = Object.keys(channels[channelCuid]['users']);
            userIds.forEach(id => {
                if (userId.toString() !== id.toString()) {
                    const wsClient = channels[channelCuid]['users'][id]
                    send(wsClient, 'ice_candidate_received', candidate)
                }
            })
        }
        default:
            break;
    }

    // // Send message back to all clients connected
    // wss.clients.forEach(client => {
    //     if (client !== socket && client.readyState === WebSocket.OPEN) {
    //         client.send(message, { binary: isBinary });
    //     }
    // });
}

function onClose(wss, socket, message) {
    debug('onClose', message);
    clearClient(wss, socket)
}


function matchInterests(arr1, arr2) {
    console.log(arr1, arr2);
   // converting into Set
   const setA = new Set(arr1);
   const setB = new Set(arr2);

   let intersectionResult = [];

   for (let i of setB) {
   
       if (setA.has(i)) {
           intersectionResult.push(i);
       }
       
   }
   console.log('intersection', intersectionResult)
   return intersectionResult;
}

// Non-null if match
function findChannel(interests, channelType) {
    // Get all channel cuids
    let channelCuids = Object.keys(channels)

    for(var i = 0; i < channelCuids.length; i++) {
        const channelCuid = channelCuids[i];

        // Get number of users in channel
        let userIds = Object.keys(channels[channelCuids[i]]['users'])

        if (channels[channelCuids[i]]['channelType'] != channelType) {
            return null;
        }

        if(userIds.length < 2 ) {
            if (interests.length === 0 && channels[channelCuids[i]]['interests'].length === 0) {
                let matchedInterests = []
                return {channelCuid, matchedInterests};
            }

            let matchedInterests = matchInterests(interests, channels[channelCuids[i]]['interests']);
        
            if (matchedInterests.length > 0) {
                return {channelCuid, matchedInterests};
            }
        }
        
      }

    return null;
}

module.exports = {
    init,
}