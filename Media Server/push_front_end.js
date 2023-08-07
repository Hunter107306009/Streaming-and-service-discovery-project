let peerConnection_list= [];
let socket
const servers = {
	iceServers:[
		{
			urls:['stun:stun1.l.google.com:19302','stun:stun2.l.google.com:19302']
		}
	]
}

socket = io.connect();


socket.on('start_screen',async function (message) {
	createPC("screen",peerConnection_list.length+1)
});

socket.on('start_camera',async function (message) {
	createPC("camera",peerConnection_list.length+1)
});

async function createPC(MediaType,pcnumber) {
  	let localStream;
	let peerConnection;
	if (MediaType=="camera")
	{
		localStream = await navigator.mediaDevices.getUserMedia({video:true,audio:false})
	}
	else
	{
		try {
	      localStream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'screen' }, audio: true });
	    } catch (err) {
	      console.error('Error accessing screen sharing:', err);
	      return;
	    }
	}
	//document.getElementById("user-"+pcnumber).srcObject=await localStream;
	peerConnection = new RTCPeerConnection(servers);
	peerConnection_list.push(peerConnection);
	
	localStream.getTracks().forEach(async (track) => {
		await peerConnection_list[pcnumber-1].addTrack(track,localStream);
	})

	peerConnection_list[pcnumber-1].onicecandidate = async(event) => {
		if(event.candidate){
			console.log("Send ICE Candidate :",event.candidate);
			await socket.emit('front_to_back_ICE', JSON.stringify({'type':'candidate','candidate':event.candidate}));
		}
	}
	await createOffer(pcnumber);
	await socket.on('back_to_front_SDP',async function (message) {
		message=await JSON.parse(message);
        await addAnswer(message.answer,pcnumber);
    });
    await socket.on('back_to_front_ICE',async function (message) {
    	message=await JSON.parse(message);
        if(peerConnection_list[pcnumber-1]){
        	console.log("Add ICE Candidate :",new RTCIceCandidate(message.candidate));
			await peerConnection_list[pcnumber-1].addIceCandidate(new RTCIceCandidate(message.candidate));
		}
    });
}

let createOffer = async(pcnumber) => {
	let offer = await peerConnection_list[pcnumber-1].createOffer();
	await peerConnection_list[pcnumber-1].setLocalDescription(offer);
	console.log('Create Offer:',offer);
	await socket.emit('front_to_back_SDP', JSON.stringify({'type':'offer','offer':offer}));
}

let addAnswer = async(answer,pcnumber) => {
	if(!peerConnection_list[pcnumber-1].currentRemoteDescription){
		console.log('Receive Answer:',new RTCSessionDescription(answer));
		await peerConnection_list[pcnumber-1].setRemoteDescription(new RTCSessionDescription(answer));
	}
}
