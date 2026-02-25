import { Module } from '@nestjs/common';
import { UserListsController } from './user-lists.controller';

@Module({
  controllers: [UserListsController],
})
export class UserListsModule {}
