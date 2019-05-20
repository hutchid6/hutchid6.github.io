var scoreBoard = document.getElementById("score"),
    startButton = document.getElementById("startButton"),
    canvas = document.getElementById("game"),
    ctx = canvas.getContext("2d");

var boulderCount = 15,
    boulders = [],
    fallInterval = null,
    score = 0;

var player = {
  body: [
    new Rectangle(0, 0, 30, 10),
    new Rectangle(0, 0, 10, 30),
    new Rectangle(20, 0, 10, 30),
    new Rectangle(0, 20, 30, 10),
    new Rectangle(10, 30, 10, 10),
    new Rectangle(0, 40, 30, 10),
    new Rectangle(0, 50, 10, 10),
    new Rectangle(20, 50, 10, 10)
  ],
  hitbox: new Rectangle((canvas.width - 30) / 2, canvas.height - 60, 30, 60),
  color: "red",
  draw: function()
  {
    for (var i = 0; i < this.body.length; i++)
    {
      this.body[i].draw(ctx, this.color, this.hitbox);
    }
  },
  erase: function()
  {
    clearRect(ctx, this.hitbox);
  },
  moveLeft: function()
  {
    this.erase();
    this.hitbox.x -= 10;
    if (this.hitbox.x < 0)
      this.hitbox.x = 0;
    this.draw();
  },
  moveRight: function()
  {
    this.erase();
    this.hitbox.x += 10;
    if (this.hitbox.x > canvas.width - this.hitbox.width)
      this.hitbox.x = canvas.width - this.hitbox.width;
    this.draw();
  }
};

Boulder = function(color)
{
  var x = Math.floor(Math.random() * 49) * 10;
  var y = 0;
  this.hitbox = new Rectangle(x, y, 10, 10);
  this.color = color;

  this.draw = function()
  {
    this.hitbox.draw(ctx, this.color);
  }

  this.erase = function()
  {
    clearRect(ctx, this.hitbox);
  }
}

function updateScore()
{
  score++;
  scoreBoard.innerHTML = "Score: " + score;
}

function checkHit()
{
  for (var i = 0; i < boulders.length; i++)
  {
    if (boulders[i].hitbox.intersects(player.hitbox))
    {
      // Gameover
      clearInterval(fallInterval);
      alert("Game Over! Your Score: " + score);
      document.location.reload();
    }
  }
}

function fall()
{
  checkHit();

  for (var i = 0; i < boulders.length; i++)
  {
    var boulder = boulders[i];
    boulder.erase();
    boulder.hitbox.y += 10;

    if (boulder.hitbox.y >= canvas.height)
    {
      updateScore();
      boulders[i] = new Boulder("brown");
    }

    boulder.draw();
  }
}

function start()
{
  startButton.onclick = null;

  var k = 0;
  var boulderInterval = setInterval(function() {
    if (k == boulderCount)
    {
      clearInterval(boulderInterval);
    }
    else
    {
      boulders[k] = new Boulder("brown");
      k++;
    }
  }, 900);

  fallInterval = setInterval(fall, 40);
}

document.body.onload = function()
{
  player.draw();
  document.body.onkeydown = function(e) {
    var keyCode = e.which || e.keyCode;
    if (keyCode == 37) player.moveLeft();
    else if (keyCode == 39) player.moveRight();
  };

  startButton.onclick = start;
};
