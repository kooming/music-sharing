require('dotenv').config();


const express = require('express');
const socketio = require('socket.io');
const fs = require('fs')
const path = require('path')
const {mainRouter} = require('./routers/index')
const cookieParser = require('cookie-parser');

const app = express();


app.set('view engine', 'ejs');
app.use("/public", express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({extended:false}));
app.use(cookieParser());


app.use(mainRouter);

const server = app.listen(3000, ()=>{
    console.log('server on~')
})
const io = socketio(server)

io.on('connection', (socket)=>{
    console.log('클라이언트 입장')

})