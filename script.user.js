// ==UserScript==
// @name          Sheets challenge test
// @description   Upload scores to google sheets
// @version       0.0.1
// @author        echandler
// @match         https://www.geoguessr.com/*
// @run-at        document-start
// @license       MIT
// @namespace     google sheets
// @grant         none
// @unwrap
// @downloadURL
// @updateURL
// @tag           games
// ==/UserScript==

(function () {
    "use strict";
    document.head.insertAdjacentHTML(
        "beforeend",
        `<style id="sheetsStyles">
        @font-face {
            font-family: 'password';
            font-style: normal;
            font-weight: 400;
            src: url(https://jsbin-user-assets.s3.amazonaws.com/rafaelcastrocouto/password.ttf);
        }
        a {
            color: blue;
            text-decoration: underline;
        }
        dialog * {
            overscroll-behavior: none;
        }
        .section {
           display: none; 
           height: 100%;
           flex-direction: column;
        }
        .opened {
           display: flex !important; 
        }
        .nav-btn {
            padding: 0.75rem 1rem 0.75rem 1rem; background-color: blue; color: white; cursor: pointer;
        }
        .nav-btn:hover {
           background-color: aquamarine !important; 
        }
        .abtn {
            cursor: pointer;
            background-color: blue;
            padding: 0.75rem 1rem 0.75rem 1rem; 
            color: white;   
        }
        .abtn:hover {
           background-color: aquamarine !important; 
        }
        .abtn:disabled {
           background-color: red !important; 
        }
        .delBtn {
            color: grey;
            cursor: pointer;
            position: relative;
            left: -0.5rem;
            top: -0.5rem;
            width: fit-content;
        }
        .delBtn:hover {
            color: black; 
        }
            label {
                padding: 0.5rem 0rem 0.5rem 0rem; 
            }
        </style>`,
    );

    const mainBtn = document.createElement("button");
    mainBtn.innerHTML = "Sheets";
    mainBtn.style.cssText = `position: fixed; bottom: 1em; left: 1em; z-index: 9999; background-color: rgb(0 0 255 / 19%);`;
    document.body.appendChild(mainBtn);

    const dialogBody = document.createElement("div");

    const dialog = document.createElement("dialog");
    dialog.id = "_dialog";
    dialog.style.cssText = "width: 90vw; height: 90vh;background: rgb(243 244 246 );";
    //dialog.setAttribute('closedby', "any");
    dialog.closedBy = "any";
    dialog.innerHTML = `
        <div style="height: 95%; width: 100%;display: flex;";>
        <nav style="display: flex; flex-direction: column; padding: 1rem;background: white;">
            <menu style="list-style: none; margin: 0px; padding: 0px;">
                <li id="li_menu" style="margin-bottom: 1rem;" >
                    <button s="1"class="nav-btn">section 1</button>
                </li>
                <li id="li_menu" style="margin-bottom: 1rem;" >
                    <button s="2" class="nav-btn">section 2</button>
                </li>
                <li id="li_menu" style="margin-bottom: 1rem;" >
                    <button s="3" class="nav-btn">section 3</button>
                </li>
            </menu>
        </nav>
        <main style="flex: 1 1 0%; padding: 2rem; overflow: auto;">

            <section id="section1" class="section opened">
                <h1 style="margin-bottom: 1rem">Section 1</h1>
                <div id="gamesIds" style="display: flex; flex-direction: column;">
                </div>
                <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="insert_new_game">Insert New Game ID</button>
                <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="save_game_info">Save</button>
            </section>

            <section id="section2" class="section">
                <h1 style="margin-bottom: 1rem">Section 2</h1>
                <div style="display: flex; flex-direction: column; margin-bottom: 1rem;">
                    <a style="color: blue; text-decoration: underline;" target='_blank' href="https://console.cloud.google.com/auth/clients">Link to Oath Client page</a>
                    <label><input id="oauth_client_id" style="width: 15rem; margin-right: 1rem;"></input>Google OAuth Client Id</label> 
                    <label><input id="oauth_secret_code" style="width: 15rem; font-family: 'password'; margin-right: 1rem;"></input>Google OAuth Client Secret</label> 
                    <label><input id="oauth_redirect_url" style="width: 15rem; margin-right: 1rem;"></input>Google OAuth Redirect URL</label> 
                    <label><input id="oauth_code_from_url" style="width: 15rem; margin-right: 1rem;"></input>Google OAuth Code from URL</label> 
                    <code style="font-size: 12px; margin-bottom: 1rem;">Example of a redirected URL with the "code" that you need to copy for the "Google OAuth Code from URL" field:<br></br>
                        https://<span style="color: blue;">[YOUR REDIRECT URL]</span>/?state=state_parameter_passthrough_value&code=<span style="color: red;">4/0AVNBsJhQu43RVWoI-FKsAEArICW34RUhA8agFa8eu7Ity6q8gbs7cwxjcI91wtu3MVWk6B</span>&scope=https://www.googleapis.com/auth/drive
                    </code>
                    <code id="OAuth_url" style="font-size: 12px; overflow-wrap: break-word; padding: 5px;">-Press Save button for Authentication URL-</code> 
                    </div>

                <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="save_work_info">Save</button>
                <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="get_initial_token">Get initial token</button>
            </section>

            <section id="section3" class="section">
                <h1 style="margin-bottom: 1rem">Section 3</h1>
                <div id="update_spreadsheet_options" style="display: flex; flex-direction: column; margin-bottom: 1rem;">
                    <label><input id="google_spreadsheet_id" style="width: 15rem; margin-right: 1rem;"></input>Google Spreadsheet #ID (from spreadsheet URL)</label> 
                    <label>Start updating Google Sheet after this date <input id="update_start_date" type="datetime-local" style="width: 15rem; margin-right: 1rem;"></input></label> 
                    <label>Stop updating Google Sheet after this date <input id="update_stop_date" type="datetime-local" style="width: 15rem; margin-right: 1rem;"></input></label> 
                    <label>Update Google Sheet every <input id="update_sheet_minutes" type="number" style="width: 5rem; margin-right: 1rem; margin-left: 1rem;" value="0"></input> minutes (Minimum 1 minute)</label> 
                    <label>Save data to this sheet <input id="update_sheet_sheetName" style="width: 5rem; margin-right: 1rem; margin-left: 1rem;" value="Sheet2"></input></label> 
                    <label>URL for App Script <input id="update_sheet_AppScript" style="width: 15rem; margin-right: 1rem; margin-left: 1rem;" value=""></input> (Optional: runs after spreadsheet update; GET method only.)</label> 
                </div>                
                <div>
                    <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="save_update_info">Save</button>
                </div>
                <div>
                    <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="clear_database">Delete database</button>
                </div>
                <div>
                    <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="fetch_update_spreadsheet_automatically">Updat spreadsheet with game info. AUTOMATICALLY</button><span id="autoUpdateMessage" style="color: red;"></span>
                </div>
                <div>
                    <button style="align-self: flex-start;margin: 1rem;" class="abtn" id="fetch_update_spreadsheet">Update spreadsheet with game info. ONE TIME</button>
                </div>
            </section>
        </main>
   </div> 
        <div style="height: 5%; display: flex;">
        <span style="margin-right: 1rem; flex: 0 1 0%;">Console</span><div id="logit" style="overflow: auto; flex: 1 1 0%;overscroll-behavior: none;"></div>
        </div>
            <div style="margin: 0px auto;width: fit-content; position: absolute; top: 1rem; right: 2rem;">
                <button style="padding: 1em;" class="abtn" onclick="document.querySelector('#_dialog').close()">Close and Play!</button>
            </div>
    <div id="new_game_id_template" class="new_game_info" style="display: none; flex-direction: column;margin-bottom: 1rem; padding: 1rem; outline: 1px solid grey;">
            <span class="delBtn" onclick="(function(_this){ _this.parentElement.remove();})(this)">X</span>
            <label><input style="width: 15rem; margin-right: 1rem;" class="game_id"></input>Game #ID</label> 
            <label><input type="datetime-local" style="width: 15rem; margin-right: 1rem;" class="game_start_date"></input>Start Date</label> 
            <label><input type="datetime-local" style="width: 15rem; margin-right: 1rem;" class="game_end_date"></input>End Date</label> 
    </div>
    `;

    dialogBody.appendChild(dialog);
    document.body.appendChild(dialogBody);
    setTimeout(() => {
        dialog.showModal();
    }, 1000);

    dialog.addEventListener("click", async function (e) {
        console.log(e);
        if (e.target.classList.contains("nav-btn")) {
            let opened = document.querySelector(".opened");
            opened.classList.remove("opened");
            let snum = e.target.getAttribute("s");
            document.querySelector(`#section${snum}`).classList.add("opened");
        } else if (e.target.id === "insert_new_game") {
            let node = insertNewGame();
            node.style.outline = "2px solid green";
        } else if (e.target.id === "save_game_info") {
            saveGameInfo();
            _console.log("Saved game info!");
        } else if (e.target.id === "fetch_update_spreadsheet") {
            e.target.disabled = true;
            let bgColor = e.target.style.backgroundColor;
            //  e.target.style.backgroundColor = "red";
            await fetchGameInfoUpdateSpreadSheet();
            // e.target.style.backgroundColor = bgColor;
            e.target.disabled = false;
        } else if (e.target.id === "save_work_info") {
            saveWorkInfo();
        } else if (e.target.id === "save_update_info") {
            saveUpdateInfo();
        } else if (e.target.id === "fetch_update_spreadsheet_automatically") {
            e.target.disabled = true;
            e.target.innerHTML = "Refresh Page To Stop Auto Updating!";
            fetchGameInfoUpdateSpreadSheet_auto();
        } else if (e.target.id === "clear_database") {
            e.target.disabled = true;
            await db.clearDB();
            _console.log("Cleared Database.");
            e.target.disabled = false;
        } else if (e.target.id === "get_initial_token") {
            e.target.disabled = true;
            await getInitialRefreshToken();
            e.target.disabled = false;
        }
    });

    function saveUpdateInfo() {
        let obj = {
            spreadsheetId: document.getElementById("google_spreadsheet_id").value,
            startDate: document.getElementById("update_start_date").value,
            stopDate: document.getElementById("update_stop_date").value,
            minutes: document.getElementById("update_sheet_minutes").value,
            updateSheetName: document.getElementById("update_sheet_sheetName").value,
            appScript: document.getElementById("update_sheet_AppScript").value,
        };

        localStorage["__updateInfo"] = JSON.stringify(obj);

        let inputs = document.getElementById("update_spreadsheet_options").querySelectorAll("input");
        inputs.forEach((inputEl) => {
            inputEl.style.outline = "";
        });
        _console.log("Saved update info!");
    }

    function saveWorkInfo() {
        let obj = {
            clientId: document.getElementById("oauth_client_id").value,
            clientSecret: document.getElementById("oauth_secret_code").value,
            URLCode: document.getElementById("oauth_code_from_url").value,
            redirectURL: document.getElementById("oauth_redirect_url").value,
        };

        localStorage["__workInfo"] = JSON.stringify(obj);

        _console.log("Saved work info!");

        makeCustomUrl(obj);
    }

    async function makeCustomUrl(obj) {
        let clientId = obj.clientId ? obj.clientId : "[YOUR OAUTH CLIENT-ID]";
        let siteUrl = obj.redirectURL ? obj.redirectURL : "[YOUR OAUTH REDIRECT URL]";

        let customUrl = `https://accounts.google.com/o/oauth2/auth?client_id=<span style="color:green; font-size: 12px;">${clientId}</span>&redirect_uri=<span style="color:green; font-size: 12px;">${siteUrl}</span>&scope=https://www.googleapis.com/auth/drive&response_type=code&include_granted_scopes=true&access_type=offline&state=state_parameter_passthrough_value`;

        let el = document.getElementById("OAuth_url");
        el.style.visibility = "hidden";

        el.innerHTML = `</br>Copy this url and paste it into a web browser, it will redirect to the redirect website from above and then you can copy the "code" and paste it into the "Google OAuth Code from URL" field: 
        <br>
        <br>
        ${customUrl}`;

        setTimeout(() => {
            el.style.visibility = "";
        }, 100);

        if (!obj.clientId || !obj.redirectURL) {
            _console.error("Missing OAuth redirect URL or OAuth Client Id for custom URL. Can be found in the OAuth client page.");
            return;
        }

        _console.log("Made custom URL that you need to grant authorization and get refresh token.");
    }

    async function fetchGameInfoUpdateSpreadSheet() {
        return new Promise(async (res, rej) => {
            if (fetchGameInfoUpdateSpreadSheet.locked === true) {
                rej("locked");
                return;
            }

            fetchGameInfoUpdateSpreadSheet.locked = true;

            _console.log("Clearing sheet for clean slate.");
            let didClear = await clearSheet();

            if (!didClear) {
                _console.error("Error clearing sheet for some reason.");
            }

            await pushDataToSheets();

            setTimeout(async () => {
                _console.log("Started Running App Script.");
                await runAppScript();
                fetchGameInfoUpdateSpreadSheet.locked = false;
                _console.log("Finished Running App Script.");
                res(true);
            }, 5000);
        });
    }
    fetchGameInfoUpdateSpreadSheet.locked = false;

    async function runAppScript() {
        let updateInfo = localStorage["__updateInfo"];
        if (updateInfo == undefined) {
            alert("Please save update info first!");
            return;
        }

        updateInfo = JSON.parse(updateInfo);
        if (!updateInfo.appScript) {
            _console.log("No script url saved.");
            return;
        }

        let ret = await fetch(updateInfo.appScript)
            .then((ret) => console.log(ret))
            .catch((error) => {
                _console.error("Something wrong with appscript. Check Developer tools console.");
                console.log("appscript error: ", error);
            });
    }

    window.__runAppScript = runAppScript;

    function insertNewGame(gameObj) {
        const gamesDiv = document.getElementById("gamesIds");
        const node = document.getElementById("new_game_id_template");
        const cloned = node.cloneNode(true);
        cloned.id = "";
        cloned.style.display = "flex";

        gamesDiv.appendChild(cloned);

        if (gameObj) {
            const el = cloned;
            el.querySelector(".game_id").value = gameObj.gameId;
            el.querySelector(".game_start_date").value = gameObj.startDate;
            el.querySelector(".game_end_date").value = gameObj.endDate;
        }

        let inputs = cloned.querySelectorAll("input");
        inputs.forEach((inputEl) => {
            inputEl.addEventListener("change", function (e) {
                cloned.style.outline = "2px solid green";
            });
        });

        return cloned;
    }

    function saveGameInfo() {
        const newGameInfos = document.querySelectorAll(".new_game_info");
        const saveObj = {};

        newGameInfos.forEach((el) => {
            if (el.id == "new_game_id_template") return;

            let gameId = el.querySelector(".game_id").value;
            let startDate = el.querySelector(".game_start_date").value;
            let endDate = el.querySelector(".game_end_date").value;

            if (!gameId || !startDate || !endDate) {
                el.style.outline = "2px solid red";
                alert("Missing game information");
                return;
            }

            saveObj[gameId] = { gameId, startDate, endDate };

            el.style.outline = "1px solid grey";
        });

        localStorage["__gameInfo__"] = JSON.stringify(saveObj);
    }

    function init() {
        let ls = localStorage["__gameInfo__"];
        if (ls !== undefined) {
            ls = JSON.parse(ls);

            let games = Object.keys(ls);

            for (let n = 0; n < games.length; n++) {
                insertNewGame(ls[games[n]]);
            }
        }

        let workInfo = localStorage["__workInfo"];
        if (workInfo !== undefined) {
            workInfo = JSON.parse(workInfo);

            document.getElementById("oauth_client_id").value = workInfo.clientId || "";
            document.getElementById("oauth_secret_code").value = workInfo.clientSecret || "";
            document.getElementById("oauth_code_from_url").value = workInfo.URLCode || "";
            document.getElementById("oauth_redirect_url").value = workInfo.redirectURL || "";
        }

        let updateInfo = localStorage["__updateInfo"];
        if (updateInfo !== undefined) {
            updateInfo = JSON.parse(updateInfo);

            document.getElementById("google_spreadsheet_id").value = updateInfo.spreadsheetId || "";
            document.getElementById("update_start_date").value = updateInfo.startDate || "";
            document.getElementById("update_stop_date").value = updateInfo.stopDate || "";
            document.getElementById("update_sheet_minutes").value = updateInfo.minutes || "";
            document.getElementById("update_sheet_sheetName").value = updateInfo.updateSheetName || "";
            document.getElementById("update_sheet_AppScript").value = updateInfo.appScript || "";
        }

        let inputs = document.getElementById("update_spreadsheet_options").querySelectorAll("input");
        inputs.forEach((inputEl) => {
            let _value = inputEl.value;
            inputEl.addEventListener("change", function (e) {
                if (inputEl.value !== _value) {
                    this.style.outline = "2px solid green";
                } else {
                    this.style.outline = "";
                }
            });
        });
    }

    init();

    async function fetchGameInfoUpdateSpreadSheet_auto() {
        let updateInfo = localStorage["__updateInfo"];
        if (updateInfo == undefined) {
            alert("Please save update info first!");
            return;
        }

        updateInfo = JSON.parse(updateInfo);

        if (updateInfo.minutes < 1) {
            alert("Update minuntes field has to be more that 1 minute to auto update.");
            return;
        }

        _console.log(`Start auto updating in ${updateInfo.minutes} minutes.`);

        let interval = setInterval(
            async () => {
                let _now_ = Date.now();

                if (new Date(updateInfo.startDate) > _now_) {
                    return;
                }

                if (new Date(updateInfo.stopDate) < _now_) {
                    clearInterval(interval);
                    document.getElementById("autoUpdateMessage").innerText = "Auto update has stopped!";
                    return;
                }
                _console.log("Auto updating.");

                await fetchGameInfoUpdateSpreadSheet();
            },
            updateInfo.minutes * 60 /*minutes*/ * 1000 /*milliseconds*/,
        );
    }

    async function pushDataToSheets() {
        let ls = localStorage["__gameInfo__"];
        if (ls === undefined) return;
        ls = JSON.parse(ls);

        let gameIds = Object.keys(ls);

        let _db = await db
            .read(1)
            .then((res) => res)
            .catch((rej) => rej);

        if (_db === db.readError) {
            _db = {};
        } else {
            _db = JSON.parse(_db);
        }

        const _now_ = Date.now();

        for (let n = 0; n < gameIds.length; n++) {
            const _data_ = ls[gameIds[n]];

            if (new Date(_data_.startDate) > _now_ || new Date(_data_.endDate) < _now_) {
                continue;
            }

            let pageination = "";
            let pageNum = 0;

            for (;;) {
                if (pageination === null) break;

                pageNum += 1;

                _console.log(`Fetching game id# ${gameIds[n]}, page# ${pageNum}.`);

                let data = await fetch(`https://www.geoguessr.com/api/v3/results/highscores/${gameIds[n]}?friends=false&limit=26&minRounds=5${pageination && `&paginationToken=${pageination}`}`)
                    .then((res) => res.json())
                    .then((json) => json)
                    .catch((e) => {
                        console.log(e);
                        return false;
                    });

                if (data === false) {
                    alert(`Downloading info for ${gameIds[n]} didn't work for some reason????`);
                    _console.error(`Downloading info for ${gameIds[n]} didn't work for some reason????`);
                    continue;
                }

                pageination = data.paginationToken;
                // pageination = null;

                let t = {
                    gameid: __NEXT_DATA__.props.pageProps.challengeToken,
                    player_data: [],
                };

                data.items.forEach((game_obj) => {
                    let game = game_obj.game;
                    let player = game.player;
                    if (_db[player.id] === undefined) {
                        _db[player.id] = {
                            nick: player.nick,
                            countryCode: player.countryCode,
                            id: player.id,
                            pinURL: player.pin.url.replace("pin/", "").replace(".png", ""),
                            games: [],
                        };
                    }

                    _db[player.id].games[n] = {
                        gameId: gameIds[n],
                        totalDistMeters: +player.totalDistanceInMeters,
                        steps: player.totalStepsCount,
                        score: +player.totalScore.amount,
                        totalTime: +player.totalTime,
                    };
                });
            }
        }

        let headerRow = ["player id", "player name", "player country code", "pin url"];

        for (let n = 0; n < gameIds.length; n++) {
            headerRow.push(
                `=HYPERLINK("https://www.geoguessr.com/results/${gameIds[n]}", 
                            "game${n + 1} score")`,
                `game${n + 1} Distance (m)`,
                `game${n + 1} Time`,
                `game${n + 1} steps`,
            );
        }

        let schema = [headerRow];

        let keys = Object.keys(_db);

        keys.forEach((playerid) => {
            let player = _db[playerid];

            let info = [player.id, player.nick, player.countryCode, player.pinURL];
            let moffset = info.length;

            for (let n = 0; n < gameIds.length; n++) {
                const gameData = player.games[n];

                const noffset = moffset + 4 * n;

                info[noffset] = gameData?.score ?? "";
                info[noffset + 1] = gameData?.totalDistMeters ?? "";
                info[noffset + 2] = gameData?.totalTime ?? "";
                info[noffset + 3] = gameData?.steps ?? "";
            }

            schema.push(info);
        });

        for (let rowNum = 0; rowNum < schema.length; ) {
            // Push rows to sheet in batches, not all at once.

            let rows = [];

            for (let m = 0; m < rowNum; m++) {
                rows.push([]);
            }

            if (schema[rowNum]) {
                rows.push(schema[rowNum]);
            }
            if (schema[rowNum + 1]) {
                rows.push(schema[rowNum + 1]);
            }
            if (schema[rowNum + 2]) {
                rows.push(schema[rowNum + 2]);
            }

            rowNum += 3;

            let ret = await pushRowsToSheet(rows);
            if (ret === false) {
                break;
            }
        }

        db.update(1, JSON.stringify(_db));
        _console.log("Finished pushing data to sheet.");
    }

    window.pushDataToSheets = pushDataToSheets;

    async function pushRowsToSheet(_data) {
        _console.log("Pushing rows to sheet.");

        let oathToken = localStorage["__oauthToken"];

        if (oathToken !== undefined) {
            oathToken = JSON.parse(oathToken);
        }

        let updateInfo = localStorage["__updateInfo"];
        if (updateInfo == undefined) {
            alert("Update information has not been saved!\n Need to know the name of the sheet to save the data to!\n Sheet name is not the spreadsheet id from the url.");
            return;
        }
        updateInfo = JSON.parse(updateInfo);

        let data = JSON.stringify({
            //   range: "Sheet1", // Add new row to bottom of spreadsheet.
            majorDimension: "ROWS",
            values:
                //    [["player id","player name","player country code","game1 score","game1 Dist. (m)","game1 time"],["5f65f9e19e50620001274451","Vik","sk",25000,8.8961892723,854],["5934a7d5d280a519982a038c","zoidbergeo","no",25000,9.0698670022,4130],["606225184f3a8e00016e9e6a","Indigo Octopus","gb",25000,9.1344985913,2315],["5c991e06e92b0ccb10a440d2","Slurms","de",25000,9.7499040801,943],["5c2f1e8e3e41f8b8b0e9c4bc","moonradio","pl",25000,9.728512149499998,1741],["56bd4978a3b94841c8d8ab7d","FinalSpork","mn",25000,9.803598028400001,2240],["634715c12e0821a0c91afba4","Benh2","gb",25000,11.1695980658,1014],["5f990dad60c92a0001fcbe93","FtoT TinOF","jp",25000,11.427470170200001,1152],["628e4c110b65ca38718505d1","Brussels Waffles","be",25000,11.440830634800001,3446],["5f0f55bf0624d4374c1eee4e","LaDecadence","ru",25000,11.7737739913,835],["60be676917126e00010fb7e5","Ruffinnen","pl",25000,11.9448211645,827],["5ef3b8bb19612a2940d25a5d","Grategis","us",25000,12.1136131528,1051],["57cc3a2909f2efcce834eb95","Sonny","cz",25000,12.612549005999998,907],["64e669eef177771ad9a24a87","GeoCornish","gb",25000,12.70661267,1866],["5d4e905c95bbda54e4d9b339","derPate","de",25000,12.8368284302,1091],["67834e52907ce4f4d85b45f1","Patche_Geo","vn",25000,13.3955213455,862],["681664e50a41b6ebdecedb63","Frank_Booth","ca",25000,14.358208908599998,39033],["61248cfcaf7a040001d9138a","PhobosDeimos","au",25000,14.4280826599,3036],["606001bb63c4b80001aab17d","devox","ca",25000,14.7876811095,4105],["56bf0c3fe5cc36930cba885b","EniJ","it",25000,15.605863054799999,1318],["5cd0868d75345f65c86db6ee","Chbigelow","us",25000,15.7058164148,2980],["5eb9fbcb97d6cf1ec445b879","No Love Deep Web","us",25000,15.877701031800001,1833],["5f1c5b38781e160001895495","Sven Alander","se",25000,16.2334522587,827],["604fbaff628dce00016d42fe","Lyloor","fr",25000,16.6683491578,1302],["67e2c7c0715d74dda7ad1249","RainyMountain466","us",25000,16.7183285801,3974],["5ff8944f1ec97000011398cb","_Yoshi98_","de",25000,18.1160929851,1724]]
                //[["player id","player name","player country code","game1 score","game1 Distance (m)","game1 Time","game2 score","game2 Distance (m)","game2 Time"],["5f65f9e19e50620001274451","Vik","sk",25000,8.8961892723,854,25000,29.483426645599998,1491],["5934a7d5d280a519982a038c","zoidbergeo","no",25000,9.0698670022,4130,"","",""],["606225184f3a8e00016e9e6a","Indigo Octopus","gb",25000,9.1344985913,2315,25000,22.9727795755,912],["5c991e06e92b0ccb10a440d2","Slurms","de",25000,9.7499040801,943,"","",""],["5c2f1e8e3e41f8b8b0e9c4bc","moonradio","pl",25000,9.728512149499998,1741,25000,24.725365811499998,3264],["56bd4978a3b94841c8d8ab7d","FinalSpork","mn",25000,9.803598028400001,2240,25000,19.947456538,924],["555a28e99ff17334181de426","CherrieAnnie","hu",25000,10.0551278967,592,"","",""],["634715c12e0821a0c91afba4","Benh2","gb",25000,11.1695980658,1014,25000,21.569627598300002,1075],["5f990dad60c92a0001fcbe93","FtoT TinOF","jp",25000,11.427470170200001,1152,25000,15.751892216599998,812],["628e4c110b65ca38718505d1","Brussels Waffles","be",25000,11.440830634800001,3446,25000,22.2785519663,3100],["5f0f55bf0624d4374c1eee4e","LaDecadence","ru",25000,11.7737739913,835,25000,25.093794286599998,2456],["60be676917126e00010fb7e5","Ruffinnen","pl",25000,11.9448211645,827,25000,18.7655042088,1679],["5ef3b8bb19612a2940d25a5d","Grategis","us",25000,12.1136131528,1051,"","",""],["57cc3a2909f2efcce834eb95","Sonny","cz",25000,12.612549005999998,907,25000,22.2056013653,1512],["64e669eef177771ad9a24a87","GeoCornish","gb",25000,12.70661267,1866,"","",""],["5d4e905c95bbda54e4d9b339","derPate","de",25000,12.8368284302,1091,25000,24.2665492721,1947],["67834e52907ce4f4d85b45f1","Patche_Geo","vn",25000,13.3955213455,862,25000,15.4188130066,1616],["681664e50a41b6ebdecedb63","Frank_Booth","ca",25000,14.358208908599998,39033,25000,19.3680617418,13592],["61248cfcaf7a040001d9138a","PhobosDeimos","au",25000,14.4280826599,3036,25000,23.7569231755,26880],["606001bb63c4b80001aab17d","devox","ca",25000,14.7876811095,4105,25000,16.3027345088,3477],["56bf0c3fe5cc36930cba885b","EniJ","it",25000,15.605863054799999,1318,25000,23.6623403894,837],["5cd0868d75345f65c86db6ee","Chbigelow","us",25000,15.7058164148,2980,"","",""],["5eb9fbcb97d6cf1ec445b879","No Love Deep Web","us",25000,15.877701031800001,1833,"","",""],["5f1c5b38781e160001895495","Sven Alander","se",25000,16.2334522587,827,25000,12.3178246061,1564],["604fbaff628dce00016d42fe","Lyloor","fr",25000,16.6683491578,1302,25000,25.7632846113,2999],["67e2c7c0715d74dda7ad1249","RainyMountain466","us",25000,16.7183285801,3974,25000,21.2139341863,4165],["5c53a3f83d925b4af4ba6590","Geoff Dutfield","ca","","","",25000,16.7614790318,4376],["60364d22d7a8a10001e96b6a","Ivan Semushin","ru","","","",25000,18.1763280848,2109],["59635e029a4f70ba78179651","Ben Leiper","no","","","",25000,22.0183017521,1116],["617a89d66e0ac3000169f552","Soma DMT","si","","","",25000,23.4365288836,1501],["5f010c86b545a467e83e507a","Luinithil","us","","","",25000,24.5076268685,2226],["5ee7c9f9746a364f34d06903","Ruben van Cleef","nl","","","",25000,26.4864286304,3832],["5fd9fbccaf66cd000111bdd0","yoshii1i","pt","","","",25000,32.5252698401,2652]]
                //[["player id","player name","player country code","game1 score","game1 Distance (m)","game1 Time","game2 score","game2 Distance (m)","game2 Time"], ["5f65f9e19e50620001274451","Vik","sk",25000,8.8961892723,854,25000,29.483426645599998,1491],["5934a7d5d280a519982a038c","zoidbergeo","no",25000,9.0698670022,4130,"","",""],["606225184f3a8e00016e9e6a","Indigo Octopus","gb",25000,9.1344985913,2315,25000,22.9727795755,912],["5c991e06e92b0ccb10a440d2","Slurms","de",25000,9.7499040801,943,"","",""],["5c2f1e8e3e41f8b8b0e9c4bc","moonradio","pl",25000,9.728512149499998,1741,25000,24.725365811499998,3264],["56bd4978a3b94841c8d8ab7d","FinalSpork","mn",25000,9.803598028400001,2240,25000,19.947456538,924],["555a28e99ff17334181de426","CherrieAnnie","hu",25000,10.0551278967,592,24032,345536.443831829,899],["634715c12e0821a0c91afba4","Benh2","gb",25000,11.1695980658,1014,25000,21.569627598300002,1075],["5f990dad60c92a0001fcbe93","FtoT TinOF","jp",25000,11.427470170200001,1152,25000,15.751892216599998,812],["628e4c110b65ca38718505d1","Brussels Waffles","be",25000,11.440830634800001,3446,25000,22.2785519663,3100],["5f0f55bf0624d4374c1eee4e","LaDecadence","ru",25000,11.7737739913,835,25000,25.093794286599998,2456],["60be676917126e00010fb7e5","Ruffinnen","pl",25000,11.9448211645,827,25000,18.7655042088,1679],["5ef3b8bb19612a2940d25a5d","Grategis","us",25000,12.1136131528,1051,"","",""],["57cc3a2909f2efcce834eb95","Sonny","cz",25000,12.612549005999998,907,25000,22.2056013653,1512],["64e669eef177771ad9a24a87","GeoCornish","gb",25000,12.70661267,1866,"","",""],["5d4e905c95bbda54e4d9b339","derPate","de",25000,12.8368284302,1091,25000,24.2665492721,1947],["67834e52907ce4f4d85b45f1","Patche_Geo","vn",25000,13.3955213455,862,25000,15.4188130066,1616],["681664e50a41b6ebdecedb63","Frank_Booth","ca",25000,14.358208908599998,39033,25000,19.3680617418,13592],["61248cfcaf7a040001d9138a","PhobosDeimos","au",25000,14.4280826599,3036,25000,23.7569231755,26880],["606001bb63c4b80001aab17d","devox","ca",25000,14.7876811095,4105,25000,16.3027345088,3477],["56bf0c3fe5cc36930cba885b","EniJ","it",25000,15.605863054799999,1318,25000,23.6623403894,837],["5cd0868d75345f65c86db6ee","Chbigelow","us",25000,15.7058164148,2980,"","",""],["5eb9fbcb97d6cf1ec445b879","No Love Deep Web","us",25000,15.877701031800001,1833,"","",""],["5f1c5b38781e160001895495","Sven Alander","se",25000,16.2334522587,827,25000,12.3178246061,1564],["604fbaff628dce00016d42fe","Lyloor","fr",25000,16.6683491578,1302,25000,25.7632846113,2999],["67e2c7c0715d74dda7ad1249","RainyMountain466","us",25000,16.7183285801,3974,25000,21.2139341863,4165],["5c53a3f83d925b4af4ba6590","Geoff Dutfield","ca",25000,57.10289331680001,1415,25000,16.7614790318,4376],["60364d22d7a8a10001e96b6a","Ivan Semushin","ru",25000,21.492147275,4198,25000,18.1763280848,2109],["59635e029a4f70ba78179651","Ben Leiper","no","","","",25000,22.0183017521,1116],["617a89d66e0ac3000169f552","Soma DMT","si",25000,23.1705152002,1258,25000,23.4365288836,1501],["5f010c86b545a467e83e507a","Luinithil","us",25000,18.3042956431,809,25000,24.5076268685,2226],["5ee7c9f9746a364f34d06903","Ruben van Cleef","nl","","","",25000,26.4864286304,3832],["5fd9fbccaf66cd000111bdd0","yoshii1i","pt",25000,23.3711747286,3213,25000,32.5252698401,2652],["5ff8944f1ec97000011398cb","_Yoshi98_","de",25000,18.1160929851,1724,22725,940491.5719638468,1284],["64e27ed2ad0d4fa1bcb3ac6a","Michael","de",25000,22.339178504499998,5559,24360,231559.1912107694,8987],["676d0f88ae31f29e4b33fd2c","Scholesy","us",25000,23.365694491499998,1177,"","",""],["559354a307f3547cd0a26fb4","Keith","us",25000,23.7950601568,4594,"","",""],["5759815891ca97ebe0dc23af","Guybrush Threepwood","gb",25000,28.169524425100004,943,25000,51.5396563512,612],["5e1762fcdfc00546d4c7ae8d","Leuki","de",25000,31.2331943819,649,22793,905192.6173944075,571],["677f34ab0751cf000d74b42f","GGs","in",25000,63.56144530699999,19127,25000,42.6843500142,2875],["5b870f694ee0359bb8304948","i_like_mares","us",25000,76.66324282449999,857,24670,115396.4178776934,1258],["665c01999434f2a02f37c04c","ModernCanyon795","tr",24999,295.7000752247,1646,"","",""],["677ffd8c7e1e933783ad9f2b","FancyGulf114","ie",24999,410.6056128392,1005,21053,1878947.1777584956,3920],["62ed806f8e03f4cc4b4ff2c0","Davits Timo","gb",24994,2032.9884899241,5673,22193,1286790.8025929478,51407],["6055d5beb67eb80001a27e8f","Bosh","ie",24461,197663.19346572668,765,24368,228551.30213416312,845],["5ffc6fe04a5efa00015daad9","SANTUCHO","ar",24416,208534.74516743884,893,24749,85992.0862450668,1032],["59d68274d8fe1d5b3065fee7","HeroOnGuitar","nl",22214,1414166.816261276,569,24569,148817.0259165805,1028],["5dc13f46e9473f1aa89d8f24","EC","us",21697,1872074.914825816,756,21537,1499338.6070505208,899],["67a1097b1935165b6d2cdbb1","EquatorialTundra134","se",21633,1942075.4893871848,1670,24592,143917.32261081913,3565],["614b107c06d9f90001eb50cb","Mattegol","it",21561,2018403.7687563265,39878,22893,841411.1947059348,521],["60ba80c90709db00011d0ff1","Diego Pinheiro","br",21550,1636551.7309945605,3125,10928,15973407.470160179,2013],["63bbd77dc179da1e2962acf1","Husky Handler0h","fi",21511,2075082.6218147413,3798,"","",""],["5a61f31f7d76146cf0b26c89","Alex Rochester","fi",20631,2423398.9666410387,174,22174,1123831.25920526,226],["62cd8f17b62dc01eb5462df7","fbrasseur","ch",20403,2179115.37636696,94,25000,34.317393169,694],["5c560a383d925bc4fcca8220","FloridaChick","us",20350,2794587.905163027,240,19095,2857846.8938874425,395],["579049860f815ac468abee4a","Dani","us",20196,2735167.129531456,443,21820,1213040.7455184364,386],["62953fde6913d8010ed3eeef","LeGenie DuTurfu","fr",19864,2976515.729664639,565,"","",""],["675dc48ad2220e44dea19013","OceanicAbyss497","za",17380,4065911.92685999,161,18921,2437650.244029027,243],["5bfecc42aac55bb0245649f7","nikos nargiamakis","gr",17315,4239856.275307981,750,22417,1008934.3236921825,5300],["5ed4649893122b841c19ffb9","Enzo Rocca","ar",16995,3722242.700958874,743,"","",""],["552bfc87a3a64428d4b6f29b","Tristán White","gb",16,71065185.81078047,35,113,60869071.95207044,137],["61180197e6a17a00016a832c","WarMaceta","es","","","",24998,602.0521473837,12962],["603fe5705128a80001e0d750","RTLewis123","us","","","",24986,4761.693863271199,6478],["5df6057dd202e11e302144d5","TheOneGame","ae","","","",24986,4843.008598381001,1632],["572c748bbfac42bc784b150d","Daniblonds","de","","","",24675,113453.6646229329,534],["5e5286c88fd6cf2c442c0c83","Gronoob","fr","","","",24669,115847.62583979638,1916],["5f283a199a6d6e0001a7ee15","Arnonono","fr","","","",24372,226720.3542550471,742],["5b16e488ff760f7b34830096","MB","ca","","","",23272,680353.9331779262,490],["600af2c11f451100019b8d3f","Алис Андреев","ru","","","",22653,1031342.5890687088,975],["66d09cf60e64f3c0b5849b1b","TanjawiTravler","ma","","","",19902,2440050.71618376,1526],["5e13ac051b34a01740123d38","Sven Tuit","nl","","","",19424,4090974.7650718065,1326],["64a08bbff97b3cdd7ffb440d","Barbaemanuele1","it","","","",15338,4675582.637524608,378],["6875a11091455b9134d59859","ModernQuay532","ca","","","",13746,11364083.906713016,150]]
                _data,
        });

        let ret = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${updateInfo.spreadsheetId}/values/${updateInfo.updateSheetName}?valueInputOption=USER_ENTERED`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + oathToken.access_token, // Space after "Bearer " needed.
                "Content-Type": "application/json",
                "Content-Length": data.length,
            },
            body: data,
        })
            .then((e) => e.json())
            .then((e) => e)
            .catch((error) => error);

        console.log("push row to sheet", ret);

        if (ret.error) {
            if (ret?.error?.code == 401) {
                // Needs new access token.
                if ((await getNewAccessToken()) === false) {
                    return false;
                }
                await pushRowsToSheet(_data);
                return true;
            }

            alert("Error accessing Google Sheet for some reason.\n\n See console for error message.");
            _console.error("Google Sheets Error:");
            console.log("Google Sheets Error: ", ret);
            return false;
        }

        return true;
    }

    window.__addRow = pushRowsToSheet;

    async function getInitialRefreshToken() {
        // code from url, client id, client secret code, redirect url
        let workInfo = localStorage["__workInfo"];
        if (workInfo !== undefined) {
            workInfo = JSON.parse(workInfo);
        }

        if (!workInfo.clientId || !workInfo.clientSecret || !workInfo.redirectURL || !workInfo.redirectURL) {
            _console.error("Appears to be missing some OAuth information.");
            return;
        }

        let token = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `code=${decodeURIComponent(workInfo.URLCode)}&client_id=${workInfo.clientId}&client_secret=${workInfo.clientSecret}&redirect_uri=${workInfo.redirectURL}&access_type=offline&grant_type=authorization_code`,
        })
            .then((e) => e.json())
            .then((JSON) => JSON)
            .catch((error) => error);

        if (token.error === "invalid_grant") {
            _console.error("There was a 'invalid_grant' error. Try getting a new code from the url and see if that works?");
            console.log("Initial token error:", token);
            return;
        }
        if (token.error === "invalid_client") {
            _console.error("There was a 'invalid_client' error. Is the OAuth Client Id correct? Is the Client Secret correct?");
            console.log("Initial token error:", token);
            return;
        }
        if (!token.access_token) {
            _console.error("Something happened trying to get inital token, see javascript console for error.");
            console.log("Initial token error:", token);
            return;
        }
        if (token.refresh_token_expires_in) {
            _console.log(
                "Refresh token is temperary. 'Publishing status' is set to 'Testing', make sure to click 'Publish app' to recieve a permenant token here => <a target='_blank' href='https://console.cloud.google.com/auth/audience'>link</a> ",
            );
        }

        if (!token.refresh_token) {
            _console.error(
                `Missing refresh token. This access token will only work for a short period of time. Try going to <a target='_blank' href="https://myaccount.google.com/connections">Google account connections</a> and remove the project and try again.`,
            );
        }
        console.log("Inital token response:", token);

        _console.log("Updated initial token. See javascript console for return JSON.");

        localStorage["__initialToken"] = JSON.stringify(token);
        localStorage["__oauthToken"] = JSON.stringify(token);
    }

    async function getNewAccessToken() {
        let refreshToken = localStorage["__refreshToken"];
        let initialToken = localStorage["__initialToken"];
        let workInfo = localStorage["__workInfo"];

        if (refreshToken !== undefined) {
            refreshToken = JSON.parse(refreshToken);
        }

        if (initialToken !== undefined) {
            initialToken = JSON.parse(initialToken);
        } else {
            alert("No initial access token");
            return false;
        }

        if (workInfo == undefined) {
            alert("No spreadsheet id found.");
            return false;
        }
        workInfo = JSON.parse(workInfo);

        _console.log("Requesting new OATH access token.");

        let token = await fetch("https://oauth2.googleapis.com/token", {
            // Refresh token fetch edition.
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: `access_type=offline&refresh_token=${initialToken["refresh_token"]}&client_id=${workInfo.clientId}&client_secret=${workInfo.clientSecret}&grant_type=refresh_token`,
        })
            .then((e) => e.json())
            .then((json) => json)
            .catch((error) => error);

        if (token.error) {
            if (token.error == "invalid_grant") {
                _console.error(`There was a 'invalid_grant' error. That could mean that you need to get a new initial token. `);
                console.log("Error gettin access token:", token);
                return false;
            }
            _console.error("There was a error getting the access token. See developer console for error.");
            return false;
        }

        localStorage["__oauthToken"] = JSON.stringify(token);

        console.log(token);

        _console.log("Updated OATH access token.");

        return token;
    }
    window.__getNewAccessToken = getNewAccessToken;

    async function clearSheet() {
        let oathToken = localStorage["__oauthToken"];

        if (oathToken !== undefined) {
            oathToken = JSON.parse(oathToken);
        } else {
            oathToken = "Refresh token after fetch request";
        }

        let updateInfo = localStorage["__updateInfo"];
        if (updateInfo == undefined) {
            alert("Please save update info first! No sheet name/id found.");
            return;
        }

        updateInfo = JSON.parse(updateInfo);

        // Read range of cells
        //      let ret1 = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${workInfo.spreadsheetId}/values/${updateInfo.updateSheetName}!1:1`,{
        //		method: 'GET',
        //			headers: {
        //			"Authorization": "Bearer " + oathToken.access_token, // Space after "Bearer " needed.
        //		},
        //		}).then(e => e.json())
        //        .then(e => {
        //            console.log(e)
        //            return e;
        //        })
        //        .catch(error => console.log("error", error))
        //        console.log(ret1)

        // `https://sheets.googleapis.com/v4/spreadsheets/${workInfo.spreadsheetId}/values/${updateInfo.updateSheetName}?valueInputOption=USER_ENTERED
        // https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}/values/{range}:clear
        // fetch("https://sheets.googleapis.com/v4/spreadsheets/{spreadsheetId}:batchUpdate", {

        let ret = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${updateInfo.spreadsheetId}/values/${updateInfo.updateSheetName}!A1:ZZZ4000:clear`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + oathToken.access_token, // Space after "Bearer " needed.
                "Content-Type": "application/json",
                "Content-Length": 0,
            },
            body: "", //req
        })
            .then((e) => e.json())
            .then((e) => {
                console.log(e);
                return e;
            })
            .catch((error) => console.log("error", error));

        if (ret.error) {
            if (ret?.error?.code == 401) {
                // Needs new access token.
                if ((await getNewAccessToken()) === false) {
                    return false;
                }

                await clearSheet();
                return true;
            }

            alert("Error accessing Google Sheet for some reason.\n\n See console for error message.");
            _console.error("Google Sheets Error:", ret);
            console.log("Google Sheets Error: ", ret);
            return false;
        }

        return true;
    }

    window.__clear = clearSheet;

    const db = {
        open: function () {
            return new Promise(function (res, rej) {
                const DB_NAME = "MyDatabase";
                const DB_VERSION = 1; // Increment this to trigger onupgradeneeded for schema changes

                let _db;

                const request = indexedDB.open(DB_NAME, DB_VERSION);

                request.onerror = function (event) {
                    console.error("Error opening database:", event.target.errorCode);
                };

                request.onsuccess = function (event) {
                    _db = event.target.result;
                    console.log("Database opened successfully.");
                    res(_db);
                    // You can now perform operations like adding or retrieving data
                };

                request.onupgradeneeded = function (event) {
                    _db = event.target.result;
                    // Create object stores here if they don't exist or need updating
                    if (!_db.objectStoreNames.contains("games")) {
                        _db.createObjectStore("games", { keyPath: "id", autoIncrement: true });
                        console.log("Object store 'users' created.");
                    }
                };
            });
        },
        read: function (id) {
            return new Promise(async (res, rej) => {
                const _db = await db.open();

                const transaction = _db.transaction(["games"], "readonly");
                const objectStore = transaction.objectStore("games");

                const getRequest = objectStore.get(id);

                getRequest.onsuccess = function () {
                    if (getRequest.result) {
                        console.log("User found:", getRequest.result);
                        res(getRequest.result.gameJSON);
                    } else {
                        console.log("User not found.");
                        rej("Info not found");
                    }
                };

                getRequest.onerror = function () {
                    console.error("Error retrieving user:", getRequest.error);
                };
                transaction.oncomplete = function () {
                    _db.close();
                };
            });
        },
        update: function (id, gameJSON) {
            return new Promise(async (res, rej) => {
                const _db = await db.open();

                const transaction = _db.transaction(["games"], "readwrite");
                const objectStore = transaction.objectStore("games");

                const addRequest = objectStore.put({ id: id, gameJSON: gameJSON });

                addRequest.onsuccess = function () {
                    console.log("User added successfully.");
                };

                addRequest.onerror = function () {
                    console.error("Error adding user:", addRequest.error);
                };

                transaction.oncomplete = function () {
                    res();
                    _db.close();
                };
            });
        },
        readError: "Info not found",
        clearDB: async function () {
            await this.update(1, "{}");
        },
    };

    window.__db = db;

    let _console = {
        _messages: 0,
        _span: document.getElementById("logit"),
        log: function (msg) {
            let div = document.createElement("div");

            div.style.color = "rgba(26, 26, 26, 1)";
            div.innerHTML = this._dateString() + " : " + msg;
            this._span.prepend(div);
            this._messages += 1;
            this._clean();
        },

        error: function (msg) {
            let div = document.createElement("div");

            div.style.color = "rgba(207, 53, 53, 1)";
            div.innerHTML = this._dateString() + " : " + msg;
            this._span.prepend(div);
            this._messages += 1;
            this._clean();
        },
        _clean: function () {
            if (this._messages < 200) {
                return;
            }
            this._span.lastChild.remove();
            this._messages -= 1;
        },
        _dateString: function () {
            const options = { month: "2-digit", day: "2-digit", year: "2-digit", hour12: true, timeZoneName: "short" };
            const dateString = new Date().toLocaleTimeString(undefined, options).toLowerCase();
            return dateString;
        },
    };

    window.__console = _console;
})();
