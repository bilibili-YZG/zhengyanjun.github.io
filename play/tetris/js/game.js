/* =====================================================
   郑块大PK 游戏控制器
===================================================== */

const Game={

    count:2,

    players:[],

    started:false,

    time:180,

    timer:null,

    animation:null,

    playerColors:[
        "#ff4265",
        "#35a7ff",
        "#c768ff",
        "#4de7a0"
    ],

    playerNames:[
        "PLAYER 1",
        "PLAYER 2",
        "PLAYER 3",
        "PLAYER 4"
    ],


    init(){

        /*
         * 模式按钮
         */

        document
            .querySelectorAll(".mode-card")
            .forEach(
                card=>{

                    card.addEventListener(
                        "click",
                        ()=>{

                            SoundFX.click();

                            this.count=
                                Number(
                                    card.dataset.players
                                );

                            this.start();
                        }
                    );
                }
            );


        document
            .getElementById(
                "menuButton"
            )
            .onclick=()=>{

                SoundFX.click();

                this.toMenu();
            };


        document
            .getElementById(
                "againButton"
            )
            .onclick=()=>{

                SoundFX.click();

                this.start();
            };


        document
            .getElementById(
                "resultMenuButton"
            )
            .onclick=()=>{

                SoundFX.click();

                this.toMenu();
            };


        document.addEventListener(
            "keydown",
            e=>this.keyboard(e)
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

        SoundFX.unlock();

        this.started=false;

        clearInterval(
            this.timer
        );

        cancelAnimationFrame(
            this.animation
        );


        document
            .getElementById("menu")
            .classList.add("hidden");


        document
            .getElementById(
                "resultScreen"
            )
            .classList.add("hidden");


        document
            .getElementById(
                "gameScreen"
            )
            .classList.remove("hidden");


        document
            .getElementById(
                "gameMode"
            )
            .textContent=
                this.count===1
                    ? "SOLO"
                    : this.count+
                      " PLAYER BATTLE";


        this.createPlayers();

        this.countdown();
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

            const p=
                this.createPlayer(i);


            battle.appendChild(
                p.element
            );


            p.board=
                new TetrisBoard(
                    p.canvas,
                    i
                );


            this.players.push(p);


            this.updateUI(i);
        }


        if(this.count>1){

            this.createCenter();
        }
    },


    createPlayer(index){

        const element=
            document.createElement(
                "section"
            );

        element.className=
            "player";


        /* 标题 */

        const title=
            document.createElement(
                "div"
            );

        title.className=
            "player-title p"+
            (index+1)+
            "-title";


        title.innerHTML=
            `<span class="status-dot"></span>
             PLAYER ${index+1}`;


        /* 数据 */

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


        /* 棋盘+NEXT */

        const boardRow=
            document.createElement(
                "div"
            );

        boardRow.className=
            "board-row";


        const boardContainer=
            document.createElement(
                "div"
            );

        boardContainer.className=
            "board-container p"+
            (index+1)+
            "-board";


        const canvas=
            document.createElement(
                "canvas"
            );


        const attack=
            document.createElement(
                "div"
            );

        attack.className=
            "attack-text";


        boardContainer.appendChild(
            canvas
        );

        boardContainer.appendChild(
            attack
        );


        /* NEXT */

        const side=
            document.createElement(
                "div"
            );


        const nextBox=
            document.createElement(
                "div"
            );

        nextBox.className=
            "next-box";


        nextBox.innerHTML=`
            <div class="next-title">
                NEXT
            </div>
        `;


        const nextCanvas=
            document.createElement(
                "canvas"
            );


        nextCanvas.width=52;
        nextCanvas.height=52;


        nextBox.appendChild(
            nextCanvas
        );


        /* 能量 */

        const energyBox=
            document.createElement(
                "div"
            );

        energyBox.className=
            "energy-box";


        energyBox.innerHTML=`

            <div class="energy-label">
                ENERGY
            </div>

            <div class="energy-bar">
                <div
                    id="energy-${index}"
                    class="energy-fill">
                </div>
            </div>

        `;


        const skill=
            document.createElement(
                "button"
            );

        skill.className=
            "skill-button";

        skill.textContent=
            "⚡ 技能";


        skill.onclick=()=>{

            SoundFX.click();

            this.useSkill(index);
        };


        /* 道具 */

        const itemBox=
            document.createElement(
                "div"
            );

        itemBox.className=
            "item-box";


        for(
            let s=0;
            s<2;
            s++
        ){

            const slot=
                document.createElement(
                    "button"
                );

            slot.className=
                "item-slot empty";

            slot.dataset.slot=
                s;

            slot.textContent="·";


            slot.onclick=()=>{

                SoundFX.click();

                this.useItem(
                    index,
                    s
                );
            };


            itemBox.appendChild(
                slot
            );
        }


        side.appendChild(
            nextBox
        );

        side.appendChild(
            energyBox
        );

        side.appendChild(
            skill
        );

        side.appendChild(
            itemBox
        );


        boardRow.appendChild(
            boardContainer
        );

        boardRow.appendChild(
            side
        );


        /* 控制 */

        const controls=
            document.createElement(
                "div"
            );


        const colors=[
            "controls-red",
            "controls-blue",
            "controls-purple",
            "controls-green"
        ];


        controls.className=
            "controls "+
            colors[index];


        const actions=[
            ["left","◀"],
            ["rotate","↻"],
            ["right","▶"],
            ["down","▼"],
            ["drop","⬇"]
        ];


        actions.forEach(
            ([action,icon])=>{

                const btn=
                    document.createElement(
                        "button"
                    );

                btn.textContent=icon;


                btn.addEventListener(
                    "pointerdown",
                    e=>{

                        e.preventDefault();

                        SoundFX.unlock();

                        if(this.started){

                            this.control(
                                index,
                                action
                            );
                        }
                    }
                );


                controls.appendChild(btn);
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
        element.appendChild(boardRow);
        element.appendChild(controls);
        element.appendChild(hint);


        return{

            element,

            canvas,

            nextCanvas,

            attack,

            board:null,

            index,

            alive:true,

            items:[]
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

                <div>单行 → 0</div>
                <div>双行 → +1</div>
                <div>三行 → +2</div>
                <div>四行 → +4</div>
                <div>连击 → 加成</div>

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


    countdown(){

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


            number.style.animation="none";

            void number.offsetWidth;

            number.style.animation=
                "countPop .75s cubic-bezier(.1,.8,.2,1)";


            if(n>0){

                SoundFX.warning();

                n--;

                setTimeout(
                    run,
                    800
                );

            }else{

                SoundFX.victory();

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


        const min=
            Math.floor(
                this.time/60
            );

        const sec=
            this.time%60;


        timer.textContent=
            String(min).padStart(2,"0")+
            ":"+
            String(sec).padStart(2,"0");


        if(this.time<=20)
            timer.classList.add(
                "danger"
            );
        else
            timer.classList.remove(
                "danger"
            );
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


        switch(action){

            case "left":
                p.board.move(-1);
                break;

            case "right":
                p.board.move(1);
                break;

            case "rotate":
                p.board.rotate();
                break;

            case "down":
                p.board.softDrop();
                break;

            case "drop":
                p.board.hardDrop();
                break;
        }


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
                "arrowdown"
            ].includes(key) ||
            e.code==="Space"
        ){

            e.preventDefault();
        }


        /* =====================
           P1
        ===================== */

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


        /* =====================
           P2
        ===================== */

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


        /* =====================
           P3
        ===================== */

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


        /* =====================
           P4
        ===================== */

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


        /*
         * 道具快捷键
         */

        if(key==="q")
            this.useItem(0,0);

        if(key==="e")
            this.useItem(0,1);
    },


    /* =================================================
       消行
    ================================================= */

    linesCleared(
        attacker,
        amount,
        combo
    ){

        const source=
            this.players[attacker];


        if(!source)
            return;


        SoundFX.line(amount);


        /*
         * 棋盘中心爆炸
         */

        const rect=
            source.canvas
                .getBoundingClientRect();


        const color=
            this.playerColors[
                attacker
            ];


        Effects.flash("white");


        Effects.burst(
            rect.left+
            rect.width/2,

            rect.top+
            rect.height*.55,

            color,

            25+
            amount*15,

            180+
            amount*35
        );


        Effects.ring(
            rect.left+
            rect.width/2,

            rect.top+
            rect.height*.55,

            color,

            50+
            amount*25
        );


        if(amount>=2){

            Effects.announcement(
                amount===4
                    ? "TETRIS!"
                    : "CLEAR ×"+amount,
                color
            );
        }


        if(combo>=2){

            SoundFX.combo(combo);


            setTimeout(
                ()=>{

                    Effects.announcement(
                        "COMBO ×"+combo,
                        "#ffe04b"
                    );

                },
                250
            );
        }


        /*
         * 攻击计算
         */

        let garbage=0;


        if(amount===2)
            garbage=1;

        if(amount===3)
            garbage=2;

        if(amount===4)
            garbage=4;


        if(combo>=2)
            garbage+=
                Math.floor(
                    (combo-1)/2
                );


        /*
         * 1行不攻击
         */

        if(garbage<=0)
            return;


        this.attack(
            attacker,
            garbage
        );


        /*
         * 有概率获得道具
         */

        const chance=
            amount>=3
                ? .42
                : .18;


        if(Math.random()<chance){

            this.giveRandomItem(
                attacker
            );
        }
    },


    /* =================================================
       攻击
    ================================================= */

    attack(
        attacker,
        amount
    ){

        if(this.count<=1)
            return;


        const targets=
            this.players.filter(
                p=>
                    p.alive &&
                    p.index!==attacker
            );


        if(!targets.length)
            return;


        /*
         * 2人：直接攻击
         * 3/4人：随机目标
         */

        let target;


        if(this.count===2){

            target=targets[0];

        }else{

            target=
                targets[
                    Math.floor(
                        Math.random()*
                        targets.length
                    )
                ];
        }


        /*
         * 护盾抵消
         */

        const shieldIndex=
            target.items.indexOf(
                "shield"
            );


        if(shieldIndex!==-1){

            target.items.splice(
                shieldIndex,
                1
            );


            this.refreshItems(
                target.index
            );


            Effects.announcement(
                "BLOCK!",
                "#45aaff"
            );


            SoundFX.hit();

            return;
        }


        SoundFX.attack();


        const sourceBoard=
            this.players[attacker]
                .canvas;

        const targetBoard=
            target.canvas;


        Effects.attackBeam(
            sourceBoard,
            targetBoard,
            this.playerColors[
                attacker
            ]
        );


        setTimeout(
            ()=>{

                target.board.addGarbage(
                    amount
                );


                Effects.boardShake(
                    targetBoard.parentElement
                );


                Effects.flash("red");

                SoundFX.hit();


                Effects.attack(
                    target.attack,
                    "⚡ +"+amount,
                    "#ffdf42"
                );

            },
            320
        );
    },


    /* =================================================
       道具
    ================================================= */

    giveRandomItem(index){

        const p=
            this.players[index];


        if(!p)
            return;


        if(p.items.length>=2)
            return;


        const items=[
            "bomb",
            "shield",
            "lightning",
            "clear"
        ];


        const item=
            items[
                Math.floor(
                    Math.random()*items.length
                )
            ];


        p.items.push(item);


        SoundFX.item();


        this.refreshItems(index);


        Effects.announcement(
            this.itemName(item),
            this.itemColor(item)
        );
    },


    itemName(item){

        return{
            bomb:"💣 炸弹",
            shield:"🛡 护盾",
            lightning:"⚡ 闪电",
            clear:"🧹 清场"
        }[item];
    },


    itemColor(item){

        return{
            bomb:"#ff4055",
            shield:"#42a8ff",
            lightning:"#ffe044",
            clear:"#4effa0"
        }[item];
    },


    refreshItems(index){

        const p=
            this.players[index];


        const slots=
            p.element
                .querySelectorAll(
                    ".item-slot"
                );


        slots.forEach(
            (slot,i)=>{

                const item=
                    p.items[i];


                slot.className=
                    "item-slot";


                if(!item){

                    slot.classList.add(
                        "empty"
                    );

                    slot.textContent="·";

                    return;
                }


                const icons={
                    bomb:"💣",
                    shield:"🛡",
                    lightning:"⚡",
                    clear:"🧹"
                };


                slot.textContent=
                    icons[item];


                slot.classList.add(
                    "item-"+item
                );
            }
        );
    },


    useItem(
        index,
        slot
    ){

        if(!this.started)
            return;


        const p=
            this.players[index];


        if(
            !p ||
            !p.alive
        )
            return;


        const item=
            p.items[slot];


        if(!item)
            return;


        /*
         * 消耗
         */

        p.items.splice(
            slot,
            1
        );


        this.refreshItems(
            index
        );


        SoundFX.item();


        /*
         * 炸弹
         */

        if(item==="bomb"){

            Effects.announcement(
                "💣 BOOM!",
                "#ff4055"
            );


            /*
             * 强制攻击
             */

            if(this.count>1){

                const targets=
                    this.players.filter(
                        q=>
                            q.alive &&
                            q.index!==index
                    );


                if(targets.length){

                    const target=
                        targets[
                            Math.floor(
                                Math.random()*
                                targets.length
                            )
                        ];


                    Effects.attackBeam(
                        p.canvas,
                        target.canvas,
                        "#ff4055"
                    );


                    setTimeout(
                        ()=>{

                            target.board
                                .addGarbage(2);

                            Effects.boardShake(
                                target.canvas
                                    .parentElement
                            );

                        },
                        300
                    );
                }
            }
        }


        /*
         * 护盾
         */

        else if(item==="shield"){

            p.items.push(
                "shield"
            );

            this.refreshItems(index);


            Effects.announcement(
                "🛡 SHIELD",
                "#42a8ff"
            );
        }


        /*
         * 闪电
         */

        else if(item==="lightning"){

            const targets=
                this.players.filter(
                    q=>
                        q.alive &&
                        q.index!==index
                );


            if(targets.length){

                const target=
                    targets[
                        Math.floor(
                            Math.random()*
                            targets.length
                        )
                    ];


                Effects.attackBeam(
                    p.canvas,
                    target.canvas,
                    "#ffe044"
                );


                setTimeout(
                    ()=>{

                        target.board.dropInterval=
                            Math.max(
                                180,
                                target.board.dropInterval*
                                .55
                            );


                        Effects.boardShake(
                            target.canvas
                                .parentElement
                        );


                        setTimeout(
                            ()=>{

                                if(
                                    target.board
                                ){

                                    target.board
                                        .dropInterval=
                                        720;
                                }

                            },
                            5000
                        );

                    },
                    300
                );
            }


            Effects.announcement(
                "⚡ OVERLOAD",
                "#ffe044"
            );
        }


        /*
         * 清场
         */

        else if(item==="clear"){

            p.board.clearBottomRows(2);


            const r=
                p.canvas
                    .getBoundingClientRect();


            Effects.flash("white");


            Effects.burst(
                r.left+r.width/2,
                r.top+r.height*.75,
                "#4effa0",
                50,
                190
            );


            Effects.announcement(
                "🧹 CLEAR!",
                "#4effa0"
            );
        }
    },


    /* =================================================
       技能
    ================================================= */

    useSkill(index){

        const p=
            this.players[index];


        if(
            !p ||
            !p.alive ||
            !p.board
        )
            return;


        if(p.board.energy<100){

            Effects.attack(
                p.attack,
                "未充能",
                "#79859d"
            );

            return;
        }


        p.board.energy=0;


        SoundFX.skill();


        Effects.announcement(
            "⚡ 郑块冲击!",
            "#c66aff"
        );


        const targets=
            this.players.filter(
                q=>
                    q.alive &&
                    q.index!==index
            );


        if(!targets.length)
            return;


        const target=
            targets[
                Math.floor(
                    Math.random()*
                    targets.length
                )
            ];


        Effects.attackBeam(
            p.canvas,
            target.canvas,
            "#c66aff"
        );


        setTimeout(
            ()=>{

                target.board
                    .addGarbage(3);


                Effects.boardShake(
                    target.canvas
                        .parentElement
                );


                Effects.flash("red");


                Effects.attack(
                    target.attack,
                    "ULTIMATE!",
                    "#c66aff"
                );


            },
            400
        );
    },


    /* =================================================
       落地
    ================================================= */

    landEffect(index){

        const p=
            this.players[index];


        if(!p)
            return;


        const r=
            p.canvas
                .getBoundingClientRect();


        Effects.ring(
            r.left+r.width/2,
            r.top+r.height*.78,
            this.playerColors[index],
            40
        );
    },


    /* =================================================
       危险状态
    ================================================= */

    setDanger(
        index,
        danger
    ){

        const p=
            this.players[index];


        if(!p)
            return;


        const board=
            p.canvas
                .parentElement;


        if(danger){

            board.classList.add(
                "danger"
            );

        }else{

            board.classList.remove(
                "danger"
            );
        }
    },


    /* =================================================
       玩家死亡
    ================================================= */

    playerDied(index){

        const p=
            this.players[index];


        if(!p || !p.alive)
            return;


        p.alive=false;


        p.element.classList.add(
            "dead"
        );


        SoundFX.ko();


        Effects.koExplosion(
            p.canvas.parentElement,
            this.playerColors[index]
        );


        Effects.announcement(
            "PLAYER "+
            (index+1)+
            " K.O.",
            this.playerColors[index]
        );


        /*
         * 只有一个活人
         */

        const alive=
            this.players.filter(
                x=>x.alive
            );


        if(this.count===1){

            setTimeout(
                ()=>{
                    this.end(
                        null,
                        "挑战完成"
                    );
                },
                600
            );

            return;
        }


        if(alive.length<=1){

            setTimeout(
                ()=>{
                    this.end(
                        alive.length
                            ? alive[0].index
                            : null
                    );
                },
                700
            );
        }
    },


    /* =================================================
       时间结束
    ================================================= */

    timeUp(){

        if(!this.started)
            return;


        const alive=
            this.players.filter(
                p=>p.alive
            );


        let winner=null;


        if(alive.length){

            winner=
                alive.reduce(
                    (best,p)=>
                        p.board.score>
                        best.board.score
                            ?p
                            :best
                );
        }


        this.end(
            winner
                ?winner.index
                :null
        );
    },


    /* =================================================
       UI
    ================================================= */

    updateUI(index){

        const p=
            this.players[index];


        if(
            !p ||
            !p.board
        )
            return;


        const b=p.board;


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

        const energy=
            document.getElementById(
                "energy-"+index
            );


        if(score)
            score.textContent=
                b.score;

        if(lines)
            lines.textContent=
                b.lines;

        if(combo)
            combo.textContent=
                b.combo;


        if(energy){

            energy.style.width=
                b.energy+"%";
        }


        const skill=
            p.element
                .querySelector(
                    ".skill-button"
                );


        if(skill){

            if(b.energy>=100){

                skill.classList.add(
                    "ready"
                );

                skill.textContent=
                    "⚡ 释放技能";

            }else{

                skill.classList.remove(
                    "ready"
                );

                skill.textContent=
                    "⚡ 技能 "+
                    Math.floor(
                        b.energy
                    )+"%";
            }
        }


        /*
         * NEXT 预览
         */

        this.drawNext(
            p.nextCanvas,
            b.next
        );
    },


    drawNext(canvas,piece){

        if(!canvas || !piece)
            return;


        const ctx=
            canvas.getContext("2d");


        ctx.clearRect(
            0,
            0,
            canvas.width,
            canvas.height
        );


        const matrix=
            piece.matrix;


        const size=
            11;


        const width=
            matrix[0].length*
            size;


        const height=
            matrix.length*
            size;


        const ox=
            (canvas.width-width)/2;


        const oy=
            (canvas.height-height)/2;


        for(
            let y=0;
            y<matrix.length;
            y++
        ){

            for(
                let x=0;
                x<matrix[y].length;
                x++
            ){

                if(!matrix[y][x])
                    continue;


                const px=
                    ox+x*size;

                const py=
                    oy+y*size;


                /*
                 * NEXT 使用图片
                 */

                if(
                    BLOCK_IMAGE.complete &&
                    BLOCK_IMAGE.naturalWidth>0
                ){

                    ctx.drawImage(
                        BLOCK_IMAGE,
                        px+2,
                        py+2,
                        size-4,
                        size-4
                    );

                }else{

                    ctx.fillStyle=
                        "#555";

                    ctx.fillRect(
                        px+2,
                        py+2,
                        size-4,
                        size-4
                    );
                }


                /*
                 * 只有描边
                 */

                ctx.strokeStyle=
                    piece.color;

                ctx.lineWidth=1.4;

                ctx.shadowColor=
                    piece.color;

                ctx.shadowBlur=5;


                ctx.strokeRect(
                    px+.8,
                    py+.8,
                    size-1.6,
                    size-1.6
                );
            }
        }
    },


    /* =================================================
       结果
    ================================================= */

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

            sub.textContent=
                "BATTLE COMPLETE";

        }else{

            winner.textContent=
                "PLAYER "+
                (winnerIndex+1);


            winner.style.color=
                this.playerColors[
                    winnerIndex
                ];


            sub.textContent=
                "VICTORY";


            SoundFX.victory();

            Effects.victory();
        }


        scores.innerHTML=
            this.players
                .map(
                    p=>
                        `<div>
                            PLAYER ${p.index+1}
                            ·
                            ${p.board.score}
                            分
                            ·
                            ${p.board.lines}
                            行
                        </div>`
                )
                .join("");


        screen.classList.remove(
            "hidden"
        );
    },


    /* =================================================
       返回菜单
    ================================================= */

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
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "resultScreen"
            )
            .classList.add(
                "hidden"
            );


        document
            .getElementById(
                "menu"
            )
            .classList.remove(
                "hidden"
            );
    }

};


Game.init();
