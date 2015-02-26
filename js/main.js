window.onload = function() 
{
    "use strict";
    
    var game = new Phaser.Game( 640, 480, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update } );
    game.antialias = false;

    // create a list to store our game entities
    var ents = [];

    var screen_shake = 0;
    var obj_player;

    // variables used to store keypresses
    var upKey, downKey, leftKey, rightKey;


    var snd_splat,snd_ping,snd_no;

    //Define some useful functions

    function array2d(xsize,ysize,val)
    {
        var array = [];
        for(var i = 0; i<xsize; i++)
        {
            array[i] = [];
        }

        for (var x=0; x<xsize; x++)
            for(var y=0; y<ysize; y++)
                array[x][y] = val;

        return array;
    }

    function clamp(val,min,max)
    {
        if (val<min)
            return min;
        if (val>max)
            return max;
        return val;
    }

    function randomInt(max)
    {
        var i = Math.random()*(max+1)
        return ~~(i);
    }

    function choose(choices)
    {
        var index = ~~(Math.random()*choices.length);
        return choices[index];
    }

    function degstorads(degs) 
    //Given Degrees, Return Radians
    {
        return degs * (Math.PI/180);
    }

    function lengthdir_x(len,dir)
    //given a length and an angle (in Degrees), return the horizontal (x) component of 
    //the vector of the angle and direction
    {
        return len * Math.cos(degstorads(dir));
    }

    function lengthdir_y(len,dir)
    // Performs the same function as lengthdir_x, but returns the vertical component
    {
        return len * Math.sin(degstorads(dir));
    }

    function point_distance(x1,y1,x2,y2) 
    // Returns the distance between two points
    // will be used to perform circle collisions
    {
        var xdif = x1-x2;
        var ydif = y1-y2;
        return Math.sqrt(xdif*xdif+ydif*ydif);
    }

    function point_direction(x1,y1,x2,y2)
    // return as a degree the angle between two points
    {
        var xdif = x2 - x1;
        var ydif = y2 - y1;

        return Math.atan2(ydif,xdif)*180 / Math.PI;
    }

    var SEED;
    function rand()
    // random number generator for javascript that I found on stackoverflow,
    // because you apparently can't seed javascripts built in rng
    // found here: http://stackoverflow.com/questions/521295/javascript-random-seeds
    {
        var rand = Math.sin(++SEED)*10000;
        return rand - Math.floor(rand);
    }

    function szudzkik(x,y)
    // pairing function
    {
        if (x<y)
            return y*y+x;
        else
            return x*x+x+y;
    }

    function createImage(x,y,spr)
    {
        var i = game.add.image(x,y,spr);
        i.anchor.setTo(0.5,0.5);
        i.scale.setTo(2,2);

        return i;
    }

    function entityCreate(ent)
    //adds an entity to the entity list 
    {
        ents.push(ent);
    }

    function entityDestroy(i)
    // destroys the entities Phaser image and removes it from the entity list
    {
        ents[i].destroy();
        ents[i].ph.destroy();
        ents.splice(i,1);
    }

    function entity(x,y,sprite)
    {
        this.x = x;
        this.y = y;
        this.sprite = sprite;
        this.radius = 8;
        this.alive = true;
        this.visible = true;

        this.ph = game.add.image(this.x,this.y,this.sprite);
        this.ph.anchor.setTo(0.5);
        this.ph.scale.setTo(2,2);

        this.step = function(){}

        this.destroy = function(){}

        this.draw = function()
        {
            this.ph.x = this.x;
            this.ph.y = this.y;
        }
    }

    function organ(x,y)
    {
        var parent = new entity(x,y,'organs')
        for (var i in parent)
            this[i] = parent[i];

        this.org = choose([0,1,2,3,4,5]);
        this.ph.frame = this.org;
        this.ph.scale.setTo(1.25);
        
        this.ytarget = 16+Math.random()*380;
        this.y = this.ytarget - 1000;
        this.yspeed = 0;

        this.shadow = createImage(this.x,this.ytarget,'organs');
        this.shadow.frame = this.org;
        this.shadow.scale.setTo(1/1000);
        this.shadow.tint = 0x000000;
        this.ph.bringToTop();

        
        this.step = function()
        {
            
            this.y+=this.yspeed;

            if (this.y<this.ytarget)
            {
                this.yspeed+=0.01;
                this.ph.angle -=6;
            }
            else
            {
                this.y = this.ytarget;
                this.alive = false;
                screen_shake+=8;
                var splat = createImage(this.x,this.y,'splat');
                splat.angle = Math.random()*360;
                splat.scale.setTo(0.25+Math.random()*3);

                floor.draw(splat)

                snd_splat.play();

                splat.destroy();
            }

            this.shadow.scale.setTo(1.25*((1000-(this.ytarget - this.y))/1000));
            this.shadow.angle = this.ph.angle;
        }

        this.destroy = function()
        {
            this.shadow.destroy();
            organCount--;
        }
    }

    function player(x,y)
    {
        var parent = new entity(x,y,'guy');
        for (var i in parent)
            this[i] = parent[i];

        this.frame = 0;
        this.lastx = this.x;
        this.lasty = this.y;

        this.xdif = 0;
        this.ydif = 0;
        this.speed = 3;

        this.guys = [
            createImage(this.x-96,this.y-30,'nurses'),
            createImage(this.x+96,this.y-30,'nurses'),
            createImage(this.x-96,this.y+12,'nurses'),
            createImage(this.x+96,this.y+12,'nurses'),
        ];


        this.step = function()
        {

            this.lastx = this.x;
            this.lasty = this.y;

            if (leftKey.isDown)
            {
                this.x-=this.speed;
            }

            if (rightKey.isDown)
            {
                this.x+=this.speed;
            }

            if (downKey.isDown)
            {
                this.y+=this.speed;
            }

            if (upKey.isDown)
            {
                this.y-=this.speed;
            }

            this.xdif = this.x - this.lastx;
            this.ydif = this.y - this.lasty;

            if (this.frame<2)
                    this.frame+=0.1;
                else
                    this.frame=0;

            for (var i = 0; i<4; i++)
            {
                this.guys[i].frame = ~~(this.frame);
            }

            for (var i in ents)
            {
                if (ents[i].alive && ents[i] instanceof organ)
                    if (point_distance(this.x,this.y,ents[i].x,ents[i].y)<32)
                        if ((ents[i].ytarget - ents[i].y)<8 )
                            if (ents[i].org === targetOrgan)
                            {
                                ents[i].alive = false;
                                snd_ping.play();
                                targetOrgan = choose([0,1,2,3,4,5]);
                                text.setText("GET THIS MAN "+organs[targetOrgan]+"!");
                            }
                            else
                            {
                                ents[i].alive = false;
                                snd_no.play();
                                screen_shake+=16;
                            }


            }
        }

        this.draw = function()
        {
            this.ph.x = this.x;
            this.ph.y = this.y;

            for (var i=0; i<4;i++)
            {
                this.guys[i].x+=this.xdif;
                this.guys[i].y+=this.ydif;
            }
        }

        this.destroy = function()
        {
            for (var i =0; i<4; i++)
            {
                this.guys[i].destroy();
            }
        }

    }

    function preload() 
    {
        game.load.image('doctor','assets/doctor.png');
        game.load.image('guy','assets/guy.png');
        game.load.image('splat','assets/splat.png');
        game.load.image('textbox','assets/textbox.png');

        game.load.spritesheet('nurses','assets/nurses.png',32,32);
        game.load.spritesheet('organs','assets/organs.png',32,32);


        game.load.audio('snd_splat','assets/splat.ogg',true);
        game.load.audio('snd_no','assets/no.ogg',true);
        game.load.audio('snd_ping','assets/ping.ogg',true);

    }

    var text;
    var organs = ["A HEART","A LUNG","A KIDNEY","AN INTESTINE","SOME SPAGHETTI","SOME POOP"];
    var targetOrgan = 0;
    var organCount = 0;
    var floor;
    function create() 
    {
        game.stage.backgroundColor = '#222222';
        floor = game.add.bitmapData(640,480);
        floor.smoothed = false;
        floor.addToWorld();
        game.world.setBounds(-300,-300,940,780);
        game.camera.x = 0;
        game.camera.y = 0;
    
         // assign keys to our input variables
        upKey = game.input.keyboard.addKey(Phaser.Keyboard.UP);
        downKey = game.input.keyboard.addKey(Phaser.Keyboard.DOWN);
        leftKey = game.input.keyboard.addKey(Phaser.Keyboard.LEFT);
        rightKey = game.input.keyboard.addKey(Phaser.Keyboard.RIGHT);
        
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.UP);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.DOWN);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.LEFT);
        game.input.keyboard.addKeyCapture(Phaser.Keyboard.RIGHT);


        //sounds
        snd_splat  = game.add.audio('snd_splat');
        snd_splat.allowMultiple = true;

        snd_ping  = game.add.audio('snd_ping');
        snd_ping.allowMultiple = true;

        snd_no  = game.add.audio('snd_no');
        snd_no.allowMultiple = true;

        //doctor
        var doc = game.add.image(640,480,'doctor');
        doc.anchor.setTo(1,1);
        doc.scale.setTo(2);
        doc.bringToTop();
        
        //textbox
        var txtbox = game.add.image(0,480,'textbox');
        txtbox.anchor.setTo(0,1);
        txtbox.scale.setTo(1,2); 
        txtbox.bringToTop();

        //text
        text = game.add.text(16,470,"", {
            font: "32px Courier New",
            fill: "#ffffff",
            align: "left"
        });
        text.anchor.setTo(0,1);

        entityCreate(new player(320,200) );
        targetOrgan = 0;
        text.setText("GET THIS MAN "+organs[targetOrgan]+"!");
    }
    
    var time = 0;
    function update() 
    {   

        if (time<1000)
        {   
            time++;
        }
        else
        {
            time = 0;
            targetOrgan = choose([0,1,2,3,4,5]);
            text.setText("GET THIS MAN "+organs[targetOrgan]+"!");
        }

        if (Math.random()<0.1 && organCount<10)
        {
            entityCreate(new organ(Math.random()*640,0));
            organCount++;
        }

        var i = ents.length;
        while (i--)
        {
            ents[i].step();

            if (ents[i].alive === false)
                entityDestroy(i);
        }

        if (screen_shake>64)
            screen_shake = 64;

        game.camera.x = Math.random()*screen_shake - screen_shake/2;
        game.camera.y = Math.random()*screen_shake - screen_shake/2;

        if (screen_shake>0)
            screen_shake--;
        else
            screen_shake = 0;

        i = ents.length;
        while (i--)
        {
            if (ents[i].visible)
                ents[i].draw();
        }

    }
}