const express = require("express"),
	app = express(),
	https = require("https"),
	port = 3000;

// used to serve up static files such as CSS and images
// html will look up into this in a relative way
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
	res.sendFile(__dirname + "/signup.html");
});

app.post("/", (req, res) => {
	const firstName = req.body.firstName,
		lastName = req.body.lastName,
		emailAdd = req.body.emailAdd,
		// based on mailchimp API docs
		data = {
			members: [
				{
					email_address: emailAdd,
					status: "subscribed",
					merge_fields: {
						FNAME: firstName,
						LNAME: lastName,
					},
				},
			],
		};

	const jsonData = JSON.stringify(data),
		// based on https.request docs
		url = "https://us10.api.mailchimp.com/3.0/lists/7797f9a612",
		options = {
			method: "POST",
			auth: "techno:9691e29f234143b9392ebeebec3f9588-us10",
		};
	const request = https.request(url, options, (response) => {
		response.on("data", (data) => {
      const statusCode = response.statusCode,
            errorCount = JSON.parse(data).error_count;
			if (statusCode === 200 && !errorCount) {
				res.sendFile(__dirname + "/success.html");
			} else {
				res.sendFile(__dirname + "/failure.html");
			}
		});
	});
	// sends the data to mailchimp
	request.write(jsonData);
	request.end();
});

app.post("/failure", (req, res) => {
	//redirects back to home route
	res.redirect("/");
});

app.listen(port, () => {
	console.log("Server is running on port 3000.");
});
