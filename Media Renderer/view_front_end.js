let localStream
let peerConnection
let socket
const servers = {
	iceServers:[
		{
			urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
		}
	]
}

document.getElementById("ask_screen").onclick = function () {
	socket.emit('start_screen', '');
};

document.getElementById("ask_camera").onclick = function () {
	socket.emit('start_camera', '');
};

async function closeConnection() {
	console.log("cp_close");
	if (localStream) {
		localStream.getTracks().forEach((track) => {
			track.stop();
		});
		localStream = null;
	}

  	if (peerConnection) {
    	peerConnection.close();
    	peerConnection = null;
  	}
}


let init = async() => {
	socket = await io.connect()
	await socket.emit('reset_CP', '');
	await socket.on('back_to_front_SDP', async function (message) {
		message=await JSON.parse(message);
		console.log('後端的SDP:'+message);
      await createAnswer(message.offer);
   });
   await socket.on('back_to_front_ICE', async function (message) {
    	message=await JSON.parse(message);
      if(peerConnection){
        	console.log("Add ICE Candidate :",new RTCIceCandidate(message.candidate));
			await peerConnection.addIceCandidate(new RTCIceCandidate(message.candidate));
		}
   });
   await socket.on('end_connection', async function (message) {
   	closeConnection();
   });
}

let createPeerConnection = async() => {
	peerConnection = new RTCPeerConnection(servers);
	
	localStream = new MediaStream()
	document.getElementById("user-2").srcObject=await localStream;

	peerConnection.ontrack =async (event) => {
		console.log(event.streams[0].getTracks());
		await event.streams[0].getTracks().forEach(async (track) => {
			await localStream.addTrack(track);
		})
		console.log(checkStream(localStream));
	}

	peerConnection.onicecandidate = async(event) => {
		if(event.candidate){
			console.log("Send ICE Candidate :",event.candidate);
			await socket.emit('front_to_back_ICE', JSON.stringify({'type':'candidate','candidate':event.candidate}));
		}
	}
}

let createAnswer = async(offer) => {
	await createPeerConnection();

	console.log('Receive Offer:',new RTCSessionDescription(offer));
	await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));

	let answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answer);

	//console.log('Create Answer:',answer)
	await socket.emit('front_to_back_SDP', JSON.stringify({'type':'answer','answer':answer}));
}

async function checkStream(stream){

   var hasMedia=await {hasVideo:false,hasAudio:false};

   if(stream.getAudioTracks().length)
      hasMedia.hasAudio=await true;

   if(stream.getVideoTracks().length)
      hasMedia.hasVideo=await true;

    return hasMedia; 
}

init();