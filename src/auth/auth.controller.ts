import { Controller, Post, Body, Get, UseGuards, Request, HttpCode } from '@nestjs/common';
import { LoginService } from './services/login.service';
import { SignupService } from './services/signup.service';
import { UserDataService } from './services/user-data.service';
import { HttpAuthGuard } from 'src/common/guards/http-auth.guard';
import { LoginDto, SignupDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly signupService: SignupService,
    private readonly userDataService: UserDataService,
  ) {}

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginDto: LoginDto) {
    return await this.loginService.login(loginDto.usernameOrEmail, loginDto.password);
  }

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    return await this.signupService.signup(
      signupDto.name,
      signupDto.username,
      signupDto.email,
      signupDto.password,
    );
  }

  @Get('getuserdata')
  @HttpCode(200)
  @UseGuards(HttpAuthGuard)
  async getUserData(@Request() req: any) {
    return await this.userDataService.getUserData(req.user.userId);
  }
}
