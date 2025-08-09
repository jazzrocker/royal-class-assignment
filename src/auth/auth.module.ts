import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './auth.controller';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { UserDataService } from './services/user-data.service';
import { HttpAuthGuard } from 'src/common/guards/http-auth.guard';
import { User, UserSchema } from 'src/common/schemas/user.schema';
import { Auction, AuctionSchema } from 'src/common/schemas/auction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Auction.name, schema: AuctionSchema },
    ]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [LoginService, SignupService, UserDataService, HttpAuthGuard],
  exports: [LoginService, SignupService, UserDataService],
})
export class AuthModule {}
