import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import {
  AccessGuard,
  AuthenticatedRequest,
  BaseController,
  JwtAuthGuard,
  Role,
  Roles,
  RolesGuard,
  UserType,
} from '@Common';
import { BlogService } from './blog.service';
import { CreateBlogRequestDto, UpdateBlogRequestDto } from './dto';

@ApiTags('Blog')
@Controller('blogs')
export class BlogController extends BaseController {
  constructor(private readonly blogService: BlogService) {
    super();
  }

  /**
   * Endpoint to create a new blog post.
   * Allowed roles: Platform Admin, User with Author role.
   * Rules: 
   * - If logged in as User (Author), the authorId is automatically assigned from the user session.
   * - If logged in as Admin, they must specify the authorId in the body (as Admins do not own blogs directly).
   */
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Author)
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateBlogRequestDto,
  ) {
    let authorId: number;

    if (req.user.type === UserType.Admin) {
      if (!data.authorId) {
        throw new BadRequestException('Admin must specify an authorId in the request body');
      }
      authorId = data.authorId;
    } else {
      authorId = req.user.id;
    }

    return await this.blogService.create({
      title: data.title,
      content: data.content,
      published: data.published,
      authorId,
    });
  }

  /**
   * Public endpoint to fetch all blogs with pagination support.
   */
  @Get()
  async findAll(@Query('skip') skip?: number, @Query('take') take?: number) {
    return await this.blogService.findAll({ skip, take });
  }

  /**
   * Public endpoint to get a single blog post by its database ID.
   */
  @Get(':id')
  async findById(@Param('id', ParseIntPipe) id: number) {
    return await this.blogService.findById(id);
  }

  /**
   * Endpoint to update an existing blog post.
   * Allowed roles: Platform Admin, User with Author role.
   * Rules:
   * - Platform Admins can update any blog post.
   * - Authors can only update blog posts where they are the owner (blog.authorId === user.id).
   */
  @ApiBearerAuth()
  @Roles(Role.Admin, Role.Author)
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateBlogRequestDto,
  ) {
    const blog = await this.blogService.findById(id);

    // Verify ownership: Admin bypasses, Authors checked strictly.
    if (req.user.type !== UserType.Admin && blog.authorId !== req.user.id) {
      throw new ForbiddenException('You are not authorized to update this blog post');
    }

    return await this.blogService.update(id, data);
  }

  /**
   * Endpoint to delete a blog post.
   * Allowed roles: Platform Admin only.
   */
  @ApiBearerAuth()
  @Roles(Role.Admin)
  @UseGuards(JwtAuthGuard, AccessGuard, RolesGuard)
  @Delete(':id')
  async delete(@Param('id', ParseIntPipe) id: number) {
    await this.blogService.delete(id);
    return { status: 'success', message: `Blog post ${id} deleted successfully` };
  }
}
