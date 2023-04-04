import { Type } from "class-transformer";
import {
  IsArray,
  IsIn,
  IsInt,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  Matches,
  ValidateIf,
  ValidateNested
} from "class-validator";

import { GAME_TYPE, LESSON_DIFFICULTY, LESSON_STATUS } from "entities/lesson.entity";

class CurriculumDataDto {
  @IsString()
  word: string;

  @IsInt()
  difficulty: number;

  @IsInt()
  missingLetterCount: number;
}

class CurriculumDto {
  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CurriculumDataDto)
  data: CurriculumDataDto[];
}

export class CreateLessonDto {
  @Length(1, 255)
  name: string;

  @IsOptional()
  @IsIn(Object.values(LESSON_STATUS))
  status?: number = LESSON_STATUS.SAVED;

  @IsNotEmpty()
  @IsInt()
  unitId: number;

  @IsOptional()
  @IsJSON()
  rules?: any;

  @IsNotEmpty()
  @IsIn(Object.values(GAME_TYPE))
  gameType: string;

  @IsNotEmpty()
  @ValidateIf((o) => o.gameType == GAME_TYPE.WORD_BALLOON)
  @ValidateNested()
  @Type(() => WordBalloonAssetDto)
  asset: any;

  @IsIn(Object.values(LESSON_DIFFICULTY))
  difficulty: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CurriculumDto)
  curriculum: CurriculumDto;
}

class WordBalloonAssetDto {
  @IsUrl()
  bundleUrl: string;

  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  bg: string;

  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  cannon: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BalloonDto)
  balloons: BalloonDto[];

  @IsInt()
  behavior: number;
}

class BalloonDto {
  @Matches(/^(?:(?!\.png$).)*$/i, { message: 'String must not end with ".png"' })
  name: string;

  @IsIn(["W", "E"])
  type: string;

  @IsString()
  position: string;
}
