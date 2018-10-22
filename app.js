const express = require('express'),
    routes = require('./routes'),
    user = require('./routes/user'),
    http = require('http'),
    path = require('path'),
    ejs = require('ejs')
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    app = express()

app.engine('.html',ejs.__express)
app.set('view engine','html')
app.set('views',__dirname+'/views')
app.use(express.static(path.join(__dirname,'public')))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(cookieParser())


//存储用户列表
let users = {}
app.get('/',(req,res)=>{
    console.log(req.cookies)
    if(req.cookies.user==null) {
        res.redirect('/signin')
    }else{
        res.render('index')
    }
})
app.get('/signin',(req,res)=>{
    res.render('signin')
})
app.post('/signin',(req,res)=>{
    if(users[req.body.name]){
        res.redirect('/signin')
    }else{

        res.cookie(user,req.body.name,{maxAge:1000*60*60*24*30})
        res.redirect('/')
    }
})

let server = http.createServer(app)
let io = require('socket.io').listen(server)
io.sockets.on('connection',(socket)=>{
    //有人上线
    socket.on('online',(data)=>{
        socket.name = data.user
        if(!users[data.user]) {
            users[data.user] = data.user
        }
        //向所有用户广播该用户上线
        io.sockets.emit('online',{users,user:data.user})
    })
//    有人说话
    socket.on('say',(data)=>{
        if(data.to=='all') {
            socket.broadcast.emit('say',data)
        }else {
            let clients = io.sockets.clients()
            clients.forEach((client)=>{
                //遍历查找对话的用户
                if(client.name==data.io) {
                    client.emit('say',data)
                }
            })
        }
    })
// 有人下线
    socket.on('disconnect',()=>{
        if(users[socket.name]){
            delete users[socket.name]
            socket.broadcast.emit('offline',{users,user:socket.name})
        }
    })
})


server.listen(8083,()=>{
    console.log('listening on 8083')
})