import { Optional } from "sequelize";
import {
  BelongsTo,
  Column,
  CreatedAt,
  DataType,
  Default,
  ForeignKey,
  HasMany,
  Model,
  Table,
  UpdatedAt,
} from "sequelize-typescript";
import { Unit } from "./unit.entity";
import { KidLesson } from "./kid-lesson.entity";

export const LESSON_STATUS = {
  SAVED: 0,
  APPROVED: 1,
  PUBLISHED: 2,
  HIDDEN: 3,
};

export const LESSON_DIFFICULTY = {
  EASY: 0,
  NORMAL: 1,
  HARD: 2,
  VERY_HARD: 3,
};

export const GAME_TYPE = {
  WORD_BALLOON: "WORD_BALLOON",
  TRIVIA: "TRIVIA",
  DIY: "DIY",
  BUST_A_WORD: "BUST_A_WORD",
  DROPPY_BIRD: "DROPPY_BIRD",
  WORD_SHARK: "WORD_SHARK"
};

export type LessonAttributes = {
  id: string;
  name?: string;
  status: number;
  unitId: string;
  difficulty: number;
  rules?: any;
  asset: any;
  curriculum: any;
  gameType: string;
  createdAt: Date;
  updatedAt: Date;
};

type LessonCreationAttributes = Optional<LessonAttributes, "id" | "status" | "createdAt" | "updatedAt">;

@Table({ tableName: "lessons", schema: "content" })
export class Lesson extends Model<LessonAttributes, LessonCreationAttributes> {
  id: string;

  @Column(DataType.STRING(255))
  name?: string;

  @Default(LESSON_STATUS.SAVED)
  @Column({ type: DataType.INTEGER, allowNull: false })
  status: number;

  @ForeignKey(() => Unit)
  @Column({ type: DataType.INTEGER, allowNull: false })
  unitId: string;

  @BelongsTo(() => Unit)
  unit: Unit;

  @Column(DataType.JSONB)
  rules?: any;

  @Column(DataType.JSONB)
  asset: any;

  @Column({ type: DataType.STRING(255), allowNull: false })
  gameType: string;

  @Column({ type: DataType.INTEGER, allowNull: false })
  difficulty: number;

  @Column(DataType.JSONB)
  curriculum: any;

  @CreatedAt
  createdAt: Date;

  @UpdatedAt
  updatedAt: Date;

  @HasMany(() => KidLesson, { foreignKey: "lessonId", sourceKey: "id" })
  kidLessonProgress: KidLesson[];
}
