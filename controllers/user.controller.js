const crypto = require("crypto");
const bcrypt = require("bcrypt");
const User = require("../models/user.model");
const { emailTemplates, sendEmail } = require("../config/email");

class UserController {
  async httpNewUser(req, res) {
    try {
      const { fullName, email, password, phone, nic, role } = req.body;

      const userExist = await User.findOne({
        $or: [{ email: email }, { nic: nic }],
      });

      if (userExist) {
        return res
          .status(400)
          .json({ success: false, message: "The user is already exists." });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      //   `http://localhost:8000/api/v1/email/verification/${crypto.randomBytes(16).toString("hex")}`;
      const tokenExpiresIn = Date.now() + 24 * 60 * 60 * 1000;

      const user = new User({
        fullName: fullName,
        email: email,
        password: password,
        phone: phone,
        nic: nic,
        role: "customer" || role,
        isEmailVerified: true,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: tokenExpiresIn,
      });

      const verificationURL = `${process.env.CLIENT_URL}/verify-email?token=${user.emailVerificationToken}`;

      const mail = emailTemplates.verification(user.fullName, verificationURL);
      const result = await sendEmail({
        to: user.email,
        subject: mail.subject,
        html: mail.html,
      });

      const token = await user.generateAuthToken();

      await user.save();
      return res.status(201).json({
        success: true,
        message: "User created ✅",
        data: user,
        secret: token,
        u: result,
        url: result.previewUrl,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpLogin(req, res) {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid email or/and password!" });
      }

      const passwordMatch = await user.comparePassword(password);
      // const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res
          .status(404)
          .json({ success: false, message: "Invalid email or/and password!" });
      }

      const isEmailVerified = user.isEmailVerified;

      const token = await user.generateAuthToken();

      return res
        .header("x-auth-token", token)
        .status(200)
        .json({
          success: true,
          message: "Login successfull ✅",
          emailStatus:
            isEmailVerified === false
              ? "Please verify your email ⚠"
              : "Verified ✅",
          data: user,
          secret: token,
        });
    } catch (error) {
      console.log(error);
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error.message}` });
    }
  }

  async httpGetMe(req, res) {
    try {
      const user = req.user;

      const me = await User.findById(user._id).select(
        "-emailVerificationToken -emailVerificationExpires",
      );
      if (!me) {
        return res
          .status(400)
          .json({ success: false, message: "Oops, Something went wrong!" });
      }

      return res
        .status(200)
        .json({ success: true, message: "User fetched ✅", data: me });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpUpdateUser(req, res) {
    try {
      const currentUser = req.user;
      const { fullName, email, password, phone, nic } = req.body;

      const user = await User.findById(currentUser._id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, something went wrong." });
      }

      if (fullName) {
        user.fullName = fullName;
      }

      if (email) {
        user.email = email;
      }

      if (phone) {
        user.phone = phone;
      }

      if (nic) {
        user.nic = nic;
      }

      const emailCheck = await User.findOne({ email: email });
      if (emailCheck) {
        return res
          .status(400)
          .json({ success: false, message: "This email is already taken!" });
      }

      await user.save();
      return res.status(200).json({
        success: true,
        message: "User profile updated ✅",
        data: user,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpChangePassword(req, res) {
    try {
      const currentUser = req.user;
      const { currentPassowrd, newPassword } = req.body;

      const user = await User.findById(currentUser._id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, something went wrong" });
      }

      const isMatch = await user.comparePassword(currentPassowrd);
      if (!isMatch) {
        return res
          .status(400)
          .json({ success: false, message: "Invalid passowrd!" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      await user.save();
      return res
        .status(200)
        .json({ success: true, message: "Password changed successfull ✅" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpVerifyEmail(req, res) {
    try {
      const verificationToken = req.params.token;

      const user = await User.findOne({
        emailVerificationToken: verificationToken,
        isEmailVerified: false,
      });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "Invalid or expired verfication link.",
        });
      }

      if (user.emailVerificationExpires < Date.now()) {
        return res.status(400).json({
          success: false,
          message:
            "Your verification URL is expired, Please requeset a new one!",
        });
      }

      user.isEmailVerified = true;
      user.emailVerificationToken = null;
      user.emailVerificationExpires = null;

      await user.save();

      return res
        .status(200)
        .json({ success: true, message: "Email is verified ✅" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpRequestNewLink(req, res) {
    try {
      const currentUser = req.user;

      const user = await User.findOne({
        _id: currentUser._id,
        email: currentUser.email,
        isEmailVerified: false,
      });

      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, something went wrong!" });
      }

      const verificationToken = crypto.randomBytes(32).toString("hex");
      const newExpireDate = Date.now() + 24 * 60 * 60 * 1000;

      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpires = newExpireDate;

      const verificationURL = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;

      const email = emailTemplates.verification(
        user.fullName,
        verificationToken,
      );
      const result = await sendEmail({
        to: user.email,
        subject: email.subject,
        html: email.html,
      });

      await user.save();

      return res.status(200).json({
        success: true,
        data: result,
        url: result.previewUrl,
        message: `We have sent new verification link an email of yours ${user.email}, Please verify it.`,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpForgotPassword(req, res) {
    try {
      const currentUser = req.user;

      const user = await User.findOne({
        _id: currentUser._id,
        email: currentUser.email,
      });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, somethig went wrong!" });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      const expiresIn = Date.now() + 3600000; // 1 hour

      user.passwordResetToken = resetToken;
      user.passwordResetExpires = expiresIn;

      await user.save();

      const resetURL = `http://localhost:8000/api/v1/auth/forgot/password/${resetToken}`;

      return res.status(200).json({
        success: true,
        message: "We have sent an email to you for password reset",
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }

  async httpResetPassword(req, res) {
    try {
      const currentUser = req.user;
      const resetToken = req.params.token;
      const { newPassowrd } = req.body;

      const user = await User.findOne({
        _id: currentUser._id,
        passwordResetToken: resetToken,
      });
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "Oops, something went wrong!" });
      }

      if (user.passwordResetExpires < Date.now()) {
        return res.status(400).json({
          success: false,
          message: "Password reset link has expired!",
        });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.passwordResetToken = null;
      user.passwordResetExpires = null;

      await user.save();

      return res
        .status(200)
        .json({ success: true, message: "Password changed successfull ✅" });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: `SERVER ERROR: ${error}` });
    }
  }
}

const userController = new UserController();
module.exports = userController;
