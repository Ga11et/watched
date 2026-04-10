import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Request,
  ForbiddenException,
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
import { AdminUpdateUserDto, ChangeUserRoleDto } from './dto/update-user.dto';
import { UserRole } from './entities/user.entity';

interface AuthRequest {
  user?: {
    id: string;
    role: UserRole;
  };
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
    description: 'User not found',
  })
  async getUser(@Param('identifier') identifier: string): Promise<UserDto> {
    const user = await this.usersService.getUserByIdentifierOrFail(identifier);
    return this.usersService['toUserDto'](user);
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
    description: 'Search by name, username, or email',
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
    @Query('isActive', new ParseBoolPipe({ optional: true }))
    isActive?: boolean,
  ): Promise<UserDto[]> {
    if (!req.user) {
      throw new ForbiddenException('Unauthorized');
    }

    const userRole = req.user.role;
    const users = await this.usersService.getAllUsers(userRole, {
      search,
      role,
      isActive,
    });

    return users.map((user) => this.usersService['toUserDto'](user));
  }

  @Patch(':identifier')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user (admin only)' })
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
    description: 'Forbidden',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 422,
    description: 'Unprocessable entity',
  })
  async updateUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
    @Body() dto: AdminUpdateUserDto,
  ): Promise<UserDto> {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return this.usersService.adminUpdateUser(identifier, dto);
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
  async deactivateUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<UserDto> {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return this.usersService.deactivateUser(identifier, req.user.id);
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
    description: 'Cannot delete self',
  })
  async deleteUser(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
  ): Promise<void> {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    await this.usersService.adminDeleteUser(identifier, req.user.id);
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
    status: 400,
    description: 'Invalid role',
  })
  async changeUserRole(
    @Request() req: AuthRequest,
    @Param('identifier') identifier: string,
    @Body() dto: ChangeUserRoleDto,
  ): Promise<UserDto> {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Admin access required');
    }

    return this.usersService.adminChangeUserRole(identifier, dto);
  }
}
