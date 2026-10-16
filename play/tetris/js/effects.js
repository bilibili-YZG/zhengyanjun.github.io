/* =====================================================
   音效系统
   完全使用 Web Audio API
   不需要额外音频文件
===================================================== */

const SoundFX = {

    ctx:null,
    master:null,

    init(){

        if(this.ctx)
            return;

        try{

            this.ctx =
                new (
                    window.AudioContext ||
                    window.webkitAudioContext
                )();

            this.master =
                this.ctx.createGain();

            this.master.gain.value=.14;

            this.master.connect(
                this.ctx.destination
            );

        }catch(e){

            console.warn(
                "WebAudio unavailable"
            );
        }
    },


    unlock(){

        this.init();

        if(
            this.ctx &&
            this.ctx.state==="suspended"
        ){

            this.ctx.resume();
        }
    },


    tone(
        freq,
        duration,
        type="sine",
        volume=.3,
        endFreq=null
    ){

        if(!this.ctx)
            return;

        const now=
            this.ctx.currentTime;

        const osc=
            this.ctx.createOscillator();

        const gain=
            this.ctx.createGain();


        osc.type=type;

        osc.frequency.setValueAtTime(
            freq,
            now
        );

        if(endFreq!==null){

            osc.frequency.exponentialRampToValueAtTime(
                Math.max(20,endFreq),
                now+duration
            );
        }


        gain.gain.setValueAtTime(
            .0001,
            now
        );

        gain.gain.exponentialRampToValueAtTime(
            volume,
            now+.015
        );

        gain.gain.exponentialRampToValueAtTime(
            .0001,
            now+duration
        );


        osc.connect(gain);
        gain.connect(this.master);

        osc.start(now);
        osc.stop(now+duration+.03);
    },


    click(){

        this.unlock();

        this.tone(
            650,
            .07,
            "square",
            .08,
            900
        );
    },


    move(){

        this.unlock();

        this.tone(
            170,
            .035,
            "square",
            .035,
            190
        );
    },


    rotate(){

        this.unlock();

        this.tone(
            420,
            .09,
            "triangle",
            .07,
            700
        );
    },


    drop(){

        this.unlock();

        this.tone(
            100,
            .13,
            "sawtooth",
            .08,
            45
        );
    },


    line(count){

        this.unlock();

        const notes=[
            420,
            530,
            680,
            860
        ];

        const base=
            notes[
                Math.min(
                    3,
                    count-1
                )
            ];

        this.tone(
            base,
            .16,
            "triangle",
            .11,
            base*1.5
        );

        setTimeout(
            ()=>{
                this.tone(
                    base*1.5,
                    .22,
                    "sine",
                    .09,
                    base*2
                );
            },
            60
        );
    },


    combo(level){

        this.unlock();

        const base=
            500+level*55;

        this.tone(
            base,
            .11,
            "square",
            .08,
            base*1.4
        );

        setTimeout(
            ()=>{
                this.tone(
                    base*1.4,
                    .16,
                    "triangle",
                    .1,
                    base*1.9
                );
            },
            80
        );
    },


    attack(){

        this.unlock();

        this.tone(
            75,
            .35,
            "sawtooth",
            .13,
            35
        );

        setTimeout(
            ()=>{
                this.tone(
                    240,
                    .18,
                    "square",
                    .08,
                    70
                );
            },
            90
        );
    },


    hit(){

        this.unlock();

        this.tone(
            65,
            .2,
            "sawtooth",
            .12,
            30
        );
    },


    item(){

        this.unlock();

        this.tone(
            520,
            .09,
            "sine",
            .08,
            820
        );

        setTimeout(
            ()=>{
                this.tone(
                    820,
                    .13,
                    "sine",
                    .09,
                    1100
                );
            },
            75
        );
    },


    skill(){

        this.unlock();

        this.tone(
            180,
            .4,
            "sawtooth",
            .12,
            850
        );

        setTimeout(
            ()=>{
                this.tone(
                    850,
                    .3,
                    "triangle",
                    .1,
                    1300
                );
            },
            120
        );
    },


    warning(){

        this.unlock();

        this.tone(
            160,
            .12,
            "square",
            .1,
            120
        );

        setTimeout(
            ()=>{
                this.tone(
                    160,
                    .12,
                    "square",
                    .1,
                    120
                );
            },
            170
        );
    },


    ko(){

        this.unlock();

        this.tone(
            240,
            .3,
            "sawtooth",
            .14,
            50
        );

        setTimeout(
            ()=>{
                this.tone(
                    60,
                    .5,
                    "square",
                    .1,
                    25
                );
            },
            180
        );
    },


    victory(){

        this.unlock();

        const notes=[
            523,
            659,
            784,
            1046
        ];

        notes.forEach(
            (n,i)=>{

                setTimeout(
                    ()=>{
                        this.tone(
                            n,
                            .25,
                            "triangle",
                            .11,
                            n*1.03
                        );
                    },
                    i*120
                );
            }
        );
    }
};



/* =====================================================
   特效
===================================================== */

const Effects={

    init(){

        this.createAmbientParticles();

    },


    createAmbientParticles(){

        const container=
            document.getElementById(
                "particles"
            );

        if(!container)
            return;

        for(let i=0;i<45;i++){

            this.spawnAmbient(
                container
            );
        }
    },


    spawnAmbient(container){

        const p=
            document.createElement("div");

        p.className=
            "ambient-particle";

        const colors=[
            "#ff4265",
            "#38a6ff",
            "#c86aff",
            "#50e5a0",
            "#ffe044"
        ];

        const color=
            colors[
                Math.floor(
                    Math.random()*colors.length
                )
            ];

        p.style.color=color;
        p.style.background=color;

        p.style.left=
            Math.random()*100+"%";

        p.style.top=
            (75+Math.random()*30)+"%";

        p.style.setProperty(
            "--dx",
            (Math.random()*260-130)+"px"
        );

        const duration=
            6+Math.random()*10;

        p.style.animationDuration=
            duration+"s";

        p.style.animationDelay=
            (-Math.random()*duration)+"s";

        container.appendChild(p);

        setTimeout(
            ()=>{
                p.remove();
                this.spawnAmbient(container);
            },
            duration*1000+200
        );
    },


    burst(
        x,
        y,
        color="#fff",
        amount=25,
        power=150
    ){

        const container=
            document.getElementById(
                "particles"
            );

        if(!container)
            return;

        for(let i=0;i<amount;i++){

            const p=
                document.createElement(
                    "div"
                );

            p.style.position="fixed";

            p.style.left=x+"px";
            p.style.top=y+"px";

            const size=
                2+Math.random()*5;

            p.style.width=size+"px";
            p.style.height=size+"px";

            p.style.borderRadius=
                Math.random()>.3
                    ?"50%"
                    :"1px";

            p.style.background=color;

            p.style.boxShadow=
                "0 0 12px "+color;

            p.style.pointerEvents=
                "none";

            p.style.zIndex="900";


            const angle=
                Math.random()*
                Math.PI*2;

            const speed=
                power*(.35+Math.random()*.8);

            const dx=
                Math.cos(angle)*speed;

            const dy=
                Math.sin(angle)*speed;


            p.animate(

                [
                    {
                        transform:
                            "translate(0,0) scale(1)",
                        opacity:1
                    },

                    {
                        transform:
                            `translate(${dx}px,${dy}px) scale(0)`,
                        opacity:0
                    }
                ],

                {
                    duration:
                        350+
                        Math.random()*500,

                    easing:
                        "cubic-bezier(.1,.7,.2,1)"
                }
            );

            container.appendChild(p);

            setTimeout(
                ()=>p.remove(),
                1000
            );
        }
    },


    ring(
        x,
        y,
        color="#fff",
        size=100
    ){

        const ring=
            document.createElement("div");

        ring.style.position="fixed";

        ring.style.left=
            (x-size/2)+"px";

        ring.style.top=
            (y-size/2)+"px";

        ring.style.width=size+"px";
        ring.style.height=size+"px";

        ring.style.border=
            "3px solid "+color;

        ring.style.borderRadius="50%";

        ring.style.boxShadow=
            "0 0 20px "+color;

        ring.style.pointerEvents=
            "none";

        ring.style.zIndex="800";


        ring.animate(

            [
                {
                    transform:"scale(.1)",
                    opacity:.9
                },

                {
                    transform:"scale(1.8)",
                    opacity:0
                }
            ],

            {
                duration:600,
                easing:"cubic-bezier(.1,.8,.2,1)"
            }
        );


        document.body.appendChild(ring);

        setTimeout(
            ()=>ring.remove(),
            700
        );
    },


    boardShake(element){

        if(!element)
            return;

        element.classList.remove(
            "shake"
        );

        void element.offsetWidth;

        element.classList.add(
            "shake"
        );
    },


    flash(type="white"){

        const layer=
            document.getElementById(
                "flashLayer"
            );

        if(!layer)
            return;

        layer.className="";

        void layer.offsetWidth;

        layer.classList.add(
            type==="red"
                ?"flash-red"
                :"flash-white"
        );
    },


    announcement(
        text,
        color="#fff"
    ){

        const el=
            document.getElementById(
                "announcementText"
            );

        if(!el)
            return;

        el.textContent=text;

        el.style.textShadow=
            `0 0 8px #fff,
             0 0 30px ${color},
             0 0 70px ${color}`;

        el.classList.remove("show");

        void el.offsetWidth;

        el.classList.add("show");
    },


    attackBeam(
        from,
        to,
        color="#fff"
    ){

        if(!from || !to)
            return;

        const a=
            from.getBoundingClientRect();

        const b=
            to.getBoundingClientRect();

        const x1=
            a.left+a.width/2;

        const y1=
            a.top+a.height/2;

        const x2=
            b.left+b.width/2;

        const y2=
            b.top+b.height/2;


        const dx=x2-x1;
        const dy=y2-y1;

        const length=
            Math.sqrt(dx*dx+dy*dy);

        const angle=
            Math.atan2(dy,dx)*
            180/Math.PI;


        const beam=
            document.createElement("div");

        beam.style.position="fixed";

        beam.style.left=x1+"px";
        beam.style.top=y1+"px";

        beam.style.width=length+"px";
        beam.style.height="5px";

        beam.style.transformOrigin=
            "0 50%";

        beam.style.transform=
            `rotate(${angle}deg)`;

        beam.style.background=
            `linear-gradient(
                90deg,
                transparent,
                white,
                ${color},
                transparent
            )`;

        beam.style.boxShadow=
            `0 0 12px white,
             0 0 25px ${color}`;

        beam.style.pointerEvents=
            "none";

        beam.style.zIndex="700";


        beam.animate(

            [
                {
                    opacity:0,
                    transform:
                        `rotate(${angle}deg)
                         scaleX(.1)`
                },

                {
                    opacity:1,
                    transform:
                        `rotate(${angle}deg)
                         scaleX(1)`
                },

                {
                    opacity:0
                }
            ],

            {
                duration:450,
                easing:"ease-out"
            }
        );


        document.body.appendChild(
            beam
        );

        setTimeout(
            ()=>beam.remove(),
            500
        );
    },


    screenShake(){

        document.body.animate(

            [
                {
                    transform:"translate(0,0)"
                },

                {
                    transform:"translate(-5px,2px)"
                },

                {
                    transform:"translate(5px,-2px)"
                },

                {
                    transform:"translate(-3px,1px)"
                },

                {
                    transform:"translate(0,0)"
                }
            ],

            {
                duration:300
            }
        );
    },


    koExplosion(element,color){

        if(!element)
            return;

        const r=
            element.getBoundingClientRect();

        const x=
            r.left+r.width/2;

        const y=
            r.top+r.height/2;


        this.flash("red");

        this.screenShake();

        this.burst(
            x,
            y,
            color,
            80,
            260
        );

        this.ring(
            x,
            y,
            color,
            120
        );

        this.ring(
            x,
            y,
            "#fff",
            70
        );
    },


    victory(){

        for(let i=0;i<12;i++){

            setTimeout(
                ()=>{

                    this.burst(
                        Math.random()*
                            window.innerWidth,

                        Math.random()*
                            window.innerHeight*.8,

                        [
                            "#ffd83d",
                            "#ff5d70",
                            "#5d8dff",
                            "#c66aff"
                        ][
                            Math.floor(
                                Math.random()*4
                            )
                        ],

                        15,
                        180
                    );

                },
                i*130
            );
        }
    }

};


Effects.init();
