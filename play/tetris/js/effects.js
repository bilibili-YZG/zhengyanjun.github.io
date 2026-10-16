const Effects = {

    particles: [],


    init(){

        const container =
            document.getElementById("particles");

        if(!container)
            return;

        for(let i=0;i<35;i++){

            this.createAmbientParticle();
        }

    },


    createAmbientParticle(){

        const container =
            document.getElementById("particles");

        if(!container)
            return;

        const p =
            document.createElement("div");

        p.className="particle";

        const colors=[
            "#ff4265",
            "#36a6ff",
            "#c66aff",
            "#55e5a0",
            "#ffd84a"
        ];

        const color =
            colors[
                Math.floor(
                    Math.random()*colors.length
                )
            ];

        p.style.color=color;

        p.style.background=color;

        p.style.left =
            Math.random()*100+"%";

        p.style.top =
            (80+Math.random()*30)+"%";

        p.style.setProperty(
            "--dx",
            (Math.random()*240-120)+"px"
        );

        p.style.animationDuration =
            (7+Math.random()*9)+"s";

        p.style.animationDelay =
            (-Math.random()*10)+"s";

        container.appendChild(p);

        setTimeout(
            ()=>{
                p.remove();
                this.createAmbientParticle();
            },
            18000
        );
    },


    burst(x,y,color="#ffffff",amount=25){

        const container =
            document.getElementById(
                "particles"
            );

        if(!container)
            return;

        for(let i=0;i<amount;i++){

            const p =
                document.createElement("div");

            p.className="burst-particle";

            p.style.position="fixed";

            p.style.left=x+"px";
            p.style.top=y+"px";

            p.style.width=
                (2+Math.random()*5)+"px";

            p.style.height=
                p.style.width;

            p.style.borderRadius="50%";

            p.style.background=color;

            p.style.boxShadow=
                "0 0 12px "+color;

            p.style.pointerEvents="none";

            p.style.zIndex="500";

            const angle =
                Math.random()*Math.PI*2;

            const speed =
                60+Math.random()*180;

            const dx =
                Math.cos(angle)*speed;

            const dy =
                Math.sin(angle)*speed;

            p.animate(
                [
                    {
                        transform:"translate(0,0) scale(1)",
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
                        350+Math.random()*450,
                    easing:"cubic-bezier(.1,.7,.2,1)"
                }
            );

            container.appendChild(p);

            setTimeout(
                ()=>p.remove(),
                900
            );
        }
    },


    attack(element,text,color){

        if(!element)
            return;

        element.textContent=text;

        element.style.color=color;

        element.classList.remove("show");

        void element.offsetWidth;

        element.classList.add("show");
    },


    message(element,text){

        if(!element)
            return;

        element.textContent=text;

        clearTimeout(element._timer);

        element._timer=setTimeout(
            ()=>{
                element.textContent="";
            },
            1000
        );
    }

};


Effects.init();
