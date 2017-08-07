module.exports = {
    PRODUCTION:'production',
    DEVELOPMENT:'development',
    STAGING:'staging',

    production:{
        'secret': 'flexi-the-times-internet-dot-in',
        'database': 'mongodb://username:password@192.168.xx.xx:27017,192.168.xx.xx:27017,192.168.xx.xx:27017/database'
    },
    staging:{
        'secret': 'flexi-the-times-internet-dot-in',
        'database': 'mongodb://username:password@192.168.xx.xx:27017/database'
    },
    development:{
        'secret': 'flexi-the-times-internet-dot-in',
        'database': 'mongodb://localhost:27017/database'
    },
    postmark:{
        cc: "xx.tech@xxxx.in",
        sender: "xx@xxxx.in",
        secret: "xxxx-xxxx-xxxx-xxxx-xxxxxx"
    }
};