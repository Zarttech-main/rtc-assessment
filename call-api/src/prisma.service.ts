import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
    this.$use(async (params, next) => {
      if (
        params.model === 'User' &&
        ['update', 'create'].includes(params.action)
      ) {
        if (params.args.data?.password) {
          const salt = await bcrypt.genSalt();
          const hash = await bcrypt.hash(params.args.data.password, salt);

          params.args.data.password = hash;

          return next(params);
        }
      } else {
        return next(params);
      }
    });
  }
}
