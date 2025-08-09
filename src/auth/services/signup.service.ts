import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import { RESPONSE_CONSTANTS } from "src/common/constants/response.constants";
import { ServiceError } from "src/common/errors/service.error";
import { User, UserDocument } from "src/common/schemas";
import * as bcrypt from 'bcrypt';

@Injectable()
export class SignupService {
    constructor(
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        private jwtService: JwtService
    ) {}

    async signup(
        name: string,
        username: string,
        email: string,
        password: string,
    ) {
        const existingUser = await this.userModel.findOne({
          $or: [{ username }, { email }],
        });
        if (existingUser) {
          throw new ServiceError(RESPONSE_CONSTANTS.USER_ALREADY_EXISTS);
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await this.userModel.create({
          name,
          username,
          email,
          password: hashedPassword,
        });
    
        const token = this.jwtService.sign({ userId: newUser._id });
    
        return {
          userData: {
            _id: newUser?._id,
            username: newUser.username,
            name: newUser.name,
            email: newUser.email,
          },
          token,
        };
      }
}