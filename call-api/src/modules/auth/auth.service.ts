import { Injectable, UnprocessableEntityException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string, name: string): Promise<any> {
    const user = await this.userService.findFirst({ email });

    if (user) {
      const match = await bcrypt.compare(pass, user.password);

      if (match) {
        return user;
      }
    } else {
      const { user } = await this.register({ email, name, password: pass });
      return user;
    }
    return null;
  }

  async validateUserJwt(id: number): Promise<any> {
    const user = await this.userService.findOne(id);

    if (user) {
      const { ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { email: user.email, id: user.id };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  async register(data: any) {
    const payload: { email: 'string'; id?: number } = { email: data.email };

    if (await this.userService.findFirst({ email: payload.email })) {
      throw new UnprocessableEntityException({
        message: 'Email already taken',
      });
    }

    const user = await this.userService.create(data);

    payload.id = user.id;

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
