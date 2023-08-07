//負責Server與Socket
const express = require('express');
const http = require('http');
const path = require('path');
const app = express();
const httpServer = http.Server(app);
const { Server } = require('socket.io');
const io = new Server(httpServer);

//負責發送post請求
const axios = require('axios');
const five = require('johnny-five');

//CP變數
let timer;
let lock=false;
let board = new five.Board({
    port: "COM3", repl: false
});

app.post('/api/ResetCP', async (req, res) => {
    console.log("收到重置 CP 的請求：", req.body); // 顯示請求的內容
    lock = false;
    clearTimeout(timer);
    res.json({ message: "CP reset successful!" }); // 回應一個成功訊息
});

board.on('ready', function () {

    board.pinMode(8, five.Pin.INPUT);

    board.digitalRead(8, function (value) {
        console.log(lock);
        console.log(value);
        if (!lock && value==1) {
            lock = true;
            axios.post('http://127.0.0.1:3030/api/ControlPoint', {"message":"start"})
            timer = setTimeout(function () {
                lock = false;
                axios.post('http://127.0.0.1:3030/api/ControlPoint', {"message":"end"});
            }, 1000000);
        }
        else if(lock && value==1) {
            clearTimeout(timer);
            timer = setTimeout(function () {
                lock = false;
                axios.post('http://127.0.0.1:3030/api/ControlPoint', {"message":"end"});
            }, 1000000);
        }
    });

});

app.use(express.static(__dirname));
httpServer.listen(4000, function () {
    console.log('listening on *:4000');
});