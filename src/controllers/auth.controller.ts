import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import {
  createUser,
  getUserByEmail,
  getUserById,
} from "../services/user.service";
import { CustomRequest } from "../interfaces/user";

export const register = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, fullname } = req.body;

    if (!email || !password || !fullname) {
      return res.status(400).json({ message: "fields required" });
    }

    const checkUser = await getUserByEmail(email);

    if (checkUser) {
      return res.status(400).json({ message: "user already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await createUser({
      email,
      password: hashedPassword,
      fullname,
    });

    return res.status(201).send({ user, message: "user created" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "server error" });
  }
};

export const login = async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    const checkUser = await getUserByEmail(email).select("+password").lean();

    if (!checkUser) {
      return res.status(404).send({ message: "user not found" });
    }

    const isValid = await bcrypt.compare(password, checkUser.password);

    if (!isValid) {
      return res.status(400).send({ message: "invalid password" });
    }

    const payload = {
      _id: checkUser._id,
      email: checkUser.email,
      fullname: checkUser.fullname,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET as string, {
      expiresIn: "1m",
    });

    return res.status(200).send({ payload, token });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "server error" });
  }
};

export const getToken = async (req: CustomRequest, res: express.Response) => {
  try {
    const user = req.user!;

    const userDetail = await getUserById(user._id);

    if (!userDetail) {
      return res.status(400).send({ message: "user not found" });
    }

    return res.status(200).send(userDetail);
  } catch (error) {
    console.log(error);
    return res.status(500).send({ message: "server error" });
  }
};
