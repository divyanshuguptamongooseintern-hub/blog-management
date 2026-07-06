import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma';
import { Blog } from '../generated/prisma/client';

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    title: string;
    content: string;
    published?: boolean;
    authorId: number;
  }): Promise<Blog> {
    return await this.prisma.blog.create({
      data: {
        title: data.title,
        content: data.content,
        published: data.published !== undefined ? data.published : true,
        authorId: data.authorId,
      },
    });
  }

  async findById(id: number): Promise<Blog> {
    const blog = await this.prisma.blog.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            firstname: true,
            lastname: true,
            username: true,
            email: true,
          },
        },
      },
    });
    if (!blog) {
      throw new NotFoundException(`Blog with ID ${id} not found`);
    }
    return blog;
  }

  async findAll(query: { skip?: number; take?: number }): Promise<{ count: number; data: Blog[] }> {
    const skip = query.skip !== undefined ? Number(query.skip) : 0;
    const take = query.take !== undefined ? Number(query.take) : 10;
    const [count, data] = await Promise.all([
      this.prisma.blog.count(),
      this.prisma.blog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              firstname: true,
              lastname: true,
              username: true,
              email: true,
            },
          },
        },
      }),
    ]);
    return { count, data };
  }

  async update(id: number, data: { title?: string; content?: string; published?: boolean }): Promise<Blog> {
    await this.findById(id);
    return await this.prisma.blog.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.findById(id);
    await this.prisma.blog.delete({
      where: { id },
    });
  }
}
