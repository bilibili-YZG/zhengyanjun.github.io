/* =====================================================
   TETRIS 核心
===================================================== */

const COLS=10;
const ROWS=20;


/* =====================================================
   图片

   注意：
   index.html 位于 /play/tetris/
   所以这里必须是 ./assets/zyj.png
===================================================== */

const BLOCK_IMAGE=
    new Image();

BLOCK_IMAGE.src=
    "./assets/zyj.png";


/* =====================================================
   方块颜色
===================================================== */

const PIECE_COLORS=[

    "#00eaff",
    "#ffd43b",
    "#c75cff",
    "#40ff91",
    "#ff4770",
    "#ff8a35",
    "#4d7dff"

];


/* =====================================================
   7种标准俄罗斯方块

   I = 四个格子！！！

   横：
   ████

   竖：
   █
   █
   █
   █
===================================================== */

const SHAPES={

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


/* =====================================================
   Board
===================================================== */

class TetrisBoard{

    constructor(canvas,index){

        this.canvas=canvas;

        this.ctx=
            canvas.getContext("2d");

        this.index=index;

        this.grid=
            this.makeGrid();

        this.current=null;

        this.next=null;

        this.score=0;

        this.lines=0;

        this.combo=0;

        this.energy=0;

        this.alive=true;

        this.dropCounter=0;

        this.dropInterval=720;

        this.lastTime=
            performance.now();

        this.flashCells=[];

        this.resize();

        /*
         * 第一块与下一块
         * 使用真正的7种方块
         */

        this.next=
            this.randomPiece();

        this.spawn();
    }


    makeGrid(){

        return Array.from(
            {length:ROWS},
            ()=>Array(COLS).fill(null)
        );
    }


    resize(){

        const count=
            window.Game
                ? Game.count
                : 2;


        let boardWidth;

        if(count===1)
            boardWidth=330;

        else if(count===2)
            boardWidth=270;

        else if(count===3)
            boardWidth=215;

        else
            boardWidth=180;


        const maxHeight=
            Math.max(
                280,
                window.innerHeight*.61
            );


        this.cell=
            Math.max(
                10,
                Math.floor(
                    Math.min(
                        boardWidth/COLS,
                        maxHeight/ROWS
                    )
                )
            );


        this.canvas.width=
            COLS*this.cell;

        this.canvas.height=
            ROWS*this.cell;


        this.draw();
    }


    randomPiece(){

        /*
         * 七袋系统
         *
         * 防止某种方块长时间不出现
         *
         * 并且 I 方块确实存在
         */

        if(!this._bag ||
           this._bag.length===0){

            this._bag=
                [
                    "I",
                    "O",
                    "T",
                    "S",
                    "Z",
                    "J",
                    "L"
                ];

            for(
                let i=this._bag.length-1;
                i>0;
                i--
            ){

                const j=
                    Math.floor(
                        Math.random()*(i+1)
                    );

                [
                    this._bag[i],
                    this._bag[j]
                ]=[
                    this._bag[j],
                    this._bag[i]
                ];
            }
        }


        const type=
            this._bag.pop();


        /*
         * 第一方向永远使用定义的第0个
         */

        const matrix=
            SHAPES[type][0]
                .map(
                    row=>row.slice()
                );


        return{

            type:type,

            rotation:0,

            matrix:matrix,

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

        /*
         * next -> current
         */

        this.current=
            this.next ||
            this.randomPiece();


        /*
         * 预先准备下一块
         */

        this.next=
            this.randomPiece();


        /*
         * 居中
         */

        this.current.x=
            Math.floor(
                (COLS-
                 this.current.matrix[0].length)
                /2
            );

        this.current.y=-1;


        /*
         * 出生检测
         */

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


        this.draw();
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
                ){

                    return true;
                }


                if(
                    ny>=0 &&
                    this.grid[ny][nx]
                ){

                    return true;
                }
            }
        }

        return false;
    }


    move(dx){

        if(!this.alive)
            return false;


        if(
            !this.collides(
                this.current,
                dx,
                0,
                this.current.matrix
            )
        ){

            this.current.x+=dx;

            SoundFX.move();

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

            this.score+=1;

        }else{

            this.lock();
        }


        this.dropCounter=0;

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


        SoundFX.drop();


        this.lock();

        this.draw();
    }


    rotate(){

        if(!this.alive)
            return false;


        const rotations=
            SHAPES[
                this.current.type
            ];


        const nextRotation=
            (
                this.current.rotation+1
            )%rotations.length;


        const matrix=
            rotations[
                nextRotation
            ];


        /*
         * 简单墙踢
         */

        const kicks=[
            0,
            -1,
            1,
            -2,
            2
        ];


        for(
            const kick of kicks
        ){

            if(
                !this.collides(
                    this.current,
                    kick,
                    0,
                    matrix
                )
            ){

                this.current.rotation=
                    nextRotation;

                this.current.matrix=
                    matrix.map(
                        row=>row.slice()
                    );

                this.current.x+=
                    kick;


                SoundFX.rotate();

                this.draw();

                return true;
            }
        }


        return false;
    }


    lock(){

        const p=
            this.current;


        /*
         * 放进棋盘
         */

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


                const gx=
                    p.x+x;

                const gy=
                    p.y+y;


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


        /*
         * 落地冲击
         */

        if(window.Game)
            Game.landEffect(
                this.index
            );


        /*
         * 检查消行
         */

        const cleared=
            this.clearLines();


        if(cleared>0){

            this.lines+=cleared;

            this.combo+=1;


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


            /*
             * 能量
             */

            this.energy=
                Math.min(
                    100,
                    this.energy+
                    cleared*18+
                    Math.max(
                        0,
                        this.combo-1
                    )*5
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


        /*
         * 继续生成
         */

        this.spawn();
    }


    clearLines(){

        let count=0;


        for(
            let y=ROWS-1;
            y>=0;
            y--
        ){

            let full=true;


            for(
                let x=0;
                x<COLS;
                x++
            ){

                if(
                    !this.grid[y][x]
                ){

                    full=false;

                    break;
                }
            }


            if(full){

                /*
                 * 特效记录
                 */

                this.flashCells.push(
                    y
                );


                this.grid.splice(
                    y,
                    1
                );


                this.grid.unshift(
                    Array(COLS)
                        .fill(null)
                );


                count++;

                y++;
            }
        }


        return count;
    }


    addGarbage(amount){

        if(!this.alive)
            return;


        amount=
            Math.max(
                0,
                Math.min(
                    amount,
                    8
                )
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
                            color:"#68738a",
                            type:"GARBAGE"
                        };
                    }
                );


            this.grid.push(row);
        }


        /*
         * 如果当前方块被顶住
         */

        while(
            this.collides(
                this.current,
                0,
                0,
                this.current.matrix
            ) &&
            this.current.y>-5
        ){

            this.current.y--;
        }


        /*
         * 仍然无法放置
         * K.O.
         */

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


        this.draw();
    }


    clearBottomRows(amount){

        amount=
            Math.max(
                1,
                Math.min(
                    amount,
                    4
                )
            );


        this.grid.splice(
            ROWS-amount,
            amount
        );


        for(
            let i=0;
            i<amount;
            i++
        ){

            this.grid.unshift(
                Array(COLS)
                    .fill(null)
            );
        }


        this.draw();
    }


    update(time){

        if(!this.alive)
            return;


        const delta=
            time-this.lastTime;


        this.lastTime=time;


        this.dropCounter+=
            delta;


        if(
            this.dropCounter>
            this.dropInterval
        ){

            this.softDrop();
        }


        /*
         * 高度危险
         */

        if(window.Game){

            let danger=false;


            for(
                let y=0;
                y<5;
                y++
            ){

                if(
                    this.grid[y]
                    .some(
                        x=>x!==null
                    )
                ){

                    danger=true;

                    break;
                }
            }


            Game.setDanger(
                this.index,
                danger
            );
        }
    }


    ghostY(){

        if(!this.current)
            return this.current.y;


        let y=
            this.current.y;


        while(
            !this.collides(
                this.current,
                0,
                y-this.current.y+1,
                this.current.matrix
            )
        ){

            y++;
        }


        return y;
    }


    drawCell(
        x,
        y,
        color,
        alpha=1,
        ghost=false
    ){

        const s=this.cell;

        const px=
            x*s;

        const py=
            y*s;


        const gap=
            Math.max(
                2,
                s*.1
            );


        const imageSize=
            s-gap*2;


        this.ctx.save();


        this.ctx.globalAlpha=
            alpha;


        /*
         * 图片原样
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
                "#666";

            this.ctx.fillRect(
                px+gap,
                py+gap,
                imageSize,
                imageSize
            );
        }


        /*
         * 只有外框染色
         */

        this.ctx.strokeStyle=
            color;

        this.ctx.lineWidth=
            ghost
                ? Math.max(1,s*.05)
                : Math.max(1.5,s*.075);


        this.ctx.shadowColor=
            color;

        this.ctx.shadowBlur=
            ghost
                ? 4
                : Math.max(3,s*.2);


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


        /*
         * 网格
         */

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


        /*
         * 垃圾行特殊背景
         */

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


        /*
         * 幽灵方块
         */

        if(
            this.current &&
            this.alive
        ){

            const gy=
                this.ghostY();


            for(
                let y=0;
                y<this.current.matrix.length;
                y++
            ){

                for(
                    let x=0;
                    x<this.current.matrix[y].length;
                    x++
                ){

                    if(
                        !this.current.matrix[y][x]
                    )
                        continue;


                    const px=
                        this.current.x+x;

                    const py=
                        gy+y;


                    if(py>=0){

                        this.drawCell(
                            px,
                            py,
                            this.current.color,
                            .22,
                            true
                        );
                    }
                }
            }


            /*
             * 当前方块
             */

            for(
                let y=0;
                y<this.current.matrix.length;
                y++
            ){

                for(
                    let x=0;
                    x<this.current.matrix[y].length;
                    x++
                ){

                    if(
                        !this.current.matrix[y][x]
                    )
                        continue;


                    const px=
                        this.current.x+x;

                    const py=
                        this.current.y+y;


                    if(py>=0){

                        this.drawCell(
                            px,
                            py,
                            this.current.color
                        );
                    }
                }
            }
        }


        /*
         * 清行闪光
         */

        if(this.flashCells.length){

            ctx.fillStyle=
                "rgba(255,255,255,.2)";


            this.flashCells.forEach(
                row=>{

                    if(row>=0){

                        ctx.fillRect(
                            0,
                            row*this.cell,
                            this.canvas.width,
                            this.cell
                        );
                    }
                }
            );


            this.flashCells=[];
        }
    }
}
