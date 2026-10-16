const COLS = 10;
const ROWS = 20;


/* ==================================
   ZYJ 图片
================================== */

const BLOCK_IMAGE =
    new Image();

BLOCK_IMAGE.src =
    "../tetris/assets/zyj.png";


/* ==================================
   不染图片，只染描边
================================== */

const PIECE_COLORS = [

    "#00eaff",
    "#ffd333",
    "#c65cff",
    "#42ff91",
    "#ff4775",
    "#ff8b35",
    "#4f7cff"

];


const SHAPES = {

    I:[
        [
            [1,1,1,1]
        ],
        [
            [1],
            [1],
            [1],
            [1]
        ]
    ],


    O:[
        [
            [1,1],
            [1,1]
        ]
    ],


    T:[
        [
            [0,1,0],
            [1,1,1]
        ],

        [
            [1,0],
            [1,1],
            [1,0]
        ],

        [
            [1,1,1],
            [0,1,0]
        ],

        [
            [0,1],
            [1,1],
            [0,1]
        ]
    ],


    S:[
        [
            [0,1,1],
            [1,1,0]
        ],

        [
            [1,0],
            [1,1],
            [0,1]
        ]
    ],


    Z:[
        [
            [1,1,0],
            [0,1,1]
        ],

        [
            [0,1],
            [1,1],
            [1,0]
        ]
    ],


    J:[
        [
            [1,0,0],
            [1,1,1]
        ],

        [
            [1,1],
            [1,0],
            [1,0]
        ],

        [
            [1,1,1],
            [0,0,1]
        ],

        [
            [0,1],
            [0,1],
            [1,1]
        ]
    ],


    L:[
        [
            [0,0,1],
            [1,1,1]
        ],

        [
            [1,0],
            [1,0],
            [1,1]
        ],

        [
            [1,1,1],
            [1,0,0]
        ],

        [
            [1,1],
            [0,1],
            [0,1]
        ]
    ]

};


class TetrisBoard{

    constructor(canvas,index){

        this.canvas=canvas;

        this.ctx=
            canvas.getContext("2d");

        this.index=index;

        this.grid=
            this.createGrid();

        this.current=null;

        this.score=0;

        this.lines=0;

        this.combo=0;

        this.alive=true;

        this.dropCounter=0;

        this.dropInterval=750;

        this.lastTime=
            performance.now();

        this.resize();

        this.spawn();
    }


    createGrid(){

        return Array.from(
            {length:ROWS},
            ()=>Array(COLS).fill(null)
        );
    }


    resize(){

        const players=
            window.Game
                ? Game.count
                : 2;

        let width;

        if(players===1)
            width=330;

        else if(players===2)
            width=285;

        else if(players===3)
            width=235;

        else
            width=190;


        const maxHeight=
            window.innerHeight*.63;

        const cell=
            Math.floor(
                Math.min(
                    width/COLS,
                    maxHeight/ROWS
                )
            );


        this.cell=
            Math.max(
                10,
                cell
            );

        this.canvas.width=
            COLS*this.cell;

        this.canvas.height=
            ROWS*this.cell;

        this.draw();
    }


    randomPiece(){

        const types=
            Object.keys(SHAPES);

        const type=
            types[
                Math.floor(
                    Math.random()*types.length
                )
            ];

        const matrix=
            SHAPES[type][0]
                .map(row=>row.slice());


        return{

            type,

            matrix,

            rotation:0,

            x:
                Math.floor(
                    (COLS-matrix[0].length)/2
                ),

            y:-1,

            color:
                PIECE_COLORS[
                    Math.floor(
                        Math.random()*
                        PIECE_COLORS.length
                    )
                ]
        };
    }


    spawn(){

        this.current=
            this.randomPiece();

        if(
            this.collides(
                this.current,
                0,
                0,
                this.current.matrix
            )
        ){

            this.alive=false;

            if(window.Game)
                Game.playerDied(
                    this.index
                );
        }
    }


    collides(
        piece,
        dx,
        dy,
        matrix
    ){

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

                const nx=
                    piece.x+x+dx;

                const ny=
                    piece.y+y+dy;


                if(
                    nx<0 ||
                    nx>=COLS ||
                    ny>=ROWS
                )
                    return true;


                if(
                    ny>=0 &&
                    this.grid[ny][nx]
                )
                    return true;
            }
        }

        return false;
    }


    move(dx){

        if(!this.alive)
            return;

        if(
            !this.collides(
                this.current,
                dx,
                0,
                this.current.matrix
            )
        ){

            this.current.x+=dx;

            this.draw();

            return true;
        }

        return false;
    }


    softDrop(){

        if(!this.alive)
            return;

        if(
            !this.collides(
                this.current,
                0,
                1,
                this.current.matrix
            )
        ){

            this.current.y++;

            this.score++;

        }else{

            this.lock();
        }

        this.draw();
    }


    hardDrop(){

        if(!this.alive)
            return;

        let distance=0;

        while(
            !this.collides(
                this.current,
                0,
                1,
                this.current.matrix
            )
        ){

            this.current.y++;

            distance++;
        }

        this.score+=
            distance*2;

        this.lock();

        this.draw();
    }


    rotate(){

        if(!this.alive)
            return;

        const rotations=
            SHAPES[
                this.current.type
            ];

        const next=
            (
                this.current.rotation+1
            )%rotations.length;

        const matrix=
            rotations[next];


        const kicks=[
            0,
            -1,
            1,
            -2,
            2
        ];


        for(const kick of kicks){

            if(
                !this.collides(
                    this.current,
                    kick,
                    0,
                    matrix
                )
            ){

                this.current.rotation=
                    next;

                this.current.matrix=
                    matrix.map(
                        row=>row.slice()
                    );

                this.current.x+=kick;

                this.draw();

                return true;
            }
        }

        return false;
    }


    lock(){

        const p=this.current;

        for(
            let y=0;
            y<p.matrix.length;
            y++
        ){

            for(
                let x=0;
                x<p.matrix[y].length;
                x++
            ){

                if(!p.matrix[y][x])
                    continue;

                const gy=p.y+y;
                const gx=p.x+x;

                if(
                    gy>=0 &&
                    gy<ROWS &&
                    gx>=0 &&
                    gx<COLS
                ){

                    this.grid[gy][gx]={
                        color:p.color,
                        type:p.type
                    };
                }
            }
        }


        const cleared=
            this.clearLines();


        if(cleared){

            this.lines+=
                cleared;

            this.combo++;


            const points={
                1:100,
                2:300,
                3:500,
                4:800
            };


            this.score+=
                points[cleared]*
                Math.max(
                    1,
                    this.combo
                );


            if(window.Game){

                Game.linesCleared(
                    this.index,
                    cleared,
                    this.combo
                );
            }

        }else{

            this.combo=0;
        }


        this.spawn();
    }


    clearLines(){

        let count=0;


        outer:
        for(
            let y=ROWS-1;
            y>=0;
            y--
        ){

            for(
                let x=0;
                x<COLS;
                x++
            ){

                if(!this.grid[y][x])
                    continue outer;
            }


            this.grid.splice(
                y,
                1
            );

            this.grid.unshift(
                Array(COLS).fill(null)
            );

            count++;

            y++;
        }


        return count;
    }


    addGarbage(amount){

        if(!this.alive)
            return;


        amount=
            Math.min(
                amount,
                ROWS
            );


        for(
            let i=0;
            i<amount;
            i++
        ){

            this.grid.shift();


            const hole=
                Math.floor(
                    Math.random()*COLS
                );


            const row=
                Array.from(
                    {length:COLS},
                    (_,x)=>{

                        if(x===hole)
                            return null;

                        return{
                            color:"#697184",
                            type:"GARBAGE"
                        };
                    }
                );


            this.grid.push(row);
        }


        if(
            this.collides(
                this.current,
                0,
                0,
                this.current.matrix
            )
        ){

            this.current.y--;

            if(
                this.collides(
                    this.current,
                    0,
                    0,
                    this.current.matrix
                )
            ){

                this.alive=false;

                if(window.Game)
                    Game.playerDied(
                        this.index
                    );
            }
        }


        this.draw();
    }


    update(time){

        if(!this.alive)
            return;

        const delta=
            time-this.lastTime;

        this.lastTime=time;

        this.dropCounter+=delta;


        if(
            this.dropCounter>
            this.dropInterval
        ){

            this.softDrop();

            this.dropCounter=0;
        }
    }


    drawCell(
        x,
        y,
        color
    ){

        const s=this.cell;

        const px=x*s;
        const py=y*s;


        const gap=
            Math.max(
                2,
                s*.12
            );


        const imageSize=
            s-gap*2;


        this.ctx.save();


        /*
            图片原样绘制
        */

        if(
            BLOCK_IMAGE.complete &&
            BLOCK_IMAGE.naturalWidth>0
        ){

            this.ctx.drawImage(
                BLOCK_IMAGE,
                px+gap,
                py+gap,
                imageSize,
                imageSize
            );

        }else{

            this.ctx.fillStyle=
                "#555";

            this.ctx.fillRect(
                px+gap,
                py+gap,
                imageSize,
                imageSize
            );
        }


        /*
            只有外围描边有颜色
        */

        this.ctx.strokeStyle=
            color;

        this.ctx.lineWidth=
            Math.max(
                1.4,
                s*.08
            );

        this.ctx.shadowColor=
            color;

        this.ctx.shadowBlur=
            Math.max(
                3,
                s*.22
            );


        this.ctx.strokeRect(
            px+1.5,
            py+1.5,
            s-3,
            s-3
        );


        this.ctx.restore();
    }


    draw(){

        const ctx=this.ctx;

        ctx.clearRect(
            0,
            0,
            this.canvas.width,
            this.canvas.height
        );


        /* 网格 */

        ctx.strokeStyle=
            "rgba(255,255,255,.035)";

        ctx.lineWidth=1;


        for(
            let x=0;
            x<=COLS;
            x++
        ){

            ctx.beginPath();

            ctx.moveTo(
                x*this.cell+.5,
                0
            );

            ctx.lineTo(
                x*this.cell+.5,
                this.canvas.height
            );

            ctx.stroke();
        }


        for(
            let y=0;
            y<=ROWS;
            y++
        ){

            ctx.beginPath();

            ctx.moveTo(
                0,
                y*this.cell+.5
            );

            ctx.lineTo(
                this.canvas.width,
                y*this.cell+.5
            );

            ctx.stroke();
        }


        /* 已落方块 */

        for(
            let y=0;
            y<ROWS;
            y++
        ){

            for(
                let x=0;
                x<COLS;
                x++
            ){

                const block=
                    this.grid[y][x];

                if(block){

                    this.drawCell(
                        x,
                        y,
                        block.color
                    );
                }
            }
        }


        /* 当前方块 */

        if(this.current){

            const p=
                this.current;


            for(
                let y=0;
                y<p.matrix.length;
                y++
            ){

                for(
                    let x=0;
                    x<p.matrix[y].length;
                    x++
                ){

                    if(!p.matrix[y][x])
                        continue;


                    const px=p.x+x;
                    const py=p.y+y;


                    if(py>=0){

                        this.drawCell(
                            px,
                            py,
                            p.color
                        );
                    }
                }
            }
        }
    }
}
