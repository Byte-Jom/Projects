function ranNumGen(max) {
	return Math.floor(Math.random() * max) + 1;
}

if (window.performance.navigation.type === 1) {
	var ranNum1 = ranNumGen(6);
	document
		.querySelector(".img1")
		.setAttribute("src", "images/dice" + ranNum1 + ".png");

	var ranNum2 = ranNumGen(6);
	document
		.querySelector(".img2")
		.setAttribute("src", "images/dice" + ranNum2 + ".png");

	if (ranNum1 > ranNum2) {
		document.querySelector("h1").textContent = "🎉P1 Wins!";
	} else if (ranNum1 < ranNum2) {
		document.querySelector("h1").textContent = "P2 Wins!🎉";
	} else {
		document.querySelector("h1").textContent = "Draw!";
	}
}
