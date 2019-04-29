let SCREEN_WIDTH = window.innerWidth,
    SCREEN_HEIGHT = window.innerHeight,
    mousePos = {
        x: 400,
        y: 300
    },

    // create canvas
    canvas = document.createElement('canvas'),
    context = canvas.getContext('2d'),
    particles = [],
    rockets = [],
    MAX_PARTICLES = 500,
    colorCode = 0;
window.rockets = rockets
// init
$(document).ready(function() {
    document.getElementsByClassName('container')[0].appendChild(canvas);
    canvas.width = SCREEN_WIDTH;
    canvas.height = SCREEN_HEIGHT;
    canvas.id = 'firework-canvas';
    // setInterval(launch, 800);
    setInterval(loop, 1000 / 50);
});

const launchFrom = function ({x = 200, y = 0, colorText = 'blue', explosionSize = 10} = {}) {
    let colors = {
        'firebrick': 360,
        'blue': 220,
        'orange': 14,
        'green': 128
    }
    let color = colors[colorText]
    let rocket = new Rocket(x, y, explosionSize);
    rocket.explosionColor = color;
    rocket.vel.y = Math.random() * -3 - 4;
    rocket.vel.x = Math.random() * 6 - 3;
    rocket.size = 10;
    rocket.shrink = 0.999;
    rocket.gravity = 0.01;
    rockets.push(rocket);

}

window.launchFrom = launchFrom

function loop() {
    // update screen size
    if (SCREEN_WIDTH !== window.innerWidth) {
        canvas.width = SCREEN_WIDTH = window.innerWidth;
    }
    if (SCREEN_HEIGHT !== window.innerHeight) {
        canvas.height = SCREEN_HEIGHT = window.innerHeight;
    }

    // clear canvas
    context.fillStyle = "rgba(0, 0, 0, 0.05)";
    context.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    let existingRockets = [];

    for (let i = 0; i < rockets.length; i++) {
        // update and render
        rockets[i].update();
        rockets[i].render(context);

        // random chance of 1% if rockets is above the middle
        let randomChance = rockets[i].pos.y < (SCREEN_HEIGHT * .5) ? (Math.random() * 100 <= 1) : false;

        /* Explosion rules
                     - 80% of screen
                    - going down
                    - 1% chance of random explosion getRandomInt(9, 15)
                */
        if (rockets[i].pos.y < SCREEN_HEIGHT / getRandomInt(5, 15) || rockets[i].vel.y >= 0 || randomChance) {
            rockets[i].explode();
        } else {
            existingRockets.push(rockets[i]);
        }
    }

    rockets = existingRockets;

    let existingParticles = [];

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();

        // render and save particles that can be rendered
        if (particles[i].exists()) {
            particles[i].render(context);
            existingParticles.push(particles[i]);
        }
    }

    // update array with existing particles - old particles should be garbage collected
    particles = existingParticles;

    while (particles.length > MAX_PARTICLES) {
        particles.shift();
    }
}

function Particle(pos) {
    this.pos = {
        x: pos ? pos.x : 0,
        y: pos ? pos.y : 0
    };
    this.vel = {
        x: 0,
        y: 0
    };
    this.shrink = .97;
    this.size = 2;

    this.resistance = 1;
    this.gravity = 0;

    this.flick = false;

    this.alpha = 1;
    this.fade = 0;
    this.color = 0;
}

Particle.prototype.update = function() {
    // apply resistance
    this.vel.x *= this.resistance;
    this.vel.y *= this.resistance;

    // gravity down
    this.vel.y += this.gravity;

    // update position based on speed
    this.pos.x += this.vel.x;
    this.pos.y += this.vel.y;

    // shrink
    this.size *= this.shrink;

    // fade out
    this.alpha -= this.fade;
};

Particle.prototype.render = function(c) {
    if (!this.exists()) {
        return;
    }

    c.save();

    c.globalCompositeOperation = 'lighter';

    let x = this.pos.x,
        y = this.pos.y,
        r = this.size / 2;

    let gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
    gradient.addColorStop(0.1, "rgba(255,255,255," + this.alpha + ")");
    gradient.addColorStop(0.8, "hsla(" + this.color + ", 100%, 50%, " + this.alpha + ")");
    gradient.addColorStop(1, "hsla(" + this.color + ", 100%, 50%, 0.1)");

    c.fillStyle = gradient;

    c.beginPath();
    c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size : this.size, 0, Math.PI * 2, true);
    c.closePath();
    c.fill();

    c.restore();
};

Particle.prototype.exists = function() {
    return this.alpha >= 0.1 && this.size >= 1;
};

function Rocket(x, y = 0, explosionSize = 10) {
    Particle.apply(this, [{
        x: x,
        y: SCREEN_HEIGHT - y}]);

    this.explosionColor = 0;
    this.explosionSize = explosionSize
}

Rocket.prototype = new Particle();
Rocket.prototype.constructor = Rocket;

Rocket.prototype.explode = function() {
    let count = Math.random() * 10 + 80;

    for (let i = 0; i < count; i++) {
        let particle = new Particle(this.pos);
        let angle = Math.random() * Math.PI * 2;

        // emulate 3D effect by using cosine and put more particles in the middle
        let speed = Math.cos(Math.random() * Math.PI / 2) * 15;

        particle.vel.x = Math.cos(angle) * speed;
        particle.vel.y = Math.sin(angle) * speed;

        particle.size = 6;

        particle.gravity = 0.2;
        particle.resistance = 0.92 + (this.explosionSize / 1000);
        particle.shrink = Math.random() * 0.05 + 0.93;

        particle.flick = true;
        particle.color = this.explosionColor;

        particles.push(particle);
    }
};

Rocket.prototype.render = function(c) {
    if (!this.exists()) {
        return;
    }

    c.save();

    c.globalCompositeOperation = 'lighter';

    let x = this.pos.x,
        y = this.pos.y,
        r = this.size / 2;

    let gradient = c.createRadialGradient(x, y, 0.1, x, y, r);
    gradient.addColorStop(0.1, "rgba(255, 255, 255 ," + this.alpha + ")");
    gradient.addColorStop(1, "rgba(0, 0, 0, " + this.alpha + ")");

    c.fillStyle = gradient;

    c.beginPath();
    c.arc(this.pos.x, this.pos.y, this.flick ? Math.random() * this.size / 2 + this.size / 2 : this.size, 0, Math.PI * 2, true);
    c.closePath();
    c.fill();

    c.restore();
};

const getRandomInt = (min, max, _min = Math.ceil(min), _max = Math.floor(max) ) => Math.floor(Math.random() * (_max - _min)) + _min;
