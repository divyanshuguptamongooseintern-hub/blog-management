import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma';
import { BlogController } from './blog.controller';
import { BlogService } from './blog.service';

@Module({
  imports: [PrismaModule],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [BlogService],
})
export class BlogModule {}
