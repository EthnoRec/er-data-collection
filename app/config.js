var path = require("path");
var config = {};
config.development = {
    tinder: {
        max_results: 10,
        refresh_seconds: 10*60
    },
    gather: {
        image_dir: "gather-images"
    },
    //db: {
        //dialect: "sqlite",
        //storage: path.join(process.cwd(),"tinder.development.db")
    //},
    db: {
        dialect: "postgres",
        host: "127.0.0.1",
        database: "tinder",
        username: "tinder",
        password: "tinder_pw"
    },
    logger: {
        level: "debug"
    }
};
config.production = {
    tinder: {
        max_results: 10,
        refresh_seconds: 10*60
    },
    gather: {
        image_dir: "gather-images"
    },
    db: {
        dialect: "sqlite",
        storage: path.join(process.cwd(),"tinder.development.db")
    },
    logger: {
        level: "info"
    }
};

config.test = {
    tinder: {
        max_results: 10,
        refresh_seconds: 10*60
    },
    gather: {
        image_dir: "gather-images"
    },
    db: {
        dialect: "sqlite",
        storage: path.join(process.cwd(),"tinder.test.db")
    },
    logger: {
        level: "debug"
    }
};

module.exports = config[process.env.NODE_ENV || "development"];
