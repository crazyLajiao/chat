$(function() {
    $(window).keydown((e)=>{
        //F5刷新
        if(e.keyCode==116){
            if(!confirm("刷新将会清除所有聊天记录，确定要刷新么？")) {
                e.preventDefault()
            }
        }
    })
    let socket = io.connect(),
        from = $.cookie('user'),
        to = 'all'
    //用户上线信号
    socket.emit('online',{user:from})
    socket.on('online',(data)=>{
        let sys
        if(data.user!=from) {
            sys = `<div style="color:#f00">系统（${now()}):用户${data.user}上线了</div>`
        }else {
            sys = `<div style="color:#f00">系统（${now()}):你进入了聊天室</div>`
        }
        $('#contents').append(sys+'</br>')
    //    刷新用户列表
        flushUsers(data.users)
    //    显示正在对谁说话
        showSayTo()
    })

    socket.on('say',(data)=>{
    //    对所有人说
        if(data.to = 'all') {
            $('#contents').append(`<div>${data.from}(${now()})对所有人说：</br>${data.msg}</div>`)
        }
        //对你说
        if(data.to == 'from'){
            $('#contents').append(`<div style="color:#00f">${data.from}(${now()})对你说：</br>${data.msg}</div>`)
        }
    })

    //下线通知
    socket.on('offline',(data)=>{
        let sys = `<div style="color:#f00">系统（${now()}）:用户${data.user}下线了`
        $('#contents').append(sys+'</br>')
        flushUsers(data.users)
        //当正在对某人聊天，ta下线了，则变成对所有人聊天
        if(data.user==to) {
            to = 'all'
        }
        //显示正在对谁说话
        showSayTo()
    })
    //服务器关闭
    socket.on('disconnect',()=>{
        let sys = `<div style="color:#f00">系统：连接服务器失败！</div>`
        $('#contents').append(sys+'</br>')
        $('#list').empty()
    })
//    重新启动服务器
    socket.on('reconnect',()=>{
        let sys = `<div style="color:#f00">系统：重新连接服务器</div>`
        $('contents').append(sys+'</br>')
        socket.emit('online',{user:from})
    })
//    刷新用户在线列表
    function flushUsers(users) {
        $('#list').empty().append('<li title="双击聊天" alt="all" class="sayingto" onselectstart="return false">所有人</li>')
    //    遍历生成新用户列表
        for(let i in users) {
            $('#list').append(`<li alt="${users[i]}" title="双击聊天" onselectstart="return false">${users[i]}</li>`)
        }
    //    双击与某人私聊
        $('#list').on('click','li',function(){
            //点击的不是自己
            if($(this).attr('alt')!=from) {
                to = $(this).attr('alt')
                //清除之前的选中效果
                $('#list > li').removeClass('sayingto')
            //    给新双击的用户添加选中效果
                $(this).addClass('sayingto')
            //    刷新说话对象
                showSayTo()
            }
        })
    }

//    显示正在对话对象
    function showSayTo() {
        $('#from').html(from)
        $('#to').html(to=='all'?'所有人':to)
    }
    //获取当前时间
    function now() {
        let date = new Date()
        let time = date.getFullYear()+'/'+(date.getMonth()+1)+'/'+date.getDate()
            +' '+date.getHours()+':'+(date.getMinutes()<10?('0'+date.getMinutes()):date.getMinutes())
            +':'+(date.getSeconds()<10?('0'+date.getSeconds()):date.getSeconds())
        return time
    }

//    发话
    $('#say').click(function() {
    //    获取发送的信息
        let $msg = $('#input_content').html()
        if($msg=='') return
        if (to == "all") {
            $("#contents").append(`<div>你(=${now()})对所有人说：<br/>${$msg}</div><br />`);
        } else {
            $("#contents").append(`<div style="color:#00f">你(${now()})对${to}说：<br/>${$msg}</div><br />`);
        }
    //    发送
        socket.emit('say',{from,to,msg:$msg})
    //    清空输入框并且获取焦点
        $('#input_content').html("").focus()
    })
})