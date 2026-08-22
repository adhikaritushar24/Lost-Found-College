export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);

export const isValidPassword = (password) => password && password.length >= 6;

export const isValidOTP = (otp) => /^\d{6}$/.test(otp);
