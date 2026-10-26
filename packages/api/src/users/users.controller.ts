import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  ForbiddenException,
  NotFoundException,
  Query,
  ParseBoolPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UserDto } from './dto/user.dto';
import { UserDeletionSummaryDto } from './dto/user-deletion-summary.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeUserRoleDto } from './dto/change-user-role.dto';
import { UserRole } from './entities/user.entity';
import {
  canChangeUserRole,
  canDeactivateUsers,
  canDeleteUsers,
  canFilterUsersByRole,
  canViewInactiveUser,
} from './users.policy';
import type { AuthUser } from '../auth/auth.types';

interface AuthRequest {
  user?: AuthUser;
  query?: Record<string, string | undefined>;
}

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(':identifier')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by UUID or username' })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'User found',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description:
      'User not found; an inactive user is reported the same way to everyone except ADMIN',
  })
  async getUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<UserDto> {
    if (!req.user) {
      throw new ForbiddenException('Unauthorized');
    }

    const user = await this.usersService.getUserByIdentifier(identifier);

    if (!user.isActive && !canViewInactiveUser(req.user)) {
      throw new NotFoundException('User not found');
    }

    return this.usersService.toUserDto(user, req.user);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all users (filtered by role)',
  })
  @ApiQuery({
    name: 'search',
    type: 'string',
    required: false,
    description: 'Search by name or username; ADMIN also searches by email',
  })
  @ApiQuery({
    name: 'role',
    enum: UserRole,
    required: false,
    description: 'Filter by role (ADMIN only)',
  })
  @ApiQuery({
    name: 'isActive',
    type: 'boolean',
    required: false,
    description: 'Filter by active status (ADMIN only)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of users',
    type: [UserDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getAllUsers(
    @Request() req: AuthRequest,
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query(
      'isActive',
      new ParseBoolPipe({ optional: true, errorHttpStatusCode: 422 }),
    )
    isActive?: boolean | string,
  ): Promise<UserDto[]> {
    if (!req.user) {
      throw new ForbiddenException('Unauthorized');
    }

    const actor = req.user;
    let roleFilter: UserRole | undefined;
    let isActiveFilter: boolean | undefined = true;

    if (canFilterUsersByRole(actor)) {
      roleFilter = role;
    }

    if (canViewInactiveUser(actor)) {
      isActiveFilter = typeof isActive === 'boolean' ? isActive : undefined;
    }

    const users = await this.usersService.getAllUsers(actor, {
      search,
      role: roleFilter,
      isActive: isActiveFilter,
    });

    return users.map((user) => this.usersService.toUserDto(user, actor));
  }

  @Patch(':identifier')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile (owner or ADMIN)' })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'User updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Not allowed to edit this user',
  })
  @ApiResponse({
    status: 404,
    description:
      'User not found; an inactive user is reported the same way to everyone except ADMIN',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot edit guest account',
  })
  @ApiResponse({
    status: 422,
    description:
      'Invalid body (including any role or other non-editable field), invalid resulting profile, or taken username/email',
  })
  async updateUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserDto> {
    if (!req.user) {
      throw new ForbiddenException('Unauthorized');
    }

    const user = await this.usersService.updateUser(identifier, dto, req.user);
    return this.usersService.toUserDto(user, req.user);
  }

  @Patch(':identifier/deactivate')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user (admin only)' })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'User deactivated',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot deactivate self',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
  })
  async deactivateUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<UserDto> {
    if (!req.user || !canDeactivateUsers(req.user)) {
      throw new ForbiddenException('Admin access required');
    }

    const user = await this.usersService.deactivateUser(identifier, req.user);
    return this.usersService.toUserDto(user, req.user);
  }

  @Get(':identifier/deletion-summary')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get counts of user list entries to be deleted (admin only)',
  })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'Deletion summary',
    type: UserDeletionSummaryDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete self or guest account',
  })
  async getDeletionSummary(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<UserDeletionSummaryDto> {
    if (!req.user || !canDeleteUsers(req.user)) {
      throw new ForbiddenException('Admin access required');
    }

    return this.usersService.getDeletionSummary(identifier, req.user);
  }

  @Delete(':identifier')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete user and all related user-entities (admin only)',
  })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'User deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot delete self or guest account',
  })
  async deleteUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<void> {
    if (!req.user || !canDeleteUsers(req.user)) {
      throw new ForbiddenException('Admin access required');
    }

    await this.usersService.deleteUser(identifier, req.user);
  }

  @Patch(':identifier/role')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user role (admin only)' })
  @ApiParam({
    name: 'identifier',
    type: 'string',
    description: 'User UUID or username',
  })
  @ApiResponse({
    status: 200,
    description: 'User role changed',
    type: UserDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Cannot change guest account role',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
  })
  async changeUserRole(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
    @Body() dto: ChangeUserRoleDto,
  ): Promise<UserDto> {
    if (!req.user || !canChangeUserRole(req.user)) {
      throw new ForbiddenException('Admin access required');
    }

    const user = await this.usersService.changeUserRole(identifier, dto);
    return this.usersService.toUserDto(user, req.user);
  }
}
