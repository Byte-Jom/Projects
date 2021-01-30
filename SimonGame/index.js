// ARRAYS
var buttonColors = [
		"rosy-brown",
		"light-coral",
		"light-steel-blue",
		"beige",
		"pale-violet-red",
		"powder-blue",
		"thistle",
		"light-salmon",
	],
	buttonSounds = [
		"sounds/blue.mp3",
		"sounds/green.mp3",
		"sounds/red.mp3",
		"sounds/yellow.mp3",
		"sounds/blue.mp3",
		"sounds/green.mp3",
		"sounds/red.mp3",
		"sounds/yellow.mp3",
	],
	keyboardAllowed = ["q", "w", "e", "a", "d", "z", "x", "c"],
	gamePattern = [],
	userClickedPattern = [];

// VARIABLES
var level = 0,
	showing = 1,
	clicks = 0,
	highscore = 0;

	setTimeout(function () {
		$("#level-title").html("Press S to Start");
		showing = 0;
	}, 2000);
	

// FUNCTIONS
function playSound(name) {
	var audio = new Audio(name);
	audio.play();
}

// show the entire gamePattern
function showSequence(arr) {
	//while showSequence is running, the player input is not read
	showing = 1;
	var i;
	for (i = 0; i < arr.length; i++) {
		let k = i;
		setTimeout(function () {
			$("." + arr[k])
				.fadeIn(100)
				.fadeOut(100)
				.fadeIn(100);
			playSound(buttonSounds[buttonColors.indexOf(arr[k])]); //plays sound of the current tile in the iteration
		}, 300 * (k + 1));
	}
	//player input is now read
	setTimeout(function () {
		showing = 0;
	}, 300 * (i + 1));
}

// called at the start of each level. decides what to be in the sequence
function nextSequence() {
	var randomNumber = Math.floor(Math.random() * 8),
		randomColor = buttonColors[randomNumber];

	gamePattern.push(randomColor);
	showSequence(gamePattern);

	$("#level-title").html("Level " + ++level);

	userClickedPattern = [];
	clicks = 0;
}

// animates the pressed button
function animatePress(currentColor) {
	$("#" + currentColor).addClass("pressed");
	setTimeout(function () {
		$("#" + currentColor).removeClass("pressed");
	}, 100);
}

// maps a letter to a class. input is key pressed
function letterToClass(key) {
	var neededId;
	switch (key) {
		case "q":
			neededId = "rosy-brown";
			break;

		case "w":
			neededId = "light-coral";
			break;

		case "e":
			neededId = "light-steel-blue";
			break;

		case "a":
			neededId = "beige";
			break;

		case "d":
			neededId = "pale-violet-red";
			break;

		case "z":
			neededId = "powder-blue";
			break;

		case "x":
			neededId = "thistle";
			break;

		case "c":
			neededId = "light-salmon";
			break;

		default:
			break;
	}
	return neededId;
}

function checkAnswer() {
	// game over
	if (gamePattern[clicks - 1] !== userClickedPattern[clicks - 1]) {
		showing = 1;
		var audio = new Audio("sounds/wrong.mp3");
		audio.play();
		$(".button").addClass("game-over");
		setTimeout(function () {
			$(".button").removeClass("game-over");
			$("#level-title").html("Game Over! You scored " + (level - 1) + "!");
		}, 200);
		userClickedPattern = [];
		gamePattern = [];
		clicks = 0;
		if (level - 1 > highscore) {
			highscore = level - 1;
		}
		setTimeout(function () {
			$("#level-title").html("Highscore: " + highscore);
		}, 2000);
		setTimeout(function () {
			$("#level-title").html("Press S to Start");
			level = 0;
			showing = 0;
		}, 4000);
		return false;
	}
	// next level
	if (clicks === level) {
		setTimeout(function () {
			nextSequence();
		}, 1000);
	}
	return true;
}

// EVENT LISTENER
$(".button").click(function () {
	// will not register mouseclicks if the game has not started
	if (level !== 0 && showing !== 1) {
		var userChosenColor = this.id;
		userClickedPattern.push(userChosenColor);
		var index = buttonColors.indexOf(userChosenColor);
		animatePress(userChosenColor);
		clicks++;
		if (checkAnswer()) {
			playSound(buttonSounds[index]);
		}

		console.log("click");
		console.log(this);
		console.log(this.id);
		console.log(userChosenColor);
		console.log(userClickedPattern);
	}
});

$(document).on("keydown", function (event) {
	// only start game if there is no on going game and "s" is pressed
	if (event.key === "s" && level === 0) {
		$("#level-title").html("Level " + level);
		nextSequence();
	} else if (level !== 0 && showing !== 1) {
		if (keyboardAllowed.includes(event.key)) {
			var userChosenColor = letterToClass(event.key);
			userClickedPattern.push(userChosenColor);
			var index = buttonColors.indexOf(userChosenColor);
			animatePress(userChosenColor);
			clicks++;
			if (checkAnswer()) {
				playSound(buttonSounds[index]);
			}
		}
		console.log("keydown");
		console.log(this);
		console.log(event.key);
	}
});
