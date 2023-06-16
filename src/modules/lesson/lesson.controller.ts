import { Authorize, Controller } from "@common";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { CreateLessonDto } from "./dto/create-lesson.dto";
import { FindLessonsQueryDto } from "./dto/find-lessons-query.dto";
import { UpdateLessonDto } from "./dto/update-lesson.dto";
import { LessonService } from "./lesson.service";
import { ApiBearerAuth } from "@nestjs/swagger";

@Controller()
@ApiBearerAuth()
export class LessonController {
  constructor(private readonly lessonService: LessonService) {}

  @Authorize({ action: "create", resource: "lessons" })
  @Post("lessons")
  create(@Body() createLessonDto: CreateLessonDto) {
    return this.lessonService.create(createLessonDto);
  }

  @Authorize({ action: "list", resource: "lessons" })
  @Get("lessons")
  findAll(@Query() query: FindLessonsQueryDto) {
    return this.lessonService.findAll(query);
  }

  @Authorize({ action: "list", resource: "lessons" })
  @Get("units/:unitId/lessons")
  findAllByUnit(@Query() query: FindLessonsQueryDto, @Param("unitId") unitId: number) {
    return this.lessonService.findAll(query, unitId);
  }

  @Authorize({ action: "read", resource: "lessons" })
  @Get("lessons/:id")
  findOne(@Param("id") id: number) {
    return this.lessonService.findOne(id);
  }

  @Authorize({ action: "update", resource: "lessons" })
  @Patch("lessons/:id")
  update(@Param("id") id: number, @Body() updateLessonDto: UpdateLessonDto) {
    return this.lessonService.update(id, updateLessonDto);
  }

  @Authorize({ action: "delete", resource: "lessons" })
  @Delete("lessons/:id")
  remove(@Param("id") id: number, @Query("hardDelete") hardDelete: boolean) {
    return this.lessonService.remove(id, hardDelete);
  }

  @Authorize({ action: "read", resource: "lessons" })
  @Get("final-challenges/:id/unlock")
  unlockFinalChallenge(@Param("id") id: number) {
    return this.lessonService.unlockFinalChallenge(id);
  }
}
