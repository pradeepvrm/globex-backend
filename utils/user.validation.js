export function validateUsername(value) {
  const username = typeof value === "string" ? value.trim() : "";
  let error = null;

  if (!username) {
    error = "Username is required";
  } else if (username.length < 3 || username.length > 40) {
    error = "Username must be between 3 and 40 characters";
  } else if (/\s/u.test(username)) {
    error = "Username cannot contain whitespace";
  }

  return { value: username, error };
}

export function validateEmail(value) {
  const email = typeof value === "string" ? value.trim().toLowerCase() : "";
  let error = null;

  if (!email) {
    error = "Email is required";
  } else if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    error = "A valid email address is required";
  }

  return { value: email, error };
}

export function validatePassword(value) {
  const password = typeof value === "string" ? value : "";
  let error = null;

  if (!password.trim()) {
    error = "Password is required";
  } else if (password.length < 5) {
    error = "Password must be at least 8 characters";
  }

  return { value: password, error };
}
