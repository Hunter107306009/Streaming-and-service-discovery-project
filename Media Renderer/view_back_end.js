//負責Server與Socket
const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const httpServer = http.Server(app);
const { Server } = require('socket.io');
const io = new Server(httpServer);

//負責與MDNS的通訊
let mdns = require('multicast-dns')();
let txt = require('dns-txt')();

//通訊渠道編號
let connection_id;

//負責解析post訊息的主要內容
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

//負責發送post請求
const axios = require('axios');

//記錄另一方的IP
let remote_IP;

//索要影像的初始值
let media_type='screen'

//索要本地IP
const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  let localIP = null;

  Object.keys(interfaces).forEach((interfaceName) => {
    const interfaceData = interfaces[interfaceName];
    
    interfaceData.forEach((data) => {
      if (data.family === 'IPv4' && !data.internal) {
        localIP = data.address;
      }
    });
  });

  return localIP;
}

const localIP = getLocalIP();
console.log('Local IP:', localIP);


io.on('connection', async function (socket) {
    
    await socket.on('start_screen', async function (message) {
        media_type='screen';
    	await init();
    });

    await socket.on('start_camera', async function (message) {
        media_type='camera';
        await init();
    });

    await socket.on('front_to_back_SDP', async function (message) {
        console.log('SDP已送出');
        await axios.post('http://'+remote_IP+'/api/UpdateSDP', {"id":connection_id.toString(),"SDP":message})
        .catch(function (error) {
            console.log(error);
        });
    });

    socket.on('front_to_back_ICE', async function (message) {
        console.log('ICE已送出');
        await axios.post('http://'+remote_IP+'/api/UpdateICE', {"id":connection_id.toString(),"ICE":message})
        .catch(function (error) {
            console.log(error);
        });
    });

    socket.on('reset_CP', async function (message) {  
        try {
            const response = await axios.post('http://127.0.0.1:4000/api/ResetCP', '');
            console.log('回應資料:', response.data);
            } catch (error) {
            console.error('請求發生錯誤:', error.message);
        }
    });
});

app.post('/api/ControlPoint', async (req, res) => {
    console.log(req.body.message)
    if (req.body.message=="start")
    {
        media_type='screen';
        await init();
    }
    else if (req.body.message=="end")
    {
        await io.sockets.emit('end_connection', 'end');
    }
});

app.post('/api/UpdateSDP', async (req, res) => {
    console.log("收到SDP(mdns)");
    await io.sockets.emit('back_to_front_SDP', req.body.SDP);
});

app.post('/api/UpdateICE', async (req, res) => {
    await io.sockets.emit('back_to_front_ICE', req.body.ICE);
});

let init = async() => {
	connection_id=await Math.floor(Math.random()*50000000000000).toString();
    const query = await {
      questions: [
        {
          name: '_video-stream.local',
          type: 'TXT',
        },
      ],
      additionals: [
        {
          name: '_video-stream.local',
          type: 'TXT',
          data: localIP+':3030/'+connection_id.toString()+'/'+media_type,
        },
      ],
    };
    await mdns.query(query);
    console.log("發送啟動訊息，本次通訊的ID為:"+connection_id);
    await mdns.on('response', async (response) => {
        await response.answers.forEach(async function (R) {
            if (R.type == 'TXT' && R.name=="_video-stream.local")
            {
                remote_IP=await response.answers[0].data[0];
                console.log('收到Video回應，已知曉對方IP:'+response.answers[0].data[0]);
            }
        })
    });
}

app.use(express.static(__dirname));
httpServer.listen(3030, function () {
    console.log('listening on *:3030');
});