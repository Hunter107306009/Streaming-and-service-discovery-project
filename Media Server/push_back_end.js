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

//接收另一方要求的多媒體類型
let media_type;

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
    await socket.on('front_to_back_SDP', async function (message) {
        console.log('SDP已送出');
        await axios.post('http://'+remote_IP+'/api/UpdateSDP', {"id":connection_id.toString(),"SDP":message})
        .catch(function (error) {
            console.log(error);
        });
    });

    await socket.on('front_to_back_ICE', async function (message) {
        console.log('ICE已送出');
        await axios.post('http://'+remote_IP+'/api/UpdateICE', {"id":connection_id.toString(),"ICE":message})
        .catch(function (error) {
            console.log(error);
        });

    });
});

mdns.on('query', async (query) => {
    await query.questions.forEach(async function (Q) {
        if (Q.type == 'TXT' && Q.name=="_video-stream.local")
        {
            remote_IP=await query.additionals[0].data[0].toString().split('/')[0]
            connection_id=await query.additionals[0].data[0].toString().split('/')[1];
            media_type=await query.additionals[0].data[0].toString().split('/')[2];
            if (media_type=="screen")
            {
                await io.sockets.emit('start_screen', '');
            }
            else
            {
                await io.sockets.emit('start_camera', '');
            }
            console.log("收到啟動訊息，本次通訊的ID為:"+connection_id);
            console.log("收到啟動回應，已知曉對方IP:"+remote_IP);
            const response = await{
                questions: [
                    {
                        name: Q.name,
                        type: Q.type,
                    },
                ],
                answers: [
                    {
                        name: Q.name,
                        type: 'TXT',
                        data: localIP+':3000',
                    },
                ],
            };
            await mdns.respond(response);
        }
    });
});

app.post('/api/UpdateSDP', async (req, res) => {
    console.log("收到SDP(mdns)");
    await io.sockets.emit('back_to_front_SDP', req.body.SDP);
});

app.post('/api/UpdateICE', async (req, res) => {
    console.log("收到ICE(mdns)");
    await io.sockets.emit('back_to_front_ICE', req.body.ICE);
});

app.use(express.static(__dirname));
httpServer.listen(3000, function () {
    console.log('listening on *:3000');
});