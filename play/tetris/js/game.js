const Game={

    count:2,

    players:[],

    started:false,

    time:180,

    timer:null,

    animation:null,


    init(){

        document
            .querySelectorAll(".mode-card")
            .forEach(card=>{

                card.addEventListener(
                    "click",
                    ()=>{
                        this.count=
                            Number(
                                card.dataset.players
                            );

                        this.start();
                    }
                );
            });


        document
            .getElementById("menuButton")
            .onclick=()=>{
                this.toMenu();
            };


        document
            .getElementById("againButton")
            .onclick=()=>{
                this.start();
            };


        document
            .getElementById(
                "resultMenuButton"
            )
            .onclick=()=>{
                this.toMenu();
            };


        document.addEventListener(
            "keydown",
            e=>{
                this.keyboard(e);
            }
        );


        window.addEventListener(
            "resize",
            ()=>{
                this.players.forEach(
                    p=>{
                        if(p.board)
                            p.board.resize();
                    }
                );
            }
        );
    },


    start(){

        this.started=false;

        clearInterval(this.timer);

        cancelAnimationFrame(
            this.animation
        );


        document
            .getElementById("menu")
            .classList.add("hidden");


        document
            .getElementById("resultScreen")
            .classList.add("hidden");


        document
            .getElementById("gameScreen")
            .classList.remove("hidden");


        document
            .getElementById("gameMode")
            .textContent=
                this.count===1
                    ? "SOLO"
                    : this.count+" PLAYER BATTLE";


        this.createPlayers();

        this.countdownStart();
    },


    createPlayers(){

        const battle=
            document.getElementById(
                "battle"
            );

        battle.innerHTML="";

        battle.className=
            "battle players-"+this.count;


        this.players=[];


        for(
            let i=0;
            i<this.count;
            i++
        ){

            const player=
                this.createPlayer(i);

            battle.appendChild(
                player.element
            );

            player.board=
                new TetrisBoard(
                    player.canvas,
                    i
                );

            this.players.push(player);
        }


        if(this.count>1)
            this.createCenter();
    },


    createPlayer(index){

        const element=
            document.createElement(
                "section"
            );

        element.className=
            "player";


        const title=
            document.createElement(
                "div"
            );

        title.className=
            "player-title p"+
            (index+1)+
            "-title";


        const dot=
            `<span class="status-dot"></span>`;


        title.innerHTML=
            index===0
                ? dot+"PLAYER "+(index+1)
                : "PLAYER "+(index+1)+dot;


        const stats=
            document.createElement(
                "div"
            );

        stats.className="stats";


        stats.innerHTML=`

            <div>
                <small>SCORE</small>
                <strong id="score-${index}">
                    0
                </strong>
            </div>

            <div>
                <small>LINES</small>
                <strong id="lines-${index}">
                    0
                </strong>
            </div>

            <div>
                <small>COMBO</small>
                <strong id="combo-${index}">
                    0
                </strong>
            </div>

        `;


        const board=
            document.createElement(
                "div"
            );

        board.className=
            "board-container p"+
            (index+1)+
            "-board";


        const canvas=
            document.createElement(
                "canvas"
            );


        board.appendChild(canvas);


        const attack=
            document.createElement(
                "div"
            );

        attack.className=
            "attack-text";


        board.appendChild(
            attack
        );


        const controls=
            document.createElement(
                "div"
            );


        const controlColors=[
            "controls-red",
            "controls-blue",
            "controls-purple",
            "controls-green"
        ];


        controls.className=
            "controls "+
            controlColors[index];


        const actions=[
            ["left","◀"],
            ["rotate","↻"],
            ["right","▶"],
            ["down","▼"],
            ["drop","⬇"]
        ];


        actions.forEach(
            ([action,icon])=>{

                const button=
                    document.createElement(
                        "button"
                    );

                button.textContent=
                    icon;


                button.addEventListener(
                    "pointerdown",
                    e=>{

                        e.preventDefault();

                        if(this.started)
                            this.control(
                                index,
                                action
                            );
                    }
                );


                controls.appendChild(
                    button
                );
            }
        );


        const hint=
            document.createElement(
                "div"
            );

        hint.className=
            "key-hint";

        hint.textContent=
            this.getHint(index);


        element.appendChild(title);
        element.appendChild(stats);
        element.appendChild(board);
        element.appendChild(controls);
        element.appendChild(hint);


        return{

            element,

            canvas,

            attack,

            board:null,

            index,

            alive:true
        };
    },


    getHint(index){

        return[
            "A D · W · S · SPACE",
            "← → · ↑ · ↓ · ENTER",
            "J L · I · K · U",
            "NUM4 · NUM6 · NUM8 · NUM5 · NUM0"
        ][index];
    },


    createCenter(){

        const center=
            document.createElement(
                "section"
            );

        center.className="center";


        center.innerHTML=`

            <div class="vs">
                VS
            </div>

            <div class="battle-info">

                <b>攻击规则</b>

                <div>2 行 → +1</div>
                <div>3 行 → +2</div>
                <div>4 行 → +4</div>

            </div>

            <div
                id="centerMessage"
                class="center-message">
            </div>

        `;


        document
            .getElementById("battle")
            .appendChild(center);
    },


    countdownStart(){

        const overlay=
            document.getElementById(
                "countdown"
            );

        const number=
            document.getElementById(
                "countdownNumber"
            );


        overlay.classList.remove(
            "hidden"
        );


        let n=3;


        const run=()=>{

            number.textContent=
                n>0
                    ? n
                    : "GO!";


            number.classList.remove(
                "count-pop"
            );

            void number.offsetWidth;

            number.classList.add(
                "count-pop"
            );


            if(n>0){

                n--;

                setTimeout(
                    run,
                    800
                );

            }else{

                setTimeout(
                    ()=>{
                        overlay.classList.add(
                            "hidden"
                        );

                        this.begin();
                    },
                    500
                );
            }
        };


        run();
    },


    begin(){

        this.started=true;

        this.time=180;

        this.updateTimer();


        this.timer=
            setInterval(
                ()=>{
                    this.time--;

                    this.updateTimer();

                    if(this.time<=0){

                        this.timeUp();
                    }
                },
                1000
            );


        let last=
            performance.now();


        const loop=
            time=>{

                if(!this.started)
                    return;


                const delta=
                    time-last;

                last=time;


                this.players.forEach(
                    p=>{

                        if(p.board){

                            p.board.update(
                                time
                            );

                            this.updateUI(
                                p.index
                            );
                        }
                    }
                );


                this.animation=
                    requestAnimationFrame(
                        loop
                    );
            };


        this.animation=
            requestAnimationFrame(
                loop
            );
    },


    updateTimer(){

        const timer=
            document.getElementById(
                "timer"
            );

        if(!timer)
            return;


        const min=
            Math.floor(
                this.time/60
            );

        const sec=
            this.time%60;


        timer.textContent=
            String(min).padStart(2,"0")
            +":"
            +String(sec).padStart(2,"0");
    },


    control(index,action){

        const p=
            this.players[index];

        if(
            !p ||
            !p.board ||
            !p.alive
        )
            return;


        if(action==="left")
            p.board.move(-1);

        if(action==="right")
            p.board.move(1);

        if(action==="rotate")
            p.board.rotate();

        if(action==="down")
            p.board.softDrop();

        if(action==="drop")
            p.board.hardDrop();


        this.updateUI(index);
    },


    keyboard(e){

        if(!this.started)
            return;


        const key=
            e.key.toLowerCase();


        if(
            [
                "arrowleft",
                "arrowright",
                "arrowup",
                "arrowdown",
                " "
            ].includes(key)
        ){

            e.preventDefault();
        }


        /* P1 */

        if(key==="a")
            this.control(0,"left");

        if(key==="d")
            this.control(0,"right");

        if(key==="w")
            this.control(0,"rotate");

        if(key==="s")
            this.control(0,"down");

        if(e.code==="Space")
            this.control(0,"drop");


        /* P2 */

        if(e.key==="ArrowLeft")
            this.control(1,"left");

        if(e.key==="ArrowRight")
            this.control(1,"right");

        if(e.key==="ArrowUp")
            this.control(1,"rotate");

        if(e.key==="ArrowDown")
            this.control(1,"down");

        if(e.key==="Enter")
            this.control(1,"drop");


        /* P3 */

        if(key==="j")
            this.control(2,"left");

        if(key==="l")
            this.control(2,"right");

        if(key==="i")
            this.control(2,"rotate");

        if(key==="k")
            this.control(2,"down");

        if(key==="u")
            this.control(2,"drop");


        /* P4 */

        if(e.code==="Numpad4")
            this.control(3,"left");

        if(e.code==="Numpad6")
            this.control(3,"right");

        if(e.code==="Numpad8")
            this.control(3,"rotate");

        if(e.code==="Numpad5")
            this.control(3,"down");

        if(e.code==="Numpad0")
            this.control(3,"drop");
    },


    linesCleared(
        attacker,
        amount,
        combo
    ){

        const source=
            this.players[attacker];

        if(!source)
            return;


        let garbage=0;


        if(amount===2)
            garbage=1;

        if(amount===3)
            garbage=2;

        if(amount===4)
            garbage=4;


        if(combo>=2)
            garbage++;


        /*
            消行爆炸
        */

        const rect=
            source.canvas
                .getBoundingClientRect();


        Effects.burst(
            rect.left+
                rect.width/2,

            rect.top+
                rect.height*.7,

            source.board.current
                ? source.board.current.color
                : "#ffffff",

            amount*12
        );


        if(amount>=2){

            Effects.attack(
                source.attack,
                amount===4
                    ? "TETRIS!"
                    : "CLEAR × "+amount,
                source.board.current
                    ? source.board.current.color
                    : "#fff"
            );
        }


        if(
            this.count===1 ||
            garbage<=0
        )
            return;


        const targets=
            this.players.filter(
                p =>
                    p.index!==attacker &&
                    p.alive
            );


        if(this.count===2){

            const target=
                targets[0];

            if(target){

                target.board.addGarbage(
                    garbage
                );


                Effects.attack(
                    target.attack,
                    "⚡ +"+garbage,
                    "#ffdd42"
                );
            }

        }else{

            targets.forEach(
                target=>{

                    target.board.addGarbage(
                        garbage
                    );


                    Effects.attack(
                        target.attack,
                        "⚡ +"+garbage,
                        "#ffdd42"
                    );
                }
            );
        }
    },


    playerDied(index){

        const p=
            this.players[index];

        if(!p)
            return;


        p.alive=false;


        if(this.count===1){

            this.end(
                null,
                "挑战完成"
            );

            return;
        }


        const alive=
            this.players.filter(
                p=>p.alive
            );


        if(alive.length<=1){

            this.end(
                alive.length
                    ? alive[0].index
                    : null
            );
        }
    },


    timeUp(){

        if(!this.started)
            return;


        let winner=
            this.players[0];


        this.players.forEach(
            p=>{

                if(
                    p.board.score>
                    winner.board.score
                )
                    winner=p;
            }
        );


        this.end(
            winner.index
        );
    },


    end(
        winnerIndex,
        customText
    ){

        if(!this.started)
            return;


        this.started=false;

        clearInterval(
            this.timer
        );

        cancelAnimationFrame(
            this.animation
        );


        const screen=
            document.getElementById(
                "resultScreen"
            );


        const winner=
            document.getElementById(
                "winnerText"
            );


        const sub=
            document.getElementById(
                "winnerSub"
            );


        const scores=
            document.getElementById(
                "finalScores"
            );


        if(winnerIndex===null){

            winner.textContent=
                customText ||
                "无人获胜";

            winner.style.color=
                "#ffffff";

        }else{

            winner.textContent=
                "PLAYER "+
                (winnerIndex+1);

            winner.style.color=
                [
                    "#ff4263",
                    "#37a6ff",
                    "#c66aff",
                    "#51e5a0"
                ][winnerIndex];

            sub.textContent=
                "VICTORY";
        }


        scores.innerHTML=
            this.players
                .map(
                    p=>
                        `<div>
                            PLAYER ${p.index+1}
                            ：
                            ${p.board.score}
                        </div>`
                )
                .join("");


        screen.classList.remove(
            "hidden"
        );


        this.victoryParticles(
            winnerIndex
        );
    },


    victoryParticles(index){

        if(index===null)
            return;


        const color=[
            "#ff4263",
            "#37a6ff",
            "#c66aff",
            "#51e5a0"
        ][index];


        for(let i=0;i<80;i++){

            setTimeout(
                ()=>{
                    Effects.burst(
                        window.innerWidth/2,
                        window.innerHeight/2,
                        color,
                        2
                    );
                },
                i*20
            );
        }
    },


    updateUI(index){

        const p=
            this.players[index];

        if(!p || !p.board)
            return;


        const board=p.board;


        const score=
            document.getElementById(
                "score-"+index
            );

        const lines=
            document.getElementById(
                "lines-"+index
            );

        const combo=
            document.getElementById(
                "combo-"+index
            );


        if(score)
            score.textContent=
                board.score;

        if(lines)
            lines.textContent=
                board.lines;

        if(combo)
            combo.textContent=
                board.combo;
    },


    toMenu(){

        this.started=false;

        clearInterval(
            this.timer
        );

        cancelAnimationFrame(
            this.animation
        );


        document
            .getElementById(
                "gameScreen"
            )
            .classList.add("hidden");


        document
            .getElementById(
                "resultScreen"
            )
            .classList.add("hidden");


        document
            .getElementById(
                "menu"
            )
            .classList.remove("hidden");
    }

};


Game.init();
