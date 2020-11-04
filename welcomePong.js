const canvas = document.getElementById("pong");

const context = canvas.getContext("2d");

context.fillStyle = "black";

context.fillRect(100, 200, 500, 75, 50);

context.fillStyle = "red";
context.beginPath();
context.arc(300, 350, 100, 0, Math.PI * 2, false);

context.closePath();
context.fill();


function drawRect(x, y, w, h, color){
    context.fillStyle = color;
    context.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color){
    context.fillStyle = color;
    context.beginPath();
    context.arc(x, y, r, 0, Math.PI*2, false);
    context.closePath();
    context.fill();
}
function drawText(text, x, y, color){
    context.fillStyle = color;
    context.font = "75px fantasy";
    context.fillText(text, x, y);
}

let rectX = 0;

function render(){
    drawRect(0, 800, 600, "black");
    drawRect(rectX, 100, 100, 100);
}