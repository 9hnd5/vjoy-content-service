import { Body, Param, Post } from "@nestjs/common";
import { CreateKidLessonDto } from "./dto/create-kid-lesson.dto";
import { KidLessonService } from "./kid-lesson.service";
import { ApiBearerAuth } from "@nestjs/swagger";
import { Authorize, Controller } from "@common";
import { StartKidLessonDto } from "./dto/start-kid-lesson.dto";

@ApiBearerAuth()
@Controller()
export class KidLessonController {
  constructor(private kidLessonService: KidLessonService) {}

  @Authorize({ resource: "kid-lesson", action: "create" })
  @Post("kid-lessons/:kidId")
  async createKidLesson(@Param("kidId") kidId: number, @Body() data: CreateKidLessonDto) {
    return this.kidLessonService.create(kidId, data);
  }

  @Authorize({ resource: "kid-lesson", action: "read" })
  @Post("kid-lessons/:kidId/start")
  async startKidLesson(@Param("kidId") kidId: number, @Body() data: StartKidLessonDto) {
    return this.kidLessonService.start(kidId, data);
  }
}
