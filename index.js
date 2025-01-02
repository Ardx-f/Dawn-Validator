const axios = require('axios');
const https = require('https');
const crypto = require('crypto');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');
const accountsData = require('./accounts');
const proxies = require('./proxy');
const config = require('./config');

const apiEndpoints = {
    keepalive: "https://www.aeropres.in/chromeapi/dawn/v1/userreward/keepalive",
    getPoints: "https://www.aeropres.in/api/atom/v1/userreferral/getpoint"
};

const ignoreSslAgent = new https.Agent({
    rejectUnauthorized: false
});

const randomDelay = (min, max) => {
    return new Promise(resolve => {
        const delayTime = Math.floor(Math.random() * (max - min + 1)) + min;
        setTimeout(resolve, delayTime * 1000);
    });
};

const displayWelcome = () => {
    console.log(chalk.magenta(`
╭━━━╮╱╱╱╱╱╱╱╱╱╱╱╭╮╱╱╭╮╱╭╮╱╱╱╭╮╱╱╭╮
╰╮╭╮┃╱╱╱╱╱╱╱╱╱╱╱┃╰╮╭╯┃╱┃┃╱╱╱┃┃╱╭╯╰╮
╱┃┃┃┣━━┳╮╭╮╭┳━╮╱╰╮┃┃╭┻━┫┃╭┳━╯┣━┻╮╭╋━━┳━╮
╱┃┃┃┃╭╮┃╰╯╰╯┃╭╮╮╱┃╰╯┃╭╮┃┃┣┫╭╮┃╭╮┃┃┃╭╮┃╭╯
╭╯╰╯┃╭╮┣╮╭╮╭┫┃┃┃╱╰╮╭┫╭╮┃╰┫┃╰╯┃╭╮┃╰┫╰╯┃┃
╰━━━┻╯╰╯╰╯╰╯╰╯╰╯╱╱╰╯╰╯╰┻━┻┻━━┻╯╰┻━┻━━┻╯`));
   console.log(chalk.bgMagenta.white.bold(`Ardiyan Mahessa - Indropper`));
};

const appIdPrefix = "6752b";

const generateAppId = (token) => {
    const hash = crypto.createHash('md5').update(token).digest('hex');
    return `${appIdPrefix}${hash.slice(0, 19)}`;
};

const appIdFilePath = path.join(__dirname, 'appIds.json');

const loadAppIds = () => {
    if (fs.existsSync(appIdFilePath)) {
        return JSON.parse(fs.readFileSync(appIdFilePath, 'utf-8'));
    }
    return {};
};

const saveAppIds = (appIds) => {
    fs.writeFileSync(appIdFilePath, JSON.stringify(appIds, null, 2));
};

const fetchPoints = async (headers, appId) => {
    try {
        const response = await axios.get(`${apiEndpoints.getPoints}?appid=${appId}`, { headers, httpsAgent: ignoreSslAgent });
        if (response.status === 200 && response.data.status) {
            const { rewardPoint, referralPoint } = response.data.data;
            const totalPoints = (
                (rewardPoint.points || 0) +
                (rewardPoint.registerpoints || 0) +
                (rewardPoint.signinpoints || 0) +
                (rewardPoint.twitter_x_id_points || 0) +
                (rewardPoint.discordid_points || 0) +
                (rewardPoint.telegramid_points || 0) +
                (rewardPoint.bonus_points || 0) +
                (referralPoint.commission || 0)
            );
            return totalPoints;
        } else {
            console.error(chalk.bgRed.white.bold(`Failed Retrieve Points: ${response.data.message || 'Unknown error'}`));
        }
    } catch (error) {
        console.error(chalk.bgRed.white.bold(`Eror: ${error.message}`));
    }
    return 0;
};

const keepAliveRequest = async (headers, email, appId) => {
    const payload = {
        username: email,
        extensionid: "fpdkjdnhkakefebpekbdhillbhonfjjp",
        numberoftabs: 0,
        _v: "1.1.2"
    };

    try {
        const response = await axios.post(`${apiEndpoints.keepalive}?appid=${appId}`, payload, { headers, httpsAgent: ignoreSslAgent });
        if (response.status === 200) {
            return true;
        } else {
            console.warn(chalk.bgRed.white.bold(`Keep-Alive Error For ${email}: ${response.status} - ${response.data.message || 'Unknown error'}`));
        }
    } catch (error) {
        console.error(chalk.bgRed.white.bold(`Error during keep-alive request for ${email}: ${error.message}`));
    }
    return false;
};

const countdown = async (seconds) => {
    for (let i = seconds; i > 0; i--) {
        process.stdout.write(chalk.bgMagenta.white.bold(`Restart In: ${i} Seconds\r`));
        await randomDelay(1, 1);
    }
    console.log(chalk.bgGreen.white.bold("\nRestarting...\n"));
};

const processAccount = async (account, proxy, appIds) => {
    const { email, token } = account;
    const extensionId = "fpdkjdnhkakefebpekbdhillbhonfjjp";

    let appId = appIds[email];
    if (!appId) {
        appId = generateAppId(token);
        appIds[email] = appId;
        saveAppIds(appIds);
    }

    const headers = {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Accept": "*/*",
        "Accept-Encoding": "gzip, deflate, br, zstd",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        "Origin": `chrome-extension://${extensionId}`,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36",
        "Sec-Fetch-Dest": "empty",
        "Sec-Fetch-Mode": "cors",
        "Sec-Fetch-Site": "cross-site"
    };

    if (proxy) headers['Proxy'] = proxy;

    const points = await fetchPoints(headers, appId);

    console.log(chalk.magenta(`Processing: ${email}`));
    console.log(chalk.magenta(`Proxy: ${proxy} `));
    console.log(chalk.magenta(`Points: ${points}`));
    
    const success = await keepAliveRequest(headers, email, appId);
    if (success) {
        console.log(chalk.magenta(`Keep-Alive Success For: ${chalk.bgGreen.white.bold(email)}`));
    } else {
        console.warn(chalk.magenta(`Keep-Alive Failed For: ${chalk.bgRed.white.bold(email)}`));
    }

    return points;
};

const processAccounts = async () => {
    displayWelcome();
    const totalProxies = proxies.length;
    const appIds = loadAppIds();

    while (true) {
        const accountPromises = accountsData.map((account, index) => {
            const proxy = config.useProxy ? proxies[index % totalProxies] : undefined;
            return processAccount(account, proxy, appIds);
        });

        const pointsArray = await Promise.all(accountPromises);
        const totalPoints = pointsArray.reduce((acc, points) => acc + points, 0);

        console.log(chalk.magenta(`All Accounts Processed`));
        console.log(chalk.magenta(`Total points: ${chalk.bgGreen.white.bold(totalPoints)}`));
        await countdown(config.restartDelay);
    }
};

processAccounts();
