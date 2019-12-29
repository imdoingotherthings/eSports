const router = require('express').Router();
const puppeteer = require('puppeteer');
// const rtg   = require("url").parse(process.env.REDISTOGO_URL);
const redis = require('redis');
// const client = redis.createClient(rtg.port, rtg.hostname);
// client.auth(rtg.auth.split(":")[1]);
const client = redis.createClient();

client.on('error', function(err) {
    console.log(`Redis error: ${err}`);
});

async function LoL () {
    try {
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox'] 
        });
        const page = await browser.newPage();
        await page.goto('https://watch.lolesports.com/schedule?leagues=worlds,lcs,lec,lck,lpl,lcs-academy,turkiye-sampiyonluk-ligi,cblol-brazil,lla,oce-opl,ljl-japan,msi,all-star,rift-rivals-na-eu,rift-rivals-kr-cn-lms-vn,league-of-legends-college-championship,european-masters');
        
        await page.waitForSelector('.EventMatch', {
            visible: true,
        });

        const data  = await page.evaluate(() => {
            const hour = document.querySelectorAll('.EventMatch .time .hour');
            const ampm = document.querySelectorAll('.EventMatch .time .ampm');
            const team1 = document.querySelectorAll('.EventMatch .teams .team1 .team-info .name');
            const team2 = document.querySelectorAll('.EventMatch .teams .team2 .team-info .name');
            const team1_tricode = document.querySelectorAll('.EventMatch .teams .team1 .team-info .tricode');
            const team2_tricode = document.querySelectorAll('.EventMatch .teams .team2 .team-info .tricode');
            const team1_winloss = document.querySelectorAll('.EventMatch .teams .team1 .team-info .winloss');
            const team2_winloss = document.querySelectorAll('.EventMatch .teams .team2 .team-info .winloss');
            const team1_scoreTeam1 = document.querySelectorAll('.EventMatch .teams .score .scoreTeam1');
            const team2_scoreTeam2 = document.querySelectorAll('.EventMatch .teams .score .scoreTeam2');
            const leagueName = document.querySelectorAll('.EventMatch .league .name');
            const leagueStrategy = document.querySelectorAll('.EventMatch .league .strategy');
            const eventVideo = document.querySelectorAll('.EventMatch .single');

            const mainArr = [];

            if (hour.length !== ampm.length) {
                console.log({error: 'Not able to retrieve data'});
            }

            for (let i = 0; i < hour.length; i++) {
                mainArr.push(
                    {schedule: 
                        {
                            hour: hour[i].innerText, 
                            timeOfDay: ampm[i].innerText,
                            team1: team1[i].innerText,
                            team2: team2[i].innerText,
                            team1_tricode: team1_tricode[i].innerText,
                            team2_tricode: team2_tricode[i].innerText,
                            team1_winloss: team1_winloss[i].innerText,
                            team2_winloss: team2_winloss[i].innerText,
                            team1_scoreTeam1: team1_scoreTeam1[i].innerText,
                            team2_scoreTeam2: team2_scoreTeam2[i].innerText,
                            leagueName: leagueName[i].innerText,
                            leagueStrategy: leagueStrategy[i].innerText,
                            event: `https://watch.lolesports.com${eventVideo[i].getAttribute('href')}`
                        }
                    }
                );
            }
            return mainArr;
        });
        await page.close();
        return {data};
    } catch (err) {
        console.log(err);
    }
};

router.get('/api/lol', (req, res) => {
    const RedisKey = 'LoL';

    client.get(RedisKey, function(err, data) {
        if (data) {
            console.log('Key found... now caching...');
            res.json({ source: 'cached', data: JSON.parse(data) });
        } else {
            LoL()
            .then(data => {
                console.log('not cached... now calling api...');
                client.setex(RedisKey, 3600, JSON.stringify(data));
                return res.json({ source: 'api', data: data });
            })
            .catch(err => {
                console.log(err);
            });
        }
    });
    console.log('/api/lol hit');
});


module.exports = router;