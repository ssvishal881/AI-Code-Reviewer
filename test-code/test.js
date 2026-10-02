const password = "12345";

function login(user) {
  if (user.password == password) {
    console.log("Login successful");
  }
}

login({});
