import { Authorize, Controller } from "@common";
import { Body, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { BuddyService } from "./buddy.service";
import { CreateBuddyDto } from "./dto/create-buddy.dto";
import { FindBuddiesQueryDto } from "./dto/find-buddies-query.dto";
import { UpdateBuddyDto } from "./dto/update-buddy.dto";

@Controller("buddies")
export class BuddyController {
  constructor(private readonly buddyService: BuddyService) {}

  @Authorize({ action: "create", resource: "buddies" })
  @Post()
  async create(@Body() createBuddyDto: CreateBuddyDto) {
    return this.buddyService.create(createBuddyDto);
  }

  @Authorize({ action: "list", resource: "buddies" })
  @Get()
  findAll(@Query() query: FindBuddiesQueryDto) {
    return this.buddyService.findAll(query);
  }

  @Authorize({ action: "read", resource: "buddies" })
  @Get(":id")
  findOne(@Param("id") id: number) {
    return this.buddyService.findOne(id);
  }

  @Authorize({ action: "update", resource: "buddies" })
  @Patch(":id")
  update(@Param("id") id: number, @Body() updateBuddyDto: UpdateBuddyDto) {
    return this.buddyService.update(id, updateBuddyDto);
  }

  @Authorize({ action: "delete", resource: "buddies" })
  @Delete(":id")
  remove(@Param("id") id: number, @Query("hardDelete") hardDelete: boolean) {
    return this.buddyService.remove(id, hardDelete);
  }
}
